// The build script injects only public app assets, never family observations.
const PRECACHE_URLS = ["/mixor/index.html","/mixor/manifest.webmanifest","/mixor/favicon.svg","/mixor/icon-192.png","/mixor/icon-512.png","/mixor/assets/art/search-wetland-v1.webp","/mixor/assets/index-BoK4Ki7U.js","/mixor/assets/index-mgJiVV7I.css","/mixor/assets/literata-cyrillic-ext-wght-italic-DrMGjC4f.woff2","/mixor/assets/literata-cyrillic-ext-wght-normal-CGKlZYBf.woff2","/mixor/assets/literata-cyrillic-wght-italic-C2hF6zFe.woff2","/mixor/assets/literata-cyrillic-wght-normal-DLqwHbi6.woff2","/mixor/assets/literata-greek-ext-wght-italic-f6xT_0ee.woff2","/mixor/assets/literata-greek-ext-wght-normal-e3e57Shi.woff2","/mixor/assets/literata-greek-wght-italic-9BAkQpca.woff2","/mixor/assets/literata-greek-wght-normal-CO1l-giJ.woff2","/mixor/assets/literata-latin-ext-wght-italic-CC1SwlwQ.woff2","/mixor/assets/literata-latin-ext-wght-normal-BnEbWgdZ.woff2","/mixor/assets/literata-latin-wght-italic-Bm_GJfSc.woff2","/mixor/assets/literata-latin-wght-normal-DLxlUchJ.woff2","/mixor/assets/literata-vietnamese-wght-italic-LyOFdRXZ.woff2","/mixor/assets/literata-vietnamese-wght-normal-LcSrhZ7T.woff2","/mixor/assets/nunito-sans-cyrillic-ext-wght-normal-7w74d1lj.woff2","/mixor/assets/nunito-sans-cyrillic-wght-normal-B9hoeQUC.woff2","/mixor/assets/nunito-sans-latin-ext-wght-normal-DMEAsnHD.woff2","/mixor/assets/nunito-sans-latin-wght-normal-BWQ3gi2K.woff2","/mixor/assets/nunito-sans-vietnamese-wght-normal-BhFYcaJr.woff2","/mixor/assets/photos/fuligo-portrait.jpg","/mixor/assets/photos/fuligo-detail.jpg","/mixor/assets/photos/lycogala-portrait.jpg","/mixor/assets/photos/lycogala-detail.jpg","/mixor/assets/photos/stemonitis-portrait.jpg","/mixor/assets/photos/stemonitis-fruit.jpg","/mixor/assets/photos/trichia-portrait.jpg","/mixor/assets/photos/trichia-detail.jpg","/mixor/assets/photos/tubifera-portrait.jpg","/mixor/assets/photos/tubifera-detail.jpg","/mixor/assets/photos/didymium-portrait.jpg","/mixor/assets/photos/didymium-detail.jpg","/mixor/assets/images/physarum-blob.webp","/mixor/assets/images/physarum-petri.webp","/mixor/assets/images/physarum-macro.webp","/mixor/assets/images/physarum-plasmodium.webp","/mixor/assets/images/arcyria-habitat.webp","/mixor/assets/images/arcyria-pink.webp","/mixor/assets/images/arcyria-detail.webp","/mixor/assets/images/arcyria-cluster.webp","/mixor/assets/art/walk-wetland-path-v2.webp","/mixor/assets/art/walk-wetland-branches-v1.webp","/mixor/assets/art/early-physarum-v3.webp","/mixor/assets/art/early-arcyria-v3.webp","/mixor/assets/art/early-fuligo-v3.webp","/mixor/assets/art/early-lycogala-v3.webp","/mixor/assets/art/early-stemonitis-v3.webp","/mixor/assets/art/early-trichia-v3.webp","/mixor/assets/art/early-tubifera-v3.webp","/mixor/assets/art/early-didymium-v3.webp","/mixor/assets/art/forest-world.webp","/mixor/assets/art/life-stages-v2.webp","/mixor/assets/art/arcyria-network.webp","/mixor/assets/art/organisms-v2.webp","/mixor/assets/art/search-forest.webp","/mixor/assets/art/search-stump.webp","/mixor/assets/art/search-leaves.webp","/mixor/assets/art/search-roots.webp","/mixor/assets/art/search-bark.webp","/mixor/assets/art/growth-early.webp","/mixor/assets/art/growth-networks.webp","/mixor/assets/art/growth-forming.webp","/mixor/assets/art/growth-mature.webp","/mixor/assets/audio/music/forest-acoustic-v2-long.mp3","/mixor/assets/audio/ambience/dry-leaves-v2-long.mp3","/mixor/assets/audio/ambience/distant-birds-long.mp3","/mixor/assets/audio/ambience/canopy-rain-v2-loop.mp3","/mixor/assets/audio/sfx/leaf-friction-v3-mix.mp3","/mixor/assets/audio/sfx/uncover-mix.mp3","/mixor/assets/audio/sfx/journal-open.mp3"];
const CACHE_NAME = "mixor-public-9886e1a181fa0ec7";
const BASE = "/mixor/";
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
    event.respondWith(fetch(request).catch(async () => (await caches.match(BASE + "index.html")) || new Response("Mixor is not available offline yet.", { status: 503 })));
    return;
  }
  if (!PRECACHE_URLS.includes(url.pathname)) return;
  event.respondWith(caches.match(url.pathname).then(cached => cached || fetch(request)));
});

