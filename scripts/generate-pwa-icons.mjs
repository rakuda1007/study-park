/**
 * PWA / ホーム画面用の正方形アイコンを生成する。
 *
 * 1. 元画像から「中央の正方形」に切り出し（円形ロゴが画面中央に来る想定の横長画像向け）
 * 2. その正方形を縮小し、四辺に同じ太さの余白を付与
 *    余白は白 (#fff)。円形ロゴを「白い座布団」の上に載せた見え方にし、
 *    ブランド色（DIC439 相当の紫）で外枠を敷かない（ホーム画面で二重の枠にならないようにする）。
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const srcPath = join(root, "public/study-park.png");
/** 座布団＝アイコン全体の下地（紫ではなく白） */
const MAT_BG = { r: 255, g: 255, b: 255, alpha: 1 };

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
      background: MAT_BG,
    })
    .png()
    .toFile(outPath);

  console.log("wrote", outPath, `(${size}x${size}, pad ${padPx}px)`);
}
