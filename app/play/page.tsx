"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { User } from "firebase/auth";
import { Suspense, useEffect, useRef, useState } from "react";
import { buildPlayNav, materialsHrefForHome, type PlayNav } from "@/lib/content/play-nav";
import { listPublishedContents, getPublishedContentBySlug } from "@/lib/content/public-firestore";
import type { ContentDoc } from "@/lib/content/types";
import { resolveAuthSession, subscribeAuth, waitForAuthReady } from "@/lib/firebase/auth-client";
import { getWorkspaceShowAds } from "@/lib/workspaces/ad-flags";
import {
  getPublishedWorkspaceContentById,
  getPublishedWorkspaceContentBySlug,
  getPublishedWorkspaceContentInWorkspace,
  getWorkspaceContentForOwnerPreview,
  listPublishedContentsForMember,
  type WorkspaceContentDoc,
} from "@/lib/workspaces/content-firestore";
import { getWorkspace } from "@/lib/workspaces/firestore";
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
  preview: boolean,
): string {
  return `${slug}|${wsSlug}|${workspaceId}|${contentId}|${preview ? "1" : "0"}`;
}

async function fetchWorkspacePlayContent(
  wsSlug: string,
  workspaceId: string,
  contentId: string,
  slug: string,
  uid: string | null,
  preview: boolean,
): Promise<WorkspaceContentDoc | null> {
  if (preview && workspaceId && uid) {
    return getWorkspaceContentForOwnerPreview(workspaceId, uid, {
      contentId: contentId || undefined,
      slug: slug || undefined,
    });
  }
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

async function resolveWorkspacePlayNav(
  doc: WorkspaceContentDoc,
  wsSlug: string,
  materialsHref: string,
): Promise<PlayNav> {
  let workspaceSlug = wsSlug;
  if (!workspaceSlug) {
    const ws = await getWorkspace(doc.workspaceId);
    workspaceSlug = ws?.slug ?? "";
  }
  const siblings = await listPublishedContentsForMember(doc.workspaceId);
  const subjectItems = siblings
    .filter((c) => c.subjectId === doc.subjectId)
    .map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      slug: c.slug,
      order: c.order,
      workspaceId: c.workspaceId,
    }));
  return buildPlayNav(subjectItems, doc.id, materialsHref, workspaceSlug || null);
}

async function resolveOfficialPlayNav(
  doc: ContentDoc,
  materialsHref: string,
): Promise<PlayNav> {
  const siblings = await listPublishedContents();
  const subjectItems = siblings
    .filter((c) => c.subjectId === doc.subjectId)
    .map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      slug: c.slug,
      order: c.order,
    }));
  return buildPlayNav(subjectItems, doc.id, materialsHref, null);
}

function PlayPreviewBanner() {
  return (
    <div className="play-preview-banner" role="status">
      プレビュー（非公開）— あなただけが閲覧しています
    </div>
  );
}

function PlayInner() {
  const params = useSearchParams();
  const wsSlug = (params.get("ws") ?? "").trim().toLowerCase();
  const workspaceId = (params.get("wid") ?? "").trim();
  const contentId = (params.get("cid") ?? "").trim();
  const slug = (params.get("slug") ?? "").trim().toLowerCase();
  const preview = params.get("preview") === "1";
  const [content, setContent] = useState<ContentDoc | null>(null);
  const [showAds, setShowAds] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [denied, setDenied] = useState(false);
  const [homeHref, setHomeHref] = useState("/");
  const [playNav, setPlayNav] = useState<PlayNav | null>(null);
  const loadedRef = useRef<{ uid: string | null; key: string } | null>(null);

  useEffect(() => {
    if (!slug && !contentId) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    let cancelled = false;
    let unsub: (() => void) | undefined;
    const loadKey = playLoadKey(slug, wsSlug, workspaceId, contentId, preview);
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
        setIsPreview(false);
        setContent(null);
        setPlayNav(null);
      }

      try {
        const sessionPromise = resolveAuthSession(authUser);

        if (isWorkspacePlay) {
          if (preview && !uid) {
            const session = await sessionPromise;
            if (cancelled) return;
            setHomeHref(session === "learner" ? "/learner" : "/creator");
            setDenied(true);
            return;
          }

          const docPromise = fetchWorkspacePlayContent(
            wsSlug,
            workspaceId,
            contentId,
            slug,
            uid,
            preview,
          );
          const [session, doc] = await Promise.all([sessionPromise, docPromise]);
          if (cancelled) return;

          const nextHome =
            preview || session === "creator"
              ? "/creator"
              : session === "learner"
                ? "/learner"
                : "/";
          setHomeHref(nextHome);

          if (!doc) {
            if (!uid) {
              setDenied(true);
              return;
            }
            setNotFound(true);
            return;
          }

          const materialsHref = materialsHrefForHome(nextHome);
          const navPromise = resolveWorkspacePlayNav(doc, wsSlug, materialsHref);

          const ownerPreview = preview && doc.status !== "published";
          if (ownerPreview) {
            const nav = await navPromise;
            if (cancelled) return;
            setContent(doc);
            setShowAds(false);
            setIsPreview(true);
            setPlayNav(nav);
            loadedRef.current = { uid, key: loadKey };
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

          const [allowed, ads, nav] = await Promise.all([
            accessPromise,
            getWorkspaceShowAds(doc.workspaceId),
            navPromise,
          ]);
          if (cancelled) return;

          if (!allowed) {
            setDenied(true);
            return;
          }

          setContent(doc);
          setShowAds(ads);
          setIsPreview(false);
          setPlayNav(nav);
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

          const nextHome = session === "learner" ? "/learner" : "/";
          setHomeHref(nextHome);

          if (!doc) {
            setNotFound(true);
          } else {
            const nav = await resolveOfficialPlayNav(
              doc,
              materialsHrefForHome(nextHome),
            );
            if (cancelled) return;
            setContent(doc);
            setShowAds(false);
            setIsPreview(false);
            setPlayNav(nav);
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
  }, [slug, wsSlug, workspaceId, contentId, preview]);

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
        <p>
          {preview
            ? "プレビューはクリエイター本人のログインが必要です。"
            : "この教材はログインした学習者のみ利用できます。"}
        </p>
        <p>
          <Link href="/login">ログイン</Link>
          {!preview ? (
            <>
              {" "}
              · <Link href="/signup/learner">学習者登録</Link>
            </>
          ) : null}
        </p>
      </div>
    );
  }

  if (loading || !content) {
    return <p className="play-status">読み込み中…</p>;
  }

  if (content.type === "quiz") {
    return (
      <>
        {isPreview ? <PlayPreviewBanner /> : null}
        <QuizShell
          content={content}
          showAds={showAds}
          homeHref={homeHref}
          playNav={playNav}
        />
      </>
    );
  }

  return (
    <>
      {isPreview ? <PlayPreviewBanner /> : null}
      <LessonView content={content} homeHref={homeHref} playNav={playNav} />
    </>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={<p className="play-status">読み込み中…</p>}>
      <PlayInner />
    </Suspense>
  );
}
