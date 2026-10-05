"use client";

import type { StudyTemplateDoc } from "@/lib/study/types";

type Props = {
  templates: StudyTemplateDoc[];
  selectedId: string;
  onSelect: (templateId: string) => void;
  manageHref?: string;
};

export function StudyTemplatePicker({
  templates,
  selectedId,
  onSelect,
  manageHref = "#study-plan-templates",
}: Props) {
  if (templates.length === 0) {
    return (
      <section className="admin-card study-template-picker study-template-picker--empty">
        <p className="admin-msg">
          計画テンプレはまだありません。計画を作ったあと、「記録する」画面から「計画テンプレに残す」ができます。
        </p>
      </section>
    );
  }

  return (
    <section className="admin-card study-template-picker">
      <h2 className="study-plan-form__heading">計画テンプレから作成（任意）</h2>
      <p className="admin-msg">保存済みの計画テンプレを選ぶと、科目と学習内容が自動入力されます。</p>
      <label className="admin-field">
        <span className="admin-label">計画テンプレ</span>
        <select
          className="admin-input"
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="">選ばない（空の計画から作成）</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}（{t.subjectName}・{t.durationDays}日・{t.items.length}件）
            </option>
          ))}
        </select>
      </label>
      <p className="study-template-picker__link">
        <a href={manageHref} className="study-back-link">
          計画テンプレの管理 →
        </a>
      </p>
    </section>
  );
}
