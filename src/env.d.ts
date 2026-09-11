/// <reference types="astro/client" />
declare module 'cloudflare:workers' {
 export const env: import('./lib/env').Env;
}
