#!/usr/bin/env npx tsx
/**
 * 日次レポート送信スクリプト
 * KPIサマリーとアラートをLarkに送信
 */

import 'dotenv/config';
import { LarkClient } from '../src/api/lark-client.js';
import { SimpleBaseService, SimpleBaseConfig } from '../src/services/simple-base-service.js';

const WEBHOOK_URL = process.env.LARK_WEBHOOK_URL;
const BASE_URL = process.env.LARK_BASE_URL || 'https://sjpfkixxkhe8.jp.larksuite.com/base';

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
  console.log('📊 日次レポートを生成中...\n');

  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;
  const appToken = process.env.LARK_BASE_APP_TOKEN;

  if (!appId || !appSecret || !appToken) {
    console.error('❌ 環境変数が設定されていません');
    process.exit(1);
  }

  const tableIds = {
    employees: process.env.LARK_TABLE_EMPLOYEES || '',
    qualifications: process.env.LARK_TABLE_QUALIFICATIONS || '',
    qualificationRecords: process.env.LARK_TABLE_QUALIFICATION_RECORDS || '',
    projects: process.env.LARK_TABLE_PROJECTS || '',
    tasks: process.env.LARK_TABLE_TASKS || '',
  };

  const client = new LarkClient({ appId, appSecret });
  const config: SimpleBaseConfig = { appToken, tableIds };
  const service = new SimpleBaseService(client, config);

  // データ取得
  console.log('📥 データを取得中...');

  const [kpi, alerts, projectProgress] = await Promise.all([
    service.getDashboardKPI(),
    service.getAlerts(),
    service.getProjectProgress(),
  ]);

  console.log('   ✅ KPI取得完了');
  console.log('   ✅ アラート取得完了');
  console.log('   ✅ 進捗状況取得完了');

  // 本日の日付
  const today = new Date();
  const dateStr = today.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // レポート作成
  let report = `📊 日次レポート (${dateStr})\n\n`;
  report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

  // KPIセクション
  report += '📈 KPI サマリー\n';
  report += `  進行中案件: ${kpi.activeProjects}件\n`;
  report += `  今月完了: ${kpi.completedThisMonth}件\n`;
  report += `  在籍従業員: ${kpi.totalEmployees}名\n\n`;

  // アラートセクション
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  report += '⚠️ アラート\n';
  report += `  期限切れ間近資格: ${kpi.expiringQualifications}件\n`;
  report += `  遅延タスク: ${alerts.filter(a => a.type === 'task_overdue').length}件\n`;

  if (criticalAlerts.length > 0) {
    report += '\n  🔴 緊急対応が必要:\n';
    for (const alert of criticalAlerts.slice(0, 5)) {
      report += `    - ${alert.message}\n`;
    }
  }

  report += '\n';

  // 進捗状況セクション
  report += '📋 案件進捗状況\n';
  for (const p of projectProgress.slice(0, 5)) {
    const progressBar = getProgressBar(p.progressRate);
    const statusIcon = p.daysRemaining < 0 ? '🔴' : (p.daysRemaining < 30 ? '🟡' : '🟢');
    report += `  ${statusIcon} ${p.projectName}\n`;
    report += `     ${progressBar} ${p.progressRate}%`;
    if (p.daysRemaining >= 0) {
      report += ` (残${p.daysRemaining}日)`;
    } else {
      report += ` (${Math.abs(p.daysRemaining)}日超過)`;
    }
    report += '\n';
  }

  report += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
  report += `詳細: ${BASE_URL}/${appToken}`;

  // コンソール表示
  console.log('\n--- レポート ---');
  console.log(report);
  console.log('----------------\n');

  // Lark通知を送信
  console.log('📤 レポートを送信中...');
  await sendLarkNotification(report);
  console.log('✅ 完了');
}

function getProgressBar(percent: number): string {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

main().catch(error => {
  console.error('❌ エラー:', error.message);
  process.exit(1);
});
