import type {ExecutionContext,ScheduledController} from '@cloudflare/workers-types';
import {handle} from '@astrojs/cloudflare/handler';
import {reconcile} from './lib/commerce';
import {sendOutbox} from './lib/notifications';
import type {Env} from './lib/env';
export default {
 fetch(request:Request,env:Env,ctx:ExecutionContext){return handle(request,env,ctx)},
 async scheduled(_event:ScheduledController,env:Env,ctx:ExecutionContext){ctx.waitUntil((async()=>{await reconcile(env);await sendOutbox(env)})())}
};
