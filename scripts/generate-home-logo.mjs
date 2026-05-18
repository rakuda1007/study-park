/**
 * ヘッダー・トップ用 study-park-logo.png を生成する。
 *
 * 正規のアイコン素材（icon-192.png）を使用する。
 * バナー study-park.png からの切り抜きは円の位置がずれるため使わない。
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
/** PWA と同じ、中央に円形エンブレムが収まった正規ソース */
const srcPath = join(root, "public/icon-192.png");
const outPath = join(root, "public/study-park-logo.png");

const OUTPUT = 256;
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

await sharp(srcPath)
  .resize({
    width: OUTPUT,
    height: OUTPUT,
    fit: "contain",
    background: transparent,
  })
  .png()
  .toFile(outPath);

const { data, info } = await sharp(outPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

let minX = info.width;
let maxX = 0;
let minY = info.height;
let maxY = 0;

for (let y = 0; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const i = (y * info.width + x) * 4;
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (data[i + 3] > 20 && lum < 252) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
}

const margins = {
  left: minX,
  right: info.width - 1 - maxX,
  top: minY,
  bottom: info.height - 1 - maxY,
};

console.log("source", srcPath);
console.log("wrote", outPath, `${OUTPUT}x${OUTPUT}`);
console.log("margins", margins);
