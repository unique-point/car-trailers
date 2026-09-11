import type {D1Database,Fetcher} from '@cloudflare/workers-types';
export interface Env {
 DB:D1Database; ASSETS:Fetcher;
 APP_ENV:string; APP_ORIGIN:string; COMMERCE_ENABLED:string; ENQUIRIES_ENABLED:string;
 NOTIFICATIONS_ENABLED:string; INDEXING_ENABLED:string;
 STRIPE_SECRET_KEY?:string; STRIPE_WEBHOOK_SECRET?:string;
 ACCESS_TEAM_DOMAIN?:string; ACCESS_AUD?:string; ADMIN_ROLES_JSON?:string;
 TURNSTILE_SITE_KEY?:string; TURNSTILE_SECRET_KEY?:string; RATE_LIMIT_SALT?:string;
 RESEND_API_KEY?:string; MAIL_FROM?:string; BUSINESS_NOTIFICATION_EMAIL?:string; TEST_NOTIFICATION_EMAIL?:string;
}
