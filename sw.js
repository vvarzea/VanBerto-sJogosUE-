const CACHE='vanberto-ue-v6';
// Essenciais da própria página (se faltar um, a instalação falha).
const CORE=['./','index.html','manifest.webmanifest','favicon.png','apple-touch-icon.png','icon-128.png','icon-192.png','icon-256.png','icon-512.png','icon-maskable-192.png','icon-maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));});
// Stale-while-revalidate: abre logo da cache e atualiza em segundo plano. Só ficheiros da própria página
// (os jogos e o mapa vêm de fora e precisam de internet).
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(caches.open(CACHE).then(c=>c.match(r,{ignoreSearch:true}).then(hit=>{
    const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res;}).catch(()=>hit);
    return hit||net;
  })));
});
