# construction-lark - Claude Code ガイド

## プロジェクト概要

建設業向けLark Base連携システム。工事管理・工程管理・ガントチャート機能を提供。

## アーキテクチャ

```
src/
├── api/
│   └── lark-client.ts      # Lark Base API クライアント
├── types/
│   ├── construction.ts     # 工事管理テーブル型定義
│   └── schedule.ts         # 工程管理・ガントチャート型定義
├── services/
│   ├── construction-service.ts  # 工事データCRUD
│   └── gantt-service.ts         # ガントチャート生成
└── index.ts                # エントリポイント
```

## 主要コンポーネント

### LarkClient
Lark Base APIへのアクセスを提供。

```typescript
const client = new LarkClient({
  appId: process.env.LARK_APP_ID,
  appSecret: process.env.LARK_APP_SECRET,
});
```

### ConstructionService
工事関連データの管理。

**メソッド:**
- `getContracts()` - 工事一覧取得
- `getContractById(id)` - 工事詳細取得
- `createContract(data)` - 工事作成
- `getQualifiedPersons()` - 資格者一覧
- `getSubcontractors()` - 協力会社一覧
- `getEquipment()` - 資機材一覧
- `getAvailableEquipment()` - 使用可能機材
- `getProcessMasters()` - 工程マスタ一覧
- `initializeConstructionBase()` - テーブル自動作成

### GanttService
ガントチャートデータ生成。

**メソッド:**
- `getContractGanttChart(contractId)` - 工事別工程表
- `getPersonGanttChart(personId)` - 人別ガントチャート
- `getAllPersonsGanttChart(filter?)` - 全員の稼働状況
- `getEquipmentGanttChart(equipmentId)` - 機材別ガントチャート
- `getAllEquipmentGanttChart(filter?)` - 全機材の使用状況
- `getSubcontractorGanttChart(subcontractorId)` - 協力会社別

## テーブル構成

| テーブル | フィールド |
|---------|-----------|
| 工事契約情報 | 契約番号, 工事名, 発注者名, 契約金額, 契約日, 着工日, 竣工予定日, ステータス |
| 資格者マスタ | 社員番号, 氏名, 所属部署, 保有資格, 連絡先, 在籍フラグ |
| 協力会社マスタ | 会社コード, 会社名, 代表者名, 住所, 専門分野, 評価ランク |
| 資機材マスタ | 資機材コード, 名称, 分類, メーカー, 保有数量, 状態 |
| 工程マスタ | 工程コード, 工程名, 工程分類, 標準工期, 必要資格 |
| スケジュール | 工事ID, 工程ID, 予定開始日, 予定終了日, 進捗率, ステータス |

## 開発コマンド

```bash
# 開発
npm run dev

# ビルド
npm run build

# テスト
npm test

# 型チェック
npm run typecheck

# Lint
npm run lint
```

## 環境変数

`.env.example` を `.env` にコピーして設定:

- `LARK_APP_ID` - Lark App ID
- `LARK_APP_SECRET` - Lark App Secret
- `LARK_BASE_APP_TOKEN` - Base App Token
- `LARK_TABLE_*` - 各テーブルID

## Issueラベル

このプロジェクトはMiyabi 65ラベル体系を使用:
- `type:feature` / `type:bug` / `type:refactor`
- `priority:P0-Critical` ~ `priority:P3-Low`
- `state:pending` / `state:implementing` / `state:done`

## AI Agent

Miyabi Agentで自動処理可能:
```bash
npx miyabi agent run coordinator --issue=<number>
```
