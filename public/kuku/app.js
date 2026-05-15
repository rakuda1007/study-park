(function () {
  "use strict";

  const store = window.KukuStorage;
  const CORRECT_PER_LEVEL = 10;

  const CHARS = window.KUKU_CHARACTERS || [];
  const ROSTER_IDS = window.KUKU_CHAR_ROSTER_IDS || CHARS.map((c) => c.id);

  /** @type {{ mode: 'sequential'|'random'|'weak', a: number, b: number, seqIndex: number, seqOrder: {a:number,b:number}[], input: string, streak: number, totalCorrect: number, manualCharId: string|null, useAutoChar: boolean }} */
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

  function applySavedData(data) {
    if (!data) return;
    state.mode = data.mode;
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
    if (state.mode === "sequential") {
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
    if (state.mode !== "sequential") return;
    state.seqIndex = (state.seqIndex + 1) % (state.seqOrder.length || 81);
  }

  function expected() {
    return state.a * state.b;
  }

  function clearFxClasses(panel) {
    if (!panel) return;
    const toRemove = [...panel.classList].filter((c) => c.startsWith("fx-"));
    toRemove.forEach((c) => panel.classList.remove(c));
  }

  function applyStreakFxMilestone(streak) {
    const panel = els.characterPanel;
    const ch = currentCharacter();
    clearFxClasses(panel);
    if (!ch) return;
    let cls = "";
    if (streak === 20) cls = ch.fx20;
    else if (streak === 10) cls = ch.fx10;
    else if (streak === 3) cls = ch.fx3;
    if (!cls) return;
    panel.classList.add(cls);
    window.setTimeout(() => clearFxClasses(panel), 2200);
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

    if (state.streak === 3 || state.streak === 10 || state.streak === 20) {
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
    if (state.input.length >= 2) return;
    if (state.input === "0" && d === "0") return;
    state.input += d;
    renderProblem();
  }

  function backspace() {
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

    const modeSelect = $("modeSelect");

    if (store) {
      const saved = store.load();
      applySavedData(saved);
      if (
        saved.manualCharacterId &&
        !CHARS.some((c) => c.id === saved.manualCharacterId)
      ) {
        state.manualCharId = null;
        state.useAutoChar = true;
      }
    }

    state.seqOrder = buildSequentialOrder();

    if (modeSelect) {
      modeSelect.value = state.mode;
      modeSelect.addEventListener("change", () => {
        state.mode = modeSelect.value;
        state.seqIndex = 0;
        state.streak = 0;
        persistProgress();
        nextQuestion();
        renderFooter();
        renderCharacter();
      });
    }

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
    renderCharacter();
    renderFooter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
