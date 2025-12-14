# 建設業向けダッシュボード自動作成機能

Lark Baseのネイティブダッシュボード機能を使って、建設業向けの4つのダッシュボードを自動作成するスクリプトを提供します。

## 作成されるダッシュボード

### 1. 工事進捗ダッシュボード
**目的:** 工事別の進捗状況と工程管理を可視化

**含まれるブロック:**
- 全体進捗率（数値カード）- 全工程の平均進捗率を表示
- 遅延工程数（数値カード）- 遅延している工程の件数
- 工事別進捗率（棒グラフ）- 各工事の進捗率を比較
- 工程ステータス別件数（ドーナツグラフ）- 完了/進行中/未着手/遅延の割合
- 今週の作業予定（テーブル）- 今週開始予定の工程一覧

### 2. 機材管理ダッシュボード
**目的:** 機材の稼働状況と使用計画を管理

**含まれるブロック:**
- 総機材数（数値カード）- 保有機材の総数
- 使用中機材数（数値カード）- 現在使用中の機材数
- 機材稼働率（ドーナツグラフ）- 使用可能/使用中/整備中/故障の割合
- 機材別使用状況（積み上げ棒グラフ）- カテゴリ別の機材状況
- 空き機材一覧（テーブル）- 使用可能な機材の一覧

### 3. 人員配置ダッシュボード
**目的:** 作業員の配置状況と稼働率を管理

**含まれるブロック:**
- 総人員数（数値カード）- 在籍中の社員数
- 稼働中人員数（数値カード）- 現在工程に配置されている人数
- 担当者別工程数（棒グラフ）- 各担当者が持つ工程の数
- 稼働率グラフ（折れ線グラフ）- 時系列での人員稼働状況
- 今日の配置状況（テーブル）- 本日作業中の工程と担当者

### 4. 安全管理ダッシュボード
**目的:** 安全活動の実施状況と事故防止対策を管理

**含まれるブロック:**
- 今月の安全スコア（数値カード）- 今月の平均安全スコア
- KY活動実施率（進捗バー）- KY活動の実施進捗
- 安全パトロール結果（棒グラフ）- パトロールでの指摘と改善状況
- 事故・ヒヤリハット件数（折れ線グラフ）- 時系列での事故・ヒヤリハット推移
- 未対応の指摘事項（テーブル）- 未解決の安全指摘事項

## セットアップ

### 1. 環境変数の設定

`.env`ファイルに以下の環境変数を設定してください:

```bash
# Lark API認証情報
LARK_APP_ID=cli_xxxxxxxxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LARK_BASE_APP_TOKEN=xxxAPPTOKENxxx

# テーブルID（必須）
LARK_TABLE_CONTRACTS=tblxxxxxxxx
LARK_TABLE_SCHEDULES=tblxxxxxxxx
LARK_TABLE_QUALIFIED_PERSONS=tblxxxxxxxx
LARK_TABLE_EQUIPMENT=tblxxxxxxxx

# オプション
LARK_TABLE_SAFETY_RECORDS=tblxxxxxxxx
```

### 2. 依存パッケージのインストール

```bash
npm install
```

## 使用方法

### 方法1: 対話モードで作成

```bash
npm run dashboard:create -- --interactive
```

対話的にテーブルIDを入力し、作成するダッシュボードを選択できます。

### 方法2: 環境変数から自動作成

```bash
npm run dashboard:create
```

`.env`ファイルの設定を使って、すべてのダッシュボードを自動作成します。

### 方法3: 個別に作成

特定のダッシュボードのみを作成する場合:

```bash
# 工事進捗ダッシュボード
npm run dashboard:create-progress

# 機材管理ダッシュボード
npm run dashboard:create-equipment

# 人員配置ダッシュボード
npm run dashboard:create-personnel

# 安全管理ダッシュボード
npm run dashboard:create-safety
```

## プログラムから使用

TypeScript/JavaScriptコードから直接ダッシュボードを作成できます:

```typescript
import { LarkClient, DashboardService, createConstructionProgressDashboard } from 'construction-lark';

// クライアント初期化
const client = new LarkClient({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!,
});

const dashboardService = new DashboardService(
  client,
  process.env.LARK_BASE_APP_TOKEN!
);

// テンプレート作成
const template = createConstructionProgressDashboard({
  contracts: 'tblXXXXXXXX',
  schedules: 'tblYYYYYYYY',
});

// ダッシュボード作成
const result = await dashboardService.createDashboardFromTemplate(template);
console.log('Dashboard ID:', result.dashboardId);
```

## ファイル構成

```
src/
├── types/
│   └── dashboard.ts              # ダッシュボード型定義
├── services/
│   ├── dashboard-service.ts      # ダッシュボードAPI実装
│   └── dashboard-templates.ts    # 建設業向けテンプレート
├── cli/
│   └── commands/
│       └── create-dashboards.ts  # CLIコマンド実装
└── scripts/
    └── create-dashboards.ts      # メインスクリプト

examples/
├── create-construction-progress-dashboard.ts
├── create-equipment-dashboard.ts
├── create-personnel-dashboard.ts
└── create-safety-dashboard.ts
```

## カスタマイズ

### 独自のダッシュボードを作成

```typescript
import { DashboardTemplate } from 'construction-lark';

const customDashboard: DashboardTemplate = {
  name: 'カスタムダッシュボード',
  description: '独自のダッシュボード',
  blocks: [
    {
      name: '工事件数',
      type: 'number',
      config: {
        source: {
          table_id: 'tblXXXXXXXX',
          fields: ['contractNumber'],
        },
        display: {
          aggregation: {
            field_id: 'contractNumber',
            function: 'count',
          },
          format: {
            type: 'number',
            decimal_places: 0,
          },
        },
      },
      position: { x: 0, y: 0 },
      size: { width: 2, height: 2 },
    },
    // 追加のブロック...
  ],
};

const result = await dashboardService.createDashboardFromTemplate(customDashboard);
```

## 利用可能なブロックタイプ

- `number` - 数値統計カード
- `progress` - 進捗バー
- `chart` - チャート（棒/折れ線/円/ドーナツ/面/散布図など）
- `table` - テーブル
- `pivot` - ピボットテーブル
- `kanban` - カンバン
- `gantt` - ガントチャート
- `calendar` - カレンダー
- `timeline` - タイムライン

## チャートタイプ

- `bar` - 棒グラフ
- `column` - 縦棒グラフ
- `line` - 折れ線グラフ
- `pie` - 円グラフ
- `donut` - ドーナツグラフ
- `area` - 面グラフ
- `scatter` - 散布図
- `stacked_bar` - 積み上げ棒グラフ
- `stacked_column` - 積み上げ縦棒グラフ

## 集計関数

- `count` - カウント
- `count_distinct` - 重複を除いたカウント
- `sum` - 合計
- `average` - 平均
- `min` - 最小値
- `max` - 最大値
- `median` - 中央値

## トラブルシューティング

### エラー: Failed to get access token

**原因:** 認証情報が正しく設定されていません。

**解決策:** `.env`ファイルで`LARK_APP_ID`と`LARK_APP_SECRET`を確認してください。

### エラー: Field not found

**原因:** 指定したフィールド名がテーブルに存在しません。

**解決策:** Lark Baseでテーブルのフィールド名を確認し、正しい名前を指定してください。

### エラー: Failed to create dashboard

**原因:** テーブルIDが間違っているか、権限が不足しています。

**解決策:**
- テーブルIDが正しいか確認
- Lark AppがBaseへのアクセス権限を持っているか確認

## APIリファレンス

### DashboardService

#### `createDashboard(request: CreateDashboardRequest): Promise<string>`
ダッシュボードを作成します。

#### `createBlock(dashboardId: string, request: CreateBlockRequest): Promise<string>`
ダッシュボードにブロックを追加します。

#### `createDashboardFromTemplate(template: DashboardTemplate): Promise<{ dashboardId: string; blockIds: string[] }>`
テンプレートからダッシュボードとブロックを一括作成します。

#### `listDashboards(): Promise<Dashboard[]>`
ダッシュボード一覧を取得します。

#### `listBlocks(dashboardId: string): Promise<DashboardBlock[]>`
ダッシュボードのブロック一覧を取得します。

#### `updateBlock(dashboardId: string, blockId: string, config: Partial<CreateBlockRequest>): Promise<void>`
ブロックを更新します。

#### `deleteBlock(dashboardId: string, blockId: string): Promise<void>`
ブロックを削除します。

#### `deleteDashboard(dashboardId: string): Promise<void>`
ダッシュボードを削除します。

## 関連ドキュメント

- [Lark Base API ドキュメント](https://open.larksuite.com/document/server-docs/docs/bitable-v1/app-table-record/create)
- [プロジェクトREADME](./README.md)
- [型定義](./src/types/dashboard.ts)
- [ダッシュボード設定ガイド](./docs/DASHBOARD.md)

## ライセンス

MIT License
