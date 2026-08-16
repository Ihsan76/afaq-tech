const CACHE_NAME = "afaq-tech-v3";
const NAV_TTL_MS = 5 * 60 * 1000;
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
];

function cacheKey(response) {
  const clone = response.clone();
  const headers = new Headers(clone.headers);
  headers.append("x-sw-cached-at", String(Date.now()));
  return new Response(clone.body, {
    status: clone.status,
    statusText: clone.statusText,
    headers,
  });
}

function cachedAt(response) {
  const value = response.headers.get("x-sw-cached-at");
  return value ? parseInt(value, 10) : 0;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Only intercept page navigations. Everything else (images, scripts,
  // fonts, cross-origin requests like YouTube/Supabase, /api/) is passed
  // through untouched so the browser always loads fresh content from the
  // network and the SW cache can never serve stale/broken course images.
  if (event.request.mode !== "navigate") return;

  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        const stale = Date.now() - cachedAt(cachedResponse) > NAV_TTL_MS;
        if (stale) {
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, cacheKey(networkResponse));
                });
              }
            })
            .catch(() => {});
        }
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, cacheKey(networkResponse));
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match("/").then((fallback) => {
            return fallback || new Response("Offline", { status: 503, statusText: "Offline" });
          });
        });
    })
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: event.data ? event.data.text() : "" };
  }

  const title = payload.title || "Afaq Tech";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/favicon.ico",
    badge: "/favicon.ico",
    data: {
      url: payload.url || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
