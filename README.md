# construction-lark

建設業向けLark Base連携ライブラリ - 工事管理・工程管理をLarkで実現

## 概要

**construction-lark**は、Lark Base上で建設業向けの工事管理・工程管理システムを構築するためのTypeScriptライブラリです。

### 主な機能

- **工事管理Base**: 工事契約情報、資格者マスタ、協力会社マスタ、資機材マスタ、工程マスタ
- **工程管理Base**: スケジュール管理、進捗追跡
- **ガントチャート生成**: 工事別・人別・機材別・協力会社別のガントチャート出力
- **リソース管理**: 人員・機材の割当状況と稼働率の可視化
- **進捗管理**: クリティカルパス分析、マイルストーン管理

## インストール

```bash
npm install construction-lark
```

または

```bash
git clone https://github.com/PLark-droid/construction-lark.git
cd construction-lark
npm install
```

## 環境設定

### 1. 環境変数ファイルの作成

```bash
cp .env.example .env
```

### 2. `.env`ファイルの編集

以下の環境変数を設定してください：

```bash
# Lark API認証情報
LARK_APP_ID=cli_xxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxx

# Lark Base情報
LARK_APP_TOKEN=bascnxxxxxxxxxx

# テーブルID（Lark Baseで作成したテーブルのID）
LARK_TABLE_CONTRACTS=tblxxxxxxxxx        # 工事契約情報テーブル
LARK_TABLE_QUALIFIED_PERSONS=tblxxxxxxxxx # 資格者マスタテーブル
LARK_TABLE_SUBCONTRACTORS=tblxxxxxxxxx    # 協力会社マスタテーブル
LARK_TABLE_EQUIPMENT=tblxxxxxxxxx         # 資機材マスタテーブル
LARK_TABLE_PROCESS_MASTER=tblxxxxxxxxx    # 工程マスタテーブル
LARK_TABLE_SCHEDULES=tblxxxxxxxxx         # 工程スケジュールテーブル
```

### Lark認証情報の取得方法

1. [Lark開発者コンソール](https://open.larksuite.com/)にアクセス
2. 新しいアプリを作成
3. アプリID (`app_id`) とアプリシークレット (`app_secret`) を取得
4. 権限設定で以下のスコープを追加：
   - `bitable:app` (Baseアプリへのアクセス)
   - `bitable:app:readonly` (読み取り専用アクセス)

### Lark Base / テーブルIDの取得方法

1. Larkで新しいBaseを作成
2. ブラウザでBaseを開き、URLから`app_token`を確認：
   ```
   https://example.larksuite.com/base/bascnXXXXXXXXXXXX
                                      ↑ app_token
   ```
3. 各テーブルを開き、URLから`table_id`を確認：
   ```
   https://example.larksuite.com/base/bascnXXXX?table=tblYYYYYY
                                                      ↑ table_id
   ```

## 使い方

### 基本的な初期化

```typescript
import { initializeConstructionSystem } from 'construction-lark';

const system = await initializeConstructionSystem({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!,
  appToken: process.env.LARK_APP_TOKEN!,
  tableIds: {
    contracts: process.env.LARK_TABLE_CONTRACTS!,
    qualifiedPersons: process.env.LARK_TABLE_QUALIFIED_PERSONS!,
    subcontractors: process.env.LARK_TABLE_SUBCONTRACTORS!,
    equipment: process.env.LARK_TABLE_EQUIPMENT!,
    processMaster: process.env.LARK_TABLE_PROCESS_MASTER!,
    schedules: process.env.LARK_TABLE_SCHEDULES!,
  },
});

const { larkClient, constructionService, ganttService } = system;
```

### LarkClientの使用

```typescript
import { LarkClient } from 'construction-lark';

// クライアント初期化
const client = new LarkClient({
  appId: 'cli_xxxxxxxxxx',
  appSecret: 'xxxxxxxxxxxxxx',
});

// テーブル一覧取得
const tables = await client.listTables('bascnxxxxxxxxxx');
console.log(tables);

// レコード一覧取得
const records = await client.listRecords('bascnxxxxxxxxxx', 'tblxxxxxxxxx');
console.log(records.data.items);

// レコード作成
const newRecord = await client.createRecord(
  'bascnxxxxxxxxxx',
  'tblxxxxxxxxx',
  {
    '工事名': '新築マンション建設',
    '契約金額': 500000000,
    '着工日': '2025-01-15',
  }
);
```

### 工事管理サービスの使用

```typescript
import { ConstructionService } from 'construction-lark';

// 工事契約一覧取得
const contracts = await constructionService.getContracts();
console.log(contracts);

// 特定の工事契約を取得
const contract = await constructionService.getContractById('rec_xxxxx');
console.log(contract);

// 新規工事契約を作成
const newContract = await constructionService.createContract({
  contractNumber: 'C-2025-001',
  projectName: '新築マンション建設',
  clientName: '株式会社サンプル不動産',
  contractAmount: 500000000,
  contractDate: '2025-01-10',
  startDate: '2025-01-15',
  completionDate: '2025-12-31',
  constructionSite: '東京都渋谷区xxx1-2-3',
  status: 'contracted',
  managerId: 'person_001',
});

// 資格者一覧取得
const persons = await constructionService.getQualifiedPersons();

// 特定の資格を持つ資格者を検索
const architects = await constructionService.getQualifiedPersonsByQualification('建築士');

// 協力会社一覧取得
const subcontractors = await constructionService.getSubcontractors();

// 専門分野で協力会社を検索
const formworkCompanies = await constructionService.getSubcontractorsBySpecialty('型枠');

// 資機材一覧取得
const equipmentList = await constructionService.getEquipment();

// 使用可能な資機材のみ取得
const availableEquipment = await constructionService.getAvailableEquipment();

// カテゴリ別に資機材を検索
const heavyMachinery = await constructionService.getEquipmentByCategory('重機');

// 工程マスタ一覧取得
const processes = await constructionService.getProcessMasters();
```

### ガントチャート取得

#### 工事別ガントチャート

```typescript
import { demoContractGantt } from 'construction-lark';

// 工事別ガントチャート取得
const ganttData = await ganttService.getContractGanttChart('contract_001');

console.log(`工事名: ${ganttData.contract.projectName}`);
console.log(`全体進捗: ${ganttData.summary.overallProgress}%`);
console.log(`残日数: ${ganttData.summary.remainingDays}日`);
console.log(`遅延工程: ${ganttData.summary.delayedItems}件`);

// 工程一覧表示
for (const item of ganttData.scheduleItems) {
  console.log(`${item.name}: ${item.progress}% (${item.status})`);
}

// マイルストーン表示
for (const milestone of ganttData.milestones) {
  console.log(`マイルストーン: ${milestone.name} (${milestone.date})`);
}
```

#### 人別ガントチャート

```typescript
import { demoPersonGantt } from 'construction-lark';

// 人別ガントチャート取得
const personGantt = await ganttService.getPersonGanttChart('person_001');

console.log(`担当者: ${personGantt.person.name}`);
console.log(`稼働率: ${personGantt.workload.utilizationRate}%`);
console.log(`現在の担当: ${personGantt.workload.currentAssignments}件`);
console.log(`予定の担当: ${personGantt.workload.upcomingAssignments}件`);

// 担当工程一覧
for (const assignment of personGantt.assignments) {
  console.log(`工事: ${assignment.contractName}`);
  console.log(`工程: ${assignment.scheduleItem.name}`);
  console.log(`期間: ${assignment.period.start} 〜 ${assignment.period.end}`);
}

// 全員の人別ガントチャート取得（期間フィルタ付き）
const allPersonGantt = await ganttService.getAllPersonsGanttChart({
  dateRange: {
    start: '2025-01-01',
    end: '2025-03-31',
  },
});
```

#### 機材別ガントチャート

```typescript
import { demoEquipmentGantt } from 'construction-lark';

// 機材別ガントチャート取得
const equipmentGantt = await ganttService.getEquipmentGanttChart('equipment_001');

console.log(`機材名: ${equipmentGantt.equipment.name}`);
console.log(`保有数: ${equipmentGantt.availability.totalQuantity}`);
console.log(`使用中: ${equipmentGantt.availability.currentlyUsed}`);
console.log(`空き: ${equipmentGantt.availability.available}`);
console.log(`稼働率: ${equipmentGantt.availability.utilizationRate}%`);

// 割当状況一覧
for (const allocation of equipmentGantt.allocations) {
  console.log(`工事: ${allocation.contractName}`);
  console.log(`工程: ${allocation.scheduleItem.name}`);
  console.log(`期間: ${allocation.period.start} 〜 ${allocation.period.end}`);
  console.log(`数量: ${allocation.quantity}`);
}

// 全機材のガントチャート取得
const allEquipmentGantt = await ganttService.getAllEquipmentGanttChart();
```

#### 協力会社別ガントチャート

```typescript
// 協力会社別ガントチャート取得
const subcontractorGantt = await ganttService.getSubcontractorGanttChart('subcontractor_001');

console.log(`会社名: ${subcontractorGantt.subcontractor.companyName}`);
console.log(`現在のプロジェクト数: ${subcontractorGantt.capacity.currentProjects}`);
console.log(`評価スコア: ${subcontractorGantt.capacity.performanceScore}`);

// 担当工事一覧
for (const assignment of subcontractorGantt.assignments) {
  console.log(`工事: ${assignment.contractName}`);
  console.log(`工種: ${assignment.workType}`);
  console.log(`期間: ${assignment.period.start} 〜 ${assignment.period.end}`);
}
```

### Baseテーブル初期化

初めて使用する場合、Lark Base上にテーブルを自動作成できます：

```typescript
// テーブル構造を自動作成（初回のみ実行）
await constructionService.initializeConstructionBase();
```

このメソッドは以下のテーブルを作成します：
- 工事契約情報テーブル
- 資格者マスタテーブル
- 協力会社マスタテーブル
- 資機材マスタテーブル
- 工程マスタテーブル

## API リファレンス

### LarkClient

Lark Base APIとの通信を行うクライアント

| メソッド | 説明 | 戻り値 |
|---------|------|--------|
| `getAccessToken()` | テナントアクセストークンを取得 | `Promise<string>` |
| `listTables(appToken)` | Base内のテーブル一覧を取得 | `Promise<LarkApiResponse>` |
| `listRecords(appToken, tableId, options?)` | テーブルのレコード一覧を取得 | `Promise<LarkApiResponse>` |
| `getRecord(appToken, tableId, recordId)` | レコードを取得 | `Promise<LarkApiResponse>` |
| `createRecord(appToken, tableId, fields)` | レコードを作成 | `Promise<LarkApiResponse>` |
| `batchCreateRecords(appToken, tableId, records)` | 複数レコードを一括作成 | `Promise<LarkApiResponse>` |
| `updateRecord(appToken, tableId, recordId, fields)` | レコードを更新 | `Promise<LarkApiResponse>` |
| `deleteRecord(appToken, tableId, recordId)` | レコードを削除 | `Promise<LarkApiResponse>` |
| `createTable(appToken, name, fields)` | テーブルを作成 | `Promise<LarkApiResponse>` |

### ConstructionService

工事管理に関するサービス

| メソッド | 説明 | 戻り値 |
|---------|------|--------|
| `getContracts()` | 工事契約一覧を取得 | `Promise<ConstructionContract[]>` |
| `getContractById(id)` | 特定の工事契約を取得 | `Promise<ConstructionContract \| null>` |
| `createContract(contract)` | 新規工事契約を作成 | `Promise<ConstructionContract>` |
| `getQualifiedPersons()` | 資格者一覧を取得 | `Promise<QualifiedPerson[]>` |
| `getQualifiedPersonById(id)` | 特定の資格者を取得 | `Promise<QualifiedPerson \| null>` |
| `getQualifiedPersonsByQualification(category)` | 資格別に資格者を検索 | `Promise<QualifiedPerson[]>` |
| `getSubcontractors()` | 協力会社一覧を取得 | `Promise<Subcontractor[]>` |
| `getSubcontractorsBySpecialty(specialty)` | 専門分野別に協力会社を検索 | `Promise<Subcontractor[]>` |
| `getEquipment()` | 資機材一覧を取得 | `Promise<Equipment[]>` |
| `getAvailableEquipment()` | 使用可能な資機材のみ取得 | `Promise<Equipment[]>` |
| `getEquipmentByCategory(category)` | カテゴリ別に資機材を検索 | `Promise<Equipment[]>` |
| `getProcessMasters()` | 工程マスタ一覧を取得 | `Promise<ProcessMaster[]>` |
| `initializeConstructionBase()` | Baseテーブル構造を初期化 | `Promise<void>` |

### GanttService

ガントチャート生成に関するサービス

| メソッド | 説明 | 戻り値 |
|---------|------|--------|
| `getContractGanttChart(contractId)` | 工事別ガントチャート取得 | `Promise<GanttChartData>` |
| `getPersonGanttChart(personId)` | 人別ガントチャート取得 | `Promise<PersonGanttData>` |
| `getAllPersonsGanttChart(filter?)` | 全員の人別ガントチャート取得 | `Promise<PersonGanttData[]>` |
| `getEquipmentGanttChart(equipmentId)` | 機材別ガントチャート取得 | `Promise<EquipmentGanttData>` |
| `getAllEquipmentGanttChart(filter?)` | 全機材のガントチャート取得 | `Promise<EquipmentGanttData[]>` |
| `getSubcontractorGanttChart(subcontractorId)` | 協力会社別ガントチャート取得 | `Promise<SubcontractorGanttData>` |

### フィールドタイプ定数

```typescript
import { FIELD_TYPES } from 'construction-lark';

FIELD_TYPES.TEXT           // テキスト
FIELD_TYPES.NUMBER         // 数値
FIELD_TYPES.SELECT         // 単一選択
FIELD_TYPES.MULTI_SELECT   // 複数選択
FIELD_TYPES.DATE           // 日付
FIELD_TYPES.CHECKBOX       // チェックボックス
FIELD_TYPES.PERSON         // ユーザー
FIELD_TYPES.PHONE          // 電話番号
FIELD_TYPES.URL            // URL
FIELD_TYPES.ATTACHMENT     // 添付ファイル
FIELD_TYPES.LINK           // リンク（他テーブル参照）
FIELD_TYPES.FORMULA        // 数式
FIELD_TYPES.CREATED_TIME   // 作成日時
FIELD_TYPES.UPDATED_TIME   // 更新日時
FIELD_TYPES.CREATED_BY     // 作成者
FIELD_TYPES.UPDATED_BY     // 更新者
```

## テーブル構成図

### 工事管理Base

```
┌─────────────────────────────────────────────────────────────────┐
│                        工事契約情報テーブル                        │
├─────────────────────────────────────────────────────────────────┤
│ - 契約番号 (TEXT)                                                │
│ - 工事名 (TEXT)                                                  │
│ - 発注者名 (TEXT)                                                │
│ - 契約金額 (NUMBER)                                              │
│ - 契約日 / 着工日 / 竣工予定日 / 実際の竣工日 (DATE)              │
│ - 工事現場住所 (TEXT)                                            │
│ - ステータス (SELECT: 計画中/契約済/施工中/検査中/完了/中断)      │
│ - 備考 (TEXT)                                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        資格者マスタテーブル                        │
├─────────────────────────────────────────────────────────────────┤
│ - 社員番号 (TEXT)                                                │
│ - 氏名 (TEXT)                                                    │
│ - 所属部署 (TEXT)                                                │
│ - 保有資格 (MULTI_SELECT)                                        │
│   施工管理技士 / 建築士 / 測量士 / 安全管理者 / クレーン運転士    │
│ - 連絡先電話番号 (PHONE)                                         │
│ - メールアドレス (TEXT)                                          │
│ - 在籍フラグ (CHECKBOX)                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       協力会社マスタテーブル                       │
├─────────────────────────────────────────────────────────────────┤
│ - 会社コード (TEXT)                                              │
│ - 会社名 (TEXT)                                                  │
│ - 代表者名 (TEXT)                                                │
│ - 住所 (TEXT)                                                    │
│ - 電話番号 (PHONE) / FAX番号 / メールアドレス                    │
│ - 専門分野 (MULTI_SELECT)                                        │
│   とび / 型枠 / 鉄筋 / 土工 / 電気 / 設備 / 内装 / 外装          │
│ - 評価ランク (SELECT: A/B/C/D)                                   │
│ - 取引フラグ (CHECKBOX)                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        資機材マスタテーブル                        │
├─────────────────────────────────────────────────────────────────┤
│ - 資機材コード (TEXT)                                            │
│ - 名称 (TEXT)                                                    │
│ - 分類 (SELECT)                                                  │
│   重機 / 車両 / 足場材 / 型枠材 / 電動工具 / 測量機器 / 安全設備  │
│ - メーカー / 型番 (TEXT)                                         │
│ - 保有数量 (NUMBER) / 単位 (TEXT)                                │
│ - 日額単価 (NUMBER)                                              │
│ - 保管場所 (TEXT)                                                │
│ - 状態 (SELECT: 使用可能/使用中/整備中/故障/廃棄)                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        工程マスタテーブル                          │
├─────────────────────────────────────────────────────────────────┤
│ - 工程コード (TEXT)                                              │
│ - 工程名 (TEXT)                                                  │
│ - 工程分類 (SELECT)                                              │
│   準備工 / 土工 / 基礎工 / 躯体工 / 外装工 / 内装工 / 設備工      │
│ - 標準工期 (NUMBER)                                              │
│ - 必要資格 (MULTI_SELECT)                                        │
│ - 必要機材 (MULTI_SELECT)                                        │
│ - 説明 (TEXT)                                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 工程管理Base

```
┌─────────────────────────────────────────────────────────────────┐
│                       工程スケジュールテーブル                     │
├─────────────────────────────────────────────────────────────────┤
│ - 工事契約ID (LINK → 工事契約情報)                               │
│ - 工程マスタID (LINK → 工程マスタ)                               │
│ - 工程名 (TEXT)                                                  │
│ - 予定開始日 / 予定終了日 (DATE)                                 │
│ - 実績開始日 / 実績終了日 (DATE)                                 │
│ - 進捗率 (NUMBER: 0-100)                                         │
│ - ステータス (SELECT: 未着手/進行中/遅延/完了/保留)              │
│ - 担当者ID (LINK → 資格者マスタ, 複数)                           │
│ - 協力会社ID (LINK → 協力会社マスタ, 複数)                       │
│ - 使用機材ID (LINK → 資機材マスタ, 複数)                         │
│ - 先行工程ID / 後続工程ID (LINK, 複数)                           │
│ - 備考 (TEXT)                                                    │
│ - マイルストーン (CHECKBOX)                                      │
│ - クリティカルパス (CHECKBOX)                                    │
└─────────────────────────────────────────────────────────────────┘
```

### テーブル間のリレーション

```
工事契約情報 ─────┬──→ 工程スケジュール
                 │
資格者マスタ ─────┼──→ 工程スケジュール (担当者)
                 │
協力会社マスタ ───┼──→ 工程スケジュール (協力会社)
                 │
資機材マスタ ─────┼──→ 工程スケジュール (使用機材)
                 │
工程マスタ ───────┘
```

## 開発

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テスト実行
npm test

# 型チェック
npm run typecheck

# Lint
npm run lint
```

## ライセンス

MIT

## サポート

- Issue: [GitHub Issues](https://github.com/PLark-droid/construction-lark/issues)
- ドキュメント: [README.md](https://github.com/PLark-droid/construction-lark#readme)

---

2025 construction-lark - 建設業向けLark Base連携ライブラリ
