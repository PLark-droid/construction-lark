/**
 * Lark Base自動セットアップ例
 *
 * このスクリプトは建設業向けLark Baseを自動作成します。
 *
 * 実行方法:
 * ```bash
 * LARK_APP_ID=xxx LARK_APP_SECRET=xxx tsx examples/setup-base.ts
 * ```
 */

import { LarkClient } from '../src/api/lark-client.js';
import { setupConstructionBase, generateEnvConfig } from '../src/setup/index.js';

async function main() {
  // 環境変数から認証情報を取得
  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;

  if (!appId || !appSecret) {
    console.error('Error: LARK_APP_ID and LARK_APP_SECRET must be set');
    process.exit(1);
  }

  // LarkClientを初期化
  const client = new LarkClient({
    appId,
    appSecret,
  });

  console.log('Building Construction Base Setup');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Baseをセットアップ（サンプルデータ付き）
    const result = await setupConstructionBase(client, {
      includeSampleData: true, // サンプルデータを投入
      customBaseName: '建設工事管理Base', // カスタム名（省略可）
    });

    console.log('');
    console.log('='.repeat(60));
    console.log('Setup Successful!');
    console.log('='.repeat(60));
    console.log('');

    // 環境変数設定を出力
    console.log('Environment Variables (add to .env):');
    console.log('');
    console.log(generateEnvConfig(result));
    console.log('');

    // 詳細情報を出力
    console.log('Details:');
    console.log(`  Base Name: ${result.baseName}`);
    console.log(`  Base URL: ${result.baseUrl}`);
    console.log(`  App Token: ${result.appToken}`);
    console.log(`  Created At: ${result.createdAt}`);
    console.log('');
    console.log('Tables:');

    result.tables.forEach((table) => {
      console.log(`  - ${table.tableName}`);
      console.log(`    Table ID: ${table.tableId}`);
      console.log(`    Records: ${table.recordCount}`);
    });

    console.log('');
    console.log(`Total Records: ${result.totalRecords}`);
    console.log('');
    console.log('Next Steps:');
    console.log('  1. Copy the environment variables to your .env file');
    console.log('  2. Open the Base URL in your browser');
    console.log('  3. Start using the construction management system!');
    console.log('');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
