#!/usr/bin/env npx tsx
/**
 * 機材空き状況チェッカー
 *
 * 機能：
 * - 機材別の配置状況を取得
 * - 空き状況を計算（保有台数 - 使用中）
 * - 結果をコンソールに出力
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
  機材配置: 'tblfV3nrS96l4W0M',
  資機材マスタ: 'tblUpCKolVWGNVVl',
};

// 型定義
interface LarkRecord {
  record_id: string;
  fields: { [key: string]: unknown };
}

interface EquipmentAvailability {
  id: string;
  name: string;
  category: string;
  total: number;
  inUse: number;
  available: number;
  utilizationRate: number;
  status: 'available' | 'limited' | 'full' | 'over';
  allocations: Array<{
    processId: string;
    processName: string;
    quantity: number;
    startDate: string;
    endDate: string;
  }>;
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
 * 機材の空き状況を計算
 */
function calculateEquipmentAvailability(
  equipmentMaster: LarkRecord[],
  equipmentAllocations: LarkRecord[]
): EquipmentAvailability[] {
  const availabilityList: EquipmentAvailability[] = [];

  for (const equipment of equipmentMaster) {
    const id = equipment.record_id;
    const name = equipment.fields['資機材名'] as string || '名称不明';
    const category = equipment.fields['分類'] as string || 'その他';
    const total = Number(equipment.fields['保有数量']) || 0;

    // この機材の配置情報を取得
    const allocations = equipmentAllocations.filter(alloc => {
      const allocEquipmentId = alloc.fields['資機材ID'] as string;
      return allocEquipmentId === id;
    });

    // 使用中の数量を集計
    const inUse = allocations.reduce((sum, alloc) => {
      return sum + (Number(alloc.fields['使用数量']) || 0);
    }, 0);

    const available = total - inUse;
    const utilizationRate = total > 0 ? Math.round((inUse / total) * 100) : 0;

    // ステータスを判定
    let status: 'available' | 'limited' | 'full' | 'over';
    if (available < 0) {
      status = 'over';  // オーバーアロケーション（警告）
    } else if (available === 0) {
      status = 'full';  // 満杯
    } else if (available < total * 0.3) {
      status = 'limited';  // 残りわずか
    } else {
      status = 'available';  // 余裕あり
    }

    // 配置詳細
    const allocationDetails = allocations.map(alloc => ({
      processId: alloc.fields['工程ID'] as string || 'unknown',
      processName: alloc.fields['工程名'] as string || '不明',
      quantity: Number(alloc.fields['使用数量']) || 0,
      startDate: alloc.fields['開始日'] as string || '未定',
      endDate: alloc.fields['終了日'] as string || '未定',
    }));

    availabilityList.push({
      id,
      name,
      category,
      total,
      inUse,
      available,
      utilizationRate,
      status,
      allocations: allocationDetails,
    });
  }

  // 稼働率でソート（高い順）
  return availabilityList.sort((a, b) => b.utilizationRate - a.utilizationRate);
}

/**
 * ステータスアイコンを取得
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'available': return '🟢';
    case 'limited': return '🟡';
    case 'full': return '🔴';
    case 'over': return '⚠️';
    default: return '⚪';
  }
}

/**
 * 機材空き状況を表示
 */
function displayEquipmentAvailability(availabilityList: EquipmentAvailability[]) {
  console.log('\n🏗️  機材別配置状況');
  console.log('═'.repeat(110));
  console.log(
    ' '.padEnd(3) +
    '機材名'.padEnd(35) +
    '分類'.padEnd(15) +
    '保有'.padEnd(8) +
    '使用中'.padEnd(8) +
    '空き'.padEnd(8) +
    '稼働率'.padEnd(15) +
    'ステータス'
  );
  console.log('═'.repeat(110));

  for (const eq of availabilityList) {
    const statusIcon = getStatusIcon(eq.status);
    const progressBar = createProgressBar(eq.utilizationRate, 10);

    console.log(
      statusIcon.padEnd(3) +
      eq.name.padEnd(35) +
      eq.category.padEnd(15) +
      `${eq.total}台`.padEnd(8) +
      `${eq.inUse}台`.padEnd(8) +
      `${eq.available}台`.padEnd(8) +
      `${eq.utilizationRate}% ${progressBar}`.padEnd(15) +
      getStatusLabel(eq.status)
    );

    // 配置詳細を表示
    if (eq.allocations.length > 0) {
      for (const alloc of eq.allocations) {
        console.log(
          '   └─ '.padStart(6) +
          `${alloc.processName}`.padEnd(30) +
          `(${alloc.quantity}台)`.padEnd(10) +
          `${alloc.startDate} ～ ${alloc.endDate}`
        );
      }
      console.log('');
    }
  }
  console.log('═'.repeat(110));
}

/**
 * ステータスラベルを取得
 */
function getStatusLabel(status: string): string {
  switch (status) {
    case 'available': return '余裕あり';
    case 'limited': return '残りわずか';
    case 'full': return '満杯';
    case 'over': return '⚠️ オーバーアロケーション';
    default: return '不明';
  }
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
 * サマリー統計を表示
 */
function displaySummary(availabilityList: EquipmentAvailability[]) {
  const totalEquipment = availabilityList.length;
  const availableCount = availabilityList.filter(eq => eq.status === 'available').length;
  const limitedCount = availabilityList.filter(eq => eq.status === 'limited').length;
  const fullCount = availabilityList.filter(eq => eq.status === 'full').length;
  const overCount = availabilityList.filter(eq => eq.status === 'over').length;

  const totalQuantity = availabilityList.reduce((sum, eq) => sum + eq.total, 0);
  const totalInUse = availabilityList.reduce((sum, eq) => sum + eq.inUse, 0);
  const totalAvailable = availabilityList.reduce((sum, eq) => sum + eq.available, 0);
  const avgUtilization = availabilityList.length > 0
    ? Math.round(availabilityList.reduce((sum, eq) => sum + eq.utilizationRate, 0) / availabilityList.length)
    : 0;

  console.log('\n📊 機材使用状況サマリー');
  console.log('─'.repeat(80));
  console.log(`総機材種類数:    ${totalEquipment}種類`);
  console.log('');
  console.log(`🟢 余裕あり:     ${availableCount}種類 (${Math.round((availableCount / totalEquipment) * 100)}%)`);
  console.log(`🟡 残りわずか:   ${limitedCount}種類 (${Math.round((limitedCount / totalEquipment) * 100)}%)`);
  console.log(`🔴 満杯:         ${fullCount}種類 (${Math.round((fullCount / totalEquipment) * 100)}%)`);
  if (overCount > 0) {
    console.log(`⚠️  オーバー:    ${overCount}種類 (${Math.round((overCount / totalEquipment) * 100)}%) ⚠️ 要確認`);
  }
  console.log('');
  console.log(`総保有台数:      ${totalQuantity}台`);
  console.log(`使用中:          ${totalInUse}台`);
  console.log(`空き:            ${totalAvailable}台`);
  console.log(`平均稼働率:      ${avgUtilization}% ${createProgressBar(avgUtilization, 30)}`);
  console.log('─'.repeat(80));
}

/**
 * カテゴリー別統計を表示
 */
function displayCategoryStats(availabilityList: EquipmentAvailability[]) {
  const categoryMap = new Map<string, {
    count: number;
    total: number;
    inUse: number;
    available: number;
  }>();

  for (const eq of availabilityList) {
    if (!categoryMap.has(eq.category)) {
      categoryMap.set(eq.category, {
        count: 0,
        total: 0,
        inUse: 0,
        available: 0,
      });
    }

    const stats = categoryMap.get(eq.category)!;
    stats.count++;
    stats.total += eq.total;
    stats.inUse += eq.inUse;
    stats.available += eq.available;
  }

  console.log('\n📦 カテゴリー別統計');
  console.log('─'.repeat(80));
  console.log('カテゴリー'.padEnd(20) + '種類数'.padEnd(10) + '保有'.padEnd(10) + '使用中'.padEnd(10) + '空き'.padEnd(10) + '稼働率');
  console.log('─'.repeat(80));

  for (const [category, stats] of categoryMap.entries()) {
    const utilization = stats.total > 0 ? Math.round((stats.inUse / stats.total) * 100) : 0;
    const progressBar = createProgressBar(utilization, 15);

    console.log(
      category.padEnd(20) +
      `${stats.count}種類`.padEnd(10) +
      `${stats.total}台`.padEnd(10) +
      `${stats.inUse}台`.padEnd(10) +
      `${stats.available}台`.padEnd(10) +
      `${utilization}% ${progressBar}`
    );
  }
  console.log('─'.repeat(80));
}

/**
 * メイン処理
 */
async function main() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  🔍 機材空き状況チェッカー');
  console.log('═'.repeat(60));
  console.log('\n');

  try {
    // 認証
    console.log('🔐 認証中...');
    const token = await getAccessToken();
    console.log('✅ 認証成功\n');

    // データ取得
    console.log('📥 データ取得中...');
    const [equipmentMaster, equipmentAllocations] = await Promise.all([
      listRecords(token, TABLES.資機材マスタ),
      listRecords(token, TABLES.機材配置),
    ]);

    console.log(`  資機材マスタ:   ${equipmentMaster.length}件`);
    console.log(`  機材配置:       ${equipmentAllocations.length}件`);

    // 空き状況を計算
    console.log('\n🔍 空き状況を計算中...');
    const availabilityList = calculateEquipmentAvailability(equipmentMaster, equipmentAllocations);
    console.log('✅ 計算完了\n');

    // 結果を表示
    displaySummary(availabilityList);
    displayCategoryStats(availabilityList);
    displayEquipmentAvailability(availabilityList);

    // アラート（オーバーアロケーションがある場合）
    const overAllocated = availabilityList.filter(eq => eq.status === 'over');
    if (overAllocated.length > 0) {
      console.log('\n⚠️  警告: オーバーアロケーションが検出されました');
      console.log('─'.repeat(80));
      for (const eq of overAllocated) {
        console.log(`  - ${eq.name}: 保有${eq.total}台に対して${eq.inUse}台配置済み (超過: ${eq.inUse - eq.total}台)`);
      }
      console.log('─'.repeat(80));
    }

    console.log('\n');
    console.log('═'.repeat(60));
    console.log('  ✨ チェック完了');
    console.log('═'.repeat(60));
    console.log('');

  } catch (error) {
    console.error('\n❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
main().catch(console.error);
