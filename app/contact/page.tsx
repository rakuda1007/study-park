import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "お問い合わせ | Study Park",
  description:
    "Study Park へのご質問・ご意見・不具合報告はメールにてお受けしています。よくある質問も掲載しています。",
};

const FAQ_ITEMS = [
  {
    question: "クリエイターとして登録するには？",
    answer:
      "トップページまたはポータルから「クリエイター登録」へ進み、メールアドレスとパスワードでアカウントを作成してください。登録後、教材の作成・公開が可能になります。",
  },
  {
    question: "学習者として参加するには？",
    answer:
      "クリエイターから発行された招待コードが必要です。学習者登録後、マイページから招待コードを入力してワークスペースに参加できます。",
  },
  {
    question: "パスワードを忘れてしまいました",
    answer:
      "ログインページの「パスワードを忘れた場合」から、登録メールアドレス宛にリセット用リンクを送信できます。",
  },
  {
    question: "スターター（¥980）や月額プランについて教えてください",
    answer:
      "お試し期間の後、スターター（1回 ¥980）の購入で問題数上限が拡張されます。さらに月額プラン（S / M / L）で上限を段階的に引き上げられます。料金の詳細は特定商取引法に基づく表記をご確認ください。",
  },
  {
    question: "お試し期間が終わるとどうなりますか？",
    answer:
      "お試し期間および猶予期間を過ぎると、ワークスペースの編集・新規作成が制限されます。スターターへの登録、またはお問い合わせメールにてご相談ください。",
  },
  {
    question: "月額プランの解約・変更はどうすればよいですか？",
    answer:
      "現時点では Stripe カスタマーポータルは未提供です。解約・プラン変更のご希望は、お問い合わせメールにワークスペース名と登録メールアドレスを添えてご連絡ください。",
  },
  {
    question: "データのエクスポートはできますか？",
    answer:
      "現在、一括エクスポート機能は提供していません。ご要望がございましたらお問い合わせメールまでお知らせください。",
  },
] as const;

export default function ContactPage() {
  return (
    <LegalPage
      title="お問い合わせ"
      description="ご質問、ご意見、ご要望がございましたら、メールにてお気軽にお問い合わせください。内容を確認後、担当者よりご連絡いたします。"
    >
      <LegalSection title="メールでのお問い合わせ">
        <p>
          下記メールアドレス宛に、お名前・ご用件・詳細をお書き添えのうえご送信ください。有料プラン・決済・解約に関するお問い合わせも同じアドレスでお受けしています。
        </p>
        <div className="contact-mail-card">
          <p className="contact-mail-card__label">メールアドレス</p>
          <p className="contact-mail-card__email">
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
          </p>
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="contact-mail-card__button">
            メールを送る
          </a>
        </div>
        <p className="contact-mail-card__note">
          ※ メールでのお問い合わせには、返信まで数日かかる場合がございます。ご了承ください。
        </p>
      </LegalSection>

      <LegalSection title="よくある質問（FAQ）">
        <dl className="contact-faq">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question} className="contact-faq__item">
              <dt className="contact-faq__question">Q. {item.question}</dt>
              <dd className="contact-faq__answer">A. {item.answer}</dd>
            </div>
          ))}
        </dl>
      </LegalSection>

      <LegalSection title="関連ページ">
        <ul>
          <li>
            <a href="/commerce-disclosure">特定商取引法に基づく表記</a>（料金・支払い・解約）
          </li>
          <li>
            <a href="/terms">利用規約</a>
          </li>
          <li>
            <a href="/privacy">プライバシーポリシー</a>
          </li>
          <li>
            <a href="/about">運営者情報</a>
          </li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
