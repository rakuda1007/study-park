# Study Park 認証・マルチテナント・課金 仕様書

| 項目 | 内容 |
|------|------|
| 版 | 0.1（ドラフト） |
| 作成日 | 2026-05-25 |
| ステータス | **段階実装中**（Phase 1〜4 相当をコード反映済み。Stripe Checkout は未接続） |
| 関連 | [管理画面セットアップ](./admin-setup.md)、現行 Firestore / Storage 構成 |

---

## 1. 目的

Study Park に **メールアドレスによるログイン** を導入し、将来的に次のビジネス・技術構成を実現する。

1. **買い切り** … クリエイターが有料教材（問題・レッスン）を作成・公開する権利
2. **月額サブスク** … ストレージ使用量または登録問題数が一定を超えた場合の従量課金（ティア制）

同時に、**プラットフォーム管理者 / クリエイター / 学習者** の3ロールを定義し、学習者はクリエイターに紐づき、そのクリエイターが作成したコンテンツを利用できるようにする。

本仕様書は **実装手順・API・データモデル・課金ルール・公開方式の選択肢** を固定する。コード変更は別タスクとする。

---

## 2. スコープ

### 2.1 本仕様に含める

- メール＋パスワードによる Firebase Authentication
- ロールと権限（管理者・クリエイター・学習者）
- ワークスペース（`workspaces`）によるコンテンツのテナント分離
- 無償提供コンテンツ（九九・県庁所在地）と有料クリエイター機能の境界
- 買い切り・月額サブスクの課金条件（ストレージ＋問題数）
- 公開 URL・学習者ログイン要否の **推奨案**
- Firestore / Storage のデータ構造とルール方針
- 実装フェーズ

### 2.2 本仕様に含めない（将来検討）

- Stripe / App Store 等の決済 UI の詳細実装
- 組織（教室）プラン・複数クリエイター共有ワークスペース
- 学習進捗のクラウド同期（現行 `localStorage` の置き換え）
- 法的表記（特定商取引法・返金ポリシー）の本文

---

## 3. ビジネスルール概要

### 3.1 コンテンツ種別と課金

| 種別 | 例 | 登録 | クリエイター機能 | 課金 |
|------|-----|------|------------------|------|
| **無償・公式** | 九九（`/kuku/`）、県庁所在地（`/kencho/`） | 不要 | 利用のみ（作成不可） | なし |
| **有料・クリエイター作成** | Firestore 管理のレッスン・クイズ、その他教材 | クリエイターアカウント必要 | 作成・編集・公開 | **買い切り**で作成権を付与 |
| **従量・月額** | 上記のうち利用量が閾値超過 | 同上 | 継続利用 | **サブスク（ティア）** |

- **買い切り**: 「問題作成アプリの利用権」（テキスト中心の教材作成・公開）。1クリエイター（1ワークスペース）あたり1回購入を基本とする。
- **月額サブスク**: 次の **いずれか** を満たした時点で該当ティアへの加入（または自動アップグレード）が必要。
  - **ストレージ**: アップロード画像等の合計バイトが無料枠を超過
  - **問題数**: ワークスペース内の登録問題数（画像の有無を問わない）が無料枠を超過

※ 九九・県庁は **ワークスペースに登録せず**、従来どおり `public/` 静的アプリとして無償提供する。

### 3.2 料金プラン（数値は仮・運用前に確定）

#### 買い切り（1回）

| 名称 | 内容（案） |
|------|------------|
| クリエイター版 | ワークスペース作成、コンテンツ CRUD、学習者招待、公開（制限付き無料枠内） |

#### 月額サブスク（ティア制・推奨）

無料枠は **買い切り済みクリエイター** に付与。超過時のみ上位ティアへ。

| ティア | 月額（案） | ストレージ上限 | 登録問題数上限 |
|--------|------------|----------------|----------------|
| 無料枠（Included） | ¥0 | 100 MB | 30 問 |
| S | ¥300 | 1 GB | 100 問 |
| M | ¥800 | 5 GB | 500 問 |
| L | ¥2,000 | 20 GB | 2,000 問 |

**課金トリガー（いずれか先に到達）**

- `storageBytesUsed > 現在ティアの storageBytesLimit`
- `questionCount > 現在ティアの questionCountLimit`

**新規作成のゲート**

- 上限超過時: **新規問題の追加・新規画像アップロードを禁止**
- 既存公開コンテンツの **閲覧（学習）は原則継続**（未払い時の停止ポリシーは [§10.4](#104-未払い・解約時) で選択）

---

## 4. 登場人物（ロール）

### 4.1 プラットフォーム管理者

| 項目 | 内容 |
|------|------|
| 識別 | Firestore `admins/{uid}` が存在する Firebase Auth ユーザー |
| 権限 | 全ワークスペースの閲覧・サポート、公式コンテンツ、障害対応、課金例外処理 |
| ログイン | メール＋パスワード（現行 `/admin` と同系統、役割判定を `admins` で行う） |

### 4.2 クリエイター

| 項目 | 内容 |
|------|------|
| 識別 | `users/{uid}` に `role: "creator"`（または `workspaces` の `ownerId`） |
| 権限 | 自分のワークスペース内のコンテンツ CRUD、画像アップロード、学習者の招待・紐づけ、公開設定 |
| 前提 | **買い切り済み**（`appPurchase.status == "active"`）。無償の九九・県庁の「作成」は不可 |
| ログイン | メール＋パスワード（必須） |

### 4.3 学習者

| 項目 | 内容 |
|------|------|
| 識別 | `users/{uid}` に `role: "learner"`、`learners` または `workspaceMembers` で **1 人以上のクリエイター（ワークスペース）に紐づく** |
| 権限 | 紐づいたワークスペースの **許可された公開コンテンツ** を学習。進捗は Phase 1 では端末ローカル、将来クラウド可 |
| ログイン | **推奨: 任意（ハイブリッド）** — 詳細は [§7](#7-公開方式と学習者ログインの推奨) |

---

## 5. 認証（メールアドレス）

### 5.1 方式

- **Firebase Authentication**: メールアドレス＋パスワード
- サインアップ時: メール確認（推奨）、パスワードリセット
- 将来: Google ログイン等は Phase 2 以降で追加可能

### 5.2 ユーザードキュメント（Firestore）

コレクション `users/{uid}`（Auth の UID と一致）:

```typescript
{
  email: string;
  displayName?: string;
  role: "creator" | "learner";  // 兼務は Phase 2 以降
  appPurchase?: {
    status: "none" | "pending" | "active" | "refunded";
    purchasedAt?: Timestamp;
    provider?: "stripe";
    paymentId?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

- 初回サインアップ時に Cloud Function またはクライアント（ルール許可範囲）で `users` を作成
- クリエイター登録フローで `role: "creator"` とワークスペースを紐づけ

### 5.3 現行管理者との関係

- `admins/{uid}` は **プラットフォーム管理者専用** とし、クリエイター権限とは分離
- 同一 UID が管理者かつクリエイターになり得る（運用者アカウント）

---

## 6. データモデル

### 6.1 無償コンテンツ（ワークスペース外）

| コンテンツ | URL（現行） | 保存 |
|------------|-------------|------|
| 九九 | `/kuku/` | `public/kuku/` + `localStorage`（`kukuAppData`） |
| 県庁所在地 | `/kencho/` | `public/kencho/` + `localStorage`（`kenchoAppData`） |

- Firestore `workspaces` **に登録しない**
- クリエイター買い切り・サブスクの対象外
- トップメニューでは「無償」セクションとして常時表示

### 6.2 ワークスペース（有料クリエイター領域）

```
workspaces/{workspaceId}
  ownerId: string          // クリエイター UID
  name: string             // 表示名（教室名など）
  slug: string             // URL 用短縮 ID（英小文字・ハイフン）
  storageBytesUsed: number // Functions のみ更新
  storageBytesLimit: number
  questionCount: number    // Functions のみ更新
  questionCountLimit: number
  planId: string           // "included" | "s" | "m" | "l"
  subscriptionStatus: string // "none" | "active" | "past_due" | "canceled"
  createdAt, updatedAt

workspaces/{workspaceId}/contents/{contentId}
  // 現行 ContentDoc 相当（subjectId, slug, title, status, lesson, quiz, ...）
  visibility: "private" | "members" | "unlisted" | "public"
  // members: 紐づく学習者のみ
  // unlisted: URL を知っていればアクセス可（ログイン不要も可）
  // public: 将来のギャラリー掲載用

workspaces/{workspaceId}/subjects/{subjectId}
  // クリエイター独自の教科分類

workspaces/{workspaceId}/assets/{assetId}
  storagePath: string
  bytes: number
  contentId: string
  mimeType: string
  createdAt

workspaceMembers/{workspaceId}_{uid}   // またはサブコレクション members
  workspaceId, userId, role: "owner" | "learner"
  invitedAt, invitedBy
```

**Storage パス（案）**

```
workspaces/{workspaceId}/lesson-images/{contentId}/{filename}
```

### 6.3 学習者とクリエイターの紐づけ

**方式 A（推奨）**: `workspaceMembers` コレクション

```
workspaceMembers/{workspaceId}_{learnerUid}
  workspaceId
  userId        // 学習者 UID
  role: "learner"
  status: "active" | "revoked"
  invitedBy     // クリエイター UID
  createdAt
```

- クリエイターが **招待コード** または **メール招待** で学習者を追加
- 学習者は複数ワークスペースに所属可（塾と自宅など）

### 6.4 公式・移行用ワークスペース

既存の Firestore フラット `contents` は、移行時に例えば `workspaces/study-park-official` へ集約する。新規クリエイター作成分は常に各ユーザーの `workspaces/{id}` 配下のみ。

### 6.5 学習進捗（Phase 1）

| 対象 | 保存 |
|------|------|
| 九九・県庁 | 従来どおり `localStorage` |
| ワークスペース配信クイズ | 従来どおり `study-park-quiz-{slug}` 等（端末ローカル） |
| 学習者ログイン後（将来） | `learners/{uid}/progress/{contentId}` を検討 |

---

## 7. 公開方式と学習者ログインの推奨

### 7.1 `/play?slug=xxx&ws=ワークスペースID` の意味

**意図**: どのクリエイター（ワークスペース）が作った教材かを URL で特定する **テナント識別子** である。

| パラメータ | 意味 |
|------------|------|
| `slug` | コンテンツのスラッグ（ワークスペース内で一意） |
| `ws` | ワークスペース ID（または短縮 `slug`） |

**これだけでは「ログイン必須」ではない。**  
`visibility` と Firestore / Hosting のルールの組み合わせで、アクセス条件が決まる。

### 7.2 公開モード（`visibility`）一覧

| 値 | URL を知った未ログイン者 | ログイン済み学習者（紐づき） | 用途 |
|----|-------------------------|------------------------------|------|
| `private` | アクセス不可 | 不可（下書き） | 編集中 |
| `members` | アクセス不可 | **可** | 教室限定・招待制 |
| `unlisted` | **可**（リンク共有） | 可 | 保護者に URL 送付、ログイン省略 |
| `public` | 可（将来トップ掲載） | 可 | 公式ギャラリー |

→ 以前の「テナント付き URL」案は、主に **`unlisted` と組み合わせた「URL を知っていれば学習できる」** 方式を想定していた。ログインは必須ではない。

### 7.3 学習者ログイン: 必須にするか — 推奨（ハイブリッド）

| 方式 | メリット | デメリット |
|------|----------|------------|
| **A. 常にログイン必須** | 紐づけが明確、進捗クラウド化しやすい、リンク流出しても他者は見にくい | 小学生にはハードル高い、保護者設定が必要 |
| **B. 常にログイン不要** | 九九と同様に簡単 | クリエイター紐づけの意味が薄い、リンク漏洩で誰でもアクセス |
| **C. ハイブリッド（推奨）** | 教室は `members`、家庭は `unlisted` と使い分け可能 | 実装・説明がやや複雑 |

**推奨: C（ハイブリッド）**

1. **デフォルトの公開**は `members`（学習者はログイン必須、かつ `workspaceMembers` にいること）
2. クリエイターが明示的に選べる **「リンクだけで学習（ログイン不要）」** を `unlisted` とする
3. 学習者アカウントは **招待制で作成**（クリエイターがコード発行）。勝手に他 ws の教材は見えない

**子ども向け UX**

- 学習者ログインは **短い招待コード + ニックネーム** から始め、メールは保護者が後から紐づけ（Phase 2）
- 初回は `unlisted` のみ使い、慣れたら `members` へ移行、とガイド可能

### 7.4 学習者向け URL 例

| シナリオ | URL 例 | ログイン |
|----------|--------|----------|
| 教室・紐づき必須 | `/play?ws=abc123&slug=sansu-01` + `visibility=members` | 必須 |
| 保護者共有 | `/play?ws=abc123&slug=sansu-01` + `visibility=unlisted` | 不要 |
| 無償九九 | `/kuku/` | 不要 |

---

## 8. 課金仕様（詳細）

### 8.1 状態遷移（クリエイター）

```
[未登録]
  → サインアップ（users 作成）
  → 買い切り決済
[appPurchase.active]
  → 無料枠内で作成・公開
  → ストレージ or 問題数が閾値超過
[サブスク契約必須（新規追加ブロック）]
  → Stripe サブスク active
  → 上位ティアで継続
```

### 8.2 問題数のカウント規則

| 含める | 含めない |
|--------|----------|
| `workspaces/{ws}/contents` の `type: "quiz"` に属する `quiz.questions[]` の件数 | 九九・県庁（ws 外） |
| `status: "archived"` は除外（案） | 下書き `draft` は **含める**（容量食い防止）または含めない — **要決定: 下書き含む** |

**集計**

- 作成・更新・削除時に Cloud Function で `questionCount` を再計算
- 日次バッチで全 ws を reconcile

### 8.3 ストレージのカウント規則

| 含める | 含めない |
|--------|----------|
| `workspaces/{ws}/lesson-images/` 配下のオブジェクトサイズ | 外部 URL 参照のみの画像（手入力 `src` が Firebase 外）— **手入力 URL は禁止推奨** |
| `assets` サブコレクションで管理したファイル | 無償静的 `public/` 配下 |

### 8.4 上限チェック（実装方針）

1. **クライアント**: ダッシュボードに使用率表示、超過前に警告（80%）
2. **Callable Function**: 問題追加・画像アップロード前に `questionCount` / `storageBytesUsed` を検証
3. **Storage**: 直アップロードを廃止し、署名付き URL は Function 発行のみ（推奨）

### 8.5 決済連携（将来）

- **Stripe**: 買い切り（Checkout `mode: payment`）+ サブスク（`mode: subscription`、Price をティアごと）
- Webhook で `users.appPurchase` と `workspaces.subscriptionStatus` / `planId` / 上限値を更新
- 詳細は別紙「決済連携仕様」（未作成）で定義

---

## 9. セキュリティルール（方針）

### 9.1 Firestore

```
admins/{uid}
  read: 本人のみ
  write: false（Console のみ）

users/{uid}
  read, update: 本人のみ
  create: 本人（初回）

workspaces/{wsId}
  read: owner | member | admin
  write: false（Functions のみ集計更新）

workspaces/{wsId}/contents/{id}
  read:
    - owner / member（visibility に応じ admin 相当）
    - visibility == unlisted | public → 未認証可（クエリは slug+ws で限定）
    - visibility == members → member のみ
  write: owner && appPurchase.active && 上限内（Callable 経由推奨）

workspaceMembers/{id}
  read: 当事者・当該 ws の owner
  write: owner が invite / revoke
```

### 9.2 Storage

```
workspaces/{wsId}/lesson-images/{contentId}/{file}
  read: true（公開教材の画像表示）または members のみ — visibility に合わせ要検討
  write: owner + 上限内（Callable 経由）
  delete: owner
```

---

## 10. 画面・フロー（概要）

### 10.1 認証画面（新規）

| パス | 用途 |
|------|------|
| `/login` | 共通ログイン（ロールによりリダイレクト） |
| `/signup` | クリエイター／学習者の入口分岐 |
| `/signup/creator` | クリエイター登録 → 買い切りへ |
| `/signup/learner` | 招待コード入力 |
| `/admin/login` | 管理者（現行維持または `/login` に統合） |

### 10.2 クリエイター

| パス | 用途 |
|------|------|
| `/creator` | ダッシュボード（使用量・プラン） |
| `/creator/contents` | 一覧（現 `/admin/contents` の ws 版） |
| `/creator/contents/edit` | 編集 |
| `/creator/learners` | 学習者招待・一覧 |

### 10.3 学習者

| パス | 用途 |
|------|------|
| `/learner` | 紐づく ws の教材一覧 |
| `/play?ws=&slug=` | 学習画面（visibility によりゲート） |

### 10.4 未払い・解約時

**推奨（初期）**

| 状態 | 新規作成 | 既存の学習（公開 URL） |
|------|----------|------------------------|
| サブスク未契約で超過 | ブロック | **継続可**（学習者への影響最小） |
| `past_due` | ブロック | 継続可 or 7 日後停止 — **要決定** |
| 解約後 | 無料枠までのみ新規可 | 継続可 |

---

## 11. 現行システムからの変更マップ

| 現行 | 将来 |
|------|------|
| 管理者のみ Auth | クリエイター・学習者も Auth |
| `contents` トップレベル | `workspaces/{ws}/contents` |
| `lesson-images/{contentId}/` | `workspaces/{ws}/lesson-images/...` |
| 公開は `status==published` のみ | + `visibility` + `ws` + member チェック |
| `/admin/*` | `/creator/*`（管理者は `/admin` 維持） |
| 進捗 `localStorage` | Phase 1 維持 |
| 九九・県庁 | 変更なし（無償） |

---

## 12. 実装フェーズ

| Phase | 内容 | 成果物 |
|-------|------|--------|
| **1** | メール Auth、users、signup/login、役割の土台 | ログインのみ |
| **2** | workspaces、contents 移行、creator 編集 UI、Rules（members / unlisted） | マルチテナント、課金なし |
| **3** | workspaceMembers、学習者招待・一覧、/learner | 学習者紐づけ |
| **4** | 買い切り Stripe、appPurchase ゲート | 有料作成 |
| **5** | 問題数・ストレージ集計、サブスク Stripe、上限ブロック | 月額課金 |
| **6** | ダッシュボード、通知、reconcile、移行完了 | 運用品質 |

---

## 13. 未決定事項（実装前に確定）

| ID | 項目 | 選択肢 |
|----|------|--------|
| D1 | 下書き問題を問題数に含むか | 含む / 含まない |
| D2 | `past_due` 時に既存公開を止めるか | 止めない（推奨） / N 日後停止 |
| D3 | `unlisted` 画像の Storage read | 全世界 readable / 要トークン |
| D4 | ws URL に `wsId` vs `workspace.slug` | 短縮 slug 推奨 |
| D5 | 1 人がクリエイターと学習者兼務 | Phase 2 まで不可 |
| D6 | 買い切り価格・ティア価格 | 運用・コスト試算後 |
| D7 | 学習者のメール必須か | 招待時のみ保護者メール等 |

---

## 14. 用語集

| 用語 | 説明 |
|------|------|
| ワークスペース（ws） | クリエイター 1 単位のデータ境界。課金・上限の単位 |
| テナント付き URL | `ws` パラメータでワークスペースを指定する URL。ログイン必須とは限らない |
| 買い切り | クリエイター機能の一回購入 |
| 無料枠（Included） | 買い切り後に付与されるストレージ・問題数の初期上限 |
| visibility | 公開範囲（private / members / unlisted / public） |

---

## 15. 実装状況（コードベース）

| Phase | 状態 | 主なパス・モジュール |
|-------|------|----------------------|
| 1 認証 | 済 | `/login`, `/signup/*`, `lib/firebase/auth-client.ts`, `users` |
| 2 ワークスペース | 済 | `workspaces`, `/creator/*`, `lib/workspaces/*` |
| 3 学習者紐づけ | 済 | `workspaceMembers`, `/learner`, 招待コード |
| 4 買い切りゲート | 一部 | `appPurchase` チェック（Stripe 未接続） |
| 5 サブスク・上限 | 一部 | `billingTiers`, 使用量表示・作成時ゲート |
| 6 運用 | 未 | reconcile、Webhook、メール通知 |

ティア上限の可変化: `billingTiers` Firestore ドキュメント + `docs/billing-tiers-setup.md`

## 16. 改訂履歴

| 版 | 日付 | 内容 |
|----|------|------|
| 0.1 | 2026-05-25 | 初版（認証・ws・課金・学習者公開の推奨） |
| 0.2 | 2026-05-25 | Phase 1〜4 実装反映・billingTiers 可変化 |
