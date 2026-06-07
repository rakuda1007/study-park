"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  fetchUserStats,
  listRecentGuestLearners,
  listUsersByRole,
  type GuestLearnerSummary,
  type UserStats,
} from "@/lib/users/admin-stats";
import type { UserProfile } from "@/lib/users/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="admin-stat-card">
      <p className="admin-stat-card__label">{label}</p>
      <p className="admin-stat-card__value">{value.toLocaleString("ja-JP")}</p>
      {sub ? <p className="admin-stat-card__sub">{sub}</p> : null}
    </div>
  );
}

export default function AdminUsersPage() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [creators, setCreators] = useState<UserProfile[]>([]);
  const [learners, setLearners] = useState<UserProfile[]>([]);
  const [guests, setGuests] = useState<GuestLearnerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const reload = useCallback(async () => {
    setErr("");
    try {
      const [s, c, l, g] = await Promise.all([
        fetchUserStats(),
        listUsersByRole("creator"),
        listUsersByRole("learner"),
        listRecentGuestLearners(30),
      ]);
      setStats(s);
      setCreators(c);
      setLearners(l);
      setGuests(g);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "読み込みに失敗しました。");
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await reload();
      } finally {
        setLoading(false);
      }
    })();
  }, [reload]);

  const learnerTotal =
    stats != null ? stats.registeredLearners + stats.guestLearners : 0;

  return (
    <AdminShell title="利用者">
      {loading ? <p className="admin-loading">読み込み中…</p> : null}
      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}

      {stats ? (
        <>
          <section className="admin-card">
            <h2 style={{ fontSize: "1.05rem", margin: "0 0 0.75rem" }}>利用者の概要</h2>
            <div className="admin-stat-grid">
              <StatCard label="クリエイター" value={stats.creators} sub="教材を作成する登録ユーザー" />
              <StatCard
                label="学習者（合計）"
                value={learnerTotal}
                sub="登録済みと登録なしの合算"
              />
              <StatCard
                label="学習者・登録済み"
                value={stats.registeredLearners}
                sub="学習者として登録したアカウント"
              />
              <StatCard
                label="学習者・登録なし"
                value={stats.guestLearners}
                sub="ログインせずコンテンツを利用した端末"
              />
            </div>
            <p className="admin-hint" style={{ marginTop: "0.85rem", marginBottom: 0 }}>
              登録なしの利用者は、九九・県庁所在地・公開教材（/play）などをログインなしで開いた端末を数えています。
              同一人物が登録アカウントと登録なしの両方で利用した場合、両方にカウントされることがあります。
            </p>
            <button
              type="button"
              className="admin-btn"
              style={{ marginTop: "0.85rem" }}
              disabled={loading}
              onClick={() => {
                setLoading(true);
                void reload().finally(() => setLoading(false));
              }}
            >
              再読み込み
            </button>
          </section>

          <section className="admin-card">
            <h2 style={{ fontSize: "1.05rem", margin: "0 0 0.5rem" }}>
              クリエイター一覧（{creators.length}）
            </h2>
            {creators.length === 0 ? (
              <p className="admin-msg">まだ登録がありません。</p>
            ) : (
              <ul className="admin-list">
                {creators.map((u) => (
                  <li key={u.uid} className="admin-list-item">
                    <span>
                      {u.displayName ? `${u.displayName} · ` : ""}
                      {u.email || u.uid}
                    </span>
                    <span>{formatDate(u.createdAt)} 登録</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="admin-card">
            <h2 style={{ fontSize: "1.05rem", margin: "0 0 0.5rem" }}>
              登録済み学習者一覧（{learners.length}）
            </h2>
            {learners.length === 0 ? (
              <p className="admin-msg">まだ登録がありません。</p>
            ) : (
              <ul className="admin-list">
                {learners.map((u) => (
                  <li key={u.uid} className="admin-list-item">
                    <span>
                      {u.displayName ? `${u.displayName} · ` : ""}
                      {u.email || u.uid}
                    </span>
                    <span>{formatDate(u.createdAt)} 登録</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="admin-card">
            <h2 style={{ fontSize: "1.05rem", margin: "0 0 0.5rem" }}>
              登録なし利用者（直近 {guests.length} 件）
            </h2>
            {guests.length === 0 ? (
              <p className="admin-msg">
                まだ記録がありません。九九・県庁所在地・公開教材へのアクセスで集計されます。
              </p>
            ) : (
              <ul className="admin-list">
                {guests.map((g) => (
                  <li key={g.id} className="admin-list-item">
                    <span>
                      <code style={{ fontSize: "0.78rem" }}>{g.id}</code>
                      {g.lastContentRef ? (
                        <span style={{ marginLeft: "0.5rem", color: "var(--admin-muted)" }}>
                          最終: {g.lastContentRef}
                        </span>
                      ) : null}
                    </span>
                    <span>
                      {g.visitCount} 回 · {formatDate(g.lastSeenAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </AdminShell>
  );
}
