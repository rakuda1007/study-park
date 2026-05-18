/**
 * 出題形式プルダウン（順番・ランダム・苦手）の共通ヘルパー
 */
(function () {
  "use strict";

  const FORMAT = {
    SEQUENTIAL: "sequential-full",
    RANDOM: "random-full",
    WEAK: "weak",
  };

  function parse(value) {
    if (value === FORMAT.WEAK) {
      return { mode: "weak", order: "sequential" };
    }
    if (value === FORMAT.RANDOM) {
      return { mode: "full", order: "random" };
    }
    return { mode: "full", order: "sequential" };
  }

  function fromState(mode, order) {
    if (mode === "weak") return FORMAT.WEAK;
    if (order === "random") return FORMAT.RANDOM;
    return FORMAT.SEQUENTIAL;
  }

  function optionLabels() {
    return [
      { value: FORMAT.SEQUENTIAL, label: "順番に出題" },
      { value: FORMAT.RANDOM, label: "ランダムに出題" },
      { value: FORMAT.WEAK, label: "苦手問題を出題" },
    ];
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
