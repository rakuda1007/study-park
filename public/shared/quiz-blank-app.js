(function () {
  "use strict";

  const CFG = window.__STUDY_PARK_QUIZ__;
  if (!CFG || !CFG.slug) {
    console.error("Study Park: __STUDY_PARK_QUIZ__ が読み込まれていません。");
    return;
  }

  const store = window.StudyParkQuizStorage;
  const QUESTIONS = CFG.questions || [];
  const TOTAL = QUESTIONS.length;

  const state = {
    mode: "full",
    order: "sequential",
    current: null,
    phase: "think",
    streak: 0,
    sessionBestStreak: 0,
    highStreak: 0,
    bestSessionScore: 0,
    masteredIds: [],
    weakCount: 0,
    locked: false,
    inReview: false,
    session: {
      queue: [],
      index: 0,
      correct: 0,
      finished: false,
      total: TOTAL,
    },
  };

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function questionById(id) {
    const mid = store?.migrateId ? store.migrateId(id) : id;
    return QUESTIONS.find((q) => q.id === mid);
  }

  function questionNumber(q) {
    const n = Number(q?.number);
    if (Number.isFinite(n) && n >= 1) return Math.floor(n);
    const idx = QUESTIONS.findIndex((item) => item.id === q?.id);
    return idx >= 0 ? idx + 1 : 1;
  }

  function sequentialQuestionIds() {
    return QUESTIONS.map((q) => q.id);
  }

  function sortIdsByQuestionNumber(ids) {
    return [...ids].sort((a, b) => {
      const qa = questionById(a);
      const qb = questionById(b);
      return questionNumber(qa) - questionNumber(qb);
    });
  }

  function loadProgress() {
    const data = store ? store.load() : null;
    if (!data) return;
    state.mode = store ? store.getMode() : "full";
    state.order = store ? store.getOrder() : "sequential";
    state.highStreak = data.highStreak || 0;
    state.bestSessionScore = data.bestSessionScore || 0;
    state.masteredIds = store ? store.getMasteredIds() : [];
    state.weakCount = store ? store.getWeakList().length : 0;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function sessionTotal() {
    const n = state.session.total || state.session.queue.length || TOTAL;
    return Math.max(0, Math.floor(n));
  }

  function intStat(n) {
    const v = Math.floor(Number(n));
    return Number.isFinite(v) && v >= 0 ? v : 0;
  }

  function formatCorrectAnswer(blank) {
    return blank.answers[0];
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const INLINE_RE = /(\*\*[^*]+\*\*|__[^_]+__|\^\^[^\^]+\^\^|<<[^>]+>>)/g;

  function localInlineHtml(text) {
    if (!text) return "";
    return String(text)
      .split(INLINE_RE)
      .map((part) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return "<strong>" + escHtml(part.slice(2, -2)) + "</strong>";
        }
        if (part.startsWith("__") && part.endsWith("__") && part.length > 4) {
          return (
            '<span class="rich-text-underline">' + escHtml(part.slice(2, -2)) + "</span>"
          );
        }
        if (part.startsWith("^^") && part.endsWith("^^") && part.length > 4) {
          return '<span class="rich-text-large">' + escHtml(part.slice(2, -2)) + "</span>";
        }
        if (part.startsWith("<<") && part.endsWith(">>") && part.length > 4) {
          return '<span class="rich-text-small">' + escHtml(part.slice(2, -2)) + "</span>";
        }
        return escHtml(part);
      })
      .join("");
  }

  function isBulletLine(line) {
    return /^[-・]\s/.test(String(line).trim());
  }

  function bulletItemText(line) {
    return String(line)
      .trim()
      .replace(/^[-・]\s+/, "");
  }

  function splitRichLines(text) {
    const lines = String(text).split("\n");
    const blocks = [];
    let bulletItems = [];
    let paragraphLines = [];

    function flushBullets() {
      if (bulletItems.length) {
        blocks.push({ kind: "ul", items: bulletItems.slice() });
        bulletItems = [];
      }
    }

    function flushParagraph() {
      if (paragraphLines.length) {
        blocks.push({ kind: "p", text: paragraphLines.join("\n") });
        paragraphLines = [];
      }
    }

    lines.forEach((line) => {
      if (isBulletLine(line)) {
        flushParagraph();
        bulletItems.push(bulletItemText(line));
        return;
      }
      flushBullets();
      if (String(line).trim() === "") {
        flushParagraph();
        blocks.push({ kind: "gap" });
      } else {
        paragraphLines.push(line);
      }
    });
    flushParagraph();
    flushBullets();
    return blocks;
  }

  function localRichTextToHtml(text, paragraphClass) {
    const pClass = paragraphClass || "question-paragraph";
    const blocks = splitRichLines(text);
    if (!blocks.length) return "";

    return blocks
      .map((block) => {
        if (block.kind === "ul") {
          return (
            '<ul class="rich-list">' +
            block.items.map((item) => "<li>" + localInlineHtml(item) + "</li>").join("") +
            "</ul>"
          );
        }
        if (block.kind === "gap") {
          return '<p class="rich-text-gap" aria-hidden="true"></p>';
        }
        return '<p class="' + pClass + '">' + localInlineHtml(block.text) + "</p>";
      })
      .join("");
  }

  function localAppendRichText(container, text, paragraphClass) {
    const html = localRichTextToHtml(text, paragraphClass);
    if (!html) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    while (wrap.firstChild) {
      container.appendChild(wrap.firstChild);
    }
  }

  function localAnswerDisplayHtml(text) {
    const raw = String(text || "");
    if (!raw) return "";
    if (raw.split("\n").some((line) => isBulletLine(line)) || /\n\s*\n/.test(raw)) {
      return localRichTextToHtml(raw, "answer-rich");
    }
    return localInlineHtml(raw);
  }

  function richTextApi() {
    const rt = window.StudyParkRichText;
    if (rt && typeof rt.appendRichText === "function") return rt;
    return {
      appendRichText: localAppendRichText,
      inlineHtml: localInlineHtml,
      richTextToHtml: localRichTextToHtml,
      answerDisplayHtml: localAnswerDisplayHtml,
    };
  }

  function answerTextHtml(text) {
    const rt = richTextApi();
    if (typeof rt.answerDisplayHtml === "function") {
      return rt.answerDisplayHtml(text || "");
    }
    if (typeof rt.inlineHtml === "function") {
      return rt.inlineHtml(text || "");
    }
    return escHtml(text || "");
  }

  function answerEntries(question) {
    if (Array.isArray(question.answerDisplay) && question.answerDisplay.length > 0) {
      return question.answerDisplay;
    }
    if (!Array.isArray(question.blanks) || question.blanks.length === 0) {
      return [];
    }
    return question.blanks.map((b) => ({
      marker: b.marker,
      text: formatCorrectAnswer(b),
    }));
  }

  function isIntroQuestion(question) {
    if (!question) return false;
    if (Array.isArray(question.answerDisplay) && question.answerDisplay.length > 0) {
      return false;
    }
    if (!Array.isArray(question.blanks) || question.blanks.length === 0) {
      return true;
    }
    return !question.blanks.some(
      (b) => Array.isArray(b.answers) && b.answers.some((a) => String(a).trim()),
    );
  }

  function allCorrectSummary(question) {
    return answerEntries(question)
      .map((e) => `${e.marker}${e.text}`)
      .join("、");
  }

  function syncWeakCount() {
    state.weakCount = store ? store.getWeakList().length : 0;
  }

  function buildSessionQueue() {
    if (state.mode === "weak") {
      const list = store ? store.getWeakList() : [];
      const ids = list.map((e) => e.id);
      return state.order === "random" ? shuffle(ids) : sortIdsByQuestionNumber(ids);
    }
    const ids = sequentialQuestionIds();
    return state.order === "random" ? shuffle(ids) : ids;
  }

  function persistHighStreak() {
    if (!store) return;
    if (state.streak > state.highStreak) {
      state.highStreak = state.streak;
      store.setHighStreak(state.highStreak);
    }
  }

  function updateSessionBestStreak() {
    if (state.streak > state.sessionBestStreak) {
      state.sessionBestStreak = state.streak;
    }
  }

  function renderStats() {
    const idx = state.session.index;
    const total = sessionTotal();
    const mastered = state.masteredIds.length;

    const at = Math.min(idx + 1, total);
    if (els.questionNum) els.questionNum.textContent = String(at);
    if (els.sessionTotal) els.sessionTotal.textContent = String(total);
    if (els.sessionScore) {
      els.sessionScore.textContent = String(intStat(state.session.correct));
    }
    if (els.masteredEl) {
      els.masteredEl.textContent = `${intStat(mastered)} / ${TOTAL}`;
    }
    if (els.weakCount) els.weakCount.textContent = String(intStat(state.weakCount));
    if (els.sessionFill && total > 0) {
      els.sessionFill.style.width = `${(idx / total) * 100}%`;
    }
  }

  function setPhaseControls() {
    const finished = state.session.finished;
    const intro = state.current && isIntroQuestion(state.current);
    const think = state.phase === "think" && !finished && !intro;

    if (els.thinkHint) els.thinkHint.hidden = !think || finished;
    if (els.answerReveal) els.answerReveal.hidden = think || finished || intro;
    if (els.btnReveal) {
      els.btnReveal.hidden = finished;
      els.btnReveal.disabled = state.locked || finished;
      els.btnReveal.textContent = intro ? "次へ" : "答えを見る";
    }
    if (els.selfGrade) {
      els.selfGrade.hidden = think || finished || intro;
    }
    if (els.btnOk) els.btnOk.disabled = state.locked || finished || think;
    if (els.btnNg) els.btnNg.disabled = state.locked || finished || think;
  }

  function renderAnswerList(question) {
    if (!els.answerList) return;
    els.answerList.innerHTML = "";
    answerEntries(question).forEach((entry) => {
      const li = document.createElement("li");
      li.innerHTML =
        `<span class="answer-marker">${escHtml(entry.marker)}</span>` +
        `<span class="answer-text">${answerTextHtml(entry.text)}</span>`;
      els.answerList.appendChild(li);
    });
  }

  function appendRichParagraph(container, text, className) {
    richTextApi().appendRichText(container, text, className || "question-paragraph");
  }

  function renderQuestionBody(q) {
    if (!els.questionBody) return;
    els.questionBody.replaceChildren();
    const blocks = q.blocks;
    if (Array.isArray(blocks) && blocks.length > 0) {
      blocks.forEach((block) => {
        if (block.kind === "paragraph") {
          appendRichParagraph(els.questionBody, block.text || "", "question-paragraph");
        } else if (block.kind === "image" && block.src) {
          const fig = document.createElement("figure");
          fig.className = "question-figure";
          const img = document.createElement("img");
          img.src = block.src;
          img.alt = block.alt || "";
          img.className = "question-figure-img";
          img.loading = "lazy";
          fig.appendChild(img);
          if (block.caption) {
            const cap = document.createElement("figcaption");
            cap.className = "question-figure-caption";
            cap.textContent = block.caption;
            fig.appendChild(cap);
          }
          els.questionBody.appendChild(fig);
        }
      });
      return;
    }
    appendRichParagraph(els.questionBody, q.template || "", "question-paragraph");
  }

  function renderQuestion() {
    const q = state.current;
    if (!q) return;

    state.phase = "think";

    if (els.questionLabel) {
      els.questionLabel.textContent = q.label || `問${questionNumber(q)}`;
    }
    renderQuestionBody(q);

    renderAnswerList(q);
    els.questionCard?.classList.remove("flash-ok", "flash-ng");
    setPhaseControls();
  }

  function onRevealAnswer() {
    if (state.locked || state.session.finished || !state.current) return;
    if (isIntroQuestion(state.current)) {
      state.locked = true;
      setPhaseControls();
      advanceAfterAnswer();
      return;
    }
    if (state.phase !== "think") return;

    state.phase = "revealed";
    setPhaseControls();
  }

  function startSession() {
    syncWeakCount();
    const queue = buildSessionQueue();

    if (state.mode === "weak" && queue.length === 0) {
      openModal(
        "苦手問題はまだありません",
        `ぜんぶ${TOTAL}問モードで学習して、「できない」と答えた問題がここにたまります。\nモードを「ぜんぶ${TOTAL}問」に変えて始めてみよう！`,
      );
      if (els.formatSelect && window.StudyParkQuizFormat) {
        applyFormat(window.StudyParkQuizFormat.FORMAT.SEQUENTIAL);
        syncFormatSelect();
      }
      state.mode = "full";
      if (store) store.setMode("full");
      return startSession();
    }

    state.session = {
      queue,
      index: 0,
      correct: 0,
      finished: false,
      total: Math.floor(queue.length),
    };
    state.streak = 0;
    state.sessionBestStreak = 0;
    state.locked = false;

    closeModal();
    renderStats();
    nextQuestion();
  }

  function syncFormatSelect() {
    const fmt = window.StudyParkQuizFormat;
    if (!els.formatSelect || !fmt) return;
    fmt.fillSelect(
      els.formatSelect,
      TOTAL,
      fmt.fromState(state.mode, state.order),
    );
  }

  function applyFormat(value) {
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

  function setPlayUiVisible(visible) {
    const hide = !visible;
    if (els.statsBar) els.statsBar.hidden = hide;
    if (els.questionCard) els.questionCard.hidden = hide;
    if (els.answerActions) els.answerActions.hidden = hide;
    if (els.reviewPanel) els.reviewPanel.hidden = visible;
  }

  function startReviewMode() {
    state.inReview = true;
    state.session.finished = true;
    state.locked = true;
    closeModal();
    setPlayUiVisible(false);

    if (els.reviewList && window.StudyParkQuizReview) {
      window.StudyParkQuizReview.renderAll(els.reviewList, QUESTIONS, {
        questionNumber,
        answerEntries,
      });
    }

    if (els.questionNum) els.questionNum.textContent = String(TOTAL);
    if (els.sessionTotal) els.sessionTotal.textContent = String(TOTAL);
    renderStats();
  }

  function exitReviewMode() {
    state.inReview = false;
    state.locked = false;
    setPlayUiVisible(true);
  }

  function onFormatChange(value) {
    const fmt = window.StudyParkQuizFormat;
    if (fmt && value === fmt.FORMAT.REVIEW_ALL) {
      applyFormat(value);
      startReviewMode();
      return;
    }
    if (state.inReview) exitReviewMode();
    applyFormat(value);
    startSession();
  }

  function onModeChange(nextMode) {
    state.mode = nextMode === "weak" ? "weak" : "full";
    if (store) store.setMode(state.mode);
    syncFormatSelect();
    startSession();
  }

  function onOrderChange(nextOrder) {
    state.order = nextOrder === "random" ? "random" : "sequential";
    if (store) store.setOrder(state.order);
    startSession();
  }

  function resetWeakOnly() {
    if (
      !window.confirm(
        "苦手問題の記録をすべて消しますか？\n（マスターやベスト記録はそのままです）",
      )
    ) {
      return;
    }
    if (store) store.patch({ weakProblems: [] });
    syncWeakCount();
    if (state.mode === "weak") {
      if (els.formatSelect && window.StudyParkQuizFormat) {
        applyFormat(window.StudyParkQuizFormat.FORMAT.SEQUENTIAL);
        syncFormatSelect();
      }
      startSession();
    }
  }

  function nextQuestion() {
    const total = sessionTotal();
    if (state.session.index >= total) {
      finishSession();
      return;
    }

    state.locked = false;
    state.phase = "think";
    const id = state.session.queue[state.session.index];
    state.current = questionById(id);
    renderStats();
    renderQuestion();
  }

  function openModal(title, msg) {
    if (!els.modal) return;
    if (els.modalTitle) els.modalTitle.textContent = title;
    if (els.modalMsg) els.modalMsg.textContent = msg;
    els.modal.hidden = false;
  }

  function closeModal() {
    if (els.modal) els.modal.hidden = true;
    if (els.modalCard) els.modalCard.classList.remove("record-burst");
    window.dispatchEvent(new CustomEvent("study-park-quiz-modal-closed"));
  }

  function quitSession() {
    if (state.session.finished) return;
    if (
      !window.confirm(
        "いまのチャレンジをやめますか？\n（ベスト記録は、最後までやりきったときだけ更新されます）",
      )
    ) {
      return;
    }

    state.session.finished = true;
    state.locked = true;
    syncWeakCount();

    const total = sessionTotal();
    const idx = state.session.index;
    const score = state.session.correct;
    const atQuestion = Math.min(idx + 1, total);

    let msg = `${atQuestion} 問めのところでやめました。\n`;
    msg += `${score}問 できた / ${total}問 なかでした。\n`;
    msg += `\nまた「もういちど」から同じモードで始められます。`;

    openModal("途中でやめた", msg);
    renderStats();
    setPhaseControls();
    if (els.btnModalRestart) els.btnModalRestart.hidden = false;
  }

  function finishSession() {
    state.session.finished = true;
    state.locked = true;
    syncWeakCount();

    const total = sessionTotal();
    const score = state.session.correct;
    const scoreInt = intStat(score);
    const totalInt = intStat(total);
    const perfect = scoreInt === totalInt && totalInt > 0;
    const isFull = state.mode === "full";

    if (store && isFull) {
      store.setBestSessionScore(scoreInt);
      state.bestSessionScore = Math.max(state.bestSessionScore, scoreInt);
    }

    renderStats();
    setPhaseControls();

    let msg = `${scoreInt}問 できた / ${totalInt}問\n`;
    if (isFull) {
      msg += `ベスト記録 ${state.bestSessionScore}問 / ${TOTAL}問\n`;
    }
    if (state.weakCount > 0) {
      msg += `\n苦手が ${state.weakCount}件 のこっています。\n「苦手問題」モードで復習しよう！`;
    } else if (isFull) {
      msg += "\n苦手問題はゼロです。";
    }

    let title = "おつかれさま";
    if (isFull) {
      if (perfect && totalInt === TOTAL) {
        title = `${TOTAL}問ぜんぶできた`;
        msg += "\n\nぜんぶ思い出せました。";
      }
    } else {
      title = perfect ? "苦手復習クリア" : "苦手復習おわり";
    }

    openModal(title, msg);
    if (els.btnModalRestart) els.btnModalRestart.hidden = false;
    if (CFG.showAds) {
      window.dispatchEvent(new CustomEvent("study-park-quiz-finished"));
    }
  }

  function advanceAfterAnswer() {
    const total = sessionTotal();
    state.session.index += 1;
    if (state.session.index >= total) {
      window.setTimeout(() => finishSession(), 600);
    } else {
      window.setTimeout(() => nextQuestion(), 900);
    }
  }

  function onSelfGrade(gotIt) {
    if (state.locked || state.session.finished || !state.current) return;
    if (state.phase !== "revealed") return;

    const q = state.current;
    state.locked = true;
    setPhaseControls();

    if (gotIt) {
      state.streak += 1;
      state.session.correct += 1;
      updateSessionBestStreak();
      persistHighStreak();

      if (store) store.removeWeak(q.id);

      const wasNew = !state.masteredIds.includes(q.id);
      if (wasNew && store) {
        store.addMastered(q.id);
        state.masteredIds = store.getMasteredIds();
        store.incrementTotalCorrect();
      }
      syncWeakCount();

      els.questionCard?.classList.add("flash-ok");
      renderStats();
      advanceAfterAnswer();
    } else {
      state.streak = 0;
      if (store) store.recordWeak(q.id);
      syncWeakCount();

      els.questionCard?.classList.add("flash-ng");
      renderStats();
      window.setTimeout(() => advanceAfterAnswer(), 1400);
    }
  }

  function init() {
    els.questionBody = $("questionBody");
    els.questionLabel = $("questionLabel");
    els.thinkHint = $("thinkHint");
    els.answerReveal = $("answerReveal");
    els.answerList = $("answerList");
    els.questionCard = $("questionCard");
    els.questionNum = $("questionNum");
    els.sessionScore = $("sessionScore");
    els.masteredEl = $("masteredCount");
    els.sessionFill = $("sessionFill");
    els.sessionTotal = $("sessionTotal");
    els.weakCount = $("weakCount");
    els.formatSelect = $("formatSelect");
    els.btnResetWeak = $("btnResetWeak");
    els.btnUpdate = $("btnUpdate");
    els.btnReveal = $("btnReveal");
    els.selfGrade = $("selfGrade");
    els.btnOk = $("btnOk");
    els.btnNg = $("btnNg");
    els.modal = $("celebrateModal");
    els.modalCard = $("celebrateModalCard");
    els.modalTitle = $("celebrateModalTitle");
    els.modalMsg = $("celebrateModalMsg");
    els.btnModalClose = $("btnModalClose");
    els.btnModalRestart = $("btnModalRestart");
    els.reviewPanel = $("reviewPanel");
    els.reviewList = $("reviewList");
    els.statsBar = document.querySelector(".stats-bar");
    els.answerActions = $("answerActions");

    loadProgress();
    syncFormatSelect();
    if (els.formatSelect) {
      els.formatSelect.addEventListener("change", () => {
        onFormatChange(els.formatSelect.value);
      });
    }

    if (state.mode === "review") {
      startReviewMode();
    } else {
      startSession();
    }

    els.btnResetWeak?.addEventListener("click", resetWeakOnly);
    els.btnUpdate?.addEventListener("click", () => {
      if (window.StudyParkPwa?.forceRefresh) {
        window.StudyParkPwa.forceRefresh();
        return;
      }
      window.location.reload();
    });
    $("btnQuit")?.addEventListener("click", quitSession);
    els.btnReveal?.addEventListener("click", onRevealAnswer);
    els.btnOk?.addEventListener("click", () => onSelfGrade(true));
    els.btnNg?.addEventListener("click", () => onSelfGrade(false));

    $("btnModalRestart")?.addEventListener("click", () => {
      closeModal();
      if (state.mode === "review") startReviewMode();
      else startSession();
    });
    $("btnModalClose")?.addEventListener("click", closeModal);
    els.modal?.addEventListener("click", (ev) => {
      if (ev.target === els.modal) closeModal();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
