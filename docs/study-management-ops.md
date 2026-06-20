# 学習管理（studyPlans）運用ガイド

Study Park の学習管理機能は Firestore の `users/{uid}/studyPlans` サブコレクションにデータを保存します。本ドキュメントは容量・コスト監視と自動メンテナンスの運用手順です。

## 実装済みの保護策

| 施策 | 内容 |
|------|------|
| ソフト上限 | 進行中（`status: active`）の学習計画は **ユーザーあたり最大 50 件** |
| 自動アーカイブ | 完了（`status: completed`）から **365 日** 経過した計画を `archived` に変更（毎日 5:00 JST） |
| 管理画面 | `/admin/study-ops` で件数サマリー・上限到達ユーザーを確認 |
| Cloud Functions | `studyPlanMaintenance` がアーカイブとメトリクスを Cloud Logging に出力 |

定数は `lib/study/limits.ts` と `functions/src/study/config.ts` で同値に保っています。

## Firebase コンソールでの監視

### Firestore ストレージ

1. [Firebase Console](https://console.firebase.google.com/) → プロジェクト → **Firestore Database**
2. **使用状況** タブ（または Google Cloud Console → Firestore → 使用量）でストレージ量の推移を確認
3. 学習計画はテキスト中心のため、**教材画像（Firebase Storage）より増加は緩やか**です

目安: 1 計画＋項目 5 件で約 2〜5 KB。1,000 ユーザーが平均利用しても Firestore ストレージは数十 MB 程度。

### Read / Write 操作数

1. Google Cloud Console → **Firestore** → **使用量**（または **Monitoring**）
2. 監視するメトリクス:
   - `firestore.googleapis.com/document/read_count`
   - `firestore.googleapis.com/document/write_count`
3. 学習管理の週ビュー表示・進捗更新が read/write の主な要因

無料枠（Spark 以外の Blaze）: 50,000 reads / 20,000 writes per day（2026 時点の一般的な枠。プロジェクトのプランを確認してください）。

### Cloud Logging（自動メトリクス）

Cloud Functions `studyPlanMaintenance`（毎日 5:00 JST）が次を JSON で出力します。

- `[studyPlanMetrics]` … ステータス別件数、上限到達ユーザー数
- `[studyPlanArchive]` … その日のアーカイブ件数

確認手順:

1. Google Cloud Console → **Logging** → **ログエクスプローラ**
2. クエリ例:

```
resource.type="cloud_function"
resource.labels.function_name="studyPlanMaintenance"
textPayload=~"studyPlanMetrics"
```

3. **ログベースの指標** を作成し、Alerting で閾値通知も可能（例: `usersAtActiveLimit > 0` が急増）

## デプロイ

初回または index 変更後:

```bash
npm run firebase:deploy:rules
npm run firebase:deploy:indexes
cd functions && npm run build && firebase deploy --only functions:studyPlanMaintenance
```

## 手動確認

- 管理画面: `/admin/study-ops`
- Functions ログ: 上記 Logging クエリ

## 将来の拡張（未実装）

- アーカイブ済み計画の物理削除（保持期間ポリシー）
- 学習者数に応じた read キャッシュ強化
- Cloud Monitoring ダッシュボードの IaC 化
