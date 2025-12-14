# クイックスタートガイド

construction-larkを5分で始める方法

## 1. 環境設定

### 環境変数ファイルの作成

```bash
cp .env.example .env
```

### Lark認証情報の取得

1. [Lark開発者コンソール](https://open.larksuite.com/)にアクセス
2. 「Create App」をクリック
3. App IDとApp Secretをコピーして`.env`に貼り付け

```bash
LARK_APP_ID=cli_xxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxx
```

### Lark Baseの作成

1. Larkで新しいBaseを作成
2. BaseのURLを開き、`app_token`をコピー:
   ```
   https://example.larksuite.com/base/bascnXXXXXXXXXXXX
                                      ↑ この部分
   ```
3. `.env`に貼り付け:
   ```bash
   LARK_BASE_APP_TOKEN=bascnxxxxxxxxxx
   ```

### テーブルの自動作成（初回のみ）

```typescript
import { LarkClient } from 'construction-lark';
import { ConstructionService } from 'construction-lark';

const client = new LarkClient({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!,
});

const service = new ConstructionService({
  larkClient: client,
  appToken: process.env.LARK_BASE_APP_TOKEN!,
  tableIds: {
    contracts: '',
    qualifiedPersons: '',
    subcontractors: '',
    equipment: '',
    processMaster: '',
  },
});

// テーブル自動作成
await service.initializeConstructionBase();
```

### テーブルIDの取得

1. 作成されたテーブルを開く
2. URLから`table_id`をコピー:
   ```
   https://example.larksuite.com/base/bascnXXXX?table=tblYYYYYY
                                                      ↑ この部分
   ```
3. `.env`に貼り付け:
   ```bash
   LARK_TABLE_CONTRACTS=tblxxxxxxxxx
   LARK_TABLE_QUALIFIED_PERSONS=tblxxxxxxxxx
   LARK_TABLE_SUBCONTRACTORS=tblxxxxxxxxx
   LARK_TABLE_EQUIPMENT=tblxxxxxxxxx
   LARK_TABLE_PROCESS_MASTER=tblxxxxxxxxx
   LARK_TABLE_SCHEDULES=tblxxxxxxxxx
   ```

## 2. インストール

```bash
npm install
```

## 3. サンプル実行

### 基本的な使い方

```bash
npm run dev
```

または、サンプルスクリプトを実行:

```bash
npx tsx examples/basic-usage.ts
```

## 4. 最初のコードを書く

### 工事契約を作成

```typescript
import { initializeConstructionSystem } from 'construction-lark';

const system = await initializeConstructionSystem({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!,
  appToken: process.env.LARK_BASE_APP_TOKEN!,
  tableIds: {
    contracts: process.env.LARK_TABLE_CONTRACTS!,
    qualifiedPersons: process.env.LARK_TABLE_QUALIFIED_PERSONS!,
    subcontractors: process.env.LARK_TABLE_SUBCONTRACTORS!,
    equipment: process.env.LARK_TABLE_EQUIPMENT!,
    processMaster: process.env.LARK_TABLE_PROCESS_MASTER!,
    schedules: process.env.LARK_TABLE_SCHEDULES!,
  },
});

const { constructionService } = system;

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

console.log('工事契約を作成しました:', newContract.projectName);
```

### ガントチャートを取得

```typescript
const { ganttService } = system;

// 工事別ガントチャート取得
const ganttData = await ganttService.getContractGanttChart('contract_001');

console.log(`工事名: ${ganttData.contract.projectName}`);
console.log(`全体進捗: ${ganttData.summary.overallProgress}%`);
console.log(`残日数: ${ganttData.summary.remainingDays}日`);

// 工程一覧
for (const item of ganttData.scheduleItems) {
  console.log(`- ${item.name}: ${item.progress}%`);
}
```

## 5. よくある質問

### Q: テーブルIDが分からない

A: Lark BaseでテーブルのURLを確認してください:
```
https://example.larksuite.com/base/bascnXXXX?table=tblYYYYYY
                                                    ↑ これがテーブルID
```

### Q: アクセストークンエラーが出る

A: Larkアプリの権限設定を確認してください:
1. Lark開発者コンソールでアプリを開く
2. 「Permissions & Scopes」に移動
3. 以下のスコープを追加:
   - `bitable:app` (必須)
   - `bitable:app:readonly` (必須)

### Q: 既存のBaseを使いたい

A: `initializeConstructionBase()`をスキップして、既存のテーブルIDを`.env`に設定してください。

### Q: データが取得できない

A: 以下を確認してください:
1. `.env`ファイルが正しく設定されているか
2. Larkアプリに適切な権限があるか
3. テーブルIDが正しいか
4. Baseにデータが存在するか

## 6. 次のステップ

- [README.md](./README.md) - 詳細なドキュメント
- [API リファレンス](./README.md#api-リファレンス) - 全APIの説明
- [テーブル構成図](./README.md#テーブル構成図) - データベース設計

---

質問がある場合は、[GitHub Issues](https://github.com/PLark-droid/construction-lark/issues)で聞いてください。
