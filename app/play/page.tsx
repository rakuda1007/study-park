"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LessonView } from "@/components/content/LessonView";
import { QuizShell } from "@/components/content/QuizShell";
import { getPublishedContentBySlug } from "@/lib/content/public-firestore";
import type { ContentDoc } from "@/lib/content/types";
import { subscribeAuth, waitForAuthReady } from "@/lib/firebase/auth-client";
import {
  getPublishedWorkspaceContentBySlug,
  getPublishedWorkspaceContentInWorkspace,
} from "@/lib/workspaces/content-firestore";
import {
  canLearnerAccessWorkspace,
  canLearnerAccessWorkspaceById,
} from "@/lib/workspaces/members";

function PlayInner() {
  const params = useSearchParams();
  const wsSlug = (params.get("ws") ?? "").trim().toLowerCase();
  const workspaceId = (params.get("wid") ?? "").trim();
  const slug = (params.get("slug") ?? "").trim().toLowerCase();
  const [content, setContent] = useState<ContentDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setNotFound(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setNotFound(false);
      setDenied(false);
      try {
        if (wsSlug || workspaceId) {
          await waitForAuthReady();
          const uid = await new Promise<string | null>((resolve) => {
            const unsub = subscribeAuth((user) => {
              unsub();
              resolve(user?.uid ?? null);
            });
          });
          const doc = workspaceId
            ? await getPublishedWorkspaceContentInWorkspace(workspaceId, slug)
            : await getPublishedWorkspaceContentBySlug(wsSlug, slug, uid);
          if (cancelled) return;
          if (!doc) {
            setNotFound(true);
            return;
          }
          const allowed = workspaceId
            ? await canLearnerAccessWorkspaceById(workspaceId, uid, doc.visibility)
            : await canLearnerAccessWorkspace(wsSlug, uid, doc.visibility);
          if (!allowed) {
            setDenied(true);
            return;
          }
          setContent(doc);
        } else {
          const doc = await getPublishedContentBySlug(slug);
          if (cancelled) return;
          if (!doc) {
            setNotFound(true);
          } else {
            setContent(doc);
          }
        }
      } catch (e) {
        console.error("Play: content load failed", e);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, wsSlug, workspaceId]);

  if (!slug || notFound) {
    return (
      <div className="play-status">
        <p>コンテンツが見つからないか、まだ公開されていません。</p>
        <p>
          <Link href="/">トップへ戻る</Link>
        </p>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="play-status">
        <p>この教材はログインした学習者のみ利用できます。</p>
        <p>
          <Link href="/login">ログイン</Link> · <Link href="/signup/learner">学習者登録</Link>
        </p>
      </div>
    );
  }

  if (loading || !content) {
    return <p className="play-status">読み込み中…</p>;
  }

  if (content.type === "quiz") {
    return <QuizShell content={content} />;
  }

  return <LessonView content={content} />;
}

export default function PlayPage() {
  return (
    <Suspense fallback={<p className="play-status">読み込み中…</p>}>
      <PlayInner />
    </Suspense>
  );
}
