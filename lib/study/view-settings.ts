"use client";

import { deleteField, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getFirestoreClient } from "@/lib/firebase/client";
import {
  DEFAULT_STUDY_VIEW,
  normalizeStudyViewSettings,
  type StudyViewSettings,
} from "./view-period";

function userRef(uid: string) {
  return doc(getFirestoreClient(), "users", uid);
}

export async function loadStudyViewSettings(uid: string): Promise<StudyViewSettings> {
  const snap = await getDoc(userRef(uid));
  if (!snap.exists()) return { ...DEFAULT_STUDY_VIEW };
  return normalizeStudyViewSettings(snap.data().studyView);
}

export async function saveStudyViewSettings(
  uid: string,
  settings: { anchorDate: string; spanDays: number },
): Promise<void> {
  await updateDoc(userRef(uid), {
    studyView: {
      anchorDate: settings.anchorDate,
      spanDays: settings.spanDays,
    },
    updatedAt: serverTimestamp(),
  });
}

export async function clearStudyViewSettings(uid: string): Promise<void> {
  await updateDoc(userRef(uid), {
    studyView: deleteField(),
    updatedAt: serverTimestamp(),
  });
}
