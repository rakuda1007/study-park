import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED, LEGAL_OPERATOR_NAME } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "運営者情報 | Study Park",
  description: "Study Park のサービス概要・開発背景・技術スタック・お問い合わせ先です。",
};

export default function AboutPage() {
  return (
    <LegalPage title="運営者情報" description={`最終更新日: ${LEGAL_LAST_UPDATED}`}>
      <LegalSection title="サービス概要">
        <p>
          Study Park（スタディパーク）は、クリエイターがオリジナルの学習問題・教材を作成し、学習者がクイズ形式で学べる Web
          学習プラットフォームです。九九や都道府県クイズなどの無料コンテンツに加え、クリエイター向けの教材作成・公開・参加者管理機能を提供します。
        </p>
        <p>
          本サービスは、<a href="https://tennis-park-community.com/">テニスパーク</a>
          と同じ運営者が提供する Park シリーズのひとつです。
        </p>
      </LegalSection>

      <LegalSection title="開発の背景">
        <p>
          Study Park は、「覚えたいことを、その場でクイズにして、いつでも復習できる」学習体験を目指して開発されました。紙のノートやバラバラの資料では続きにくい復習を、スマートフォンやブラウザから手軽に続けられる形にまとめています。
        </p>
        <ul>
          <li>クリエイターによる問題・教材の作成・編集・公開</li>
          <li>学習者の招待と、ワークスペース単位での学習</li>
          <li>ストレージ・問題数に応じたプラン（お試し・スターター・月額）</li>
          <li>モバイルでも使いやすい PWA 対応</li>
        </ul>
      </LegalSection>

      <LegalSection title="主な機能">
        <h3>クリエイター向け</h3>
        <ul>
          <li>教科・単元ごとのコンテンツ管理</li>
          <li>問題の登録、画像の添付、公開設定</li>
          <li>学習者の招待・紐づけ</li>
          <li>利用状況・プラン管理（スターター・月額）</li>
        </ul>
        <h3>学習者向け</h3>
        <ul>
          <li>紐づいたワークスペースの教材をクイズ形式で学習</li>
          <li>プロフィール管理</li>
        </ul>
        <h3>無料で利用できるコンテンツ</h3>
        <ul>
          <li>九九（kuku）、都道府県クイズ（kencho）など、アカウント不要の学習コンテンツ</li>
        </ul>
      </LegalSection>

      <LegalSection title="技術スタック">
        <ul>
          <li>
            <strong>フロントエンド:</strong> Next.js, React, TypeScript
          </li>
          <li>
            <strong>バックエンド・データ:</strong> Firebase（Authentication, Firestore, Cloud Storage, Cloud
            Functions, Hosting）
          </li>
          <li>
            <strong>決済:</strong> Stripe
          </li>
          <li>
            <strong>広告:</strong> Google AdSense（お試しプラン等）
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="運営責任者">
        <p>{LEGAL_OPERATOR_NAME}</p>
      </LegalSection>

      <LegalSection title="お問い合わせ">
        <p>
          ご質問・ご意見・不具合のご連絡は、
          <a href="/contact">お問い合わせページ</a>
          よりメール（
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
          ）にてお受けしています。
        </p>
        <p>
          有料プラン・決済・解約に関するお問い合わせも、同メールアドレスまでご連絡ください。
        </p>
      </LegalSection>

      <LegalSection title="プライバシーとセキュリティ">
        <p>
          個人情報の取り扱いについては、
          <a href="/privacy">プライバシーポリシー</a>
          をご確認ください。通信は HTTPS により保護しています。
        </p>
      </LegalSection>
    </LegalPage>
  );
}
