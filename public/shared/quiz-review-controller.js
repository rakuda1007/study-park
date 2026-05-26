/**
 * 出題形式「まとめて確認」の共通制御
 */
(function () {
  "use strict";

  /**
   * @param {{
   *   state: { inReview?: boolean, mode: string, order: string, session: { finished: boolean }, locked: boolean },
   *   els: Record<string, HTMLElement | null | undefined>,
   *   playUiKeys: string[],
   *   closeModal: () => void,
   *   renderStats: () => void,
   *   renderReviewList: () => void,
   *   getTotal: () => number,
   *   applyFormat: (value: string) => void,
   *   startSession: () => void,
   * }} cfg
   */
  function integrate(cfg) {
    const {
      state,
      els,
      playUiKeys,
      closeModal,
      renderStats,
      renderReviewList,
      getTotal,
      applyFormat,
      startSession,
    } = cfg;

    /** display:flex 等が [hidden] を上書きするため style でも非表示にする */
    function setNodeHidden(node, hidden) {
      if (!node) return;
      node.hidden = hidden;
      if (hidden) {
        node.style.display = "none";
      } else {
        node.style.removeProperty("display");
      }
    }

    function setPlayUiVisible(playVisible) {
      const hidePlay = !playVisible;
      playUiKeys.forEach((key) => {
        setNodeHidden(els[key], hidePlay);
      });
      setNodeHidden(els.reviewPanel, playVisible);
      const main = els.quizMain;
      if (main) {
        main.classList.toggle("quiz-main--review", !playVisible);
      }
    }

    function startReviewMode() {
      state.inReview = true;
      state.session.finished = true;
      state.locked = true;
      state.current = null;
      closeModal();
      setPlayUiVisible(false);
      renderReviewList();
      const total = getTotal();
      if (els.questionNum) els.questionNum.textContent = String(total);
      if (els.sessionTotal) els.sessionTotal.textContent = String(total);
      renderStats();
    }

    function exitReviewMode() {
      state.inReview = false;
      state.locked = false;
      setPlayUiVisible(true);
    }

    function onFormatChange(value) {
      const fmt = window.StudyParkQuizFormat;
      if (fmt && value === fmt.FORMAT.REVIEW_ALL) {
        const parsed = fmt.parse(value);
        state.mode = parsed.mode;
        state.order = parsed.order;
        startReviewMode();
        return;
      }
      if (state.inReview) exitReviewMode();
      applyFormat(value);
      startSession();
    }

    function onModalRestart() {
      closeModal();
      if (state.mode === "review" || state.inReview) startReviewMode();
      else startSession();
    }

    return { setPlayUiVisible, startReviewMode, exitReviewMode, onFormatChange, onModalRestart };
  }

  window.StudyParkQuizReviewController = { integrate };
})();
