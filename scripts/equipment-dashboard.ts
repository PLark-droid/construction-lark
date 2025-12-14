#!/usr/bin/env npx tsx
/**
 * 機材空き状況ダッシュボード
 *
 * Miyabi Agent - 機材管理統括
 *
 * 機能:
 * 1. 機材別の使用状況を可視化
 * 2. 空き状況をリアルタイム計算
 * 3. 工程との紐付け表示
 * 4. ガントチャート形式での機材スケジュール
 */

import { readFileSync } from 'fs';
import { join } from 'path';

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

const TABLES = {
  資機材マスタ: 'tblUpCKolVWGNVVl',
  機材配置: 'tblfV3nrS96l4W0M',
  工事契約: 'tblzeXSOwQjTY5wt',
  小工程: 'tblM4zC4WQJTzx8Q',
};

interface Equipment {
  id: string;
  name: string;
  category: string;
  totalQuantity: number;
  currentlyUsed: number;
  status: string;
}

interface Allocation {
  id: string;
  equipmentName: string;
  contractNumber: string;
  quantity: number;
  startDate: number;
  endDate: number;
  status: string;
}

interface Record {
  record_id: string;
  fields: { [key: string]: unknown };
}

async function getAccessToken(): Promise<string> {
  const response = await fetch(`${BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: LARK_APP_ID, app_secret: LARK_APP_SECRET }),
  });
  const data = await response.json() as { code: number; tenant_access_token?: string };
  if (data.code !== 0 || !data.tenant_access_token) throw new Error('認証失敗');
  return data.tenant_access_token;
}

async function listRecords(token: string, tableId: string): Promise<Record[]> {
  const response = await fetch(
    `${BASE_URL}/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/records?page_size=500`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const data = await response.json() as { code: number; data?: { items: Record[] } };
  return data.data?.items || [];
}

function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

function renderProgressBar(used: number, total: number, width: number = 20): string {
  if (total === 0) return '░'.repeat(width);
  const ratio = Math.min(used / total, 1);
  const filled = Math.round(ratio * width);
  const empty = width - filled;

  let color = '\x1b[32m'; // 緑
  if (ratio > 0.7) color = '\x1b[33m'; // 黄
  if (ratio > 0.9) color = '\x1b[31m'; // 赤

  return color + '█'.repeat(filled) + '\x1b[0m' + '░'.repeat(empty);
}

function renderGanttBar(startDate: number, endDate: number, today: Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const todayTime = today.getTime();

  // 今日を基準に前後2週間を表示
  const viewStart = new Date(today);
  viewStart.setDate(viewStart.getDate() - 7);
  const viewEnd = new Date(today);
  viewEnd.setDate(viewEnd.getDate() + 21);

  const totalDays = 28;
  const dayWidth = 1;
  let bar = '';

  for (let i = 0; i < totalDays; i++) {
    const current = new Date(viewStart);
    current.setDate(current.getDate() + i);
    const currentTime = current.getTime();

    if (currentTime >= start.getTime() && currentTime <= end.getTime()) {
      if (currentTime < todayTime) {
        bar += '\x1b[32m█\x1b[0m'; // 完了（緑）
      } else {
        bar += '\x1b[34m█\x1b[0m'; // 予定（青）
      }
    } else {
      bar += '░';
    }
  }

  return bar;
}

async function main() {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('  🏗️  Miyabi Agent - 機材空き状況ダッシュボード');
  console.log('═'.repeat(80));
  console.log('\n');

  const token = await getAccessToken();
  console.log('✅ 認証成功\n');

  // データ取得
  console.log('📥 データ取得中...');
  const [equipmentRecords, allocationRecords] = await Promise.all([
    listRecords(token, TABLES.資機材マスタ),
    listRecords(token, TABLES.機材配置),
  ]);
  console.log(`   資機材マスタ: ${equipmentRecords.length}件`);
  console.log(`   機材配置: ${allocationRecords.length}件\n`);

  // 機材データ変換
  const equipments: Equipment[] = equipmentRecords.map(r => ({
    id: r.record_id,
    name: (r.fields['資機材名'] as string) || '(未設定)',
    category: (r.fields['大分類'] as string) || '(未分類)',
    totalQuantity: Number(r.fields['保有台数']) || 0,
    currentlyUsed: Number(r.fields['現在使用中']) || 0,
    status: (r.fields['状態'] as string) || '不明',
  }));

  // 配置データ変換
  const allocations: Allocation[] = allocationRecords.map(r => ({
    id: r.record_id,
    equipmentName: (r.fields['資機材名'] as string) || '(未設定)',
    contractNumber: (r.fields['工事契約番号'] as string) || '-',
    quantity: Number(r.fields['数量']) || 0,
    startDate: Number(r.fields['配置開始日']) || 0,
    endDate: Number(r.fields['配置終了日']) || 0,
    status: (r.fields['ステータス'] as string) || '不明',
  }));

  const today = new Date();

  // ===== 機材別使用状況 =====
  console.log('═'.repeat(80));
  console.log('  📊 機材別使用状況');
  console.log('═'.repeat(80));
  console.log('');
  console.log('  機材名                      保有数  使用中  空き  稼働率  状態');
  console.log('  ' + '─'.repeat(76));

  equipments.forEach(eq => {
    const available = eq.totalQuantity - eq.currentlyUsed;
    const utilization = eq.totalQuantity > 0
      ? Math.round((eq.currentlyUsed / eq.totalQuantity) * 100)
      : 0;

    const name = eq.name.padEnd(24);
    const total = String(eq.totalQuantity).padStart(4);
    const used = String(eq.currentlyUsed).padStart(6);
    const avail = String(available).padStart(4);
    const util = `${utilization}%`.padStart(5);
    const bar = renderProgressBar(eq.currentlyUsed, eq.totalQuantity, 10);

    let statusColor = '\x1b[32m'; // 緑
    if (eq.status === '整備中') statusColor = '\x1b[33m';
    if (eq.status === '故障') statusColor = '\x1b[31m';
    const status = statusColor + eq.status + '\x1b[0m';

    console.log(`  ${name} ${total}   ${used}  ${avail}  ${util}  ${bar}  ${status}`);
  });

  console.log('');

  // ===== 機材配置ガントチャート =====
  console.log('═'.repeat(80));
  console.log('  📅 機材配置スケジュール（ガントチャート）');
  console.log('═'.repeat(80));
  console.log('');

  // 日付ヘッダー
  const viewStart = new Date(today);
  viewStart.setDate(viewStart.getDate() - 7);

  let dateHeader = '  機材名                    工事番号    ';
  for (let i = 0; i < 28; i += 7) {
    const d = new Date(viewStart);
    d.setDate(d.getDate() + i);
    dateHeader += `${d.getMonth() + 1}/${d.getDate()}`.padEnd(7);
  }
  console.log(dateHeader);
  console.log('  ' + '─'.repeat(76));

  // 「今日」マーカーの位置
  const todayPos = 7; // 先頭から7日目が今日
  let markerLine = '  ' + ' '.repeat(40);
  markerLine += ' '.repeat(todayPos) + '\x1b[33m▼\x1b[0m' + ' '.repeat(20);
  console.log(markerLine);

  allocations.forEach(alloc => {
    if (alloc.status === '使用中' || alloc.status === '予約中') {
      const name = alloc.equipmentName.substring(0, 20).padEnd(22);
      const contract = alloc.contractNumber.padEnd(10);
      const bar = renderGanttBar(alloc.startDate, alloc.endDate, today);

      console.log(`  ${name}  ${contract}  ${bar}`);
    }
  });

  console.log('');
  console.log('  凡例: \x1b[32m█\x1b[0m 完了  \x1b[34m█\x1b[0m 予定  ░ 空き');
  console.log('');

  // ===== サマリー =====
  console.log('═'.repeat(80));
  console.log('  📈 サマリー');
  console.log('═'.repeat(80));
  console.log('');

  const totalEquipment = equipments.length;
  const availableCount = equipments.filter(e => e.status === '使用可能').length;
  const inUseCount = equipments.filter(e => e.status === '使用中').length;
  const maintenanceCount = equipments.filter(e => e.status === '整備中').length;

  const activeAllocations = allocations.filter(a => a.status === '使用中').length;
  const reservedAllocations = allocations.filter(a => a.status === '予約中').length;

  const totalQuantity = equipments.reduce((sum, e) => sum + e.totalQuantity, 0);
  const totalUsed = equipments.reduce((sum, e) => sum + e.currentlyUsed, 0);
  const overallUtilization = totalQuantity > 0
    ? Math.round((totalUsed / totalQuantity) * 100)
    : 0;

  console.log(`  機材種類数:     ${totalEquipment}`);
  console.log(`  使用可能:       ${availableCount}種類`);
  console.log(`  使用中:         ${inUseCount}種類`);
  console.log(`  整備中:         ${maintenanceCount}種類`);
  console.log('');
  console.log(`  現在の配置:     ${activeAllocations}件`);
  console.log(`  予約中:         ${reservedAllocations}件`);
  console.log('');
  console.log(`  全体保有数:     ${totalQuantity}`);
  console.log(`  全体使用中:     ${totalUsed}`);
  console.log(`  全体稼働率:     ${overallUtilization}%`);
  console.log('');

  console.log('═'.repeat(80));
  console.log('  ✨ ダッシュボード生成完了');
  console.log('═'.repeat(80));
  console.log('');
}

main().catch(console.error);
