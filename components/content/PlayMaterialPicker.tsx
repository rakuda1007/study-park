"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import type { PlayNav, PlayNavItem } from "@/lib/content/play-nav";

export type QuizSwitchSnapshot = {
  kind: "challenge" | "review";
  finished: boolean;
  atQuestion: number;
  total: number;
  correct: number;
  /** 答え表示中で未採点 */
  pendingGrade: boolean;
  /** 今回セッションで自己採点した問いの数（完了済み） */
  gradedCount: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  nav: PlayNav;
  contentType: "lesson" | "quiz";
  /** クイズのみ。開いた瞬間のスナップショット */
  quizSnapshot?: QuizSwitchSnapshot | null;
};

function typeLabel(type: "quiz" | "lesson"): string {
  return type === "quiz" ? "クイズ" : "レッスン";
}

function QuizStatus({ snap }: { snap: QuizSwitchSnapshot }) {
  if (snap.kind === "review") {
    return (
      <div className="play-material-picker__status">
        <p className="play-material-picker__status-title">いまの状況</p>
        <ul className="play-material-picker__status-list">
          <li>まとめて確認モードです</li>
          <li>別の教材に移っても、苦手・マスターの記録はそのままです</li>
        </ul>
      </div>
    );
  }

  if (snap.finished) {
    return (
      <div className="play-material-picker__status">
        <p className="play-material-picker__status-title">いまの状況</p>
        <ul className="play-material-picker__status-list">
          <li>このチャレンジはすでに終わっています</li>
          <li>答えた分の苦手・マスターはそのまま残っています</li>
        </ul>
      </div>
    );
  }

  if (snap.gradedCount <= 0 && !snap.pendingGrade) {
    return (
      <div className="play-material-picker__status">
        <p className="play-material-picker__status-title">いまの状況</p>
        <ul className="play-material-picker__status-list">
          <li>まだ答えのチェックをしていません</li>
          <li>このまま別教材へ移っても、記録は変わりません</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="play-material-picker__status">
      <p className="play-material-picker__status-title">いまの状況</p>
      <ul className="play-material-picker__status-list">
        <li>
          第 {snap.atQuestion} / {snap.total} 問のところで中断します
        </li>
        <li>
          できた {snap.correct} 問（今回のチャレンジ）
        </li>
        <li>答えた分の苦手・マスターなどの記録はそのまま残ります</li>
        <li>ベスト記録は、最後までやりきったときだけ更新されます（更新されません）</li>
        {snap.pendingGrade ? (
          <li>いまの問題はまだチェック前です。苦手／マスターには入っていません</li>
        ) : null}
      </ul>
    </div>
  );
}

function MaterialList({
  items,
  currentId,
  materialsHref,
}: {
  items: PlayNavItem[];
  currentId: string;
  materialsHref: string;
}) {
  const others = items.filter((item) => item.id !== currentId);

  return (
    <div className="play-material-picker__list-wrap">
      <p className="play-material-picker__list-heading">同じ教科の教材</p>
      {others.length === 0 ? (
        <p className="play-material-picker__empty">同じ教科のほかの教材はありません</p>
      ) : (
        <ul className="play-material-picker__list">
          {others.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="play-material-picker__link">
                <span className="play-material-picker__link-title">{item.title}</span>
                <span className="play-material-picker__link-meta">{typeLabel(item.type)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href={materialsHref} className="play-material-picker__materials">
        教材一覧へ
      </Link>
    </div>
  );
}

/** 学習中に同教科の別教材へ切り替えるパネル */
export function PlayMaterialPicker({
  open,
  onClose,
  nav,
  contentType,
  quizSnapshot = null,
}: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const siblings = nav.siblings.length > 0 ? nav.siblings : [...(nav.next ? [nav.next] : []), ...nav.more];

  return (
    <div
      className="play-material-picker-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="play-material-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="play-material-picker__header">
          <h2 id={titleId} className="play-material-picker__title">
            教材を選ぶ
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="play-material-picker__close"
            onClick={onClose}
          >
            とじる
          </button>
        </div>

        {contentType === "quiz" && quizSnapshot ? (
          <>
            <p className="play-material-picker__lead">
              このクイズを中断して、別の教材に移れます。
            </p>
            <QuizStatus snap={quizSnapshot} />
          </>
        ) : (
          <p className="play-material-picker__lead">
            同じ教科のほかの教材に切り替えられます。
          </p>
        )}

        <MaterialList
          items={siblings}
          currentId={nav.currentId}
          materialsHref={nav.materialsHref}
        />

        <button type="button" className="play-material-picker__continue" onClick={onClose}>
          {contentType === "quiz" ? "いまのクイズを続ける" : "いまの教材に戻る"}
        </button>
      </div>
    </div>
  );
}
