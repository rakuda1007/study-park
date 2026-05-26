/**
 * 全クイズに「まとめて確認」を追加するワンショットパッチ
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const REVIEW_PANEL = `
      <section id="reviewPanel" class="review-panel" hidden aria-label="まとめて確認">
        <h2 class="review-panel-heading">まとめて確認</h2>
        <p class="review-panel-lead">
          全問の問題と答えを一覧で見ながら、スクロールして復習できます。
        </p>
        <div id="reviewList" class="review-list"></motion>
      </section>
`.replace("</motion>", "</div>");

const REVIEW_SCRIPTS = `    <script src="/shared/quiz-format.js?v=13"></script>
    <script src="/shared/quiz-review-mode.js?v=2"></script>
    <script src="/shared/quiz-review-controller.js?v=1"></script>`;

const REVIEW_CSS =
  '    <link rel="stylesheet" href="/shared/quiz-review-style.css?v=1" />\n';

function patchBlankQuizHtml(rel) {
  let html = readFileSync(join(root, rel), "utf8");
  if (!html.includes('quiz-review-style.css')) {
    html = html.replace(
      /(<link rel="stylesheet" href="\/shared\/quiz-header\.css[^"]+" \/>)\n/,
      `$1\n${REVIEW_CSS}`,
    );
  }
  if (!html.includes('id="reviewPanel"')) {
    html = html.replace(
      /(\s*)<section id="questionCard"/,
      `${REVIEW_PANEL}\n$1<section id="questionCard"`,
    );
  }
  html = html.replace(
    /<div class="answer-actions">/,
    '<div id="answerActions" class="answer-actions">',
  );
  html = html.replace(
    /<script src="\/shared\/quiz-format\.js\?v=\d+"><\/script>\n/,
    `${REVIEW_SCRIPTS}\n`,
  );
  if (!html.includes("quiz-streak-fx")) {
    // already has review scripts only
  }
  writeFileSync(join(root, rel), html);
  console.log("html", rel);
}

function patchKenchoHtml() {
  const rel = "public/kencho/index.html";
  let html = readFileSync(join(root, rel), "utf8");
  if (!html.includes('quiz-review-style.css')) {
    html = html.replace(
      /(<link rel="stylesheet" href="\/shared\/quiz-header\.css[^"]+" \/>)\n/,
      `$1\n${REVIEW_CSS}`,
    );
  }
  if (!html.includes('id="reviewPanel"')) {
    html = html.replace(
      /(\s*)<section id="questionCard"/,
      `${REVIEW_PANEL}\n$1<section id="questionCard"`,
    );
  }
  html = html.replace(
    /<div class="choices-footer">/,
    '<div id="choicesFooter" class="choices-footer">',
  );
  html = html.replace(
    /<script src="\/shared\/quiz-format\.js\?v=\d+"><\/script>\n/,
    `${REVIEW_SCRIPTS}\n`,
  );
  writeFileSync(join(root, rel), html);
  console.log("html", rel);
}

function patchKukuHtml() {
  const rel = "public/kuku/index.html";
  let html = readFileSync(join(root, rel), "utf8");
  if (!html.includes('quiz-review-style.css')) {
    html = html.replace(
      /(<link rel="stylesheet" href="\/shared\/quiz-header\.css[^"]+" \/>)\n/,
      `$1\n${REVIEW_CSS}`,
    );
  }
  if (!html.includes('id="reviewPanel"')) {
    html = html.replace(
      /(\s*)<section id="problemCard"/,
      `${REVIEW_PANEL}\n$1<section id="problemCard"`,
    );
  }
  html = html.replace(
    /<script src="\/shared\/quiz-format\.js\?v=\d+"><\/script>\n/,
    `${REVIEW_SCRIPTS}\n`,
  );
  writeFileSync(join(root, rel), html);
  console.log("html", rel);
}

const BLANK_APP_INTEGRATE = `
  let reviewCtl;

  function renderReviewList() {
    if (els.reviewList && window.StudyParkQuizReview) {
      window.StudyParkQuizReview.renderAll(els.reviewList, QUESTIONS, {
        questionNumber,
        answerEntries,
      });
    }
  }
`;

function patchBlankQuizApp(rel) {
  let s = readFileSync(join(root, rel), "utf8");
  if (s.includes("reviewCtl")) {
    console.log("skip app", rel);
    return;
  }
  s = s.replace(
    /locked: false,\n(\s+)shownMasterMilestones/,
    "locked: false,\n$1inReview: false,\n$1shownMasterMilestones",
  );
  s = s.replace(
    /function applyFormat\(value\) \{\n    const fmt = window\.StudyParkQuizFormat;\n    if \(!fmt\) return;\n    const \{ mode, order \} = fmt\.parse\(value\);\n    state\.mode = mode;\n    state\.order = order;\n    if \(store\) \{/,
    `function applyFormat(value) {
    const fmt = window.StudyParkQuizFormat;
    if (!fmt) return;
    const { mode, order } = fmt.parse(value);
    state.mode = mode;
    state.order = order;
    if (mode === "review") return;
    if (store) {`,
  );
  if (!s.includes("function renderReviewList")) {
    s = s.replace(
      /function syncFormatSelect\(\) \{/,
      `${BLANK_APP_INTEGRATE}\n  function syncFormatSelect() {`,
    );
  }
  s = s.replace(
    /function onFormatChange\(value\) \{\n    applyFormat\(value\);\n    startSession\(\);\n  \}/,
    "",
  );
  s = s.replace(
    /els\.btnModalRestart = \$\("btnModalRestart"\);\n/,
    `els.btnModalRestart = $("btnModalRestart");
    els.reviewPanel = $("reviewPanel");
    els.reviewList = $("reviewList");
    els.statsBar = document.querySelector(".stats-bar");
    els.answerActions = $("answerActions");
`,
  );
  s = s.replace(
    /syncFormatSelect\(\);\n    if \(els\.formatSelect\) \{\n      els\.formatSelect\.addEventListener\("change", \(\) => \{\n        onFormatChange\(els\.formatSelect\.value\);\n      \}\);\n    \}\n\n    startSession\(\);/,
    `reviewCtl = window.StudyParkQuizReviewController.integrate({
      state,
      els,
      playUiKeys: ["statsBar", "charPanel", "questionCard", "answerActions"],
      closeModal,
      renderStats,
      renderReviewList,
      getTotal: () => TOTAL,
      applyFormat,
      startSession,
    });

    syncFormatSelect();
    if (els.formatSelect) {
      els.formatSelect.addEventListener("change", () => {
        reviewCtl.onFormatChange(els.formatSelect.value);
      });
    }

    if (state.mode === "review") {
      reviewCtl.startReviewMode();
    } else {
      startSession();
    }`,
  );
  s = s.replace(
    /\$\("btnModalRestart"\)\?\.addEventListener\("click", \(\) => \{\n      closeModal\(\);\n      startSession\(\);\n    \}\);/,
    `els.btnModalRestart?.addEventListener("click", () => {
      reviewCtl.onModalRestart();
    });`,
  );
  writeFileSync(join(root, rel), s);
  console.log("app", rel);
}

function patchKenchoApp() {
  const rel = "public/kencho/app.js";
  let s = readFileSync(join(root, rel), "utf8");
  if (s.includes("reviewCtl")) {
    console.log("skip", rel);
    return;
  }
  s = s.replace(
    /locked: false,\n(\s+)shownMasterMilestones/,
    "locked: false,\n$1inReview: false,\n$1shownMasterMilestones",
  );
  s = s.replace(
    /function applyFormat\(value\) \{\n    const fmt = window\.StudyParkQuizFormat;\n    if \(!fmt\) return;\n    const \{ mode, order \} = fmt\.parse\(value\);\n    state\.mode = mode;\n    state\.order = order;\n    if \(store\) \{/,
    `function applyFormat(value) {
    const fmt = window.StudyParkQuizFormat;
    if (!fmt) return;
    const { mode, order } = fmt.parse(value);
    state.mode = mode;
    state.order = order;
    if (mode === "review") return;
    if (store) {`,
  );
  s = s.replace(
    /function onFormatChange\(value\) \{\n    applyFormat\(value\);\n    startSession\(\);\n  \}\n\n  function resetWeakOnly/,
    `function renderReviewList() {
    if (!els.reviewList || !window.StudyParkQuizReview) return;
    const questions = PREFS.map((p, i) => ({
      id: p.id,
      number: i + 1,
      label: \`問\${i + 1}\`,
      template: \`\${p.name}の県庁所在地は？\`,
      blanks: [{ marker: "答", answers: [p.capital] }],
    }));
    window.StudyParkQuizReview.renderAll(els.reviewList, questions, {
      questionNumber: (q) => q.number,
      answerEntries: (q) =>
        q.blanks.map((b) => ({ marker: b.marker, text: b.answers[0] })),
    });
  }

  function resetWeakOnly`,
  );
  s = s.replace(
    /els\.formatSelect = \$\("formatSelect"\);\n/,
    `els.formatSelect = $("formatSelect");
    els.reviewPanel = $("reviewPanel");
    els.reviewList = $("reviewList");
    els.statsBar = document.querySelector(".stats-bar");
    els.choices = $("choices");
    els.choicesFooter = $("choicesFooter");
`,
  );
  s = s.replace(
    /syncFormatSelect\(\);\n\n    if \(els\.formatSelect\) \{\n      els\.formatSelect\.addEventListener\("change", \(\) => \{\n        onFormatChange\(els\.formatSelect\.value\);\n      \}\);\n    \}\n\n    startSession\(\);/,
    `const reviewCtl = window.StudyParkQuizReviewController.integrate({
      state,
      els,
      playUiKeys: ["statsBar", "charPanel", "questionCard", "choices", "choicesFooter"],
      closeModal,
      renderStats,
      renderReviewList,
      getTotal: () => TOTAL,
      applyFormat,
      startSession,
    });

    syncFormatSelect();

    if (els.formatSelect) {
      els.formatSelect.addEventListener("change", () => {
        reviewCtl.onFormatChange(els.formatSelect.value);
      });
    }

    if (state.mode === "review") {
      reviewCtl.startReviewMode();
    } else {
      startSession();
    }`,
  );
  writeFileSync(join(root, rel), s);
  console.log("app", rel);
}

function patchKukuApp() {
  const rel = "public/kuku/app.js";
  let s = readFileSync(join(root, rel), "utf8");
  if (s.includes("reviewCtl")) {
    console.log("skip", rel);
    return;
  }
  s = s.replace(
    /sessionStopped: false,/,
    "sessionStopped: false,\n    inReview: false,",
  );
  s = s.replace(
    /function kukuFormatFromMode\(mode\) \{\n    const fmt = window\.StudyParkQuizFormat;\n    if \(!fmt\) return null;\n    if \(mode === "weak"\) return fmt\.FORMAT\.WEAK;/,
    `function kukuFormatFromMode(mode) {
    const fmt = window.StudyParkQuizFormat;
    if (!fmt) return null;
    if (mode === "review") return fmt.FORMAT.REVIEW_ALL;
    if (mode === "weak") return fmt.FORMAT.WEAK;`,
  );
  s = s.replace(
    /function onFormatChange\(value\) \{\n    onModeChange\(kukuModeFromFormat\(value\)\);\n  \}/,
    `function buildKukuReviewQuestions() {
    const items = [];
    for (let a = 1; a <= 9; a++) {
      for (let b = 1; b <= 9; b++) {
        const n = a * b;
        items.push({
          id: \`\${a}x\${b}\`,
          number: (a - 1) * 9 + b,
          label: \`\${a}×\${b}\`,
          template: \`\${a} × \${b} = ?\`,
          blanks: [{ marker: "", answers: [String(n)] }],
        });
      }
    }
    return items;
  }

  function renderKukuReviewList() {
    if (!els.reviewList || !window.StudyParkQuizReview) return;
    window.StudyParkQuizReview.renderAll(els.reviewList, buildKukuReviewQuestions(), {
      questionNumber: (q) => q.number,
      answerEntries: (q) =>
        q.blanks.map((b) => ({ marker: b.marker, text: b.answers[0] })),
    });
  }

  let reviewCtl;

  function onFormatChange(value) {
    const fmt = window.StudyParkQuizFormat;
    if (fmt && value === fmt.FORMAT.REVIEW_ALL) {
      state.mode = "review";
      reviewCtl.startReviewMode();
      return;
    }
    if (state.inReview) reviewCtl.exitReviewMode();
    onModeChange(kukuModeFromFormat(value));
  }`,
  );
  s = s.replace(
    /els\.formatSelect = \$\("formatSelect"\);\n/,
    `els.formatSelect = $("formatSelect");
    els.reviewPanel = $("reviewPanel");
    els.reviewList = $("reviewList");
    els.zoneTop = document.querySelector(".zone-top");
    els.problemCard = $("problemCard");
    els.numpad = document.querySelector(".numpad");
    els.kukuFooter = document.querySelector(".kuku-input-footer");
    els.footerStats = document.querySelector(".footer-stats");
`,
  );
  s = s.replace(
    /syncFormatSelect\(\);\n    if \(els\.formatSelect\) \{/,
    `reviewCtl = window.StudyParkQuizReviewController.integrate({
      state,
      els,
      playUiKeys: ["zoneTop", "problemCard", "numpad", "kukuFooter", "footerStats"],
      closeModal: () => {},
      renderStats: () => {},
      renderReviewList: renderKukuReviewList,
      getTotal: () => KUKU_TOTAL,
      applyFormat: (value) => {
        const fmt = window.StudyParkQuizFormat;
        if (fmt && value === fmt.FORMAT.REVIEW_ALL) state.mode = "review";
      },
      startSession: () => onModeChange(state.mode === "review" ? "sequential" : state.mode),
    });

    syncFormatSelect();
    if (els.formatSelect) {`,
  );
  writeFileSync(join(root, rel), s);
  console.log("app", rel);
}

[].forEach(
  patchBlankQuizHtml,
);
patchKenchoHtml();
patchKukuHtml();

[].forEach(
  patchBlankQuizApp,
);
patchKenchoApp();
patchKukuApp();

// QuizShell / export script versions
const quizShell = join(root, "components/content/QuizShell.tsx");
let qs = readFileSync(quizShell, "utf8");
qs = qs.replace("/shared/quiz-format.js?v=12", "/shared/quiz-format.js?v=13");
qs = qs.replace("/shared/quiz-review-mode.js?v=1", "/shared/quiz-review-mode.js?v=2");
if (!qs.includes("quiz-review-controller")) {
  qs = qs.replace(
    '<Script src="/shared/quiz-review-mode.js?v=2" strategy="afterInteractive" />',
    `<Script src="/shared/quiz-review-mode.js?v=2" strategy="afterInteractive" />
      <Script src="/shared/quiz-review-controller.js?v=1" strategy="afterInteractive" />`,
  );
}
writeFileSync(quizShell, qs);

const playLayout = join(root, "app/play/layout.tsx");
let pl = readFileSync(playLayout, "utf8");
if (!pl.includes("quiz-review-style")) {
  pl = pl.replace(
    'href="/shared/quiz-blank-style.css?v=1"',
    'href="/shared/quiz-blank-style.css?v=1" />\n        <link rel="stylesheet" href="/shared/quiz-review-style.css?v=1"',
  );
}
writeFileSync(playLayout, pl);

const exportTs = join(root, "lib/content/export.ts");
let ex = readFileSync(exportTs, "utf8");
ex = ex.replace(
  'href="/shared/quiz-blank-style.css?v=1" />',
  'href="/shared/quiz-blank-style.css?v=1" />\n    <link rel="stylesheet" href="/shared/quiz-review-style.css?v=1" />',
);
ex = ex.replace("/shared/quiz-format.js?v=12", "/shared/quiz-format.js?v=13");
ex = ex.replace(
  "/shared/quiz-review-mode.js?v=1",
  "/shared/quiz-review-mode.js?v=2",
);
if (!ex.includes("quiz-review-controller")) {
  ex = ex.replace(
    '<script src="/shared/quiz-review-mode.js?v=2"></script>',
    `<script src="/shared/quiz-review-mode.js?v=2"></script>
    <script src="/shared/quiz-review-controller.js?v=1"></script>`,
  );
}
writeFileSync(exportTs, ex);

console.log("done");
