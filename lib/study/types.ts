import type { ContentType } from "@/lib/content/types";

export type StudyPlanStatus = "active" | "completed" | "archived";

export type StudyItemSource = "app" | "external";

export type StudyContentRef = {
  workspaceId: string;
  workspaceSlug: string;
  contentId: string;
  contentTitle: string;
  contentType: ContentType;
  contentSlug: string;
};

export type StudyPlanDoc = {
  id: string;
  subjectId: string;
  subjectName: string;
  startDate: string;
  dueDate: string;
  memo?: string;
  status: StudyPlanStatus;
  /** 完了にした日時（自動アーカイブ判定に使用） */
  completedAt?: string;
  /** アーカイブした日時 */
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type StudyItemDoc = {
  id: string;
  planId: string;
  order: number;
  source: StudyItemSource;
  label: string;
  scopeNote?: string;
  progressPercent: number;
  contentRef?: StudyContentRef;
};

export type StudyPlanWithItems = StudyPlanDoc & {
  items: StudyItemDoc[];
};

export type StudyItemDraft = {
  /** 編集時に既存項目と対応づける */
  id?: string;
  source: StudyItemSource;
  label: string;
  scopeNote: string;
  contentRef?: StudyContentRef;
};

export type StudyPlanInput = {
  subjectId: string;
  subjectName: string;
  startDate: string;
  dueDate: string;
  memo?: string;
  items: StudyItemDraft[];
};

/** よく使う学習内容マスタ（外部教材の定型登録用） */
export type StudyItemMasterDoc = {
  id: string;
  /** 空文字は全科目で使える */
  subjectId: string;
  subjectName?: string;
  name: string;
  /** 対象範囲入力のヒント（例: ページ、問、第○単元） */
  defaultUnit?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type StudyItemMasterInput = {
  subjectId: string;
  subjectName?: string;
  name: string;
  defaultUnit?: string;
  order?: number;
};

/** 学習計画テンプレート（再利用用） */
export type StudyTemplateDoc = {
  id: string;
  name: string;
  subjectId: string;
  subjectName: string;
  memo?: string;
  /** テンプレート適用時の期間（日数） */
  durationDays: number;
  items: StudyItemDraft[];
  createdAt: string;
  updatedAt: string;
};

export type StudyTemplateInput = {
  name: string;
  subjectId: string;
  subjectName: string;
  memo?: string;
  durationDays: number;
  items: StudyItemDraft[];
};
