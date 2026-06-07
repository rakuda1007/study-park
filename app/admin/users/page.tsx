"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import {
  fetchCreatorParticipantOverview,
  fetchMyWorkspaceParticipants,
  fetchUserStats,
  listRecentGuestLearners,
  listUsersByRole,
  type CreatorParticipantOverview,
  type GuestLearnerSummary,
  type MyWorkspaceParticipantOverview,
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
  const [uid, setUid] = useState("");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [creatorOverview, setCreatorOverview] = useState<CreatorParticipantOverview | null>(null);
  const [myWorkspace, setMyWorkspace] = useState<MyWorkspaceParticipantOverview | null>(null);
  const [creators, setCreators] = useState<UserProfile[]>([]);
  const [learners, setLearners] = useState<UserProfile[]>([]);
  const [guests, setGuests] = useState<GuestLearnerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const reload = useCallback(async (ownerId: string) => {
    setErr("");
    try {
      const [s, overview, mine, c, l, g] = await Promise.all([
        fetchUserStats(),
        fetchCreatorParticipantOverview(),
        ownerId ? fetchMyWorkspaceParticipants(ownerId) : Promise.resolve(null),
        listUsersByRole("creator"),
        listUsersByRole("learner"),
        listRecentGuestLearners(30),
      ]);
      setStats(s);
      setCreatorOverview(overview);
      setMyWorkspace(mine);
      setCreators(c);
      setLearners(l);
      setGuests(g);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "読み込みに失敗しました。");
    }
  }, []);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      const nextUid = user?.uid ?? "";
      setUid(nextUid);
      void (async () => {
        try {
          await reload(nextUid);
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, [reload]);

  const learnerTotal =
    stats != null ? stats.registeredLearners + stats.guestLearners : 0;

  return (
    <AdminShell title="利用者">
      {loading ? <p className="admin-loading">読み込み中…</p> : null}
      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}

      {stats && creatorOverview ? (
        <>
          <section className="admin-card">
            <h2 style={{ fontSize: "1.05rem", margin: "0 0 0.35rem" }}>管理者として見る</h2>
            <p className="admin-hint" style={{ marginTop: 0, marginBottom: "0.85rem" }}>
              Study Park 全体のクリエイター数と、各クリエイターの教材に参加している人数です。
            </p>
            <div className="admin-stat-grid">
              <StatCard
                label="クリエイター"
                value={creatorOverview.creatorCount}
                sub="教材を作成する登録ユーザー"
              />
              <StatCard
                label="教材参加者（合計）"
                value={creatorOverview.totalParticipants}
                sub="クリエイター教材への参加記録の合計"
              />
              <StatCard
                label="教材参加者（重複除く）"
                value={creatorOverview.uniqueParticipants}
                sub="複数の教材に参加しても1人として数える"
              />
            </div>
          </section>

          <section className="admin-card">
            <h2 style={{ fontSize: "1.05rem", margin: "0 0 0.5rem" }}>
              クリエイター別の参加者（{creatorOverview.byCreator.length} 教室）
            </h2>
            {creatorOverview.byCreator.length === 0 ? (
              <p className="admin-msg">まだワークスペースがありません。</p>
            ) : (
              <ul className="admin-list">
                {creatorOverview.byCreator.map((row) => (
                  <li key={row.workspaceId} className="admin-list-item">
                    <span>
                      <strong>{row.workspaceName}</strong>
                      <span style={{ marginLeft: "0.5rem", color: "var(--admin-muted)" }}>
                        {row.ownerDisplayName ? `${row.ownerDisplayName} · ` : ""}
                        {row.ownerEmail}
                      </span>
                    </span>
                    <span>{row.participantCount} 人</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {myWorkspace ? (
            <section className="admin-card">
              <h2 style={{ fontSize: "1.05rem", margin: "0 0 0.35rem" }}>
                あなたの教材として見る
              </h2>
              <p className="admin-hint" style={{ marginTop: 0, marginBottom: "0.85rem" }}>
                管理者兼クリエイターとして、ご自身の教材「{myWorkspace.workspaceName}」に参加している人です。
              </p>
              <div className="admin-stat-grid">
                <StatCard
                  label="教材に参加している人"
                  value={myWorkspace.participantCount}
                  sub="あなたの招待コードで参加した学習者"
                />
              </div>
              {myWorkspace.participantCount === 0 ? (
                <p className="admin-msg" style={{ marginTop: "0.75rem" }}>
                  まだ参加している人はいません。招待コードを共有して参加を促しましょう。
                </p>
              ) : (
                <ul className="admin-list" style={{ marginTop: "0.75rem" }}>
                  {myWorkspace.participants.map((m) => (
                    <li key={m.id} className="admin-list-item">
                      <span>参加者（{m.userId.slice(0, 8)}…）</span>
                      <span>{formatDate(m.createdAt)} 参加</span>
                    </li>
                  ))}
                </ul>
              )}
              <p style={{ marginTop: "0.75rem" }}>
                <Link href="/creator/learners" className="admin-link">
                  クリエイター画面で詳しく見る →
                </Link>
              </p>
            </section>
          ) : null}

          <section className="admin-card">
            <h2 style={{ fontSize: "1.05rem", margin: "0 0 0.35rem" }}>学習者の全体像</h2>
            <p className="admin-hint" style={{ marginTop: 0, marginBottom: "0.85rem" }}>
              登録学習者と、登録なしでコンテンツを利用した端末の数です。
            </p>
            <div className="admin-stat-grid">
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
            </p>
            <button
              type="button"
              className="admin-btn"
              style={{ marginTop: "0.85rem" }}
              disabled={loading}
              onClick={() => {
                setLoading(true);
                void reload(uid).finally(() => setLoading(false));
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
