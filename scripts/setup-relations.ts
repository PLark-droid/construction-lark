#!/usr/bin/env npx tsx
/**
 * Lark Base 双方向リレーション設定スクリプト
 *
 * Miyabi Agent - Larkマスター統括
 *
 * リレーション設計:
 * ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
 * │  工事契約   │────→│   大工程    │────→│   中工程    │────→│   小工程    │
 * └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
 *                                                                    │
 *                     ┌─────────────┐                               │
 *                     │ 資機材マスタ │←────────┐                    │
 *                     └─────────────┘         │                    │
 *                                            ┌┴────────────┐       │
 *                     ┌─────────────┐        │  機材配置   │←──────┤
 *                     │ 資格者マスタ │←──┐   └─────────────┘       │
 *                     └─────────────┘   │                         │
 *                                      ┌┴────────────┐            │
 *                                      │  人員配置   │←───────────┘
 *                                      └─────────────┘
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

// テーブルID
const TABLES = {
  発注者マスタ: 'tblPAVzmHZww2bwF',
  資格者マスタ: 'tblqnOY8S3kl2UWa',
  協力会社マスタ: 'tblcUqUzzj4TyaF2',
  資機材マスタ: 'tblUpCKolVWGNVVl',
  工種マスタ: 'tblE5NcaoSreHiiF',
  案件情報: 'tblAO99IUW4DDbWc',
  工事契約: 'tblzeXSOwQjTY5wt',
  大工程: 'tbln82ijUjFqUHEe',
  中工程: 'tbl9s3ZtsNZzncSl',
  小工程: 'tblM4zC4WQJTzx8Q',
  人員配置: 'tblLQbNfEB6Bbimr',
  機材配置: 'tblfV3nrS96l4W0M',
  協力会社発注: 'tblvBHf9bfIES2mw',
};

// フィールドタイプ
const FIELD_TYPES = {
  TEXT: 1,
  NUMBER: 2,
  SELECT: 3,
  MULTI_SELECT: 4,
  DATE: 5,
  CHECKBOX: 7,
  LINK: 18,          // 一方向リンク
  DUPLEX_LINK: 21,   // 双方向リンク
};

interface RelationDef {
  name: string;
  sourceTable: string;
  targetTable: string;
  sourceFieldName: string;
  targetFieldName: string;
  description: string;
}

// 双方向リレーション定義
const RELATIONS: RelationDef[] = [
  {
    name: '工事契約→大工程',
    sourceTable: TABLES.工事契約,
    targetTable: TABLES.大工程,
    sourceFieldName: '関連大工程',
    targetFieldName: '関連工事契約',
    description: '工事契約に紐づく大工程一覧',
  },
  {
    name: '大工程→中工程',
    sourceTable: TABLES.大工程,
    targetTable: TABLES.中工程,
    sourceFieldName: '関連中工程',
    targetFieldName: '関連大工程',
    description: '大工程に紐づく中工程一覧',
  },
  {
    name: '中工程→小工程',
    sourceTable: TABLES.中工程,
    targetTable: TABLES.小工程,
    sourceFieldName: '関連小工程',
    targetFieldName: '関連中工程',
    description: '中工程に紐づく小工程一覧',
  },
  {
    name: '小工程→機材配置',
    sourceTable: TABLES.小工程,
    targetTable: TABLES.機材配置,
    sourceFieldName: '使用機材',
    targetFieldName: '関連工程',
    description: '小工程で使用する機材の配置情報',
  },
  {
    name: '機材配置→資機材マスタ',
    sourceTable: TABLES.機材配置,
    targetTable: TABLES.資機材マスタ,
    sourceFieldName: '資機材マスタ',
    targetFieldName: '配置履歴',
    description: '機材配置と資機材マスタの紐付け',
  },
  {
    name: '小工程→人員配置',
    sourceTable: TABLES.小工程,
    targetTable: TABLES.人員配置,
    sourceFieldName: '配置人員',
    targetFieldName: '関連工程',
    description: '小工程に配置された人員',
  },
  {
    name: '人員配置→資格者マスタ',
    sourceTable: TABLES.人員配置,
    targetTable: TABLES.資格者マスタ,
    sourceFieldName: '資格者マスタ',
    targetFieldName: '配置履歴',
    description: '人員配置と資格者マスタの紐付け',
  },
  {
    name: '小工程→協力会社発注',
    sourceTable: TABLES.小工程,
    targetTable: TABLES.協力会社発注,
    sourceFieldName: '協力会社発注',
    targetFieldName: '関連工程',
    description: '小工程に関連する協力会社発注',
  },
  {
    name: '協力会社発注→協力会社マスタ',
    sourceTable: TABLES.協力会社発注,
    targetTable: TABLES.協力会社マスタ,
    sourceFieldName: '協力会社マスタ',
    targetFieldName: '発注履歴',
    description: '協力会社発注と協力会社マスタの紐付け',
  },
];

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

async function createDuplexLinkField(
  token: string,
  tableId: string,
  fieldName: string,
  linkedTableId: string,
  linkedFieldName: string
): Promise<{ success: boolean; fieldId?: string; message?: string }> {
  const response = await fetch(
    `${BASE_URL}/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/fields`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field_name: fieldName,
        type: FIELD_TYPES.DUPLEX_LINK,
        property: {
          table_id: linkedTableId,
          back_field_name: linkedFieldName,
        },
      }),
    }
  );

  const data = await response.json() as {
    code: number;
    data?: { field: { field_id: string } };
    msg?: string
  };

  if (data.code === 0 && data.data) {
    return { success: true, fieldId: data.data.field.field_id };
  }
  return { success: false, message: data.msg || 'Unknown error' };
}

async function main() {
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('  🔗 Miyabi Agent - Lark Base 双方向リレーション設定');
  console.log('═'.repeat(70));
  console.log('\n');

  const token = await getAccessToken();
  console.log('✅ 認証成功\n');

  console.log('📊 リレーション設計図:\n');
  console.log('  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐');
  console.log('  │  工事契約   │────→│   大工程    │────→│   中工程    │────→│   小工程    │');
  console.log('  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘');
  console.log('                                                                    │');
  console.log('                     ┌─────────────┐                               │');
  console.log('                     │ 資機材マスタ │←────────┐                    │');
  console.log('                     └─────────────┘         │                    │');
  console.log('                                            ┌┴────────────┐       │');
  console.log('                     ┌─────────────┐        │  機材配置   │←──────┤');
  console.log('                     │ 資格者マスタ │←──┐   └─────────────┘       │');
  console.log('                     └─────────────┘   │                         │');
  console.log('                                      ┌┴────────────┐            │');
  console.log('                                      │  人員配置   │←───────────┘');
  console.log('                                      └─────────────┘');
  console.log('\n');

  console.log('🔗 双方向リレーション作成中...\n');

  let successCount = 0;
  let skipCount = 0;

  for (const relation of RELATIONS) {
    process.stdout.write(`  ${relation.name}... `);

    const result = await createDuplexLinkField(
      token,
      relation.sourceTable,
      relation.sourceFieldName,
      relation.targetTable,
      relation.targetFieldName
    );

    if (result.success) {
      console.log(`✅ 作成完了`);
      successCount++;
    } else if (result.message?.includes('already exists') || result.message?.includes('duplicate')) {
      console.log(`⏭️ 既存（スキップ）`);
      skipCount++;
    } else {
      console.log(`⚠️ ${result.message}`);
    }

    // API制限回避
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n');
  console.log('═'.repeat(70));
  console.log(`  ✨ リレーション設定完了`);
  console.log(`     成功: ${successCount}件 / スキップ: ${skipCount}件`);
  console.log('═'.repeat(70));
  console.log('\n');

  console.log('📋 設定されたリレーション一覧:\n');
  RELATIONS.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.sourceFieldName} ↔ ${r.targetFieldName}`);
    console.log(`     ${r.description}\n`);
  });
}

main().catch(console.error);
