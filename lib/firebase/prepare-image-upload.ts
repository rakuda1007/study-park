"use client";

const MAX_BYTES = 5 * 1024 * 1024;
const COMPRESS_THRESHOLD = 600_000;
const MAX_DIMENSION = 2048;

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/svg+xml") return "svg";
  return "png";
}

export function normalizeImageMime(mimeType: string, file: File | Blob): string {
  const m = mimeType?.trim().toLowerCase();
  if (m && m.startsWith("image/")) return m === "image/jpg" ? "image/jpeg" : m;
  if (file instanceof File && file.type.startsWith("image/")) {
    return file.type === "image/jpg" ? "image/jpeg" : file.type;
  }
  return "image/png";
}

async function compressImageBlob(blob: Blob, mime: string): Promise<Blob> {
  if (typeof document === "undefined") return blob;

  const bitmap = await createImageBitmap(blob);
  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    if (scale === 1 && blob.size <= COMPRESS_THRESHOLD) {
      return blob;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return blob;

    ctx.drawImage(bitmap, 0, 0, width, height);
    const outMime =
      mime === "image/png" || mime === "image/webp" ? "image/png" : "image/jpeg";
    const quality = outMime === "image/jpeg" ? 0.88 : undefined;

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) resolve(result);
          else reject(new Error("画像の圧縮に失敗しました。"));
        },
        outMime,
        quality,
      );
    });
  } finally {
    bitmap.close();
  }
}

async function materializeClipboardBlob(blob: Blob, mimeType: string): Promise<File> {
  const buffer = await blob.arrayBuffer();
  if (!buffer.byteLength) {
    throw new Error("画像データが空です。もう一度貼り付けてください。");
  }
  const mime = normalizeImageMime(mimeType, blob);
  const ext = extFromMime(mime);
  return new File([buffer], `paste-${Date.now()}.${ext}`, { type: mime });
}

/** クリップボードから画像 File を取得（ブラウザ差を吸収） */
export async function readClipboardImageFile(
  clipboardData: DataTransfer,
): Promise<File | null> {
  if (clipboardData.files?.length) {
    for (let i = 0; i < clipboardData.files.length; i++) {
      const f = clipboardData.files[i];
      if (f?.type.startsWith("image/") && f.size > 0) {
        return materializeClipboardBlob(f, f.type);
      }
    }
  }

  for (let i = 0; i < clipboardData.items.length; i++) {
    const item = clipboardData.items[i];
    if (!item.type.startsWith("image/")) continue;

    const fromFile = item.getAsFile();
    if (fromFile && fromFile.size > 0) {
      return materializeClipboardBlob(fromFile, item.type || fromFile.type);
    }
  }

  return null;
}

/** アップロード前に Blob を実体化し、大きい画像は縮小する */
export async function prepareImageForUpload(
  source: File | Blob,
  mimeType: string,
): Promise<File> {
  let mime = normalizeImageMime(mimeType, source);
  let buffer = await source.arrayBuffer();
  if (!buffer.byteLength) {
    throw new Error("画像データが空です。もう一度貼り付けてください。");
  }

  let blob: Blob = new Blob([buffer], { type: mime });

  if (mime !== "image/svg+xml" && mime !== "image/gif") {
    if (buffer.byteLength > COMPRESS_THRESHOLD) {
      try {
        blob = await compressImageBlob(blob, mime);
        mime = blob.type || mime;
        buffer = await blob.arrayBuffer();
      } catch {
        // 圧縮できない場合は元のままアップロードを試す
      }
    }
  }

  if (buffer.byteLength > MAX_BYTES) {
    throw new Error(
      `画像が大きすぎます（約 ${Math.ceil(buffer.byteLength / 1024 / 1024)}MB）。別の画像をお試しください。`,
    );
  }

  const ext = extFromMime(mime);
  const baseName =
    source instanceof File && source.name
      ? source.name.replace(/[^a-zA-Z0-9._-]+/g, "_")
      : `image-${Date.now()}.${ext}`;

  return new File([buffer], baseName, { type: mime });
}
