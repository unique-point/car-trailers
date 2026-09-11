import type {Env} from './env';
import {now,type Order} from './commerce';
import {money} from '../data/catalogue';
export async function sendOutbox(env:Env){
 if(env.NOTIFICATIONS_ENABLED!=='true'||!env.RESEND_API_KEY||!env.MAIL_FROM||!env.BUSINESS_NOTIFICATION_EMAIL)return;
 if(env.APP_ENV!=='production'&&!env.TEST_NOTIFICATION_EMAIL)return;
 const {results}=await env.DB.prepare("SELECT * FROM outbox WHERE state='pending' AND attempts<8 AND locked_until<? ORDER BY created_at LIMIT 15").bind(now()).all<{id:string;kind:string;target:string;body:string;attempts:number}>();
 for(const message of results){
  const locked=await env.DB.prepare("UPDATE outbox SET locked_until=?,attempts=attempts+1 WHERE id=? AND state='pending' AND locked_until<? RETURNING id").bind(now()+120,message.id,now()).first();if(!locked)continue;
  try{
   const payload=JSON.parse(message.body);let text=`Your enquiry ${payload.reference} has been received. We will use the details supplied to respond to your trailer enquiry.`;
   if(message.kind==='payment'){
    const order=(await env.DB.prepare('SELECT * FROM orders WHERE id=?').bind(message.target).first<Order>())!;
    const snapshot=JSON.parse(order.snapshot);
    text=`Order ${order.id}\n\nPayment received: ${money(payload.amountCents)}\nOrder total: ${money(order.total_cents)}\nRemaining balance: ${money(Math.max(0,order.total_cents-order.paid_cents))}\n\n`+snapshot.lines.map((l:any)=>`${l.name} × ${l.quantity}\nOptions: ${l.options.map((o:any)=>o.name).join(', ')||'None'}\nCollection: ${l.collection.name}\nLead time: ${l.leadTime||'As agreed in your order'}`).join('\n\n');
   }
   const recipients=env.APP_ENV==='production'?[payload.email,env.BUSINESS_NOTIFICATION_EMAIL]:[env.TEST_NOTIFICATION_EMAIL!];
   // Separate messages keep the customer address private from other recipients.
   for(let i=0;i<recipients.length;i++){
    const result=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`${message.id}:${i}`},body:JSON.stringify({from:env.MAIL_FROM,to:[recipients[i]],subject:`CAR TRAILERS AUSTRALIA | ${payload.reference}`,text})});
    if(!result.ok)throw new Error('mail_delivery_failed');
   }
   await env.DB.prepare("UPDATE outbox SET state='sent',locked_until=0 WHERE id=?").bind(message.id).run();
  }catch{await env.DB.prepare('UPDATE outbox SET locked_until=? WHERE id=?').bind(now()+Math.min(3600,60*2**message.attempts),message.id).run();console.error('notification_retry',{messageId:message.id})}
 }
}
