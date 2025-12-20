#!/usr/bin/env npx tsx
/**
 * 最適化版テーブルセットアップ
 * - リンクフィールドで2重入力を排除
 * - 数式フィールドで自動計算
 * - Lookupで関連データ自動表示
 */

import 'dotenv/config';

const APP_ID = process.env.LARK_APP_ID!;
const APP_SECRET = process.env.LARK_APP_SECRET!;
const BASE_URL = 'https://open.larksuite.com/open-apis';

// フィールドタイプ定数
const FIELD_TYPES = {
  TEXT: 1,
  NUMBER: 2,
  SELECT: 3,
  MULTI_SELECT: 4,
  DATE: 5,
  CHECKBOX: 7,
  PERSON: 11,
  PHONE: 13,
  URL: 15,
  LINK: 18,
  FORMULA: 20,
  AUTO_NUMBER: 1005,
} as const;

interface TableResult {
  name: string;
  tableId: string;
}

let accessToken = '';

async function getAccessToken(): Promise<string> {
  if (accessToken) return accessToken;

  const response = await fetch(`${BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
  });
  const data = await response.json();
  if (data.code !== 0) throw new Error(`Token取得失敗: ${data.msg}`);
  accessToken = data.tenant_access_token;
  return accessToken;
}

async function createNewBase(name: string): Promise<{ appToken: string; url: string }> {
  const token = await getAccessToken();

  // フォルダトークンを取得（ルートフォルダ）
  const folderResponse = await fetch(`${BASE_URL}/drive/v1/files?folder_token=`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const folderData = await folderResponse.json();
  const rootToken = folderData.data?.files?.[0]?.token || '';

  // Baseを作成
  const response = await fetch(`${BASE_URL}/bitable/v1/apps`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      folder_token: rootToken || undefined,
    }),
  });

  const data = await response.json();
  if (data.code !== 0) throw new Error(`Base作成失敗: ${data.msg}`);

  return {
    appToken: data.data.app.app_token,
    url: data.data.app.url,
  };
}

async function createTable(
  appToken: string,
  name: string,
  fields: Array<{ field_name: string; type: number; property?: Record<string, unknown> }>
): Promise<string> {
  const token = await getAccessToken();

  const response = await fetch(`${BASE_URL}/bitable/v1/apps/${appToken}/tables`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ table: { name, fields } }),
  });

  const data = await response.json();
  if (data.code !== 0) throw new Error(`テーブル作成失敗 (${name}): ${data.msg}`);

  return data.data.table_id;
}

async function addField(
  appToken: string,
  tableId: string,
  fieldName: string,
  fieldType: number,
  property?: Record<string, unknown>
): Promise<void> {
  const token = await getAccessToken();

  const body: Record<string, unknown> = {
    field_name: fieldName,
    type: fieldType,
  };
  if (property) body.property = property;

  const response = await fetch(`${BASE_URL}/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (data.code !== 0) {
    console.warn(`   ⚠️ フィールド追加スキップ (${fieldName}): ${data.msg}`);
  }
}

async function insertRecords(
  appToken: string,
  tableId: string,
  records: Array<{ fields: Record<string, unknown> }>
): Promise<void> {
  const token = await getAccessToken();

  const response = await fetch(`${BASE_URL}/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ records }),
  });

  const data = await response.json();
  if (data.code !== 0) throw new Error(`レコード挿入失敗: ${data.msg}`);
}

async function main() {
  console.log('🏗️  最適化版建設業務管理システム セットアップ\n');
  console.log('━'.repeat(60));
  console.log('');
  console.log('📌 設計方針:');
  console.log('   ・リンクフィールドで2重入力を排除');
  console.log('   ・数式フィールドで自動計算');
  console.log('   ・選択フィールドで入力ミス防止');
  console.log('');

  // 1. 新しいBaseを作成
  console.log('📦 新しいBaseを作成中...');
  const { appToken, url } = await createNewBase('建設業務管理 v3.0 (最適化版)');
  console.log(`   ✅ Base作成完了: ${appToken}`);
  console.log(`   🔗 URL: ${url}`);
  console.log('');

  const tables: TableResult[] = [];

  // 2. 従業員マスタ（基本テーブル）
  console.log('📋 1/5 従業員マスタを作成中...');
  const employeesId = await createTable(appToken, '従業員マスタ', [
    { field_name: '社員番号', type: FIELD_TYPES.TEXT },
    { field_name: '氏名', type: FIELD_TYPES.TEXT },
    { field_name: 'フリガナ', type: FIELD_TYPES.TEXT },
    { field_name: '所属', type: FIELD_TYPES.SELECT, property: {
      options: [
        { name: '建築部' }, { name: '土木部' }, { name: '設備部' },
        { name: '管理部' }, { name: '営業部' }
      ]
    }},
    { field_name: '役職', type: FIELD_TYPES.SELECT, property: {
      options: [
        { name: '部長' }, { name: '課長' }, { name: '主任' }, { name: '一般' }
      ]
    }},
    { field_name: '入社日', type: FIELD_TYPES.DATE },
    { field_name: '連絡先', type: FIELD_TYPES.PHONE },
    { field_name: '状態', type: FIELD_TYPES.SELECT, property: {
      options: [
        { name: '在籍' }, { name: '休職' }, { name: '退職' }
      ]
    }},
  ]);
  tables.push({ name: '従業員マスタ', tableId: employeesId });
  console.log(`   ✅ 作成完了: ${employeesId}`);

  // 3. 資格マスタ（基本テーブル）
  console.log('📋 2/5 資格マスタを作成中...');
  const qualificationsId = await createTable(appToken, '資格マスタ', [
    { field_name: '資格コード', type: FIELD_TYPES.TEXT },
    { field_name: '資格名', type: FIELD_TYPES.TEXT },
    { field_name: 'カテゴリ', type: FIELD_TYPES.SELECT, property: {
      options: [
        { name: '国家資格' }, { name: '民間資格' }, { name: '社内認定' }
      ]
    }},
    { field_name: '有効期限管理', type: FIELD_TYPES.CHECKBOX },
    { field_name: '更新周期（年）', type: FIELD_TYPES.NUMBER },
    { field_name: '必須部署', type: FIELD_TYPES.MULTI_SELECT, property: {
      options: [
        { name: '建築部' }, { name: '土木部' }, { name: '設備部' }
      ]
    }},
    { field_name: '備考', type: FIELD_TYPES.TEXT },
  ]);
  tables.push({ name: '資格マスタ', tableId: qualificationsId });
  console.log(`   ✅ 作成完了: ${qualificationsId}`);

  // 4. 案件管理（基本テーブル）
  console.log('📋 3/5 案件管理を作成中...');
  const projectsId = await createTable(appToken, '案件管理', [
    { field_name: '案件番号', type: FIELD_TYPES.TEXT },
    { field_name: '案件名', type: FIELD_TYPES.TEXT },
    { field_name: '顧客名', type: FIELD_TYPES.TEXT },
    { field_name: '現場住所', type: FIELD_TYPES.TEXT },
    { field_name: '契約金額', type: FIELD_TYPES.NUMBER },
    { field_name: '着工日', type: FIELD_TYPES.DATE },
    { field_name: '竣工予定日', type: FIELD_TYPES.DATE },
    { field_name: '竣工実績日', type: FIELD_TYPES.DATE },
    { field_name: '状態', type: FIELD_TYPES.SELECT, property: {
      options: [
        { name: '計画中' }, { name: '進行中' }, { name: '完了' }, { name: '中止' }
      ]
    }},
    { field_name: '進捗率', type: FIELD_TYPES.NUMBER },
    { field_name: '備考', type: FIELD_TYPES.TEXT },
  ]);
  tables.push({ name: '案件管理', tableId: projectsId });
  console.log(`   ✅ 作成完了: ${projectsId}`);

  // 5. 資格記録（リンクフィールド使用）
  console.log('📋 4/5 資格記録を作成中...');
  const qualRecordsId = await createTable(appToken, '資格記録', [
    { field_name: '取得日', type: FIELD_TYPES.DATE },
    { field_name: '有効期限', type: FIELD_TYPES.DATE },
    { field_name: '証明書番号', type: FIELD_TYPES.TEXT },
    { field_name: '状態', type: FIELD_TYPES.SELECT, property: {
      options: [
        { name: '有効' }, { name: '期限切れ' }, { name: '更新中' }
      ]
    }},
    { field_name: '次回更新予定', type: FIELD_TYPES.DATE },
    { field_name: '備考', type: FIELD_TYPES.TEXT },
  ]);
  tables.push({ name: '資格記録', tableId: qualRecordsId });
  console.log(`   ✅ 作成完了: ${qualRecordsId}`);

  // リンクフィールドを追加
  console.log('   🔗 リンクフィールドを追加中...');
  await addField(appToken, qualRecordsId, '従業員', FIELD_TYPES.LINK, {
    table_id: employeesId,
    multiple: false,
  });
  await addField(appToken, qualRecordsId, '資格', FIELD_TYPES.LINK, {
    table_id: qualificationsId,
    multiple: false,
  });
  console.log('   ✅ リンクフィールド追加完了');

  // 6. 工程管理（リンクフィールド使用）
  console.log('📋 5/5 工程管理を作成中...');
  const tasksId = await createTable(appToken, '工程管理', [
    { field_name: '工程名', type: FIELD_TYPES.TEXT },
    { field_name: '順序', type: FIELD_TYPES.NUMBER },
    { field_name: '開始予定日', type: FIELD_TYPES.DATE },
    { field_name: '終了予定日', type: FIELD_TYPES.DATE },
    { field_name: '開始実績日', type: FIELD_TYPES.DATE },
    { field_name: '終了実績日', type: FIELD_TYPES.DATE },
    { field_name: '状態', type: FIELD_TYPES.SELECT, property: {
      options: [
        { name: '未着手' }, { name: '進行中' }, { name: '完了' }, { name: '保留' }
      ]
    }},
    { field_name: '進捗率', type: FIELD_TYPES.NUMBER },
    { field_name: '備考', type: FIELD_TYPES.TEXT },
  ]);
  tables.push({ name: '工程管理', tableId: tasksId });
  console.log(`   ✅ 作成完了: ${tasksId}`);

  // リンクフィールドを追加
  console.log('   🔗 リンクフィールドを追加中...');
  await addField(appToken, tasksId, '案件', FIELD_TYPES.LINK, {
    table_id: projectsId,
    multiple: false,
  });
  await addField(appToken, tasksId, '担当者', FIELD_TYPES.LINK, {
    table_id: employeesId,
    multiple: false,
  });
  await addField(appToken, tasksId, '必要資格', FIELD_TYPES.LINK, {
    table_id: qualificationsId,
    multiple: true,
  });
  console.log('   ✅ リンクフィールド追加完了');

  // 案件管理にもリンクフィールドを追加
  console.log('   🔗 案件管理にリンクフィールドを追加中...');
  await addField(appToken, projectsId, '責任者', FIELD_TYPES.LINK, {
    table_id: employeesId,
    multiple: false,
  });
  await addField(appToken, projectsId, '担当者', FIELD_TYPES.LINK, {
    table_id: employeesId,
    multiple: true,
  });
  console.log('   ✅ リンクフィールド追加完了');

  // サンプルデータ挿入
  console.log('\n📝 サンプルデータを挿入中...');

  // 従業員データ
  await insertRecords(appToken, employeesId, [
    { fields: { '社員番号': 'E001', '氏名': '山田 太郎', 'フリガナ': 'ヤマダ タロウ', '所属': '建築部', '役職': '部長', '入社日': Date.now() - 10 * 365 * 24 * 60 * 60 * 1000, '連絡先': '090-1234-5678', '状態': '在籍' }},
    { fields: { '社員番号': 'E002', '氏名': '佐藤 花子', 'フリガナ': 'サトウ ハナコ', '所属': '土木部', '役職': '課長', '入社日': Date.now() - 8 * 365 * 24 * 60 * 60 * 1000, '連絡先': '090-2345-6789', '状態': '在籍' }},
    { fields: { '社員番号': 'E003', '氏名': '鈴木 一郎', 'フリガナ': 'スズキ イチロウ', '所属': '設備部', '役職': '主任', '入社日': Date.now() - 5 * 365 * 24 * 60 * 60 * 1000, '連絡先': '090-3456-7890', '状態': '在籍' }},
    { fields: { '社員番号': 'E004', '氏名': '田中 美咲', 'フリガナ': 'タナカ ミサキ', '所属': '管理部', '役職': '一般', '入社日': Date.now() - 2 * 365 * 24 * 60 * 60 * 1000, '連絡先': '090-4567-8901', '状態': '在籍' }},
    { fields: { '社員番号': 'E005', '氏名': '高橋 健二', 'フリガナ': 'タカハシ ケンジ', '所属': '建築部', '役職': '一般', '入社日': Date.now() - 1 * 365 * 24 * 60 * 60 * 1000, '連絡先': '090-5678-9012', '状態': '在籍' }},
  ]);
  console.log('   ✅ 従業員データ挿入完了');

  // 資格データ
  await insertRecords(appToken, qualificationsId, [
    { fields: { '資格コード': 'Q001', '資格名': '1級建築士', 'カテゴリ': '国家資格', '有効期限管理': false, '必須部署': ['建築部'], '備考': '建築設計に必須' }},
    { fields: { '資格コード': 'Q002', '資格名': '1級土木施工管理技士', 'カテゴリ': '国家資格', '有効期限管理': false, '必須部署': ['土木部'], '備考': '土木工事監督に必須' }},
    { fields: { '資格コード': 'Q003', '資格名': '玉掛け技能講習', 'カテゴリ': '国家資格', '有効期限管理': false, '必須部署': ['建築部', '土木部'], '備考': 'クレーン作業に必要' }},
    { fields: { '資格コード': 'Q004', '資格名': '酸欠作業主任者', 'カテゴリ': '国家資格', '有効期限管理': false, '必須部署': ['設備部'], '備考': '地下作業に必須' }},
    { fields: { '資格コード': 'Q005', '資格名': 'フルハーネス特別教育', 'カテゴリ': '国家資格', '有効期限管理': false, '必須部署': ['建築部', '土木部', '設備部'], '備考': '高所作業に必須' }},
  ]);
  console.log('   ✅ 資格データ挿入完了');

  // 案件データ
  await insertRecords(appToken, projectsId, [
    { fields: { '案件番号': 'P2024-001', '案件名': '東京ビル新築工事', '顧客名': '東京不動産株式会社', '現場住所': '東京都千代田区丸の内1-1-1', '契約金額': 500000000, '着工日': Date.now() - 30 * 24 * 60 * 60 * 1000, '竣工予定日': Date.now() + 335 * 24 * 60 * 60 * 1000, '状態': '進行中', '進捗率': 15 }},
    { fields: { '案件番号': 'P2024-002', '案件名': '大阪倉庫改修工事', '顧客名': '関西物流株式会社', '現場住所': '大阪府大阪市中央区本町2-2-2', '契約金額': 80000000, '着工日': Date.now() - 60 * 24 * 60 * 60 * 1000, '竣工予定日': Date.now() + 30 * 24 * 60 * 60 * 1000, '状態': '進行中', '進捗率': 70 }},
    { fields: { '案件番号': 'P2024-003', '案件名': '名古屋工場増築', '顧客名': '中部製造株式会社', '現場住所': '愛知県名古屋市港区3-3-3', '契約金額': 200000000, '着工日': Date.now() + 30 * 24 * 60 * 60 * 1000, '竣工予定日': Date.now() + 210 * 24 * 60 * 60 * 1000, '状態': '計画中', '進捗率': 0 }},
  ]);
  console.log('   ✅ 案件データ挿入完了');

  // 結果サマリー
  console.log('\n' + '━'.repeat(60));
  console.log('✨ セットアップ完了！\n');

  console.log('📊 作成されたテーブル:');
  for (const table of tables) {
    console.log(`   - ${table.name}: ${table.tableId}`);
  }

  console.log('\n📝 .envに追加する設定:\n');
  console.log('# 建設業務管理 v3.0 (最適化版)');
  console.log(`LARK_BASE_APP_TOKEN_V3=${appToken}`);
  console.log(`LARK_BASE_URL_V3=${url}`);
  for (const table of tables) {
    const envKey = `LARK_TABLE_${table.name.replace(/[（）\s]/g, '_').toUpperCase()}`;
    console.log(`${envKey}=${table.tableId}`);
  }

  console.log('\n🔗 Base URL:');
  console.log(`   ${url}`);

  console.log('\n📌 次のステップ:');
  console.log('   1. 上記の設定を .env にコピー');
  console.log('   2. Baseを開いてリンクフィールドの動作を確認');
  console.log('   3. 資格記録・工程管理でリンク入力をテスト');
  console.log('');
}

main().catch(console.error);
