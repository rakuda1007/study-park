"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getStorageClient } from "./client";

const MAX_BYTES = 5 * 1024 * 1024;

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/svg+xml") return "svg";
  return "png";
}

/** レッスン用画像を Storage にアップロードし、公開 URL を返す */
export async function uploadLessonImage(
  contentId: string,
  file: File | Blob,
  mimeType: string,
): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("画像は 5MB 以下にしてください。");
  }
  if (!mimeType.startsWith("image/")) {
    throw new Error("画像ファイルを選んでください。");
  }

  const ext = extFromMime(mimeType);
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const path = `lesson-images/${contentId}/${name}`;
  const storageRef = ref(getStorageClient(), path);
  await uploadBytes(storageRef, file, { contentType: mimeType });
  return getDownloadURL(storageRef);
}
