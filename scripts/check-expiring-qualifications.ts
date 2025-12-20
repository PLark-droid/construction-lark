#!/usr/bin/env npx tsx
/**
 * 資格期限チェックスクリプト
 * 30日以内に期限切れになる資格を検出してLark通知を送信
 */

import 'dotenv/config';
import { LarkClient } from '../src/api/lark-client.js';
import { SimpleBaseService, SimpleBaseConfig } from '../src/services/simple-base-service.js';

const WEBHOOK_URL = process.env.LARK_WEBHOOK_URL;

interface ExpiringQualification {
  employeeName: string;
  qualificationName: string;
  expiryDate: string;
  daysRemaining: number;
}

async function sendLarkNotification(message: string): Promise<void> {
  if (!WEBHOOK_URL) {
    console.log('⚠️ LARK_WEBHOOK_URL が設定されていません。通知をスキップします。');
    console.log('\n--- 通知内容 ---');
    console.log(message);
    console.log('----------------\n');
    return;
  }

  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      msg_type: 'text',
      content: { text: message }
    })
  });

  if (!response.ok) {
    throw new Error(`通知送信失敗: ${response.statusText}`);
  }
}

async function main() {
  console.log('🔍 資格期限チェックを開始...\n');

  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;
  const appToken = process.env.LARK_BASE_APP_TOKEN;

  if (!appId || !appSecret || !appToken) {
    console.error('❌ 環境変数が設定されていません');
    process.exit(1);
  }

  // シンプル版テーブルIDを使用
  const tableIds = {
    employees: process.env.LARK_TABLE_EMPLOYEES || '',
    qualifications: process.env.LARK_TABLE_QUALIFICATIONS || '',
    qualificationRecords: process.env.LARK_TABLE_QUALIFICATION_RECORDS || '',
    projects: process.env.LARK_TABLE_PROJECTS || '',
    tasks: process.env.LARK_TABLE_TASKS || '',
  };

  if (!tableIds.qualificationRecords) {
    console.error('❌ LARK_TABLE_QUALIFICATION_RECORDS が設定されていません');
    process.exit(1);
  }

  const client = new LarkClient({ appId, appSecret });
  const config: SimpleBaseConfig = { appToken, tableIds };
  const service = new SimpleBaseService(client, config);

  // 30日以内に期限切れになる資格を取得
  const expiringRecords = await service.getExpiringQualifications(30);

  if (expiringRecords.length === 0) {
    console.log('✅ 期限切れ間近の資格はありません');
    return;
  }

  // 期限までの日数でソート
  const today = new Date();
  const sortedRecords: ExpiringQualification[] = expiringRecords
    .map(r => ({
      employeeName: r.employeeId,
      qualificationName: r.qualificationId,
      expiryDate: r.expiryDate || '',
      daysRemaining: r.expiryDate
        ? Math.ceil((new Date(r.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : 0,
    }))
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  // 7日以内と30日以内に分類
  const critical = sortedRecords.filter(r => r.daysRemaining <= 7);
  const warning = sortedRecords.filter(r => r.daysRemaining > 7);

  // 通知メッセージを作成
  let message = '⚠️ 資格期限アラート\n\n';
  message += `検出日時: ${new Date().toLocaleString('ja-JP')}\n\n`;

  if (critical.length > 0) {
    message += '🔴 7日以内に期限切れ\n';
    for (const r of critical) {
      const date = new Date(r.expiryDate).toLocaleDateString('ja-JP');
      message += `  - ${r.employeeName}: ${r.qualificationName} (${date}期限, 残${r.daysRemaining}日)\n`;
    }
    message += '\n';
  }

  if (warning.length > 0) {
    message += '🟡 30日以内に期限切れ\n';
    for (const r of warning) {
      const date = new Date(r.expiryDate).toLocaleDateString('ja-JP');
      message += `  - ${r.employeeName}: ${r.qualificationName} (${date}期限, 残${r.daysRemaining}日)\n`;
    }
  }

  message += `\n合計: ${sortedRecords.length}件`;

  // 結果を表示
  console.log('📋 検出結果:');
  console.log(`   🔴 緊急（7日以内）: ${critical.length}件`);
  console.log(`   🟡 注意（30日以内）: ${warning.length}件`);
  console.log('');

  // Lark通知を送信
  console.log('📤 通知を送信中...');
  await sendLarkNotification(message);
  console.log('✅ 完了');
}

main().catch(error => {
  console.error('❌ エラー:', error.message);
  process.exit(1);
});
