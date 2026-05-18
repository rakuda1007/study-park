/**
 * PWA — Service Worker 登録・更新検知・手動更新（全ページ共通）
 */
(function () {
  "use strict";

  const VER_KEY = "studyParkAssetVersion";
  const ASSET_VER = String(window.STUDY_PARK_ASSET_VERSION || "");

  let refreshing = false;
  let registration = null;

  function applyAssetVersionBump() {
    if (!ASSET_VER) return false;
    const prev = localStorage.getItem(VER_KEY);
    if (prev === ASSET_VER) return false;
    localStorage.setItem(VER_KEY, ASSET_VER);
    if (prev !== null) {
      const url = new URL(location.href);
      url.searchParams.set("_av", ASSET_VER);
      location.replace(url.toString());
      return true;
    }
    return false;
  }

  function activateWaitingWorker(reg) {
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((reg) => {
        registration = reg;
        reg.update();
        activateWaitingWorker(reg);

        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (
              installing.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              activateWaitingWorker(reg);
            }
          });
        });
      })
      .catch(() => {
        /* 非対応・オフラインは無視 */
      });
  }

  function checkForUpdates() {
    if (registration) {
      return registration.update().then(() => {
        activateWaitingWorker(registration);
      });
    }
    if ("serviceWorker" in navigator) {
      return navigator.serviceWorker.getRegistration().then((reg) => {
        registration = reg || registration;
        if (!reg) return;
        return reg.update().then(() => activateWaitingWorker(reg));
      });
    }
    return Promise.resolve();
  }

  async function forceRefresh() {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
    if (ASSET_VER) localStorage.setItem(VER_KEY, ASSET_VER);
    const url = new URL(location.href);
    url.searchParams.set("_av", ASSET_VER || Date.now().toString());
    location.replace(url.toString());
  }

  navigator.serviceWorker?.addEventListener("controllerchange", () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  navigator.serviceWorker?.addEventListener("message", (event) => {
    if (event.data?.type === "SW_ACTIVATED" && !refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.StudyParkPwa = {
    checkForUpdates,
    forceRefresh,
    getAssetVersion() {
      return ASSET_VER;
    },
  };

  if (applyAssetVersionBump()) return;

  registerServiceWorker();

  window.addEventListener("pageshow", (event) => {
    if (event.persisted) checkForUpdates();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") checkForUpdates();
  });

  window.addEventListener("focus", () => {
    checkForUpdates();
  });
})();
