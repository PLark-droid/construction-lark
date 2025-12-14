#!/usr/bin/env npx tsx
/**
 * 建設業版Lark Base - 完全セットアップスクリプト
 *
 * 機能:
 * - 6テーブル自動作成（工事台帳、工程表、作業員マスタ、協力会社マスタ、資機材マスタ、日報）
 * - 14の双方向リレーション（DUPLEX_LINK type:21）完全設定
 * - 適切なビュー自動作成（グリッド、カンバン、ガントチャート、カレンダー）
 * - サンプルデータ投入オプション
 */

import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// ========================================
// 環境変数読み込み
// ========================================
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
const BASE_URL = 'https://open.larksuite.com/open-apis';

// ========================================
// フィールドタイプ定義
// ========================================
const F = {
  TEXT: 1,
  NUMBER: 2,
  SELECT: 3,
  MULTI_SELECT: 4,
  DATE: 5,
  CHECKBOX: 7,
  PERSON: 11,
  PHONE: 13,
  URL: 15,
  ATTACHMENT: 17,
  LINK: 18,
  FORMULA: 20,
  DUPLEX_LINK: 21,    // 双方向リンク
  CREATED_TIME: 1001,
  UPDATED_TIME: 1002,
  CREATED_BY: 1003,
  UPDATED_BY: 1004,
  AUTO_NUMBER: 1005,  // 自動採番
} as const;

// ========================================
// テーブル定義（シンプル・わかりやすさ重視）
// ========================================

interface TableDef {
  name: string;
  description: string;
  fields: Array<{
    field_name: string;
    type: number;
    property?: unknown;
  }>;
  views: Array<{
    name: string;
    type: 'grid' | 'kanban' | 'gantt' | 'calendar';
  }>;
}

const TABLES: TableDef[] = [
  // ========== 1. 工事台帳 ==========
  {
    name: '工事台帳',
    description: '工事の基本情報と全体進捗を管理',
    fields: [
      { field_name: '工事番号', type: F.AUTO_NUMBER },
      { field_name: '工事名', type: F.TEXT },
      { field_name: '発注者名', type: F.TEXT },
      { field_name: '契約金額', type: F.NUMBER },
      { field_name: '契約日', type: F.DATE },
      { field_name: '着工日', type: F.DATE },
      { field_name: '竣工予定日', type: F.DATE },
      {
        field_name: '進捗状況',
        type: F.SELECT,
        property: {
          options: [
            { name: '準備中' },
            { name: '着工前' },
            { name: '施工中' },
            { name: '検査中' },
            { name: '完工' },
            { name: '引渡済' },
          ]
        }
      },
      { field_name: '全体進捗率', type: F.NUMBER },
      { field_name: '現場住所', type: F.TEXT },
      { field_name: '工事概要', type: F.TEXT },
      { field_name: '特記事項', type: F.TEXT },
    ],
    views: [
      { name: 'すべての工事', type: 'grid' },
      { name: '進捗状況別', type: 'kanban' },
      { name: '工程表', type: 'gantt' },
      { name: 'カレンダー', type: 'calendar' },
    ],
  },

  // ========== 2. 工程表 ==========
  {
    name: '工程表',
    description: '各工事の作業工程を詳細管理',
    fields: [
      { field_name: '工程番号', type: F.AUTO_NUMBER },
      { field_name: '工程名', type: F.TEXT },
      {
        field_name: '工程分類',
        type: F.SELECT,
        property: {
          options: [
            { name: '準備工' },
            { name: '仮設工' },
            { name: '土工' },
            { name: '基礎工' },
            { name: '躯体工' },
            { name: '外装工' },
            { name: '内装工' },
            { name: '設備工' },
            { name: '外構工' },
            { name: '検査' },
          ]
        }
      },
      { field_name: '予定開始日', type: F.DATE },
      { field_name: '予定終了日', type: F.DATE },
      { field_name: '実績開始日', type: F.DATE },
      { field_name: '実績終了日', type: F.DATE },
      { field_name: '進捗率', type: F.NUMBER },
      {
        field_name: 'ステータス',
        type: F.SELECT,
        property: {
          options: [
            { name: '未着手' },
            { name: '進行中' },
            { name: '遅延' },
            { name: '完了' },
            { name: '中断' },
          ]
        }
      },
      { field_name: '作業内容', type: F.TEXT },
      { field_name: '備考', type: F.TEXT },
    ],
    views: [
      { name: 'すべての工程', type: 'grid' },
      { name: 'ステータス別', type: 'kanban' },
      { name: 'ガントチャート', type: 'gantt' },
    ],
  },

  // ========== 3. 作業員マスタ ==========
  {
    name: '作業員マスタ',
    description: '作業員の基本情報と資格を管理',
    fields: [
      { field_name: '社員番号', type: F.TEXT },
      { field_name: '氏名', type: F.TEXT },
      { field_name: '所属', type: F.TEXT },
      {
        field_name: '保有資格',
        type: F.MULTI_SELECT,
        property: {
          options: [
            { name: '1級建築施工管理技士' },
            { name: '2級建築施工管理技士' },
            { name: '1級土木施工管理技士' },
            { name: '2級土木施工管理技士' },
            { name: '1級管工事施工管理技士' },
            { name: '1級電気工事施工管理技士' },
            { name: '1級建築士' },
            { name: '2級建築士' },
            { name: '職長' },
            { name: '安全衛生責任者' },
            { name: '玉掛け技能' },
            { name: 'クレーン運転士' },
            { name: '足場組立作業主任者' },
          ]
        }
      },
      { field_name: '電話番号', type: F.PHONE },
      { field_name: 'メールアドレス', type: F.TEXT },
      {
        field_name: '在籍状況',
        type: F.SELECT,
        property: {
          options: [
            { name: '在籍' },
            { name: '休職' },
            { name: '退職' },
          ]
        }
      },
      { field_name: '入社日', type: F.DATE },
      { field_name: '備考', type: F.TEXT },
    ],
    views: [
      { name: 'すべての作業員', type: 'grid' },
    ],
  },

  // ========== 4. 協力会社マスタ ==========
  {
    name: '協力会社マスタ',
    description: '協力会社の情報を管理',
    fields: [
      { field_name: '会社コード', type: F.AUTO_NUMBER },
      { field_name: '会社名', type: F.TEXT },
      { field_name: '代表者名', type: F.TEXT },
      { field_name: '住所', type: F.TEXT },
      { field_name: '電話番号', type: F.PHONE },
      { field_name: 'メールアドレス', type: F.TEXT },
      {
        field_name: '専門工種',
        type: F.MULTI_SELECT,
        property: {
          options: [
            { name: 'とび・土工' },
            { name: '型枠' },
            { name: '鉄筋' },
            { name: '鉄骨' },
            { name: 'コンクリート' },
            { name: '左官' },
            { name: 'タイル' },
            { name: '防水' },
            { name: '塗装' },
            { name: '内装' },
            { name: '建具' },
            { name: '電気' },
            { name: '空調' },
            { name: '衛生設備' },
            { name: '消防' },
            { name: '外構' },
            { name: '解体' },
          ]
        }
      },
      {
        field_name: '評価ランク',
        type: F.SELECT,
        property: {
          options: [
            { name: 'S' },
            { name: 'A' },
            { name: 'B' },
            { name: 'C' },
            { name: '新規' },
          ]
        }
      },
      { field_name: '建設業許可番号', type: F.TEXT },
      { field_name: '労災保険加入', type: F.CHECKBOX },
      { field_name: '備考', type: F.TEXT },
    ],
    views: [
      { name: 'すべての協力会社', type: 'grid' },
    ],
  },

  // ========== 5. 資機材マスタ ==========
  {
    name: '資機材マスタ',
    description: '資材・機材の在庫と配置を管理',
    fields: [
      { field_name: '資機材コード', type: F.AUTO_NUMBER },
      { field_name: '資機材名', type: F.TEXT },
      {
        field_name: '分類',
        type: F.SELECT,
        property: {
          options: [
            { name: '重機' },
            { name: '車両' },
            { name: '揚重機' },
            { name: '足場・仮設' },
            { name: '型枠' },
            { name: '電動工具' },
            { name: '測量機器' },
            { name: '安全設備' },
            { name: '発電機・照明' },
            { name: 'その他' },
          ]
        }
      },
      { field_name: 'メーカー', type: F.TEXT },
      { field_name: '型番', type: F.TEXT },
      { field_name: '保有数量', type: F.NUMBER },
      { field_name: '使用中数量', type: F.NUMBER },
      {
        field_name: '状態',
        type: F.SELECT,
        property: {
          options: [
            { name: '使用可能' },
            { name: '使用中' },
            { name: '整備中' },
            { name: '故障' },
            { name: '廃棄予定' },
          ]
        }
      },
      { field_name: '保管場所', type: F.TEXT },
      { field_name: '次回点検日', type: F.DATE },
      { field_name: '備考', type: F.TEXT },
    ],
    views: [
      { name: 'すべての資機材', type: 'grid' },
    ],
  },

  // ========== 6. 日報 ==========
  {
    name: '日報',
    description: '日々の作業内容と進捗を記録',
    fields: [
      { field_name: '日報番号', type: F.AUTO_NUMBER },
      { field_name: '日付', type: F.DATE },
      {
        field_name: '天候',
        type: F.SELECT,
        property: {
          options: [
            { name: '晴れ' },
            { name: '曇り' },
            { name: '雨' },
            { name: '雪' },
            { name: '強風' },
          ]
        }
      },
      { field_name: '気温', type: F.NUMBER },
      { field_name: '本日の作業内容', type: F.TEXT },
      { field_name: '作業人数', type: F.NUMBER },
      { field_name: '進捗メモ', type: F.TEXT },
      { field_name: '問題・課題', type: F.TEXT },
      { field_name: '翌日の予定', type: F.TEXT },
      { field_name: '写真', type: F.ATTACHMENT },
      { field_name: '承認状態', type: F.SELECT, property: { options: [
        { name: '未承認' },
        { name: '承認済' },
      ]}},
    ],
    views: [
      { name: 'すべての日報', type: 'grid' },
      { name: 'カレンダー', type: 'calendar' },
    ],
  },
];

// ========================================
// 双方向リレーション定義（14件）
// ========================================

interface RelationDef {
  name: string;
  sourceTableName: string;
  targetTableName: string;
  sourceFieldName: string;
  targetFieldName: string;
  description: string;
}

const RELATIONS: RelationDef[] = [
  // 工事台帳 を起点とするリレーション
  {
    name: '工事台帳 ↔ 工程表',
    sourceTableName: '工事台帳',
    targetTableName: '工程表',
    sourceFieldName: '関連工程',
    targetFieldName: '所属工事',
    description: '工事に紐づく工程一覧',
  },
  {
    name: '工事台帳 ↔ 日報',
    sourceTableName: '工事台帳',
    targetTableName: '日報',
    sourceFieldName: '関連日報',
    targetFieldName: '所属工事',
    description: '工事の日報一覧',
  },
  {
    name: '工事台帳 ↔ 資機材マスタ',
    sourceTableName: '工事台帳',
    targetTableName: '資機材マスタ',
    sourceFieldName: '配置資機材',
    targetFieldName: '配置先工事',
    description: '工事に配置された資機材',
  },
  {
    name: '工事台帳 ↔ 協力会社マスタ',
    sourceTableName: '工事台帳',
    targetTableName: '協力会社マスタ',
    sourceFieldName: '担当協力会社',
    targetFieldName: '担当工事',
    description: '工事に参加する協力会社',
  },

  // 工程表 を起点とするリレーション
  {
    name: '工程表 ↔ 作業員マスタ',
    sourceTableName: '工程表',
    targetTableName: '作業員マスタ',
    sourceFieldName: '担当者',
    targetFieldName: '担当工程',
    description: '工程の担当作業員',
  },
  {
    name: '工程表 ↔ 資機材マスタ',
    sourceTableName: '工程表',
    targetTableName: '資機材マスタ',
    sourceFieldName: '使用資機材',
    targetFieldName: '使用工程',
    description: '工程で使用する資機材',
  },
  {
    name: '工程表 ↔ 日報',
    sourceTableName: '工程表',
    targetTableName: '日報',
    sourceFieldName: '工程の日報',
    targetFieldName: '対象工程',
    description: '工程の作業記録',
  },
  {
    name: '工程表 ↔ 協力会社マスタ',
    sourceTableName: '工程表',
    targetTableName: '協力会社マスタ',
    sourceFieldName: '施工協力会社',
    targetFieldName: '施工工程',
    description: '工程を施工する協力会社',
  },

  // 日報 を起点とするリレーション
  {
    name: '日報 ↔ 作業員マスタ',
    sourceTableName: '日報',
    targetTableName: '作業員マスタ',
    sourceFieldName: '作成者',
    targetFieldName: '日報記録',
    description: '日報作成者',
  },
  {
    name: '日報 ↔ 資機材マスタ',
    sourceTableName: '日報',
    targetTableName: '資機材マスタ',
    sourceFieldName: '使用機材',
    targetFieldName: '使用実績',
    description: '日報で記録された使用機材',
  },

  // 作業員マスタ を起点とするリレーション
  {
    name: '作業員マスタ ↔ 資機材マスタ',
    sourceTableName: '作業員マスタ',
    targetTableName: '資機材マスタ',
    sourceFieldName: '使用中機材',
    targetFieldName: '使用者',
    description: '作業員が使用中の機材',
  },
  {
    name: '作業員マスタ ↔ 協力会社マスタ',
    sourceTableName: '作業員マスタ',
    targetTableName: '協力会社マスタ',
    sourceFieldName: '協力会社',
    targetFieldName: '所属作業員',
    description: '作業員の所属協力会社（外注作業員の場合）',
  },

  // 資機材マスタ ↔ 協力会社マスタ
  {
    name: '資機材マスタ ↔ 協力会社マスタ',
    sourceTableName: '資機材マスタ',
    targetTableName: '協力会社マスタ',
    sourceFieldName: 'リース元',
    targetFieldName: 'リース中機材',
    description: '機材のリース元協力会社',
  },

  // 工事台帳 ↔ 作業員マスタ（現場責任者）
  {
    name: '工事台帳 ↔ 作業員マスタ（現場責任者）',
    sourceTableName: '工事台帳',
    targetTableName: '作業員マスタ',
    sourceFieldName: '現場責任者',
    targetFieldName: '責任者工事',
    description: '工事の現場責任者',
  },
];

// ========================================
// API関数
// ========================================

async function getAccessToken(): Promise<string> {
  const response = await fetch(`${BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET }),
  });
  const data = await response.json() as { code: number; tenant_access_token?: string; msg?: string };
  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`認証失敗: ${data.msg || '不明なエラー'}`);
  }
  return data.tenant_access_token;
}

async function createBase(token: string, name: string): Promise<{ appToken: string; url: string }> {
  const response = await fetch(`${BASE_URL}/bitable/v1/apps`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  const data = await response.json() as { code: number; data?: { app: { app_token: string; url: string } }; msg?: string };
  if (data.code !== 0 || !data.data) {
    throw new Error(`Base作成失敗: ${data.msg || '不明なエラー'}`);
  }
  return { appToken: data.data.app.app_token, url: data.data.app.url };
}

async function createTable(
  token: string,
  appToken: string,
  table: TableDef
): Promise<string> {
  const response = await fetch(`${BASE_URL}/bitable/v1/apps/${appToken}/tables`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ table: { name: table.name, fields: table.fields } }),
  });
  const data = await response.json() as { code: number; data?: { table_id: string }; msg?: string };
  if (data.code !== 0 || !data.data) {
    throw new Error(`テーブル作成失敗(${table.name}): ${data.msg || '不明なエラー'}`);
  }
  return data.data.table_id;
}

async function createView(
  token: string,
  appToken: string,
  tableId: string,
  viewName: string,
  viewType: string
): Promise<string> {
  const response = await fetch(
    `${BASE_URL}/bitable/v1/apps/${appToken}/tables/${tableId}/views`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ view_name: viewName, view_type: viewType }),
    }
  );
  const data = await response.json() as { code: number; data?: { view: { view_id: string } }; msg?: string };
  if (data.code !== 0) {
    console.log(`      ⚠️  ビュー作成スキップ: ${viewName} (${data.msg || '不明なエラー'})`);
    return '';
  }
  return data.data?.view?.view_id || '';
}

async function createDuplexLinkField(
  token: string,
  appToken: string,
  sourceTableId: string,
  targetTableId: string,
  sourceFieldName: string,
  targetFieldName: string
): Promise<{ success: boolean; fieldId?: string; message?: string }> {
  try {
    const response = await fetch(
      `${BASE_URL}/bitable/v1/apps/${appToken}/tables/${sourceTableId}/fields`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          field_name: sourceFieldName,
          type: F.DUPLEX_LINK,
          property: {
            table_id: targetTableId,
            back_field_name: targetFieldName,
          },
        }),
      }
    );

    const data = await response.json() as {
      code: number;
      data?: { field: { field_id: string } };
      msg?: string;
    };

    if (data.code === 0 && data.data) {
      return { success: true, fieldId: data.data.field.field_id };
    }

    return { success: false, message: data.msg || '不明なエラー' };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '不明なエラー'
    };
  }
}

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
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    }
  );
  const data = await response.json() as { code: number; data?: { records: unknown[] } };
  return data.data?.records?.length || 0;
}

// ========================================
// サンプルデータ投入
// ========================================

async function insertSampleData(
  token: string,
  appToken: string,
  tableIds: Record<string, string>
) {
  console.log('\n📝 サンプルデータ投入中...\n');

  // 作業員マスタ
  let count = await batchCreateRecords(token, appToken, tableIds['作業員マスタ'], [
    { fields: { '社員番号': 'E001', '氏名': '山田太郎', '所属': '建築部', '保有資格': ['1級建築施工管理技士', '安全衛生責任者'], '電話番号': '090-1234-5678', '在籍状況': '在籍' }},
    { fields: { '社員番号': 'E002', '氏名': '佐藤花子', '所属': '建築部', '保有資格': ['1級建築士', '2級建築施工管理技士'], '電話番号': '090-2345-6789', '在籍状況': '在籍' }},
    { fields: { '社員番号': 'E003', '氏名': '鈴木一郎', '所属': '土木部', '保有資格': ['1級土木施工管理技士'], '電話番号': '090-3456-7890', '在籍状況': '在籍' }},
  ]);
  console.log(`  ✅ 作業員マスタ: ${count}件`);

  // 協力会社マスタ
  count = await batchCreateRecords(token, appToken, tableIds['協力会社マスタ'], [
    { fields: { '会社名': '東建工業株式会社', '代表者名': '田中建太', '専門工種': ['とび・土工', '型枠'], '評価ランク': 'A', '電話番号': '03-1234-5678', '労災保険加入': true }},
    { fields: { '会社名': '鉄筋工業株式会社', '代表者名': '鈴木鉄男', '専門工種': ['鉄筋'], '評価ランク': 'A', '電話番号': '03-2345-6789', '労災保険加入': true }},
    { fields: { '会社名': '株式会社西電設', '代表者名': '西村電次', '専門工種': ['電気'], '評価ランク': 'S', '電話番号': '03-3456-7890', '労災保険加入': true }},
  ]);
  console.log(`  ✅ 協力会社マスタ: ${count}件`);

  // 資機材マスタ
  count = await batchCreateRecords(token, appToken, tableIds['資機材マスタ'], [
    { fields: { '資機材名': 'バックホー 0.7m3', '分類': '重機', 'メーカー': 'コマツ', '型番': 'PC200', '保有数量': 3, '使用中数量': 1, '状態': '使用可能', '保管場所': '本社資材置場' }},
    { fields: { '資機材名': 'クレーン車 25t', '分類': '揚重機', 'メーカー': 'タダノ', '型番': 'GR-250', '保有数量': 2, '使用中数量': 1, '状態': '使用中', '保管場所': '本社資材置場' }},
    { fields: { '資機材名': '鋼製足場', '分類': '足場・仮設', 'メーカー': 'アルインコ', '保有数量': 500, '使用中数量': 350, '状態': '使用可能', '保管場所': '本社資材置場' }},
  ]);
  console.log(`  ✅ 資機材マスタ: ${count}件`);

  // 工事台帳
  count = await batchCreateRecords(token, appToken, tableIds['工事台帳'], [
    { fields: { '工事名': 'オフィスビル新築工事', '発注者名': '株式会社開発', '契約金額': 2500000000, '契約日': Date.now(), '着工日': Date.now(), '竣工予定日': Date.now() + 365 * 24 * 60 * 60 * 1000, '進捗状況': '施工中', '全体進捗率': 25, '現場住所': '東京都千代田区丸の内1-1-1' }},
    { fields: { '工事名': '橋梁補修工事', '発注者名': '国土交通省', '契約金額': 180000000, '契約日': Date.now(), '着工日': Date.now(), '竣工予定日': Date.now() + 180 * 24 * 60 * 60 * 1000, '進捗状況': '準備中', '全体進捗率': 0, '現場住所': '埼玉県さいたま市緑区1-1' }},
  ]);
  console.log(`  ✅ 工事台帳: ${count}件`);

  // 工程表
  count = await batchCreateRecords(token, appToken, tableIds['工程表'], [
    { fields: { '工程名': '仮設工事', '工程分類': '仮設工', '予定開始日': Date.now(), '予定終了日': Date.now() + 30 * 24 * 60 * 60 * 1000, '進捗率': 100, 'ステータス': '完了', '作業内容': '仮囲い設置、仮設事務所設置' }},
    { fields: { '工程名': '基礎工事', '工程分類': '基礎工', '予定開始日': Date.now(), '予定終了日': Date.now() + 90 * 24 * 60 * 60 * 1000, '進捗率': 40, 'ステータス': '進行中', '作業内容': '基礎配筋、基礎コンクリート打設' }},
    { fields: { '工程名': '躯体工事', '工程分類': '躯体工', '予定開始日': Date.now() + 60 * 24 * 60 * 60 * 1000, '予定終了日': Date.now() + 200 * 24 * 60 * 60 * 1000, '進捗率': 0, 'ステータス': '未着手', '作業内容': '型枠組立、鉄筋配筋、コンクリート打設' }},
  ]);
  console.log(`  ✅ 工程表: ${count}件`);

  // 日報
  count = await batchCreateRecords(token, appToken, tableIds['日報'], [
    { fields: { '日付': Date.now(), '天候': '晴れ', '気温': 22, '本日の作業内容': '基礎配筋作業、配筋検査', '作業人数': 15, '進捗メモ': '予定通り進捗', '承認状態': '承認済' }},
    { fields: { '日付': Date.now() - 24 * 60 * 60 * 1000, '天候': '曇り', '気温': 18, '本日の作業内容': '仮設事務所設置完了', '作業人数': 8, '進捗メモ': '完了', '承認状態': '承認済' }},
  ]);
  console.log(`  ✅ 日報: ${count}件`);

  console.log('\n✅ サンプルデータ投入完了\n');
}

// ========================================
// メイン処理
// ========================================

async function main() {
  console.log('\n' + '═'.repeat(80));
  console.log('  建設業版Lark Base - 完全セットアップスクリプト');
  console.log('  6テーブル + 14双方向リレーション + 適切なビュー自動生成');
  console.log('═'.repeat(80) + '\n');

  const startTime = Date.now();

  try {
    // 認証
    console.log('🔑 認証中...');
    const token = await getAccessToken();
    console.log('✅ 認証成功\n');

    // Base作成
    console.log('📦 Base作成中...');
    const { appToken, url } = await createBase(token, '建設業工事管理システム');
    console.log(`✅ Base作成完了: ${url}\n`);

    // テーブル作成
    console.log(`📊 テーブル作成中 (全${TABLES.length}テーブル)...\n`);
    const tableIds: Record<string, string> = {};

    for (const table of TABLES) {
      console.log(`  📋 ${table.name} 作成中...`);
      const tableId = await createTable(token, appToken, table);
      tableIds[table.name] = tableId;
      console.log(`    ✅ テーブルID: ${tableId}`);

      // ビュー作成
      if (table.views && table.views.length > 0) {
        console.log(`    📊 ビュー作成中...`);
        for (const view of table.views) {
          await createView(token, appToken, tableId, view.name, view.type);
          await new Promise(resolve => setTimeout(resolve, 300)); // API制限回避
        }
      }

      console.log('');
      await new Promise(resolve => setTimeout(resolve, 500)); // API制限回避
    }

    console.log('✅ 全テーブル作成完了\n');

    // 双方向リレーション設定
    console.log(`🔗 双方向リレーション設定中 (全${RELATIONS.length}件)...\n`);
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (let i = 0; i < RELATIONS.length; i++) {
      const rel = RELATIONS[i];
      const progress = `[${i + 1}/${RELATIONS.length}]`;

      process.stdout.write(`  ${progress} ${rel.name}... `);

      const result = await createDuplexLinkField(
        token,
        appToken,
        tableIds[rel.sourceTableName],
        tableIds[rel.targetTableName],
        rel.sourceFieldName,
        rel.targetFieldName
      );

      if (result.success) {
        console.log('✅');
        successCount++;
      } else if (
        result.message?.includes('already exists') ||
        result.message?.includes('duplicate') ||
        result.message?.includes('既存')
      ) {
        console.log('⏭️  (既存)');
        skipCount++;
      } else {
        console.log(`❌ (${result.message})`);
        failCount++;
      }

      await new Promise(resolve => setTimeout(resolve, 500)); // API制限回避
    }

    console.log('\n✅ 双方向リレーション設定完了');
    console.log(`  - 新規作成: ${successCount}件`);
    console.log(`  - スキップ: ${skipCount}件`);
    console.log(`  - 失敗: ${failCount}件\n`);

    // サンプルデータ投入（オプション）
    const shouldInsertSampleData = process.argv.includes('--sample-data');
    if (shouldInsertSampleData) {
      await insertSampleData(token, appToken, tableIds);
    } else {
      console.log('ℹ️  サンプルデータはスキップされました（--sample-data オプションで投入可能）\n');
    }

    // .env更新
    console.log('💾 .env更新中...');
    let newEnvContent = `# =============================================
# 建設業版Lark Base - 自動生成設定
# Generated at ${new Date().toISOString()}
# =============================================

# Lark API認証情報
LARK_APP_ID=${LARK_APP_ID}
LARK_APP_SECRET=${LARK_APP_SECRET}

# Base App Token
LARK_BASE_APP_TOKEN=${appToken}
LARK_BASE_URL=${url}

# テーブルID
`;
    Object.entries(tableIds).forEach(([name, id]) => {
      const key = name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
      newEnvContent += `LARK_TABLE_${key}=${id}\n`;
    });

    writeFileSync(envPath, newEnvContent, 'utf-8');
    console.log('✅ .env更新完了\n');

    // 完了レポート
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('═'.repeat(80));
    console.log('  ✨ セットアップ完了');
    console.log('═'.repeat(80));
    console.log(`
📎 Base URL: ${url}
📦 App Token: ${appToken}
⏱️  実行時間: ${elapsed}秒

📋 作成されたテーブル: ${TABLES.length}個
🔗 設定されたリレーション: ${successCount}件

【テーブル一覧】
`);
    TABLES.forEach((table, i) => {
      console.log(`  ${i + 1}. ${table.name} - ${table.description}`);
    });

    console.log('\n【双方向リレーション一覧】\n');
    RELATIONS.forEach((rel, i) => {
      console.log(`  ${i + 1}. ${rel.name}`);
      console.log(`     ${rel.sourceFieldName} ↔ ${rel.targetFieldName}`);
      console.log(`     ${rel.description}\n`);
    });

    console.log('═'.repeat(80));
    console.log('');
    console.log('🎉 ブラウザで Base を開いてください');
    console.log(`   ${url}`);
    console.log('');
    console.log('💡 次回サンプルデータを投入する場合:');
    console.log('   npx tsx scripts/construction-standard-setup.ts --sample-data');
    console.log('');

  } catch (error) {
    console.error('\n❌ エラー:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

// 実行
main();
