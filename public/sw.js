/* Study Park — Service Worker（PWA・更新反映用） */
const SW_VERSION = "4";

const NO_STORE_PATHS = ["/tsuki/", "/kuku/", "/kencho/", "/sw.js", "/pwa-update.js"];

function shouldBypassCache(url) {
  const path = url.pathname;
  if (path.endsWith(".html") || path.endsWith(".js")) return true;
  return NO_STORE_PATHS.some((prefix) => path.startsWith(prefix));
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

  if (shouldBypassCache(url)) {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
    return;
  }

  event.respondWith(fetch(event.request));
});
