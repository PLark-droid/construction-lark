/**
 * Example: 工事進捗ダッシュボード作成
 * 工事別の進捗状況と工程管理を可視化するダッシュボードを作成
 */

import { config } from 'dotenv';
import { LarkClient } from '../src/api/lark-client.js';
import { DashboardService } from '../src/services/dashboard-service.js';
import { createConstructionProgressDashboard } from '../src/services/dashboard-templates.js';

// 環境変数を読み込み
config();

async function main() {
  // 環境変数から認証情報を取得
  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;
  const appToken = process.env.LARK_BASE_APP_TOKEN;

  if (!appId || !appSecret || !appToken) {
    throw new Error('環境変数を設定してください: LARK_APP_ID, LARK_APP_SECRET, LARK_BASE_APP_TOKEN');
  }

  // テーブルID
  const contractsTableId = process.env.LARK_TABLE_CONTRACTS;
  const schedulesTableId = process.env.LARK_TABLE_SCHEDULES;

  if (!contractsTableId || !schedulesTableId) {
    throw new Error('環境変数を設定してください: LARK_TABLE_CONTRACTS, LARK_TABLE_SCHEDULES');
  }

  // Larkクライアントを初期化
  const client = new LarkClient({ appId, appSecret });
  const dashboardService = new DashboardService(client, appToken);

  console.log('工事進捗ダッシュボードを作成中...\n');

  // ダッシュボードテンプレートを作成
  const template = createConstructionProgressDashboard({
    contracts: contractsTableId,
    schedules: schedulesTableId,
  });

  console.log(`ダッシュボード名: ${template.name}`);
  console.log(`説明: ${template.description}`);
  console.log(`ブロック数: ${template.blocks.length}\n`);

  // ダッシュボードを作成
  const result = await dashboardService.createDashboardFromTemplate(template);

  console.log('✓ ダッシュボード作成完了!');
  console.log(`Dashboard ID: ${result.dashboardId}`);
  console.log(`作成されたブロック: ${result.blockIds.length}個\n`);

  // ブロック詳細
  console.log('作成されたブロック:');
  template.blocks.forEach((block, index) => {
    console.log(`  ${index + 1}. ${block.name} (${block.type})`);
  });

  console.log(`\nLark Baseでダッシュボードを確認してください:`);
  console.log(`https://xxx.larksuite.com/base/${appToken}/dashboard/${result.dashboardId}`);
}

main().catch((error) => {
  console.error('エラー:', error);
  process.exit(1);
});
