#!/usr/bin/env npx tsx
/**
 * Lark Base 完全版双方向リレーション設定スクリプト
 *
 * 全17テーブル間の論理的リレーションを双方向リンク（type: 21）で完全設定
 *
 * テーブル構成:
 * 【マスタ系】
 *  1. 発注者マスタ (tblPAVzmHZww2bwF)
 *  2. 資格者マスタ (tblqnOY8S3kl2UWa)
 *  3. 協力会社マスタ (tblcUqUzzj4TyaF2)
 *  4. 資機材マスタ (tblUpCKolVWGNVVl)
 *  5. 工種マスタ (tblE5NcaoSreHiiF)
 *
 * 【案件・契約系】
 *  6. 案件情報 (tblAO99IUW4DDbWc)
 *  7. 工事契約 (tblzeXSOwQjTY5wt)
 *
 * 【工程系】
 *  8. 大工程 (tbln82ijUjFqUHEe)
 *  9. 中工程 (tbl9s3ZtsNZzncSl)
 * 10. 小工程 (tblM4zC4WQJTzx8Q)
 *
 * 【配置・発注系】
 * 11. 人員配置 (tblLQbNfEB6Bbimr)
 * 12. 機材配置 (tblfV3nrS96l4W0M)
 * 13. 協力会社発注 (tblvBHf9bfIES2mw)
 *
 * 【実績・記録系】
 * 14. 作業日報 (tblN7noQWwpz1ZUh)
 * 15. 安全パトロール (tblncJrCIw6mWUJa)
 * 16. KY活動記録 (tblXVVqEJu9OLIKv)
 * 17. 検査記録 (tbld5NUYtR5WuwJJ)
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// 環境変数読み込み
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

// テーブルID定義
const TABLES = {
  // マスタ系
  発注者マスタ: 'tblPAVzmHZww2bwF',
  資格者マスタ: 'tblqnOY8S3kl2UWa',
  協力会社マスタ: 'tblcUqUzzj4TyaF2',
  資機材マスタ: 'tblUpCKolVWGNVVl',
  工種マスタ: 'tblE5NcaoSreHiiF',

  // 案件・契約系
  案件情報: 'tblAO99IUW4DDbWc',
  工事契約: 'tblzeXSOwQjTY5wt',

  // 工程系
  大工程: 'tbln82ijUjFqUHEe',
  中工程: 'tbl9s3ZtsNZzncSl',
  小工程: 'tblM4zC4WQJTzx8Q',

  // 配置・発注系
  人員配置: 'tblLQbNfEB6Bbimr',
  機材配置: 'tblfV3nrS96l4W0M',
  協力会社発注: 'tblvBHf9bfIES2mw',

  // 実績・記録系
  作業日報: 'tblN7noQWwpz1ZUh',
  安全パトロール: 'tblncJrCIw6mWUJa',
  KY活動記録: 'tblXVVqEJu9OLIKv',
  検査記録: 'tbld5NUYtR5WuwJJ',
} as const;

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
} as const;

interface RelationDef {
  name: string;
  category: string;
  sourceTable: string;
  targetTable: string;
  sourceFieldName: string;
  targetFieldName: string;
  description: string;
  businessLogic: string;
}

/**
 * 完全版双方向リレーション定義
 *
 * 設計方針:
 * 1. ビジネスフローに沿った自然なリレーション
 * 2. マスタ→トランザクションの参照関係
 * 3. 階層構造（案件→契約→工程→実績）
 * 4. 配置情報によるリソース管理
 */
const COMPLETE_RELATIONS: RelationDef[] = [

  // ========================================
  // グループ1: 案件→契約の流れ
  // ========================================
  {
    name: '案件情報↔発注者マスタ',
    category: '案件・契約',
    sourceTable: TABLES.案件情報,
    targetTable: TABLES.発注者マスタ,
    sourceFieldName: '発注者',
    targetFieldName: '関連案件',
    description: '案件の発注者情報',
    businessLogic: '案件の商談段階から発注者を紐付ける',
  },
  {
    name: '案件情報↔工事契約',
    category: '案件・契約',
    sourceTable: TABLES.案件情報,
    targetTable: TABLES.工事契約,
    sourceFieldName: '契約情報',
    targetFieldName: '元案件',
    description: '案件から契約への変換',
    businessLogic: '商談成立後、案件が契約に移行する',
  },
  {
    name: '工事契約↔発注者マスタ',
    category: '案件・契約',
    sourceTable: TABLES.工事契約,
    targetTable: TABLES.発注者マスタ,
    sourceFieldName: '発注者',
    targetFieldName: '契約履歴',
    description: '契約の発注者情報',
    businessLogic: '契約書に記載される発注者',
  },
  {
    name: '工事契約↔資格者マスタ（現場責任者）',
    category: '案件・契約',
    sourceTable: TABLES.工事契約,
    targetTable: TABLES.資格者マスタ,
    sourceFieldName: '現場責任者',
    targetFieldName: '責任者として担当した工事',
    description: '工事の現場責任者',
    businessLogic: '各工事に現場所長を配置',
  },

  // ========================================
  // グループ2: 工程階層構造
  // ========================================
  {
    name: '工事契約↔大工程',
    category: '工程管理',
    sourceTable: TABLES.工事契約,
    targetTable: TABLES.大工程,
    sourceFieldName: '関連大工程',
    targetFieldName: '所属工事',
    description: '工事契約に紐づく大工程一覧',
    businessLogic: '工事を大工程に分解（準備工、基礎工、躯体工など）',
  },
  {
    name: '大工程↔中工程',
    category: '工程管理',
    sourceTable: TABLES.大工程,
    targetTable: TABLES.中工程,
    sourceFieldName: '関連中工程',
    targetFieldName: '所属大工程',
    description: '大工程に紐づく中工程一覧',
    businessLogic: '大工程をさらに詳細な中工程に分解',
  },
  {
    name: '中工程↔小工程',
    category: '工程管理',
    sourceTable: TABLES.中工程,
    targetTable: TABLES.小工程,
    sourceFieldName: '関連小工程',
    targetFieldName: '所属中工程',
    description: '中工程に紐づく小工程一覧',
    businessLogic: '中工程を実作業単位の小工程に分解',
  },
  {
    name: '小工程↔工種マスタ',
    category: '工程管理',
    sourceTable: TABLES.小工程,
    targetTable: TABLES.工種マスタ,
    sourceFieldName: '工種',
    targetFieldName: '使用実績',
    description: '小工程の工種分類',
    businessLogic: '各作業を工種（型枠、鉄筋、コンクリートなど）に分類',
  },

  // ========================================
  // グループ3: リソース配置（人員）
  // ========================================
  {
    name: '小工程↔人員配置',
    category: 'リソース管理',
    sourceTable: TABLES.小工程,
    targetTable: TABLES.人員配置,
    sourceFieldName: '配置人員',
    targetFieldName: '配置先工程',
    description: '小工程に配置された人員',
    businessLogic: '作業に必要な人員を配置',
  },
  {
    name: '人員配置↔資格者マスタ',
    category: 'リソース管理',
    sourceTable: TABLES.人員配置,
    targetTable: TABLES.資格者マスタ,
    sourceFieldName: '作業者',
    targetFieldName: '配置履歴',
    description: '配置された作業者の詳細情報',
    businessLogic: '資格保有者を適切な工程に配置',
  },
  {
    name: '大工程↔人員配置',
    category: 'リソース管理',
    sourceTable: TABLES.大工程,
    targetTable: TABLES.人員配置,
    sourceFieldName: '大工程の配置人員',
    targetFieldName: '配置先大工程',
    description: '大工程レベルでの人員配置',
    businessLogic: '大工程全体の人員計画',
  },

  // ========================================
  // グループ4: リソース配置（機材）
  // ========================================
  {
    name: '小工程↔機材配置',
    category: 'リソース管理',
    sourceTable: TABLES.小工程,
    targetTable: TABLES.機材配置,
    sourceFieldName: '使用機材',
    targetFieldName: '配置先工程',
    description: '小工程で使用する機材',
    businessLogic: '作業に必要な機材を配置',
  },
  {
    name: '機材配置↔資機材マスタ',
    category: 'リソース管理',
    sourceTable: TABLES.機材配置,
    targetTable: TABLES.資機材マスタ,
    sourceFieldName: '機材',
    targetFieldName: '配置履歴',
    description: '配置された機材の詳細情報',
    businessLogic: '保有機材を工程に割り当て',
  },
  {
    name: '大工程↔機材配置',
    category: 'リソース管理',
    sourceTable: TABLES.大工程,
    targetTable: TABLES.機材配置,
    sourceFieldName: '大工程の使用機材',
    targetFieldName: '配置先大工程',
    description: '大工程レベルでの機材配置',
    businessLogic: '大工程全体の機材計画',
  },

  // ========================================
  // グループ5: 協力会社発注
  // ========================================
  {
    name: '小工程↔協力会社発注',
    category: '外注管理',
    sourceTable: TABLES.小工程,
    targetTable: TABLES.協力会社発注,
    sourceFieldName: '協力会社発注',
    targetFieldName: '対象工程',
    description: '小工程の外注発注情報',
    businessLogic: '自社施工できない工程を協力会社に発注',
  },
  {
    name: '協力会社発注↔協力会社マスタ',
    category: '外注管理',
    sourceTable: TABLES.協力会社発注,
    targetTable: TABLES.協力会社マスタ,
    sourceFieldName: '発注先',
    targetFieldName: '受注履歴',
    description: '発注先の協力会社情報',
    businessLogic: '専門工事業者に作業を委託',
  },
  {
    name: '工事契約↔協力会社発注',
    category: '外注管理',
    sourceTable: TABLES.工事契約,
    targetTable: TABLES.協力会社発注,
    sourceFieldName: '全協力会社発注',
    targetFieldName: '親工事契約',
    description: '工事全体の協力会社発注一覧',
    businessLogic: '工事単位での外注管理',
  },

  // ========================================
  // グループ6: 作業実績記録
  // ========================================
  {
    name: '小工程↔作業日報',
    category: '実績記録',
    sourceTable: TABLES.小工程,
    targetTable: TABLES.作業日報,
    sourceFieldName: '作業日報',
    targetFieldName: '対象工程',
    description: '小工程の日次作業記録',
    businessLogic: '毎日の作業内容と進捗を記録',
  },
  {
    name: '作業日報↔資格者マスタ',
    category: '実績記録',
    sourceTable: TABLES.作業日報,
    targetTable: TABLES.資格者マスタ,
    sourceFieldName: '作業者',
    targetFieldName: '日報記録',
    description: '日報記入者・作業者',
    businessLogic: '誰がどの作業をしたか記録',
  },
  {
    name: '作業日報↔協力会社マスタ',
    category: '実績記録',
    sourceTable: TABLES.作業日報,
    targetTable: TABLES.協力会社マスタ,
    sourceFieldName: '協力会社作業者',
    targetFieldName: '作業実績',
    description: '協力会社の作業実績',
    businessLogic: '協力会社の稼働実績を記録',
  },
  {
    name: '工事契約↔作業日報',
    category: '実績記録',
    sourceTable: TABLES.工事契約,
    targetTable: TABLES.作業日報,
    sourceFieldName: '全日報',
    targetFieldName: '所属工事',
    description: '工事全体の日報一覧',
    businessLogic: '工事単位での日報管理',
  },

  // ========================================
  // グループ7: 安全管理
  // ========================================
  {
    name: '工事契約↔安全パトロール',
    category: '安全管理',
    sourceTable: TABLES.工事契約,
    targetTable: TABLES.安全パトロール,
    sourceFieldName: '安全パトロール記録',
    targetFieldName: '対象工事',
    description: '工事の安全パトロール実施記録',
    businessLogic: '定期的な安全巡回の記録',
  },
  {
    name: '安全パトロール↔資格者マスタ',
    category: '安全管理',
    sourceTable: TABLES.安全パトロール,
    targetTable: TABLES.資格者マスタ,
    sourceFieldName: 'パトロール実施者',
    targetFieldName: 'パトロール実施履歴',
    description: 'パトロール実施者',
    businessLogic: '安全管理者が実施',
  },
  {
    name: '小工程↔安全パトロール',
    category: '安全管理',
    sourceTable: TABLES.小工程,
    targetTable: TABLES.安全パトロール,
    sourceFieldName: '安全パトロール',
    targetFieldName: '対象工程',
    description: '工程別の安全パトロール',
    businessLogic: '各工程の安全状況を確認',
  },
  {
    name: '工事契約↔KY活動記録',
    category: '安全管理',
    sourceTable: TABLES.工事契約,
    targetTable: TABLES.KY活動記録,
    sourceFieldName: 'KY活動記録',
    targetFieldName: '対象工事',
    description: '工事のKY活動実施記録',
    businessLogic: '危険予知活動の実施記録',
  },
  {
    name: '小工程↔KY活動記録',
    category: '安全管理',
    sourceTable: TABLES.小工程,
    targetTable: TABLES.KY活動記録,
    sourceFieldName: 'KY活動',
    targetFieldName: '対象工程',
    description: '工程別のKY活動',
    businessLogic: '作業開始前の危険予知',
  },
  {
    name: 'KY活動記録↔資格者マスタ',
    category: '安全管理',
    sourceTable: TABLES.KY活動記録,
    targetTable: TABLES.資格者マスタ,
    sourceFieldName: '参加者',
    targetFieldName: 'KY活動参加履歴',
    description: 'KY活動の参加者',
    businessLogic: '作業員全員でリスクを共有',
  },

  // ========================================
  // グループ8: 品質管理
  // ========================================
  {
    name: '小工程↔検査記録',
    category: '品質管理',
    sourceTable: TABLES.小工程,
    targetTable: TABLES.検査記録,
    sourceFieldName: '検査記録',
    targetFieldName: '対象工程',
    description: '工程の品質検査記録',
    businessLogic: '各工程の完了時に検査実施',
  },
  {
    name: '検査記録↔資格者マスタ',
    category: '品質管理',
    sourceTable: TABLES.検査記録,
    targetTable: TABLES.資格者マスタ,
    sourceFieldName: '検査実施者',
    targetFieldName: '検査実施履歴',
    description: '検査実施者',
    businessLogic: '有資格者が検査を実施',
  },
  {
    name: '工事契約↔検査記録',
    category: '品質管理',
    sourceTable: TABLES.工事契約,
    targetTable: TABLES.検査記録,
    sourceFieldName: '全検査記録',
    targetFieldName: '所属工事',
    description: '工事全体の検査記録一覧',
    businessLogic: '工事単位での品質管理',
  },

  // ========================================
  // グループ9: 追加の横断的リレーション
  // ========================================
  {
    name: '大工程↔作業日報',
    category: '横断管理',
    sourceTable: TABLES.大工程,
    targetTable: TABLES.作業日報,
    sourceFieldName: '大工程の日報',
    targetFieldName: '所属大工程',
    description: '大工程レベルの日報集計',
    businessLogic: '大工程単位での進捗把握',
  },
  {
    name: '中工程↔作業日報',
    category: '横断管理',
    sourceTable: TABLES.中工程,
    targetTable: TABLES.作業日報,
    sourceFieldName: '中工程の日報',
    targetFieldName: '所属中工程',
    description: '中工程レベルの日報集計',
    businessLogic: '中工程単位での進捗把握',
  },
];

/**
 * アクセストークン取得
 */
async function getAccessToken(): Promise<string> {
  const response = await fetch(`${BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET }),
  });

  const data = await response.json() as {
    code: number;
    tenant_access_token?: string;
    msg?: string;
  };

  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`認証失敗: ${data.msg || '不明なエラー'}`);
  }

  return data.tenant_access_token;
}

/**
 * 双方向リンクフィールドを作成
 */
async function createDuplexLinkField(
  token: string,
  tableId: string,
  fieldName: string,
  linkedTableId: string,
  linkedFieldName: string
): Promise<{ success: boolean; fieldId?: string; message?: string }> {
  try {
    const response = await fetch(
      `${BASE_URL}/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/fields`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
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

/**
 * メイン処理
 */
async function main() {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('  🏗️  Lark Base 完全版双方向リレーション設定');
  console.log('  全17テーブル × 完全網羅設計');
  console.log('═'.repeat(80));
  console.log('\n');

  // 認証
  const token = await getAccessToken();
  console.log('✅ 認証成功\n');

  // 統計情報
  const stats = {
    total: COMPLETE_RELATIONS.length,
    success: 0,
    skipped: 0,
    failed: 0,
    byCategory: new Map<string, { success: number; total: number }>(),
  };

  console.log(`📊 設定するリレーション: ${stats.total}件\n`);
  console.log('カテゴリ別内訳:');
  COMPLETE_RELATIONS.forEach(r => {
    const cat = stats.byCategory.get(r.category) || { success: 0, total: 0 };
    cat.total++;
    stats.byCategory.set(r.category, cat);
  });
  stats.byCategory.forEach((count, category) => {
    console.log(`  - ${category}: ${count.total}件`);
  });
  console.log('\n');

  console.log('🔗 リレーション設定開始...\n');
  console.log('-'.repeat(80));

  // リレーション作成
  for (let i = 0; i < COMPLETE_RELATIONS.length; i++) {
    const relation = COMPLETE_RELATIONS[i];
    const progress = `[${i + 1}/${stats.total}]`;

    process.stdout.write(`${progress} ${relation.name}... `);

    const result = await createDuplexLinkField(
      token,
      relation.sourceTable,
      relation.sourceFieldName,
      relation.targetTable,
      relation.targetFieldName
    );

    if (result.success) {
      console.log('✅ 作成完了');
      stats.success++;
      const cat = stats.byCategory.get(relation.category)!;
      cat.success++;
    } else if (
      result.message?.includes('already exists') ||
      result.message?.includes('duplicate') ||
      result.message?.includes('既存')
    ) {
      console.log('⏭️  既存（スキップ）');
      stats.skipped++;
    } else {
      console.log(`❌ エラー: ${result.message}`);
      stats.failed++;
    }

    // API制限回避（500ms待機）
    if (i < COMPLETE_RELATIONS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('-'.repeat(80));
  console.log('\n');

  // 結果サマリー
  console.log('═'.repeat(80));
  console.log('  ✨ リレーション設定完了');
  console.log('═'.repeat(80));
  console.log('\n');
  console.log('📊 実行結果:');
  console.log(`  ✅ 新規作成: ${stats.success}件`);
  console.log(`  ⏭️  スキップ: ${stats.skipped}件`);
  console.log(`  ❌ 失敗: ${stats.failed}件`);
  console.log(`  📝 合計: ${stats.total}件`);
  console.log('\n');

  console.log('📊 カテゴリ別成功率:');
  stats.byCategory.forEach((count, category) => {
    const rate = ((count.success / count.total) * 100).toFixed(1);
    console.log(`  - ${category}: ${count.success}/${count.total}件 (${rate}%)`);
  });
  console.log('\n');

  // 設定されたリレーション一覧
  console.log('═'.repeat(80));
  console.log('  📋 設定されたリレーション一覧（グループ別）');
  console.log('═'.repeat(80));
  console.log('\n');

  const groupedRelations = new Map<string, RelationDef[]>();
  COMPLETE_RELATIONS.forEach(r => {
    const group = groupedRelations.get(r.category) || [];
    group.push(r);
    groupedRelations.set(r.category, group);
  });

  groupedRelations.forEach((relations, category) => {
    console.log(`【${category}】`);
    relations.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.name}`);
      console.log(`     ${r.sourceFieldName} ↔ ${r.targetFieldName}`);
      console.log(`     ${r.description}`);
      console.log(`     💡 ${r.businessLogic}`);
      console.log('');
    });
  });

  console.log('═'.repeat(80));
  console.log('  🎉 全設定完了！');
  console.log('═'.repeat(80));
  console.log('\n');
}

// 実行
main().catch(error => {
  console.error('\n❌ エラー発生:', error);
  process.exit(1);
});
