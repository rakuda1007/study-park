(function () {
  "use strict";

  const store = window.KenchoStorage;
  const PREFS = window.KENCHO_PREFECTURES || [];
  const TOTAL = window.KENCHO_TOTAL || PREFS.length;

  const state = {
    mode: "full",
    order: "sequential",
    current: null,
    choices: [],
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

  function sessionTotal() {
    return state.session.total || state.session.queue.length || TOTAL;
  }

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function prefById(id) {
    return PREFS.find((p) => p.id === id);
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function allCapitals() {
    return PREFS.map((p) => p.capital);
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

  function syncWeakCount() {
    state.weakCount = store ? store.getWeakList().length : 0;
  }

  function sortIdsByPrefOrder(ids) {
    const orderMap = new Map(PREFS.map((p, i) => [p.id, i]));
    return [...ids].sort(
      (a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0),
    );
  }

  function buildSessionQueue() {
    if (state.mode === "weak") {
      const list = store ? store.getWeakList() : [];
      const ids = list.map((e) => e.id);
      return state.order === "random" ? shuffle(ids) : sortIdsByPrefOrder(ids);
    }
    const ids = PREFS.map((p) => p.id);
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

  function buildChoices(pref) {
    const wrongPool = allCapitals().filter((c) => c !== pref.capital);
    const wrong = shuffle(wrongPool).slice(0, 3);
    return shuffle([pref.capital, ...wrong]);
  }

  function renderStats() {
    const idx = state.session.index;
    const total = sessionTotal();
    const mastered = state.masteredIds.length;

    if (els.questionNum) {
      els.questionNum.textContent = String(Math.min(idx + 1, total));
    }
    if (els.sessionTotal) els.sessionTotal.textContent = String(total);
    if (els.sessionScore) els.sessionScore.textContent = String(state.session.correct);
    if (els.masteredEl) els.masteredEl.textContent = `${mastered} / ${TOTAL}`;
    if (els.weakCount) els.weakCount.textContent = String(state.weakCount);
    if (els.sessionFill && total > 0) {
      els.sessionFill.style.width = `${(idx / total) * 100}%`;
    }
  }

  function renderQuestion() {
    const pref = state.current;
    if (!pref || !els.prefName) return;

    els.prefName.textContent = pref.name;
    if (!els.choicesWrap) return;

    els.choicesWrap.innerHTML = "";
    const disabled = state.session.finished || state.locked;
    state.choices.forEach((capital) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = capital;
      btn.dataset.capital = capital;
      btn.disabled = disabled;
      btn.addEventListener("click", () => onChoice(capital));
      els.choicesWrap.appendChild(btn);
    });

    els.questionCard?.classList.remove("flash-ok", "flash-ng");
  }

  function startSession() {
    syncWeakCount();
    const queue = buildSessionQueue();

    if (state.mode === "weak" && queue.length === 0) {
      openModal(
        "苦手問題はまだありません",
        "ぜんぶ47問モードで学習して、まちがえた県がここにたまります。\nモードを「ぜんぶ47問」に変えて始めてみよう！",
      );
      if (els.formatSelect && window.StudyParkQuizFormat) {
        applyFormat(window.StudyParkQuizFormat.FORMAT.SEQUENTIAL);
        syncFormatSelect();
      }
      state.mode = "full";
      state.order = "sequential";
      if (store) {
        store.setMode("full");
        store.setOrder("sequential");
      }
      return startSession();
    }

    state.session = {
      queue,
      index: 0,
      correct: 0,
      finished: false,
      total: queue.length,
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

  function renderReviewList() {
    if (!els.reviewList || !window.StudyParkQuizReview) return;
    const questions = PREFS.map((p, i) => ({
      id: p.id,
      number: i + 1,
      label: `問${i + 1}`,
      template: `${p.name}の県庁所在地は？`,
      blanks: [{ marker: "答", answers: [p.capital] }],
    }));
    window.StudyParkQuizReview.renderAll(els.reviewList, questions, {
      questionNumber: (q) => q.number,
      answerEntries: (q) =>
        q.blanks.map((b) => ({ marker: b.marker, text: b.answers[0] })),
    });
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
    const id = state.session.queue[state.session.index];
    state.current = prefById(id);
    state.choices = buildChoices(state.current);
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
    msg += `${score}問 せいかい / ${total}問 なかでした。\n`;
    msg += `\nまた「もういちど」から同じモードで始められます。`;

    openModal("途中でやめた", msg);
    renderStats();
    renderQuestion();
    if (els.btnModalRestart) els.btnModalRestart.hidden = false;
  }

  function highlightChoices(correctCapital) {
    els.choicesWrap?.querySelectorAll(".choice-btn").forEach((btn) => {
      const cap = btn.dataset.capital;
      btn.disabled = true;
      if (cap === correctCapital) btn.classList.add("correct");
      else if (btn.classList.contains("wrong")) btn.classList.add("wrong");
      else btn.classList.add("dim");
    });
  }

  function finishSession() {
    state.session.finished = true;
    state.locked = true;
    syncWeakCount();

    const total = sessionTotal();
    const score = state.session.correct;
    const perfect = score === total && total > 0;
    const isFull = state.mode === "full";

    if (store && isFull) {
      store.setBestSessionScore(score);
      state.bestSessionScore = Math.max(state.bestSessionScore, score);
    }

    renderStats();
    renderQuestion();

    let msg = `${score}問 せいかい / ${total}問\n`;
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
      if (perfect && total === TOTAL) {
        title = "47問ぜんぶせいかい";
        msg += "\n\nぜんもんせいかいです。";
      }
    } else {
      title = perfect ? "苦手復習クリア" : "苦手復習おわり";
    }

    openModal(title, msg);
    if (els.btnModalRestart) els.btnModalRestart.hidden = false;
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

  function onChoice(capital) {
    if (state.locked || state.session.finished || !state.current) return;
    state.locked = true;

    const pref = state.current;
    const correct = capital === pref.capital;

    if (correct) {
      state.streak += 1;
      state.session.correct += 1;
      updateSessionBestStreak();
      persistHighStreak();

      if (store) store.removeWeak(pref.id);

      const wasNew = !state.masteredIds.includes(pref.id);
      if (wasNew && store) {
        store.addMastered(pref.id);
        state.masteredIds = store.getMasteredIds();
        store.incrementTotalCorrect();
      }
      syncWeakCount();

      els.questionCard?.classList.add("flash-ok");
      highlightChoices(pref.capital);
      renderStats();
      advanceAfterAnswer();
    } else {
      state.streak = 0;
      if (store) store.recordWeak(pref.id);
      syncWeakCount();

      els.choicesWrap?.querySelectorAll(".choice-btn").forEach((btn) => {
        if (btn.dataset.capital === capital) btn.classList.add("wrong");
      });
      els.questionCard?.classList.add("flash-ng");
      highlightChoices(pref.capital);
      renderStats();
      window.setTimeout(() => advanceAfterAnswer(), 1400);
    }
  }

  function init() {
    if (typeof window.recordStudyParkGuestUse === "function") {
      window.recordStudyParkGuestUse("kencho");
    }
    els.prefName = $("prefName");
    els.choicesWrap = $("choices");
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
    els.modal = $("celebrateModal");
    els.modalCard = $("celebrateModalCard");
    els.modalTitle = $("celebrateModalTitle");
    els.modalMsg = $("celebrateModalMsg");
    els.btnModalClose = $("btnModalClose");
    els.btnModalRestart = $("btnModalRestart");
    els.reviewPanel = $("reviewPanel");
    els.reviewList = $("reviewList");
    els.quizMain = document.querySelector(".quiz-main");
    els.statsBar = document.querySelector(".stats-bar");
    els.choices = $("choices");
    els.choicesFooter = $("choicesFooter");

    loadProgress();

    const reviewCtl = window.StudyParkQuizReviewController.integrate({
      state,
      els,
      playUiKeys: ["statsBar", "questionCard", "choices", "choicesFooter"],
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

    $("btnModalRestart")?.addEventListener("click", () => {
      closeModal();
      startSession();
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
