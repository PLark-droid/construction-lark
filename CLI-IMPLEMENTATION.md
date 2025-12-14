# CLI Implementation Summary

Construction Lark CLIツールの実装概要

## 作成ファイル

### 1. メインCLIエントリーポイント
**ファイル:** `/src/cli/index.ts`

- Commander.jsベースのCLIフレームワーク
- Shebang付き (`#!/usr/bin/env node`)
- 3つのコマンド（init, setup, demo）を提供
- カラフルなヘルプメッセージ

### 2. Init コマンド
**ファイル:** `/src/cli/commands/init.ts`

**機能:**
- Lark API認証情報の対話的入力（inquirer）
- 認証テスト（LarkClient使用）
- Base作成方法の選択（新規 or 既存）
- Base接続テスト
- .envファイルの自動生成

**使用ライブラリ:**
- inquirer - 対話的プロンプト
- ora - スピナー表示
- chalk - カラフルな出力

### 3. Setup コマンド
**ファイル:** `/src/cli/commands/setup.ts`

**機能:**
- .envファイルから環境変数読み込み
- 既存テーブルの確認
- 不足テーブルの自動作成
- テーブルIDの取得と.envへの保存

**作成テーブル:**
1. 工事契約情報
2. 資格者マスタ
3. 協力会社マスタ
4. 資機材マスタ
5. 工程マスタ
6. スケジュール

### 4. Demo コマンド
**ファイル:** `/src/cli/commands/demo.ts`

**機能:**
- サンプルデータの一括投入
- 資格者3件、協力会社3件、資機材4件、工程5件、工事2-3件
- --minimalオプションでデータ量調整

## package.json の変更

```json
{
  "bin": {
    "construction-lark": "./dist/cli/index.js"
  },
  "dependencies": {
    "@types/inquirer": "^9.0.9",
    "chalk": "^5.6.2",
    "commander": "^14.0.2",
    "inquirer": "^13.1.0",
    "ora": "^9.0.0"
  }
}
```

## ディレクトリ構造

```
src/
├── cli/
│   ├── index.ts           # メインCLIエントリーポイント
│   └── commands/
│       ├── index.ts       # コマンドのbarrel export
│       ├── init.ts        # 初期化コマンド
│       ├── setup.ts       # テーブル作成コマンド
│       └── demo.ts        # サンプルデータ投入コマンド
├── api/
│   └── lark-client.ts     # Lark API クライアント
├── services/
│   └── construction-service.ts
└── types/
    └── ...
```

## 使用方法

### インストール後

```bash
# グローバルインストール
npm install -g construction-lark
construction-lark init

# npxで実行
npx construction-lark init
npx construction-lark setup
npx construction-lark demo
```

### ローカル開発

```bash
# ビルド
npm run build

# 実行
node dist/cli/index.js init
```

## コマンドフロー

### 1. 初回セットアップ

```
npx construction-lark init
  ↓
対話的にApp ID/Secret入力
  ↓
認証テスト
  ↓
Base作成/選択
  ↓
.env ファイル生成
```

### 2. テーブル作成

```
npx construction-lark setup
  ↓
.env から認証情報読み込み
  ↓
既存テーブル確認
  ↓
不足テーブルを作成
  ↓
テーブルIDを.envに保存
```

### 3. サンプルデータ投入

```
npx construction-lark demo
  ↓
.env から全設定読み込み
  ↓
各テーブルにサンプルデータ投入
  ↓
完了メッセージ表示
```

## UI/UX の特徴

1. **カラフルな出力** - chalk使用
   - cyan: ヘッダー、重要情報
   - green: 成功メッセージ
   - yellow: 警告、次のステップ
   - red: エラーメッセージ
   - gray: 補足情報

2. **スピナー表示** - ora使用
   - 処理中の視覚的フィードバック
   - 成功/失敗の明確な表示

3. **対話的プロンプト** - inquirer使用
   - ユーザーフレンドリーな入力
   - 入力検証
   - 選択肢の提示

4. **進捗表示**
   - 各ステップの完了状態を表示
   - エラー発生時の詳細メッセージ

## エラーハンドリング

### 認証エラー
```typescript
try {
  await client.getAccessToken();
  authSpinner.succeed(chalk.green('✅ 認証成功'));
} catch (error) {
  authSpinner.fail(chalk.red('❌ 認証失敗'));
  console.error(chalk.red(`エラー: ${(error as Error).message}`));
  process.exit(1);
}
```

### 環境変数不足
```typescript
if (!appId || !appSecret || !appToken) {
  console.error(chalk.red('❌ 環境変数が不足しています'));
  console.log(chalk.yellow('先に init コマンドを実行してください'));
  process.exit(1);
}
```

## テスト可能性

各コマンドは独立した関数として実装されており、ユニットテスト可能:

```typescript
export async function initCommand(options: InitCommandOptions): Promise<void>
export async function setupCommand(options: SetupCommandOptions): Promise<void>
export async function demoCommand(options: DemoCommandOptions): Promise<void>
```

## 拡張性

新しいコマンド追加は簡単:

1. `/src/cli/commands/new-command.ts` を作成
2. コマンドロジックを実装
3. `/src/cli/index.ts` でコマンド登録

```typescript
program
  .command('new-command')
  .description('説明')
  .action(async (options) => {
    await newCommand(options);
  });
```

## 依存関係

### ランタイム依存
- commander: CLIフレームワーク
- chalk: カラフル出力
- inquirer: 対話的プロンプト
- ora: スピナー表示

### 開発依存
- @types/inquirer: TypeScript型定義
- typescript: TypeScriptコンパイラ
- tsx: 開発時実行

## ビルド成果物

```
dist/
├── cli/
│   ├── index.js          # 実行可能CLIファイル
│   ├── index.d.ts        # 型定義
│   ├── index.js.map      # ソースマップ
│   └── commands/
│       ├── init.js
│       ├── setup.js
│       ├── demo.js
│       └── ...
└── ...
```

## package.jsonのbinフィールド

```json
"bin": {
  "construction-lark": "./dist/cli/index.js"
}
```

npm installすると、`construction-lark`コマンドが自動的にPATHに追加されます。

## セキュリティ考慮事項

1. **環境変数の保護**
   - .envファイルは.gitignoreに追加必須
   - App Secretは password input で非表示

2. **入力検証**
   - 全てのユーザー入力を検証
   - 必須フィールドのチェック

3. **エラーメッセージ**
   - 機密情報を含まない
   - ユーザーフレンドリーな内容

## 今後の改善案

1. **進捗バー**
   - 大量データ投入時の詳細進捗表示

2. **設定ファイル**
   - .construction-lark.config.js でデフォルト設定

3. **テンプレート**
   - カスタムテーブル定義のテンプレート機能

4. **バックアップ/リストア**
   - Baseデータのエクスポート/インポート

5. **マイグレーション**
   - スキーマ変更の自動マイグレーション

---

## まとめ

Construction Lark CLIは、以下を提供します:

- 簡単なセットアップ（3コマンドで完了）
- 対話的で使いやすいUI/UX
- 堅牢なエラーハンドリング
- 拡張性の高いアーキテクチャ
- TypeScript完全対応

これにより、開発者はLark Base APIの複雑さを意識せず、
工事管理システムをすぐに使い始めることができます。
