import { getAuth } from "firebase-admin/auth";
import { getAdminFirestore } from "./firestore-admin";

export async function verifyFirebaseIdToken(
  authorizationHeader: string | null,
): Promise<{ uid: string; email?: string }> {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new Error("認証トークンがありません。");
  }
  const token = authorizationHeader.slice("Bearer ".length).trim();
  if (!token) throw new Error("認証トークンが空です。");

  getAdminFirestore();
  const decoded = await getAuth().verifyIdToken(token);
  return { uid: decoded.uid, email: decoded.email };
}
