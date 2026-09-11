import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import type {Env} from '../src/lib/env';
import type {Commercial} from '../src/lib/pricing';
export const sample:Commercial={id:'car-transporter',name:'TEST ONLY trailer',revision:1,enabled:true,priceCents:1000000,taxIncluded:true,stock:2,leadTime:'TEST ONLY lead time',deposit:{type:'percent',basisPoints:2000},options:[{id:'rack',name:'TEST rack',priceCents:10000,excludes:['cover']},{id:'cover',name:'TEST cover',priceCents:20000,excludes:['rack']}],collection:{id:'test-depot',name:'TEST ONLY depot',feeCents:5000},specifications:{test:'Fixture only'},approvedBy:'automated test'};
export function database(){
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../migrations/0001_commerce.sql',import.meta.url),'utf8'));
 class Statement{constructor(readonly sql:string,readonly args:any[]=[]){ }bind(...args:any[]){return new Statement(this.sql,args)}async first<T>():Promise<T|null>{return sqlite.prepare(this.sql).get(...this.args) as T||null}async all<T>(){return {results:sqlite.prepare(this.sql).all(...this.args) as T[]}}runSync(){const result=sqlite.prepare(this.sql).run(...this.args);return{success:true,meta:{changes:Number(result.changes)}}}async run(){return this.runSync()}}
 const db={prepare:(sql:string)=>new Statement(sql),async batch(statements:Statement[]){sqlite.exec('BEGIN');try{const result=statements.map(s=>s.runSync());sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}}};
 return {db:db as unknown as Env['DB'],sqlite,close:()=>sqlite.close()};
}
export async function seed(db:Env['DB'],p:Commercial=sample){await db.prepare('INSERT INTO catalogue VALUES (?,?,?,?)').bind(p.id,p.revision,JSON.stringify(p),0).run();await db.prepare('INSERT INTO inventory VALUES (?,?)').bind(p.id,p.stock).run();}
export function environment(db:Env['DB']):Env{return {DB:db,ASSETS:{} as Env['ASSETS'],APP_ENV:'preview',APP_ORIGIN:'https://preview.example.test',COMMERCE_ENABLED:'true',ENQUIRIES_ENABLED:'true',NOTIFICATIONS_ENABLED:'false',INDEXING_ENABLED:'false',STRIPE_SECRET_KEY:'sk_test_local_fixture_only',STRIPE_WEBHOOK_SECRET:'whsec_local_fixture_only'}}
export function request(path:string,data:unknown){return new Request(`https://preview.example.test${path}`,{method:'POST',headers:{Origin:'https://preview.example.test','Content-Type':'application/json'},body:JSON.stringify(data)})}
