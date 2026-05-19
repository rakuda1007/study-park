import type { ContentDoc, ContentManifest, SubjectDoc } from "./types";
import { contentPlayHref } from "./urls";

const ASSET_V = "7";

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildQuizDataJs(content: ContentDoc): string {
  const questions = content.quiz?.questions ?? [];
  const payload = {
    slug: content.slug,
    title: content.title,
    questions,
  };
  return `/**
 * ${content.title} — 問題データ（Study Park 管理画面からエクスポート）
 */
window.__STUDY_PARK_QUIZ__ = ${JSON.stringify(payload, null, 2)};
`;
}

export function buildQuizIndexHtml(content: ContentDoc): string {
  const slug = content.slug;
  const title = escHtml(content.title);
  const intro = escHtml(content.intro ?? "問題に挑戦してみましょう。");
  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#4a6fa5" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Study Park" />
    <title>${title} | Study Park</title>
    <base href="/${slug}/" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" href="/icon-192.png" sizes="192x192" type="image/png" />
    <link rel="apple-touch-icon" href="/icon-180.png" />
    <link rel="stylesheet" href="/shared/quiz-header.css?v=16" />
    <link rel="stylesheet" href="/shared/quiz-character-fx.css?v=10" />
    <link rel="stylesheet" href="/shared/quiz-blank-style.css?v=1" />
  </head>
  <body>
    <header class="app-header app-header--unified">
      <a href="/" class="app-header-logo-link" aria-label="トップへ">
        <img class="app-header-logo" src="/study-park-logo.png?v=8" alt="" width="48" height="48" />
      </a>
      <h1 class="app-header-title">${title}</h1>
      <div class="app-header-toolbar">
        <div class="app-header-format-row">
          <label class="format-field">
            <span class="format-field-label">出題形式</span>
            <select id="formatSelect" class="format-select" aria-label="出題形式">
              <option value="sequential-full">順番に出題</option>
              <option value="random-full">ランダムに出題</option>
              <option value="weak">苦手問題を出題</option>
            </select>
          </label>
          <div class="app-header-utils">
            <button type="button" id="btnUpdate" class="btn-header-util btn-update">更新</button>
            <button type="button" id="btnResetWeak" aria-label="苦手をリセット" class="btn-header-util btn-reset-weak">リセット</button>
          </div>
        </div>
      </div>
    </header>

    <div class="stats-bar" aria-live="polite">
      <span class="stat-pill">第 <strong id="questionNum">1</strong> / <strong id="sessionTotal">10</strong> 問</span>
      <span class="stat-pill">苦手 <strong id="weakCount">0</strong> 件</span>
      <span class="stat-pill">できた <strong id="sessionScore">0</strong></span>
      <span class="stat-pill">連続 <strong id="streak">0</strong></span>
      <span class="stat-pill">最高 <strong id="highStreak">0</strong></span>
      <span class="stat-pill">マスター <strong id="masteredCount">0 / 10</strong></span>
      <div class="session-progress" aria-hidden="true">
        <div id="sessionFill" class="session-progress-fill"></div>
      </div>
    </div>

    <section id="characterPanel" class="character-panel" aria-live="polite">
      <p id="speech" class="speech-bubble">10問チャレンジ！ がんばって！</p>
      <div id="charSingle" class="char-single">
        <div class="char-img-wrap">
          <div class="fx-layer" aria-hidden="true">
            <div class="fx-stars" aria-hidden="true">
              <span></span><span></span><span></span><span></span>
              <span></span><span></span><span></span><span></span>
            </div>
          </div>
          <img id="charImg" src="/orange.png" alt="みかんぼうや" />
        </div>
        <p id="charLabel" class="char-label">🍊 みかんぼうや</p>
      </div>
      <div id="charSquad" class="char-squad" hidden>
        <div id="squadGrid" class="squad-grid"></div>
        <p class="char-label squad-caption">みんなで応援中！</p>
      </div>
    </section>

    <main class="quiz-main">
      <section class="intro-card" aria-labelledby="intro-heading">
        <h2 id="intro-heading" class="intro-heading">はじめに</h2>
        <p class="intro-body">${intro}</p>
      </section>

      <section id="questionCard" class="question-card">
        <p id="questionLabel" class="question-label">問1</p>
        <p id="questionBody" class="question-body" aria-live="polite"></p>
        <p id="thinkHint" class="think-hint">心のなかで答えをかんがえてね</p>
        <div id="answerReveal" class="answer-reveal" hidden>
          <p class="answer-reveal-title">答え</p>
          <ul id="answerList" class="answer-list"></ul>
          <p class="self-grade-hint">思い浮かんだ？ 自分でチェックしてね</p>
        </div>
      </section>

      <div class="answer-actions">
        <div class="answer-actions-row">
          <button type="button" id="btnReveal" class="btn-primary">答えを見る</button>
          <button type="button" id="btnQuit" class="btn-quit">やめる</button>
        </div>
        <div id="selfGrade" class="self-grade" hidden>
          <button type="button" id="btnOk" class="btn-ok">できた</button>
          <button type="button" id="btnNg" class="btn-ng">できない</button>
        </div>
      </div>
    </main>

    <div id="celebrateBanner" class="celebrate-banner" role="status" aria-live="assertive"></div>

    <div id="celebrateModal" class="modal-backdrop" hidden>
      <div class="celebrate-modal-card" id="celebrateModalCard" role="dialog" aria-modal="true">
        <p id="celebrateModalTitle" class="celebrate-modal-title"></p>
        <p id="celebrateModalMsg" class="celebrate-modal-msg"></p>
        <img id="celebrateModalImg" class="celebrate-modal-img" src="/characters.png" alt="みんなでお祝い" hidden />
        <div class="celebrate-modal-actions">
          <button type="button" id="btnModalRestart" class="btn-primary">もういちど</button>
          <button type="button" id="btnModalClose" class="btn-secondary" hidden>とじる</button>
        </div>
      </div>
    </div>

    <script src="/study-park-asset-version.js?v=${ASSET_V}"></script>
    <script src="/shared/quiz-format.js?v=11"></script>
    <script src="/shared/quiz-streak-fx.js?v=10"></script>
    <script src="/pwa-update.js?v=${ASSET_V}"></script>
    <script src="/${slug}/data.js?v=1"></script>
    <script src="/shared/quiz-blank-characters.js?v=1"></script>
    <script src="/shared/quiz-blank-storage.js?v=1"></script>
    <script src="/shared/quiz-blank-app.js?v=1"></script>
  </body>
</html>
`;
}

export function buildLessonIndexHtml(content: ContentDoc): string {
  const title = escHtml(content.title);
  const intro = escHtml(content.intro ?? "");
  const sections = content.lesson?.sections ?? [];

  const tocItems = sections
    .map(
      (s) =>
        `          <li><a href="#${escHtml(s.id)}">${escHtml(s.heading)}</a></li>`,
    )
    .join("\n");

  const sectionHtml = sections
    .map((s) => {
      const blocks = s.blocks
        .map((b) => {
          if (b.kind === "html") return `        ${b.html}`;
          return `        <p class="lesson-body">${escHtml(b.text)}</p>`;
        })
        .join("\n");
      return `      <article id="${escHtml(s.id)}" class="lesson-section" aria-labelledby="heading-${escHtml(s.id)}">
        <h2 id="heading-${escHtml(s.id)}">${escHtml(s.heading)}</h2>
${blocks}
      </article>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#6d4fc7" />
    <title>${title} | Study Park</title>
    <base href="/${content.slug}/" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" href="/icon-192.png" sizes="192x192" type="image/png" />
    <link rel="stylesheet" href="/shared/quiz-header.css?v=16" />
    <link rel="stylesheet" href="/${content.slug}/style.css?v=1" />
  </head>
  <body>
    <header class="app-header app-header--unified">
      <a href="/" class="app-header-logo-link" aria-label="トップへ">
        <img class="app-header-logo" src="/study-park-logo.png?v=8" alt="" width="48" height="48" />
      </a>
      <h1 class="app-header-title">${title}</h1>
    </header>
    <main class="lesson-main">
      <p class="lesson-intro">${intro}</p>
      <nav class="lesson-toc" aria-label="このページの目次">
        <p class="lesson-toc-title">もくじ</p>
        <ol class="lesson-toc-list">
${tocItems}
        </ol>
      </nav>
${sectionHtml}
    </main>
    <script src="/study-park-asset-version.js?v=${ASSET_V}"></script>
    <script src="/pwa-update.js?v=${ASSET_V}"></script>
  </body>
</html>
`;
}

export function buildLessonStyleCss(): string {
  return `/* Study Park まとめページ（管理画面エクスポート用） */
.lesson-main {
  max-width: 40rem;
  margin: 0 auto;
  padding: 1rem 1.25rem 2.5rem;
}
.lesson-intro {
  margin: 0 0 1.25rem;
  line-height: 1.7;
}
.lesson-toc {
  margin: 0 0 2rem;
  padding: 1rem;
  border-radius: 12px;
  background: #faf8ff;
  border: 1px solid #e8e4f4;
}
.lesson-toc-title {
  margin: 0 0 0.5rem;
  font-weight: 700;
}
.lesson-toc-list {
  margin: 0;
  padding-left: 1.25rem;
}
.lesson-section {
  margin-bottom: 2.5rem;
}
.lesson-section h2 {
  margin: 0 0 0.75rem;
  font-size: 1.15rem;
}
.lesson-body {
  margin: 0 0 0.75rem;
  line-height: 1.75;
}
`;
}

export function buildManifest(
  subjects: SubjectDoc[],
  contents: ContentDoc[],
  base: ContentManifest,
): ContentManifest {
  const published = contents.filter((c) => c.status === "published" && c.ready);
  const bySubject = new Map<string, ContentDoc[]>();
  for (const c of published) {
    const list = bySubject.get(c.subjectId) ?? [];
    list.push(c);
    bySubject.set(c.subjectId, list);
  }

  const subjectsOut = subjects.map((s) => {
    const fromFirestore = (bySubject.get(s.id) ?? [])
      .sort((a, b) => a.order - b.order)
      .map((c) => ({
        label: c.title,
        href: contentPlayHref(c.slug),
        ready: true,
        contentId: c.id,
      }));

    const baseSubject = base.subjects.find((b) => b.id === s.id);
    const legacy = (baseSubject?.items ?? []).filter(
      (item) => !fromFirestore.some((f) => f.href === item.href),
    );

    return {
      id: s.id,
      name: s.name,
      order: s.order,
      items: [...legacy, ...fromFirestore],
    };
  });

  return {
    version: base.version + 1,
    updatedAt: new Date().toISOString(),
    subjects: subjectsOut,
  };
}

export type ExportFile = { path: string; content: string };

export function buildExportBundle(content: ContentDoc): ExportFile[] {
  if (content.type === "quiz") {
    return [
      { path: `${content.slug}/data.js`, content: buildQuizDataJs(content) },
      { path: `${content.slug}/index.html`, content: buildQuizIndexHtml(content) },
    ];
  }
  return [
    { path: `${content.slug}/index.html`, content: buildLessonIndexHtml(content) },
    { path: `${content.slug}/style.css`, content: buildLessonStyleCss() },
  ];
}

export function downloadTextFile(filename: string, text: string, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadExportZip(
  content: ContentDoc,
  manifestJson?: string,
): Promise<void> {
  const files = buildExportBundle(content);
  const readme = `# ${content.title} (${content.slug})

public/ フォルダに以下を配置してください。

${files.map((f) => `- public/${f.path}`).join("\n")}

## デプロイ前チェック

1. next.config.ts の STATIC_QUIZ_APPS に "${content.slug}" を追加
2. firebase.json の rewrites に /${content.slug} を追加
3. public/sw.js の NO_STORE_PREFIXES に "/${content.slug}/" を追加
4. content-manifest.json を更新（管理画面からダウンロード可）
5. npm run build && firebase deploy --only hosting
`;

  const parts: string[] = [readme, ...files.map((f) => `\n--- ${f.path} ---\n${f.content}`)];
  if (manifestJson) {
    parts.push(`\n--- content-manifest.json ---\n${manifestJson}`);
  }

  downloadTextFile(`${content.slug}-export.txt`, parts.join("\n"), "text/plain;charset=utf-8");
}
