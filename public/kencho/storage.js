(function () {
  "use strict";

  const STORAGE_KEY = "kenchoAppData";
  const DATA_VERSION = 1;

  function canUseStorage() {
    try {
      const k = "__kencho_test__";
      localStorage.setItem(k, "1");
      localStorage.removeItem(k);
      return true;
    } catch {
      return false;
    }
  }

  function defaultData() {
    return {
      version: DATA_VERSION,
      highStreak: 0,
      bestSessionScore: 0,
      masteredIds: [],
      totalCorrect: 0,
    };
  }

  function normalize(input) {
    const base = defaultData();
    if (!input || typeof input !== "object") return base;

    const high = Number(input.highStreak);
    base.highStreak =
      Number.isFinite(high) && high >= 0 ? Math.floor(high) : 0;

    const best = Number(input.bestSessionScore);
    base.bestSessionScore =
      Number.isFinite(best) && best >= 0 ? Math.floor(best) : 0;

    const total = Number(input.totalCorrect);
    base.totalCorrect =
      Number.isFinite(total) && total >= 0 ? Math.floor(total) : 0;

    if (Array.isArray(input.masteredIds)) {
      base.masteredIds = input.masteredIds.filter(
        (id) => typeof id === "string" && id.length > 0,
      );
    }

    return base;
  }

  function read() {
    if (!canUseStorage()) return defaultData();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      return normalize(JSON.parse(raw));
    } catch {
      return defaultData();
    }
  }

  function write(data) {
    if (!canUseStorage()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }

  function patch(partial) {
    const next = { ...read(), ...partial, version: DATA_VERSION };
    write(next);
    return next;
  }

  window.KenchoStorage = {
    load() {
      return read();
    },
    save(data) {
      write(normalize(data));
    },
    patch,
    getHighStreak() {
      return read().highStreak;
    },
    setHighStreak(n) {
      const v = Math.floor(Number(n));
      if (!Number.isFinite(v) || v < 0) return;
      patch({ highStreak: v });
    },
    getBestSessionScore() {
      return read().bestSessionScore;
    },
    setBestSessionScore(n) {
      const v = Math.floor(Number(n));
      if (!Number.isFinite(v) || v < 0) return;
      const cur = read().bestSessionScore;
      if (v > cur) patch({ bestSessionScore: v });
    },
    getMasteredIds() {
      return [...read().masteredIds];
    },
    addMastered(id) {
      const ids = read().masteredIds;
      if (ids.includes(id)) return ids.length;
      return patch({ masteredIds: [...ids, id] }).masteredIds.length;
    },
    getTotalCorrect() {
      return read().totalCorrect;
    },
    incrementTotalCorrect() {
      const n = read().totalCorrect + 1;
      patch({ totalCorrect: n });
      return n;
    },
    clearAll() {
      if (!canUseStorage()) return;
      localStorage.removeItem(STORAGE_KEY);
    },
  };
})();
