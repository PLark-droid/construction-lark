#!/usr/bin/env npx tsx
/**
 * 案件進捗率自動更新スクリプト
 * 工程の進捗率から案件の進捗率を自動計算して更新
 */

import 'dotenv/config';
import { LarkClient } from '../src/api/lark-client.js';
import { SimpleBaseService, SimpleBaseConfig } from '../src/services/simple-base-service.js';

interface ProgressUpdate {
  projectName: string;
  oldProgress: number;
  newProgress: number;
  taskCount: number;
}

async function main() {
  console.log('📊 案件進捗率の自動更新を開始...\n');

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

  if (!tableIds.projects || !tableIds.tasks) {
    console.error('❌ LARK_TABLE_PROJECTS または LARK_TABLE_TASKS が設定されていません');
    process.exit(1);
  }

  const client = new LarkClient({ appId, appSecret });
  const config: SimpleBaseConfig = { appToken, tableIds };
  const service = new SimpleBaseService(client, config);

  // 全案件を取得
  const projects = await service.getProjects();
  console.log(`📁 ${projects.length}件の案件を処理します\n`);

  const updates: ProgressUpdate[] = [];

  for (const project of projects) {
    // 案件の工程を取得
    const tasks = await service.getTasksByProject(project.projectName);

    if (tasks.length === 0) {
      console.log(`   ⏭️  ${project.projectName}: 工程なし（スキップ）`);
      continue;
    }

    // 進捗率を計算
    const totalProgress = tasks.reduce((sum, t) => sum + t.progressRate, 0);
    const calculatedProgress = Math.round(totalProgress / tasks.length);

    if (calculatedProgress === project.progressRate) {
      console.log(`   ✓ ${project.projectName}: ${project.progressRate}%（変更なし）`);
      continue;
    }

    // 進捗率を更新
    try {
      await client.updateRecord(
        appToken,
        tableIds.projects,
        project.id,
        { '進捗率': calculatedProgress }
      );

      updates.push({
        projectName: project.projectName,
        oldProgress: project.progressRate,
        newProgress: calculatedProgress,
        taskCount: tasks.length,
      });

      console.log(`   ✅ ${project.projectName}: ${project.progressRate}% → ${calculatedProgress}% (工程${tasks.length}件)`);
    } catch (error) {
      console.log(`   ❌ ${project.projectName}: 更新失敗 - ${(error as Error).message}`);
    }
  }

  // 結果サマリー
  console.log('\n' + '━'.repeat(50));
  console.log('📊 更新結果\n');

  if (updates.length === 0) {
    console.log('   変更はありませんでした');
  } else {
    console.log(`   更新件数: ${updates.length}件\n`);

    for (const u of updates) {
      const change = u.newProgress - u.oldProgress;
      const arrow = change > 0 ? '📈' : '📉';
      console.log(`   ${arrow} ${u.projectName}: ${u.oldProgress}% → ${u.newProgress}% (${change >= 0 ? '+' : ''}${change}%)`);
    }
  }

  console.log('\n✅ 完了');
}

main().catch(error => {
  console.error('❌ エラー:', error.message);
  process.exit(1);
});
