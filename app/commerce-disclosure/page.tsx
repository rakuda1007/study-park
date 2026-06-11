import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR_NAME,
  LEGAL_SERVICE_NAME,
} from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | Study Park",
  description: "Study Park の料金・支払い方法・返品・解約についての表記です。",
};

export default function CommerceDisclosurePage() {
  return (
    <LegalPage
      title="特定商取引法に基づく表記"
      description={`最終更新日: ${LEGAL_LAST_UPDATED}`}
    >
      <LegalSection title="事業者名">
        <p>{LEGAL_SERVICE_NAME}</p>
      </LegalSection>

      <LegalSection title="運営責任者">
        <p>{LEGAL_OPERATOR_NAME}</p>
      </LegalSection>

      <LegalSection title="所在地">
        <p>
          所在地については、お問い合わせメールにてご連絡いただければ、遅滞なく開示いたします。
        </p>
      </LegalSection>

      <LegalSection title="連絡先">
        <p>
          <strong>メールアドレス:</strong>{" "}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
        </p>
        <p>
          <strong>電話番号:</strong>{" "}
          お問い合わせメールにてご連絡いただければ、遅滞なく開示いたします。
        </p>
      </LegalSection>

      <LegalSection title="販売価格">
        <h3>お試しプラン（クリエイター）</h3>
        <p>
          <strong>無料（税込）</strong>
        </p>
        <ul>
          <li>登録問題数: 最大 80 問</li>
          <li>ストレージ: 最大 100 MB</li>
          <li>利用期間: 最長 2 年（スターター未購入の場合、満了後の削除ポリシーあり）</li>
          <li>広告表示: あり</li>
        </ul>

        <h3>スタータープラン</h3>
        <p>
          <strong>¥980（税込・1回払い）</strong>
        </p>
        <ul>
          <li>登録問題数: 最大 200 問</li>
          <li>ストレージ: 最大 100 MB</li>
          <li>お試し期間の期限なしで継続利用可能（スターター購入後）</li>
          <li>広告表示: なし</li>
        </ul>

        <h3>月額プラン S / M / L</h3>
        <ul>
          <li>
            <strong>S:</strong> ¥480/月（税込）— 500 問・1 GB
          </li>
          <li>
            <strong>M:</strong> ¥980/月（税込）— 1,000 問・5 GB
          </li>
          <li>
            <strong>L:</strong> ¥2,480/月（税込）— 2,000 問・20 GB
          </li>
        </ul>
        <p>月額プランの契約には、スタータープラン（¥980）の購入が必要です。</p>
        <p>
          ※ 価格は予告なく変更される場合があります。最新の価格は、
          <a href="/creator/usage">利用状況・プラン変更画面</a>
          でご確認ください。
        </p>
        <p>
          ※ 九九・都道府県クイズなど、アカウント不要の無料コンテンツは本表記の有料プランとは別に無料で提供しています。
        </p>
      </LegalSection>

      <LegalSection title="追加料金">
        <p>商品・サービスの価格以外に、お客様が負担する可能性のある手数料は以下のとおりです。</p>
        <ul>
          <li>決済手数料: なし（決済手数料は事業者が負担します）</li>
          <li>その他の追加料金: なし</li>
        </ul>
      </LegalSection>

      <LegalSection title="支払い方法">
        <p>有料プラン（スターター・月額）をご利用の場合、以下の支払い方法をご利用いただけます。</p>
        <ul>
          <li>クレジットカード決済（Visa、Mastercard、American Express、JCB 等）</li>
          <li>デビットカード決済</li>
        </ul>
        <p>決済は、Stripe（Stripe, Inc.）を通じて安全に処理されます。</p>
        <p>
          月額プランの解約・変更については、
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>お問い合わせメール</a>
          にてご連絡ください。Stripe 上のサブスクリプション管理機能の提供を順次拡充する予定です。
        </p>
      </LegalSection>

      <LegalSection title="支払い時期">
        <p>
          <strong>スターター（1回払い）:</strong>{" "}
          プラン登録手続き（Checkout 完了）時に支払いが行われます。
        </p>
        <p>
          <strong>月額プラン:</strong>{" "}
          初回は契約手続き完了時に請求され、以降は各更新期間の開始時に自動的に請求されます。
        </p>
      </LegalSection>

      <LegalSection title="サービス提供時期（引き渡し時期）">
        <p>
          決済手続き完了後、直ちに該当プランの上限が適用され、サービスをご利用いただけます。サービス提供はインターネットを通じて行われます。
        </p>
      </LegalSection>

      <LegalSection title="返品・交換・キャンセル・解約について">
        <h3>不良品について</h3>
        <p>
          当サービスはデジタルコンテンツ（ソフトウェアサービス）のため、物理的な不良品の返品・交換は該当しません。重大な不具合によりサービスを利用できない場合は、お問い合わせください。
        </p>

        <h3>キャンセル・解約について</h3>
        <p>
          <strong>スターター（1回払い）:</strong>{" "}
          デジタルコンテンツの性質上、お客様都合による返金は原則行っておりません。
        </p>
        <p>
          <strong>月額プラン:</strong>{" "}
          解約はいつでも可能です。解約後も、既に支払い済みの期間中はサービスをご利用いただけます。次回更新日以降、スタータープランの枠（200
          問・100 MB）に戻ります。解約のご希望は
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
          までご連絡ください。
        </p>

        <h3>返金について</h3>
        <p>デジタルコンテンツの性質上、お客様都合による返金は行っておりません。ただし、以下の場合には返金を検討いたします。</p>
        <ul>
          <li>当サービスの重大な不具合により、サービスを利用できない場合</li>
          <li>当サービスの過失により、誤って複数回請求された場合</li>
          <li>その他、当サービスの責任によりサービスを提供できない場合</li>
        </ul>
        <p>
          返金をご希望の場合は、
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
          にてご連絡ください。
        </p>
      </LegalSection>

      <LegalSection title="動作環境">
        <ul>
          <li>対応ブラウザ: Google Chrome、Mozilla Firefox、Safari、Microsoft Edge（最新版）</li>
          <li>モバイル: iOS Safari、Android Chrome（最新版）</li>
          <li>インターネット接続が必要です</li>
        </ul>
      </LegalSection>

      <LegalSection title="その他">
        <p>
          サービスのご利用にあたっては、<a href="/terms">利用規約</a>
          をご確認ください。
        </p>
        <p>
          個人情報の取り扱いについては、<a href="/privacy">プライバシーポリシー</a>
          をご確認ください。
        </p>
      </LegalSection>

      <p>以上</p>
    </LegalPage>
  );
}
