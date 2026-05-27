/** ホーム画面を PWA（スタンドアロン）として開いているか */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

/** トップの公園メニューを明示的に表示する（PWA でもリダイレクトしない） */
export function isForcePublicHome(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("park") === "1";
}
