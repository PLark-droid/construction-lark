# Lark Base ビュー作成ガイド

## 概要

このガイドでは、建設業向けLark Baseに最適なビューを自動作成する方法を説明します。

## ビュー設計の思想

### ITリテラシーが低い建設現場の人でも使いやすいビュー設計

1. **シンプルな命名規則**
   - 「全○○一覧」「今週の○○」「△△別」など、わかりやすい名前
   - 専門用語を避け、現場で使われる言葉を使用

2. **デフォルトビューの最適化**
   - マスタ系 → Grid View（表形式）
   - スケジュール系 → Gantt View（タイムライン）
   - 進捗管理系 → Kanban View（カンバン）
   - 写真管理系 → Gallery View（ギャラリー）

3. **視覚的な情報提示**
   - ガントチャートで工程を可視化
   - カンバンでドラッグ&ドロップ操作
   - ギャラリーで写真を大きく表示

## ビュータイプ一覧

| ビュータイプ | 用途 | 最適な利用シーン |
|------------|------|----------------|
| Grid View | 表形式で詳細データを表示 | マスタデータ、一覧表示 |
| Kanban View | ステータス別カード表示 | 進捗管理、タスク管理 |
| Gantt View | タイムライン表示 | 工程管理、スケジュール管理 |
| Gallery View | 画像を大きく表示 | 写真管理、カタログ表示 |
| Form View | フォーム形式で入力 | データ入力、アンケート |

## 作成されるビュー一覧

### 1. 工事契約テーブル
- **全工事一覧** (Grid) - すべての工事を一覧表示
- **工事進捗管理** (Kanban) - ステータス別カンバン表示
- **施工中案件** (Grid) - 施工中の工事のみ
- **完了予定（今月）** (Grid) - 今月竣工予定の工事

### 2. 大工程テーブル
- **工程スケジュール** (Gantt) - 全工程のガントチャート
- **全工程一覧** (Grid) - すべての工程を一覧表示
- **進行中工程** (Grid) - 進行中の工程のみ

### 3. 中工程テーブル
- **中工程スケジュール** (Gantt) - 中工程のガントチャート
- **中工程進捗** (Kanban) - ステータス別カンバン表示
- **全中工程一覧** (Grid) - すべての中工程を一覧表示

### 4. 小工程テーブル
- **小工程スケジュール** (Gantt) - 小工程のガントチャート
- **小工程タスクボード** (Kanban) - ステータス別カンバン表示
- **今週の作業** (Grid) - 今週着手予定の小工程

### 5. 人員配置テーブル
- **全人員配置** (Grid) - すべての人員配置を一覧表示
- **人員稼働スケジュール** (Gantt) - 人員別の配置スケジュール
- **今月の配置** (Grid) - 今月配置される人員
- **担当者別** (Grid) - 担当者でグループ化

### 6. 機材配置テーブル
- **全機材配置** (Grid) - すべての機材配置を一覧表示
- **機材使用スケジュール** (Gantt) - 機材別の使用スケジュール
- **使用中機材** (Grid) - 現在使用中の機材のみ
- **機材種別** (Grid) - 機材分類でグループ化

### 7. 資格者マスタテーブル
- **資格者一覧** (Grid) - すべての資格者を一覧表示
- **資格別** (Grid) - 保有資格でグループ化
- **在籍者のみ** (Grid) - 在籍フラグが有効な資格者のみ
- **部署別** (Grid) - 所属部署でグループ化

### 8. 資機材マスタテーブル
- **資機材一覧** (Grid) - すべての資機材を一覧表示
- **使用可能機材** (Grid) - 使用可能な機材のみ
- **分類別** (Grid) - 分類でグループ化
- **点検管理** (Grid) - 点検予定日順に表示
- **機材カタログ** (Gallery) - 機材の写真を大きく表示

### 9. 安全パトロールテーブル
- **全パトロール記録** (Grid) - すべての記録を一覧表示
- **写真で確認** (Gallery) - 指摘箇所の写真を大きく表示
- **是正状況管理** (Kanban) - 是正状況別カンバン表示
- **未対応事項** (Grid) - 未対応のみ表示
- **今月の記録** (Grid) - 今月実施した記録のみ

### 10. KY活動記録テーブル
- **全KY活動** (Grid) - すべてのKY活動を一覧表示
- **今週の活動** (Grid) - 今週実施した活動のみ
- **工事別** (Grid) - 工事名でグループ化

### 11. 作業日報テーブル
- **全作業日報** (Grid) - すべての作業日報を一覧表示
- **今週の作業** (Grid) - 今週の作業日報のみ
- **作業者別** (Grid) - 作業者でグループ化
- **工事別** (Grid) - 工事名でグループ化

## ビュー作成方法

### 方法1: インタラクティブモード（推奨）

最も簡単な方法です。スクリプトが自動的にテーブルを検出してビューを作成します。

```bash
# 環境変数を設定
export LARK_APP_ID="your_app_id"
export LARK_APP_SECRET="your_app_secret"
export LARK_BASE_APP_TOKEN="your_base_app_token"

# ビューを作成
npm run view:create
```

### 方法2: 手動モード

テーブルIDを個別に指定したい場合は、この方法を使用します。

```bash
# 環境変数を設定
export LARK_APP_ID="your_app_id"
export LARK_APP_SECRET="your_app_secret"
export LARK_BASE_APP_TOKEN="your_base_app_token"

# テーブルIDを設定（必要なものだけ）
export LARK_TABLE_CONTRACTS="tblzeXSOwQjTY5wt"
export LARK_TABLE_LARGE_PROCESS="tbln82ijUjFqUHEe"
export LARK_TABLE_MEDIUM_PROCESS="tbl9s3ZtsNZzncSl"
export LARK_TABLE_SMALL_PROCESS="tblM4zC4WQJTzx8Q"
export LARK_TABLE_PERSONNEL="tblLQbNfEB6Bbimr"
export LARK_TABLE_EQUIPMENT_ASSIGN="tblfV3nrS96l4W0M"
export LARK_TABLE_QUALIFIED="tblqnOY8S3kl2UWa"
export LARK_TABLE_EQUIPMENT_MASTER="tblUpCKolVWGNVVl"
export LARK_TABLE_SAFETY="tblncJrCIw6mWUJa"
export LARK_TABLE_KY="tblxxxxxx"
export LARK_TABLE_WORK_REPORT="tblxxxxxx"

# ビューを作成
npm run view:create-manual
```

### 方法3: プログラムから使用

TypeScript/JavaScriptコードから直接使用することもできます。

```typescript
import { LarkClient } from './src/api/lark-client.js';
import { ViewCreator } from './src/setup/view-creator.js';

const client = new LarkClient({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!,
});

const viewCreator = new ViewCreator(client);

// すべてのビューを作成
const results = await viewCreator.createAllConstructionViews(
  'your_base_app_token',
  {
    contracts: 'tblzeXSOwQjTY5wt',
    largeProcess: 'tbln82ijUjFqUHEe',
    // ... 他のテーブルID
  }
);

console.log('作成完了:', results);
```

## 個別テーブルのビュー作成

特定のテーブルだけにビューを作成したい場合:

```typescript
import { ViewCreator } from './src/setup/view-creator.js';

const viewCreator = new ViewCreator(client);

// 工事契約テーブルのみ
await viewCreator.createConstructionContractViews(
  baseAppToken,
  contractsTableId
);

// 安全パトロールテーブルのみ
await viewCreator.createSafetyPatrolViews(
  baseAppToken,
  safetyPatrolTableId
);
```

## トラブルシューティング

### エラー: "Failed to create view"

**原因:**
- APIレート制限に引っかかった
- ビュー名が重複している
- テーブルIDが正しくない

**対処法:**
1. 少し時間を置いてから再実行
2. 既存のビューを確認して重複を削除
3. テーブルIDを確認

### ビューが作成されない

**原因:**
- 環境変数が正しく設定されていない
- テーブルIDが見つからない

**対処法:**
1. 環境変数を再確認: `echo $LARK_BASE_APP_TOKEN`
2. テーブルIDを確認: Lark Baseで確認

### API制限エラー

**原因:**
- Lark APIのレート制限（短時間に多数のリクエスト）

**対処法:**
- スクリプトは自動的に300msの待機時間を挿入しています
- それでもエラーが出る場合は、view-creator.tsの`setTimeout`の値を増やしてください

## ビューのカスタマイズ

作成されたビューは、Lark Base上で以下をカスタマイズできます:

1. **フィルタ条件**
   - 「施工中のみ」「今週のみ」などの条件を追加

2. **ソート順**
   - 日付順、名前順など

3. **グループ化**
   - 工事別、担当者別、ステータス別など

4. **表示フィールド**
   - 必要なフィールドだけを表示

5. **カンバンの列設定**
   - ステータスの順序や色を変更

6. **ガントチャートの設定**
   - 開始日・終了日フィールドの指定
   - マイルストーンの設定

## 参考資料

- [Lark Base ビュー設計ドキュメント](./view-design.md)
- [Lark Base API ドキュメント](https://open.larksuite.com/document/uAjLw4CM/ukTMukTMukTM/reference/bitable-v1/app-table-view/create)
- [建設業向けビューのベストプラクティス](./view-design.md)

## サポート

質問や問題がある場合は、GitHubのIssueを作成してください。
