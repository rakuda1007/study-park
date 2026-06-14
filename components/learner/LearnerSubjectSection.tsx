"use client";

import Link from "next/link";
import { useMemo } from "react";
import { workspacePlayHref } from "@/lib/content/urls";
import {
  contentMatchesPeriodFilter,
  groupByContentPeriod,
  resolveContentPeriod,
} from "@/lib/content/period";
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

function PeriodGroups({
  groups,
  workspaceSlug,
}: {
  groups: { key: string; label: string; items: WorkspaceContentDoc[] }[];
  workspaceSlug: string;
}) {
  return (
    <>
      {groups.map((periodGroup) => (
        <div key={periodGroup.key} className="admin-period-group learner-period-group">
          <h4>{periodGroup.label}</h4>
          <StudyItemList items={periodGroup.items} workspaceSlug={workspaceSlug} />
        </div>
      ))}
    </>
  );
}

export function LearnerSubjectSection({
  group,
  workspaceSlug,
  periodFilter,
}: {
  group: LearnerSubjectGroup;
  workspaceSlug: string;
  periodFilter: string;
}) {
  const filteredItems = useMemo(
    () => group.items.filter((c) => contentMatchesPeriodFilter(c, periodFilter)),
    [group.items, periodFilter],
  );

  const periodGroups = useMemo(
    () =>
      groupByContentPeriod(filteredItems, (item) => resolveContentPeriod(item)).map(
        (periodGroup) => ({
          ...periodGroup,
          items: periodGroup.items.sort((a, b) => a.order - b.order),
        }),
      ),
    [filteredItems],
  );

  const count = filteredItems.length;

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
        <PeriodGroups groups={periodGroups} workspaceSlug={workspaceSlug} />
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
        <PeriodGroups groups={periodGroups} workspaceSlug={workspaceSlug} />
      </div>
    </details>
  );
}
