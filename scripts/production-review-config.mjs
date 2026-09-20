import {writeFileSync} from 'node:fs';

const config={
 $schema:'node_modules/wrangler/config-schema.json',
 name:'car-trailers-australia-preview',
 main:'dist/server/entry.mjs',
 compatibility_date:'2026-09-01',
 compatibility_flags:['nodejs_compat'],
 no_bundle:true,
 rules:[{type:'ESModule',globs:['**/*.js','**/*.mjs']}],
 workers_dev:true,
 assets:{binding:'ASSETS',directory:'./dist/client'},
 d1_databases:[{binding:'DB',database_name:'car-trailers-preview',database_id:'25b255d2-43ce-4570-abb0-0b67e349f6c3',migrations_dir:'migrations'}],
 kv_namespaces:[{binding:'SESSION',id:'ec7b82dcd1b1481da6f287c8b6b85c3a'}],
 routes:[
  {pattern:'www.car-trailers.com.au/*',zone_name:'car-trailers.com.au'},
  {pattern:'car-trailers.com.au/*',zone_name:'car-trailers.com.au'}
 ],
 vars:{
  APP_ENV:'preview',
  APP_ORIGIN:'https://www.car-trailers.com.au',
  COMMERCE_ENABLED:'false',
  ENQUIRIES_ENABLED:'false',
  NOTIFICATIONS_ENABLED:'false',
  INDEXING_ENABLED:'false'
 },
 triggers:{crons:['*/10 * * * *']},
 observability:{enabled:true,head_sampling_rate:0.1}
};

writeFileSync('wrangler.release.json',JSON.stringify(config,null,2)+'\n');
console.log('Prepared exact-hostname review routes for car-trailers.com.au.');
