"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirebaseWebConfig } from "./config";

let app: FirebaseApp | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const config = getFirebaseWebConfig();
    app = getApps().length ? getApp() : initializeApp(config);
  }
  return app;
}

export function getFirestoreClient(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getStorageClient(): FirebaseStorage {
  const app = getFirebaseApp();
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  if (bucket) {
    const gsUrl = bucket.startsWith("gs://") ? bucket : `gs://${bucket}`;
    return getStorage(app, gsUrl);
  }
  return getStorage(app);
}
