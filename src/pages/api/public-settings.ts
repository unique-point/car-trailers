import type {APIRoute} from 'astro';
import {env} from 'cloudflare:workers';
import {json} from '../../lib/http';
export const GET:APIRoute=()=>json({enquiriesEnabled:env.ENQUIRIES_ENABLED==='true',commerceEnabled:env.COMMERCE_ENABLED==='true',turnstileSiteKey:env.ENQUIRIES_ENABLED==='true'&&env.APP_ENV==='production'?env.TURNSTILE_SITE_KEY||null:null});
