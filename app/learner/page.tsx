"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  buildSubjectNameMap,
  subjectDisplayName,
  subjectSortOrder,
} from "@/lib/content/subject-names";
import type { ContentManifest } from "@/lib/content/types";
import { workspacePlayHref } from "@/lib/content/urls";
import { listPublicSubjects } from "@/lib/content/public-firestore";
import { listPublishedContentsForMember } from "@/lib/workspaces/content-firestore";
import { getWorkspace } from "@/lib/workspaces/firestore";
import { listWorkspacesForLearner } from "@/lib/workspaces/members";
import type { WorkspaceContentDoc } from "@/lib/workspaces/content-firestore";
import { signOutUser, subscribeAuth } from "@/lib/firebase/auth-client";
import contentManifest from "@/public/content-manifest.json";

type Row = {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  contents: WorkspaceContentDoc[];
};

type SubjectGroup = {
  subjectId: string;
  subjectName: string;
  items: WorkspaceContentDoc[];
};

function groupBySubject(
  contents: WorkspaceContentDoc[],
  subjectNames: Map<string, string>,
  manifest: ContentManifest,
): SubjectGroup[] {
  const byId = new Map<string, WorkspaceContentDoc[]>();
  for (const c of contents) {
    const list = byId.get(c.subjectId) ?? [];
    list.push(c);
    byId.set(c.subjectId, list);
  }
  return [...byId.entries()]
    .map(([subjectId, items]) => ({
      subjectId,
      subjectName: subjectDisplayName(subjectNames, subjectId),
      items: items.sort((a, b) => a.order - b.order),
    }))
    .sort(
      (a, b) =>
        subjectSortOrder(manifest, a.subjectId) - subjectSortOrder(manifest, b.subjectId),
    );
}

export default function LearnerHomePage() {
  const manifest = contentManifest as ContentManifest;
  const [rows, setRows] = useState<Row[]>([]);
  const [subjectNames, setSubjectNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) return;
        try {
          const [memberships, subjects] = await Promise.all([
            listWorkspacesForLearner(user.uid),
            listPublicSubjects(),
          ]);
          setSubjectNames(buildSubjectNameMap(manifest, subjects));
          const data: Row[] = [];
          for (const m of memberships) {
            const ws = await getWorkspace(m.workspaceId);
            if (!ws) continue;
            const contents = await listPublishedContentsForMember(m.workspaceId);
            data.push({
              workspaceId: m.workspaceId,
              workspaceName: ws.name,
              workspaceSlug: ws.slug,
              contents,
            });
          }
          setRows(data);
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, [manifest]);

  const rowsWithGroups = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        subjectGroups: groupBySubject(r.contents, subjectNames, manifest),
      })),
    [rows, subjectNames, manifest],
  );

  return (
    <div className="admin-shell" style={{ padding: "1.5rem" }}>
      <header className="admin-header">
        <h1 className="admin-title">学習者ホーム</h1>
        <nav className="admin-nav">
          <Link href="/" className="admin-link">
            Study Park トップ
          </Link>
          <button
            type="button"
            className="admin-btn"
            onClick={() => void signOutUser().then(() => (window.location.href = "/"))}
          >
            ログアウト
          </button>
        </nav>
      </header>

      <p className="admin-msg" style={{ marginBottom: "1rem" }}>
        九九・県庁所在地は <Link href="/">トップページ</Link> から無料で利用できます。
        招待された教材はこのページから学習してください。
      </p>

      {loading ? <p className="admin-loading">読み込み中…</p> : null}

      {!loading && rows.length === 0 ? (
        <section className="admin-card">
          <p>参加している教材がありません。</p>
          <p>
            <Link href="/signup/learner">招待コードで参加</Link>
          </p>
        </section>
      ) : null}

      {rowsWithGroups.map((r) => (
        <section key={r.workspaceId} className="admin-card" style={{ marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>{r.workspaceName}</h2>
          {r.subjectGroups.length === 0 ? (
            <p className="admin-msg">公開中の教材はまだありません。</p>
          ) : (
            r.subjectGroups.map((g) => (
              <div key={g.subjectId} className="admin-subject-group learner-subject-group">
                <h3 className="learner-subject-heading">{g.subjectName}</h3>
                <ul className="admin-list learner-study-list">
                  {g.items.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={workspacePlayHref(r.workspaceSlug, c.slug)}
                        className="learner-study-link"
                      >
                        <span className="learner-study-link__text">
                          <span className="learner-study-link__title">{c.title}</span>
                          <span className="learner-study-link__meta">
                            {c.type === "quiz" ? "クイズ" : "レッスン"}
                          </span>
                        </span>
                        <span className="learner-study-link__arrow" aria-hidden="true">
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </section>
      ))}
    </div>
  );
}
