import {readFile,readdir,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
const root=fileURLToPath(new URL('../',import.meta.url));
let checks=0;
for(const file of await readdir(root))if(file.endsWith('.html')){
 const html=await readFile(path.join(root,file),'utf8');
 for(const match of html.matchAll(/(?:href|src)="(\.\/[^"]+)"/g)){await access(path.join(root,match[1]));checks++;}
 if(!html.includes('name="viewport"'))throw new Error(`${file}: missing viewport`);
}
const manifest=JSON.parse(await readFile(path.join(root,'manifest.webmanifest'),'utf8'));
for(const i of manifest.icons){await access(path.join(root,i.src));checks++;}
const worker=await readFile(path.join(root,'sw.js'),'utf8');new vm.Script(worker);
const files=worker.match(/const FILES=(\[[^;]+\]);/)[1];
for(const entry of vm.runInNewContext(files)){await access(path.join(root,entry));checks++;}
console.log(`${checks} local asset, manifest, support page and offline-cache checks passed.`);
