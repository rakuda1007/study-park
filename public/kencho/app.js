(function () {
  "use strict";

  const store = window.KenchoStorage;
  const PREFS = window.KENCHO_PREFECTURES || [];
  const TOTAL = window.KENCHO_TOTAL || PREFS.length;
  const CHARS = window.KENCHO_CHARACTERS || [];
  const SQUAD_IDS = window.KENCHO_SQUAD_IDS || ["orange", "dog", "cat", "tofu"];

  const MASTERED_MILESTONES = [5, 10, 15, 20, 25, 30, 35, 40, 47];

  const state = {
    current: null,
    choices: [],
    streak: 0,
    sessionBestStreak: 0,
    highStreak: 0,
    bestSessionScore: 0,
    masteredIds: [],
    charIndex: 0,
    locked: false,
    shownMasterMilestones: new Set(),
    session: {
      queue: [],
      index: 0,
      correct: 0,
      finished: false,
    },
  };

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function prefById(id) {
    return PREFS.find((p) => p.id === id);
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

  function allCapitals() {
    return PREFS.map((p) => p.capital);
  }

  function loadProgress() {
    const data = store ? store.load() : null;
    if (!data) return;
    state.highStreak = data.highStreak || 0;
    state.bestSessionScore = data.bestSessionScore || 0;
    state.masteredIds = store ? store.getMasteredIds() : [];
    state.shownMasterMilestones = new Set(
      MASTERED_MILESTONES.filter((n) => state.masteredIds.length >= n),
    );
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
    const mastered = state.masteredIds.length;

    if (els.questionNum) els.questionNum.textContent = String(Math.min(idx + 1, TOTAL));
    if (els.sessionScore) els.sessionScore.textContent = String(state.session.correct);
    if (els.streakEl) els.streakEl.textContent = String(state.streak);
    if (els.highEl) els.highEl.textContent = String(state.highStreak);
    if (els.masteredEl) els.masteredEl.textContent = `${mastered} / ${TOTAL}`;
    if (els.sessionFill) {
      els.sessionFill.style.width = `${(idx / TOTAL) * 100}%`;
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
    state.session = {
      queue: shuffle(PREFS.map((p) => p.id)),
      index: 0,
      correct: 0,
      finished: false,
    };
    state.streak = 0;
    state.sessionBestStreak = 0;
    state.locked = false;
    state.charIndex = 0;

    closeModal();
    showSingleChar();
    renderCharacter();
    setSpeech("47問チャレンジ！ がんばって！");
    renderStats();
    nextQuestion();
  }

  function nextQuestion() {
    if (state.session.index >= TOTAL) {
      finishSession();
      return;
    }

    state.locked = false;
    const id = state.session.queue[state.session.index];
    state.current = prefById(id);
    state.choices = buildChoices(state.current);
    setSpeech("県庁所在地はどこ？");
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

  function masteredMessage(n) {
    if (n >= 47) return "ぜんこくマスター！ 47都道府県おぼえたね！";
    if (n >= 30) return `${n}けんマスター！ すごい！`;
    if (n >= 15) return `${n}けんマスター！ いいペース！`;
    return `${n}けんマスター！`;
  }

  function checkMasteredMilestones(count) {
    if (!MASTERED_MILESTONES.includes(count)) return;
    if (state.shownMasterMilestones.has(count)) return;
    state.shownMasterMilestones.add(count);
    showBanner(masteredMessage(count));
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

    const score = state.session.correct;
    const perfect = score === TOTAL;

    if (store) {
      store.setBestSessionScore(score);
      state.bestSessionScore = Math.max(state.bestSessionScore, score);
    }

    renderStats();
    renderQuestion();

    let msg = `${score}問 せいかい / ${TOTAL}問\n`;
    msg += `この回の連続ベスト ${state.sessionBestStreak}問\n`;
    msg += `ベスト記録 ${state.bestSessionScore}問 / ${TOTAL}問`;

    if (perfect) {
      msg += "\n\n🎉 ぜんもんせいかい！ すごすぎる！";
      openModal("🗾 47問クリア！", msg, true);
      playRecordBurst();
      showSquad();
      setSpeech("ぜんぶせいかい！ みんなも大喜び！");
    } else if (score >= 35) {
      openModal("🎌 1しゅうごう！", msg, true);
      setSpeech("おつかれさま！ よくがんばったね！");
    } else {
      openModal("🎌 1しゅうごう！", msg, false);
      setSpeech("おつかれさま！ もういちど挑戦してみよう！");
    }

    if (els.btnModalRestart) els.btnModalRestart.hidden = false;
  }

  function advanceAfterAnswer() {
    state.session.index += 1;
    if (state.session.index >= TOTAL) {
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

      const wasNew = !state.masteredIds.includes(pref.id);
      if (wasNew && store) {
        store.addMastered(pref.id);
        state.masteredIds = store.getMasteredIds();
        store.incrementTotalCorrect();
        checkMasteredMilestones(state.masteredIds.length);
      }

      els.questionCard?.classList.add("flash-ok");
      setSpeech(`せいかい！ ${pref.name}は「${pref.capital}」`);
      highlightChoices(pref.capital);
      renderStats();
      applyStreakFx(state.streak);
      advanceAfterAnswer();
    } else {
      state.streak = 0;
      els.choicesWrap?.querySelectorAll(".choice-btn").forEach((btn) => {
        if (btn.dataset.capital === capital) btn.classList.add("wrong");
      });
      els.questionCard?.classList.add("flash-ng");
      setSpeech(`ざんねん… 正解は「${pref.capital}」だよ`);
      highlightChoices(pref.capital);
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
    els.prefName = $("prefName");
    els.choicesWrap = $("choices");
    els.questionCard = $("questionCard");
    els.questionNum = $("questionNum");
    els.sessionScore = $("sessionScore");
    els.streakEl = $("streak");
    els.highEl = $("highStreak");
    els.masteredEl = $("masteredCount");
    els.sessionFill = $("sessionFill");
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
    startSession();

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
