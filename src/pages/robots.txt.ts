import type {APIRoute} from 'astro';
import {env} from 'cloudflare:workers';
import type {Env} from '../lib/env';
export const GET:APIRoute=()=>{const e=env as unknown as Env;return new Response(e.INDEXING_ENABLED==='true'?'User-agent: *\nDisallow: /api/\nDisallow: /admin\nDisallow: /cart\nDisallow: /checkout\nDisallow: /order\nDisallow: /compare\nDisallow: /*?\nSitemap: https://www.car-trailers.com.au/sitemap.xml\n':'User-agent: *\nDisallow: /\n',{headers:{'Content-Type':'text/plain'}})};
