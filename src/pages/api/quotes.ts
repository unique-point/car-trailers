import type {APIRoute} from 'astro';
import {env} from 'cloudflare:workers';
import type {Env} from '../../lib/env';
import {submitQuote} from '../../lib/quotes';
import {failure} from '../../lib/http';
export const POST:APIRoute=async({request})=>{try{return await submitQuote(request,env as unknown as Env)}catch(e){return failure(e)}};
