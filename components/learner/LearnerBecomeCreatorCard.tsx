"use client";

import Link from "next/link";

export function LearnerBecomeCreatorCard() {
  return (
    <section className="admin-card learner-become-creator-card" aria-labelledby="learner-creator-heading">
      <h2 id="learner-creator-heading" className="learner-become-creator-card__title">
        自分でオリジナル問題を作りたい方
      </h2>
      <p className="learner-become-creator-card__lead">
        クリエイター機能を有効にすると、お試し（80問・100MB・最長2年）ですぐに問題やレッスンを作れます。継続利用や上限拡張にはスターター（¥980）の購入が必要です。
      </p>
      <p className="learner-become-creator-card__note">
        いま参加している教室の学習は、そのまま続けられます。
      </p>
      <Link href="/creator/start" className="admin-btn admin-btn--primary learner-become-creator-card__link">
        クリエイター機能を始める
      </Link>
    </section>
  );
}
