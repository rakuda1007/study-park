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
  return getStorage(getFirebaseApp());
}
