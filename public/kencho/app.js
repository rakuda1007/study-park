(function () {
  "use strict";

  const store = window.KenchoStorage;
  const PREFS = window.KENCHO_PREFECTURES || [];
  const TOTAL = window.KENCHO_TOTAL || PREFS.length;

  const STREAK_MILESTONES = [3, 5, 10, 15, 20];
  const MASTERED_MILESTONES = [5, 10, 15, 20, 25, 30, 35, 40, 47];

  const state = {
    current: null,
    choices: [],
    streak: 0,
    highStreak: 0,
    masteredIds: [],
    locked: false,
    shownStreakMilestones: new Set(),
    shownMasterMilestones: new Set(),
  };

  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  function prefById(id) {
    return PREFS.find((p) => p.id === id);
  }

  function allCapitals() {
    return PREFS.map((p) => p.capital);
  }

  function loadProgress() {
    const data = store ? store.load() : null;
    if (!data) return;
    state.highStreak = data.highStreak || 0;
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

  function pickQuestionPref() {
    const unmastered = PREFS.filter((p) => !state.masteredIds.includes(p.id));
    const pool = unmastered.length > 0 ? unmastered : PREFS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function buildChoices(pref) {
    const wrongPool = allCapitals().filter((c) => c !== pref.capital);
    const wrong = shuffle(wrongPool).slice(0, 3);
    return shuffle([pref.capital, ...wrong]);
  }

  function setSpeech(text) {
    if (els.speech) els.speech.textContent = text;
  }

  function renderStats() {
    const mastered = state.masteredIds.length;
    if (els.streakEl) els.streakEl.textContent = String(state.streak);
    if (els.highEl) els.highEl.textContent = String(state.highStreak);
    if (els.masteredEl) {
      els.masteredEl.textContent = `${mastered} / ${TOTAL}`;
    }
    if (els.masterFill) {
      els.masterFill.style.width = `${(mastered / TOTAL) * 100}%`;
    }
  }

  function renderQuestion() {
    const pref = state.current;
    if (!pref || !els.prefName) return;
    els.prefName.textContent = pref.name;
    if (!els.choicesWrap) return;

    els.choicesWrap.innerHTML = "";
    state.choices.forEach((capital) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = capital;
      btn.dataset.capital = capital;
      btn.addEventListener("click", () => onChoice(capital));
      els.choicesWrap.appendChild(btn);
    });

    if (els.questionCard) {
      els.questionCard.classList.remove("flash-ok", "flash-ng");
    }
  }

  function nextQuestion() {
    state.locked = false;
    state.current = pickQuestionPref();
    state.choices = buildChoices(state.current);
    setSpeech("県庁所在地はどこ？");
    renderQuestion();
  }

  function showBanner(text) {
    if (!els.banner) return;
    els.banner.textContent = text;
    els.banner.classList.add("show");
    window.setTimeout(() => els.banner.classList.remove("show"), 2400);
  }

  function streakMessage(n) {
    if (n >= 20) return "20れんぱつ！ すごすぎる！";
    if (n >= 15) return "15れんぱつ！ かんぺきに近い！";
    if (n >= 10) return "10れんぱつ！ 天才かも！";
    if (n >= 5) return "5れんぱつ！ いいちょうし！";
    return "3れんぱつ！ その調子！";
  }

  function masteredMessage(n) {
    if (n >= 47) return "🗾 ぜんこく制覇！\n47都道府県ぜんぶマスター！";
    if (n >= 40) return "40けんマスター！\nあと少しでぜんこく制覇！";
    if (n >= 35) return "35けんマスター！\nすごい進歩だね！";
    if (n >= 30) return "30けんマスター！\n半分以上クリア！";
    if (n >= 25) return "25けんマスター！\nどんどん覚えてきたね！";
    if (n >= 20) return "20けんマスター！\n日本地図が頭に入ってきた！";
    if (n >= 15) return "15けんマスター！\nいいペースだよ！";
    if (n >= 10) return "10けんマスター！\nがんばり屋さんだね！";
    return "5けんマスター！\nはじめの一歩クリア！";
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

  function checkStreakMilestones(isNewHigh) {
    if (!STREAK_MILESTONES.includes(state.streak)) return;
    if (state.shownStreakMilestones.has(state.streak)) return;
    state.shownStreakMilestones.add(state.streak);

    if (isNewHigh && state.streak >= 5) {
      openModal(
        "🏆 最高記録更新！",
        `${streakMessage(state.streak)}\n連続正解 ${state.streak}問！（ベスト更新）`,
        false,
      );
      playRecordBurst();
    } else {
      showBanner(streakMessage(state.streak));
    }
  }

  function checkMasteredMilestones(count) {
    if (!MASTERED_MILESTONES.includes(count)) return;
    if (state.shownMasterMilestones.has(count)) return;
    state.shownMasterMilestones.add(count);

    const msg = masteredMessage(count);
    if (count >= 47) {
      openModal("🗾 ぜんこく制覇！", msg, true);
      playRecordBurst();
      setSpeech("ぜんぶおぼえたね！ 日本地図マスター！");
      return;
    }
    if (count >= 20) {
      openModal("🎉 マスター記念！", msg, false);
      if (count === 40) playRecordBurst();
    } else {
      showBanner(masteredMessage(count).replace("\n", " "));
    }
  }

  function highlightChoices(correctCapital) {
    const buttons = els.choicesWrap?.querySelectorAll(".choice-btn");
    if (!buttons) return;
    buttons.forEach((btn) => {
      const cap = btn.dataset.capital;
      btn.disabled = true;
      if (cap === correctCapital) {
        btn.classList.add("correct");
      } else if (btn.classList.contains("wrong")) {
        btn.classList.add("wrong");
      } else {
        btn.classList.add("dim");
      }
    });
  }

  function onChoice(capital) {
    if (state.locked || !state.current) return;
    state.locked = true;

    const pref = state.current;
    const correct = capital === pref.capital;

    if (correct) {
      const prevHigh = state.highStreak;
      state.streak += 1;
      persistHighStreak();
      const isNewHigh = state.highStreak > prevHigh;

      const wasNew = !state.masteredIds.includes(pref.id);
      if (wasNew && store) {
        store.addMastered(pref.id);
        state.masteredIds = store.getMasteredIds();
        if (store.incrementTotalCorrect) store.incrementTotalCorrect();
      }

      if (els.questionCard) {
        els.questionCard.classList.add("flash-ok");
      }
      setSpeech(`せいかい！ ${pref.name}は「${pref.capital}」だよ！`);
      highlightChoices(pref.capital);

      renderStats();
      checkStreakMilestones(isNewHigh);
      if (wasNew) checkMasteredMilestones(state.masteredIds.length);

      window.setTimeout(() => nextQuestion(), 900);
    } else {
      state.streak = 0;
      state.shownStreakMilestones.clear();

      const buttons = els.choicesWrap?.querySelectorAll(".choice-btn");
      buttons?.forEach((btn) => {
        if (btn.dataset.capital === capital) btn.classList.add("wrong");
      });

      if (els.questionCard) {
        els.questionCard.classList.add("flash-ng");
      }
      setSpeech(
        `ざんねん… ${pref.name}は「${pref.capital}」だよ。つぎはいこう！`,
      );
      highlightChoices(pref.capital);
      renderStats();

      window.setTimeout(() => nextQuestion(), 1400);
    }
  }

  function init() {
    els.speech = $("speech");
    els.prefName = $("prefName");
    els.choicesWrap = $("choices");
    els.questionCard = $("questionCard");
    els.streakEl = $("streak");
    els.highEl = $("highStreak");
    els.masteredEl = $("masteredCount");
    els.masterFill = $("masterFill");
    els.banner = $("celebrateBanner");
    els.modal = $("celebrateModal");
    els.modalCard = $("celebrateModalCard");
    els.modalTitle = $("celebrateModalTitle");
    els.modalMsg = $("celebrateModalMsg");
    els.modalImg = $("celebrateModalImg");

    loadProgress();
    renderStats();
    nextQuestion();

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
