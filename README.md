# Construction Lark - 建設業版Lark Base

> 使うだけでISO9001認証が取れる、シンプルな建設業向け品質管理システム

---

## 特徴

**毎日5分の入力で、ISO9001認証に必要な品質管理記録が自動的に蓄積されます。**

- 21テーブルの本格的な工事管理システム
- 3階層WBS（大工程→中工程→小工程）でガントチャート管理
- ISO9001:2015完全準拠のプロセス設計
- シンプルな操作で建設現場でも使いやすい

---

## クイックスタート

### 1. Baseを開く

**本番環境のBase**: https://sjpfkixxkhe8.jp.larksuite.com/base/PI7gbMT0FaQHXis3qmqjF1C4pyd

### 2. 毎日やること

**朝（3分）**: KY活動記録を入力
```
51_KY活動記録 → 新規 → 作業内容・危険・対策を入力
```

**夕方（2分）**: 作業日報を入力
```
40_作業日報 → 新規 → 進捗・人員・写真を入力
```

### 3. 週1回やること

**安全パトロール（10分）**
```
50_安全パトロール → 新規 → 評価項目をチェック
```

---

## テーブル構成（21テーブル）

| カテゴリ | テーブル | 用途 |
|---------|---------|------|
| **マスタ** | 01_発注者マスタ | 発注者情報 |
| | 02_資格者マスタ | 社員・資格情報 |
| | 03_協力会社マスタ | 協力会社情報 |
| | 04_資機材マスタ | 機材・設備 |
| | 05_工種マスタ | 工種の標準化 |
| **案件・契約** | 10_案件情報 | 受注前の案件追跡 |
| | 11_工事契約 | 契約情報 |
| **工程管理** | 20_大工程 | プロジェクト全体（ガントチャート） |
| | 21_中工程 | 工種別（ガントチャート） |
| | 22_小工程 | 日々の作業（ガントチャート） |
| **リソース** | 30_人員配置 | 人員配置管理 |
| | 31_機材配置 | 機材配置管理 |
| | 32_協力会社発注 | 外注管理 |
| **日報** | 40_作業日報 | 日次報告 |
| | 41_日報詳細 | 作業明細 |
| **安全** | 50_安全パトロール | 現場点検 |
| | 51_KY活動記録 | 危険予知活動 |
| | 52_事故災害記録 | 事故記録 |
| **品質** | 60_検査記録 | 品質検査 |
| **原価** | 70_実行予算 | 予算管理 |
| | 71_出来高管理 | 出来高追跡 |

---

## ドキュメント

| ドキュメント | 内容 | 対象者 |
|-------------|------|--------|
| [ISO9001準拠ガイド](docs/ISO9001-GUIDE.md) | ISO9001認証に向けた使い方 | 管理者・所長 |
| [クイックスタート](docs/QUICKSTART.md) | 10分で使い始める | 全員 |
| [日常業務マニュアル](docs/DAILY-OPERATION.md) | 現場担当者向け操作ガイド | 現場担当者 |
| [自動化ガイド](docs/AUTOMATION.md) | 通知・レポートの自動化 | 管理者 |
| [ダッシュボード設定](docs/DASHBOARD.md) | ビューとダッシュボードの設定 | 管理者 |
| [ビュー作成ガイド](docs/VIEW_CREATION_GUIDE.md) | 最適なビューの自動作成 | 管理者 |
| [ビュー設計ドキュメント](docs/view-design.md) | ビュータイプと活用方法 | 管理者 |

---

## ISO9001対応表

| ISO9001条項 | Lark Baseテーブル |
|------------|------------------|
| 6.1 リスク・機会 | 51_KY活動記録 / 52_事故災害記録 |
| 7.1 資源 | 02_資格者マスタ / 04_資機材マスタ |
| 7.2 力量 | 02_資格者マスタ（保有資格） |
| 8.1 運用の計画 | 20〜22_工程管理 |
| 8.5 製造・サービス | 40_作業日報 |
| 8.6 製品の検証 | 60_検査記録 |
| 9.2 内部監査 | 50_安全パトロール |
| 10.2 不適合・是正 | 60_検査記録（要手直し→是正） |

---

## 双方向リレーション設計

テーブル間は双方向リンク（DUPLEX_LINK）で連携されており、データの整合性を確保しています。

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  工事契約   │────→│   大工程    │────→│   中工程    │────→│   小工程    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                  │
                   ┌─────────────┐                               │
                   │ 資機材マスタ │←────────┐                    │
                   └─────────────┘         │                    │
                                          ┌┴────────────┐       │
                   ┌─────────────┐        │  機材配置   │←──────┤
                   │ 資格者マスタ │←──┐   └─────────────┘       │
                   └─────────────┘   │                         │
                                    ┌┴────────────┐            │
                                    │  人員配置   │←───────────┘
                                    └─────────────┘
```

---

## 自動化スクリプト

```bash
# 工程管理ダッシュボード（工程一覧・機材・人員・進捗サマリー）
npx tsx scripts/process-dashboard.ts

# 機材空き状況ダッシュボード（ガントチャート形式）
npx tsx scripts/equipment-dashboard.ts

# 機材空き状況チェッカー
npx tsx scripts/equipment-availability.ts

# 双方向リレーション設定（初回セットアップ時）
npx tsx scripts/setup-relations.ts

# 週次レポート生成
npx tsx scripts/weekly-report.ts

# 進捗自動同期
npx tsx scripts/sync-progress.ts

# ダッシュボードビュー作成
npx tsx scripts/create-dashboard-views.ts

# サンプルデータ追加
npx tsx scripts/add-sample-data.ts

# フルセットアップ（Base作成から全テーブル作成まで）
npx tsx scripts/full-construction-setup.ts

# 完全版リレーション設定（全17テーブル×32リレーション）⭐ 推奨
npx tsx scripts/complete-relations-setup.ts
```

詳細設計と実行結果:
- [完全版リレーション設計書](/docs/COMPLETE-RELATIONS-DESIGN.md)
- [実行結果レポート](/docs/RELATIONS-SETUP-RESULT.md)

---

## 開発者向け情報

### インストール

```bash
npm install construction-lark
```

### 基本的な使用

```typescript
import { LarkClient, ConstructionService, GanttService } from 'construction-lark';

const client = new LarkClient({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!,
});

// 工事契約一覧取得
const contracts = await constructionService.getContracts();

// ガントチャート取得
const gantt = await ganttService.getContractGanttChart('contract_001');
```

### API リファレンス

詳細は [API.md](docs/API.md) を参照。

---

## 環境変数

```bash
# .env
LARK_APP_ID=cli_xxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxx
LARK_BASE_APP_TOKEN=bascnxxxxxxxxxx
```

---

## ライセンス

MIT License

---

## 参考資料

- [ISO9001:2015 品質マネジメントシステム](https://ninsho-partner.com/iso9001/column/iso9001_kennsetsu/)
- [建設業の品質管理](https://ninsho-partner.com/iso9001/column/construction-quality-management/)
- [Lark Base API](https://open.larksuite.com/document/server-docs/docs/bitable-v1/bitable-overview)

---

*Powered by Miyabi Agent - 全能力解放モード*
