"use client";

import Link from "next/link";
import type { StudyTemplateDoc } from "@/lib/study/types";

type Props = {
  templates: StudyTemplateDoc[];
  selectedId: string;
  onSelect: (templateId: string) => void;
};

export function StudyTemplatePicker({ templates, selectedId, onSelect }: Props) {
  if (templates.length === 0) {
    return (
      <section className="admin-card study-template-picker study-template-picker--empty">
        <p className="admin-msg">
          テンプレートはまだありません。計画を作ったあと、詳細画面から保存できます。{" "}
          <Link href="/learner/study/templates" className="study-back-link">
            テンプレート一覧
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="admin-card study-template-picker">
      <h2 className="study-plan-form__heading">テンプレートから作成（任意）</h2>
      <p className="admin-msg">保存済みのテンプレートを選ぶと、科目と学習内容が自動入力されます。</p>
      <label className="admin-field">
        <span className="admin-label">テンプレート</span>
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
        <Link href="/learner/study/templates" className="study-back-link">
          テンプレートの管理 →
        </Link>
      </p>
    </section>
  );
}
