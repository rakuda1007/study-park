/**
 * PWA / ホーム画面用の正方形アイコンを生成する。
 *
 * 1. 元画像から中央の正方形に切り出し
 * 2. 可能なら trim で外周の均一な帯を落とし、ロゴ本体に近い矩形へ
 * 3. 内側 (size - 2*pad) の正方形に fit:contain で収め、上下左右に同じ白余白で中央配置
 * 4. 外周に同じ太さの白 (MAT_BG) を extend → 最終 size×size で四辺の余白が一致
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const srcPath = join(root, "public/study-park.png");
const MAT_BG = { r: 255, g: 255, b: 255, alpha: 1 };

/** 1 辺の外周余白の割合（四辺とも同じピクセル）。目安: 512→4px, 192/180→2px */
const EDGE_PADDING_FRAC = 0.006;

/** trim: 角に近い均一色を削る感度（大きいとロゴまで食うので控えめ） */
const TRIM_THRESHOLD = 22;

/** trim 後に極端に小さくなったら無効とみなす（壊れ防止） */
const TRIM_MIN_SIDE_FRAC = 0.35;

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

const rawSquare = await sharp(srcPath)
  .extract({ left, top, width: side, height: side })
  .toBuffer();

let contentBuf = rawSquare;
try {
  const trimmed = await sharp(rawSquare)
    .trim({ threshold: TRIM_THRESHOLD })
    .toBuffer({ resolveWithObject: true });
  const tw = trimmed.info.width;
  const th = trimmed.info.height;
  if (
    tw >= side * TRIM_MIN_SIDE_FRAC &&
    th >= side * TRIM_MIN_SIDE_FRAC &&
    tw <= side &&
    th <= side
  ) {
    contentBuf = trimmed.data;
  }
} catch {
  /* 単色などで trim できない場合は正方形のまま */
}

for (const size of sizes) {
  const outPath = join(root, "public", `icon-${size}.png`);

  const padPx = Math.max(
    0,
    2 * Math.round((size * EDGE_PADDING_FRAC) / 2),
  );
  let inner = size - 2 * padPx;
  if (inner < 1) inner = 1;

  await sharp(contentBuf)
    .resize(inner, inner, {
      fit: "contain",
      position: "centre",
      kernel: sharp.kernel.lanczos3,
      background: MAT_BG,
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
