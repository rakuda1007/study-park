/**
 * 連続正解マイルストーン（問題数に応じた間隔）とキャラ演出
 */
(function () {
  "use strict";

  const TIERS = [3, 10, 20];

  function intervalForTotal(total) {
    const n = Math.max(1, Math.floor(Number(total)) || 1);
    if (n <= 10) return 2;
    if (n <= 15) return 3;
    if (n <= 30) return 4;
    return 5;
  }

  function isMilestone(streak, total) {
    if (streak <= 0) return false;
    return streak % intervalForTotal(total) === 0;
  }

  function milestoneNumber(streak, total) {
    return Math.floor(streak / intervalForTotal(total));
  }

  function tierForStreak(streak, total) {
    const n = milestoneNumber(streak, total);
    if (n <= 0) return 0;
    return TIERS[(n - 1) % TIERS.length];
  }

  function kindForStreak(streak, total) {
    const n = milestoneNumber(streak, total) - 1;
    if (n < 0) return 0;
    return ((n % 4) + 4) % 4;
  }

  function clearPanelFx(panel) {
    if (!panel) return;
    [...panel.classList]
      .filter((c) => c.startsWith("fx-") || c === "fx-playing")
      .forEach((c) => panel.classList.remove(c));
  }

  function charFxClass(ch, tier) {
    if (!ch) return "";
    if (tier === 3) return ch.fx3 || "";
    if (tier === 10) return ch.fx10 || "";
    if (tier === 20) return ch.fx20 || "";
    return "";
  }

  function tierDuration(tier) {
    if (tier === 20) return 3200;
    if (tier === 10) return 2800;
    return 2400;
  }

  function applyTierFx(panel, ch, tier) {
    clearPanelFx(panel);
    if (!panel || tier <= 0) return tierDuration(0);
    const fx = charFxClass(ch, tier);
    panel.classList.add("fx-playing", `fx-tier-${tier}`);
    if (fx) panel.classList.add(fx);
    return tierDuration(tier);
  }

  function bannerMessage(streak, kind) {
    if (kind === 1) return `${streak}れんぱつ！ キャラが変わったよ！`;
    if (kind === 2 || kind === 3) return `${streak}れんぱつ！ みんなで応援！`;
    return `${streak}れんぱつ！ いいちょうし！`;
  }

  /**
   * @param {object} ctx
   * @param {number} ctx.streak
   * @param {number} ctx.total
   * @param {HTMLElement|null} ctx.panel
   * @param {() => object} ctx.getChar
   * @param {() => number} ctx.getCharIndex
   * @param {(idx: number) => void} ctx.setCharIndex
   * @param {number} ctx.charCount
   * @param {() => void} [ctx.renderCharacter]
   * @param {(text: string) => void} [ctx.setSpeech]
   * @param {(text: string) => void} [ctx.showBanner]
   * @param {() => void} [ctx.showSingleChar]
   * @param {() => void} [ctx.showSquad]
   * @param {(ch: object) => string} [ctx.randomPhrase]
   * @param {() => void} [ctx.clearCharFx]
   */
  function applyCelebration(ctx) {
    const streak = ctx.streak;
    const total = ctx.total;
    if (!isMilestone(streak, total)) return false;

    const kind = kindForStreak(streak, total);
    const tier = tierForStreak(streak, total);
    const panel = ctx.panel;
    const getChar = ctx.getChar;

    ctx.clearCharFx?.();
    clearPanelFx(panel);

    let duration = 2400;

    if (kind === 0) {
      ctx.showSingleChar?.();
      duration = applyTierFx(panel, getChar(), tier);
      const ch = getChar();
      const phrase = ctx.randomPhrase?.(ch) || "やったね！";
      ctx.setSpeech?.(`やったね！ ${phrase}`);
    } else if (kind === 1) {
      const nextIdx = (ctx.getCharIndex() + 1) % Math.max(1, ctx.charCount);
      ctx.setCharIndex(nextIdx);
      ctx.showSingleChar?.();
      ctx.renderCharacter?.();
      duration = applyTierFx(panel, getChar(), tier);
      const next = getChar();
      ctx.setSpeech?.(`${next.emoji} ${next.name}が応援にきたよ！`);
    } else if (kind === 2) {
      ctx.showSquad?.();
      panel?.classList.add("fx-squad-pop");
      duration = 2600;
      ctx.setSpeech?.("みんなが応援にきたよ！");
    } else {
      ctx.showSquad?.();
      duration = applyTierFx(panel, getChar(), tier);
      panel?.classList.add("fx-squad-glow");
      ctx.setSpeech?.("みんなキラキラ！ その調子！");
    }

    ctx.showBanner?.(bannerMessage(streak, kind));

    window.setTimeout(() => {
      clearPanelFx(panel);
      ctx.clearCharFx?.();
      ctx.showSingleChar?.();
      ctx.renderCharacter?.();
    }, duration);

    return true;
  }

  window.StudyParkStreakFx = {
    intervalForTotal,
    isMilestone,
    tierForStreak,
    kindForStreak,
    applyCelebration,
    clearPanelFx,
  };
})();
