import Link from "next/link";
import { workspacePlayHref } from "@/lib/content/urls";
import type { WorkspaceContentDoc } from "@/lib/workspaces/content-firestore";

export type LearnerSubjectGroup = {
  subjectId: string;
  subjectName: string;
  items: WorkspaceContentDoc[];
};

function StudyItemList({
  items,
  workspaceSlug,
}: {
  items: WorkspaceContentDoc[];
  workspaceSlug: string;
}) {
  return (
    <ul className="admin-list learner-study-list">
      {items.map((c) => (
        <li key={c.id}>
          <Link
            href={workspacePlayHref(workspaceSlug, c.slug, c.workspaceId)}
            className="learner-study-link"
          >
            <span className="learner-study-link__text">
              <span className="learner-study-link__title">{c.title}</span>
              <span className="learner-study-link__meta">
                {c.type === "quiz" ? "クイズ" : "レッスン"}
              </span>
            </span>
            <span className="learner-study-link__arrow" aria-hidden="true">
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function LearnerSubjectSection({
  group,
  workspaceSlug,
}: {
  group: LearnerSubjectGroup;
  workspaceSlug: string;
}) {
  const count = group.items.length;

  if (count === 0) return null;

  if (count === 1) {
    return (
      <section
        className="learner-subject-group"
        aria-labelledby={`learner-subject-${group.subjectId}`}
      >
        <h3 id={`learner-subject-${group.subjectId}`} className="learner-subject-label">
          {group.subjectName}
        </h3>
        <StudyItemList items={group.items} workspaceSlug={workspaceSlug} />
      </section>
    );
  }

  return (
    <details className="learner-subject-dropdown">
      <summary className="learner-subject-dropdown-trigger">
        <span id={`learner-subject-${group.subjectId}`} className="learner-subject-label">
          {group.subjectName}
        </span>
        <span className="learner-subject-dropdown-meta">
          <span className="learner-subject-count">{count}件</span>
          <span className="learner-subject-chevron" aria-hidden="true" />
        </span>
      </summary>
      <div className="learner-subject-dropdown-panel">
        <StudyItemList items={group.items} workspaceSlug={workspaceSlug} />
      </div>
    </details>
  );
}
