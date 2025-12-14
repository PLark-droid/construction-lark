#!/usr/bin/env npx tsx
/**
 * 工程管理ダッシュボード
 *
 * 機能：
 * 1. 工程一覧（ガントチャート形式）
 * 2. 機材使用状況（空き/使用中の可視化）
 * 3. 人員配置状況
 * 4. 進捗サマリー
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// 環境変数の読み込み
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

// Lark API設定
const LARK_APP_ID = envVars.LARK_APP_ID;
const LARK_APP_SECRET = envVars.LARK_APP_SECRET;
const APP_TOKEN = envVars.LARK_BASE_APP_TOKEN;
const BASE_URL = 'https://open.larksuite.com/open-apis';

// テーブルID
const TABLES = {
  大工程: 'tbln82ijUjFqUHEe',
  中工程: 'tbl9s3ZtsNZzncSl',
  小工程: 'tblM4zC4WQJTzx8Q',
  機材配置: 'tblfV3nrS96l4W0M',
  資機材マスタ: 'tblUpCKolVWGNVVl',
  人員配置: 'tblLQbNfEB6Bbimr',
};

// 型定義
interface LarkRecord {
  record_id: string;
  fields: { [key: string]: unknown };
}

interface EquipmentStatus {
  equipmentId: string;
  equipmentName: string;
  totalQuantity: number;
  inUseQuantity: number;
  availableQuantity: number;
  utilizationRate: number;
  allocations: Array<{
    processName: string;
    quantity: number;
    period: string;
  }>;
}

interface PersonStatus {
  personId: string;
  personName: string;
  currentAssignments: number;
  processes: Array<{
    processName: string;
    period: string;
    role: string;
  }>;
}

interface ProgressSummary {
  totalProcesses: number;
  completedProcesses: number;
  inProgressProcesses: number;
  notStartedProcesses: number;
  delayedProcesses: number;
  overallProgress: number;
}

/**
 * アクセストークンを取得
 */
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

/**
 * テーブルのレコード一覧を取得
 */
async function listRecords(token: string, tableId: string): Promise<LarkRecord[]> {
  const response = await fetch(
    `${BASE_URL}/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/records?page_size=500`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );
  const data = await response.json() as { code: number; data?: { items: LarkRecord[] }; msg?: string };
  if (data.code !== 0) {
    console.warn(`⚠️ テーブル取得警告 (${tableId}): ${data.msg || '不明なエラー'}`);
  }
  return data.data?.items || [];
}

/**
 * 機材使用状況を分析
 */
function analyzeEquipmentStatus(
  equipmentMaster: LarkRecord[],
  equipmentAllocations: LarkRecord[]
): EquipmentStatus[] {
  const statusList: EquipmentStatus[] = [];

  for (const equipment of equipmentMaster) {
    const equipmentId = equipment.record_id;
    const equipmentName = equipment.fields['資機材名'] as string || '名称不明';
    const totalQuantity = Number(equipment.fields['保有数量']) || 0;

    // この機材の配置情報を取得
    const allocations = equipmentAllocations.filter(alloc => {
      const allocEquipmentId = alloc.fields['資機材ID'] as string;
      return allocEquipmentId === equipmentId;
    });

    // 使用中の数量を集計
    const inUseQuantity = allocations.reduce((sum, alloc) => {
      return sum + (Number(alloc.fields['使用数量']) || 0);
    }, 0);

    const availableQuantity = totalQuantity - inUseQuantity;
    const utilizationRate = totalQuantity > 0 ? Math.round((inUseQuantity / totalQuantity) * 100) : 0;

    // 配置詳細
    const allocationDetails = allocations.map(alloc => ({
      processName: alloc.fields['工程名'] as string || '不明',
      quantity: Number(alloc.fields['使用数量']) || 0,
      period: `${alloc.fields['開始日'] || '未定'} ～ ${alloc.fields['終了日'] || '未定'}`,
    }));

    statusList.push({
      equipmentId,
      equipmentName,
      totalQuantity,
      inUseQuantity,
      availableQuantity,
      utilizationRate,
      allocations: allocationDetails,
    });
  }

  return statusList;
}

/**
 * 人員配置状況を分析
 */
function analyzePersonStatus(
  personAllocations: LarkRecord[]
): PersonStatus[] {
  const personMap = new Map<string, PersonStatus>();

  for (const allocation of personAllocations) {
    const personId = allocation.fields['担当者ID'] as string || 'unknown';
    const personName = allocation.fields['担当者名'] as string || '名称不明';
    const processName = allocation.fields['工程名'] as string || '不明';
    const role = allocation.fields['役割'] as string || '一般';
    const period = `${allocation.fields['開始日'] || '未定'} ～ ${allocation.fields['終了日'] || '未定'}`;

    if (!personMap.has(personId)) {
      personMap.set(personId, {
        personId,
        personName,
        currentAssignments: 0,
        processes: [],
      });
    }

    const person = personMap.get(personId)!;
    person.currentAssignments++;
    person.processes.push({
      processName,
      period,
      role,
    });
  }

  return Array.from(personMap.values());
}

/**
 * 進捗サマリーを計算
 */
function calculateProgressSummary(
  largeProcesses: LarkRecord[],
  mediumProcesses: LarkRecord[],
  smallProcesses: LarkRecord[]
): ProgressSummary {
  const allProcesses = [...largeProcesses, ...mediumProcesses, ...smallProcesses];
  const totalProcesses = allProcesses.length;

  let completedProcesses = 0;
  let inProgressProcesses = 0;
  let notStartedProcesses = 0;
  let delayedProcesses = 0;
  let totalProgress = 0;

  for (const process of allProcesses) {
    const progress = Number(process.fields['進捗率']) || 0;
    const status = process.fields['ステータス'] as string || 'not_started';

    totalProgress += progress;

    if (progress >= 100) {
      completedProcesses++;
    } else if (progress > 0) {
      inProgressProcesses++;
    } else {
      notStartedProcesses++;
    }

    if (status === '遅延' || status === 'delayed') {
      delayedProcesses++;
    }
  }

  const overallProgress = totalProcesses > 0 ? Math.round(totalProgress / totalProcesses) : 0;

  return {
    totalProcesses,
    completedProcesses,
    inProgressProcesses,
    notStartedProcesses,
    delayedProcesses,
    overallProgress,
  };
}

/**
 * 日付をフォーマット（タイムスタンプまたは文字列対応）
 */
function formatDate(value: unknown): string {
  if (!value) return '未定';
  if (typeof value === 'number') {
    const date = new Date(value);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  }
  if (typeof value === 'string') {
    return value;
  }
  return '未定';
}

/**
 * ガントチャート形式で工程一覧を表示
 */
function displayGanttChart(
  largeProcesses: LarkRecord[],
  mediumProcesses: LarkRecord[],
  smallProcesses: LarkRecord[]
) {
  console.log('\n📊 工程一覧（ガントチャート形式）');
  console.log('─'.repeat(100));
  console.log('工程名'.padEnd(40) + '開始日'.padEnd(15) + '終了日'.padEnd(15) + '進捗率'.padEnd(10) + 'ステータス');
  console.log('─'.repeat(100));

  // 大工程
  for (const large of largeProcesses) {
    const name = large.fields['大工程名'] as string || '名称不明';
    const startDate = formatDate(large.fields['予定開始日']);
    const endDate = formatDate(large.fields['予定終了日']);
    const progress = Number(large.fields['進捗率']) || 0;
    const status = large.fields['ステータス'] as string || '未着手';

    console.log(
      `📁 ${name}`.padEnd(40) +
      startDate.padEnd(15) +
      endDate.padEnd(15) +
      `${progress}%`.padEnd(10) +
      status
    );

    // 関連する中工程を表示
    const relatedMedium = mediumProcesses.filter(m => {
      const largeId = m.fields['大工程ID'] as string;
      return largeId === large.record_id;
    });

    for (const medium of relatedMedium) {
      const mediumName = medium.fields['中工程名'] as string || '名称不明';
      const mediumStart = formatDate(medium.fields['予定開始日']);
      const mediumEnd = formatDate(medium.fields['予定終了日']);
      const mediumProgress = Number(medium.fields['進捗率']) || 0;
      const mediumStatus = medium.fields['ステータス'] as string || '未着手';

      console.log(
        `  └─ ${mediumName}`.padEnd(40) +
        mediumStart.padEnd(15) +
        mediumEnd.padEnd(15) +
        `${mediumProgress}%`.padEnd(10) +
        mediumStatus
      );

      // 関連する小工程を表示（最大3件）
      const relatedSmall = smallProcesses.filter(s => {
        const mediumId = s.fields['中工程ID'] as string;
        return mediumId === medium.record_id;
      }).slice(0, 3);

      for (const small of relatedSmall) {
        const smallName = small.fields['小工程名'] as string || '名称不明';
        const smallStart = formatDate(small.fields['予定開始日']);
        const smallEnd = formatDate(small.fields['予定終了日']);
        const smallProgress = Number(small.fields['進捗率']) || 0;

        console.log(
          `     └─ ${smallName}`.padEnd(40) +
          smallStart.padEnd(15) +
          smallEnd.padEnd(15) +
          `${smallProgress}%`.padEnd(10)
        );
      }
    }
  }
  console.log('─'.repeat(100));
}

/**
 * 機材使用状況を表示
 */
function displayEquipmentStatus(equipmentStatus: EquipmentStatus[]) {
  console.log('\n🏗️  機材使用状況');
  console.log('─'.repeat(100));
  console.log('機材名'.padEnd(30) + '保有台数'.padEnd(12) + '使用中'.padEnd(12) + '空き'.padEnd(12) + '稼働率');
  console.log('─'.repeat(100));

  for (const eq of equipmentStatus) {
    const statusBar = createProgressBar(eq.utilizationRate, 20);

    console.log(
      eq.equipmentName.padEnd(30) +
      `${eq.totalQuantity}台`.padEnd(12) +
      `${eq.inUseQuantity}台`.padEnd(12) +
      `${eq.availableQuantity}台`.padEnd(12) +
      `${eq.utilizationRate}% ${statusBar}`
    );

    // 配置詳細を表示
    if (eq.allocations.length > 0) {
      for (const alloc of eq.allocations) {
        console.log(`  └─ ${alloc.processName} (${alloc.quantity}台) ${alloc.period}`);
      }
    }
  }
  console.log('─'.repeat(100));
}

/**
 * 人員配置状況を表示
 */
function displayPersonStatus(personStatus: PersonStatus[]) {
  console.log('\n👥 人員配置状況');
  console.log('─'.repeat(100));
  console.log('担当者名'.padEnd(30) + '担当工程数');
  console.log('─'.repeat(100));

  for (const person of personStatus) {
    console.log(
      person.personName.padEnd(30) +
      `${person.currentAssignments}件`
    );

    // 担当工程を表示
    for (const process of person.processes) {
      console.log(`  └─ [${process.role}] ${process.processName} (${process.period})`);
    }
  }
  console.log('─'.repeat(100));
}

/**
 * 進捗サマリーを表示
 */
function displayProgressSummary(summary: ProgressSummary) {
  console.log('\n📈 進捗サマリー');
  console.log('─'.repeat(80));
  console.log(`総工程数:        ${summary.totalProcesses}件`);
  console.log(`完了:            ${summary.completedProcesses}件 (${Math.round((summary.completedProcesses / summary.totalProcesses) * 100)}%)`);
  console.log(`進行中:          ${summary.inProgressProcesses}件 (${Math.round((summary.inProgressProcesses / summary.totalProcesses) * 100)}%)`);
  console.log(`未着手:          ${summary.notStartedProcesses}件 (${Math.round((summary.notStartedProcesses / summary.totalProcesses) * 100)}%)`);
  console.log(`遅延:            ${summary.delayedProcesses}件`);
  console.log('');
  console.log(`全体進捗率:      ${summary.overallProgress}% ${createProgressBar(summary.overallProgress, 30)}`);
  console.log('─'.repeat(80));
}

/**
 * プログレスバーを作成
 */
function createProgressBar(percentage: number, length: number): string {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * メイン処理
 */
async function main() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  🏗️  工程管理ダッシュボード');
  console.log('═'.repeat(60));
  console.log('\n');

  try {
    // 認証
    console.log('🔐 認証中...');
    const token = await getAccessToken();
    console.log('✅ 認証成功\n');

    // データ取得
    console.log('📥 データ取得中...');
    const [
      largeProcesses,
      mediumProcesses,
      smallProcesses,
      equipmentMaster,
      equipmentAllocations,
      personAllocations,
    ] = await Promise.all([
      listRecords(token, TABLES.大工程),
      listRecords(token, TABLES.中工程),
      listRecords(token, TABLES.小工程),
      listRecords(token, TABLES.資機材マスタ),
      listRecords(token, TABLES.機材配置),
      listRecords(token, TABLES.人員配置),
    ]);

    console.log(`  大工程:         ${largeProcesses.length}件`);
    console.log(`  中工程:         ${mediumProcesses.length}件`);
    console.log(`  小工程:         ${smallProcesses.length}件`);
    console.log(`  資機材マスタ:   ${equipmentMaster.length}件`);
    console.log(`  機材配置:       ${equipmentAllocations.length}件`);
    console.log(`  人員配置:       ${personAllocations.length}件`);

    // 分析
    console.log('\n🔍 データ分析中...');
    const equipmentStatus = analyzeEquipmentStatus(equipmentMaster, equipmentAllocations);
    const personStatus = analyzePersonStatus(personAllocations);
    const progressSummary = calculateProgressSummary(largeProcesses, mediumProcesses, smallProcesses);
    console.log('✅ 分析完了\n');

    // 表示
    displayProgressSummary(progressSummary);
    displayGanttChart(largeProcesses, mediumProcesses, smallProcesses);
    displayEquipmentStatus(equipmentStatus);
    displayPersonStatus(personStatus);

    console.log('\n');
    console.log('═'.repeat(60));
    console.log('  ✨ ダッシュボード表示完了');
    console.log('═'.repeat(60));
    console.log('');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
main().catch(console.error);
