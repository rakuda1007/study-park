/**
 * 出題形式統一・苦手リセット・formatSelect 対応（tsuki 系 app.js）
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const targets = ["tsuki", "shokubutsu", "yukichiiki"];

for (const app of targets) {
  const path = join(root, "public", app, "app.js");
  let s = readFileSync(path, "utf8");

  if (s.includes("function syncFormatSelect")) {
    console.log("skip", app);
    continue;
  }

  s = s.replace(
    /function onModeChange\(nextMode\) \{[\s\S]*?startSession\(\);\s*\}\n\n  function onOrderChange/,
    `function syncFormatSelect() {
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

  function onOrderChange`,
  );

  s = s.replace(
    /function resetProgress\(\) \{[\s\S]*?setSpeech\("リセットしたよ。もういちどがんばろう！"\);\s*\}/,
    `function resetWeakOnly() {
    if (
      !window.confirm(
        "苦手問題の記録をすべて消しますか？\\n（マスターやベスト記録はそのままです）",
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
  }`,
  );

  s = s.replace(
    /if \(els\.modeSelect\) els\.modeSelect\.value = "full";/g,
    `if (els.formatSelect && window.StudyParkQuizFormat) {
        applyFormat(window.StudyParkQuizFormat.FORMAT.SEQUENTIAL);
        syncFormatSelect();
      }`,
  );

  s = s.replace(
    /if \(els\.modeSelect\) els\.modeSelect\.value = state\.mode;\s*if \(els\.orderSelect\) els\.orderSelect\.value = state\.order;/g,
    "syncFormatSelect();",
  );

  s = s.replace(
    /els\.orderSelect = \$\("orderSelect"\);\s*els\.modeSelect = \$\("modeSelect"\);\s*els\.btnReset = \$\("btnReset"\);/,
    `els.formatSelect = $("formatSelect");
    els.btnResetWeak = $("btnResetWeak");`,
  );

  s = s.replace(
    /if \(els\.orderSelect\) \{[\s\S]*?\}\n\n    if \(els\.modeSelect\) \{[\s\S]*?\}\n\n    startSession/,
    `syncFormatSelect();
    if (els.formatSelect) {
      els.formatSelect.addEventListener("change", () => {
        onFormatChange(els.formatSelect.value);
      });
    }

    startSession`,
  );

  s = s.replace("els.btnReset?.addEventListener(\"click\", resetProgress);", "els.btnResetWeak?.addEventListener(\"click\", resetWeakOnly);");
  s = s.replace(
    /\$\("btnQuit"\)\?\.addEventListener\("click", quitSession\);\s*els\.btnReveal/,
    "els.btnReveal",
  );

  s = s.replace(
    /loadProgress\(\);\s*renderSquadGrid\(\);/,
    `loadProgress();
    renderSquadGrid();
    syncFormatSelect();`,
  );

  writeFileSync(path, s);
  console.log("patched", app);
}
