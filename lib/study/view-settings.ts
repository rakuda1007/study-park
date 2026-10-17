"use client";

import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
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
  settings: StudyViewSettings,
): Promise<void> {
  const studyView: Record<string, string | number> = {
    spanDays: settings.spanDays,
    standardWeekday: settings.standardWeekday,
    standardSpanDays: settings.standardSpanDays,
  };
  if (settings.anchorDate) studyView.anchorDate = settings.anchorDate;
  await updateDoc(userRef(uid), {
    studyView,
    updatedAt: serverTimestamp(),
  });
}
