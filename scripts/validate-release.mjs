import {readFile} from 'node:fs/promises';
const config=JSON.parse(await readFile('wrangler.jsonc','utf8'));
const errors=[];
if(config.d1_databases.some(d=>!d.database_id||/^0{8}-/.test(d.database_id)))errors.push('Set the actual D1 database identifier for this environment.');
if(!config.vars.APP_ORIGIN.startsWith('https://'))errors.push('Set the HTTPS preview or production origin.');
if(config.vars.APP_ENV==='production'&&config.vars.APP_ORIGIN!=='https://www.car-trailers.com.au')errors.push('Use the confirmed production origin.');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log('Deployment identifiers are configured. Runtime secrets and business launch approval still require verification.');
