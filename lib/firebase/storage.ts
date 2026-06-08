"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { incrementWorkspaceStorageBytes } from "@/lib/workspaces/firestore";
import { getFirebaseAuth } from "./auth-client";
import { getStorageClient } from "./client";
import { prepareImageForUpload } from "./prepare-image-upload";

const UPLOAD_TIMEOUT_MS = 180_000;
const URL_TIMEOUT_MS = 30_000;

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/svg+xml") return "svg";
  return "png";
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

async function assertSignedIn(): Promise<void> {
  const user = getFirebaseAuth().currentUser;
  if (!user) {
    throw new Error("ログインし直してください。");
  }
  await user.getIdToken(true);
}

/** レッスン・クイズ用画像を Storage にアップロードし、公開 URL を返す */
export async function uploadLessonImage(
  contentId: string,
  file: File | Blob,
  mimeType: string,
  workspaceId?: string,
): Promise<string> {
  if (!contentId.trim()) {
    throw new Error("コンテンツ ID がありません。ページを再読み込みしてください。");
  }

  assertStorageConfigured();
  await assertSignedIn();

  const prepared = await prepareImageForUpload(file, mimeType);
  const mime = prepared.type;
  const ext = extFromMime(mime);
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const path = workspaceId
    ? `workspaces/${workspaceId}/lesson-images/${contentId}/${name}`
    : `lesson-images/${contentId}/${name}`;
  const storageRef = ref(getStorageClient(), path);

  try {
    await withTimeout(
      uploadBytes(storageRef, prepared, { contentType: mime }),
      UPLOAD_TIMEOUT_MS,
      "アップロードがタイムアウトしました。Firebase Storage が有効か、.env.local の STORAGE_BUCKET を確認してください。",
    );
    if (workspaceId) {
      try {
        await incrementWorkspaceStorageBytes(workspaceId, prepared.size);
      } catch {
        /* 集計失敗はアップロード自体は成功扱い */
      }
    }
    return await withTimeout(
      getDownloadURL(storageRef),
      URL_TIMEOUT_MS,
      "画像 URL の取得がタイムアウトしました。",
    );
  } catch (e) {
    throw mapStorageError(e);
  }
}
