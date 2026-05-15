# Study Park

Next.js（App Router）と Firebase を使う学習用 Web アプリのひな形です。静的エクスポート（`output: "export"`）でビルドし、Firebase Hosting の `public` は `out` ディレクトリを指します。

## 前提（Node.js）

`package.json` の `engines` に合わせ、**Node.js 20 系（20 以上 21 未満）** を使ってください。

- 推奨: [nvm](https://github.com/nvm-sh/nvm) / [fnm](https://github.com/Schniz/fnm) / [Volta](https://volta.sh) などでバージョンを固定する
- バージョン確認: `node -v`

## パッケージマネージャ

このリポジトリは **npm**（`package-lock.json`）を前提にしています。

## セットアップ

```bash
cp .env.example .env.local
# .env.local に Firebase の実値を入力（リポジトリにコミットしない）

npm ci
```

Firebase の Web アプリ設定値は、Firebase コンソールの「プロジェクトの設定」→「マイアプリ」から取得します。

## 開発

Turbopack を有効にした開発サーバー:

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 本番ビルド

```bash
npm run build
```

- `next build --turbopack` のあと、`scripts/cleanRscTxt.mjs` で `out/` 内の RSC 用 `*.txt` を削除します（静的ホスティングで誤って開かれるのを防ぐため）。
- 成果物は `out/` です。Firebase Hosting の `public` は `out` を指します（`firebase.json` 参照）。

## Lint / フォーマット

```bash
npm run lint
npm run format
npm run format:check
```

- ESLint: `eslint-config-next`（Flat Config）+ `eslint-config-prettier`
- Prettier: `prettier-plugin-tailwindcss` 込み（`.prettierrc.json`）

## Firebase（ルールのみデプロイ）

```bash
npm run firebase:deploy:rules
```

事前に [Firebase CLI](https://firebase.google.com/docs/cli) のログインとプロジェクト紐付けが必要です。

```bash
npx firebase login
# .firebaserc の your-firebase-project-id を実プロジェクト ID に書き換えたうえで:
npx firebase use your-firebase-project-id
```

## Firebase Hosting へのデプロイ（静的サイト）

1. 本番ビルド: `npm run build`
2. デプロイ:

```bash
npx firebase deploy --only hosting
```

初回はコンソールで Hosting を有効化し、`.firebaserc` のプロジェクト ID を実値に合わせてください。

### カスタムドメイン（概要）

Firebase コンソール → Hosting →「カスタムドメインを追加」で `example.com`（実際に使うドメインに読み替え）を追加し、表示された **DNS レコード** をドメイン側に登録します。ムームードメインでの入力手順は後述します。

## ムームードメインでの DNS 設定手順（プレースホルダ `example.com`）

以下は **Firebase がコンソール上で指示するレコード** を、ムームードメインの DNS 画面に転記する流れです。表示されるホスト名・値はプロジェクトや画面の世代で変わるため、**必ず Firebase コンソールの指示を正**としてください。

### 1. ムームードメインにログインし DNS を開く

1. ムームードメインのコントロールパネルにログインする。
2. 「ドメイン操作」→ 対象ドメイン（例: `example.com`）の「ネームサーバー設定」または「DNS関連機能の設定」を開く。
3. **DNS レコード設定**（ゾーン編集 / DNS 一括設定など名称はサービス画面による）を選ぶ。

※ すでに **ムームードメイン以外のネームサーバー**（Cloudflare 等）を使っている場合は、**そのネームサーバー側の DNS パネル**で同様のレコードを追加します（ムームードメインの DNS 画面は使いません）。

### 2. Firebase でカスタムドメインを追加する

1. Firebase コンソール → Hosting →「カスタムドメインを追加」。
2. `example.com` または `www.example.com` を入力し、手順に従う。
3. **要確認（Verification）用の TXT** や、**向き先の A / AAAA レコード** が画面に表示される。

### 3. ムームードメインのフォームへの入力の仕方（概念）

ムームードメインの各行はだいたい次の列を持ちます（表示名は多少異なります）。

| 項目の例                       | 入力の考え方                                                                                                                                                                                    |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ホスト名 / 名前 / サブドメイン | Firebase が **`example.com` 用のレコード** と書いていれば、ルートは `@` または空欄、**`www` 用** なら `www`。Firebaseが **`www.example.com` の A 用に `www` とだけ書く** 場合はホストに `www`。 |
| TYPE / 種別                    | Firebase の指示どおり `A` / `AAAA` / `TXT` を選ぶ。                                                                                                                                             |
| VALUE / 内容 / IP アドレス     | Firebase に表示された **IPv4 / IPv6 / TXT の文字列** をそのままコピー（余分な引用符は付けない）。                                                                                               |
| TTL                            | 指定があれば従う。なければデフォルトで可。                                                                                                                                                      |

**TXT（所有権確認）の例**

- ホスト: Firebase が `_firebase` のような **検証用サブドメイン** を指定していれば、その左側だけ（例: `_firebase`）。ルート直下の TXT なら `@` または空欄。
- 値: `google-site-verification=...` や Firebase が示す **1 行のトークン全文**。

**A / AAAA の例（ルートドメイン）**

- ホスト: `@` または空欄（ルート `example.com` の場合）。
- 値: Firebase が提示する **固定のホスティング用 IP / IPv6**（画面に複数ある場合は **すべて** 追加）。

**`www` サブドメイン**

- `www` をカスタムドメインとして追加する場合、ホストに `www`、TYPE と VALUE は Firebase の行に合わせる。

### 4. 保存後の待ち時間

- DNS の反映は数分〜最大 48 時間程度かかることがあります。
- Firebase コンソールのドメイン一覧で **接続済み / 有効** になるまで待つ。

### 5. SSL 証明書のプロビジョニング

Firebase Hosting はドメインが有効化されると **無料 SSL** を自動プロビジョニングします。

- コンソールに **証明書の発行中（Provisioning）** と出る場合は、DNS が正しく反映されるまで待つ。
- ブラウザで `https://example.com` にアクセスしても警告や接続エラーが出るときは、まず Firebase コンソールで **ドメイン状態** と **DNS 検証** が完了しているか確認する。

## トラブルシュート（よくある確認ポイント）

- **ビルドが通らない**: Node 20 系か、`npm ci` が成功しているか。
- **`out` がない / Hosting が空**: `npm run build` を実行したか、`firebase.json` の `hosting.public` が `out` か。
- **環境変数**: クライアントで Firebase を初期化する場合、`.env.local` の `NEXT_PUBLIC_*` がビルド時／実行時に読み込まれているか（ファイル名・キー名の typo）。
- **ルールデプロイ**: `firebase login` と `firebase use`、プロジェクト ID が `.firebaserc` と一致しているか。
- **カスタムドメイン**: DNS の **ホスト名** を誤ると検証失敗しやすい（`www` 付きかルートか、Firebase の表記に合わせる）。
- **SSL がずっと待機**: DNS の A/AAAA/TXT が不足・誤りのことが多い。コンソールの「再確認」やレコード再表示で取り直す。

## 依存関係のメモ

- `firebase` と `firebase-tools` は **devDependencies** に入れています。通常の `npm ci` では dev も入るため **ローカルビルドや一般的な CI** では問題になりにくいです。一方、**本番サーバーで `npm ci --omit=dev` のみ**を使うフローではクライアント SDK が入らないため、その場合は運用に合わせて `firebase` を `dependencies` に移すなどの調整が必要です。

## 手動で行うこと（チェックリスト）

リポジトリ作成後、リポジトリ外・あなたの手元で実施する作業の例です。

### Firebase 側

- [ ] Google アカウントで Firebase プロジェクトを作成する
- [ ] Web アプリを登録し、`.env.example` に対応する **設定値** を `.env.local` に転記する
- [ ] 必要なら Authentication / Firestore / Storage を有効化する
- [ ] `.firebaserc` の `your-firebase-project-id` を実プロジェクト ID に変更する
- [ ] `npx firebase login` と `npx firebase use <projectId>` を実行する
- [ ] Hosting を有効にし、`npm run build` → `npx firebase deploy --only hosting` で公開する
- [ ] ルールを本番向けに編集したうえで `npm run firebase:deploy:rules` などで反映する

### ムームードメイン（DNS）

- [ ] Firebase Hosting のカスタムドメイン追加フローで **表示された DNS レコード** を控える
- [ ] ムームードメインの DNS 設定画面に、**TYPE / ホスト / 値** を誤りなく入力して保存する
- [ ] 反映待ちのあと Firebase コンソールで **検証完了・SSL 有効** を確認する

### 環境変数・秘密情報

- [ ] `.env.local` を作成し、`NEXT_PUBLIC_*` に実値を入れる（**コミットしない**）
- [ ] CI を使う場合は、CI のシークレットストアに同じキー名で登録する

---

このプロジェクトは [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) で初期化し、Firebase・Prettier・静的 export 用スクリプトなどを追加した構成です。
