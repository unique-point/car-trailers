import {createRemoteJWKSet,jwtVerify} from 'jose';
import type {Env} from './env';
import {HttpError} from './http';
export type Role='viewer'|'sales'|'manager';
const keys=new Map<string,ReturnType<typeof createRemoteJWKSet>>();
export async function staff(request:Request,env:Env,minimum:Role='viewer'){
 if(!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD)throw new HttpError(503,'Staff access has not been connected.');
 if(!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN))throw new HttpError(503,'Staff access configuration is invalid.');
 const token=request.headers.get('Cf-Access-Jwt-Assertion');if(!token)throw new HttpError(401,'Please sign in through the staff access portal.');
 const issuer=`https://${env.ACCESS_TEAM_DOMAIN}`;
 if(!keys.has(issuer))keys.set(issuer,createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`)));
 let email:string;
 try{const {payload}=await jwtVerify(token,keys.get(issuer)!,{issuer,audience:env.ACCESS_AUD,algorithms:['RS256']});email=String(payload.email||'').toLowerCase();}catch{throw new HttpError(401,'Your staff session could not be verified.');}
 let roles:Record<string,Role>={};try{roles=JSON.parse(env.ADMIN_ROLES_JSON||'{}')}catch{throw new HttpError(503,'Staff roles are not configured.');}
 const role=roles[email];if(!role||(['viewer','sales','manager'].indexOf(role)<['viewer','sales','manager'].indexOf(minimum)))throw new HttpError(403,'Your staff role does not allow this action.');
 return {email,role};
}
