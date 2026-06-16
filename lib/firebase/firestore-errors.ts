export function isPermissionDeniedError(e: unknown): boolean {
  return (
    e !== null &&
    typeof e === "object" &&
    "code" in e &&
    (e as { code: string }).code === "permission-denied"
  );
}

/** 管理画面向け Firestore エラーメッセージ */
export function formatAdminFirestoreError(e: unknown): string {
  if (isPermissionDeniedError(e)) {
    return [
      "Firestore の権限がありません（permission-denied）。",
      "Firebase Console で admins/{ログイン中の UID} ドキュメントがあるか確認し、",
      "npm run firebase:deploy:rules でルールをデプロイしてください。",
      "詳しくは docs/admin-setup.md の「3. 管理者 UID の登録」を参照してください。",
    ].join(" ");
  }
  if (e instanceof Error) return e.message;
  return "保存に失敗しました。";
}
