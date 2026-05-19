/**
 * 出題形式プルダウン（順番・ランダム・苦手）の共通ヘルパー
 */
(function () {
  "use strict";

  const FORMAT = {
    SEQUENTIAL: "sequential-full",
    RANDOM: "random-full",
    WEAK: "weak",
    REVIEW_ALL: "review-all",
  };

  function parse(value) {
    if (value === FORMAT.REVIEW_ALL) {
      return { mode: "review", order: "sequential" };
    }
    if (value === FORMAT.WEAK) {
      return { mode: "weak", order: "sequential" };
    }
    if (value === FORMAT.RANDOM) {
      return { mode: "full", order: "random" };
    }
    return { mode: "full", order: "sequential" };
  }

  function fromState(mode, order) {
    if (mode === "review") return FORMAT.REVIEW_ALL;
    if (mode === "weak") return FORMAT.WEAK;
    if (order === "random") return FORMAT.RANDOM;
    return FORMAT.SEQUENTIAL;
  }

  function optionLabels() {
    const opts = [
      { value: FORMAT.SEQUENTIAL, label: "順番に出題" },
      { value: FORMAT.RANDOM, label: "ランダムに出題" },
      { value: FORMAT.WEAK, label: "苦手問題を出題" },
    ];
    if (!window.__STUDY_PARK_QUIZ_REVIEW_DISABLED__) {
      opts.push({ value: FORMAT.REVIEW_ALL, label: "まとめて確認" });
    }
    return opts;
  }

  function fillSelect(select, total, selected) {
    if (!select) return;
    const labels = optionLabels();
    const want = selected ?? select.value;
    select.innerHTML = "";
    labels.forEach(({ value, label }) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      select.appendChild(opt);
    });
    const valid = labels.some((o) => o.value === want);
    select.value = valid ? want : FORMAT.SEQUENTIAL;
  }

  window.StudyParkQuizFormat = {
    FORMAT,
    parse,
    fromState,
    fillSelect,
  };
})();
