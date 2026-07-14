"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { AdSenseUnit } from "@/components/ads/AdSenseUnit";
import { PlayAppMenu } from "@/components/content/PlayAppMenu";
import { PlayFinishNav } from "@/components/content/PlayFinishNav";
import { materialsHrefForHome, type PlayNav } from "@/lib/content/play-nav";
import type { ContentDoc } from "@/lib/content/types";
import { hasIntroText, normalizeIntroText } from "@/lib/content/intro";
import { richTextToHtml } from "@/lib/content/rich-text";

declare global {
  interface Window {
    __STUDY_PARK_QUIZ__?: {
      slug: string;
      title: string;
      questions: NonNullable<ContentDoc["quiz"]>["questions"];
      showAds?: boolean;
    };
  }
}

type Props = {
  content: ContentDoc;
  /** 無料枠ワークスペースの教材のみ true */
  showAds?: boolean;
  /** ロゴのリンク先（学習者は /learner） */
  homeHref?: string;
  /** 完了後の次教材ナビ（未設定時は教材一覧リンクのみ） */
  playNav?: PlayNav | null;
};

const ASSET_V = "8";

export function QuizShell({
  content,
  showAds = false,
  homeHref = "/",
  playNav = null,
}: Props) {
  const title = content.title;
  const introText = normalizeIntroText(content.intro);
  const showIntro = hasIntroText(introText);
  const [showFinishAd, setShowFinishAd] = useState(false);
  const finishNav: PlayNav = playNav ?? {
    materialsHref: materialsHrefForHome(homeHref),
    next: null,
    more: [],
  };

  useEffect(() => {
    window.__STUDY_PARK_QUIZ__ = {
      slug: content.slug,
      title: content.title,
      questions: content.quiz?.questions ?? [],
      showAds,
    };
  }, [content, showAds]);

  useEffect(() => {
    if (!showAds) {
      setShowFinishAd(false);
      return;
    }
    const onFinished = () => setShowFinishAd(true);
    const onModalClosed = () => setShowFinishAd(false);
    window.addEventListener("study-park-quiz-finished", onFinished);
    window.addEventListener("study-park-quiz-modal-closed", onModalClosed);
    return () => {
      window.removeEventListener("study-park-quiz-finished", onFinished);
      window.removeEventListener("study-park-quiz-modal-closed", onModalClosed);
    };
  }, [showAds]);

  return (
    <>
      <header className="app-header app-header--unified app-header--with-menu">
        <Link
          href={homeHref}
          className="app-header-logo-link"
          aria-label={homeHref === "/learner" ? "学習管理へ" : "トップへ"}
        >
          <img
            className="app-header-logo"
            src="/study-park-logo.png?v=8"
            alt=""
            width={48}
            height={48}
          />
        </Link>
        <h1 className="app-header-title">{title}</h1>
        <PlayAppMenu ariaLabel="学習メニュー" />
        <div className="app-header-toolbar">
          <div className="app-header-format-row">
            <label className="format-field">
              <span className="format-field-label">出題形式</span>
              <select id="formatSelect" className="format-select" aria-label="出題形式">
                <option value="sequential-full">順番に出題</option>
                <option value="random-full">ランダムに出題</option>
                <option value="weak">苦手問題を出題</option>
                <option value="review-all">まとめて確認</option>
              </select>
            </label>
            <div className="app-header-utils">
              <button type="button" id="btnUpdate" className="btn-header-util btn-update">
                更新
              </button>
              <button
                type="button"
                id="btnResetWeak"
                aria-label="苦手をリセット"
                className="btn-header-util btn-reset-weak"
              >
                リセット
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="stats-bar" aria-live="polite">
        <span className="stat-pill">
          第 <strong id="questionNum">1</strong> / <strong id="sessionTotal">10</strong> 問
        </span>
        <span className="stat-pill">
          苦手 <strong id="weakCount">0</strong> 件
        </span>
        <span className="stat-pill">
          できた <strong id="sessionScore">0</strong>
        </span>
        <span className="stat-pill">
          マスター <strong id="masteredCount">0 / 10</strong>
        </span>
        <div className="session-progress" aria-hidden="true">
          <div id="sessionFill" className="session-progress-fill" />
        </div>
      </div>

      <main className="quiz-main">
        {showIntro ? (
          <section className="intro-card" aria-labelledby="intro-heading">
            <h2 id="intro-heading" className="intro-heading">
              はじめに
            </h2>
            <div
              className="intro-body"
              dangerouslySetInnerHTML={{
                __html: richTextToHtml(introText, "intro-body"),
              }}
            />
          </section>
        ) : null}

        <section id="reviewPanel" className="review-panel" hidden aria-label="まとめて確認">
          <h2 className="review-panel-heading">まとめて確認</h2>
          <p className="review-panel-lead">
            全問の問題と答えを一覧で見ながら、スクロールして復習できます。
          </p>
          <div id="reviewList" className="review-list" />
        </section>

        <section id="questionCard" className="question-card">
          <p id="questionLabel" className="question-label">
            問1
          </p>
          <div id="questionBody" className="question-body" aria-live="polite" />
          <p id="thinkHint" className="think-hint">
            心のなかで答えをかんがえてね
          </p>
          <div id="answerReveal" className="answer-reveal" hidden>
            <p className="answer-reveal-title">答え</p>
            <ul id="answerList" className="answer-list" />
            <p className="self-grade-hint">思い浮かんだ？ 自分でチェックしてね</p>
          </div>
        </section>

        <div id="answerActions" className="answer-actions">
          <div className="answer-actions-row">
            <button type="button" id="btnReveal" className="btn-primary">
              答えを見る
            </button>
            <button type="button" id="btnQuit" className="btn-quit">
              やめる
            </button>
          </div>
          <div id="selfGrade" className="self-grade" hidden>
            <button type="button" id="btnOk" className="btn-ok">
              できた
            </button>
            <button type="button" id="btnNg" className="btn-ng">
              できない
            </button>
          </div>
        </div>
      </main>

      <div id="celebrateModal" className="modal-backdrop" hidden>
        <div
          className="celebrate-modal-card"
          id="celebrateModalCard"
          role="dialog"
          aria-modal="true"
        >
          <p id="celebrateModalTitle" className="celebrate-modal-title" />
          <p id="celebrateModalMsg" className="celebrate-modal-msg" />
          {showAds && showFinishAd ? (
            <AdSenseUnit slotKey="quiz_finish" className="adsense-unit--modal" />
          ) : null}
          <div className="celebrate-modal-actions">
            <button type="button" id="btnModalRestart" className="btn-primary">
              もういちど
            </button>
            <PlayFinishNav nav={finishNav} variant="modal" />
            <button type="button" id="btnModalClose" className="btn-secondary" hidden>
              とじる
            </button>
          </div>
        </div>
      </div>

      <Script src={`/study-park-asset-version.js?v=${ASSET_V}`} strategy="afterInteractive" />
      <Script src="/shared/quiz-format.js?v=13" strategy="afterInteractive" />
      <Script src="/shared/quiz-review-mode.js?v=3" strategy="afterInteractive" />
      <Script src="/shared/quiz-review-controller.js?v=2" strategy="afterInteractive" />
      <Script src={`/pwa-update.js?v=${ASSET_V}`} strategy="afterInteractive" />
      <Script src="/shared/quiz-blank-storage.js?v=1" strategy="afterInteractive" />
      <Script
        src="/shared/quiz-blank-app.js?v=9"
        strategy="afterInteractive"
        key={content.slug}
      />
    </>
  );
}
