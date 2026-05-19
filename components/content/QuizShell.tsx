"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect } from "react";
import type { ContentDoc } from "@/lib/content/types";

declare global {
  interface Window {
    __STUDY_PARK_QUIZ__?: {
      slug: string;
      title: string;
      questions: NonNullable<ContentDoc["quiz"]>["questions"];
    };
  }
}

type Props = {
  content: ContentDoc;
};

const ASSET_V = "7";

export function QuizShell({ content }: Props) {
  const title = content.title;
  const intro = content.intro ?? "問題に挑戦してみましょう。";

  useEffect(() => {
    window.__STUDY_PARK_QUIZ__ = {
      slug: content.slug,
      title: content.title,
      questions: content.quiz?.questions ?? [],
    };
  }, [content]);

  return (
    <>
      <header className="app-header app-header--unified">
        <Link href="/" className="app-header-logo-link" aria-label="トップへ">
          <img
            className="app-header-logo"
            src="/study-park-logo.png?v=8"
            alt=""
            width={48}
            height={48}
          />
        </Link>
        <h1 className="app-header-title">{title}</h1>
        <div className="app-header-toolbar">
          <div className="app-header-format-row">
            <label className="format-field">
              <span className="format-field-label">出題形式</span>
              <select id="formatSelect" className="format-select" aria-label="出題形式">
                <option value="sequential-full">順番に出題</option>
                <option value="random-full">ランダムに出題</option>
                <option value="weak">苦手問題を出題</option>
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
          連続 <strong id="streak">0</strong>
        </span>
        <span className="stat-pill">
          最高 <strong id="highStreak">0</strong>
        </span>
        <span className="stat-pill">
          マスター <strong id="masteredCount">0 / 10</strong>
        </span>
        <div className="session-progress" aria-hidden="true">
          <div id="sessionFill" className="session-progress-fill" />
        </div>
      </div>

      <section id="characterPanel" className="character-panel" aria-live="polite">
        <p id="speech" className="speech-bubble">
          10問チャレンジ！ がんばって！
        </p>
        <div id="charSingle" className="char-single">
          <div className="char-img-wrap">
            <div className="fx-layer" aria-hidden="true">
              <div className="fx-stars" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
            <img id="charImg" src="/orange.png" alt="みかんぼうや" />
          </div>
          <p id="charLabel" className="char-label">
            🍊 みかんぼうや
          </p>
        </div>
        <div id="charSquad" className="char-squad" hidden>
          <div id="squadGrid" className="squad-grid" />
          <p className="char-label squad-caption">みんなで応援中！</p>
        </div>
      </section>

      <main className="quiz-main">
        <section className="intro-card" aria-labelledby="intro-heading">
          <h2 id="intro-heading" className="intro-heading">
            はじめに
          </h2>
          <p className="intro-body">{intro}</p>
        </section>

        <section id="questionCard" className="question-card">
          <p id="questionLabel" className="question-label">
            問1
          </p>
          <p id="questionBody" className="question-body" aria-live="polite" />
          <p id="thinkHint" className="think-hint">
            心のなかで答えをかんがえてね
          </p>
          <div id="answerReveal" className="answer-reveal" hidden>
            <p className="answer-reveal-title">答え</p>
            <ul id="answerList" className="answer-list" />
            <p className="self-grade-hint">思い浮かんだ？ 自分でチェックしてね</p>
          </div>
        </section>

        <div className="answer-actions">
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

      <div
        id="celebrateBanner"
        className="celebrate-banner"
        role="status"
        aria-live="assertive"
      />

      <div id="celebrateModal" className="modal-backdrop" hidden>
        <div
          className="celebrate-modal-card"
          id="celebrateModalCard"
          role="dialog"
          aria-modal="true"
        >
          <p id="celebrateModalTitle" className="celebrate-modal-title" />
          <p id="celebrateModalMsg" className="celebrate-modal-msg" />
          <img
            id="celebrateModalImg"
            className="celebrate-modal-img"
            src="/characters.png"
            alt="みんなでお祝い"
            hidden
          />
          <div className="celebrate-modal-actions">
            <button type="button" id="btnModalRestart" className="btn-primary">
              もういちど
            </button>
            <button type="button" id="btnModalClose" className="btn-secondary" hidden>
              とじる
            </button>
          </div>
        </div>
      </div>

      <Script src={`/study-park-asset-version.js?v=${ASSET_V}`} strategy="afterInteractive" />
      <Script src="/shared/quiz-format.js?v=11" strategy="afterInteractive" />
      <Script src="/shared/quiz-streak-fx.js?v=10" strategy="afterInteractive" />
      <Script src={`/pwa-update.js?v=${ASSET_V}`} strategy="afterInteractive" />
      <Script src="/shared/quiz-blank-characters.js?v=1" strategy="afterInteractive" />
      <Script src="/shared/quiz-blank-storage.js?v=1" strategy="afterInteractive" />
      <Script
        src="/shared/quiz-blank-app.js?v=2"
        strategy="afterInteractive"
        key={content.slug}
      />
    </>
  );
}
