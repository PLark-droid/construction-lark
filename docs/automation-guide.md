# 自動化設定ガイド

## 概要

このガイドでは、Lark建設業務管理パッケージの自動化機能について説明します。

---

## 自動化機能一覧

| 機能 | 説明 | 実行タイミング |
|------|------|--------------|
| 資格期限通知 | 30日/7日前にアラート | 毎日 |
| 遅延タスク通知 | 予定日超過を検出 | 毎日 |
| 進捗率自動計算 | 工程から案件進捗を更新 | リアルタイム/定期 |
| 日次レポート | KPIサマリーを送信 | 毎朝 |

---

## 1. 資格期限通知

### スクリプト

```bash
npx tsx scripts/check-expiring-qualifications.ts
```

### 動作
1. 資格記録テーブルから有効期限を取得
2. 30日以内に期限切れのものを抽出
3. Larkチャットに通知を送信

### 通知例

```
⚠️ 資格期限アラート

以下の資格が期限切れ間近です：

🔴 7日以内
- 山田太郎: 酸欠作業主任者 (12/25期限)

🟡 30日以内
- 佐藤花子: フルハーネス特別教育 (1/15期限)
- 鈴木一郎: 玉掛け技能講習 (1/20期限)
```

### 定期実行設定（GitHub Actions）

`.github/workflows/daily-check.yml`:

```yaml
name: Daily Qualification Check

on:
  schedule:
    - cron: '0 0 * * *'  # 毎日 09:00 JST

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx tsx scripts/check-expiring-qualifications.ts
        env:
          LARK_APP_ID: ${{ secrets.LARK_APP_ID }}
          LARK_APP_SECRET: ${{ secrets.LARK_APP_SECRET }}
          LARK_WEBHOOK_URL: ${{ secrets.LARK_WEBHOOK_URL }}
```

---

## 2. 遅延タスク通知

### スクリプト

```bash
npx tsx scripts/check-delayed-tasks.ts
```

### 動作
1. 工程管理テーブルから未完了タスクを取得
2. 終了予定日が過去のものを抽出
3. 遅延日数を計算
4. Larkチャットに通知

### 通知例

```
🚨 遅延タスクアラート

以下の工程が遅延しています：

【東京ビル新築工事】
- 基礎工事: 3日遅延 (担当: 山田)
- 鉄骨建方: 1日遅延 (担当: 佐藤)

【大阪倉庫改修工事】
- 電気設備: 5日遅延 (担当: 田中)
```

---

## 3. 進捗率自動計算

### スクリプト

```bash
npx tsx scripts/update-project-progress.ts
```

### 動作
1. 全案件を取得
2. 各案件の工程を取得
3. 工程の進捗率平均を計算
4. 案件の進捗率を更新

### 計算ロジック

```
案件進捗率 = Σ(工程進捗率) / 工程数
```

例:
```
工程1: 100% (完了)
工程2: 50%  (進行中)
工程3: 0%   (未着手)

案件進捗率 = (100 + 50 + 0) / 3 = 50%
```

---

## 4. 日次レポート

### スクリプト

```bash
npx tsx scripts/send-daily-report.ts
```

### レポート内容

```
📊 日次レポート (2024/12/20)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 KPI サマリー
  進行中案件: 5件
  今月完了: 2件
  在籍従業員: 15名

⚠️ アラート
  期限切れ間近資格: 3件
  遅延タスク: 2件

📋 本日の予定
  着工予定: 1件
  竣工予定: 0件

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

詳細: https://sjpfkixxkhe8.jp.larksuite.com/base/...
```

---

## 5. Lark Webhook設定

### Webhook URLの取得

1. Larkグループチャットを開く
2. 右上の「...」→「ボット」→「ボットを追加」
3. 「カスタムボット」を選択
4. 名前を設定（例: 建設管理Bot）
5. Webhook URLをコピー

### 環境変数設定

`.env`:
```bash
LARK_WEBHOOK_URL=https://open.larksuite.com/open-apis/bot/v2/hook/xxxxxxxxx
```

### Webhook送信コード例

```typescript
async function sendLarkNotification(message: string) {
  const webhookUrl = process.env.LARK_WEBHOOK_URL;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      msg_type: 'text',
      content: { text: message }
    })
  });
}
```

---

## 6. 自動化スクリプト実行方法

### ローカル実行

```bash
# 資格期限チェック
npx tsx scripts/check-expiring-qualifications.ts

# 遅延タスクチェック
npx tsx scripts/check-delayed-tasks.ts

# 進捗率更新
npx tsx scripts/update-project-progress.ts

# 日次レポート
npx tsx scripts/send-daily-report.ts
```

### 全自動化（cron）

macOS/Linuxの場合:

```bash
# crontabを編集
crontab -e

# 毎朝9時に資格チェック
0 9 * * * cd /path/to/construction-lark && npx tsx scripts/check-expiring-qualifications.ts

# 毎朝9時に遅延チェック
5 9 * * * cd /path/to/construction-lark && npx tsx scripts/check-delayed-tasks.ts

# 毎日12時に進捗更新
0 12 * * * cd /path/to/construction-lark && npx tsx scripts/update-project-progress.ts

# 毎朝8時に日次レポート
0 8 * * * cd /path/to/construction-lark && npx tsx scripts/send-daily-report.ts
```

---

## 7. トラブルシューティング

### スクリプトが動かない

```bash
# 依存関係を再インストール
npm ci

# 環境変数を確認
cat .env

# TypeScriptエラーを確認
npx tsc --noEmit
```

### 通知が届かない

1. Webhook URLが正しいか確認
2. ボットがグループに追加されているか確認
3. ネットワーク接続を確認

### APIエラーが出る

```bash
# トークンをリフレッシュ
# （スクリプト内で自動処理されるため、通常は不要）

# API制限を確認
# Lark APIは1分間に100リクエストまで
```

---

## 8. カスタマイズ

### 通知の閾値を変更

`scripts/check-expiring-qualifications.ts`:
```typescript
// 30日前 → 60日前に変更
const expiringQualifications = await service.getExpiringQualifications(60);
```

### 通知先を変更

複数のWebhook URLに送信:
```typescript
const WEBHOOK_URLS = [
  process.env.LARK_WEBHOOK_MANAGERS,  // 管理者グループ
  process.env.LARK_WEBHOOK_SAFETY,    // 安全管理グループ
];

for (const url of WEBHOOK_URLS) {
  await sendNotification(url, message);
}
```

---

## 次のステップ

- [フィールド設計書](./field-design.md) - 数式・Lookup設定の詳細
- [ユーザーマニュアル](./user-manual.md) - 基本操作の説明
