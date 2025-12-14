/**
 * ビュー作成の使用例
 *
 * このファイルは、ViewCreatorを使ってビューを作成する方法を示します。
 */

import { LarkClient, VIEW_TYPES } from '../src/api/lark-client.js';
import { ViewCreator } from '../src/setup/view-creator.js';

async function main() {
  // LarkClientを初期化
  const client = new LarkClient({
    appId: process.env.LARK_APP_ID!,
    appSecret: process.env.LARK_APP_SECRET!,
  });

  const baseAppToken = process.env.LARK_BASE_APP_TOKEN!;
  const viewCreator = new ViewCreator(client);

  console.log('=== ビュー作成の例 ===\n');

  // 例1: 工事契約テーブルにビューを作成
  console.log('例1: 工事契約テーブルにビューを作成');
  const contractsTableId = 'tblzeXSOwQjTY5wt';

  const contractViews = await viewCreator.createConstructionContractViews(
    baseAppToken,
    contractsTableId
  );

  console.log(`作成完了: ${contractViews.length}個のビュー\n`);
  contractViews.forEach((view) => {
    console.log(`  - ${view.viewName} (${view.viewType})`);
  });

  // 例2: 個別のビューを作成
  console.log('\n例2: 個別のビューを作成');

  // カスタムビューを作成
  const customViewResponse = await client.createView(
    baseAppToken,
    contractsTableId,
    'カスタム進捗ビュー',
    VIEW_TYPES.KANBAN
  );

  if (customViewResponse.code === 0) {
    console.log(
      `カスタムビュー作成成功: ${customViewResponse.data.view_id}`
    );
  }

  // 例3: 複数テーブルに一括でビューを作成
  console.log('\n例3: 複数テーブルに一括でビューを作成');

  const tableIds = {
    contracts: 'tblzeXSOwQjTY5wt',
    largeProcess: 'tbln82ijUjFqUHEe',
    mediumProcess: 'tbl9s3ZtsNZzncSl',
    smallProcess: 'tblM4zC4WQJTzx8Q',
    personnelAssignment: 'tblLQbNfEB6Bbimr',
    equipmentAssignment: 'tblfV3nrS96l4W0M',
    qualifiedPersons: 'tblqnOY8S3kl2UWa',
    equipmentMaster: 'tblUpCKolVWGNVVl',
    safetyPatrol: 'tblncJrCIw6mWUJa',
  };

  const allResults = await viewCreator.createAllConstructionViews(
    baseAppToken,
    tableIds
  );

  console.log('\n=== 全体のサマリー ===');
  let totalViews = 0;
  for (const [tableName, views] of Object.entries(allResults)) {
    console.log(`${tableName}: ${views.length}個のビュー`);
    totalViews += views.length;
  }
  console.log(`合計: ${totalViews}個のビュー`);

  // 例4: ビューの存在確認
  console.log('\n例4: ビューの存在確認');

  const viewExists = await viewCreator.viewExists(
    baseAppToken,
    contractsTableId,
    '全工事一覧'
  );

  console.log(`「全工事一覧」ビューは存在する: ${viewExists}`);

  // 例5: ビュー一覧の取得
  console.log('\n例5: ビュー一覧の取得');

  const viewsResponse = await client.listViews(baseAppToken, contractsTableId);

  if (viewsResponse.code === 0) {
    console.log(`テーブル内のビュー数: ${viewsResponse.data.items.length}`);
    viewsResponse.data.items.forEach((view) => {
      console.log(`  - ${view.view_name} (${view.view_type})`);
    });
  }

  console.log('\n=== すべての例を実行しました ===');
}

// 使用例を実行
main().catch(console.error);
