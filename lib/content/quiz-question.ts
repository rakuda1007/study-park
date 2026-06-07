import { normalizeBlankAnswerList } from "./quiz-answers";
import type { LessonBlock, QuizQuestion } from "./types";

/** 新規クイズ問題の本文デフォルト（空欄記号はエディタから挿入） */
export const DEFAULT_QUIZ_QUESTION_BODY = "";

/** 旧デフォルト本文（読み込み時に空へ正規化する） */
export const LEGACY_DEFAULT_QUIZ_QUESTION_BODY = "①②③④⑤⑥⑦⑧";

export function stripLegacyDefaultQuizBody(text: string): string {
  return text === LEGACY_DEFAULT_QUIZ_QUESTION_BODY ? "" : text;
}

function normalizeParagraphBlocks(blocks: LessonBlock[]): LessonBlock[] {
  return blocks.map((block) =>
    block.kind === "paragraph"
      ? { ...block, text: stripLegacyDefaultQuizBody(block.text) }
      : block,
  );
}

/** 段落ブロックから template 文字列を生成（空欄記号は段落内に含める） */
export function templateFromBlocks(blocks: LessonBlock[]): string {
  return blocks
    .filter((b): b is Extract<LessonBlock, { kind: "paragraph" }> => b.kind === "paragraph")
    .map((b) => b.text)
    .join("\n\n");
}

function normalizeQuizQuestionBlanks(q: QuizQuestion): QuizQuestion {
  if (!q.blanks?.length) return q;
  return {
    ...q,
    blanks: q.blanks.map((blank) => ({
      ...blank,
      answers: normalizeBlankAnswerList(blank.answers, blank.marker),
    })),
  };
}

export function normalizeQuizQuestion(q: QuizQuestion): QuizQuestion {
  if (q.blocks && q.blocks.length > 0) {
    const blocks = normalizeParagraphBlocks(q.blocks);
    const template = templateFromBlocks(blocks) || stripLegacyDefaultQuizBody(q.template);
    return normalizeQuizQuestionBlanks({ ...q, blocks, template });
  }
  const text = stripLegacyDefaultQuizBody(q.template);
  return normalizeQuizQuestionBlanks({
    ...q,
    template: text,
    blocks: [{ kind: "paragraph", text }],
  });
}

export function prepareQuizQuestionForSave(q: QuizQuestion): QuizQuestion {
  const blocks =
    q.blocks && q.blocks.length > 0
      ? q.blocks
      : [{ kind: "paragraph" as const, text: q.template }];
  return {
    ...q,
    blocks,
    template: templateFromBlocks(blocks) || q.template,
  };
}
