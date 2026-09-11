import sharp from 'sharp';
import {readdir,mkdir} from 'node:fs/promises';
await mkdir('public/images',{recursive:true});
for(const name of await readdir('assets/masters')){
 if(!name.endsWith('.png'))continue;
 for(const width of [480,960,1536])await sharp(`assets/masters/${name}`).resize({width,withoutEnlargement:true}).webp({quality:83,effort:6}).toFile(`public/images/${name.slice(0,-4)}-${width}.webp`);
}
console.log('Responsive images prepared from preserved PNG masters.');
