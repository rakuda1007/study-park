import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import { LEGAL_CONTACT_EMAIL, LEGAL_LAST_UPDATED, LEGAL_SERVICE_NAME } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Study Park",
  description: "Study Park における個人情報の取り扱いについて説明します。",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="プライバシーポリシー" description={`最終更新日: ${LEGAL_LAST_UPDATED}`}>
      <LegalSection title="1. はじめに">
        <p>
          {LEGAL_SERVICE_NAME}（以下「当サービス」といいます。）は、ユーザーの個人情報の保護に関する法令等を遵守し、個人情報を適切に取り扱います。本プライバシーポリシーは、当サービスがどのような個人情報を収集し、どのように利用・管理するかを説明するものです。
        </p>
      </LegalSection>

      <LegalSection title="2. 収集する個人情報">
        <h3>2.1 アカウント情報</h3>
        <ul>
          <li>メールアドレス</li>
          <li>パスワード（暗号化して保存）</li>
          <li>氏名（姓・名、任意入力を含む）</li>
        </ul>
        <h3>2.2 利用情報</h3>
        <ul>
          <li>作成・学習したコンテンツ、問題データ、画像</li>
          <li>ワークスペース・参加者の紐づけ情報</li>
          <li>利用状況（ストレージ使用量、問題数など）</li>
          <li>課金・購入に関する情報（Stripe 経由で処理される決済関連情報）</li>
          <li>アクセスログ、IP アドレス、ブラウザ・デバイス情報</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. 個人情報の利用目的">
        <p>当サービスは、収集した個人情報を以下の目的で利用します。</p>
        <ol>
          <li>当サービスの提供、運営、維持、改善</li>
          <li>ユーザー認証、アカウント管理</li>
          <li>教材の作成・公開・学習機能の提供</li>
          <li>有料プランの提供、課金、サポート</li>
          <li>お問い合わせへの対応、重要なお知らせの送信</li>
          <li>不正利用の防止、セキュリティ対策</li>
          <li>利用規約違反の調査、対応</li>
          <li>サービス改善のための分析</li>
        </ol>
      </LegalSection>

      <LegalSection title="4. 個人情報の管理">
        <p>
          当サービスは、個人情報の正確性を保ち、紛失・破壊・改ざん・漏洩などのリスクに対して、適切な安全管理措置を講じます。通信は HTTPS により保護し、データベース・ストレージへのアクセスは権限管理により制限しています。
        </p>
      </LegalSection>

      <LegalSection title="5. 個人情報の第三者提供">
        <p>
          当サービスは、法令に基づく場合等を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。ただし、利用目的の達成に必要な範囲で、個人情報の取扱いを外部事業者に委託する場合があります。
        </p>
      </LegalSection>

      <LegalSection title="6. 個人情報の開示・訂正・削除">
        <p>
          ユーザーは、当サービスが保有する自己の個人情報について、開示、訂正、削除、利用停止等を求める権利を有します。ご請求は
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
          までご連絡ください。法令により開示等が制限される場合を除き、適切に対応いたします。
        </p>
      </LegalSection>

      <LegalSection title="7. Cookie（クッキー）の使用">
        <p>
          当サービスは、ログイン状態の維持、サービス改善、広告配信等のため Cookie および類似技術を使用することがあります。ブラウザの設定により Cookie の受け入れを拒否できますが、一部機能が正常に動作しない場合があります。
        </p>
      </LegalSection>

      <LegalSection title="8. アクセス解析・広告">
        <p>当サービスは、サービス改善や広告配信のため、以下の外部サービスを利用する場合があります。</p>
        <ul>
          <li>Firebase Analytics / Google Analytics（利用状況の分析）</li>
          <li>Google AdSense（広告表示）</li>
        </ul>
        <p>これらのサービスは、それぞれのプライバシーポリシーに従って情報を扱います。</p>
      </LegalSection>

      <LegalSection title="9. 外部サービスの利用">
        <p>当サービスは、以下の外部サービスを利用しています。</p>
        <ul>
          <li>
            <strong>Google Firebase</strong>（認証、データベース、ストレージ、ホスティング、クラウド関数）—{" "}
            <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">
              プライバシー情報
            </a>
          </li>
          <li>
            <strong>Stripe</strong>（決済処理）—{" "}
            <a href="https://stripe.com/jp/privacy" target="_blank" rel="noopener noreferrer">
              プライバシーポリシー
            </a>
          </li>
          <li>
            <strong>Google AdSense</strong>（広告）—{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              プライバシーポリシー
            </a>
          </li>
        </ul>
        <p>決済情報のクレジットカード番号等は、Stripe が直接処理し、当サービスのサーバーには保存されません。</p>
      </LegalSection>

      <LegalSection title="10. 個人情報の保存期間">
        <p>
          当サービスは、利用目的の達成に必要な期間、または法令で定められた期間、個人情報を保存します。保存期間経過後は、適切に削除または匿名化します。お試し期間満了後のワークスペース削除ポリシーについては、
          <a href="/terms">利用規約</a>をご確認ください。
        </p>
      </LegalSection>

      <LegalSection title="11. お子様の個人情報">
        <p>
          当サービスは、13 歳未満の子供から意図的に個人情報を収集することはありません。13
          歳未満の子供が個人情報を提供したことが判明した場合、当該情報を削除するよう努めます。
        </p>
      </LegalSection>

      <LegalSection title="12. プライバシーポリシーの変更">
        <p>
          当サービスは、必要に応じて本プライバシーポリシーを変更することがあります。変更後のポリシーは、当サービス上に掲載した時点から効力を生じます。重要な変更がある場合は、可能な範囲でユーザーに通知します。
        </p>
      </LegalSection>

      <LegalSection title="13. お問い合わせ">
        <p>
          本プライバシーポリシーに関するお問い合わせは、
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
          までご連絡ください。
        </p>
      </LegalSection>

      <p>以上</p>
    </LegalPage>
  );
}
