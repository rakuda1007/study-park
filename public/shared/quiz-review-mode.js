/**
 * 全問まとめて確認（問題＋答え一覧）
 */
(function () {
  "use strict";

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const INLINE_RE = /(\*\*[^*]+\*\*|__[^_]+__|\^\^[^\^]+\^\^|<<[^>]+>>)/g;

  function localInlineHtml(text) {
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

  function localRichTextToHtml(text, paragraphClass) {
    const pClass = paragraphClass || "question-paragraph";
    const blocks = splitRichLines(text);
    if (!blocks.length) return "";

    return blocks
      .map((block) => {
        if (block.kind === "ul") {
          return (
            '<ul class="rich-list">' +
            block.items.map((item) => "<li>" + localInlineHtml(item) + "</li>").join("") +
            "</ul>"
          );
        }
        if (block.kind === "gap") {
          return '<p class="rich-text-gap" aria-hidden="true"></p>';
        }
        return '<p class="' + pClass + '">' + localInlineHtml(block.text) + "</p>";
      })
      .join("");
  }

  function localAppendRichText(container, text, paragraphClass) {
    const html = localRichTextToHtml(text, paragraphClass);
    if (!html) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    while (wrap.firstChild) {
      container.appendChild(wrap.firstChild);
    }
  }

  function localAnswerDisplayHtml(text) {
    const raw = String(text || "");
    if (!raw) return "";
    if (raw.split("\n").some((line) => isBulletLine(line)) || /\n\s*\n/.test(raw)) {
      return localRichTextToHtml(raw, "answer-rich");
    }
    return localInlineHtml(raw);
  }

  function richTextApi() {
    const rt = window.StudyParkRichText;
    if (rt && typeof rt.appendRichText === "function") return rt;
    return {
      appendRichText: localAppendRichText,
      inlineHtml: localInlineHtml,
      answerDisplayHtml: localAnswerDisplayHtml,
    };
  }

  function appendRichParagraph(container, text, className) {
    richTextApi().appendRichText(container, text, className || "question-paragraph");
  }

  function appendQuestionBody(container, q) {
    const blocks = q.blocks;
    if (Array.isArray(blocks) && blocks.length > 0) {
      blocks.forEach((block) => {
        if (block.kind === "paragraph") {
          appendRichParagraph(container, block.text || "", "question-paragraph");
        } else if (block.kind === "image" && block.src) {
          const fig = document.createElement("figure");
          fig.className = "question-figure";
          const img = document.createElement("img");
          img.src = block.src;
          img.alt = block.alt || "";
          img.className = "question-figure-img";
          img.loading = "lazy";
          fig.appendChild(img);
          if (block.caption) {
            const cap = document.createElement("figcaption");
            cap.className = "question-figure-caption";
            cap.textContent = block.caption;
            fig.appendChild(cap);
          }
          container.appendChild(fig);
        }
      });
      return;
    }
    appendRichParagraph(container, q.template || "", "question-paragraph");
  }

  function answerTextHtml(text) {
    const rt = richTextApi();
    if (typeof rt.answerDisplayHtml === "function") {
      return rt.answerDisplayHtml(text || "");
    }
    if (typeof rt.inlineHtml === "function") {
      return rt.inlineHtml(text || "");
    }
    return escHtml(text || "");
  }

  function renderAnswerList(ul, entries) {
    ul.innerHTML = "";
    entries.forEach((entry) => {
      const li = document.createElement("li");
      li.innerHTML =
        `<span class="answer-marker">${escHtml(entry.marker)}</span>` +
        `<span class="answer-text">${answerTextHtml(entry.text)}</span>`;
      ul.appendChild(li);
    });
  }

  /**
   * @param {HTMLElement} listEl
   * @param {object[]} questions
   * @param {{ questionNumber: (q: object) => number, answerEntries: (q: object) => {marker:string,text:string}[] }} helpers
   */
  function renderAll(listEl, questions, helpers) {
    if (!listEl) return;
    listEl.replaceChildren();
    const sorted = [...questions].sort(
      (a, b) => helpers.questionNumber(a) - helpers.questionNumber(b),
    );

    sorted.forEach((q) => {
      const article = document.createElement("article");
      article.className = "review-item";

      const heading = document.createElement("h3");
      heading.className = "review-item-label";
      heading.textContent = q.label || `問${helpers.questionNumber(q)}`;

      const qWrap = document.createElement("div");
      qWrap.className = "review-item-question";
      appendQuestionBody(qWrap, q);

      const ansWrap = document.createElement("div");
      ansWrap.className = "review-item-answers";
      const ansTitle = document.createElement("p");
      ansTitle.className = "review-item-answers-title";
      ansTitle.textContent = "答え";
      const ul = document.createElement("ul");
      ul.className = "answer-list";
      renderAnswerList(ul, helpers.answerEntries(q));

      ansWrap.append(ansTitle, ul);
      article.append(heading, qWrap, ansWrap);
      listEl.appendChild(article);
    });
  }

  window.StudyParkQuizReview = { renderAll, appendQuestionBody };
})();
