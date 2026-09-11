import type {APIRoute} from 'astro';
import {env} from 'cloudflare:workers';
import type {Env} from '../../lib/env';
import {orderForCookie} from '../../lib/commerce';
import {failure,json} from '../../lib/http';
import {money} from '../../data/catalogue';
export const GET:APIRoute=async({request})=>{try{const order=await orderForCookie(request,env as unknown as Env);return json({reference:order.id,paymentStatus:order.payment_status,fulfilmentStatus:order.fulfilment_status,paidDisplay:money(order.paid_cents-order.refunded_cents),balanceDisplay:money(Math.max(0,order.total_cents-order.paid_cents)),refundedDisplay:money(order.refunded_cents)})}catch(e){return failure(e)}};
