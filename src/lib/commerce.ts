import Stripe from 'stripe';
import type {Env} from './env';
import {body,HttpError,json,rateLimit,safeToken,sameOrigin,sha256} from './http';
import {checkoutSchema,commercialSchema,priceOrder} from './pricing';
export const now=()=>Math.floor(Date.now()/1000);
export type Order={id:string;request_key:string;fingerprint:string;token_hash:string;email:string;snapshot:string;total_cents:number;due_cents:number;paid_cents:number;refunded_cents:number;payment_status:string;fulfilment_status:string;reservation_state:string;created_at:number};
export type Checkout={id:string;order_id:string;kind:'initial'|'balance';amount_cents:number;session_id:string|null;payment_intent:string|null;status:string;created_at:number};
export function stripeClient(env:Env){if(!env.STRIPE_SECRET_KEY)throw new HttpError(503,'Secure payments are being connected.');if(env.APP_ENV==='production'&&!env.STRIPE_SECRET_KEY.startsWith('sk_live_'))throw new HttpError(503,'Production payments require the verified live Stripe connection.');if(env.APP_ENV!=='production'&&!env.STRIPE_SECRET_KEY.startsWith('sk_test_'))throw new HttpError(503,'This environment only accepts Stripe test keys.');return new Stripe(env.STRIPE_SECRET_KEY,{httpClient:Stripe.createFetchHttpClient(),maxNetworkRetries:2});}
export async function checkoutSession(request:Request,env:Env){
 sameOrigin(request,env);if(env.COMMERCE_ENABLED!=='true')throw new HttpError(503,'Please confirm your trailer quote before arranging payment.');await rateLimit(request,env,'checkout',10);
 const input=checkoutSchema.parse(await body(request));const fingerprint=await sha256(JSON.stringify(input));let order=await env.DB.prepare('SELECT * FROM orders WHERE request_key=?').bind(input.requestKey).first<Order>();
 const token=safeToken();const tokenHash=await sha256(token);
 if(order){if(order.fingerprint!==fingerprint)throw new HttpError(409,'This checkout request has changed. Please start a new checkout.');if(order.reservation_state!=='held')throw new HttpError(409,'This checkout is closed. Please check your order or start a new checkout.');await env.DB.prepare('UPDATE orders SET token_hash=? WHERE id=?').bind(tokenHash,order.id).run();}
 else{
  const {results}=await env.DB.prepare('SELECT body FROM catalogue').all<{body:string}>();const catalogue=results.map(r=>commercialSchema.parse(JSON.parse(r.body)));const priced=priceOrder(input,catalogue);const id=`CTA-${crypto.randomUUID()}`;
  const statements=[env.DB.prepare('INSERT INTO orders(id,request_key,fingerprint,token_hash,email,snapshot,total_cents,due_cents,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,input.requestKey,fingerprint,tokenHash,input.email,JSON.stringify(priced),priced.totalCents,priced.dueCents,now(),now()),...Array.from(priced.lines.reduce((map,line)=>{const previous=map.get(line.productId);map.set(line.productId,{...line,quantity:line.quantity+(previous?.quantity||0)});return map;},new Map<string,typeof priced.lines[number]>()).values()).map(line=>env.DB.prepare('INSERT INTO order_lines(order_id,product_id,quantity,revision) VALUES (?,?,?,?)').bind(id,line.productId,line.quantity,line.revision)),env.DB.prepare('INSERT INTO checkouts(id,order_id,kind,amount_cents,created_at) VALUES (?,?,?,?,?)').bind(`${id}:initial`,id,'initial',priced.dueCents,now())];
  try{await env.DB.batch(statements)}catch{throw new HttpError(409,'Availability or pricing changed while checking out. Please review your selection.');}
  order=(await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(id).first<Order>())!;
 }
 const checkout=(await env.DB.prepare("SELECT * FROM checkouts WHERE order_id=? AND kind='initial'").bind(order.id).first<Checkout>())!;
 const session=await ensureSession(checkout,order,env);
 return json({url:session.url,reference:order.id},200,{'Set-Cookie':`cta_order=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${env.APP_ORIGIN.startsWith('https:')?'; Secure':''}`});
}
export async function ensureSession(checkout:Checkout,order:Order,env:Env){
 const stripe=stripeClient(env);
 if(checkout.session_id){const current=await stripe.checkout.sessions.retrieve(checkout.session_id);if(current.status!=='open')throw new HttpError(409,'This payment link is closed. Please check the order status.');return current;}
 // Never retry creation past Stripe's idempotency retention window. Reconcile manually instead.
 if(now()-checkout.created_at>23*3600)throw new HttpError(409,'This payment needs a staff review before it can be retried.');
 const session=await stripe.checkout.sessions.create({mode:'payment',payment_method_types:['card'],customer_email:order.email,client_reference_id:order.id,metadata:{orderId:order.id,checkoutId:checkout.id},payment_intent_data:{metadata:{orderId:order.id,checkoutId:checkout.id}},line_items:[{price_data:{currency:'aud',unit_amount:checkout.amount_cents,product_data:{name:`${checkout.kind==='balance'?'Balance':order.due_cents<order.total_cents?'Deposit':'Payment'} for ${order.id}`,description:'Your confirmed trailer configuration. Amount includes applicable GST.'}},quantity:1}],success_url:`${env.APP_ORIGIN}/order/`,cancel_url:`${env.APP_ORIGIN}/payment-cancelled/`,expires_at:checkout.created_at+3600},{idempotencyKey:checkout.id});
 await env.DB.prepare("UPDATE checkouts SET session_id=?,status='open' WHERE id=? AND session_id IS NULL").bind(session.id,checkout.id).run();return session;
}
export async function applySession(env:Env,session:Stripe.Checkout.Session,eventId:string,eventType:string){
 const checkoutId=session.metadata?.checkoutId;if(!checkoutId)return;
 const checkout=await env.DB.prepare('SELECT * FROM checkouts WHERE id=?').bind(checkoutId).first<Checkout>();if(!checkout)throw new Error('checkout_missing');
 const order=await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(checkout.order_id).first<Order>();if(!order)throw new Error('order_missing');
 if(session.metadata?.orderId!==order.id||session.client_reference_id!==order.id||session.currency!=='aud'||session.amount_total!==checkout.amount_cents||(checkout.session_id&&checkout.session_id!==session.id))throw new Error('payment_snapshot_mismatch');
 const paid=session.payment_status==='paid';const expired=session.status==='expired';
 const intent=typeof session.payment_intent==='string'?session.payment_intent:session.payment_intent?.id||null;
 const commands=[env.DB.prepare('INSERT OR IGNORE INTO payment_events(id,type,created_at) VALUES (?,?,?)').bind(eventId,eventType,now()),env.DB.prepare('UPDATE checkouts SET session_id=COALESCE(session_id,?),payment_intent=COALESCE(payment_intent,?) WHERE id=?').bind(session.id,intent,checkout.id)];
 if(paid){
  if(order.reservation_state==='released')throw new Error('paid_after_stock_released_manual_review');
  commands.push(env.DB.prepare("UPDATE checkouts SET status='paid' WHERE id=? AND status!='paid'").bind(checkout.id));
  commands.push(env.DB.prepare("UPDATE orders SET paid_cents=(SELECT COALESCE(SUM(amount_cents),0) FROM checkouts WHERE order_id=? AND status='paid'),reservation_state='captured',updated_at=? WHERE id=?").bind(order.id,now(),order.id));
  commands.push(env.DB.prepare("UPDATE orders SET payment_status=CASE WHEN refunded_cents>=paid_cents AND refunded_cents>0 THEN 'refunded' WHEN refunded_cents>0 THEN 'partially_refunded' WHEN paid_cents>=total_cents THEN 'paid' ELSE 'deposit_received' END WHERE id=?").bind(order.id));
  commands.push(env.DB.prepare("INSERT OR IGNORE INTO outbox(id,kind,target,body,created_at) VALUES (?,'payment',?,?,?)").bind(`${checkout.id}:paid`,order.id,JSON.stringify({reference:order.id,email:order.email,amountCents:checkout.amount_cents,kind:checkout.kind}),now()));
 }else if(expired){
  commands.push(env.DB.prepare("UPDATE checkouts SET status='expired' WHERE id=? AND status!='paid'").bind(checkout.id));
  if(checkout.kind==='initial')commands.push(env.DB.prepare("UPDATE orders SET reservation_state='released',payment_status='expired',updated_at=? WHERE id=? AND reservation_state='held' AND paid_cents=0 AND NOT EXISTS(SELECT 1 FROM checkouts WHERE order_id=? AND status='paid')").bind(now(),order.id,order.id));
 }else{commands.push(env.DB.prepare("UPDATE checkouts SET status=? WHERE id=? AND status NOT IN ('paid','expired')").bind(session.status==='complete'?'processing':'open',checkout.id));}
 await env.DB.batch(commands);
}
export async function receiveWebhook(request:Request,env:Env){
 if(!env.STRIPE_WEBHOOK_SECRET)throw new HttpError(503,'Payment notifications are not configured.');const signature=request.headers.get('stripe-signature');if(!signature)throw new HttpError(400,'Missing signature.');
 const raw=await request.text();if(raw.length>1000000)throw new HttpError(413,'Notification is too large.');const stripe=stripeClient(env);let event:Stripe.Event;
 try{event=await stripe.webhooks.constructEventAsync(raw,signature,env.STRIPE_WEBHOOK_SECRET,300,Stripe.createSubtleCryptoProvider())}catch{throw new HttpError(400,'Invalid notification signature.');}
 if(event.livemode!==(env.APP_ENV==='production'))throw new HttpError(400,'Payment environment does not match.');
 if(['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.async_payment_failed','checkout.session.expired'].includes(event.type)){
  // Retrieve current state so delayed and out-of-order events cannot undo payment.
  const session=await stripe.checkout.sessions.retrieve((event.data.object as Stripe.Checkout.Session).id);await applySession(env,session,event.id,event.type);
 }else if(event.type.startsWith('refund.')){const refund=await stripe.refunds.retrieve((event.data.object as Stripe.Refund).id);await applyRefund(env,refund,event.id);}
 return json({received:true});
}
export async function applyRefund(env:Env,refund:Stripe.Refund,eventId:string){
 const existing=await env.DB.prepare('SELECT * FROM refunds WHERE id=?').bind(refund.id).first<{order_id:string}>();
 if(!existing){const pi=typeof refund.payment_intent==='string'?refund.payment_intent:refund.payment_intent?.id;if(!pi)return;const checkout=await env.DB.prepare('SELECT * FROM checkouts WHERE payment_intent=?').bind(pi).first<Checkout>();if(!checkout)return;await env.DB.prepare('INSERT OR IGNORE INTO refunds(id,order_id,checkout_id,amount_cents,reason,actor,status,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(refund.id,checkout.order_id,checkout.id,refund.amount,refund.reason||'Stripe dashboard','stripe',refund.status||'pending',now()).run();}
 const current=(await env.DB.prepare('SELECT order_id FROM refunds WHERE id=?').bind(refund.id).first<{order_id:string}>())!;
 await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO payment_events(id,type,created_at) VALUES (?,?,?)').bind(eventId,'refund',now()),env.DB.prepare('UPDATE refunds SET status=? WHERE id=?').bind(refund.status||'pending',refund.id),env.DB.prepare("UPDATE orders SET refunded_cents=(SELECT COALESCE(SUM(amount_cents),0) FROM refunds WHERE order_id=? AND status='succeeded'),updated_at=? WHERE id=?").bind(current.order_id,now(),current.order_id),env.DB.prepare("UPDATE orders SET payment_status=CASE WHEN refunded_cents>=paid_cents THEN 'refunded' WHEN refunded_cents>0 THEN 'partially_refunded' ELSE payment_status END WHERE id=?").bind(current.order_id)]);
}
export async function orderForCookie(request:Request,env:Env){const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)cta_order=([a-f0-9]{64})(?:;|$)/)?.[1];if(!token)throw new HttpError(401,'Open this page in the browser you used for checkout, or contact us for help with your order.');const order=await env.DB.prepare('SELECT * FROM orders WHERE token_hash=?').bind(await sha256(token)).first<Order>();if(!order)throw new HttpError(404,'This order session has expired. Please contact us for help.');return order;}
export async function reconcile(env:Env){
 await env.DB.prepare('DELETE FROM rate_limits WHERE expires_at<?').bind(now()).run();
 if(!env.STRIPE_SECRET_KEY)return;
 const stripe=stripeClient(env);const {results}=await env.DB.prepare("SELECT * FROM checkouts WHERE status IN ('creating','open','processing') ORDER BY created_at LIMIT 40").all<Checkout>();
 for(const checkout of results){try{
  if(checkout.session_id){const session=await stripe.checkout.sessions.retrieve(checkout.session_id);await applySession(env,session,`reconcile:${session.id}:${session.payment_status}:${session.status}`,'reconcile');}
  else if(now()-checkout.created_at<1800){const order=(await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(checkout.order_id).first<Order>())!;await ensureSession(checkout,order,env);}
  else{await env.DB.prepare("INSERT OR IGNORE INTO audit_log(id,actor,action,target,detail,created_at) VALUES (?,'system','reconciliation_required',?,'Payment session creation is unresolved. Check Stripe before releasing stock.',?)").bind(`review:${checkout.id}`,checkout.order_id,now()).run();}
 }catch{console.error('reconciliation_failed',{checkoutId:checkout.id})}}
}
