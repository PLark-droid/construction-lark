# Construction Lark CLI - 使用ガイド

建設業向けLark Base連携のためのコマンドラインツール

## インストール

```bash
npm install construction-lark
# または
npx construction-lark init
```

## コマンド一覧

### 1. init - 初期化

対話的にLark認証とBase作成を行います。

```bash
npx construction-lark init
```

**実行内容:**
1. Lark API認証情報（App ID, App Secret）の入力
2. 認証テスト
3. Base作成方法の選択（新規作成 or 既存使用）
4. Base接続テスト
5. `.env`ファイルの自動生成

**オプション:**
- `--skip-env` - .envファイルの作成をスキップ

**作成される.envファイル:**
```env
LARK_APP_ID=cli_xxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxx
LARK_BASE_APP_TOKEN=bascnxxxxxxxxx
LARK_TABLE_CONTRACTS=
LARK_TABLE_QUALIFIED_PERSONS=
LARK_TABLE_SUBCONTRACTORS=
LARK_TABLE_EQUIPMENT=
LARK_TABLE_PROCESS_MASTER=
LARK_TABLE_SCHEDULES=
```

---

### 2. setup - テーブル自動作成

工事管理Baseに必要なテーブルを自動作成します。

```bash
npx construction-lark setup
```

**作成されるテーブル:**
1. 工事契約情報
2. 資格者マスタ
3. 協力会社マスタ
4. 資機材マスタ
5. 工程マスタ
6. スケジュール

**オプション:**
- `-f, --force` - 既存テーブルがある場合でも強制的に再作成

**実行内容:**
1. 既存テーブルの確認
2. 不足しているテーブルの作成
3. テーブルIDの自動取得
4. `.env`ファイルへのテーブルID保存

**実行例:**
```bash
# 通常実行（不足しているテーブルのみ作成）
npx construction-lark setup

# 強制再作成
npx construction-lark setup --force
```

---

### 3. demo - サンプルデータ投入

各テーブルにサンプルデータを投入します。

```bash
npx construction-lark demo
```

**投入されるデータ:**

#### 資格者マスタ（3件）
- 山田太郎（施工管理技士、安全管理者）
- 佐藤花子（建築士、測量士）
- 鈴木一郎（クレーン運転士、溶接技能者）

#### 協力会社マスタ（3件）
- 株式会社東建工務店（とび、型枠、鉄筋）
- 有限会社西電設（電気）
- 南設備工業（設備）

#### 資機材マスタ（4件）
- バックホウ 0.45m³
- ダンプトラック 10t
- 鋼製足場
- トータルステーション

#### 工程マスタ（5件）
- 仮設工事
- 掘削工事
- 基礎配筋工事
- 基礎コンクリート打設
- 躯体工事

#### 工事契約情報（2-3件）
- 〇〇ビル新築工事
- △△マンション改修工事
- □□工場増築工事（--minimalオプション無しの場合）

**オプション:**
- `-m, --minimal` - 最小限のサンプルデータのみ投入

**実行例:**
```bash
# 全サンプルデータを投入
npx construction-lark demo

# 最小限のサンプルデータのみ
npx construction-lark demo --minimal
```

---

## 初期セットアップの流れ

### ステップ1: Lark Developer Consoleでアプリ作成

1. [Lark Developer Console](https://open.larksuite.com/app) にアクセス
2. 「アプリを作成」をクリック
3. アプリ名を「工事管理システム」などに設定
4. App ID と App Secret をコピー

### ステップ2: CLIで初期化

```bash
npx construction-lark init
```

対話形式で以下を入力:
- App ID
- App Secret
- Base作成方法を選択

### ステップ3: テーブル作成

```bash
npx construction-lark setup
```

6つのテーブルが自動作成され、`.env`ファイルにテーブルIDが保存されます。

### ステップ4: サンプルデータ投入

```bash
npx construction-lark demo
```

各テーブルにサンプルデータが投入されます。

### ステップ5: 確認

Larkを開いて、作成されたBaseとデータを確認してください。

---

## トラブルシューティング

### 認証エラー

```
❌ 認証失敗
```

**原因:**
- App ID または App Secret が間違っている
- アプリが削除または無効化されている

**解決策:**
- Lark Developer Consoleで認証情報を確認
- `npx construction-lark init` を再実行

### Base接続エラー

```
❌ Base接続失敗
```

**原因:**
- App Token が間違っている
- Baseが削除されている
- アプリにBase権限が付与されていない

**解決策:**
- BaseのAPI設定でApp Tokenを確認
- Developer ConsoleでBase権限を確認
- `npx construction-lark init` を再実行

### テーブル作成エラー

```
❌ テーブル作成失敗
```

**原因:**
- Base作成権限がない
- 既存のテーブル名と重複している

**解決策:**
- Developer Consoleでテーブル作成権限を確認
- `--force` オプションで強制再作成

### .envファイルが見つからない

```
❌ .envファイルが見つかりません
```

**原因:**
- `init` コマンドを実行していない
- カレントディレクトリが間違っている

**解決策:**
- プロジェクトルートで `npx construction-lark init` を実行
- 正しいディレクトリに移動

---

## 次のステップ

CLIでセットアップが完了したら、TypeScript/JavaScriptからAPIを使用できます。

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

// 工事一覧を取得
const contracts = await system.constructionService.getContracts();
console.log(contracts);

// ガントチャートを取得
const gantt = await system.ganttService.getContractGanttChart('contract_id');
console.log(gantt);
```

詳細は [README.md](./README.md) を参照してください。

---

## ヘルプ

```bash
npx construction-lark --help
npx construction-lark init --help
npx construction-lark setup --help
npx construction-lark demo --help
```

## バージョン確認

```bash
npx construction-lark --version
```

## 開発

```bash
# ソースから実行（開発時）
npm run dev

# TypeScriptでビルド
npm run build

# ビルド後のCLIを実行
node dist/cli/index.js
```

---

## サポート

- GitHub Issues: https://github.com/PLark-droid/construction-lark/issues
- Documentation: https://github.com/PLark-droid/construction-lark#readme
