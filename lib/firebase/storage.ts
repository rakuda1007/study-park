"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseAuth } from "./auth-client";
import { getStorageClient } from "./client";

const MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 120_000;
const URL_TIMEOUT_MS = 30_000;

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/svg+xml") return "svg";
  return "png";
}

function normalizeMime(mimeType: string, file: File | Blob): string {
  const m = mimeType?.trim().toLowerCase();
  if (m && m.startsWith("image/")) return m === "image/jpg" ? "image/jpeg" : m;
  if (file instanceof File && file.type.startsWith("image/")) {
    return file.type === "image/jpg" ? "image/jpeg" : file.type;
  }
  return "image/png";
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

function mapStorageError(e: unknown): Error {
  const code =
    e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
  if (code === "storage/unauthorized") {
    return new Error(
      "アップロード権限がありません。管理者でログインしているか、Storage ルール（firebase:deploy:storage）を確認してください。",
    );
  }
  if (code === "storage/unauthenticated") {
    return new Error("ログインし直してください。");
  }
  if (code === "storage/canceled") {
    return new Error("アップロードがキャンセルされました。");
  }
  if (code === "storage/quota-exceeded") {
    return new Error("Storage の容量上限に達しています。");
  }
  if (e instanceof Error) return e;
  return new Error("アップロードに失敗しました。");
}

function assertStorageConfigured(): void {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  if (!bucket) {
    throw new Error(
      "Firebase Storage が未設定です。.env.local に NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET を設定し、開発サーバーを再起動してください。",
    );
  }
}

async function assertAdminAuth(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new Error("ログインし直してください（管理者として）。");
  }
  await user.getIdToken();
}

/** レッスン・クイズ用画像を Storage にアップロードし、公開 URL を返す */
export async function uploadLessonImage(
  contentId: string,
  file: File | Blob,
  mimeType: string,
): Promise<string> {
  if (!contentId.trim()) {
    throw new Error("コンテンツ ID がありません。ページを再読み込みしてください。");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("画像は 5MB 以下にしてください。");
  }

  assertStorageConfigured();
  await assertAdminAuth();

  const mime = normalizeMime(mimeType, file);
  const ext = extFromMime(mime);
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const path = `lesson-images/${contentId}/${name}`;
  const storageRef = ref(getStorageClient(), path);

  try {
    await withTimeout(
      uploadBytes(storageRef, file, { contentType: mime }),
      UPLOAD_TIMEOUT_MS,
      "アップロードがタイムアウトしました。Storage が有効か、ネットワークを確認してください。",
    );
    return await withTimeout(
      getDownloadURL(storageRef),
      URL_TIMEOUT_MS,
      "画像 URL の取得がタイムアウトしました。",
    );
  } catch (e) {
    throw mapStorageError(e);
  }
}
