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
```

## 5. 開発サーバー

```bash
npm run dev
```

ブラウザで `http://localhost:3000/admin/login` を開き、管理者アカウントでログインします。

## 6. コンテンツの公開フロー（Phase 1）

1. 管理画面でクイズ / レッスンを作成・編集して **保存**
2. ステータスを `published`、`ready` にチェック
3. **エクスポート（txt）** で `public/` 用ファイルを取得
4. `public/{slug}/` に配置
5. 新規クイズの場合は `next.config.ts`・`firebase.json`・`public/sw.js` を更新（エクスポート README 参照）
6. **manifest.json** をダウンロードして `public/content-manifest.json` を置き換え
7. `npm run build` → Firebase Hosting へデプロイ

## トラブルシュート

- **ログインできるが一覧が空 / 権限エラー** → `admins/{uid}` が無い、またはルール未デプロイ
- **教科別一覧でエラー** → `firestore.indexes.json` をデプロイ（`subjectId` + `order`）
- **ビルド時 Firebase エラー** → `.env.local` の `NEXT_PUBLIC_*` を確認
