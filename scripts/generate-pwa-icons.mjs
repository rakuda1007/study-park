/**
 * PWA / ホーム画面用の正方形アイコンを生成する。
 *
 * 1. 元画像から「中央の正方形」に切り出し（円形ロゴが画面中央に来る想定の横長画像向け）
 * 2. その正方形を縮小し、四辺に同じ太さの余白（#5058B8）を付与
 *    → 円周囲の見え方の余白が上下左右そろう
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const srcPath = join(root, "public/study-park.png");
/** @type {import('sharp').Color} */
const bg = { r: 0x50, g: 0x58, b: 0xb8, alpha: 1 };

/** 1 辺あたりの余白の割合（四辺とも同じピクセル幅になるよう size から計算） */
const EDGE_PADDING_FRAC = 0.07;

const sizes = [512, 192, 180];

const meta = await sharp(srcPath).metadata();
const w = meta.width ?? 0;
const h = meta.height ?? 0;
if (!w || !h) {
  throw new Error("Could not read source dimensions");
}

const side = Math.min(w, h);
const left = Math.floor((w - side) / 2);
const top = Math.floor((h - side) / 2);

for (const size of sizes) {
  const outPath = join(root, "public", `icon-${size}.png`);

  const padPx = Math.max(2, Math.round(size * EDGE_PADDING_FRAC));
  let inner = size - 2 * padPx;
  if (inner < 1) {
    inner = 1;
  }

  await sharp(srcPath)
    .extract({ left, top, width: side, height: side })
    .resize(inner, inner, {
      kernel: sharp.kernel.lanczos3,
      fit: "fill",
    })
    .extend({
      top: padPx,
      bottom: padPx,
      left: padPx,
      right: padPx,
      background: bg,
    })
    .png()
    .toFile(outPath);

  console.log("wrote", outPath, `(${size}x${size}, pad ${padPx}px)`);
}
