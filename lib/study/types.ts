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
