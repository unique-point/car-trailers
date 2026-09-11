import {z} from 'zod';
import {findProduct} from '../data/catalogue';
import {body,HttpError,json,rateLimit,sameOrigin} from './http';
import type {Env} from './env';
export const quoteSchema=z.object({name:z.string().trim().min(2).max(100),email:z.email().max(254),phone:z.string().max(30).default(''),postcode:z.string().regex(/^\d{4}$/),productId:z.string().max(80),kind:z.enum(['personal','business','fleet']),fulfilment:z.enum(['discuss','collection','delivery']),message:z.string().trim().min(10).max(4000),company:z.string().max(120).default(''),consent:z.literal(true),website:z.string().max(0).optional(),turnstileToken:z.string().optional(),items:z.array(z.object({productId:z.string(),quantity:z.number().int().min(1).max(10),requirements:z.string().max(2000),fulfilment:z.string().max(30),options:z.array(z.string()).max(30)})).max(20).default([])});
export async function submitQuote(request:Request,env:Env){
 sameOrigin(request,env);if(env.ENQUIRIES_ENABLED!=='true')throw new HttpError(503,'Online enquiries are being connected. Your selection is still saved in this browser; please try again later.');
 await rateLimit(request,env,'quotes',5);const input=quoteSchema.parse(await body(request));
 if(input.productId!=='custom'&&!findProduct(input.productId)||input.items.some(i=>!findProduct(i.productId)))throw new HttpError(400,'Please select a trailer from the current range.');
 if(env.APP_ENV==='production'){
  if(!env.TURNSTILE_SECRET_KEY||!input.turnstileToken)throw new HttpError(400,'Please complete the verification before sending.');
  const res=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:input.turnstileToken})});const verified=await res.json() as {success:boolean;hostname:string;action:string};
  if(!verified.success||verified.hostname!==new URL(env.APP_ORIGIN).hostname||verified.action!=='quote')throw new HttpError(400,'Verification failed. Please try again.');
 }
 const id=`CTA-Q-${crypto.randomUUID().slice(0,8).toUpperCase()}`;const now=Math.floor(Date.now()/1000);const {turnstileToken,website,...record}=input;
 await env.DB.batch([env.DB.prepare('INSERT INTO quotes(id,body,created_at) VALUES (?,?,?)').bind(id,JSON.stringify(record),now),env.DB.prepare('INSERT INTO outbox(id,kind,target,body,created_at) VALUES (?,?,?,?,?)').bind(`${id}:received`,'quote',id,JSON.stringify({reference:id,email:input.email}),now)]);
 return json({reference:id},201);
}
