import type {APIRoute} from 'astro';
import {env} from 'cloudflare:workers';
import type {Env} from '../../lib/env';
import {commercialSchema} from '../../lib/pricing';
import {json,failure} from '../../lib/http';
export const GET:APIRoute=async()=>{try{const e=env as unknown as Env;if(e.COMMERCE_ENABLED!=='true')return json({products:[]});const {results}=await e.DB.prepare('SELECT catalogue.body,inventory.available FROM catalogue JOIN inventory ON inventory.product_id=catalogue.id').all<{body:string;available:number|null}>();return json({products:results.map(r=>commercialSchema.parse({...JSON.parse(r.body),stock:r.available})).filter(p=>p.enabled).map(({approvedBy,...p})=>p)})}catch(error){return failure(error)}};
