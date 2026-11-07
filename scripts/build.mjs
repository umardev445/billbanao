import {mkdir,copyFile,rm,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),dist=path.join(root,'dist');
await rm(dist,{recursive:true,force:true});await mkdir(path.join(dist,'assets'),{recursive:true});
const files=['index.html','privacy.html','terms.html','help.html','contact.html','delete-data.html','about.html','manifest.webmanifest','sw.js','.nojekyll',...(await readdir(path.join(root,'assets'))).map(f=>`assets/${f}`)];
for(const file of files)await copyFile(path.join(root,file),path.join(dist,file));
console.log(`Built ${files.length} static files. No dependencies required.`);
