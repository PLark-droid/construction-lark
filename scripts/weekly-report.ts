#!/usr/bin/env npx tsx
/**
 * 週次レポート自動生成スクリプト
 * 工事の進捗状況を集計してレポートを生成
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
  工事契約: 'tblzeXSOwQjTY5wt',
  大工程: 'tbln82ijUjFqUHEe',
  小工程: 'tblM4zC4WQJTzx8Q',
  作業日報: 'tblN7noQWwpz1ZUh',
  検査記録: 'tbld5NUYtR5WuwJJ',
  安全パトロール: 'tblncJrCIw6mWUJa',
};

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
    `${BASE_URL}/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/records?page_size=100`,
    {
      headers: { 'Authorization': `Bearer ${token}` },
    }
  );
  const data = await response.json() as { code: number; data?: { items: Record[] } };
  return data.data?.items || [];
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

async function main() {
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('  📊 週次レポート生成');
  console.log('═'.repeat(60));
  console.log('\n');

  const token = await getAccessToken();
  console.log('✅ 認証成功\n');

  // データ取得
  console.log('📥 データ取得中...\n');
  const [contracts, processes, tasks, reports, inspections, patrols] = await Promise.all([
    listRecords(token, TABLES.工事契約),
    listRecords(token, TABLES.大工程),
    listRecords(token, TABLES.小工程),
    listRecords(token, TABLES.作業日報),
    listRecords(token, TABLES.検査記録),
    listRecords(token, TABLES.安全パトロール),
  ]);

  // レポート生成
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // 月曜日
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6); // 日曜日

  console.log('═'.repeat(60));
  console.log(`  📋 週次レポート（${formatDate(weekStart)} 〜 ${formatDate(weekEnd)}）`);
  console.log('═'.repeat(60));
  console.log('');

  // 工事別サマリー
  console.log('【工事別進捗サマリー】');
  console.log('─'.repeat(50));
  contracts.forEach((c: Record) => {
    const name = c.fields['工事名'] || '(未設定)';
    const status = c.fields['ステータス'] || '(未設定)';
    const progress = c.fields['進捗率'] || 0;
    console.log(`  ${name}`);
    console.log(`    ステータス: ${status}  進捗率: ${progress}%`);
  });
  console.log('');

  // 工程状況
  console.log('【工程状況】');
  console.log('─'.repeat(50));
  const completed = tasks.filter((t: Record) => t.fields['ステータス'] === '完了').length;
  const inProgress = tasks.filter((t: Record) => t.fields['ステータス'] === '進行中').length;
  const delayed = tasks.filter((t: Record) => t.fields['ステータス'] === '遅延').length;
  const notStarted = tasks.filter((t: Record) => t.fields['ステータス'] === '未着手').length;
  console.log(`  完了: ${completed}件  進行中: ${inProgress}件  遅延: ${delayed}件  未着手: ${notStarted}件`);
  console.log('');

  // 遅延工程
  if (delayed > 0) {
    console.log('【⚠️ 遅延工程】');
    console.log('─'.repeat(50));
    tasks.filter((t: Record) => t.fields['ステータス'] === '遅延').forEach((t: Record) => {
      console.log(`  - ${t.fields['小工程名']} (担当: ${t.fields['担当者'] || '未設定'})`);
    });
    console.log('');
  }

  // 検査状況
  console.log('【検査状況】');
  console.log('─'.repeat(50));
  const passed = inspections.filter((i: Record) => i.fields['判定'] === '合格').length;
  const needFix = inspections.filter((i: Record) => i.fields['判定'] === '要手直し').length;
  console.log(`  合格: ${passed}件  要手直し: ${needFix}件`);
  console.log('');

  // 安全パトロール
  console.log('【安全パトロール】');
  console.log('─'.repeat(50));
  const excellent = patrols.filter((p: Record) => p.fields['総合評価'] === '優良').length;
  const good = patrols.filter((p: Record) => p.fields['総合評価'] === '良好').length;
  const needImprove = patrols.filter((p: Record) =>
    p.fields['総合評価'] === '要改善' || p.fields['総合評価'] === '危険'
  ).length;
  console.log(`  優良: ${excellent}件  良好: ${good}件  要改善: ${needImprove}件`);
  console.log('');

  // 日報入力状況
  console.log('【日報入力状況】');
  console.log('─'.repeat(50));
  console.log(`  今週の日報: ${reports.length}件`);
  console.log('');

  console.log('═'.repeat(60));
  console.log('  レポート生成完了');
  console.log('═'.repeat(60));
  console.log('');
}

main().catch(console.error);
