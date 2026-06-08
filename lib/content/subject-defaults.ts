import type { SubjectDoc } from "./types";

export const DEFAULT_SUBJECT_IDS = ["math", "social", "science"] as const;

export const DEFAULT_SUBJECTS: SubjectDoc[] = [
  { id: "math", name: "算数", order: 1, enabledInForm: true },
  { id: "social", name: "社会", order: 2, enabledInForm: true },
  { id: "science", name: "理科", order: 3, enabledInForm: true },
];

export function isDefaultSubjectId(id: string): boolean {
  return (DEFAULT_SUBJECT_IDS as readonly string[]).includes(id);
}
