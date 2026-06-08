"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { SubjectMasterPanel } from "@/components/admin/SubjectMasterPanel";
import {
  createSubject,
  deleteSubject,
  ensureDefaultSubjects,
  listContents,
  listSubjects,
  updateSubject,
} from "@/lib/content/firestore";
import type { SubjectDoc } from "@/lib/content/types";

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const reload = useCallback(async () => {
    await ensureDefaultSubjects();
    const [s, contents] = await Promise.all([listSubjects(), listContents()]);
    setSubjects(s);
    return contents;
  }, []);

  const [contentCounts, setContentCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    void (async () => {
      try {
        const contents = await reload();
        const map = new Map<string, number>();
        for (const c of contents) {
          map.set(c.subjectId, (map.get(c.subjectId) ?? 0) + 1);
        }
        setContentCounts(map);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "読み込みに失敗しました。");
      } finally {
        setLoading(false);
      }
    })();
  }, [reload]);

  const contentCountBySubject = useMemo(() => contentCounts, [contentCounts]);

  async function run<T>(fn: () => Promise<T>): Promise<T> {
    setBusy(true);
    setErr("");
    setMsg("");
    try {
      const result = await fn();
      const contents = await reload();
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
    <AdminShell title="教科マスタ">
      {loading ? <p className="admin-loading">読み込み中…</p> : null}
      {err ? <p className="admin-msg admin-msg--error">{err}</p> : null}
      {msg ? <p className="admin-msg admin-msg--ok">{msg}</p> : null}
      {!loading ? (
        <SubjectMasterPanel
          subjects={subjects}
          contentCountBySubject={contentCountBySubject}
          busy={busy}
          onCreate={(input) => run(() => createSubject(input))}
          onUpdate={(id, patch) => run(() => updateSubject(id, patch))}
          onDelete={(id) => run(() => deleteSubject(id))}
        />
      ) : null}
    </AdminShell>
  );
}
