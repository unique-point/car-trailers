import {defineMiddleware} from 'astro:middleware';
import type {Env} from './lib/env';
export const onRequest=defineMiddleware(async(context,next)=>{
 if(context.isPrerendered)return next();
 const {env}=await import('cloudflare:workers');
 const e=env as unknown as Env;
 if(e.APP_ENV==='production'&&context.url.hostname==='car-trailers.com.au')return context.redirect(`https://www.car-trailers.com.au${context.url.pathname}${context.url.search}`,308);
 const response=await next();
 response.headers.set('X-Content-Type-Options','nosniff');response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');response.headers.set('X-Frame-Options','DENY');response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
 if(e.INDEXING_ENABLED!=='true'||context.url.pathname.startsWith('/api/')||['/admin/','/order/','/checkout/','/cart/','/compare/'].includes(context.url.pathname))response.headers.set('X-Robots-Tag','noindex, nofollow');
 if(context.url.pathname.startsWith('/api/')||context.url.pathname.startsWith('/admin'))response.headers.set('Cache-Control','no-store');
 return response;
});
