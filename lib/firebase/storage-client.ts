"use client";

import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirebaseApp } from "./client";

/** Storage はホーム等の起動パスから切り離し、必要な画面だけが読む */
export function getStorageClient(): FirebaseStorage {
  const app = getFirebaseApp();
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  if (bucket) {
    const gsUrl = bucket.startsWith("gs://") ? bucket : `gs://${bucket}`;
    return getStorage(app, gsUrl);
  }
  return getStorage(app);
}
