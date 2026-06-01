/**
 * 全問まとめて確認（問題＋答え一覧）
 */
(function () {
  "use strict";

  function appendRichParagraph(container, text, className) {
    const rt = window.StudyParkRichText;
    if (rt && typeof rt.appendRichText === "function") {
      rt.appendRichText(container, text, className || "question-paragraph");
      return;
    }
    const p = document.createElement("p");
    p.className = className || "question-paragraph";
    p.textContent = text;
    container.appendChild(p);
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

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function answerTextHtml(text) {
    const rt = window.StudyParkRichText;
    if (rt && typeof rt.answerDisplayHtml === "function") {
      return rt.answerDisplayHtml(text || "");
    }
    if (rt && typeof rt.inlineHtml === "function") {
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
