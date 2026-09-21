import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {buildSync} from 'esbuild';
const scripts=['src/lib/client.ts','src/lib/storefront-client.ts'].map(entry=>buildSync({entryPoints:[entry],bundle:true,format:'iife',write:false,platform:'browser'}).outputFiles[0].text);
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
async function page(path,query='',storage={},commercial=[]){
 const html=readFileSync(`dist/client/${path}/index.html`.replace('//','/'),'utf8');
 const dom=new JSDOM(html,{url:`https://www.car-trailers.com.au/${path}/${query}`.replace('au//','au/'),runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}});w.HTMLElement.prototype.scrollIntoView=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};
 w.fetch=async url=>({ok:true,json:async()=>String(url).includes('public-settings')?{enquiriesEnabled:false,commerceEnabled:false,turnstileSiteKey:null}:{products:commercial}});
 for(const [key,value] of Object.entries(storage))w.localStorage.setItem(key,JSON.stringify(value));
 scripts.forEach(script=>w.eval(script));await tick();await tick();
 return {dom,w,d:w.document,close:()=>w.close()};
}
test('catalogue combines category and query, reports no matches, and clears state',async()=>{
 const p=await page('shop','?category=box-and-cage');try{const {d,w}=p;const visible=()=>[...d.querySelectorAll('#product-catalogue .product-card')].filter(c=>!c.hidden);assert.equal(visible().length,4);
 const search=d.querySelector('#catalogue-search');search.value='compact box';search.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(visible().length,1);assert.equal(visible()[0].dataset.product,'compact-box');
 search.value='no such trailer';search.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(visible().length,0);assert.equal(d.querySelector('#catalogue-empty').hidden,false);
 d.querySelector('#clear-catalogue').click();assert.equal(visible().length,8);assert.equal(w.location.search,'');assert.equal(d.querySelector('#catalogue-empty').hidden,true);
 }finally{p.close()}
});
test('category route preserves its own product scope and unsupported categories remain honest',async()=>{
 const p=await page('product-category/car-trailers');try{assert.equal(p.d.querySelectorAll('#product-catalogue .product-card').length,1);p.d.querySelector('#clear-catalogue').click();assert.equal(p.d.querySelectorAll('#product-catalogue .product-card').length,1)}finally{p.close()}
 const empty=await page('product-category/food-trailers');try{assert.equal(empty.d.querySelectorAll('#product-catalogue .product-card').length,0);assert.match(empty.d.querySelector('#catalogue-empty').textContent,/not yet listed/)}finally{empty.close()}
});
test('keyboard tabs move focus and panel selection together',async()=>{
 const p=await page('');try{const tabs=p.d.querySelectorAll('[aria-label="Featured trailer ranges"] [role=tab]');tabs[0].dispatchEvent(new p.w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(tabs[1].getAttribute('aria-selected'),'true');assert.equal(p.d.activeElement,tabs[1]);assert.equal(p.d.querySelector('#featured-box-and-cage').hidden,false);assert.equal(p.d.querySelector('#featured-all').hidden,true);
 p.d.querySelector('[data-slide-next]').click();assert.equal(p.d.querySelector('[data-slide-to="1"]').getAttribute('aria-pressed'),'true');assert.equal(p.d.querySelectorAll('[data-slide]:not([hidden])').length,1);
 }finally{p.close()}
});
test('gallery and product configuration persist one selection and open the shared cart',async()=>{
 const p=await page('trailers/enclosed-trailer');try{const {d,w}=p;d.querySelector('[data-image-next]').click();assert.match(d.querySelector('.gallery-main img').src,/enclosed-closed/);assert.equal(d.querySelector('#gallery-count').textContent,'02 / 03');
 const form=d.querySelector('#configuration');form.elements.quantity.value='2';form.elements.requirements.value='<img src=x onerror=alert(1)> Custom equipment';form.dispatchEvent(new w.SubmitEvent('submit',{bubbles:true,cancelable:true,submitter:form.querySelector('[value=save]')}));
 const items=JSON.parse(w.localStorage.getItem('cta.selection'));assert.equal(items.length,1);assert.equal(items[0].quantity,2);assert.equal(d.querySelector('#cart-drawer').open,true);assert.equal(d.querySelector('#drawer-items [onerror]'),null);assert.match(d.querySelector('#drawer-items').textContent,/Custom equipment/);
 d.querySelector('#drawer-items button').click();assert.equal(JSON.parse(w.localStorage.getItem('cta.selection')).length,0);assert.match(d.querySelector('#drawer-items').textContent,/Your cart is empty/);assert.equal(d.querySelector('[data-cart-count]').textContent,'0');
 }finally{p.close()}
});
test('cart rejects invalid stored rows and quantity edits stay in sync with the drawer',async()=>{
 const p=await page('cart','',{'cta.selection':[{key:'a',productId:'compact-box',quantity:1,requirements:'',fulfilment:'discuss',options:[]},{key:'b',productId:'not-a-product',quantity:1},{key:'c',productId:'compact-box',quantity:-1}]});try{const {d,w}=p;assert.equal(d.querySelectorAll('#cart-items .cart-item').length,1);const quantity=d.querySelector('#cart-items input');quantity.value='3';quantity.dispatchEvent(new w.Event('change'));assert.equal(d.querySelector('[data-cart-count]').textContent,'3');d.querySelector('[data-open-cart]').click();assert.match(d.querySelector('#drawer-total').textContent,/3 trailer/)}finally{p.close()}
});
test('support enquiry retains intent and cannot submit while the launch gate is closed',async()=>{
 const p=await page('dealer');try{const {d}=p;assert.equal(d.querySelector('#quote-form [name=kind]').value,'business');assert.match(d.querySelector('#quote-form [name=message]').value,/dealer/);assert.equal(d.querySelector('#quote-form button[type=submit]').disabled,true);assert.equal(d.querySelector('#enquiry-availability').hidden,false);assert.match(d.querySelector('#enquiry-availability').textContent,/nothing will be sent/)}finally{p.close()}
});

test('approved pickup choice changes the itemised total and survives saving',async()=>{
 const fixture={id:'compact-box',name:'TEST ONLY trailer',enabled:true,revision:1,priceCents:100000,taxIncluded:true,stock:2,leadTime:'TEST ONLY',deposit:{type:'none'},options:[],collection:{id:'test-a',name:'TEST ONLY A',feeCents:0},collections:[{id:'test-b',name:'TEST ONLY B',feeCents:10000}],specifications:{}};
 const p=await page('trailers/compact-box','',{},[fixture]);try{const {d,w}=p;const form=d.querySelector('#configuration');const pickup=form.elements.collectionId;assert.equal(pickup.options.length,2);pickup.value='test-b';pickup.dispatchEvent(new w.Event('change',{bubbles:true}));assert.match(form.textContent,/1,100.00/);assert.match(form.textContent,/TEST ONLY B/);form.dispatchEvent(new w.SubmitEvent('submit',{bubbles:true,cancelable:true,submitter:form.querySelector('[value=save]')}));const saved=JSON.parse(w.localStorage.getItem('cta.selection'));assert.equal(saved.length,1);assert.equal(saved[0].collectionId,'test-b');assert.equal(saved[0].revision,1)}finally{p.close()}
});
