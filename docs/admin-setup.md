# 管理画面セットアップ

Study Park のコンテンツ管理（`/admin`）は Firebase Auth + Firestore を使います。

## 1. Firebase プロジェクト

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを開く
2. **Authentication** → メール/パスワードを有効化
3. 管理者用ユーザーを作成（メール + パスワード）

## 2. 環境変数

リポジトリ直下に `.env.local` を作成（`.env.example` をコピーして値を入れる）。

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# 以下同様
```

## 3. 管理者 UID の登録

Firestore に `admins/{uid}` ドキュメントを **手動で** 1 件作成します（Console または gcloud）。

| フィールド | 値 |
|-----------|-----|
| （ドキュメント ID） | Authentication のユーザー UID |

`admins` コレクションへの write はルールで禁止しているため、Console からの作成のみです。

## 4. ルール・インデックスのデプロイ

```bash
npm run firebase:deploy:rules
npm run firebase:deploy:indexes
npm run firebase:deploy:storage
```

レッスンに画像を入れる機能は **Firebase Storage** を使います。初回は Storage を有効化し、上記 `storage` のデプロイが必要です。

## 5. 管理画面のセキュリティ（Stripe 審査対応）

`/admin` には次の2段階の保護があります。

1. **ベーシック認証ゲート**（Cloud Functions `verifyAdminAccessGate`）
2. **Firebase ログイン + TOTP 二段階認証**（管理者アカウント必須）

### 5-1. Firebase で TOTP を有効化

TOTP は通常の Firebase Auth だけでは使えません。**Identity Platform へのアップグレード**と **Admin SDK での有効化**が必要です。

#### 手順 A: Identity Platform にアップグレード

1. [Firebase Console](https://console.firebase.google.com/project/study-park-fb726/authentication/providers) → **Authentication** → **ログイン方法**
2. 画面下部の **詳細** にある青い案内 **「アップグレードして有効にする」** をクリック
3. 案内に従い **Firebase Authentication with Identity Platform** を有効化

※ Cloud Functions を使っているプロジェクトは多くの場合 **Blaze プラン**です。Identity Platform も無料枠があり、小規模利用では追加費用はかかりにくいです。

#### 手順 B: TOTP をプロジェクトで有効化（コンソールのチェックは無い）

Identity Platform 有効化後、次を **1回だけ** 実行します。

```bash
# .env.local の Firebase Admin 設定を読み込んでから
node scripts/enable-totp-mfa.mjs
```

成功すると `TOTP 多要素認証を有効化しました。` と表示されます。

参考: [Firebase TOTP MFA ドキュメント](https://firebase.google.com/docs/auth/web/totp-mfa)

初回ログイン後、認証アプリ（Google Authenticator 等）の QR 登録を求められます。

### 5-2. ベーシック認証の環境変数

**ローカル（`.env.local`）**

```env
ADMIN_GATE_USERNAME=study-park-admin
ADMIN_GATE_PASSWORD=（十分に長いランダム文字列）
```

**本番 Functions**

```bash
firebase functions:secrets:set ADMIN_GATE_PASSWORD
# functions/.env に ADMIN_GATE_USERNAME=study-park-admin（任意・既定値あり）
firebase deploy --only functions:verifyAdminAccessGate
```

ローカル開発では `NEXT_PUBLIC_BILLING_USE_API_ROUTES=true` のとき Next.js API `/api/admin/access-gate` を使用します。

### 5-3. アカウントロック（10回失敗で30分ロック）

管理者ログイン（`/admin/login`）では、同一メールアドレスに対して **10回連続のログイン失敗** で **30分間** ログインを拒否します。

- 状態は Firestore `adminLoginLocks` に保存（クライアントからの直接読み書きは禁止）
- 本番: Cloud Functions `adminLoginLock`
- ローカル: `NEXT_PUBLIC_BILLING_USE_API_ROUTES=true` のとき `/api/admin/login-lock`

デプロイ:

```bash
firebase deploy --only functions:adminLoginLock,firestore:rules
```

Stripe セキュリティチェックリストの「10回以下のログイン失敗でアカウントロック」は **はい** で回答できます。

## 6. 開発サーバー

```bash
npm run dev
```

ブラウザで `http://localhost:3000/admin/login` を開き、

1. ベーシック認証（ユーザー名 / パスワード）
2. 管理者メール / パスワード
3. 二段階認証（初回は QR 登録）

の順でログインします。

本番の公開 URL: **https://study.tennis-park-community.com**（学習者登録: `/signup/learner`）

### 本番サイト（Hosting）でログインする場合

`NEXT_PUBLIC_*` は **ビルド時に** JavaScript に埋め込まれます。GitHub Actions でデプロイする場合は次を満たす必要があります。

1. GitHub の **Settings → Secrets and variables → Actions** で、**.env.local と同じキー名**の **Repository secrets** を用意する  
   （例: `NEXT_PUBLIC_FIREBASE_API_KEY`。`FirebaseApiKey` など別名だとワークフローから参照できません）
2. `main`（またはワークフロー対象ブランチ）に **ワークフロー修正後の** `.github/workflows/firebase-hosting.yml` が入ったうえで、push によりビルドが走るようにする
3. デプロイ完了後にブラウザの **強制リロード**（キャッシュ）を試す

Variables だけに登録している場合、`firebase-hosting.yml` は **`secrets.NAME`** で読むため、dash 側は **Secrets** に同じ名前で登録し直してください（またはワークフローを `vars` に合わせて書き換える）。

## 7. コンテンツの公開フロー（Firestore 直公開）

1. 管理画面でクイズ / レッスンを作成・編集して **保存**
2. 公開状態を **公開（サイトに出す）** にして **保存**（保存時に表示フラグも自動でオンになります）
3. トップページを再読み込みするとメニューに表示されます（Firestore から取得）

一覧で **「公開・未表示」** と出ている場合は、チェックが外れたままです。編集画面で **公開** を選び直して保存してください。
4. 学習 URL は `/play?slug=あなたのslug` です（編集画面のプレビューから開けます）

**Firestore ルール**で公開コンテンツの読み取りを許可しているため、ファイルのエクスポートや `npm run build` は不要です。反映には数秒かかることがあります。

### 既存の静的コンテンツ（九九・雪の地域など）

`public/` 配下の従来ページ（`/kuku/` など）はそのまま利用できます。同じ slug の静的ページがある場合は静的側を優先し、Firestore の同名項目はメニューに出しません。

### 静的ファイルへ移す場合（オプション）

Hosting を静的 HTML のみにしたいときは、編集画面の「静的ファイル用」からエクスポートし、`public/` に配置してビルド・デプロイしてください。

## トラブルシュート

- **ログインできるが一覧が空 / 権限エラー** → `admins/{uid}` が無い、またはルール未デプロイ
- **教科別一覧でエラー** → `firestore.indexes.json` をデプロイ（`subjectId` + `order`）
- **ビルド時 Firebase エラー** → `.env.local` の `NEXT_PUBLIC_*` を確認
- **本番ログイン画面に `Missing env: NEXT_PUBLIC_...`** → CI の Build ステップに `NEXT_PUBLIC_*` が渡っていない、または Secrets の名前がキーと一致していない。**Actions のログで該当 secret が「空」のビルドになっていないか**も確認する
