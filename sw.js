// Bump this string whenever shipped application files change.
const CACHE='billbanao-1.0.0';
const ROOT=new URL('./',self.location.href).href;
const CACHE_NAME=CACHE+':'+new URL(ROOT).pathname;
const FILES=['./','./index.html','./privacy.html','./terms.html','./help.html','./contact.html','./delete-data.html','./about.html','./manifest.webmanifest','./assets/styles.css','./assets/app.mjs','./assets/core.mjs','./assets/store.mjs','./assets/pdf.mjs','./assets/icons.mjs','./assets/i18n.mjs','./assets/config.js','./assets/legal.mjs','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png'];
const URLS=new Set(FILES.map(f=>new URL(f,ROOT).href));
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll([...URLS])));});
// New versions wait for existing tabs to close; an unsaved form is never reloaded.
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('billbanao-')&&key.endsWith(':'+new URL(ROOT).pathname)&&key!==CACHE_NAME)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);url.search='';url.hash='';
 if(event.request.method!=='GET'||!URLS.has(url.href))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE_NAME),cached=await cache.match(url.href);if(cached)return cached;return fetch(event.request);})());
});
