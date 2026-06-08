"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CreatorShell } from "@/components/creator/CreatorShell";
import { SubjectMasterPanel } from "@/components/admin/SubjectMasterPanel";
import { subscribeAuth } from "@/lib/firebase/auth-client";
import { listWorkspaceContents } from "@/lib/workspaces/content-firestore";
import { getWorkspaceByOwner } from "@/lib/workspaces/firestore";
import {
  createWorkspaceSubject,
  deleteWorkspaceSubject,
  ensureWorkspaceSubjects,
  listWorkspaceSubjects,
  updateWorkspaceSubject,
} from "@/lib/workspaces/subjects-firestore";
import type { WorkspaceDoc } from "@/lib/workspaces/types";
import type { WorkspaceSubjectDoc } from "@/lib/workspaces/types";

export default function CreatorSubjectsPage() {
  const [ws, setWs] = useState<WorkspaceDoc | null>(null);
  const [subjects, setSubjects] = useState<WorkspaceSubjectDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const reload = useCallback(async (workspaceId: string) => {
    await ensureWorkspaceSubjects(workspaceId);
    const [s, contents] = await Promise.all([
      listWorkspaceSubjects(workspaceId),
      listWorkspaceContents(workspaceId),
    ]);
    setSubjects(s);
    return contents;
  }, []);

  const [contentCounts, setContentCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      void (async () => {
        if (!user) {
          setLoading(false);
          return;
        }
        try {
          const workspace = await getWorkspaceByOwner(user.uid);
          setWs(workspace);
          if (workspace) {
            const contents = await reload(workspace.id);
            const map = new Map<string, number>();
            for (const c of contents) {
              map.set(c.subjectId, (map.get(c.subjectId) ?? 0) + 1);
            }
            setContentCounts(map);
          }
        } catch (e) {
          setErr(e instanceof Error ? e.message : "読み込みに失敗しました。");
        } finally {
          setLoading(false);
        }
      })();
    });
    return unsub;
  }, [reload]);

  const contentCountBySubject = useMemo(() => contentCounts, [contentCounts]);

  async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (!ws) throw new Error("ワークスペースが見つかりません。");
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const result = await fn();
      const contents = await reload(ws.id);
      const map = new Map<string, number>();
      for (const c of contents) {
        map.set(c.subjectId, (map.get(c.subjectId) ?? 0) + 1);
      }
      setContentCounts(map);
      setMsg("更新しました。");
      return result;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "操作に失敗しました。");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  return (
    <CreatorShell>
      <h2 className="shell-page-heading">教科マスタ</h2>
      {loading ? <p className="admin-loading">読み込み中…</p> : null}
      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}
      {msg ? <p className="admin-msg admin-msg--ok">{msg}</p> : null}
      {!ws && !loading ? (
        <p className="admin-msg admin-msg--error">ワークスペースが見つかりません。</p>
      ) : null}
      {ws && !loading ? (
        <SubjectMasterPanel
          subjects={subjects}
          contentCountBySubject={contentCountBySubject}
          busy={busy}
          onCreate={(input) => run(() => createWorkspaceSubject(ws.id, input))}
          onUpdate={(id, patch) => run(() => updateWorkspaceSubject(ws.id, id, patch))}
          onDelete={(id) => run(() => deleteWorkspaceSubject(ws.id, id))}
        />
      ) : null}
    </CreatorShell>
  );
}
