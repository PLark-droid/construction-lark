#!/usr/bin/env npx tsx
/**
 * 遅延タスクチェックスクリプト
 * 終了予定日を過ぎた未完了タスクを検出してLark通知を送信
 */

import 'dotenv/config';
import { LarkClient } from '../src/api/lark-client.js';
import { SimpleBaseService, SimpleBaseConfig } from '../src/services/simple-base-service.js';

const WEBHOOK_URL = process.env.LARK_WEBHOOK_URL;

interface DelayedTask {
  projectName: string;
  taskName: string;
  plannedEndDate: string;
  daysDelayed: number;
  assignee: string;
  progressRate: number;
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
  console.log('🔍 遅延タスクチェックを開始...\n');

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

  if (!tableIds.tasks) {
    console.error('❌ LARK_TABLE_TASKS が設定されていません');
    process.exit(1);
  }

  const client = new LarkClient({ appId, appSecret });
  const config: SimpleBaseConfig = { appToken, tableIds };
  const service = new SimpleBaseService(client, config);

  // 遅延タスクを取得
  const delayedTasks = await service.getDelayedTasks();

  if (delayedTasks.length === 0) {
    console.log('✅ 遅延しているタスクはありません');
    return;
  }

  // 遅延日数でソート
  const today = new Date();
  const sortedTasks: DelayedTask[] = delayedTasks
    .map(t => ({
      projectName: t.projectId,
      taskName: t.taskName,
      plannedEndDate: t.plannedEndDate,
      daysDelayed: Math.ceil((today.getTime() - new Date(t.plannedEndDate).getTime()) / (1000 * 60 * 60 * 24)),
      assignee: t.assigneeId || '未割当',
      progressRate: t.progressRate,
    }))
    .sort((a, b) => b.daysDelayed - a.daysDelayed);

  // 案件ごとにグループ化
  const byProject = new Map<string, DelayedTask[]>();
  for (const task of sortedTasks) {
    const existing = byProject.get(task.projectName) || [];
    existing.push(task);
    byProject.set(task.projectName, existing);
  }

  // 重大な遅延（7日以上）と軽度の遅延に分類
  const critical = sortedTasks.filter(t => t.daysDelayed >= 7);
  const minor = sortedTasks.filter(t => t.daysDelayed < 7);

  // 通知メッセージを作成
  let message = '🚨 遅延タスクアラート\n\n';
  message += `検出日時: ${new Date().toLocaleString('ja-JP')}\n\n`;

  for (const [projectName, tasks] of byProject) {
    message += `【${projectName}】\n`;
    for (const t of tasks) {
      const icon = t.daysDelayed >= 7 ? '🔴' : '🟡';
      message += `  ${icon} ${t.taskName}: ${t.daysDelayed}日遅延 (進捗${t.progressRate}%, 担当: ${t.assignee})\n`;
    }
    message += '\n';
  }

  message += `合計: ${sortedTasks.length}件 (重大: ${critical.length}件, 軽度: ${minor.length}件)`;

  // 結果を表示
  console.log('📋 検出結果:');
  console.log(`   🔴 重大（7日以上遅延）: ${critical.length}件`);
  console.log(`   🟡 軽度（7日未満遅延）: ${minor.length}件`);
  console.log(`   📁 影響案件数: ${byProject.size}件`);
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
