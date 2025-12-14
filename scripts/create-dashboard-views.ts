#!/usr/bin/env npx tsx
/**
 * ダッシュボード用ビュー自動作成スクリプト
 * ISO9001品質管理に必要なビューを一括作成
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const envPath = join(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

const LARK_APP_ID = envVars.LARK_APP_ID;
const LARK_APP_SECRET = envVars.LARK_APP_SECRET;
const APP_TOKEN = envVars.LARK_BASE_APP_TOKEN;
const BASE_URL = 'https://open.larksuite.com/open-apis';

// テーブルID（最新の.envから取得）
const TABLES = {
  工事契約: 'tblzeXSOwQjTY5wt',
  大工程: 'tbln82ijUjFqUHEe',
  中工程: 'tbl9s3ZtsNZzncSl',
  小工程: 'tblM4zC4WQJTzx8Q',
  作業日報: 'tblN7noQWwpz1ZUh',
  安全パトロール: 'tblncJrCIw6mWUJa',
  検査記録: 'tbld5NUYtR5WuwJJ',
  実行予算: 'tblxfgQ49UUcfmWp',
  出来高管理: 'tblRKMeuTOGFEJEL',
};

async function getAccessToken(): Promise<string> {
  const response = await fetch(`${BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET }),
  });
  const data = await response.json() as { code: number; tenant_access_token?: string };
  if (data.code !== 0 || !data.tenant_access_token) throw new Error('認証失敗');
  return data.tenant_access_token;
}

async function createView(
  token: string,
  tableId: string,
  viewName: string,
  viewType: string = 'grid'
): Promise<string | null> {
  const response = await fetch(
    `${BASE_URL}/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/views`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ view_name: viewName, view_type: viewType }),
    }
  );
  const data = await response.json() as { code: number; data?: { view: { view_id: string } }; msg?: string };
  if (data.code !== 0) {
    console.log(`  ⚠️ ビュー作成スキップ（${viewName}）: ${data.msg}`);
    return null;
  }
  return data.data?.view?.view_id || null;
}

async function main() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  📊 ダッシュボードビュー自動作成');
  console.log('═'.repeat(60));
  console.log('\n');

  const token = await getAccessToken();
  console.log('✅ 認証成功\n');

  console.log('📋 ビュー作成中...\n');

  // 工事契約テーブルのビュー
  console.log('【工事契約】');
  await createView(token, TABLES.工事契約, '施工中の工事', 'grid');
  await createView(token, TABLES.工事契約, '完工済み', 'grid');
  await createView(token, TABLES.工事契約, 'カンバン', 'kanban');
  console.log('  ✅ 完了\n');

  // 工程管理テーブルのビュー
  console.log('【大工程】');
  await createView(token, TABLES.大工程, '進行中の工程', 'grid');
  await createView(token, TABLES.大工程, 'マイルストーン', 'grid');
  console.log('  ✅ 完了\n');

  console.log('【中工程】');
  await createView(token, TABLES.中工程, 'クリティカルパス', 'grid');
  await createView(token, TABLES.中工程, '今週の工程', 'grid');
  console.log('  ✅ 完了\n');

  console.log('【小工程】');
  await createView(token, TABLES.小工程, '今日の作業', 'grid');
  await createView(token, TABLES.小工程, '遅延工程', 'grid');
  await createView(token, TABLES.小工程, '今週の作業', 'grid');
  console.log('  ✅ 完了\n');

  // 日報・安全
  console.log('【作業日報】');
  await createView(token, TABLES.作業日報, '今週の日報', 'grid');
  await createView(token, TABLES.作業日報, 'カレンダー', 'grid');
  console.log('  ✅ 完了\n');

  console.log('【安全パトロール】');
  await createView(token, TABLES.安全パトロール, '要改善', 'grid');
  await createView(token, TABLES.安全パトロール, '今月のパトロール', 'grid');
  console.log('  ✅ 完了\n');

  // 品質・原価
  console.log('【検査記録】');
  await createView(token, TABLES.検査記録, '要是正', 'grid');
  await createView(token, TABLES.検査記録, '合格済み', 'grid');
  console.log('  ✅ 完了\n');

  console.log('【実行予算】');
  await createView(token, TABLES.実行予算, '予算消化状況', 'grid');
  console.log('  ✅ 完了\n');

  console.log('【出来高管理】');
  await createView(token, TABLES.出来高管理, '今月の出来高', 'grid');
  console.log('  ✅ 完了\n');

  console.log('═'.repeat(60));
  console.log('  ✨ ダッシュボードビュー作成完了！');
  console.log('═'.repeat(60));
  console.log(`
📎 Base URL: ${envVars.LARK_BASE_URL}

作成されたビュー:
- 工事契約: 施工中の工事、完工済み、カンバン
- 大工程: 進行中の工程、マイルストーン
- 中工程: クリティカルパス、今週の工程
- 小工程: 今日の作業、遅延工程、今週の作業
- 作業日報: 今週の日報、カレンダー
- 安全パトロール: 要改善、今月のパトロール
- 検査記録: 要是正、合格済み
- 実行予算: 予算消化状況
- 出来高管理: 今月の出来高

ブラウザでBaseを開いて、各ビューのフィルター条件を設定してください！
`);
}

main().catch(console.error);
