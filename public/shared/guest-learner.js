(function () {
  "use strict";

  var STORAGE_KEY = "study-park-guest-id";

  function randomGuestId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return "g_" + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
    }
    return "g_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  function getGuestId() {
    try {
      var existing = localStorage.getItem(STORAGE_KEY);
      if (existing && /^[a-zA-Z0-9_-]{8,64}$/.test(existing)) return existing;
      var id = randomGuestId();
      localStorage.setItem(STORAGE_KEY, id);
      return id;
    } catch (e) {
      return randomGuestId();
    }
  }

  function getDb() {
    if (!window.__FIREBASE_WEB_CONFIG__ || typeof firebase === "undefined") return null;
    if (!firebase.apps.length) {
      firebase.initializeApp(window.__FIREBASE_WEB_CONFIG__);
    }
    return firebase.firestore();
  }

  window.recordStudyParkGuestUse = function (contentRef) {
    var db = getDb();
    if (!db) return;
    var guestId = getGuestId();
    var ref = db.collection("guestLearners").doc(guestId);
    var content = String(contentRef || "").trim().slice(0, 120);
    ref
      .get()
      .then(function (snap) {
        if (snap.exists) {
          var prev = snap.data().visitCount;
          var visitCount = (typeof prev === "number" ? prev : 0) + 1;
          return ref.update({
            lastSeenAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastContentRef: content || null,
            visitCount: visitCount,
          });
        }
        return ref.set({
          firstSeenAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastSeenAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastContentRef: content || null,
          visitCount: 1,
        });
      })
      .catch(function () {
        /* 集計失敗は学習を妨げない */
      });
  };
})();
