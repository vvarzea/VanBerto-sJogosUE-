const CACHE='vanberto-ue-v8';
// Essenciais da própria página (se faltar um, a instalação falha).
const CORE=['./','index.html','manifest.webmanifest','favicon.png','apple-touch-icon.png','icon-128.png','icon-192.png','icon-256.png','icon-512.png','icon-maskable-192.png','icon-maskable-512.png'];
// Recursos externos do menu (fontes e mapa): guardados em melhor esforço, para o menu abrir também offline.
const FONT_CSS='https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800&display=swap';
const EXTRA=[FONT_CSS,
  'https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js',
  'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js',
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json'];
const EXTRA_HOSTS=['fonts.googleapis.com','fonts.gstatic.com','cdn.jsdelivr.net'];

self.addEventListener('install',e=>{e.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  await c.addAll(CORE);
  // Se falhar (sem rede), a instalação continua; ficam guardados na primeira visita com internet.
  await Promise.all(EXTRA.map(u=>c.add(new Request(u,{mode:'cors'})).catch(()=>{})));
  try{
    const css=await (await c.match(FONT_CSS,{ignoreVary:true})).text();
    const urls=[...css.matchAll(/url\((https:[^)]+)\)/g)].map(m=>m[1]);
    await Promise.all(urls.map(u=>c.add(new Request(u,{mode:'cors'})).catch(()=>{})));
  }catch(_){}
  await self.skipWaiting();
})());});

self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));});

// Própria página: stale-while-revalidate (abre logo da cache e atualiza em segundo plano).
// Fontes e mapa externos: cache primeiro, sem voltar a descarregar (são ficheiros grandes e estáveis).
// Os jogos (links) são páginas de fora e precisam de internet.
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  const same=u.origin===location.origin;
  if(!same&&!EXTRA_HOSTS.includes(u.hostname))return;
  e.respondWith(caches.open(CACHE).then(c=>c.match(r,{ignoreSearch:same,ignoreVary:true}).then(hit=>{
    if(hit&&!same)return hit;
    const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res;}).catch(()=>hit||Response.error());
    return hit||net;
  })));
});
