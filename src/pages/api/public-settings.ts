import type {APIRoute} from 'astro';
import {env} from 'cloudflare:workers';
import {json} from '../../lib/http';
export const GET:APIRoute=()=>json({turnstileSiteKey:env.ENQUIRIES_ENABLED==='true'&&env.APP_ENV==='production'?env.TURNSTILE_SITE_KEY||null:null});
