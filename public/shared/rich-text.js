/**
 * 段落用リッチテキスト（クイズ静的アプリ用）
 * **太字**、__下線__、^^大^^、<<小>>、行頭 - / ・ で箇条書き
 */
(function () {
  "use strict";

  const INLINE_RE = /(\*\*[^*]+\*\*|__[^_]+__|\^\^[^\^]+\^\^|<<[^>]+>>)/g;

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function inlineHtml(text) {
    if (!text) return "";
    return String(text)
      .split(INLINE_RE)
      .map((part) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return "<strong>" + escHtml(part.slice(2, -2)) + "</strong>";
        }
        if (part.startsWith("__") && part.endsWith("__") && part.length > 4) {
          return (
            '<span class="rich-text-underline">' + escHtml(part.slice(2, -2)) + "</span>"
          );
        }
        if (part.startsWith("^^") && part.endsWith("^^") && part.length > 4) {
          return '<span class="rich-text-large">' + escHtml(part.slice(2, -2)) + "</span>";
        }
        if (part.startsWith("<<") && part.endsWith(">>") && part.length > 4) {
          return '<span class="rich-text-small">' + escHtml(part.slice(2, -2)) + "</span>";
        }
        return escHtml(part);
      })
      .join("");
  }

  function isBulletLine(line) {
    return /^[-・]\s/.test(String(line).trim());
  }

  function bulletItemText(line) {
    return String(line)
      .trim()
      .replace(/^[-・]\s+/, "");
  }

  function splitRichLines(text) {
    const lines = String(text).split("\n");
    const blocks = [];
    let bulletItems = [];
    let paragraphLines = [];

    function flushBullets() {
      if (bulletItems.length) {
        blocks.push({ kind: "ul", items: bulletItems.slice() });
        bulletItems = [];
      }
    }

    function flushParagraph() {
      if (paragraphLines.length) {
        blocks.push({ kind: "p", text: paragraphLines.join("\n") });
        paragraphLines = [];
      }
    }

    lines.forEach((line) => {
      if (isBulletLine(line)) {
        flushParagraph();
        bulletItems.push(bulletItemText(line));
        return;
      }
      flushBullets();
      if (String(line).trim() === "") {
        flushParagraph();
        blocks.push({ kind: "gap" });
      } else {
        paragraphLines.push(line);
      }
    });
    flushParagraph();
    flushBullets();
    return blocks;
  }

  function richTextToHtml(text, paragraphClass) {
    const pClass = paragraphClass || "lesson-body";
    const blocks = splitRichLines(text);
    if (!blocks.length) return "";

    return blocks
      .map((block) => {
        if (block.kind === "ul") {
          return (
            '<ul class="rich-list">' +
            block.items.map((item) => "<li>" + inlineHtml(item) + "</li>").join("") +
            "</ul>"
          );
        }
        if (block.kind === "gap") {
          return '<p class="rich-text-gap" aria-hidden="true"></p>';
        }
        return '<p class="' + pClass + '">' + inlineHtml(block.text) + "</p>";
      })
      .join("");
  }

  function needsBlockLayout(text) {
    const raw = String(text || "");
    if (!raw) return false;
    if (raw.split("\n").some((line) => isBulletLine(line))) return true;
    return /\n\s*\n/.test(raw);
  }

  /** 正答表示用（空欄記号と同じ行に並べる） */
  function answerDisplayHtml(text) {
    const raw = String(text || "");
    if (!needsBlockLayout(raw)) {
      return inlineHtml(raw);
    }
    return richTextToHtml(raw, "answer-rich");
  }

  function appendRichText(container, text, paragraphClass) {
    if (!container) return;
    const html = richTextToHtml(text, paragraphClass);
    if (!html) return;
    const wrap = document.createElement("div");
    wrap.className = "rich-text-block";
    wrap.innerHTML = html;
    while (wrap.firstChild) {
      container.appendChild(wrap.firstChild);
    }
  }

  window.StudyParkRichText = {
    inlineHtml: inlineHtml,
    richTextToHtml: richTextToHtml,
    answerDisplayHtml: answerDisplayHtml,
    appendRichText: appendRichText,
  };
})();
