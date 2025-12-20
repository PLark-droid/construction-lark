#!/usr/bin/env npx tsx
/**
 * 新規Base作成 + テーブル作成 + サンプルデータ投入
 * 「シンプル建設業務管理 v2.0」
 */

import 'dotenv/config';

const APP_ID = process.env.LARK_APP_ID!;
const APP_SECRET = process.env.LARK_APP_SECRET!;
const BASE_URL = 'https://open.larksuite.com/open-apis';

// フィールドタイプ
const FIELD_TYPES = {
  TEXT: 1,
  NUMBER: 2,
  SELECT: 3,
  MULTI_SELECT: 4,
  DATE: 5,
  CHECKBOX: 7,
  PHONE: 13,
};

let accessToken: string | null = null;

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
  return accessToken!;
}

async function createNewBase(name: string): Promise<{ appToken: string; url: string }> {
  const token = await getAccessToken();

  console.log(`\n🆕 新規Base「${name}」を作成中...`);

  const response = await fetch(`${BASE_URL}/bitable/v1/apps`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      folder_token: '', // ルートフォルダに作成
    }),
  });

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`Base作成失敗: ${data.msg} (code: ${data.code})`);
  }

  const appToken = data.data.app.app_token;
  const url = data.data.app.url;

  console.log(`   ✅ 作成完了!`);
  console.log(`   📋 App Token: ${appToken}`);
  console.log(`   🔗 URL: ${url}`);

  return { appToken, url };
}

async function createTable(
  appToken: string,
  name: string,
  fields: Array<{ field_name: string; type: number; property?: Record<string, unknown> }>
): Promise<string> {
  const token = await getAccessToken();

  console.log(`\n📋 テーブル「${name}」を作成中...`);

  const response = await fetch(`${BASE_URL}/bitable/v1/apps/${appToken}/tables`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ table: { name, fields } }),
  });

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`テーブル作成失敗: ${data.msg}`);
  }

  console.log(`   ✅ 作成完了: ${data.data.table_id}`);
  return data.data.table_id;
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

  if (data.code !== 0) {
    throw new Error(`レコード挿入失敗: ${data.msg}`);
  }

  console.log(`   ✅ ${records.length}件投入完了`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🏗️  シンプル建設業務管理 v2.0 - 完全セットアップ');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // 1. 新規Base作成
    const { appToken, url } = await createNewBase('シンプル建設業務管理 v2.0');

    const tableIds: Record<string, string> = {};

    // 2. 従業員マスタ
    tableIds.employees = await createTable(appToken, '従業員マスタ', [
      { field_name: '社員番号', type: FIELD_TYPES.TEXT },
      { field_name: '氏名', type: FIELD_TYPES.TEXT },
      { field_name: 'フリガナ', type: FIELD_TYPES.TEXT },
      { field_name: '所属', type: FIELD_TYPES.SELECT, property: {
        options: [
          { name: '建築部', color: 0 },
          { name: '土木部', color: 1 },
          { name: '設備部', color: 2 },
          { name: '管理部', color: 3 },
          { name: '営業部', color: 4 },
        ]
      }},
      { field_name: '役職', type: FIELD_TYPES.SELECT, property: {
        options: [
          { name: '部長', color: 0 },
          { name: '課長', color: 1 },
          { name: '主任', color: 2 },
          { name: '一般', color: 3 },
        ]
      }},
      { field_name: '入社日', type: FIELD_TYPES.DATE },
      { field_name: '連絡先', type: FIELD_TYPES.PHONE },
      { field_name: '状態', type: FIELD_TYPES.SELECT, property: {
        options: [
          { name: '在籍', color: 0 },
          { name: '休職', color: 1 },
          { name: '退職', color: 2 },
        ]
      }},
    ]);

    console.log('   👤 サンプルデータを投入中...');
    await insertRecords(appToken, tableIds.employees, [
      { fields: { '社員番号': 'E001', '氏名': '山田 太郎', 'フリガナ': 'ヤマダ タロウ', '所属': '建築部', '役職': '部長', '入社日': 1270080000000, '連絡先': '090-1234-5678', '状態': '在籍' }},
      { fields: { '社員番号': 'E002', '氏名': '佐藤 花子', 'フリガナ': 'サトウ ハナコ', '所属': '建築部', '役職': '主任', '入社日': 1427846400000, '連絡先': '090-2345-6789', '状態': '在籍' }},
      { fields: { '社員番号': 'E003', '氏名': '鈴木 一郎', 'フリガナ': 'スズキ イチロウ', '所属': '土木部', '役職': '課長', '入社日': 1333238400000, '連絡先': '090-3456-7890', '状態': '在籍' }},
      { fields: { '社員番号': 'E004', '氏名': '高橋 次郎', 'フリガナ': 'タカハシ ジロウ', '所属': '設備部', '役職': '一般', '入社日': 1585699200000, '連絡先': '090-4567-8901', '状態': '在籍' }},
      { fields: { '社員番号': 'E005', '氏名': '田中 美咲', 'フリガナ': 'タナカ ミサキ', '所属': '管理部', '役職': '一般', '入社日': 1648771200000, '連絡先': '090-5678-9012', '状態': '在籍' }},
    ]);

    // 3. 資格マスタ
    tableIds.qualifications = await createTable(appToken, '資格マスタ', [
      { field_name: '資格コード', type: FIELD_TYPES.TEXT },
      { field_name: '資格名', type: FIELD_TYPES.TEXT },
      { field_name: 'カテゴリ', type: FIELD_TYPES.SELECT, property: {
        options: [
          { name: '国家資格', color: 0 },
          { name: '民間資格', color: 1 },
          { name: '社内認定', color: 2 },
        ]
      }},
      { field_name: '有効期限管理', type: FIELD_TYPES.CHECKBOX },
      { field_name: '更新周期（年）', type: FIELD_TYPES.NUMBER },
      { field_name: '必須部署', type: FIELD_TYPES.MULTI_SELECT, property: {
        options: [
          { name: '建築部' },
          { name: '土木部' },
          { name: '設備部' },
        ]
      }},
      { field_name: '備考', type: FIELD_TYPES.TEXT },
    ]);

    console.log('   📜 サンプルデータを投入中...');
    await insertRecords(appToken, tableIds.qualifications, [
      { fields: { '資格コード': 'Q001', '資格名': '1級建築施工管理技士', 'カテゴリ': '国家資格', '有効期限管理': false, '必須部署': ['建築部'], '備考': '建築工事の施工管理に必要' }},
      { fields: { '資格コード': 'Q002', '資格名': '1級土木施工管理技士', 'カテゴリ': '国家資格', '有効期限管理': false, '必須部署': ['土木部'], '備考': '土木工事の施工管理に必要' }},
      { fields: { '資格コード': 'Q003', '資格名': '1級電気工事施工管理技士', 'カテゴリ': '国家資格', '有効期限管理': false, '必須部署': ['設備部'], '備考': '電気設備工事の施工管理に必要' }},
      { fields: { '資格コード': 'Q004', '資格名': '職長・安全衛生責任者', 'カテゴリ': '民間資格', '有効期限管理': true, '更新周期（年）': 5, '必須部署': ['建築部', '土木部', '設備部'], '備考': '5年ごとに能力向上教育が必要' }},
      { fields: { '資格コード': 'Q005', '資格名': 'フォークリフト運転技能', 'カテゴリ': '国家資格', '有効期限管理': false, '備考': '1t以上のフォークリフト運転に必要' }},
      { fields: { '資格コード': 'Q006', '資格名': '玉掛け技能', 'カテゴリ': '国家資格', '有効期限管理': false, '備考': '1t以上の玉掛け作業に必要' }},
    ]);

    // 4. 資格記録
    tableIds.qualificationRecords = await createTable(appToken, '資格記録', [
      { field_name: '従業員名', type: FIELD_TYPES.TEXT },
      { field_name: '資格名', type: FIELD_TYPES.TEXT },
      { field_name: '取得日', type: FIELD_TYPES.DATE },
      { field_name: '有効期限', type: FIELD_TYPES.DATE },
      { field_name: '証明書番号', type: FIELD_TYPES.TEXT },
      { field_name: '状態', type: FIELD_TYPES.SELECT, property: {
        options: [
          { name: '有効', color: 0 },
          { name: '期限切れ', color: 2 },
          { name: '更新中', color: 1 },
        ]
      }},
      { field_name: '次回更新予定', type: FIELD_TYPES.DATE },
      { field_name: '備考', type: FIELD_TYPES.TEXT },
    ]);

    console.log('   📋 サンプルデータを投入中...');
    await insertRecords(appToken, tableIds.qualificationRecords, [
      { fields: { '従業員名': '山田 太郎', '資格名': '1級建築施工管理技士', '取得日': 1434326400000, '証明書番号': 'B-2015-12345', '状態': '有効' }},
      { fields: { '従業員名': '山田 太郎', '資格名': '職長・安全衛生責任者', '取得日': 1583798400000, '有効期限': 1741478400000, '証明書番号': 'SH-2020-001', '状態': '有効', '次回更新予定': 1738800000000 }},
      { fields: { '従業員名': '佐藤 花子', '資格名': '1級建築施工管理技士', '取得日': 1592611200000, '証明書番号': 'B-2020-23456', '状態': '有効' }},
      { fields: { '従業員名': '鈴木 一郎', '資格名': '1級土木施工管理技士', '取得日': 1466208000000, '証明書番号': 'C-2016-34567', '状態': '有効' }},
      { fields: { '従業員名': '高橋 次郎', '資格名': 'フォークリフト運転技能', '取得日': 1629849600000, '証明書番号': 'FL-2021-456', '状態': '有効' }},
      { fields: { '従業員名': '高橋 次郎', '資格名': '玉掛け技能', '取得日': 1631232000000, '証明書番号': 'TK-2021-789', '状態': '有効' }},
    ]);

    // 5. 案件管理
    tableIds.projects = await createTable(appToken, '案件管理', [
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
          { name: '計画中', color: 1 },
          { name: '進行中', color: 0 },
          { name: '完了', color: 3 },
          { name: '中止', color: 2 },
        ]
      }},
      { field_name: '進捗率', type: FIELD_TYPES.NUMBER },
      { field_name: '責任者', type: FIELD_TYPES.TEXT },
      { field_name: '担当者', type: FIELD_TYPES.TEXT },
      { field_name: '備考', type: FIELD_TYPES.TEXT },
    ]);

    console.log('   🏗️ サンプルデータを投入中...');
    await insertRecords(appToken, tableIds.projects, [
      { fields: { '案件番号': 'PJ-2024-001', '案件名': '○○ビル新築工事', '顧客名': '株式会社○○開発', '現場住所': '東京都千代田区丸の内1-1-1', '契約金額': 500000000, '着工日': 1706745600000, '竣工予定日': 1735603200000, '状態': '進行中', '進捗率': 45, '責任者': '山田 太郎', '担当者': '佐藤 花子' }},
      { fields: { '案件番号': 'PJ-2024-002', '案件名': '△△マンション改修工事', '顧客名': '△△管理組合', '現場住所': '東京都渋谷区渋谷2-2-2', '契約金額': 80000000, '着工日': 1711929600000, '竣工予定日': 1727654400000, '状態': '進行中', '進捗率': 70, '責任者': '佐藤 花子' }},
      { fields: { '案件番号': 'PJ-2024-003', '案件名': '□□道路補修工事', '顧客名': '○○市役所', '現場住所': '神奈川県横浜市中区1-2-3', '契約金額': 30000000, '着工日': 1717200000000, '竣工予定日': 1725062400000, '状態': '計画中', '進捗率': 0, '責任者': '鈴木 一郎' }},
    ]);

    // 6. 工程管理
    tableIds.tasks = await createTable(appToken, '工程管理', [
      { field_name: '案件名', type: FIELD_TYPES.TEXT },
      { field_name: '工程名', type: FIELD_TYPES.TEXT },
      { field_name: '順序', type: FIELD_TYPES.NUMBER },
      { field_name: '開始予定日', type: FIELD_TYPES.DATE },
      { field_name: '終了予定日', type: FIELD_TYPES.DATE },
      { field_name: '開始実績日', type: FIELD_TYPES.DATE },
      { field_name: '終了実績日', type: FIELD_TYPES.DATE },
      { field_name: '状態', type: FIELD_TYPES.SELECT, property: {
        options: [
          { name: '未着手', color: 1 },
          { name: '進行中', color: 0 },
          { name: '完了', color: 3 },
          { name: '保留', color: 2 },
        ]
      }},
      { field_name: '進捗率', type: FIELD_TYPES.NUMBER },
      { field_name: '担当者', type: FIELD_TYPES.TEXT },
      { field_name: '必要資格', type: FIELD_TYPES.TEXT },
      { field_name: '備考', type: FIELD_TYPES.TEXT },
    ]);

    console.log('   📅 サンプルデータを投入中...');
    await insertRecords(appToken, tableIds.tasks, [
      // PJ-2024-001の工程
      { fields: { '案件名': '○○ビル新築工事', '工程名': '仮設工事', '順序': 1, '開始予定日': 1706745600000, '終了予定日': 1707868800000, '開始実績日': 1706745600000, '終了実績日': 1707696000000, '状態': '完了', '進捗率': 100, '担当者': '佐藤 花子' }},
      { fields: { '案件名': '○○ビル新築工事', '工程名': '基礎工事', '順序': 2, '開始予定日': 1707955200000, '終了予定日': 1714435200000, '開始実績日': 1707955200000, '終了実績日': 1714262400000, '状態': '完了', '進捗率': 100, '担当者': '佐藤 花子', '必要資格': '1級建築施工管理技士' }},
      { fields: { '案件名': '○○ビル新築工事', '工程名': '躯体工事', '順序': 3, '開始予定日': 1714521600000, '終了予定日': 1725148800000, '開始実績日': 1714521600000, '状態': '進行中', '進捗率': 60, '担当者': '佐藤 花子', '必要資格': '1級建築施工管理技士' }},
      { fields: { '案件名': '○○ビル新築工事', '工程名': '内装工事', '順序': 4, '開始予定日': 1725235200000, '終了予定日': 1732924800000, '状態': '未着手', '進捗率': 0 }},
      { fields: { '案件名': '○○ビル新築工事', '工程名': '竣工検査', '順序': 5, '開始予定日': 1733011200000, '終了予定日': 1735603200000, '状態': '未着手', '進捗率': 0 }},
      // PJ-2024-002の工程
      { fields: { '案件名': '△△マンション改修工事', '工程名': '足場設置', '順序': 1, '開始予定日': 1711929600000, '終了予定日': 1713052800000, '開始実績日': 1711929600000, '終了実績日': 1712966400000, '状態': '完了', '進捗率': 100 }},
      { fields: { '案件名': '△△マンション改修工事', '工程名': '外壁補修', '順序': 2, '開始予定日': 1713139200000, '終了予定日': 1719705600000, '開始実績日': 1713139200000, '終了実績日': 1719532800000, '状態': '完了', '進捗率': 100 }},
      { fields: { '案件名': '△△マンション改修工事', '工程名': '塗装工事', '順序': 3, '開始予定日': 1719792000000, '終了予定日': 1725062400000, '開始実績日': 1719792000000, '状態': '進行中', '進捗率': 50 }},
      { fields: { '案件名': '△△マンション改修工事', '工程名': '足場解体・清掃', '順序': 4, '開始予定日': 1725148800000, '終了予定日': 1727654400000, '状態': '未着手', '進捗率': 0 }},
    ]);

    // 結果出力
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✨ セットアップ完了！');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n🔗 Base URL: ${url}`);
    console.log('\n📝 .env に追加する設定:\n');
    console.log(`# シンプル建設業務管理 v2.0 (新規Base)`);
    console.log(`LARK_BASE_APP_TOKEN_V2=${appToken}`);
    console.log(`LARK_BASE_URL_V2=${url}`);
    console.log(`LARK_TABLE_EMPLOYEES=${tableIds.employees}`);
    console.log(`LARK_TABLE_QUALIFICATIONS=${tableIds.qualifications}`);
    console.log(`LARK_TABLE_QUALIFICATION_RECORDS=${tableIds.qualificationRecords}`);
    console.log(`LARK_TABLE_PROJECTS=${tableIds.projects}`);
    console.log(`LARK_TABLE_TASKS=${tableIds.tasks}`);

    console.log('\n📊 投入データ:');
    console.log('  ・従業員マスタ: 5名');
    console.log('  ・資格マスタ: 6種類');
    console.log('  ・資格記録: 6件');
    console.log('  ・案件管理: 3件');
    console.log('  ・工程管理: 9件');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

main();
