"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { User } from "firebase/auth";
import { Suspense, useEffect, useState } from "react";
import { LessonView } from "@/components/content/LessonView";
import { QuizShell } from "@/components/content/QuizShell";
import { getPublishedContentBySlug } from "@/lib/content/public-firestore";
import type { ContentDoc } from "@/lib/content/types";
import { resolveAuthSession, subscribeAuth, waitForAuthReady } from "@/lib/firebase/auth-client";
import { getWorkspaceShowAds } from "@/lib/workspaces/ad-flags";
import {
  getPublishedWorkspaceContentById,
  getPublishedWorkspaceContentBySlug,
  getPublishedWorkspaceContentInWorkspace,
} from "@/lib/workspaces/content-firestore";
import {
  canLearnerAccessWorkspace,
  canLearnerAccessWorkspaceById,
} from "@/lib/workspaces/members";
import { recordGuestContentUse } from "@/lib/users/guest-learner";

function PlayInner() {
  const params = useSearchParams();
  const wsSlug = (params.get("ws") ?? "").trim().toLowerCase();
  const workspaceId = (params.get("wid") ?? "").trim();
  const contentId = (params.get("cid") ?? "").trim();
  const slug = (params.get("slug") ?? "").trim().toLowerCase();
  const [content, setContent] = useState<ContentDoc | null>(null);
  const [showAds, setShowAds] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [denied, setDenied] = useState(false);
  const [homeHref, setHomeHref] = useState("/");

  useEffect(() => {
    if (!slug && !contentId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    let cancelled = false;
    let unsub: (() => void) | undefined;

    async function load(authUser: User | null) {
      if (cancelled) return;
      setLoading(true);
      setNotFound(false);
      setDenied(false);
      setContent(null);

      try {
        const uid = authUser?.uid ?? null;
        const session = await resolveAuthSession(authUser);
        const isWorkspacePlay = !!(wsSlug || workspaceId);
        setHomeHref(session === "learner" && isWorkspacePlay ? "/learner" : "/");

        if (isWorkspacePlay) {
          const doc =
            workspaceId && contentId
              ? await getPublishedWorkspaceContentById(workspaceId, contentId)
              : workspaceId && slug
                ? await getPublishedWorkspaceContentInWorkspace(workspaceId, slug)
                : slug
                  ? await getPublishedWorkspaceContentBySlug(wsSlug, slug, uid)
                  : null;
          if (cancelled) return;
          if (!doc) {
            if (!uid) {
              setDenied(true);
              return;
            }
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
          setShowAds(await getWorkspaceShowAds(doc.workspaceId));
          if (!uid) {
            const ref = workspaceId
              ? `play:wid=${workspaceId}&slug=${slug || doc.slug}`
              : `play:ws=${wsSlug}&slug=${slug || doc.slug}`;
            void recordGuestContentUse(ref);
          }
        } else {
          if (!slug) {
            setNotFound(true);
            return;
          }
          const doc = await getPublishedContentBySlug(slug);
          if (cancelled) return;
          if (!doc) {
            setNotFound(true);
          } else {
            setContent(doc);
            setShowAds(false);
            if (!uid) {
              void recordGuestContentUse(`play:slug=${slug}`);
            }
          }
        }
      } catch (e) {
        console.error("Play: content load failed", e);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void waitForAuthReady().then(() => {
      if (cancelled) return;
      unsub = subscribeAuth((user) => {
        void load(user);
      });
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [slug, wsSlug, workspaceId, contentId]);

  if ((!slug && !contentId) || notFound) {
    return (
      <div className="play-status">
        <p>コンテンツが見つからないか、まだ公開されていません。</p>
        <p>
          <Link href={homeHref}>トップへ戻る</Link>
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
    return <QuizShell content={content} showAds={showAds} homeHref={homeHref} />;
  }

  return <LessonView content={content} homeHref={homeHref} />;
}

export default function PlayPage() {
  return (
    <Suspense fallback={<p className="play-status">読み込み中…</p>}>
      <PlayInner />
    </Suspense>
  );
}
