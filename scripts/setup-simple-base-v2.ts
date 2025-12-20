#!/usr/bin/env npx tsx
/**
 * シンプル建設業務管理パッケージ v2.0 セットアップ (新規作成)
 * 既存テーブルとの重複を避けるため "v2" サフィックス付き
 */

import 'dotenv/config';
import { LarkClient, FIELD_TYPES } from '../src/api/lark-client.js';

interface TableCreationResult {
  tableName: string;
  tableId: string;
  success: boolean;
  error?: string;
}

async function main() {
  console.log('🏗️  シンプル建設業務管理パッケージ v2.0 セットアップ (新規)\n');
  console.log('━'.repeat(50));

  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;
  const appToken = process.env.LARK_BASE_APP_TOKEN;

  if (!appId || !appSecret || !appToken) {
    console.error('❌ 環境変数が設定されていません');
    process.exit(1);
  }

  const client = new LarkClient({ appId, appSecret });
  const results: TableCreationResult[] = [];

  // 1. 従業員マスタ v2
  console.log('\n📋 1/5 従業員マスタ v2 を作成中...');
  try {
    const response = await client.createTable(appToken, '従業員マスタ v2', [
      { field_name: '社員番号', type: FIELD_TYPES.TEXT },
      { field_name: '氏名', type: FIELD_TYPES.TEXT },
      { field_name: 'フリガナ', type: FIELD_TYPES.TEXT },
      { field_name: '所属', type: FIELD_TYPES.SELECT, property: {
        options: [
          { name: '建築部' }, { name: '土木部' }, { name: '設備部' }, { name: '管理部' }, { name: '営業部' }
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

    if (response.code === 0) {
      results.push({ tableName: '従業員マスタ v2', tableId: response.data.table_id, success: true });
      console.log(`   ✅ 作成完了: ${response.data.table_id}`);
    } else {
      throw new Error(response.msg);
    }
  } catch (error) {
    results.push({ tableName: '従業員マスタ v2', tableId: '', success: false, error: (error as Error).message });
    console.log(`   ❌ 失敗: ${(error as Error).message}`);
  }

  // 2. 資格マスタ v2
  console.log('\n📋 2/5 資格マスタ v2 を作成中...');
  try {
    const response = await client.createTable(appToken, '資格マスタ v2', [
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

    if (response.code === 0) {
      results.push({ tableName: '資格マスタ v2', tableId: response.data.table_id, success: true });
      console.log(`   ✅ 作成完了: ${response.data.table_id}`);
    } else {
      throw new Error(response.msg);
    }
  } catch (error) {
    results.push({ tableName: '資格マスタ v2', tableId: '', success: false, error: (error as Error).message });
    console.log(`   ❌ 失敗: ${(error as Error).message}`);
  }

  // 3. 資格記録 v2
  console.log('\n📋 3/5 資格記録 v2 を作成中...');
  try {
    const response = await client.createTable(appToken, '資格記録 v2', [
      { field_name: '従業員名', type: FIELD_TYPES.TEXT },
      { field_name: '資格名', type: FIELD_TYPES.TEXT },
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

    if (response.code === 0) {
      results.push({ tableName: '資格記録 v2', tableId: response.data.table_id, success: true });
      console.log(`   ✅ 作成完了: ${response.data.table_id}`);
    } else {
      throw new Error(response.msg);
    }
  } catch (error) {
    results.push({ tableName: '資格記録 v2', tableId: '', success: false, error: (error as Error).message });
    console.log(`   ❌ 失敗: ${(error as Error).message}`);
  }

  // 4. 案件管理 v2
  console.log('\n📋 4/5 案件管理 v2 を作成中...');
  try {
    const response = await client.createTable(appToken, '案件管理 v2', [
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
      { field_name: '責任者', type: FIELD_TYPES.TEXT },
      { field_name: '担当者', type: FIELD_TYPES.TEXT },
      { field_name: '備考', type: FIELD_TYPES.TEXT },
    ]);

    if (response.code === 0) {
      results.push({ tableName: '案件管理 v2', tableId: response.data.table_id, success: true });
      console.log(`   ✅ 作成完了: ${response.data.table_id}`);
    } else {
      throw new Error(response.msg);
    }
  } catch (error) {
    results.push({ tableName: '案件管理 v2', tableId: '', success: false, error: (error as Error).message });
    console.log(`   ❌ 失敗: ${(error as Error).message}`);
  }

  // 5. 工程管理 v2
  console.log('\n📋 5/5 工程管理 v2 を作成中...');
  try {
    const response = await client.createTable(appToken, '工程管理 v2', [
      { field_name: '案件名', type: FIELD_TYPES.TEXT },
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
      { field_name: '担当者', type: FIELD_TYPES.TEXT },
      { field_name: '必要資格', type: FIELD_TYPES.TEXT },
      { field_name: '備考', type: FIELD_TYPES.TEXT },
    ]);

    if (response.code === 0) {
      results.push({ tableName: '工程管理 v2', tableId: response.data.table_id, success: true });
      console.log(`   ✅ 作成完了: ${response.data.table_id}`);
    } else {
      throw new Error(response.msg);
    }
  } catch (error) {
    results.push({ tableName: '工程管理 v2', tableId: '', success: false, error: (error as Error).message });
    console.log(`   ❌ 失敗: ${(error as Error).message}`);
  }

  // 結果サマリー
  console.log('\n' + '━'.repeat(50));
  const successCount = results.filter(r => r.success).length;

  if (successCount > 0) {
    console.log('\n📝 .env に追加する設定:\n');
    console.log('# シンプル建設業務管理パッケージ v2.0');
    for (const result of results) {
      if (result.success) {
        const envKey = `LARK_TABLE_${result.tableName.replace(/[（）\sv]/g, '').toUpperCase()}`;
        console.log(`${envKey}=${result.tableId}`);
      }
    }
  }

  console.log('\n' + '━'.repeat(50));
  console.log(`✨ セットアップ完了！ (${successCount}/5 成功)\n`);
}

main().catch(console.error);
