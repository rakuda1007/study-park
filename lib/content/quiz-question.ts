import type { LessonBlock, QuizQuestion } from "./types";

/** 段落ブロックから template 文字列を生成（空欄記号は段落内に含める） */
export function templateFromBlocks(blocks: LessonBlock[]): string {
  return blocks
    .filter((b): b is Extract<LessonBlock, { kind: "paragraph" }> => b.kind === "paragraph")
    .map((b) => b.text)
    .join("\n\n");
}

export function normalizeQuizQuestion(q: QuizQuestion): QuizQuestion {
  if (q.blocks && q.blocks.length > 0) {
    return { ...q, template: templateFromBlocks(q.blocks) || q.template };
  }
  return {
    ...q,
    blocks: [{ kind: "paragraph", text: q.template }],
  };
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
