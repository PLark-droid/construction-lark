#!/usr/bin/env tsx
/**
 * インタラクティブ ビュー作成スクリプト
 *
 * 対話形式でビューを作成します。
 *
 * 使用方法:
 * ```bash
 * tsx scripts/interactive-create-views.ts
 * ```
 */

import { LarkClient } from '../src/api/lark-client.js';
import { ViewCreator } from '../src/setup/view-creator.js';
import { TableCreator } from '../src/setup/table-creator.js';

/**
 * メイン処理
 */
async function main() {
  console.log('========================================');
  console.log('  建設業向けLark Base ビュー作成');
  console.log('  (インタラクティブモード)');
  console.log('========================================\n');

  // 環境変数から設定を読み込む
  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;
  const baseAppToken = process.env.LARK_BASE_APP_TOKEN;

  if (!appId || !appSecret) {
    console.error('Error: LARK_APP_ID と LARK_APP_SECRET を環境変数に設定してください');
    process.exit(1);
  }

  if (!baseAppToken) {
    console.error('Error: LARK_BASE_APP_TOKEN を環境変数に設定してください');
    process.exit(1);
  }

  // LarkClientを初期化
  const client = new LarkClient({
    appId,
    appSecret,
  });

  console.log('Base App Token:', baseAppToken);
  console.log('');

  // テーブル一覧を取得
  console.log('テーブル一覧を取得中...');
  const tableCreator = new TableCreator(client);
  const tables = await tableCreator.listTables(baseAppToken);

  console.log(`\n見つかったテーブル: ${tables.length}個\n`);
  tables.forEach((table, index) => {
    console.log(`  ${index + 1}. ${table.tableName} (${table.tableId})`);
  });

  // テーブル名からテーブルIDを特定
  const tableMapping: Record<string, string> = {};
  const tableNameMap: Record<string, string> = {
    工事契約: 'contracts',
    工事契約情報: 'contracts',
    大工程: 'largeProcess',
    中工程: 'mediumProcess',
    小工程: 'smallProcess',
    人員配置: 'personnelAssignment',
    機材配置: 'equipmentAssignment',
    資格者マスタ: 'qualifiedPersons',
    資機材マスタ: 'equipmentMaster',
    安全パトロール: 'safetyPatrol',
    KY活動記録: 'kyActivity',
    KY活動: 'kyActivity',
    作業日報: 'workDailyReport',
  };

  for (const table of tables) {
    const key = tableNameMap[table.tableName];
    if (key) {
      tableMapping[key] = table.tableId;
    }
  }

  console.log(`\n対応するテーブル: ${Object.keys(tableMapping).length}個`);
  console.log('');

  // ViewCreatorを初期化
  const viewCreator = new ViewCreator(client);

  // ビューを作成
  console.log('ビューの作成を開始します...\n');

  const results = await viewCreator.createAllConstructionViews(baseAppToken, tableMapping);

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
    if (views.length === 0) continue;

    console.log(`\n【${tableName}】`);
    views.forEach((view, index) => {
      console.log(`  ${index + 1}. ${view.viewName} (${view.viewType})`);
    });
  }

  console.log('\n✓ すべてのビュー作成が完了しました！');
  console.log('\nLark Baseにアクセスして、作成されたビューを確認してください。');
}

// スクリプト実行
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
