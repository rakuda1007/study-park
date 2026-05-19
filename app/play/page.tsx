"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LessonView } from "@/components/content/LessonView";
import { QuizShell } from "@/components/content/QuizShell";
import { getPublishedContentBySlug } from "@/lib/content/public-firestore";
import type { ContentDoc } from "@/lib/content/types";

function PlayInner() {
  const params = useSearchParams();
  const slug = (params.get("slug") ?? "").trim().toLowerCase();
  const [content, setContent] = useState<ContentDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
      try {
        const doc = await getPublishedContentBySlug(slug);
        if (cancelled) return;
        if (!doc) {
          setContent(null);
          setNotFound(true);
        } else {
          setContent(doc);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

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
