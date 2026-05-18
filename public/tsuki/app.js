(function () {
  "use strict";

  const store = window.TsukiStorage;
  const QUESTIONS = window.TSUKI_QUESTIONS || [];
  const TOTAL = window.TSUKI_TOTAL || QUESTIONS.length;
  const CHARS = window.TSUKI_CHARACTERS || [];
  const SQUAD_IDS = window.TSUKI_SQUAD_IDS || ["orange", "dog", "cat", "tofu"];

  const MASTERED_MILESTONES = [3, 5, 8, 10, 12, 15];

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
    charIndex: 0,
    locked: false,
    shownMasterMilestones: new Set(),
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

  function charById(id) {
    return CHARS.find((c) => c.id === id) || CHARS[0];
  }

  function currentChar() {
    return charById(CHARS[state.charIndex % CHARS.length]?.id || "orange");
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

  function allCorrectSummary(question) {
    return question.blanks
      .map((b) => `（${b.marker}）${formatCorrectAnswer(b)}`)
      .join("、");
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
    state.shownMasterMilestones = new Set(
      MASTERED_MILESTONES.filter((n) => state.masteredIds.length >= n),
    );
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

  function setSpeech(text) {
    if (els.speech) els.speech.textContent = text;
  }

  function randomPhrase(ch) {
    const list = ch.phrases?.length ? ch.phrases : ["がんばって！"];
    return list[Math.floor(Math.random() * list.length)];
  }

  function clearCharFx() {
    if (!els.charPanel) return;
    els.charPanel.classList.remove(
      "fx-bounce",
      "fx-swap",
      "fx-squad-pop",
      "fx-squad-glow",
    );
  }

  function showSingleChar() {
    if (els.charSingle) els.charSingle.hidden = false;
    if (els.charSquad) els.charSquad.hidden = true;
  }

  function renderSquadGrid() {
    if (!els.squadGrid) return;
    els.squadGrid.innerHTML = "";
    SQUAD_IDS.forEach((id) => {
      const ch = charById(id);
      if (!ch) return;
      const wrap = document.createElement("div");
      wrap.className = "squad-item";
      const img = document.createElement("img");
      img.src = ch.image;
      img.alt = ch.name;
      const cap = document.createElement("span");
      cap.textContent = ch.emoji;
      wrap.appendChild(img);
      wrap.appendChild(cap);
      els.squadGrid.appendChild(wrap);
    });
  }

  function showSquad() {
    if (els.charSingle) els.charSingle.hidden = true;
    if (els.charSquad) els.charSquad.hidden = false;
    renderSquadGrid();
  }

  function renderCharacter() {
    const ch = currentChar();
    if (!ch) return;
    if (els.charImg) {
      els.charImg.src = ch.image;
      els.charImg.alt = ch.name;
    }
    if (els.charLabel) {
      els.charLabel.textContent = `${ch.emoji} ${ch.name}`;
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
    if (els.streakEl) els.streakEl.textContent = String(intStat(state.streak));
    if (els.highEl) els.highEl.textContent = String(intStat(state.highStreak));
    if (els.masteredEl) {
      els.masteredEl.textContent = `${intStat(mastered)} / ${TOTAL}`;
    }
    if (els.weakCount) els.weakCount.textContent = String(intStat(state.weakCount));
    if (els.sessionFill && total > 0) {
      els.sessionFill.style.width = `${(idx / total) * 100}%`;
    }
  }

  function streakFxKind(streak) {
    const block = Math.floor(streak / 5) - 1;
    return ((block % 4) + 4) % 4;
  }

  function streakFxMessage(streak, kind) {
    if (kind === 2 || kind === 3) return `${streak}れんぱつ！ みんなで応援！`;
    if (kind === 1) return `${streak}れんぱつ！ キャラが変わったよ！`;
    return `${streak}れんぱつ！ いいちょうし！`;
  }

  function applyStreakFx(streak) {
    if (streak <= 0 || streak % 5 !== 0) return;

    clearCharFx();
    const kind = streakFxKind(streak);
    const ch = currentChar();

    if (kind === 0) {
      showSingleChar();
      els.charPanel?.classList.add("fx-bounce");
      setSpeech(`やったね！ ${randomPhrase(ch)}`);
    } else if (kind === 1) {
      state.charIndex = (state.charIndex + 1) % CHARS.length;
      showSingleChar();
      renderCharacter();
      els.charPanel?.classList.add("fx-swap");
      const next = currentChar();
      setSpeech(`${next.emoji} ${next.name}が応援にきたよ！`);
    } else if (kind === 2) {
      showSquad();
      els.charPanel?.classList.add("fx-squad-pop");
      setSpeech("4人が応援にきたよ！");
    } else {
      showSquad();
      els.charPanel?.classList.add("fx-squad-glow");
      setSpeech("みんなキラキラ！ その調子！");
    }

    showBanner(streakFxMessage(streak, kind));

    window.setTimeout(() => {
      clearCharFx();
      showSingleChar();
      renderCharacter();
    }, 2200);
  }

  function setPhaseControls() {
    const finished = state.session.finished;
    const think = state.phase === "think" && !finished;

    if (els.thinkHint) els.thinkHint.hidden = !think || finished;
    if (els.answerReveal) els.answerReveal.hidden = think || finished;
    if (els.btnReveal) {
      els.btnReveal.hidden = !think || finished;
      els.btnReveal.disabled = state.locked || finished;
    }
    if (els.selfGrade) {
      els.selfGrade.hidden = think || finished;
    }
    if (els.btnOk) els.btnOk.disabled = state.locked || finished || think;
    if (els.btnNg) els.btnNg.disabled = state.locked || finished || think;
  }

  function renderAnswerList(question) {
    if (!els.answerList) return;
    els.answerList.innerHTML = "";
    question.blanks.forEach((blank) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="answer-marker">（${blank.marker}）</span><span class="answer-text">${formatCorrectAnswer(blank)}</span>`;
      els.answerList.appendChild(li);
    });
  }

  function renderQuestion() {
    const q = state.current;
    if (!q) return;

    state.phase = "think";

    if (els.questionLabel) {
      els.questionLabel.textContent = q.label || `問題${questionNumber(q)}`;
    }
    if (els.questionBody) els.questionBody.textContent = q.template;

    renderAnswerList(q);
    els.questionCard?.classList.remove("flash-ok", "flash-ng");
    setPhaseControls();
  }

  function onRevealAnswer() {
    if (state.locked || state.session.finished || !state.current) return;
    if (state.phase !== "think") return;

    state.phase = "revealed";
    setSpeech("思い浮かんだ？ できたか自分でチェックしてね");
    setPhaseControls();
  }

  function startSession() {
    syncWeakCount();
    const queue = buildSessionQueue();

    if (state.mode === "weak" && queue.length === 0) {
      openModal(
        "苦手問題はまだありません",
        `ぜんぶ${TOTAL}問モードで学習して、「できない」と答えた問題がここにたまります。\nモードを「ぜんぶ${TOTAL}問」に変えて始めてみよう！`,
        false,
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
    state.charIndex = 0;

    closeModal();
    showSingleChar();
    renderCharacter();
    if (state.mode === "weak") {
      setSpeech(`苦手${queue.length}問を復習しよう！`);
    } else {
      setSpeech(`${TOTAL}問チャレンジ！ がんばって！`);
    }
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
    if (store) {
      store.setMode(state.mode);
      store.setOrder(state.order);
    }
  }

  function onFormatChange(value) {
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
    } else {
      setSpeech("苦手問題をリセットしたよ");
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
    setSpeech("心のなかで答えをかんがえてね");
    renderStats();
    renderQuestion();
  }

  function showBanner(text) {
    if (!els.banner) return;
    els.banner.textContent = text;
    els.banner.classList.add("show");
    window.setTimeout(() => els.banner.classList.remove("show"), 2400);
  }

  function playRecordBurst() {
    if (!els.modalCard) return;
    els.modalCard.classList.remove("record-burst");
    void els.modalCard.offsetWidth;
    els.modalCard.classList.add("record-burst");
    window.setTimeout(
      () => els.modalCard.classList.remove("record-burst"),
      2800,
    );
  }

  function openModal(title, msg, showImage) {
    if (!els.modal) return;
    if (els.modalTitle) els.modalTitle.textContent = title;
    if (els.modalMsg) els.modalMsg.textContent = msg;
    if (els.modalImg) els.modalImg.hidden = !showImage;
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
    msg += `${score}問 できた / ${total}問 なかでした。\n`;
    msg += `\nまた「もういちど」から同じモードで始められます。`;

    clearCharFx();
    showSingleChar();
    renderCharacter();
    setSpeech("またつぎにがんばろう！");
    openModal("🛑 途中でやめたよ", msg, false);
    renderStats();
    setPhaseControls();
    if (els.btnModalRestart) els.btnModalRestart.hidden = false;
  }

  function masteredMessage(n) {
    const count = intStat(n);
    if (count >= TOTAL) return "月の動きマスター！ ぜんぶおぼえたね！";
    if (count >= 10) return `${count}問マスター！ すごい！`;
    if (count >= 5) return `${count}問マスター！ いいペース！`;
    return `${count}問マスター！`;
  }

  function checkMasteredMilestones(count) {
    if (!MASTERED_MILESTONES.includes(count)) return;
    if (state.shownMasterMilestones.has(count)) return;
    state.shownMasterMilestones.add(count);
    showBanner(masteredMessage(count));
  }

  function finishSession() {
    state.session.finished = true;
    state.locked = true;
    syncWeakCount();

    const total = sessionTotal();
    const score = state.session.correct;
    const scoreInt = intStat(score);
    const totalInt = intStat(total);
    const bestStreakInt = intStat(state.sessionBestStreak);
    const perfect = scoreInt === totalInt && totalInt > 0;
    const isFull = state.mode === "full";

    if (store && isFull) {
      store.setBestSessionScore(scoreInt);
      state.bestSessionScore = Math.max(state.bestSessionScore, scoreInt);
    }

    renderStats();
    setPhaseControls();

    let msg = `${scoreInt}問 できた / ${totalInt}問\n`;
    msg += `この回の連続ベスト ${bestStreakInt}問\n`;
    if (isFull) {
      msg += `ベスト記録 ${state.bestSessionScore}問 / ${TOTAL}問\n`;
    }
    if (state.weakCount > 0) {
      msg += `\n苦手が ${state.weakCount}件 のこっています。\n「苦手問題」モードで復習しよう！`;
    } else if (isFull) {
      msg += "\n苦手問題はゼロ！ ばっちりだね！";
    }

    let title = "おつかれさま！";
    let showImage = false;

    if (isFull) {
      if (perfect && totalInt === TOTAL) {
        title = `🌙 ${TOTAL}問ぜんぶできた！`;
        msg += "\n\n🎉 ぜんぶ思い出せたね！ すごすぎる！";
        showImage = true;
        playRecordBurst();
        showSquad();
        setSpeech("ぜんぶできた！ みんなも大喜び！");
      } else {
        title = "🌙 月の動きチャレンジおわり！";
        showImage = scoreInt >= Math.ceil(TOTAL * 0.75);
        setSpeech("おつかれさま！ よくがんばったね！");
      }
    } else {
      title = perfect ? "✨ 苦手復習クリア！" : "📚 苦手復習おわり！";
      showImage = perfect;
      setSpeech(
        perfect
          ? "苦手を克服したね！"
          : "おつかれさま！ まだ苦手モードで練習できるよ",
      );
    }

    openModal(title, msg, showImage);
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
        checkMasteredMilestones(state.masteredIds.length);
      }
      syncWeakCount();

      els.questionCard?.classList.add("flash-ok");
      setSpeech(`できたね！ ${allCorrectSummary(q)}`);
      renderStats();
      applyStreakFx(state.streak);
      advanceAfterAnswer();
    } else {
      state.streak = 0;
      if (store) store.recordWeak(q.id);
      syncWeakCount();

      els.questionCard?.classList.add("flash-ng");
      setSpeech(`つぎはがんばろう！ 答えは ${allCorrectSummary(q)}`);
      renderStats();
      window.setTimeout(() => advanceAfterAnswer(), 1400);
    }
  }

  function init() {
    els.speech = $("speech");
    els.charPanel = $("characterPanel");
    els.charSingle = $("charSingle");
    els.charSquad = $("charSquad");
    els.charImg = $("charImg");
    els.charLabel = $("charLabel");
    els.squadGrid = $("squadGrid");
    els.questionBody = $("questionBody");
    els.questionLabel = $("questionLabel");
    els.thinkHint = $("thinkHint");
    els.answerReveal = $("answerReveal");
    els.answerList = $("answerList");
    els.questionCard = $("questionCard");
    els.questionNum = $("questionNum");
    els.sessionScore = $("sessionScore");
    els.streakEl = $("streak");
    els.highEl = $("highStreak");
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
    els.banner = $("celebrateBanner");
    els.modal = $("celebrateModal");
    els.modalCard = $("celebrateModalCard");
    els.modalTitle = $("celebrateModalTitle");
    els.modalMsg = $("celebrateModalMsg");
    els.modalImg = $("celebrateModalImg");
    els.btnModalClose = $("btnModalClose");
    els.btnModalRestart = $("btnModalRestart");

    loadProgress();
    renderSquadGrid();
    syncFormatSelect();
    if (els.formatSelect) {
      els.formatSelect.addEventListener("change", () => {
        onFormatChange(els.formatSelect.value);
      });
    }

    startSession();

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
