// The build script injects only public app assets, never family observations.
const PRECACHE_URLS = /* MIXOR_PRECACHE */ [];
const CACHE_NAME = /* MIXOR_CACHE */ "mixor-public-v2";
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)));
  // An update waits for old tabs to close; never reload an unsaved field form.
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith("mixor-") && key !== CACHE_NAME) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || request.headers.has("authorization") || url.origin !== self.location.origin || url.search) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => (await caches.match("/index.html")) || new Response("Mixor is not available offline yet.", { status: 503 })));
    return;
  }
  if (!PRECACHE_URLS.includes(url.pathname)) return;
  event.respondWith(caches.match(url.pathname).then(cached => cached || fetch(request)));
});
