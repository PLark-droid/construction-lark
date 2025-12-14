#!/usr/bin/env npx tsx
/**
 * 完全自動セットアップスクリプト
 * Miyabi Agent による Lark Base 自動作成
 *
 * ユーザー操作不要で以下を自動実行:
 * 1. Lark認証
 * 2. Base作成
 * 3. 6テーブル作成
 * 4. サンプルデータ投入
 * 5. .env更新
 */

import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// 環境変数を読み込み
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

if (!LARK_APP_ID || !LARK_APP_SECRET) {
  console.error('❌ LARK_APP_ID/LARK_APP_SECRET が設定されていません');
  process.exit(1);
}

const BASE_URL = 'https://open.larksuite.com/open-apis';

// フィールドタイプ定数
const FIELD_TYPES = {
  TEXT: 1,
  NUMBER: 2,
  SELECT: 3,
  MULTI_SELECT: 4,
  DATE: 5,
  CHECKBOX: 7,
  PHONE: 11,
  URL: 15,
  CREATED_TIME: 1001,
  UPDATED_TIME: 1002,
};

/**
 * アクセストークン取得
 */
async function getAccessToken(): Promise<string> {
  console.log('🔑 アクセストークン取得中...');

  const response = await fetch(`${BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: LARK_APP_ID,
      app_secret: LARK_APP_SECRET,
    }),
  });

  const data = await response.json() as { code: number; msg: string; tenant_access_token?: string };

  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`認証失敗: ${data.msg}`);
  }

  console.log('✅ 認証成功');
  return data.tenant_access_token;
}

/**
 * Base作成
 */
async function createBase(token: string): Promise<{ appToken: string; url: string }> {
  console.log('📦 Lark Base作成中...');

  const response = await fetch(`${BASE_URL}/bitable/v1/apps`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: '建設工事管理Base',
    }),
  });

  const data = await response.json() as {
    code: number;
    msg: string;
    data?: { app: { app_token: string; url: string } };
  };

  if (data.code !== 0 || !data.data) {
    throw new Error(`Base作成失敗: ${data.msg}`);
  }

  console.log(`✅ Base作成完了: ${data.data.app.url}`);
  return { appToken: data.data.app.app_token, url: data.data.app.url };
}

/**
 * テーブル作成
 */
async function createTable(
  token: string,
  appToken: string,
  name: string,
  fields: Array<{ field_name: string; type: number; property?: unknown }>
): Promise<string> {
  console.log(`  📋 ${name} 作成中...`);

  const response = await fetch(`${BASE_URL}/bitable/v1/apps/${appToken}/tables`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      table: { name, fields },
    }),
  });

  const data = await response.json() as {
    code: number;
    msg: string;
    data?: { table_id: string };
  };

  if (data.code !== 0 || !data.data) {
    throw new Error(`テーブル作成失敗 (${name}): ${data.msg}`);
  }

  console.log(`  ✅ ${name}: ${data.data.table_id}`);
  return data.data.table_id;
}

/**
 * レコード一括作成
 */
async function batchCreateRecords(
  token: string,
  appToken: string,
  tableId: string,
  records: Array<{ fields: Record<string, unknown> }>
): Promise<number> {
  const response = await fetch(
    `${BASE_URL}/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records }),
    }
  );

  const data = await response.json() as {
    code: number;
    data?: { records: unknown[] };
  };

  return data.data?.records?.length || 0;
}

/**
 * 全テーブル作成
 */
async function createAllTables(token: string, appToken: string): Promise<Record<string, string>> {
  console.log('📊 テーブル作成中...');

  const tableIds: Record<string, string> = {};

  // 1. 工事契約情報
  tableIds.contracts = await createTable(token, appToken, '工事契約情報', [
    { field_name: '契約番号', type: FIELD_TYPES.TEXT },
    { field_name: '工事名', type: FIELD_TYPES.TEXT },
    { field_name: '発注者名', type: FIELD_TYPES.TEXT },
    { field_name: '契約金額', type: FIELD_TYPES.NUMBER },
    { field_name: '契約日', type: FIELD_TYPES.DATE },
    { field_name: '着工日', type: FIELD_TYPES.DATE },
    { field_name: '竣工予定日', type: FIELD_TYPES.DATE },
    { field_name: '工事現場住所', type: FIELD_TYPES.TEXT },
    { field_name: 'ステータス', type: FIELD_TYPES.SELECT, property: { options: [
      { name: '計画中' }, { name: '契約済' }, { name: '施工中' },
      { name: '検査中' }, { name: '完了' }, { name: '中断' }
    ]}},
    { field_name: '備考', type: FIELD_TYPES.TEXT },
  ]);

  // 2. 資格者マスタ
  tableIds.qualifiedPersons = await createTable(token, appToken, '資格者マスタ', [
    { field_name: '社員番号', type: FIELD_TYPES.TEXT },
    { field_name: '氏名', type: FIELD_TYPES.TEXT },
    { field_name: '所属部署', type: FIELD_TYPES.TEXT },
    { field_name: '保有資格', type: FIELD_TYPES.MULTI_SELECT, property: { options: [
      { name: '施工管理技士' }, { name: '建築士' }, { name: '測量士' },
      { name: '安全管理者' }, { name: 'クレーン運転士' }
    ]}},
    { field_name: '連絡先電話番号', type: FIELD_TYPES.PHONE },
    { field_name: 'メールアドレス', type: FIELD_TYPES.TEXT },
    { field_name: '在籍フラグ', type: FIELD_TYPES.CHECKBOX },
  ]);

  // 3. 協力会社マスタ
  tableIds.subcontractors = await createTable(token, appToken, '協力会社マスタ', [
    { field_name: '会社コード', type: FIELD_TYPES.TEXT },
    { field_name: '会社名', type: FIELD_TYPES.TEXT },
    { field_name: '代表者名', type: FIELD_TYPES.TEXT },
    { field_name: '住所', type: FIELD_TYPES.TEXT },
    { field_name: '電話番号', type: FIELD_TYPES.PHONE },
    { field_name: 'メールアドレス', type: FIELD_TYPES.TEXT },
    { field_name: '専門分野', type: FIELD_TYPES.MULTI_SELECT, property: { options: [
      { name: 'とび' }, { name: '型枠' }, { name: '鉄筋' }, { name: '電気' }, { name: '設備' }
    ]}},
    { field_name: '評価ランク', type: FIELD_TYPES.SELECT, property: { options: [
      { name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }
    ]}},
    { field_name: '取引フラグ', type: FIELD_TYPES.CHECKBOX },
  ]);

  // 4. 資機材マスタ
  tableIds.equipment = await createTable(token, appToken, '資機材マスタ', [
    { field_name: '資機材コード', type: FIELD_TYPES.TEXT },
    { field_name: '名称', type: FIELD_TYPES.TEXT },
    { field_name: '分類', type: FIELD_TYPES.SELECT, property: { options: [
      { name: '重機' }, { name: '車両' }, { name: '足場材' }, { name: '測量機器' }
    ]}},
    { field_name: 'メーカー', type: FIELD_TYPES.TEXT },
    { field_name: '型番', type: FIELD_TYPES.TEXT },
    { field_name: '保有数量', type: FIELD_TYPES.NUMBER },
    { field_name: '単位', type: FIELD_TYPES.TEXT },
    { field_name: '日額単価', type: FIELD_TYPES.NUMBER },
    { field_name: '保管場所', type: FIELD_TYPES.TEXT },
    { field_name: '状態', type: FIELD_TYPES.SELECT, property: { options: [
      { name: '使用可能' }, { name: '使用中' }, { name: '整備中' }, { name: '故障' }
    ]}},
  ]);

  // 5. 工程マスタ
  tableIds.processMaster = await createTable(token, appToken, '工程マスタ', [
    { field_name: '工程コード', type: FIELD_TYPES.TEXT },
    { field_name: '工程名', type: FIELD_TYPES.TEXT },
    { field_name: '工程分類', type: FIELD_TYPES.SELECT, property: { options: [
      { name: '準備工' }, { name: '土工' }, { name: '基礎工' }, { name: '躯体工' },
      { name: '外装工' }, { name: '内装工' }, { name: '設備工' }
    ]}},
    { field_name: '標準工期', type: FIELD_TYPES.NUMBER },
    { field_name: '説明', type: FIELD_TYPES.TEXT },
  ]);

  // 6. スケジュール
  tableIds.schedules = await createTable(token, appToken, 'スケジュール', [
    { field_name: '工事契約ID', type: FIELD_TYPES.TEXT },
    { field_name: '工程マスタID', type: FIELD_TYPES.TEXT },
    { field_name: '工程名', type: FIELD_TYPES.TEXT },
    { field_name: '予定開始日', type: FIELD_TYPES.DATE },
    { field_name: '予定終了日', type: FIELD_TYPES.DATE },
    { field_name: '進捗率', type: FIELD_TYPES.NUMBER },
    { field_name: 'ステータス', type: FIELD_TYPES.SELECT, property: { options: [
      { name: '未着手' }, { name: '進行中' }, { name: '遅延' }, { name: '完了' }
    ]}},
    { field_name: '担当者ID', type: FIELD_TYPES.TEXT },
    { field_name: '備考', type: FIELD_TYPES.TEXT },
    { field_name: 'マイルストーン', type: FIELD_TYPES.CHECKBOX },
  ]);

  console.log('✅ 全テーブル作成完了');
  return tableIds;
}

/**
 * サンプルデータ投入
 */
async function insertSampleData(
  token: string,
  appToken: string,
  tableIds: Record<string, string>
): Promise<void> {
  console.log('📝 サンプルデータ投入中...');

  // 工事契約情報
  let count = await batchCreateRecords(token, appToken, tableIds.contracts, [
    { fields: { '契約番号': 'CNT-2025-001', '工事名': '〇〇ビル新築工事', '発注者名': '株式会社〇〇開発', '契約金額': 500000000, 'ステータス': '施工中', '工事現場住所': '東京都千代田区丸の内1-1-1' }},
    { fields: { '契約番号': 'CNT-2025-002', '工事名': '△△マンション改修工事', '発注者名': '△△管理組合', '契約金額': 120000000, 'ステータス': '施工中', '工事現場住所': '東京都渋谷区渋谷2-2-2' }},
    { fields: { '契約番号': 'CNT-2025-003', '工事名': '□□工場増築工事', '発注者名': '□□製作所', '契約金額': 300000000, 'ステータス': '計画中', '工事現場住所': '神奈川県川崎市1-2-3' }},
  ]);
  console.log(`  ✅ 工事契約情報: ${count}件`);

  // 資格者マスタ
  count = await batchCreateRecords(token, appToken, tableIds.qualifiedPersons, [
    { fields: { '社員番号': 'EMP001', '氏名': '山田太郎', '所属部署': '施工部', '保有資格': ['施工管理技士', '安全管理者'], '在籍フラグ': true }},
    { fields: { '社員番号': 'EMP002', '氏名': '佐藤花子', '所属部署': '設計部', '保有資格': ['建築士', '測量士'], '在籍フラグ': true }},
    { fields: { '社員番号': 'EMP003', '氏名': '鈴木一郎', '所属部署': '施工部', '保有資格': ['クレーン運転士'], '在籍フラグ': true }},
  ]);
  console.log(`  ✅ 資格者マスタ: ${count}件`);

  // 協力会社マスタ
  count = await batchCreateRecords(token, appToken, tableIds.subcontractors, [
    { fields: { '会社コード': 'SUB001', '会社名': '株式会社東建工務店', '専門分野': ['とび', '型枠'], '評価ランク': 'A', '取引フラグ': true }},
    { fields: { '会社コード': 'SUB002', '会社名': '有限会社西電設', '専門分野': ['電気'], '評価ランク': 'A', '取引フラグ': true }},
    { fields: { '会社コード': 'SUB003', '会社名': '南設備工業', '専門分野': ['設備'], '評価ランク': 'B', '取引フラグ': true }},
  ]);
  console.log(`  ✅ 協力会社マスタ: ${count}件`);

  // 資機材マスタ
  count = await batchCreateRecords(token, appToken, tableIds.equipment, [
    { fields: { '資機材コード': 'EQ001', '名称': 'バックホウ 0.45m³', '分類': '重機', 'メーカー': 'コマツ', '保有数量': 3, '単位': '台', '日額単価': 25000, '状態': '使用可能' }},
    { fields: { '資機材コード': 'EQ002', '名称': 'ダンプトラック 10t', '分類': '車両', 'メーカー': '日野', '保有数量': 5, '単位': '台', '日額単価': 18000, '状態': '使用可能' }},
    { fields: { '資機材コード': 'EQ003', '名称': 'トータルステーション', '分類': '測量機器', 'メーカー': 'トプコン', '保有数量': 2, '単位': '台', '日額単価': 8000, '状態': '使用可能' }},
  ]);
  console.log(`  ✅ 資機材マスタ: ${count}件`);

  // 工程マスタ
  count = await batchCreateRecords(token, appToken, tableIds.processMaster, [
    { fields: { '工程コード': 'PR001', '工程名': '仮設工事', '工程分類': '準備工', '標準工期': 7, '説明': '現場事務所、仮設トイレ設置' }},
    { fields: { '工程コード': 'PR002', '工程名': '掘削工事', '工程分類': '土工', '標準工期': 14, '説明': '根切り、残土処理' }},
    { fields: { '工程コード': 'PR003', '工程名': '基礎配筋工事', '工程分類': '基礎工', '標準工期': 10, '説明': '基礎鉄筋組立' }},
    { fields: { '工程コード': 'PR004', '工程名': '躯体工事', '工程分類': '躯体工', '標準工期': 30, '説明': '柱・梁・スラブ' }},
    { fields: { '工程コード': 'PR005', '工程名': '内装工事', '工程分類': '内装工', '標準工期': 20, '説明': '内装仕上げ' }},
  ]);
  console.log(`  ✅ 工程マスタ: ${count}件`);

  // スケジュール
  count = await batchCreateRecords(token, appToken, tableIds.schedules, [
    { fields: { '工事契約ID': 'CNT-2025-001', '工程マスタID': 'PR001', '工程名': '仮設工事', '進捗率': 100, 'ステータス': '完了', 'マイルストーン': true }},
    { fields: { '工事契約ID': 'CNT-2025-001', '工程マスタID': 'PR002', '工程名': '掘削工事', '進捗率': 80, 'ステータス': '進行中' }},
    { fields: { '工事契約ID': 'CNT-2025-001', '工程マスタID': 'PR003', '工程名': '基礎配筋工事', '進捗率': 0, 'ステータス': '未着手' }},
  ]);
  console.log(`  ✅ スケジュール: ${count}件`);

  console.log('✅ サンプルデータ投入完了');
}

/**
 * .envファイル更新
 */
function updateEnvFile(appToken: string, tableIds: Record<string, string>): void {
  console.log('💾 .env更新中...');

  let content = readFileSync(envPath, 'utf-8');

  content = content.replace(/^LARK_BASE_APP_TOKEN=.*$/m, `LARK_BASE_APP_TOKEN=${appToken}`);
  content = content.replace(/^LARK_TABLE_CONTRACTS=.*$/m, `LARK_TABLE_CONTRACTS=${tableIds.contracts}`);
  content = content.replace(/^LARK_TABLE_QUALIFIED_PERSONS=.*$/m, `LARK_TABLE_QUALIFIED_PERSONS=${tableIds.qualifiedPersons}`);
  content = content.replace(/^LARK_TABLE_SUBCONTRACTORS=.*$/m, `LARK_TABLE_SUBCONTRACTORS=${tableIds.subcontractors}`);
  content = content.replace(/^LARK_TABLE_EQUIPMENT=.*$/m, `LARK_TABLE_EQUIPMENT=${tableIds.equipment}`);
  content = content.replace(/^LARK_TABLE_PROCESS_MASTER=.*$/m, `LARK_TABLE_PROCESS_MASTER=${tableIds.processMaster}`);
  content = content.replace(/^LARK_TABLE_SCHEDULES=.*$/m, `LARK_TABLE_SCHEDULES=${tableIds.schedules}`);

  writeFileSync(envPath, content, 'utf-8');
  console.log('✅ .env更新完了');
}

/**
 * メイン処理
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  🏗️  Miyabi Agent - 建設業版Lark 完全自動セットアップ');
  console.log('='.repeat(60) + '\n');

  try {
    // 1. 認証
    const token = await getAccessToken();

    // 2. Base作成
    const { appToken, url } = await createBase(token);

    // 3. テーブル作成
    const tableIds = await createAllTables(token, appToken);

    // 4. サンプルデータ投入
    await insertSampleData(token, appToken, tableIds);

    // 5. .env更新
    updateEnvFile(appToken, tableIds);

    // 完了レポート
    console.log('\n' + '='.repeat(60));
    console.log('  ✨ セットアップ完了！');
    console.log('='.repeat(60));
    console.log(`\n📎 Base URL: ${url}`);
    console.log(`📦 App Token: ${appToken}`);
    console.log('\n📋 作成されたテーブル:');
    Object.entries(tableIds).forEach(([name, id]) => {
      console.log(`   - ${name}: ${id}`);
    });
    console.log('\n🎉 建設業版Lark Base が完成しました！');
    console.log('   ブラウザで Base URL を開いてください。\n');

  } catch (error) {
    console.error('\n❌ エラー:', (error as Error).message);
    process.exit(1);
  }
}

main();
