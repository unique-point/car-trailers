import {readFile,writeFile} from 'node:fs/promises';
const raw=process.env.CTA_DEPLOY_CONFIG;if(!raw)throw new Error('CLOUDFLARE_CONFIG_JSON is not configured for this GitHub environment.');
const supplied=JSON.parse(raw),base=JSON.parse(await readFile('wrangler.jsonc','utf8'));
for(const key of Object.keys(supplied))if(!['name','vars','d1_databases','routes','workers_dev','kv_namespaces'].includes(key))throw new Error(`Unexpected environment setting: ${key}`);
await writeFile('wrangler.jsonc',JSON.stringify({...base,...supplied,vars:{...base.vars,...supplied.vars}},null,2)+'\n');
