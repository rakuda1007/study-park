/**
 * トップ用ロゴ — 青い円部分のみを切り出し、白い正方形の中央に配置
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const srcPath = join(root, "public/study-park.png");
const outPath = join(root, "public/study-park-logo.png");

/** 出力キャンバス（白い四角） */
const CANVAS = 144;
/** 青い円の直径 */
const BLUE_CIRCLE = 112;
/** trim 後に外側の白い輪を落とすための拡大率 */
const ZOOM = 1.24;

const PAD = Math.round((CANVAS - BLUE_CIRCLE) / 2);
const MAT_BG = { r: 255, g: 255, b: 255, alpha: 1 };

const meta = await sharp(srcPath).metadata();
const w = meta.width ?? 0;
const h = meta.height ?? 0;
if (!w || !h) throw new Error("Could not read source dimensions");

const side = Math.min(w, h);
const left = Math.floor((w - side) / 2);
const top = Math.floor((h - side) / 2);

let emblem = await sharp(srcPath)
  .extract({ left, top, width: side, height: side })
  .png()
  .toBuffer();

try {
  emblem = await sharp(emblem).trim({ threshold: 18 }).png().toBuffer();
} catch {
  /* trim 不可のときはそのまま */
}

const zoomed = Math.round(BLUE_CIRCLE * ZOOM);
const croppedLeft = Math.floor((zoomed - BLUE_CIRCLE) / 2);

const blueCircle = await sharp(emblem)
  .resize(zoomed, zoomed, { fit: "cover", position: "centre" })
  .extract({
    left: croppedLeft,
    top: croppedLeft,
    width: BLUE_CIRCLE,
    height: BLUE_CIRCLE,
  })
  .png()
  .toBuffer();

const mask = Buffer.from(
  `<svg width="${BLUE_CIRCLE}" height="${BLUE_CIRCLE}"><circle cx="${BLUE_CIRCLE / 2}" cy="${BLUE_CIRCLE / 2}" r="${BLUE_CIRCLE / 2}" fill="white"/></svg>`,
);

const blueOnly = await sharp(blueCircle)
  .composite([{ input: mask, blend: "dest-in" }])
  .png()
  .toBuffer();

await sharp({
  create: {
    width: CANVAS,
    height: CANVAS,
    channels: 4,
    background: MAT_BG,
  },
})
  .composite([{ input: blueOnly, left: PAD, top: PAD }])
  .png()
  .toFile(outPath);

console.log("wrote", outPath, `(${CANVAS}x${CANVAS}, circle ${BLUE_CIRCLE}px)`);
