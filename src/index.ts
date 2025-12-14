/**
 * construction-lark - 建設業版Lark Base
 *
 * LarkのBaseで工事管理Baseと工程管理Baseを提供
 * 工事別・人別・機材別のガントチャート出力機能付き
 */

// API
export { LarkClient, FIELD_TYPES, type LarkConfig, type LarkApiResponse, type BaseRecord } from './api';

// Auth
export { LarkAuth, type LarkAuthConfig, type LarkCredentials } from './auth';

// Types
export * from './types';

// Services
export { ConstructionService, type ConstructionServiceConfig } from './services';
export { GanttService, type GanttServiceConfig } from './services';

// Setup
export {
  BaseCreator,
  TableCreator,
  SampleData,
  setupConstructionBase,
  generateEnvConfig,
  verifySetup,
  type BaseCreatorConfig,
  type BaseCreationResult,
  type TableCreationResult,
  type FieldDefinition,
  type SampleDataResult,
  type TableIdMapping,
  type SetupResult,
  type SetupOptions,
} from './setup';

// ========================================
// 使用例
// ========================================

import { LarkClient } from './api';
import { ConstructionService } from './services';
import { GanttService } from './services';

/**
 * 工事管理・ガントチャートシステムの初期化例
 */
export async function initializeConstructionSystem(config: {
  appId: string;
  appSecret: string;
  appToken: string;
  tableIds: {
    contracts: string;
    qualifiedPersons: string;
    subcontractors: string;
    equipment: string;
    processMaster: string;
    schedules: string;
  };
}) {
  // Lark APIクライアント初期化
  const larkClient = new LarkClient({
    appId: config.appId,
    appSecret: config.appSecret,
  });

  // 工事管理サービス初期化
  const constructionService = new ConstructionService({
    larkClient,
    appToken: config.appToken,
    tableIds: {
      contracts: config.tableIds.contracts,
      qualifiedPersons: config.tableIds.qualifiedPersons,
      subcontractors: config.tableIds.subcontractors,
      equipment: config.tableIds.equipment,
      processMaster: config.tableIds.processMaster,
    },
  });

  // ガントチャートサービス初期化
  const ganttService = new GanttService({
    larkClient,
    appToken: config.appToken,
    tableIds: config.tableIds,
  });

  return {
    larkClient,
    constructionService,
    ganttService,
  };
}

/**
 * デモ: 工事別ガントチャート取得
 */
export async function demoContractGantt(ganttService: GanttService, contractId: string) {
  console.log('📊 工事別ガントチャート取得中...');

  const ganttData = await ganttService.getContractGanttChart(contractId);

  console.log(`\n工事名: ${ganttData.contract.projectName}`);
  console.log(`全体進捗: ${ganttData.summary.overallProgress}%`);
  console.log(`残日数: ${ganttData.summary.remainingDays}日`);
  console.log(`遅延工程: ${ganttData.summary.delayedItems}件`);

  console.log('\n工程一覧:');
  for (const item of ganttData.scheduleItems) {
    const statusIcon = item.status === 'completed' ? '✅' :
                       item.status === 'in_progress' ? '🔄' :
                       item.status === 'delayed' ? '⚠️' : '⏳';
    console.log(`  ${statusIcon} ${item.name} (${item.progress}%)`);
  }

  return ganttData;
}

/**
 * デモ: 人別ガントチャート取得
 */
export async function demoPersonGantt(ganttService: GanttService, personId: string) {
  console.log('👤 人別ガントチャート取得中...');

  const ganttData = await ganttService.getPersonGanttChart(personId);

  console.log(`\n担当者: ${ganttData.person.name}`);
  console.log(`稼働率: ${ganttData.workload.utilizationRate}%`);
  console.log(`現在の担当: ${ganttData.workload.currentAssignments}件`);
  console.log(`予定の担当: ${ganttData.workload.upcomingAssignments}件`);

  console.log('\n担当工程:');
  for (const assignment of ganttData.assignments) {
    console.log(`  📋 ${assignment.contractName} - ${assignment.scheduleItem.name}`);
    console.log(`     期間: ${assignment.period.start} 〜 ${assignment.period.end}`);
  }

  return ganttData;
}

/**
 * デモ: 機材別ガントチャート取得
 */
export async function demoEquipmentGantt(ganttService: GanttService, equipmentId: string) {
  console.log('🚜 機材別ガントチャート取得中...');

  const ganttData = await ganttService.getEquipmentGanttChart(equipmentId);

  console.log(`\n機材名: ${ganttData.equipment.name}`);
  console.log(`保有数: ${ganttData.availability.totalQuantity}`);
  console.log(`使用中: ${ganttData.availability.currentlyUsed}`);
  console.log(`空き: ${ganttData.availability.available}`);
  console.log(`稼働率: ${ganttData.availability.utilizationRate}%`);

  console.log('\n割当状況:');
  for (const allocation of ganttData.allocations) {
    console.log(`  📍 ${allocation.contractName} - ${allocation.scheduleItem.name}`);
    console.log(`     期間: ${allocation.period.start} 〜 ${allocation.period.end}`);
    console.log(`     数量: ${allocation.quantity}`);
  }

  return ganttData;
}

// CLI実行時
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🏗️  construction-lark - 建設業版Lark Base');
  console.log('');
  console.log('利用可能な機能:');
  console.log('  📊 工事管理Base');
  console.log('     - 工事契約情報');
  console.log('     - 資格者マスタ');
  console.log('     - 協力会社マスタ');
  console.log('     - 資機材マスタ');
  console.log('     - 工程マスタ');
  console.log('');
  console.log('  📈 ガントチャート');
  console.log('     - 工事別工程表');
  console.log('     - 人別ガントチャート');
  console.log('     - 機材別ガントチャート');
  console.log('');
  console.log('使用方法:');
  console.log('  1. .envファイルにLark API認証情報を設定');
  console.log('  2. initializeConstructionSystem() でサービスを初期化');
  console.log('  3. 各サービスのメソッドを呼び出し');
  console.log('');
  console.log('詳細: README.md を参照');
}
