#!/usr/bin/env tsx
/**
 * Lark Base ビュー作成スクリプト
 *
 * 建設業向けLark Baseに最適なビューを自動作成します。
 *
 * 使用方法:
 * ```bash
 * # 環境変数を設定
 * export LARK_APP_ID="your_app_id"
 * export LARK_APP_SECRET="your_app_secret"
 * export LARK_BASE_APP_TOKEN="your_base_app_token"
 *
 * # テーブルIDを設定（必要に応じて）
 * export LARK_TABLE_CONTRACTS="tblzeXSOwQjTY5wt"
 * export LARK_TABLE_LARGE_PROCESS="tbln82ijUjFqUHEe"
 * export LARK_TABLE_MEDIUM_PROCESS="tbl9s3ZtsNZzncSl"
 * export LARK_TABLE_SMALL_PROCESS="tblM4zC4WQJTzx8Q"
 * export LARK_TABLE_PERSONNEL="tblLQbNfEB6Bbimr"
 * export LARK_TABLE_EQUIPMENT_ASSIGN="tblfV3nrS96l4W0M"
 * export LARK_TABLE_QUALIFIED="tblqnOY8S3kl2UWa"
 * export LARK_TABLE_EQUIPMENT_MASTER="tblUpCKolVWGNVVl"
 * export LARK_TABLE_SAFETY="tblncJrCIw6mWUJa"
 *
 * # スクリプトを実行
 * tsx scripts/create-views.ts
 * ```
 */

import { LarkClient } from '../src/api/lark-client.js';
import { ViewCreator } from '../src/setup/view-creator.js';

interface EnvConfig {
  appId: string;
  appSecret: string;
  baseAppToken: string;
  tableIds: {
    contracts?: string;
    largeProcess?: string;
    mediumProcess?: string;
    smallProcess?: string;
    personnelAssignment?: string;
    equipmentAssignment?: string;
    qualifiedPersons?: string;
    equipmentMaster?: string;
    safetyPatrol?: string;
    kyActivity?: string;
    workDailyReport?: string;
  };
}

/**
 * 環境変数から設定を読み込む
 */
function loadConfig(): EnvConfig {
  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;
  const baseAppToken = process.env.LARK_BASE_APP_TOKEN;

  if (!appId || !appSecret || !baseAppToken) {
    console.error('Error: 必須の環境変数が設定されていません');
    console.error('LARK_APP_ID, LARK_APP_SECRET, LARK_BASE_APP_TOKEN を設定してください');
    process.exit(1);
  }

  return {
    appId,
    appSecret,
    baseAppToken,
    tableIds: {
      contracts: process.env.LARK_TABLE_CONTRACTS,
      largeProcess: process.env.LARK_TABLE_LARGE_PROCESS,
      mediumProcess: process.env.LARK_TABLE_MEDIUM_PROCESS,
      smallProcess: process.env.LARK_TABLE_SMALL_PROCESS,
      personnelAssignment: process.env.LARK_TABLE_PERSONNEL,
      equipmentAssignment: process.env.LARK_TABLE_EQUIPMENT_ASSIGN,
      qualifiedPersons: process.env.LARK_TABLE_QUALIFIED,
      equipmentMaster: process.env.LARK_TABLE_EQUIPMENT_MASTER,
      safetyPatrol: process.env.LARK_TABLE_SAFETY,
      kyActivity: process.env.LARK_TABLE_KY,
      workDailyReport: process.env.LARK_TABLE_WORK_REPORT,
    },
  };
}

/**
 * メイン処理
 */
async function main() {
  console.log('========================================');
  console.log('  建設業向けLark Base ビュー作成');
  console.log('========================================\n');

  const config = loadConfig();

  // LarkClientを初期化
  const client = new LarkClient({
    appId: config.appId,
    appSecret: config.appSecret,
  });

  // ViewCreatorを初期化
  const viewCreator = new ViewCreator(client);

  console.log('Base App Token:', config.baseAppToken);
  console.log('');

  // テーブルIDを確認
  const tableCount = Object.values(config.tableIds).filter(Boolean).length;
  console.log(`設定されているテーブル数: ${tableCount}`);
  console.log('');

  if (tableCount === 0) {
    console.error('Error: テーブルIDが1つも設定されていません');
    console.error('環境変数でテーブルIDを設定してください');
    process.exit(1);
  }

  // ビューを作成
  try {
    const results = await viewCreator.createAllConstructionViews(
      config.baseAppToken,
      config.tableIds
    );

    // 結果サマリーを表示
    console.log('\n========================================');
    console.log('  ビュー作成完了');
    console.log('========================================\n');

    let totalViews = 0;
    for (const [tableName, views] of Object.entries(results)) {
      console.log(`${tableName}: ${views.length}個のビュー作成`);
      totalViews += views.length;
    }

    console.log('');
    console.log(`合計: ${totalViews}個のビューを作成しました`);
    console.log('');

    // 詳細表示
    console.log('========================================');
    console.log('  作成されたビュー一覧');
    console.log('========================================\n');

    for (const [tableName, views] of Object.entries(results)) {
      console.log(`\n【${tableName}】`);
      views.forEach((view, index) => {
        console.log(
          `  ${index + 1}. ${view.viewName} (${view.viewType}) - ID: ${view.viewId}`
        );
      });
    }

    console.log('\n✓ すべてのビュー作成が完了しました！');
  } catch (error) {
    console.error('\n✗ ビュー作成中にエラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
