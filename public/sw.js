/* Study Park — Service Worker（PWA・更新反映用） */
const SW_VERSION = "7";

const NO_STORE_PREFIXES = [
  "/tsuki/",
  "/kuku/",
  "/kencho/",
  "/shokubutsu/",
  "/yukichiiki/",
  "/shared/",
];
const NO_STORE_FILES = ["/sw.js", "/pwa-update.js", "/study-park-asset-version.js"];

function shouldBypassCache(url) {
  const path = url.pathname;
  if (path.endsWith(".html") || path.endsWith(".js") || path.endsWith(".css")) {
    return true;
  }
  if (NO_STORE_FILES.some((p) => path === p || path.endsWith(p))) return true;
  return NO_STORE_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function networkOnly(request) {
  return fetch(request, { cache: "no-store" });
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.caches?.keys) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.postMessage({ type: "SW_ACTIVATED", version: SW_VERSION });
      }
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate" || shouldBypassCache(url)) {
    event.respondWith(
      networkOnly(event.request).catch(() => fetch(event.request)),
    );
  }
});
