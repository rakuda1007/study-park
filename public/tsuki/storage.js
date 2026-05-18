(function () {
  "use strict";

  const STORAGE_KEY = "tsukiAppData";
  const DATA_VERSION = 2;

  /** 旧 ID（q09〜q17）→ 新 ID（q07〜q15） */
  const LEGACY_ID_MAP = {
    q09: "q07",
    q10: "q08",
    q11: "q09",
    q12: "q10",
    q13: "q11",
    q14: "q12",
    q15: "q13",
    q16: "q14",
    q17: "q15",
  };

  function canUseStorage() {
    try {
      const k = "__tsuki_test__";
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
      mode: "full",
      order: "sequential",
      weakProblems: [],
    };
  }

  function migrateId(id) {
    if (typeof id !== "string") return id;
    return LEGACY_ID_MAP[id] || id;
  }

  function uniqueIds(ids) {
    const seen = new Set();
    const out = [];
    ids.forEach((id) => {
      const next = migrateId(id);
      if (!next || seen.has(next)) return;
      seen.add(next);
      out.push(next);
    });
    return out;
  }

  function parseWeak(raw) {
    if (!Array.isArray(raw)) return [];
    const byId = new Map();
    raw
      .filter((e) => e && typeof e.id === "string" && e.id.length > 0)
      .forEach((e) => {
        const id = migrateId(e.id);
        const n = Math.max(1, Number(e.n) || 1);
        const prev = byId.get(id);
        byId.set(id, prev ? prev + n : n);
      });
    return [...byId.entries()].map(([id, n]) => ({ id, n }));
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
      base.masteredIds = uniqueIds(input.masteredIds);
    }

    base.mode = input.mode === "weak" ? "weak" : "full";
    base.order = input.order === "random" ? "random" : "sequential";
    base.weakProblems = parseWeak(input.weakProblems);

    return base;
  }

  function read() {
    if (!canUseStorage()) return defaultData();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      const data = normalize(JSON.parse(raw));
      if (data.version !== DATA_VERSION) {
        write(data);
      }
      return data;
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

  window.TsukiStorage = {
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
      const mid = migrateId(id);
      const ids = read().masteredIds;
      if (ids.includes(mid)) return ids.length;
      return patch({ masteredIds: [...ids, mid] }).masteredIds.length;
    },
    getTotalCorrect() {
      return read().totalCorrect;
    },
    incrementTotalCorrect() {
      const n = read().totalCorrect + 1;
      patch({ totalCorrect: n });
      return n;
    },
    getMode() {
      return read().mode === "weak" ? "weak" : "full";
    },
    setMode(mode) {
      patch({ mode: mode === "weak" ? "weak" : "full" });
    },
    getOrder() {
      return read().order === "random" ? "random" : "sequential";
    },
    setOrder(order) {
      patch({ order: order === "random" ? "random" : "sequential" });
    },
    getWeakList() {
      return parseWeak(read().weakProblems);
    },
    recordWeak(id) {
      const mid = migrateId(id);
      if (!mid) return read().weakProblems;
      const list = parseWeak(read().weakProblems);
      const found = list.find((e) => e.id === mid);
      if (found) found.n += 1;
      else list.push({ id: mid, n: 1 });
      patch({ weakProblems: list });
      return list;
    },
    removeWeak(id) {
      const mid = migrateId(id);
      const list = parseWeak(read().weakProblems).filter((e) => e.id !== mid);
      patch({ weakProblems: list });
      return list;
    },
    clearAll() {
      if (!canUseStorage()) return;
      localStorage.removeItem(STORAGE_KEY);
    },
    migrateId,
  };
})();
