const CACHE_NAME = "super-mel-v1";

const PRECACHE_URLS = ["/", "/manifest.json"];

// Install: precache core assets and skip waiting
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches, ping health endpoint, claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => {
        // Fire-and-forget wake-up ping
        fetch("/api/health").catch(() => {});
        return self.clients.claim();
      })
  );
});

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip /api/* requests — let them go straight to network
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigation requests: network-first with cache fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          // Fire-and-forget wake-up ping on navigation
          fetch("/api/health").catch(() => {});
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets (.js, .css, .png, .jpg, .svg, .woff2, .mp3, .ogg):
  // cache-first with network fallback
  const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|mp3|ogg|wav|json)$/i.test(
    url.pathname
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Default: network-first
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
