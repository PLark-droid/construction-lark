/**
 * construction-lark 基本的な使い方のサンプル
 *
 * 実行方法:
 * 1. .envファイルを設定
 * 2. npm run dev
 */

import { initializeConstructionSystem } from '../src/index.js';

async function main() {
  console.log('='.repeat(60));
  console.log('construction-lark - 基本的な使い方のサンプル');
  console.log('='.repeat(60));

  // システム初期化
  const system = await initializeConstructionSystem({
    appId: process.env.LARK_APP_ID!,
    appSecret: process.env.LARK_APP_SECRET!,
    appToken: process.env.LARK_BASE_APP_TOKEN!,
    tableIds: {
      contracts: process.env.LARK_TABLE_CONTRACTS!,
      qualifiedPersons: process.env.LARK_TABLE_QUALIFIED_PERSONS!,
      subcontractors: process.env.LARK_TABLE_SUBCONTRACTORS!,
      equipment: process.env.LARK_TABLE_EQUIPMENT!,
      processMaster: process.env.LARK_TABLE_PROCESS_MASTER!,
      schedules: process.env.LARK_TABLE_SCHEDULES!,
    },
  });

  const { larkClient, constructionService, ganttService } = system;

  console.log('\n✅ システム初期化完了\n');

  // ========================================
  // 1. 工事契約情報を取得
  // ========================================
  console.log('📊 工事契約情報を取得中...');
  try {
    const contracts = await constructionService.getContracts();
    console.log(`   取得件数: ${contracts.length}件`);

    if (contracts.length > 0) {
      const firstContract = contracts[0];
      console.log(`\n   サンプル: ${firstContract.projectName}`);
      console.log(`   契約金額: ¥${firstContract.contractAmount.toLocaleString()}`);
      console.log(`   着工日: ${firstContract.startDate}`);
      console.log(`   ステータス: ${firstContract.status}`);
    }
  } catch (error) {
    console.error('   ❌ エラー:', (error as Error).message);
  }

  // ========================================
  // 2. 資格者マスタを取得
  // ========================================
  console.log('\n👤 資格者マスタを取得中...');
  try {
    const persons = await constructionService.getQualifiedPersons();
    console.log(`   取得件数: ${persons.length}件`);

    if (persons.length > 0) {
      const firstPerson = persons[0];
      console.log(`\n   サンプル: ${firstPerson.name}`);
      console.log(`   所属部署: ${firstPerson.department}`);
      console.log(`   保有資格数: ${firstPerson.qualifications.length}件`);
    }
  } catch (error) {
    console.error('   ❌ エラー:', (error as Error).message);
  }

  // ========================================
  // 3. 協力会社マスタを取得
  // ========================================
  console.log('\n🏢 協力会社マスタを取得中...');
  try {
    const subcontractors = await constructionService.getSubcontractors();
    console.log(`   取得件数: ${subcontractors.length}件`);

    if (subcontractors.length > 0) {
      const firstSubcontractor = subcontractors[0];
      console.log(`\n   サンプル: ${firstSubcontractor.companyName}`);
      console.log(`   専門分野: ${firstSubcontractor.specialties.join(', ')}`);
      console.log(`   評価ランク: ${firstSubcontractor.rating}`);
    }
  } catch (error) {
    console.error('   ❌ エラー:', (error as Error).message);
  }

  // ========================================
  // 4. 資機材マスタを取得
  // ========================================
  console.log('\n🚜 資機材マスタを取得中...');
  try {
    const equipment = await constructionService.getEquipment();
    console.log(`   取得件数: ${equipment.length}件`);

    if (equipment.length > 0) {
      const firstEquipment = equipment[0];
      console.log(`\n   サンプル: ${firstEquipment.name}`);
      console.log(`   分類: ${firstEquipment.category}`);
      console.log(`   保有数量: ${firstEquipment.quantity}${firstEquipment.unit}`);
      console.log(`   状態: ${firstEquipment.status}`);
    }

    // 使用可能な資機材のみ取得
    const availableEquipment = await constructionService.getAvailableEquipment();
    console.log(`\n   使用可能な資機材: ${availableEquipment.length}件`);
  } catch (error) {
    console.error('   ❌ エラー:', (error as Error).message);
  }

  // ========================================
  // 5. 工程マスタを取得
  // ========================================
  console.log('\n📋 工程マスタを取得中...');
  try {
    const processes = await constructionService.getProcessMasters();
    console.log(`   取得件数: ${processes.length}件`);

    if (processes.length > 0) {
      const firstProcess = processes[0];
      console.log(`\n   サンプル: ${firstProcess.name}`);
      console.log(`   工程分類: ${firstProcess.category}`);
      console.log(`   標準工期: ${firstProcess.standardDuration}日`);
    }
  } catch (error) {
    console.error('   ❌ エラー:', (error as Error).message);
  }

  // ========================================
  // 6. ガントチャート取得（工事別）
  // ========================================
  console.log('\n📈 工事別ガントチャートを取得中...');
  try {
    const contracts = await constructionService.getContracts();

    if (contracts.length > 0) {
      const contractId = contracts[0].id;
      const ganttData = await ganttService.getContractGanttChart(contractId);

      console.log(`\n   工事名: ${ganttData.contract.projectName}`);
      console.log(`   全体進捗: ${ganttData.summary.overallProgress}%`);
      console.log(`   総工期: ${ganttData.summary.totalDuration}日`);
      console.log(`   残日数: ${ganttData.summary.remainingDays}日`);
      console.log(`   遅延工程: ${ganttData.summary.delayedItems}件`);
      console.log(`\n   工程数: ${ganttData.scheduleItems.length}件`);
      console.log(`   マイルストーン: ${ganttData.milestones.length}件`);
    } else {
      console.log('   ⚠️  工事データが存在しません');
    }
  } catch (error) {
    console.error('   ❌ エラー:', (error as Error).message);
  }

  // ========================================
  // 7. ガントチャート取得（人別）
  // ========================================
  console.log('\n👥 人別ガントチャートを取得中...');
  try {
    const persons = await constructionService.getQualifiedPersons();

    if (persons.length > 0) {
      const personId = persons[0].id;
      const personGantt = await ganttService.getPersonGanttChart(personId);

      console.log(`\n   担当者: ${personGantt.person.name}`);
      console.log(`   稼働率: ${personGantt.workload.utilizationRate}%`);
      console.log(`   現在の担当: ${personGantt.workload.currentAssignments}件`);
      console.log(`   予定の担当: ${personGantt.workload.upcomingAssignments}件`);
      console.log(`   総担当数: ${personGantt.workload.totalAssignments}件`);
    } else {
      console.log('   ⚠️  資格者データが存在しません');
    }
  } catch (error) {
    console.error('   ❌ エラー:', (error as Error).message);
  }

  // ========================================
  // 8. ガントチャート取得（機材別）
  // ========================================
  console.log('\n🔧 機材別ガントチャートを取得中...');
  try {
    const equipment = await constructionService.getEquipment();

    if (equipment.length > 0) {
      const equipmentId = equipment[0].id;
      const equipmentGantt = await ganttService.getEquipmentGanttChart(equipmentId);

      console.log(`\n   機材名: ${equipmentGantt.equipment.name}`);
      console.log(`   保有数: ${equipmentGantt.availability.totalQuantity}`);
      console.log(`   使用中: ${equipmentGantt.availability.currentlyUsed}`);
      console.log(`   空き: ${equipmentGantt.availability.available}`);
      console.log(`   稼働率: ${equipmentGantt.availability.utilizationRate}%`);
      console.log(`   割当数: ${equipmentGantt.allocations.length}件`);
    } else {
      console.log('   ⚠️  資機材データが存在しません');
    }
  } catch (error) {
    console.error('   ❌ エラー:', (error as Error).message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ サンプル実行完了');
  console.log('='.repeat(60) + '\n');
}

// 実行
main().catch((error) => {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
});
