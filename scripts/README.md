# Scripts - 自動化スクリプト集

Lark Base APIを使用した自動化スクリプトのディレクトリです。

---

## スクリプト一覧

### ダッシュボード系

| スクリプト | 説明 | 用途 |
|-----------|------|------|
| `process-dashboard.ts` | 工程管理ダッシュボード | 工程一覧・機材・人員・進捗の総合表示 |
| `equipment-dashboard.ts` | 機材ダッシュボード | 機材別の使用状況・ガントチャート・空き状況 |
| `equipment-availability.ts` | 機材空き状況チェッカー | 機材の配置状況と空き状況の詳細表示 |
| `weekly-report.ts` | 週次レポート生成 | 週次の進捗・安全・品質レポート |

### セットアップ系

| スクリプト | 説明 | 用途 |
|-----------|------|------|
| `full-construction-setup.ts` | フルセットアップ | Base作成から全テーブル作成まで自動化 |
| `setup-relations.ts` | 双方向リレーション設定（基本版） | 主要なDUPLEX_LINKリレーション構築 |
| `complete-relations-setup.ts` | **完全版リレーション設定** | **全17テーブル×32リレーション完全網羅** |
| `add-sample-data.ts` | サンプルデータ追加 | テスト用のサンプルデータを投入 |
| `create-dashboard-views.ts` | ダッシュボードビュー作成 | ビューとダッシュボードの自動作成 |

### 自動同期系

| スクリプト | 説明 | 用途 |
|-----------|------|------|
| `sync-progress.ts` | 進捗自動同期 | 小工程→中工程→大工程の進捗率を自動集計 |
| `auto-setup.ts` | 自動セットアップ | Base作成とテーブル作成の自動化 |

---

## クイックスタート

### 1. 工程管理ダッシュボードを表示

```bash
npx tsx scripts/process-dashboard.ts
```

統合ダッシュボードで以下を一画面表示：
- 工程一覧（ガントチャート形式）
- 機材使用状況
- 人員配置状況
- 進捗サマリー

### 2. 機材の空き状況をチェック

```bash
npx tsx scripts/equipment-availability.ts
```

機材別の詳細情報：
- 保有台数・使用中・空き台数
- 稼働率とステータス（🟢余裕/🟡残りわずか/🔴満杯/⚠️オーバー）
- 配置詳細（工程名・数量・期間）
- カテゴリー別統計

### 3. 週次レポートを生成

```bash
npx tsx scripts/weekly-report.ts
```

### 4. 機材ダッシュボードを表示

```bash
npx tsx scripts/equipment-dashboard.ts
```

機材別のダッシュボード：
- 機材別使用状況（保有数・使用中・空き・稼働率）
- ガントチャート形式での配置スケジュール
- 機材サマリー統計

### 5. 双方向リレーション設定

#### 基本版（9リレーション）
```bash
npx tsx scripts/setup-relations.ts
```

主要なテーブル間のリレーション設定：
- 工事契約 ↔ 大工程 ↔ 中工程 ↔ 小工程
- 小工程 ↔ 機材配置 ↔ 資機材マスタ
- 小工程 ↔ 人員配置 ↔ 資格者マスタ
- 小工程 ↔ 協力会社発注 ↔ 協力会社マスタ

#### 完全版（32リレーション）⭐ 推奨
```bash
npx tsx scripts/complete-relations-setup.ts
```

全17テーブル間の完全なリレーション網を構築：
- **案件・契約系**: 案件情報 ↔ 発注者マスタ ↔ 工事契約
- **工程階層**: 工事契約 → 大工程 → 中工程 → 小工程 → 工種マスタ
- **リソース管理**: 人員配置 ↔ 資格者マスタ、機材配置 ↔ 資機材マスタ
- **外注管理**: 協力会社発注 ↔ 協力会社マスタ
- **実績記録**: 作業日報（工程・工事・作業者・協力会社）
- **安全管理**: 安全パトロール、KY活動記録
- **品質管理**: 検査記録
- **横断管理**: 大工程・中工程レベルの日報集計

実行結果の詳細は `/docs/RELATIONS-SETUP-RESULT.md` を参照

### 6. 進捗を自動同期

```bash
npx tsx scripts/sync-progress.ts
```

小工程の進捗率を中工程・大工程に自動反映

---

## 環境変数

全てのスクリプトは `.env` ファイルから設定を読み込みます：

```bash
# .env
LARK_APP_ID=cli_xxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxx
LARK_BASE_APP_TOKEN=bascnxxxxxxxxxx
```

---

## 詳細ドキュメント

詳しい使い方は各ドキュメントを参照してください：

- [工程管理ダッシュボードスクリプト詳細](../docs/DASHBOARD-SCRIPTS.md)
- [自動化ガイド](../docs/AUTOMATION.md)

---

## トラブルシューティング

### エラー: 認証失敗

```bash
❌ エラーが発生しました: Error: 認証失敗
```

**対処法**: `.env` ファイルの認証情報を確認してください。

### エラー: テーブルが見つからない

```bash
⚠️ テーブル取得警告: table not found
```

**対処法**:
1. Lark Baseにテーブルが存在するか確認
2. テーブルIDが正しいか確認
3. Lark Appのアクセス権限を確認

---

## 定期実行

cronジョブとして定期実行する例：

```bash
# 毎日朝9時にダッシュボード表示
0 9 * * * cd /path/to/construction-lark && npx tsx scripts/process-dashboard.ts >> /var/log/lark-dashboard.log 2>&1

# 毎日夕方5時に進捗同期
0 17 * * * cd /path/to/construction-lark && npx tsx scripts/sync-progress.ts >> /var/log/lark-sync.log 2>&1

# 毎週月曜日に週次レポート
0 9 * * 1 cd /path/to/construction-lark && npx tsx scripts/weekly-report.ts >> /var/log/lark-weekly.log 2>&1
```

---

## カスタマイズ

スクリプトはTypeScriptで書かれているため、自由にカスタマイズ可能です。

### 例: フィルタリング条件の追加

```typescript
// 特定の工程のみ表示
const filteredProcesses = processes.filter(p => {
  return p.fields['ステータス'] === '進行中';
});
```

### 例: 出力形式の変更

```typescript
// JSON形式で出力
console.log(JSON.stringify(data, null, 2));
```

---

## 開発

新しいスクリプトを追加する場合：

1. `scripts/` ディレクトリに `.ts` ファイルを作成
2. shebangを追加: `#!/usr/bin/env npx tsx`
3. 環境変数の読み込み処理を追加
4. メイン処理を実装
5. 実行権限を付与: `chmod +x scripts/your-script.ts`

---

## ライセンス

MIT License
