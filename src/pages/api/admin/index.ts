import type {APIRoute} from 'astro';
import {env} from 'cloudflare:workers';
import {z} from 'zod';
import type {Env} from '../../../lib/env';
import {staff} from '../../../lib/auth';
import {body,failure,HttpError,json,sameOrigin} from '../../../lib/http';
import {commercialSchema} from '../../../lib/pricing';
import {findProduct} from '../../../data/catalogue';
import {applyRefund,ensureSession,now,stripeClient,type Order,type Checkout} from '../../../lib/commerce';
const statusSchema=z.enum(['awaiting_confirmation','confirmed','in_production','ready_for_collection','dispatched','complete','on_hold']);
export const GET:APIRoute=async({request,url})=>{try{
 const e=env as unknown as Env;const identity=await staff(request,e);const collection=url.searchParams.get('collection')||'orders';
 if(collection==='identity')return json(identity);
 const tables:Record<string,string>={orders:'SELECT id,email,total_cents,due_cents,paid_cents,refunded_cents,payment_status,fulfilment_status,snapshot,created_at FROM orders ORDER BY created_at DESC LIMIT 100',quotes:'SELECT * FROM quotes ORDER BY created_at DESC LIMIT 100',catalogue:'SELECT * FROM catalogue ORDER BY id',audit:'SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100',notifications:'SELECT id,kind,target,state,attempts,created_at FROM outbox ORDER BY created_at DESC LIMIT 100'};
 if(!tables[collection])throw new HttpError(400,'Unknown collection.');const {results}=await e.DB.prepare(tables[collection]).all();if(collection==='orders'){for(const row of results){row.payments=(await e.DB.prepare('SELECT id,amount_cents,status FROM checkouts WHERE order_id=?').bind(row.id).all()).results;}}return json({rows:results,identity});
 }catch(error){return failure(error)}};
export const POST:APIRoute=async({request})=>{try{
 const e=env as unknown as Env;sameOrigin(request,e);const input=await body(request,50000);const action=z.enum(['catalogue','order-status','quote-status','balance','refund']).parse(input.action);const identity=await staff(request,e,['catalogue','refund'].includes(action)?'manager':'sales');
 const audit=(target:string,detail:unknown)=>e.DB.prepare('INSERT INTO audit_log(id,actor,action,target,detail,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),identity.email,action,target,JSON.stringify(detail),now());
 if(action==='catalogue'){
  const product=commercialSchema.parse(input.product);if(!findProduct(product.id))throw new HttpError(400,'Add the product content and approved imagery in GitHub first.');
  const old=await e.DB.prepare('SELECT revision,body FROM catalogue WHERE id=?').bind(product.id).first<{revision:number;body:string}>();
  if(product.revision!==(old?.revision||0)+1)throw new HttpError(409,'Reload the latest product revision before saving.');
  await e.DB.batch([e.DB.prepare('INSERT INTO catalogue(id,revision,body,updated_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,body=excluded.body,updated_at=excluded.updated_at').bind(product.id,product.revision,JSON.stringify(product),now()),e.DB.prepare('INSERT INTO inventory(product_id,available) VALUES (?,?) ON CONFLICT(product_id) DO UPDATE SET available=excluded.available').bind(product.id,product.stock),audit(product.id,{before:old?JSON.parse(old.body):null,after:product})]);
  return json({saved:true});
 }
 if(action==='order-status'){
  const id=z.string().max(100).parse(input.id);const status=statusSchema.parse(input.status);const row=await e.DB.prepare('SELECT * FROM orders WHERE id=?').bind(id).first<Order>();if(!row)throw new HttpError(404,'Order not found.');
  if(['ready_for_collection','dispatched','complete'].includes(status)&&row.paid_cents<row.total_cents)throw new HttpError(409,'The balance must be settled before releasing this trailer.');
  await e.DB.batch([e.DB.prepare('UPDATE orders SET fulfilment_status=?,updated_at=? WHERE id=?').bind(status,now(),id),audit(id,{before:row.fulfilment_status,after:status})]);return json({saved:true});
 }
 if(action==='quote-status'){
  const id=z.string().max(100).parse(input.id);const status=z.enum(['new','reviewing','quoted','closed']).parse(input.status);const q=await e.DB.prepare('SELECT status FROM quotes WHERE id=?').bind(id).first<{status:string}>();if(!q)throw new HttpError(404,'Enquiry not found.');
  await e.DB.batch([e.DB.prepare('UPDATE quotes SET status=? WHERE id=?').bind(status,id),audit(id,{before:q.status,after:status})]);return json({saved:true});
 }
 const id=z.string().max(100).parse(input.id);const order=await e.DB.prepare('SELECT * FROM orders WHERE id=?').bind(id).first<Order>();if(!order)throw new HttpError(404,'Order not found.');
 if(action==='balance'){
  if(order.paid_cents<=0||order.paid_cents>=order.total_cents||order.refunded_cents>0)throw new HttpError(409,'This order is not eligible for a balance payment.');
  const checkoutId=`${id}:balance`;await e.DB.prepare("INSERT OR IGNORE INTO checkouts(id,order_id,kind,amount_cents,created_at) VALUES (?,?,'balance',?,?)").bind(checkoutId,id,order.total_cents-order.paid_cents,now()).run();const checkout=(await e.DB.prepare('SELECT * FROM checkouts WHERE id=?').bind(checkoutId).first<Checkout>())!;
  const session=await ensureSession(checkout,order,e);await audit(id,{checkoutId,amountCents:checkout.amount_cents}).run();return json({url:session.url});
 }
 const refundInput=z.object({checkoutId:z.string(),amountCents:z.number().int().positive(),reason:z.string().min(10).max(500),requestKey:z.uuid()}).parse(input);
 const checkout=await e.DB.prepare("SELECT * FROM checkouts WHERE id=? AND order_id=? AND status='paid'").bind(refundInput.checkoutId,id).first<Checkout>();if(!checkout?.payment_intent)throw new HttpError(409,'A settled payment is required.');
 await audit(id,{requestKey:refundInput.requestKey,amountCents:refundInput.amountCents,reason:refundInput.reason,stage:'requested'}).run();
 const stripe=stripeClient(e);const refund=await stripe.refunds.create({payment_intent:checkout.payment_intent,amount:refundInput.amountCents,metadata:{orderId:id,actor:identity.email}},{idempotencyKey:`refund:${refundInput.requestKey}`});
 await applyRefund(e,refund,`staff-refund:${refund.id}`);await audit(id,{refundId:refund.id,amountCents:refundInput.amountCents,reason:refundInput.reason}).run();return json({refundId:refund.id,status:refund.status});
 }catch(error){return failure(error)}};
