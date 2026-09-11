import type {APIRoute} from 'astro';
import {products} from '../data/catalogue';
export const prerender=true;
export const GET:APIRoute=()=>{const paths=['/','/shop/','/gardening/','/about/','/contact/','/delivery/','/support/','/faq/',...products.map(p=>`/trailers/${p.slug}/`)];return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path=>`<url><loc>https://www.car-trailers.com.au${path}</loc></url>`).join('')}</urlset>`,{headers:{'Content-Type':'application/xml'}})};
