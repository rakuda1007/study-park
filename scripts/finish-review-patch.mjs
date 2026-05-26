import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function patchBlankApp(rel) {
  let s = readFileSync(join(root, rel), "utf8");
  if (s.includes("StudyParkQuizReviewController.integrate")) {
    console.log("ok", rel);
    return;
  }
  if (!s.includes("inReview: false")) {
    s = s.replace(
      /locked: false,\n(\s+)shownMasterMilestones/,
      "locked: false,\n$1inReview: false,\n$1shownMasterMilestones",
    );
  }
  s = s.replace(
    /function applyFormat\(value\) \{[\s\S]*?if \(store\) \{[\s\S]*?store\.setOrder\(state\.order\);\n    \}\n  \}\n\n  function onFormatChange\(value\) \{[\s\S]*?startSession\(\);\n  \}/,
    `function applyFormat(value) {
    const fmt = window.StudyParkQuizFormat;
    if (!fmt) return;
    const { mode, order } = fmt.parse(value);
    state.mode = mode;
    state.order = order;
    if (mode === "review") return;
    if (store) {
      store.setMode(state.mode);
      store.setOrder(state.order);
    }
  }`,
  );
  const initOld = `    loadProgress();
    renderSquadGrid();
    syncFormatSelect();
    if (els.formatSelect) {
      els.formatSelect.addEventListener("change", () => {
        onFormatChange(els.formatSelect.value);
      });
    }

    startSession();`;

  const initNew = `    els.reviewPanel = $("reviewPanel");
    els.reviewList = $("reviewList");
    els.statsBar = document.querySelector(".stats-bar");
    els.answerActions = $("answerActions");

    loadProgress();
    renderSquadGrid();
    reviewCtl = window.StudyParkQuizReviewController.integrate({
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
    }`;

  if (!s.includes(initOld)) {
    console.error("init block not found", rel);
    return;
  }
  s = s.replace(initOld, initNew);
  s = s.replace(
    /\$\("btnModalRestart"\)\?\.addEventListener\("click", \(\) => \{\n      closeModal\(\);\n      startSession\(\);\n    \}\);/,
    `els.btnModalRestart?.addEventListener("click", () => {
      reviewCtl.onModalRestart();
    });`,
  );
  writeFileSync(join(root, rel), s);
  console.log("patched", rel);
}

function patchHtmlScripts(rel) {
  let html = readFileSync(join(root, rel), "utf8");
  if (html.includes("quiz-review-controller")) {
    console.log("html ok", rel);
    return;
  }
  html = html.replace(
    /<script src="\/shared\/quiz-format\.js\?v=\d+"><\/script>\n/,
    `    <script src="/shared/quiz-format.js?v=13"></script>
    <script src="/shared/quiz-review-mode.js?v=2"></script>
    <script src="/shared/quiz-review-controller.js?v=1"></script>
`,
  );
  writeFileSync(join(root, rel), html);
  console.log("html patched", rel);
}

function patchKencho() {
  const rel = "public/kencho/app.js";
  let s = readFileSync(join(root, rel), "utf8");
  if (s.includes("StudyParkQuizReviewController")) {
    console.log("ok kencho");
    return;
  }
  if (!s.includes("inReview: false")) {
    s = s.replace(
      /locked: false,\n(\s+)shownMasterMilestones/,
      "locked: false,\n$1inReview: false,\n$1shownMasterMilestones",
    );
  }
  s = s.replace(
    /function applyFormat\(value\) \{[\s\S]*?store\.setOrder\(state\.order\);\n    \}\n  \}\n\n  function onFormatChange\(value\) \{[\s\S]*?startSession\(\);\n  \}\n\n  function resetWeakOnly/,
    `function applyFormat(value) {
    const fmt = window.StudyParkQuizFormat;
    if (!fmt) return;
    const { mode, order } = fmt.parse(value);
    state.mode = mode;
    state.order = order;
    if (mode === "review") return;
    if (store) {
      store.setMode(state.mode);
      store.setOrder(state.order);
    }
  }

  function renderReviewList() {
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
  const initOld = `    syncFormatSelect();

    if (els.formatSelect) {
      els.formatSelect.addEventListener("change", () => {
        onFormatChange(els.formatSelect.value);
      });
    }

    startSession();`;
  const initNew = `    els.reviewPanel = $("reviewPanel");
    els.reviewList = $("reviewList");
    els.statsBar = document.querySelector(".stats-bar");
    els.choices = $("choices");
    els.choicesFooter = $("choicesFooter");

    const reviewCtl = window.StudyParkQuizReviewController.integrate({
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
    }`;
  if (!s.includes(initOld)) {
    console.error("kencho init not found");
    return;
  }
  s = s.replace(initOld, initNew);
  writeFileSync(join(root, rel), s);
  console.log("patched kencho");
}

function patchKuku() {
  const rel = "public/kuku/app.js";
  let s = readFileSync(join(root, rel), "utf8");
  if (s.includes("renderKukuReviewList")) {
    console.log("ok kuku");
    return;
  }
  if (!s.includes("inReview: false")) {
    s = s.replace(
      /sessionStopped: false,/,
      "sessionStopped: false,\n    inReview: false,",
    );
  }
  s = s.replace(
    /if \(mode === "weak"\) return fmt\.FORMAT\.WEAK;/,
    `if (mode === "review") return fmt.FORMAT.REVIEW_ALL;
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
    /els\.formatSelect = \$\("formatSelect"\);\n    els\.btnResetWeak/,
    `els.formatSelect = $("formatSelect");
    els.reviewPanel = $("reviewPanel");
    els.reviewList = $("reviewList");
    els.zoneTop = document.querySelector(".zone-top");
    els.problemCard = $("problemCard");
    els.numpad = document.querySelector(".numpad");
    els.kukuFooter = document.querySelector(".kuku-input-footer");
    els.footerStats = document.querySelector(".footer-stats");
    els.btnResetWeak`,
  );
  s = s.replace(
    /syncFormatSelect\(\);\n    if \(els\.formatSelect\) \{\n      els\.formatSelect\.addEventListener\("change",/,
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
    if (els.formatSelect) {
      els.formatSelect.addEventListener("change",`,
  );
  writeFileSync(join(root, rel), s);
  console.log("patched kuku");
}

["public/kencho/index.html", "public/kuku/index.html"].forEach(
  patchHtmlScripts,
);
patchKencho();
patchKuku();

// play layout
const pl = join(root, "app/play/layout.tsx");
let play = readFileSync(pl, "utf8");
if (!play.includes("quiz-review-style")) {
  play = play.replace(
    'href="/shared/quiz-blank-style.css?v=1" />',
    'href="/shared/quiz-blank-style.css?v=1" />\n      {/* eslint-disable-next-line @next/next/no-css-tags */}\n      <link rel="stylesheet" href="/shared/quiz-review-style.css?v=1" />',
  );
  writeFileSync(pl, play);
}

console.log("finish done");
