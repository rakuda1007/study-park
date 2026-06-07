"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SessionModeBar } from "@/components/auth/SessionModeBar";
import { CreatorLearnerSummary } from "@/components/creator/CreatorLearnerSummary";
import { useCreatorTheme } from "@/components/creator/CreatorThemeProvider";
import type { CreatorTheme } from "@/lib/creator/theme";
import { signOutUser } from "@/lib/firebase/auth-client";

export function CreatorShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { theme, setTheme } = useCreatorTheme();

  async function logout() {
    await signOutUser();
    router.replace("/login");
  }

  return (
    <div className="admin-shell">
      <header className="admin-header admin-header--stacked">
        <div className="admin-header__lead">
          <SessionModeBar
            kind="creator"
            extra={<CreatorLearnerSummary compact />}
          />
          <h1 className="admin-title">{title}</h1>
        </div>
        <nav className="admin-nav" aria-label="クリエイターメニュー">
          <label className="admin-theme-toggle" htmlFor="creator-theme">
            <span className="admin-theme-toggle__label">表示</span>
            <select
              id="creator-theme"
              className="admin-theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value as CreatorTheme)}
            >
              <option value="light">通常</option>
              <option value="dark">ダーク</option>
            </select>
          </label>
          <Link href="/creator" className="admin-link">
            ダッシュボード
          </Link>
          <Link href="/creator/contents" className="admin-link">
            教材一覧
          </Link>
          <Link href="/creator/learners" className="admin-link">
            参加している人
          </Link>
          <Link href="/" className="admin-link" title="ログアウトせず公園トップを表示">
            Study Park トップ
          </Link>
          <button type="button" className="admin-btn" onClick={() => void logout()}>
            ログアウト
          </button>
        </nav>
      </header>
      {children}
    </div>
  );
}
