/**
 * Next.js 静的 export では、親ページが path.html、子ページが path/child.html になる。
 * Firebase Hosting（cleanUrls）では path/ ディレクトリが優先され index.html が無いと 404 になる。
 * 例: /admin/contents → admin/contents/ があるため contents.html が使われない。
 */
import { access, readdir, rename } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = fileURLToPath(new URL("../out", import.meta.url));

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function fixDir(dir) {
  const names = await readdir(dir, { withFileTypes: true });
  for (const entry of names) {
    if (!entry.isDirectory()) continue;
    const nestedDir = join(dir, entry.name);
    await fixDir(nestedDir);
  }

  for (const entry of names) {
    if (!entry.isFile() || !entry.name.endsWith(".html")) continue;
    const base = entry.name.slice(0, -".html".length);
    if (!base || base === "index") continue;

    const siblingHtml = join(dir, entry.name);
    const nestedDir = join(dir, base);
    const indexHtml = join(nestedDir, "index.html");

    if (!(await exists(nestedDir))) continue;
    if (await exists(indexHtml)) continue;

    await rename(siblingHtml, indexHtml);
    console.log(`[fixNestedRouteIndex] ${siblingHtml} -> ${indexHtml}`);
  }
}

try {
  await fixDir(outDir);
} catch (err) {
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    err.code === "ENOENT"
  ) {
    console.warn("[fixNestedRouteIndex] out/ not found; skip");
    process.exit(0);
  }
  throw err;
}
