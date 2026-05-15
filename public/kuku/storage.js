/**
 * 九九アプリ — ブラウザ内保存（localStorage）
 * Firebase Storage / Firestore は使わない。
 */
(function () {
  "use strict";

  const STORAGE_KEY = "kukuAppData";
  const DATA_VERSION = 1;

  const LEGACY_KEYS = {
    weak: "kukuWeakProblems",
    manual: "kukuManualCharacterId",
    auto: "kukuUseAutoCharacter",
    total: "kukuTotalCorrect",
  };

  function defaultData() {
    return {
      version: DATA_VERSION,
      mode: "sequential",
      seqIndex: 0,
      totalCorrect: 0,
      streak: 0,
      weakProblems: [],
      manualCharacterId: null,
      useAutoCharacter: true,
      bestTimedSeconds: null,
    };
  }

  function canUseStorage() {
    try {
      const k = "__kuku_test__";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      return true;
    } catch {
      return false;
    }
  }

  function parseWeak(raw) {
    try {
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr
        .filter(
          (e) =>
            e &&
            typeof e.a === "number" &&
            typeof e.b === "number" &&
            e.a >= 1 &&
            e.a <= 9 &&
            e.b >= 1 &&
            e.b <= 9,
        )
        .map((e) => ({
          a: e.a,
          b: e.b,
          n: Math.max(1, Number(e.n) || 1),
        }));
    } catch {
      return [];
    }
  }

  function migrateLegacy() {
    if (!canUseStorage()) return defaultData();

    const data = defaultData();
    let migrated = false;

    const weakRaw = localStorage.getItem(LEGACY_KEYS.weak);
    if (weakRaw) {
      data.weakProblems = parseWeak(weakRaw);
      migrated = true;
    }

    const totalRaw = localStorage.getItem(LEGACY_KEYS.total);
    if (totalRaw != null) {
      const n = parseInt(totalRaw, 10);
      if (Number.isFinite(n) && n >= 0) data.totalCorrect = n;
      migrated = true;
    }

    const manual = localStorage.getItem(LEGACY_KEYS.manual);
    if (manual) {
      data.manualCharacterId = manual;
      migrated = true;
    }

    const auto = localStorage.getItem(LEGACY_KEYS.auto);
    if (auto != null) {
      data.useAutoCharacter = auto !== "0";
      migrated = true;
    }

    if (migrated) {
      write(data);
      Object.values(LEGACY_KEYS).forEach((k) => localStorage.removeItem(k));
    }

    return data;
  }

  function normalize(input) {
    const base = defaultData();
    if (!input || typeof input !== "object") return base;

    const mode = input.mode;
    base.mode =
      mode === "random" ||
      mode === "weak" ||
      mode === "sequential" ||
      mode === "timed"
        ? mode
        : "sequential";

    const best = Number(input.bestTimedSeconds);
    base.bestTimedSeconds =
      Number.isFinite(best) && best > 0 ? Math.floor(best) : null;

    const seqIndex = Number(input.seqIndex);
    base.seqIndex =
      Number.isFinite(seqIndex) && seqIndex >= 0
        ? Math.min(80, Math.floor(seqIndex))
        : 0;

    const totalCorrect = Number(input.totalCorrect);
    base.totalCorrect =
      Number.isFinite(totalCorrect) && totalCorrect >= 0
        ? Math.floor(totalCorrect)
        : 0;

    const streak = Number(input.streak);
    base.streak =
      Number.isFinite(streak) && streak >= 0 ? Math.floor(streak) : 0;

    base.weakProblems = parseWeak(
      JSON.stringify(input.weakProblems || []),
    );

    if (
      typeof input.manualCharacterId === "string" &&
      input.manualCharacterId.trim()
    ) {
      base.manualCharacterId = input.manualCharacterId.trim();
    }

    base.useAutoCharacter = input.useAutoCharacter !== false;

    return base;
  }

  function read() {
    if (!canUseStorage()) return defaultData();

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacy();

    try {
      return normalize(JSON.parse(raw));
    } catch {
      return migrateLegacy();
    }
  }

  function write(data) {
    if (!canUseStorage()) return false;
    const payload = normalize(data);
    payload.version = DATA_VERSION;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }

  function patch(partial) {
    const next = { ...read(), ...partial };
    write(next);
    return next;
  }

  window.KukuStorage = {
    load: read,
    save: write,
    patch,
    recordWeak(a, b) {
      const data = read();
      const list = data.weakProblems.slice();
      const found = list.find((e) => e.a === a && e.b === b);
      if (found) {
        found.n = (found.n || 1) + 1;
      } else {
        list.push({ a, b, n: 1 });
      }
      data.weakProblems = list;
      write(data);
      return list;
    },
    getWeakList() {
      return read().weakProblems;
    },
    getBestTimedSeconds() {
      const n = read().bestTimedSeconds;
      return Number.isFinite(n) && n > 0 ? n : null;
    },
    setBestTimedSeconds(sec) {
      const n = Math.floor(Number(sec));
      if (!Number.isFinite(n) || n <= 0) return;
      patch({ bestTimedSeconds: n });
    },
    clearAll() {
      if (!canUseStorage()) return;
      localStorage.removeItem(STORAGE_KEY);
      Object.values(LEGACY_KEYS).forEach((k) => localStorage.removeItem(k));
    },
    isAvailable: canUseStorage,
  };
})();
