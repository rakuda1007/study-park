(function () {
  "use strict";

  const store = window.KukuStorage;
  const CORRECT_PER_LEVEL = 10;
  const TIMED_LIMIT_MS = 100000;
  const TIMED_TICK_MS = 100;
  const TIMED_TOTAL = 81;
  const KUKU_TOTAL = 81;

  const CHARS = window.KUKU_CHARACTERS || [];
  const ROSTER_IDS = window.KUKU_CHAR_ROSTER_IDS || CHARS.map((c) => c.id);

  /** @type {{ mode: 'sequential'|'random'|'weak'|'timed', a: number, b: number, seqIndex: number, seqOrder: {a:number,b:number}[], input: string, streak: number, totalCorrect: number, manualCharId: string|null, useAutoChar: boolean, timed: { active: boolean, remainingMs: number, solved: number, intervalId: number|null, ended: boolean } }} */
  const state = {
    mode: "sequential",
    a: 1,
    b: 1,
    seqIndex: 0,
    seqOrder: [],
    input: "",
    streak: 0,
    totalCorrect: 0,
    manualCharId: null,
    useAutoChar: true,
    /** 順番・ランダム・苦手で「やめる」後、つづけるまで操作停止 */
    sessionStopped: false,
    inReview: false,
    /** timedModal の主ボタン挙動分岐: null | "timed" | "play" */
    quitKind: null,
    timed: {
      active: false,
      remainingMs: TIMED_LIMIT_MS,
      solved: 0,
      intervalId: null,
      ended: false,
      lastResult: null,
    },
  };

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function charById(id) {
    return CHARS.find((c) => c.id === id) || CHARS[0];
  }

  function rosterIndexFromTotal() {
    const idx =
      Math.floor(state.totalCorrect / CORRECT_PER_LEVEL) % ROSTER_IDS.length;
    return Math.max(0, idx);
  }

  function currentCharacterId() {
    if (!state.useAutoChar && state.manualCharId) {
      return state.manualCharId;
    }
    return ROSTER_IDS[rosterIndexFromTotal()] || "orange";
  }

  function currentCharacter() {
    return charById(currentCharacterId());
  }

  /** 進捗をブラウザ（localStorage）へ保存 */
  function persistProgress() {
    if (!store) return;
    store.save({
      mode: state.mode,
      seqIndex: state.seqIndex,
      totalCorrect: state.totalCorrect,
      streak: state.streak,
      weakProblems: store.getWeakList(),
      manualCharacterId: state.manualCharId,
      useAutoCharacter: state.useAutoChar,
    });
  }

  function kukuFormatFromMode(mode) {
    const fmt = window.StudyParkQuizFormat;
    if (!fmt) return null;
    if (mode === "weak") return fmt.FORMAT.WEAK;
    if (mode === "random") return fmt.FORMAT.RANDOM;
    return fmt.FORMAT.SEQUENTIAL;
  }

  function kukuModeFromFormat(value) {
    const fmt = window.StudyParkQuizFormat;
    if (!fmt) return "sequential";
    if (value === fmt.FORMAT.WEAK) return "weak";
    if (value === fmt.FORMAT.RANDOM) return "random";
    return "sequential";
  }

  function syncFormatSelect() {
    const fmt = window.StudyParkQuizFormat;
    if (!els.formatSelect || !fmt) return;
    fmt.fillSelect(
      els.formatSelect,
      KUKU_TOTAL,
      kukuFormatFromMode(state.mode),
    );
  }

  function applySavedData(data) {
    if (!data) return;
    state.mode = data.mode === "timed" ? "sequential" : data.mode;
    state.seqIndex = data.seqIndex;
    state.totalCorrect = data.totalCorrect;
    state.streak = data.streak;
    state.manualCharId = data.manualCharacterId;
    state.useAutoChar = data.useAutoCharacter;
  }

  function recordWrong(a, b) {
    if (store) store.recordWeak(a, b);
  }

  function buildSequentialOrder() {
    const order = [];
    for (let a = 1; a <= 9; a++) {
      for (let b = 1; b <= 9; b++) {
        order.push({ a, b });
      }
    }
    return order;
  }

  function pickRandomPair() {
    const a = 1 + Math.floor(Math.random() * 9);
    const b = 1 + Math.floor(Math.random() * 9);
    return { a, b };
  }

  function pickWeakPair() {
    const list = store ? store.getWeakList() : [];
    if (list.length === 0) {
      return pickRandomPair();
    }
    let sum = 0;
    for (const e of list) sum += Math.max(1, e.n || 1);
    let r = Math.random() * sum;
    for (const e of list) {
      const w = Math.max(1, e.n || 1);
      r -= w;
      if (r <= 0) return { a: e.a, b: e.b };
    }
    const last = list[list.length - 1];
    return { a: last.a, b: last.b };
  }

  function nextQuestion() {
    if (state.mode === "sequential" || state.mode === "timed") {
      if (state.seqOrder.length === 0) {
        state.seqOrder = buildSequentialOrder();
      }
      const item = state.seqOrder[state.seqIndex % state.seqOrder.length];
      state.a = item.a;
      state.b = item.b;
    } else if (state.mode === "weak") {
      const p = pickWeakPair();
      state.a = p.a;
      state.b = p.b;
    } else {
      const p = pickRandomPair();
      state.a = p.a;
      state.b = p.b;
    }
    state.input = "";
    renderProblem();
  }

  function advanceSequential() {
    if (state.mode !== "sequential" && state.mode !== "timed") return;
    const total = state.seqOrder.length || TIMED_TOTAL;
    if (state.mode === "timed") {
      state.seqIndex = Math.min(state.seqIndex + 1, total - 1);
      return;
    }
    state.seqIndex = (state.seqIndex + 1) % total;
  }

  function getBestTimedSeconds() {
    return store ? store.getBestTimedSeconds() : null;
  }

  function stopTimedTimer() {
    if (state.timed.intervalId) {
      clearInterval(state.timed.intervalId);
      state.timed.intervalId = null;
    }
    state.timed.active = false;
  }

  function timedElapsedSeconds() {
    const used = TIMED_LIMIT_MS - state.timed.remainingMs;
    return Math.max(1, Math.ceil(used / 1000));
  }

  function renderTimedBar() {
    const show = state.mode === "timed";
    if (els.timedBar) els.timedBar.hidden = !show;
    if (!show) return;

    const sec = Math.max(0, Math.ceil(state.timed.remainingMs / 1000));
    if (els.timedRemainSec) {
      els.timedRemainSec.textContent = String(sec);
      els.timedRemainSec.classList.toggle("timed-urgent", sec > 0 && sec <= 10);
    }
    if (els.timedProgressFill) {
      const pct = Math.max(
        0,
        Math.min(100, (state.timed.remainingMs / TIMED_LIMIT_MS) * 100),
      );
      els.timedProgressFill.style.width = `${pct}%`;
      els.timedProgressFill.classList.toggle("timed-urgent-fill", sec <= 10);
    }
    const best = getBestTimedSeconds();
    if (els.timedBestPill) {
      if (best) {
        els.timedBestPill.hidden = false;
        els.timedBestPill.textContent = `ベスト ${best}秒`;
      } else {
        els.timedBestPill.hidden = true;
      }
    }
  }

  function startTimedChallenge() {
    stopTimedTimer();
    state.seqOrder = buildSequentialOrder();
    state.seqIndex = 0;
    state.streak = 0;
    state.sessionStopped = false;
    state.quitKind = null;
    state.timed = {
      active: true,
      remainingMs: TIMED_LIMIT_MS,
      solved: 0,
      intervalId: null,
      ended: false,
      lastResult: null,
    };
    state.timed.intervalId = window.setInterval(tickTimed, TIMED_TICK_MS);
    closeTimedModal();
    renderTimedBar();
    setSpeech("100秒で81問ぜんぶ！ がんばって！");
    nextQuestion();
    renderFooter();
    setNumpadDisabled(false);
  }

  function tickTimed() {
    if (!state.timed.active || state.timed.ended) return;
    state.timed.remainingMs -= TIMED_TICK_MS;
    if (state.timed.remainingMs <= 0) {
      state.timed.remainingMs = 0;
      onTimedTimeout();
      return;
    }
    renderTimedBar();
  }

  function onTimedTimeout() {
    stopTimedTimer();
    state.timed.ended = true;
    state.timed.lastResult = "fail";
    setSpeech("時間ぎれ… あと少しだったね！");
    renderTimedBar();
    renderFooter();
    showTimedFailModal();
  }

  function streakTierFromCount(streak) {
    if (streak <= 0 || streak % 5 !== 0) return 0;
    const block = Math.floor(streak / 5) - 1;
    return [3, 10, 20][block % 3];
  }

  function getTimedCelebrateMessages(sec, prevBest, isNewRecord) {
    const lines = [];
    lines.push("みんなでお祝い！ ぜんぶクリアだよ！");
    if (isNewRecord) {
      if (prevBest == null) {
        lines.push("🎉 はじめてのクリア！ 記録をのこしたよ！");
      } else {
        lines.push(`🏆 タイム更新！ ${prevBest}秒 → ${sec}秒！`);
      }
    } else if (prevBest != null) {
      lines.push(`クリア！ ${sec}秒（ベスト ${prevBest}秒のまま）`);
    } else {
      lines.push(`クリア！ タイム ${sec}秒`);
    }
    if (sec <= 80) {
      lines.push("⚡ 80秒切り！ ちょっと待って、はやすぎるよ！");
    } else if (sec <= 90) {
      lines.push("🌟 90秒切り！ すごいスピードだね！");
    }
    return lines.join("\n");
  }

  function playRecordBurst() {
    if (!els.timedModalCard) return;
    els.timedModalCard.classList.remove("record-burst");
    void els.timedModalCard.offsetWidth;
    els.timedModalCard.classList.add("record-burst");
    window.setTimeout(
      () => els.timedModalCard.classList.remove("record-burst"),
      2800,
    );
  }

  function closeTimedModal() {
    if (els.timedModal) els.timedModal.hidden = true;
    if (els.timedModalCard) els.timedModalCard.classList.remove("record-burst");
  }

  function showTimedCelebrateModal(sec, prevBest, isNewRecord) {
    state.quitKind = null;
    setNumpadDisabled(true);
    if (!els.timedModal) return;
    if (els.timedModalTitle) {
      els.timedModalTitle.textContent = isNewRecord
        ? "🎊 新記録！"
        : "🎊 タイムアタッククリア！";
    }
    if (els.timedModalMsg) {
      els.timedModalMsg.textContent = getTimedCelebrateMessages(
        sec,
        prevBest,
        isNewRecord,
      );
    }
    if (els.timedModalTime) {
      els.timedModalTime.textContent = `タイム ${sec}秒 / 制限 100秒`;
    }
    if (els.timedModalImg) els.timedModalImg.hidden = false;
    if (els.btnTimedRetry) els.btnTimedRetry.hidden = true;
    if (els.btnTimedModalClose) els.btnTimedModalClose.textContent = "やったね！";
    if (isNewRecord) playRecordBurst();
    els.timedModal.hidden = false;
  }

  function showTimedFailModal() {
    state.quitKind = null;
    setNumpadDisabled(true);
    if (!els.timedModal) return;
    if (els.timedModalTitle) els.timedModalTitle.textContent = "⏰ 時間ぎれ";
    if (els.timedModalMsg) {
      els.timedModalMsg.textContent =
        `${state.timed.solved}問 せいかい！\nもういちど 挑戦してみよう！`;
    }
    if (els.timedModalTime) {
      const best = getBestTimedSeconds();
      els.timedModalTime.textContent = best
        ? `いまのベスト ${best}秒`
        : "100秒以内に81問クリアをめざそう！";
    }
    if (els.timedModalImg) els.timedModalImg.hidden = true;
    if (els.btnTimedRetry) els.btnTimedRetry.hidden = false;
    if (els.btnTimedModalClose) els.btnTimedModalClose.textContent = "とじる";
    els.timedModal.hidden = false;
  }

  function finishTimedSuccess() {
    stopTimedTimer();
    state.timed.ended = true;
    state.timed.lastResult = "success";
    const sec = timedElapsedSeconds();
    const prevBest = getBestTimedSeconds();
    const isNewRecord = prevBest === null || sec < prevBest;
    if (isNewRecord && store) store.setBestTimedSeconds(sec);
    setSpeech("クリア！！ みんなもよろこんでるよ！");
    persistProgress();
    renderFooter();
    renderTimedBar();
    showTimedCelebrateModal(sec, prevBest, isNewRecord);
  }

  function onModeChange(nextMode) {
    if (state.mode === "timed") stopTimedTimer();
    closeTimedModal();
    state.mode = nextMode;
    state.seqIndex = 0;
    state.streak = 0;
    state.sessionStopped = false;
    state.quitKind = null;
    state.timed.ended = false;
    state.timed.lastResult = null;
    syncFormatSelect();
    if (nextMode === "timed") {
      startTimedChallenge();
    } else {
      renderTimedBar();
      nextQuestion();
    }
    persistProgress();
    renderFooter();
    renderCharacter();
    setNumpadDisabled(false);
  }

  function onFormatChange(value) {
    onModeChange(kukuModeFromFormat(value));
  }

  function resetWeakOnly() {
    if (
      !window.confirm(
        "苦手問題の記録をすべて消しますか？\n（レベルやベスト記録はそのままです）",
      )
    ) {
      return;
    }
    if (store) store.patch({ weakProblems: [] });
    if (state.mode === "weak") {
      onModeChange("sequential");
    } else {
      setSpeech("苦手問題をリセットしたよ");
    }
  }

  function setNumpadDisabled(disabled) {
    document.querySelectorAll(".numpad button").forEach((btn) => {
      btn.disabled = disabled;
    });
  }

  function showTimedQuitModal() {
    state.quitKind = "timed";
    const sec = Math.max(0, Math.ceil(state.timed.remainingMs / 1000));
    if (els.timedModalTitle) els.timedModalTitle.textContent = "🛑 途中でやめたよ";
    if (els.timedModalMsg) {
      els.timedModalMsg.textContent = `${state.timed.solved}問 せいかい / ${TIMED_TOTAL}問\n残り ${sec}秒\n\nベストタイムは、最後までクリアしたときだけ更新されます。`;
    }
    if (els.timedModalImg) els.timedModalImg.hidden = true;
    if (els.timedModalTime) els.timedModalTime.textContent = "";
    if (els.btnTimedRetry) {
      els.btnTimedRetry.hidden = false;
      els.btnTimedRetry.textContent = "タイムアタックにもどる";
    }
    if (els.btnTimedModalClose) {
      els.btnTimedModalClose.textContent = "順番モードで遊ぶ";
    }
    if (els.timedModal) els.timedModal.hidden = false;
    setNumpadDisabled(true);
  }

  function showSessionQuitModal() {
    state.quitKind = "play";
    if (els.timedModalTitle) els.timedModalTitle.textContent = "🛑 途中でやめたよ";
    if (els.timedModalMsg) {
      els.timedModalMsg.textContent =
        "またあとでつづきから遊べます。\n「つづける」でつぎの問題へ。";
    }
    if (els.timedModalImg) els.timedModalImg.hidden = true;
    if (els.timedModalTime) els.timedModalTime.textContent = "";
    if (els.btnTimedRetry) els.btnTimedRetry.hidden = true;
    if (els.btnTimedModalClose) els.btnTimedModalClose.textContent = "つづける";
    if (els.timedModal) els.timedModal.hidden = false;
    setNumpadDisabled(true);
  }

  function resumePlaySession() {
    state.sessionStopped = false;
    state.quitKind = null;
    closeTimedModal();
    setNumpadDisabled(false);
    nextQuestion();
    renderFooter();
    const ch = currentCharacter();
    setSpeech(randomPhrase(ch));
  }

  function quitSession() {
    if (state.sessionStopped) return;
    if (state.mode === "timed" && state.timed.ended) return;
    if (
      !window.confirm(
        "いまのモードを途中でやめますか？\n（タイムアタックのベストは、最後までクリアしたときだけ更新されます）",
      )
    ) {
      return;
    }

    state.input = "";
    clearFxClasses(els.characterPanel);
    setSpeech("またつぎにがんばろう！");

    if (state.mode === "timed") {
      stopTimedTimer();
      state.timed.ended = true;
      state.timed.active = false;
      state.timed.lastResult = "quit";
      renderTimedBar();
      renderFooter();
      showTimedQuitModal();
    } else {
      state.sessionStopped = true;
      showSessionQuitModal();
    }
    renderProblem();
  }

  function expected() {
    return state.a * state.b;
  }

  function clearFxClasses(panel) {
    if (!panel) return;
    const toRemove = [...panel.classList].filter(
      (c) => c.startsWith("fx-") || c === "fx-playing",
    );
    toRemove.forEach((c) => panel.classList.remove(c));
  }

  /** 連続正解 5問ごと（5,10,15…）のマイルストーン演出 */
  function applyStreakFxMilestone(streak) {
    const panel = els.characterPanel;
    const ch = currentCharacter();
    if (!panel || !ch) return;

    clearFxClasses(panel);

    const tier = streakTierFromCount(streak);
    let charFx = "";
    if (tier === 20) charFx = ch.fx20;
    else if (tier === 10) charFx = ch.fx10;
    else if (tier === 3) charFx = ch.fx3;
    if (!tier) return;

    panel.classList.add("fx-playing", `fx-tier-${tier}`);
    if (charFx) panel.classList.add(charFx);

    const duration = tier === 20 ? 3200 : tier === 10 ? 2800 : 2200;
    window.setTimeout(() => clearFxClasses(panel), duration);
  }

  function randomPhrase(ch) {
    const list = ch.phrases && ch.phrases.length ? ch.phrases : ["がんばって！"];
    return list[Math.floor(Math.random() * list.length)];
  }

  function setSpeech(text) {
    if (els.speech) els.speech.textContent = text;
  }

  function renderCharacter() {
    const ch = currentCharacter();
    if (!ch) return;
    if (els.charImg) {
      els.charImg.src = ch.image;
      els.charImg.alt = ch.name;
    }
    if (els.charLabel) {
      els.charLabel.textContent = `${ch.emoji} ${ch.name}`;
    }
    setSpeech(randomPhrase(ch));
  }

  function renderProblem() {
    if (els.problemText) {
      const tail = state.input ? state.input : "?";
      els.problemText.textContent = `${state.a} × ${state.b} = ${tail}`;
    }
  }

  function remainingInMode() {
    if (state.mode === "timed") {
      const left = Math.max(0, TIMED_TOTAL - state.timed.solved);
      return `${left} / ${TIMED_TOTAL}`;
    }
    if (state.mode === "sequential") {
      const total = state.seqOrder.length || 81;
      const left = total - (state.seqIndex % total);
      return `${left} / ${total}`;
    }
    if (state.mode === "weak") {
      const n = store ? store.getWeakList().length : 0;
      return n ? `苦手 ${n}件` : "苦手なし（ランダム）";
    }
    return "ランダム";
  }

  function renderFooter() {
    if (els.streakEl) els.streakEl.textContent = String(state.streak);
    if (els.remainEl) els.remainEl.textContent = remainingInMode();
    if (els.levelEl) {
      const lv = 1 + Math.floor(state.totalCorrect / CORRECT_PER_LEVEL);
      els.levelEl.textContent = `Lv.${lv}`;
    }
  }

  function renderCharModal() {
    if (!els.charGrid) return;
    els.charGrid.innerHTML = "";
    const active = currentCharacterId();
    CHARS.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "char-pick" + (c.id === active ? " selected" : "");
      btn.dataset.id = c.id;
      const img = document.createElement("img");
      img.src = c.image;
      img.alt = c.name;
      const cap = document.createElement("span");
      cap.textContent = `${c.emoji} ${c.name}`;
      btn.appendChild(img);
      btn.appendChild(cap);
      btn.addEventListener("click", () => {
        state.manualCharId = c.id;
        state.useAutoChar = false;
        [...els.charGrid.querySelectorAll(".char-pick")].forEach((n) =>
          n.classList.toggle("selected", n.dataset.id === c.id),
        );
        persistProgress();
        renderCharacter();
        renderFooter();
      });
      els.charGrid.appendChild(btn);
    });
  }

  function showLevelUp(prevRosterIdx, nextRosterIdx) {
    if (prevRosterIdx === nextRosterIdx) return;
    const nextId = ROSTER_IDS[nextRosterIdx];
    const ch = charById(nextId);
    if (!els.levelBanner || !ch) return;
    els.levelBanner.textContent = `レベルアップ！ ${ch.emoji}${ch.name}に出会ったよ`;
    els.levelBanner.classList.add("show");
    window.setTimeout(() => els.levelBanner.classList.remove("show"), 2200);
  }

  function onCorrect() {
    const prevRoster = rosterIndexFromTotal();

    state.streak += 1;
    state.totalCorrect += 1;

    if (state.streak > 0 && state.streak % 5 === 0) {
      applyStreakFxMilestone(state.streak);
    }

    const ch = currentCharacter();
    setSpeech(`せいかい！ ${randomPhrase(ch)}`);

    if (els.problemCard) {
      els.problemCard.classList.remove("flash-ng");
      void els.problemCard.offsetWidth;
      els.problemCard.classList.add("flash-ok");
    }

    const newRoster = rosterIndexFromTotal();
    if (
      state.useAutoChar &&
      Math.floor((state.totalCorrect - 1) / CORRECT_PER_LEVEL) !==
        Math.floor(state.totalCorrect / CORRECT_PER_LEVEL)
    ) {
      showLevelUp(prevRoster, newRoster);
    }

    if (state.mode === "timed") {
      state.timed.solved += 1;
      advanceSequential();
      state.input = "";
      persistProgress();
      renderFooter();
      renderTimedBar();
      renderCharacter();
      if (state.timed.solved >= TIMED_TOTAL) {
        finishTimedSuccess();
        return;
      }
      window.setTimeout(() => nextQuestion(), 450);
      return;
    }

    advanceSequential();
    state.input = "";
    persistProgress();
    renderFooter();
    renderCharacter();
    window.setTimeout(() => nextQuestion(), 450);
  }

  function onWrong() {
    state.streak = 0;
    recordWrong(state.a, state.b);
    const ch = currentCharacter();
    setSpeech(`ざんねん… もういちど！ ${ch.emoji}`);

    if (els.problemCard) {
      els.problemCard.classList.remove("flash-ok");
      void els.problemCard.offsetWidth;
      els.problemCard.classList.add("flash-ng");
    }

    clearFxClasses(els.characterPanel);
    state.input = "";
    persistProgress();
    renderFooter();
    renderProblem();
  }

  function submitAnswer() {
    if (state.sessionStopped) return;
    if (state.mode === "timed" && state.timed.ended) return;
    if (!state.input) return;
    const n = parseInt(state.input, 10);
    if (Number.isNaN(n)) return;
    if (n === expected()) {
      onCorrect();
    } else {
      onWrong();
    }
  }

  function appendDigit(d) {
    if (state.sessionStopped) return;
    if (state.input.length >= 2) return;
    if (state.input === "0" && d === "0") return;
    state.input += d;
    renderProblem();
  }

  function backspace() {
    if (state.sessionStopped) return;
    state.input = state.input.slice(0, -1);
    renderProblem();
  }

  function openModal() {
    renderCharModal();
    if (els.modal) els.modal.hidden = false;
  }

  function closeModal() {
    if (els.modal) els.modal.hidden = true;
  }

  function init() {
    els.characterPanel = $("characterPanel");
    els.charImg = $("charImg");
    els.charLabel = $("charLabel");
    els.speech = $("speech");
    els.problemCard = $("problemCard");
    els.problemText = $("problemText");
    els.streakEl = $("streak");
    els.remainEl = $("remain");
    els.levelEl = $("levelPill");
    els.modal = $("charModal");
    els.charGrid = $("charGrid");
    els.levelBanner = $("levelBanner");
    els.timedBar = $("timedBar");
    els.timedRemainSec = $("timedRemainSec");
    els.timedProgressFill = $("timedProgressFill");
    els.timedBestPill = $("timedBestPill");
    els.timedModal = $("timedModal");
    els.timedModalCard = $("timedModalCard");
    els.timedModalTitle = $("timedModalTitle");
    els.timedModalMsg = $("timedModalMsg");
    els.timedModalImg = $("timedModalImg");
    els.timedModalTime = $("timedModalTime");
    els.btnTimedModalClose = $("btnTimedModalClose");
    els.btnTimedRetry = $("btnTimedRetry");

    els.formatSelect = $("formatSelect");
    els.btnResetWeak = $("btnResetWeak");
    els.btnUpdate = $("btnUpdate");

    if (store) {
      const saved = store.load();
      applySavedData(saved);
      if (saved.mode === "timed") {
        store.patch({ mode: "sequential" });
      }
      if (
        saved.manualCharacterId &&
        !CHARS.some((c) => c.id === saved.manualCharacterId)
      ) {
        state.manualCharId = null;
        state.useAutoChar = true;
      }
    }

    state.seqOrder = buildSequentialOrder();

    syncFormatSelect();
    if (els.formatSelect) {
      els.formatSelect.addEventListener("change", () => {
        onFormatChange(els.formatSelect.value);
      });
    }

    els.btnResetWeak?.addEventListener("click", resetWeakOnly);
    els.btnUpdate?.addEventListener("click", () => {
      if (window.StudyParkPwa?.forceRefresh) {
        window.StudyParkPwa.forceRefresh();
        return;
      }
      window.location.reload();
    });

    $("btnTimedModalClose")?.addEventListener("click", () => {
      if (state.quitKind === "play") {
        resumePlaySession();
        return;
      }
      if (state.quitKind === "timed") {
        onModeChange("sequential");
        return;
      }
      const wasSuccess = state.timed.lastResult === "success";
      closeTimedModal();
      if (state.mode === "timed" && wasSuccess) startTimedChallenge();
    });
    $("btnTimedRetry")?.addEventListener("click", () => {
      if (state.quitKind === "timed") {
        closeTimedModal();
        startTimedChallenge();
        return;
      }
      closeTimedModal();
      if (state.mode === "timed") startTimedChallenge();
    });
    els.timedModal?.addEventListener("click", (ev) => {
      if (ev.target !== els.timedModal) return;
      if (state.quitKind === "play") {
        resumePlaySession();
        return;
      }
      if (state.quitKind === "timed") {
        onModeChange("sequential");
        return;
      }
      closeTimedModal();
    });

    $("btnQuit")?.addEventListener("click", quitSession);

    $("btnCharPick")?.addEventListener("click", openModal);
    $("btnModalClose")?.addEventListener("click", closeModal);
    els.modal?.addEventListener("click", (ev) => {
      if (ev.target === els.modal) closeModal();
    });
    $("btnAutoChar")?.addEventListener("click", () => {
      state.useAutoChar = true;
      state.manualCharId = null;
      persistProgress();
      renderCharModal();
      renderCharacter();
    });

    for (let d = 0; d <= 9; d++) {
      const btn = $("d" + d);
      btn?.addEventListener("click", () => appendDigit(String(d)));
    }
    $("btnClear")?.addEventListener("click", backspace);
    $("btnSubmit")?.addEventListener("click", submitAnswer);

    nextQuestion();
    renderTimedBar();
    renderCharacter();
    renderFooter();
    setNumpadDisabled(false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
