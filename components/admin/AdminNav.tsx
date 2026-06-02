"use client";

import Link from "next/link";

type Props = {
  onLogout: () => void;
};

export function AdminNav({ onLogout }: Props) {
  return (
    <nav className="admin-nav" aria-label="管理メニュー">
      <Link href="/admin/contents" className="admin-link">
        コンテンツ一覧
      </Link>
      <Link href="/admin/invitations" className="admin-link">
        学習者招待
      </Link>
      <Link href="/" className="admin-link" title="ログアウトせず公園トップを表示">
        Study Park トップ
      </Link>
      <button type="button" className="admin-btn" onClick={onLogout}>
        ログアウト
      </button>
    </nav>
  );
}
