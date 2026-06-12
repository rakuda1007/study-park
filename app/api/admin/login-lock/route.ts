import { NextResponse } from "next/server";
import {
  formatAdminLoginLockMessage,
  getAdminLoginLockState,
  recordAdminLoginFailure,
  recordAdminLoginSuccess,
} from "@/lib/admin/login-lock-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; action?: string };
    const email = String(body.email ?? "").trim();
    const action = String(body.action ?? "").trim();
    if (!email) {
      return NextResponse.json({ error: "email が必要です。" }, { status: 400 });
    }

    if (action === "check") {
      const state = await getAdminLoginLockState(email);
      return NextResponse.json(state);
    }
    if (action === "failure") {
      const state = await recordAdminLoginFailure(email);
      return NextResponse.json({
        ...state,
        message: state.locked ? formatAdminLoginLockMessage(state) : undefined,
      });
    }
    if (action === "success") {
      await recordAdminLoginSuccess(email);
      return NextResponse.json({ locked: false, failCount: 0, remainingAttempts: 10, lockedUntil: null });
    }
    return NextResponse.json({ error: "action が不正です。" }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "ログイン制限の処理に失敗しました。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
