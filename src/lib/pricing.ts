import {z} from 'zod';
import {HttpError} from './http';
export const commercialSchema=z.object({
 id:z.string().min(1).max(80),revision:z.number().int().positive(),name:z.string().min(1).max(160),
 enabled:z.boolean(),priceCents:z.number().int().min(1).max(100000000),taxIncluded:z.literal(true),
 stock:z.number().int().nonnegative().nullable(),leadTime:z.string().max(200),
 deposit:z.discriminatedUnion('type',[z.object({type:z.literal('none')}),z.object({type:z.literal('percent'),basisPoints:z.number().int().min(1).max(9999)}),z.object({type:z.literal('fixed'),cents:z.number().int().positive()})]),
 options:z.array(z.object({id:z.string().max(60),name:z.string().max(160),priceCents:z.number().int().nonnegative(),excludes:z.array(z.string())})).max(50),
 collection:z.object({id:z.string().min(1),name:z.string().min(1),feeCents:z.number().int().nonnegative()}),
 specifications:z.record(z.string(),z.string()),approvedBy:z.string().min(1),
});
export type Commercial=z.infer<typeof commercialSchema>;
export const lineSchema=z.object({productId:z.string().min(1).max(80),quantity:z.number().int().min(1).max(10),optionIds:z.array(z.string().max(60)).max(30).default([]),revision:z.number().int().positive(),requirements:z.string().max(2000).default('')});
export const checkoutSchema=z.object({requestKey:z.uuid(),email:z.email(),items:z.array(lineSchema).min(1).max(10),paymentMode:z.enum(['full','deposit']),fulfilment:z.literal('collection'),collectionId:z.string().min(1),expectedTotalCents:z.number().int().positive()});
export type CheckoutInput=z.infer<typeof checkoutSchema>;
export function priceOrder(input:CheckoutInput,catalogue:Commercial[]){
 const lines=input.items.map(item=>{
  const product=catalogue.find(p=>p.id===item.productId);if(!product?.enabled)throw new HttpError(409,'This trailer requires a confirmed quote.');
  if(product.revision!==item.revision)throw new HttpError(409,'This configuration has changed. Please review the latest details.');
  if(product.collection.id!==input.collectionId)throw new HttpError(409,'These trailers cannot use the selected collection location.');
  if(product.stock!==null&&product.stock<item.quantity)throw new HttpError(409,'The requested quantity is no longer available.');
  const ids=new Set(item.optionIds);if(ids.size!==item.optionIds.length)throw new HttpError(400,'An option was selected more than once.');
  const options=item.optionIds.map(id=>{const opt=product.options.find(o=>o.id===id);if(!opt)throw new HttpError(400,'An option is no longer available.');if(opt.excludes.some(id=>ids.has(id)))throw new HttpError(400,'These options cannot be combined.');return opt;});
  const totalCents=(product.priceCents+options.reduce((s,o)=>s+o.priceCents,0)+product.collection.feeCents)*item.quantity;
  let dueCents=totalCents;
  if(input.paymentMode==='deposit'){
   if(product.deposit.type==='none')throw new HttpError(409,'Deposit payment is not available for this configuration.');
   dueCents=product.deposit.type==='percent'?Math.round(totalCents*product.deposit.basisPoints/10000):product.deposit.cents*item.quantity;
   if(dueCents<=0||dueCents>=totalCents)throw new HttpError(409,'The approved deposit rule is invalid for this configuration.');
  }
  return {productId:product.id,name:product.name,revision:product.revision,quantity:item.quantity,requirements:item.requirements,basePriceCents:product.priceCents,options,collection:product.collection,totalCents,dueCents,leadTime:product.leadTime,specifications:product.specifications};
 });
 const totalCents=lines.reduce((s,l)=>s+l.totalCents,0),dueCents=lines.reduce((s,l)=>s+l.dueCents,0);
 if(totalCents!==input.expectedTotalCents)throw new HttpError(409,'The total has changed. Please review your configuration.');
 return {currency:'aud' as const,taxIncluded:true,lines,totalCents,dueCents,balanceCents:totalCents-dueCents,paymentMode:input.paymentMode,fulfilment:input.fulfilment};
}
