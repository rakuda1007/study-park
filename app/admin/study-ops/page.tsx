"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { fetchStudyPlanAdminStats, type StudyPlanAdminStats } from "@/lib/study/admin-stats";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="admin-stat-card">
      <p className="admin-stat-card__label">{label}</p>
      <p className="admin-stat-card__value">
        {typeof value === "number" ? value.toLocaleString("ja-JP") : value}
      </p>
      {sub ? <p className="admin-stat-card__sub">{sub}</p> : null}
    </div>
  );
}

export default function AdminStudyOpsPage() {
  const [stats, setStats] = useState<StudyPlanAdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const reload = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      setStats(await fetchStudyPlanAdminStats());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <AdminShell title="学習管理の運用">
      <p className="admin-msg">
        学習計画（studyPlans）の Firestore 利用状況を確認します。read/write
        の詳細監視は Firebase コンソールと Cloud Logging を併用してください（リポジトリの{" "}
        <code>docs/study-management-ops.md</code> 参照）。
      </p>

      {err ? <p className="admin-err">{err}</p> : null}
      {loading ? <p className="admin-loading">読み込み中…</p> : null}

      {stats ? (
        <>
          <section className="admin-stat-grid">
            <StatCard label="進行中" value={stats.counts.active} />
            <StatCard label="完了" value={stats.counts.completed} />
            <StatCard label="アーカイブ" value={stats.counts.archived} />
            <StatCard label="合計" value={stats.total} />
            <StatCard
              label="上限到達ユーザー"
              value={stats.usersAtActiveLimit}
              sub={`進行中 ${stats.limits.activePlanLimit} 件以上`}
            />
            <StatCard
              label="上限接近ユーザー"
              value={stats.usersNearActiveLimit}
              sub="進行中 45 件以上"
            />
          </section>

          <section className="admin-card">
            <h3 className="shell-page-heading">運用ポリシー</h3>
            <ul className="portal-feature__list">
              <li>
                進行中の学習計画はユーザーあたり最大 {stats.limits.activePlanLimit} 件（ソフト上限）
              </li>
              <li>
                完了した計画は {stats.limits.archiveAfterDays} 日経過後に毎日 5:00 JST
                の Cloud Functions で自動アーカイブ
              </li>
              <li>
                アーカイブ済み計画は学習者 UI の一覧に表示されません（Firestore 上に残ります）
              </li>
            </ul>
          </section>

          {stats.topActiveUsers.length > 0 ? (
            <section className="admin-card">
              <h3 className="shell-page-heading">進行中計画が多いユーザー（上位10件）</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ユーザー ID</th>
                    <th>進行中件数</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.topActiveUsers.map((row) => (
                    <tr key={row.userId}>
                      <td>
                        <code>{row.userId}</code>
                      </td>
                      <td>{row.activeCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : null}
        </>
      ) : null}

      <p className="study-page-actions">
        <button type="button" className="admin-btn" onClick={() => void reload()} disabled={loading}>
          再読み込み
        </button>
      </p>
    </AdminShell>
  );
}
