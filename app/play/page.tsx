"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { User } from "firebase/auth";
import { Suspense, useEffect, useRef, useState } from "react";
import { getPublishedContentBySlug } from "@/lib/content/public-firestore";
import type { ContentDoc } from "@/lib/content/types";
import { resolveAuthSession, subscribeAuth, waitForAuthReady } from "@/lib/firebase/auth-client";
import { getWorkspaceShowAds } from "@/lib/workspaces/ad-flags";
import {
  getPublishedWorkspaceContentById,
  getPublishedWorkspaceContentBySlug,
  getPublishedWorkspaceContentInWorkspace,
  type WorkspaceContentDoc,
} from "@/lib/workspaces/content-firestore";
import {
  canLearnerAccessWorkspace,
  canLearnerAccessWorkspaceById,
} from "@/lib/workspaces/members";
import { recordGuestContentUse } from "@/lib/users/guest-learner";

const QuizShell = dynamic(
  () => import("@/components/content/QuizShell").then((m) => m.QuizShell),
  { loading: () => <p className="play-status">教材を読み込み中…</p> },
);

const LessonView = dynamic(
  () => import("@/components/content/LessonView").then((m) => m.LessonView),
  { loading: () => <p className="play-status">教材を読み込み中…</p> },
);

function playLoadKey(
  slug: string,
  wsSlug: string,
  workspaceId: string,
  contentId: string,
): string {
  return `${slug}|${wsSlug}|${workspaceId}|${contentId}`;
}

async function fetchWorkspacePlayContent(
  wsSlug: string,
  workspaceId: string,
  contentId: string,
  slug: string,
  uid: string | null,
): Promise<WorkspaceContentDoc | null> {
  if (workspaceId && contentId) {
    return getPublishedWorkspaceContentById(workspaceId, contentId);
  }
  if (workspaceId && slug) {
    return getPublishedWorkspaceContentInWorkspace(workspaceId, slug);
  }
  if (slug) {
    return getPublishedWorkspaceContentBySlug(wsSlug, slug, uid);
  }
  return null;
}

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
  const loadedRef = useRef<{ uid: string | null; key: string } | null>(null);

  useEffect(() => {
    if (!slug && !contentId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    let cancelled = false;
    let unsub: (() => void) | undefined;
    const loadKey = playLoadKey(slug, wsSlug, workspaceId, contentId);
    const isWorkspacePlay = !!(wsSlug || workspaceId);

    async function load(authUser: User | null) {
      if (cancelled) return;

      const uid = authUser?.uid ?? null;
      const isRepeat =
        loadedRef.current?.uid === uid && loadedRef.current?.key === loadKey;
      if (!isRepeat) {
        setLoading(true);
        setNotFound(false);
        setDenied(false);
        setContent(null);
      }

      try {
        const sessionPromise = resolveAuthSession(authUser);

        if (isWorkspacePlay) {
          const docPromise = fetchWorkspacePlayContent(
            wsSlug,
            workspaceId,
            contentId,
            slug,
            uid,
          );
          const [session, doc] = await Promise.all([sessionPromise, docPromise]);
          if (cancelled) return;

          setHomeHref(session === "learner" ? "/learner" : "/");

          if (!doc) {
            if (!uid) {
              setDenied(true);
              return;
            }
            setNotFound(true);
            return;
          }

          const isPublicish =
            doc.visibility === "public" || doc.visibility === "unlisted";
          const accessPromise =
            isPublicish && !uid
              ? Promise.resolve(true)
              : workspaceId
                ? canLearnerAccessWorkspaceById(workspaceId, uid, doc.visibility)
                : canLearnerAccessWorkspace(wsSlug, uid, doc.visibility);

          const [allowed, ads] = await Promise.all([
            accessPromise,
            getWorkspaceShowAds(doc.workspaceId),
          ]);
          if (cancelled) return;

          if (!allowed) {
            setDenied(true);
            return;
          }

          setContent(doc);
          setShowAds(ads);
          loadedRef.current = { uid, key: loadKey };

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

          const [session, doc] = await Promise.all([
            sessionPromise,
            getPublishedContentBySlug(slug),
          ]);
          if (cancelled) return;

          setHomeHref(session === "learner" ? "/learner" : "/");

          if (!doc) {
            setNotFound(true);
          } else {
            setContent(doc);
            setShowAds(false);
            loadedRef.current = { uid, key: loadKey };
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
        const uid = user?.uid ?? null;
        if (
          loadedRef.current?.uid === uid &&
          loadedRef.current?.key === loadKey
        ) {
          return;
        }
        void load(user);
      });
    });

    return () => {
      cancelled = true;
      unsub?.();
      loadedRef.current = null;
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
