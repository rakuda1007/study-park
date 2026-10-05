"use client";

import Link from "next/link";

export function LearnerBecomeCreatorCard() {
  return (
    <section className="admin-card learner-become-creator-card" aria-labelledby="learner-creator-heading">
      <h2 id="learner-creator-heading" className="learner-become-creator-card__title">
        気になったところを問題にして繰り返し解きたい方
      </h2>
      <p className="learner-become-creator-card__lead">
        問題づくり（クリエイター）を有効にすると、お試し（80問・100MB・最長2年）ですぐに問題やレッスンを作れます。学校や塾では生徒への配信もできます。継続利用や上限拡張にはスターター（¥980）の購入が必要です。
      </p>
      <p className="learner-become-creator-card__note">
        学習管理や、参加中の教室の学習はそのまま続けられます。
      </p>
      <Link href="/creator/start" className="admin-btn admin-btn--primary learner-become-creator-card__link">
        問題を作って配る
      </Link>
    </section>
  );
}
