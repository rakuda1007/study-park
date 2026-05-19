/** コンテンツ種別 */
export type ContentType = "lesson" | "quiz";

export type ContentStatus = "draft" | "published" | "archived";

export type QuizKind = "blank";

/** 空欄クイズの正答 */
export type BlankAnswer = {
  marker: string;
  answers: string[];
};

/** 空欄クイズの1問 */
export type QuizQuestion = {
  id: string;
  number: number;
  label: string;
  /** 表示用ブロック（段落・画像）。未設定時は template のみ */
  blocks?: LessonBlock[];
  template: string;
  blanks: BlankAnswer[];
};

/** レッスンの1ブロック */
export type LessonBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "image"; src: string; alt?: string; caption?: string }
  | { kind: "html"; html: string };

/** レッスンの1セクション */
export type LessonSection = {
  id: string;
  heading: string;
  blocks: LessonBlock[];
};

export type SubjectDoc = {
  id: string;
  name: string;
  order: number;
};

export type ContentDoc = {
  id: string;
  subjectId: string;
  type: ContentType;
  slug: string;
  title: string;
  status: ContentStatus;
  order: number;
  ready: boolean;
  intro?: string;
  lesson?: {
    sections: LessonSection[];
  };
  quiz?: {
    quizKind: QuizKind;
    questions: QuizQuestion[];
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  updatedBy?: string;
};

/** トップメニュー用 manifest（public/content-manifest.json） */
export type ManifestItem = {
  label: string;
  href: string;
  ready: boolean;
  contentId?: string;
};

export type ContentManifest = {
  version: number;
  updatedAt: string;
  subjects: {
    id: string;
    name: string;
    order: number;
    items: ManifestItem[];
  }[];
};

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugToVarPrefix(slug: string): string {
  return slug.replace(/-/g, "_").toUpperCase();
}
