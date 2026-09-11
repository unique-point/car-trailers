import {readFile,writeFile,appendFile} from 'node:fs/promises';

const worker='car-trailers-australia-preview';
const origin='https://car-trailers-australia-preview.unique-point.workers.dev';
const mode=process.argv[2];
async function api(path,body) {
  const account=process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const token=process.env.CLOUDFLARE_API_TOKEN?.trim();
  if(!token||!/^[a-f0-9]{32}$/i.test(account||''))throw Error('Check the two Cloudflare repository secrets.');
  const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{
    method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:body?JSON.stringify(body):undefined,redirect:'error',signal:AbortSignal.timeout(30000)
  });
  const data=await response.json();
  if(!response.ok||data.success===false)throw Error('Cloudflare '+path.split('?')[0]+' failed: HTTP '+response.status+' codes '+(data.errors||[]).map(e=>e.code).join(','));
  return data.result;
}
async function summary(text){console.log(text);if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,text+'\n');}
if(mode==='prepare') {
  const hostname=await api('/workers/subdomain');
  if(hostname.subdomain!=='unique-point')throw Error('Cloudflare account hostname does not match the verified account.');
  const workers=await api('/workers/scripts');
  if(workers.some(x=>x.id===worker))throw Error('The target Worker already exists. Inspect it before updating an existing deployment.');
  const databases=await api('/d1/database?name=car-trailers-preview&per_page=100');
  let database=databases.find(x=>x.name==='car-trailers-preview');
  if(!database)database=await api('/d1/database',{name:'car-trailers-preview',primary_location_hint:'oc'});
  if(!database.uuid)throw Error('Cloudflare did not return a D1 database ID.');
  let namespace;
  for(let page=1;page<=100;page++) {
    const rows=await api('/storage/kv/namespaces?per_page=100&page='+page);
    namespace=rows.find(x=>x.title==='car-trailers-preview-session');
    if(namespace||rows.length<100)break;
    if(page===100)throw Error('KV discovery exceeded pagination limit.');
  }
  if(!namespace)namespace=await api('/storage/kv/namespaces',{title:'car-trailers-preview-session'});
  if(!namespace.id)throw Error('Cloudflare did not return a KV namespace ID.');
  const config=JSON.parse(await readFile('wrangler.jsonc','utf8'));
  Object.assign(config,{name:worker,workers_dev:true,routes:[],triggers:{crons:[]},
    d1_databases:[{binding:'DB',database_name:'car-trailers-preview',database_id:database.uuid,migrations_dir:'migrations'}],
    kv_namespaces:[{binding:'SESSION',id:namespace.id}],
    vars:{APP_ENV:'preview',APP_ORIGIN:origin,COMMERCE_ENABLED:'false',ENQUIRIES_ENABLED:'false',NOTIFICATIONS_ENABLED:'false',INDEXING_ENABLED:'false'}
  });
  await writeFile('wrangler.jsonc',JSON.stringify(config,null,2)+'\n');
  await summary('Configured dedicated trailer D1 and session storage. No custom domain or DNS records changed.');
} else if(mode==='verify') {
  const checks=[['/',text=>text.includes('CAR TRAILERS AUSTRALIA')&&(text.match(/brand\/car-trailers-australia.png/g)||[]).length===2],
    ['/shop/',text=>text.includes('car-transporter')],
    ['/trailers/car-transporter/',text=>text.includes('Car transporter')||text.includes('Car Transporter')],
    ['/brand/car-trailers-australia.png',null],
    ['/images/headquarters-1536.webp',null],
    ['/api/catalogue',text=>JSON.parse(text).products.length===0],
    ['/robots.txt',text=>/^Disallow: \/\s*$/m.test(text)]];
  for(const [path,check] of checks) {
    let passed=false;
    for(let attempt=0;attempt<5;attempt++) {
      try {
        const res=await fetch(origin+path,{redirect:'error',signal:AbortSignal.timeout(15000)});
        const bytes=await res.arrayBuffer();
        passed=res.ok&&bytes.byteLength>0&&(!check||check(new TextDecoder().decode(bytes)));
      }catch{passed=false;}
      if(passed)break;
      if(attempt<4)await new Promise(resolve=>setTimeout(resolve,3000));
    }
    if(!passed)throw Error('Live verification failed for '+path);
    await summary('PASS '+path);
  }
  await summary('Website deployed and HTTP checks passed: '+origin+'\nBrowsing is available. Payments, enquiries and indexing remain disabled.');
} else if(mode==='status') {
  const state=process.argv[3];
  if(!['pending','success','failure'].includes(state))throw Error('Invalid status');
  const runUrl='https://github.com/'+process.env.GITHUB_REPOSITORY+'/actions/runs/'+process.env.GITHUB_RUN_ID;
  const response=await fetch('https://api.github.com/repos/'+process.env.GITHUB_REPOSITORY+'/statuses/'+process.env.GITHUB_SHA,{
    method:'POST',headers:{Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json','Content-Type':'application/json'},
    body:JSON.stringify({state,context:'cloudflare/storefront',target_url:state==='success'?origin:runUrl,
      description:state==='success'?'Deployed; live HTTP checks passed':state==='pending'?'Cloudflare deployment running':'Deployment requires attention. Open the run logs.'}),
    redirect:'error',signal:AbortSignal.timeout(15000)
  });
  if(!response.ok)throw Error('Could not publish deployment status: HTTP '+response.status);
} else throw Error('Use prepare, verify or status');
