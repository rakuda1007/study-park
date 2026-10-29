(function () {
  "use strict";

  var config = window.__FIREBASE_WEB_CONFIG__;
  var id = config && typeof config.measurementId === "string" ? config.measurementId.trim() : "";
  if (!/^G-[A-Z0-9]+$/.test(id)) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());

  var host = location.hostname;
  var parts = host.split(".");
  var linkerDomain = "";
  if (host !== "localhost" && !host.endsWith(".localhost") && parts.length >= 2) {
    linkerDomain = parts.slice(-2).join(".");
  }

  // <base href> があると gtag がポートを落としてページ URL を送ることがある。
  var options = {
    send_page_view: true,
    page_location: location.href,
    page_path: location.pathname + location.search,
  };
  if (linkerDomain) {
    options.linker = { domains: [linkerDomain] };
  }
  gtag("config", id, options);

  var script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
  document.head.appendChild(script);
})();
