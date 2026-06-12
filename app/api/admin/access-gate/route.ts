import { NextResponse } from "next/server";
import {
  issueAdminAccessGateToken,
  verifyAdminAccessGateCredentials,
} from "@/lib/admin/access-gate-server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { username?: string; password?: string };
    const username = String(body.username ?? "");
    const password = String(body.password ?? "");
    if (!username || !password) {
      return NextResponse.json({ error: "ユーザー名とパスワードが必要です。" }, { status: 400 });
    }
    if (!verifyAdminAccessGateCredentials(username, password)) {
      return NextResponse.json({ error: "ユーザー名またはパスワードが正しくありません。" }, { status: 401 });
    }
    const session = issueAdminAccessGateToken();
    return NextResponse.json(session);
  } catch (e) {
    const message = e instanceof Error ? e.message : "認証に失敗しました。";
    const status = message.includes("未設定") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
