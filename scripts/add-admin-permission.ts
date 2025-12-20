#!/usr/bin/env npx tsx
/**
 * Base管理者権限追加スクリプト
 */

import 'dotenv/config';

const APP_ID = process.env.LARK_APP_ID!;
const APP_SECRET = process.env.LARK_APP_SECRET!;
const BASE_URL = 'https://open.larksuite.com/open-apis';
const APP_TOKEN = 'AiHYbDdafaAfp8slmKsjk8kKpbh';

const TARGET_EMAIL = 'hiroki.matsui@sei-san-sei.com';
const TARGET_NAME = '松井大樹';

async function getAccessToken(): Promise<string> {
  const response = await fetch(`${BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
  });
  const data = await response.json();
  if (data.code !== 0) throw new Error(`Token取得失敗: ${data.msg}`);
  return data.tenant_access_token;
}

async function main() {
  console.log('🔐 Base管理者権限追加\n');
  console.log(`   対象: ${TARGET_NAME} (${TARGET_EMAIL})`);
  console.log(`   Base: シンプル建設業務管理 v2.0`);
  console.log('');

  const token = await getAccessToken();

  // メールアドレスを直接使用して権限を追加
  console.log('🔑 管理者権限を追加中...');
  const permResponse = await fetch(`${BASE_URL}/drive/v1/permissions/${APP_TOKEN}/members?type=bitable&need_notification=true`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      member_type: 'email',
      member_id: TARGET_EMAIL,
      perm: 'full_access',  // full_access = 管理者権限
    }),
  });

  const permData = await permResponse.json();

  if (permData.code === 0) {
    console.log('\n✅ 管理者権限を追加しました！');
    console.log(`   ユーザー: ${TARGET_NAME} (${TARGET_EMAIL})`);
    console.log('   権限: 管理者 (full_access)');
    console.log('\n   Base URL: https://sjpfkixxkhe8.jp.larksuite.com/base/AiHYbDdafaAfp8slmKsjk8kKpbh');
  } else {
    console.error('\n❌ 権限追加エラー:', permData.msg);
    console.log('   レスポンス:', JSON.stringify(permData, null, 2));

    // 代替案を提示
    console.log('\n📋 手動での追加方法:');
    console.log('   1. Base URL を開く: https://sjpfkixxkhe8.jp.larksuite.com/base/AiHYbDdafaAfp8slmKsjk8kKpbh');
    console.log('   2. 右上の「共有」ボタンをクリック');
    console.log(`   3. ${TARGET_EMAIL} を追加して「管理者」権限を付与`);
  }
}

main().catch(console.error);
