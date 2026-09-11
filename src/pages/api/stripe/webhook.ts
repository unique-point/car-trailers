import type {APIRoute} from 'astro';
import {env} from 'cloudflare:workers';
import type {Env} from '../../../lib/env';
import {receiveWebhook} from '../../../lib/commerce';
import {failure} from '../../../lib/http';
export const POST:APIRoute=async({request})=>{try{return await receiveWebhook(request,env as unknown as Env)}catch(e){return failure(e)}};
