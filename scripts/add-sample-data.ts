#!/usr/bin/env npx tsx
/**
 * サンプルデータ追加投入スクリプト
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

// テーブルID
const TABLES = {
  工種マスタ: 'tblE5NcaoSreHiiF',
  案件情報: 'tblAO99IUW4DDbWc',
  工事契約: 'tblzeXSOwQjTY5wt',
  大工程: 'tbln82ijUjFqUHEe',
  中工程: 'tbl9s3ZtsNZzncSl',
  小工程: 'tblM4zC4WQJTzx8Q',
  人員配置: 'tblLQbNfEB6Bbimr',
  機材配置: 'tblfV3nrS96l4W0M',
};

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

async function batchCreateRecords(
  token: string,
  tableId: string,
  records: Array<{ fields: Record<string, unknown> }>
): Promise<number> {
  const response = await fetch(
    `${BASE_URL}/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/records/batch_create`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    }
  );
  const data = await response.json() as { code: number; data?: { records: unknown[] }; msg?: string };
  if (data.code !== 0) {
    console.log(`  ⚠️ エラー: ${data.msg}`);
  }
  return data.data?.records?.length || 0;
}

async function main() {
  console.log('\n📝 サンプルデータ追加投入中...\n');

  const token = await getAccessToken();
  console.log('✅ 認証成功\n');

  // 工種マスタ
  let count = await batchCreateRecords(token, TABLES.工種マスタ, [
    { fields: { '工種コード': 'K01', '工種名': '仮囲い設置', '工種区分': '仮設工事', '単位': 'm', '危険度': '中' }},
    { fields: { '工種コード': 'K02', '工種名': '根切り', '工種区分': '土工事', '単位': 'm3', '危険度': '高' }},
    { fields: { '工種コード': 'K03', '工種名': '杭打ち', '工種区分': '地業工事', '単位': '本', '危険度': '高' }},
    { fields: { '工種コード': 'K04', '工種名': '基礎配筋', '工種区分': '基礎工事', '単位': 'kg', '危険度': '中' }},
    { fields: { '工種コード': 'K05', '工種名': '基礎コンクリート打設', '工種区分': '基礎工事', '単位': 'm3', '危険度': '中' }},
    { fields: { '工種コード': 'K06', '工種名': '鉄骨建方', '工種区分': '鉄骨工事', '単位': 't', '危険度': '高' }},
    { fields: { '工種コード': 'K07', '工種名': '外壁ALCパネル取付', '工種区分': '外装工事', '単位': '枚', '危険度': '高' }},
    { fields: { '工種コード': 'K08', '工種名': '内装ボード貼り', '工種区分': '内装工事', '単位': '㎡', '危険度': '低' }},
  ]);
  console.log(`  ✅ 工種マスタ: ${count}件`);

  // 案件情報
  count = await batchCreateRecords(token, TABLES.案件情報, [
    { fields: { '案件名': '○○オフィスビル新築計画', '案件種別': '新築', '構造': 'S造', '延床面積': 15000, '現場住所': '東京都千代田区神田1-1-1', '案件ステータス': '受注', '概算金額': 2500000000 }},
    { fields: { '案件名': '△△マンション大規模修繕', '案件種別': '改修', '構造': 'RC造', '延床面積': 12000, '現場住所': '東京都港区芝浦3-3-3', '案件ステータス': '交渉中', '概算金額': 450000000 }},
    { fields: { '案件名': '□□物流センター新築', '案件種別': '新築', '構造': 'S造', '延床面積': 25000, '現場住所': '千葉県市川市塩浜1-1-1', '案件ステータス': '見積作成中', '概算金額': 1800000000 }},
  ]);
  console.log(`  ✅ 案件情報: ${count}件`);

  // 工事契約
  count = await batchCreateRecords(token, TABLES.工事契約, [
    { fields: { '工事名': '○○オフィスビル新築工事', '契約形態': '総価請負', '契約金額': 2300000000, '消費税': 230000000, '契約金額(税込)': 2530000000, '着工日': new Date('2025-01-15').getTime(), '竣工予定日': new Date('2026-09-30').getTime(), '現場住所': '東京都千代田区神田1-1-1', '工事主任': '高橋次郎', 'ステータス': '施工中', '実行予算': 2070000000, '粗利予定額': 230000000, '粗利率': 10 }},
    { fields: { '工事名': '△△橋梁補修工事', '契約形態': '総価請負', '契約金額': 180000000, '消費税': 18000000, '契約金額(税込)': 198000000, '着工日': new Date('2025-03-01').getTime(), '竣工予定日': new Date('2025-11-30').getTime(), '現場住所': '埼玉県さいたま市緑区1-1', 'ステータス': '準備中', '実行予算': 162000000, '粗利予定額': 18000000, '粗利率': 10 }},
  ]);
  console.log(`  ✅ 工事契約: ${count}件`);

  // 大工程
  count = await batchCreateRecords(token, TABLES.大工程, [
    { fields: { '大工程名': '準備・仮設工', '工程区分': '準備工', '予定開始日': new Date('2025-01-15').getTime(), '予定終了日': new Date('2025-02-14').getTime(), '進捗率': 100, 'ステータス': '完了', 'マイルストーン': true, '表示色': '青' }},
    { fields: { '大工程名': '土工・地業工', '工程区分': '土工', '予定開始日': new Date('2025-02-01').getTime(), '予定終了日': new Date('2025-04-30').getTime(), '進捗率': 85, 'ステータス': '進行中', 'クリティカルパス': true, '表示色': '緑' }},
    { fields: { '大工程名': '基礎工', '工程区分': '基礎工', '予定開始日': new Date('2025-03-15').getTime(), '予定終了日': new Date('2025-06-30').getTime(), '進捗率': 40, 'ステータス': '進行中', 'クリティカルパス': true, '表示色': '緑' }},
    { fields: { '大工程名': '躯体工', '工程区分': '躯体工', '予定開始日': new Date('2025-05-01').getTime(), '予定終了日': new Date('2025-12-31').getTime(), '進捗率': 0, 'ステータス': '未着手', 'クリティカルパス': true, 'マイルストーン': true, '表示色': '黄' }},
    { fields: { '大工程名': '外装工', '工程区分': '外装工', '予定開始日': new Date('2025-10-01').getTime(), '予定終了日': new Date('2026-04-30').getTime(), '進捗率': 0, 'ステータス': '未着手', '表示色': 'オレンジ' }},
    { fields: { '大工程名': '内装工', '工程区分': '内装工', '予定開始日': new Date('2026-01-01').getTime(), '予定終了日': new Date('2026-07-31').getTime(), '進捗率': 0, 'ステータス': '未着手', '表示色': '紫' }},
    { fields: { '大工程名': '設備工', '工程区分': '設備工', '予定開始日': new Date('2025-06-01').getTime(), '予定終了日': new Date('2026-08-31').getTime(), '進捗率': 0, 'ステータス': '未着手', '表示色': '赤' }},
    { fields: { '大工程名': '検査・引渡', '工程区分': '検査・引渡', '予定開始日': new Date('2026-08-01').getTime(), '予定終了日': new Date('2026-09-30').getTime(), '進捗率': 0, 'ステータス': '未着手', 'マイルストーン': true, '表示色': '青' }},
  ]);
  console.log(`  ✅ 大工程: ${count}件`);

  // 中工程
  count = await batchCreateRecords(token, TABLES.中工程, [
    { fields: { '工事契約番号': 'CNT-001', '中工程名': '仮囲い・ゲート設置', '予定開始日': new Date('2025-01-15').getTime(), '予定終了日': new Date('2025-01-25').getTime(), '進捗率': 100, 'ステータス': '完了', '担当者': '高橋次郎', '協力会社': '東建工業株式会社' }},
    { fields: { '工事契約番号': 'CNT-001', '中工程名': '仮設事務所設置', '予定開始日': new Date('2025-01-20').getTime(), '予定終了日': new Date('2025-01-31').getTime(), '進捗率': 100, 'ステータス': '完了', '担当者': '高橋次郎' }},
    { fields: { '工事契約番号': 'CNT-001', '中工程名': '山留め工事', '予定開始日': new Date('2025-02-01').getTime(), '予定終了日': new Date('2025-03-15').getTime(), '進捗率': 100, 'ステータス': '完了', '担当者': '山田太郎', '協力会社': '東建工業株式会社', 'クリティカルパス': true }},
    { fields: { '工事契約番号': 'CNT-001', '中工程名': '根切り工事', '予定開始日': new Date('2025-02-15').getTime(), '予定終了日': new Date('2025-04-15').getTime(), '進捗率': 80, 'ステータス': '進行中', '担当者': '山田太郎', '協力会社': '東建工業株式会社', 'クリティカルパス': true }},
    { fields: { '工事契約番号': 'CNT-001', '中工程名': '捨てコンクリート', '予定開始日': new Date('2025-03-15').getTime(), '予定終了日': new Date('2025-03-31').getTime(), '進捗率': 100, 'ステータス': '完了', '担当者': '高橋次郎' }},
    { fields: { '工事契約番号': 'CNT-001', '中工程名': '基礎配筋', '予定開始日': new Date('2025-04-01').getTime(), '予定終了日': new Date('2025-05-15').getTime(), '進捗率': 50, 'ステータス': '進行中', '担当者': '山田太郎', '協力会社': '鉄筋工業株式会社', 'クリティカルパス': true }},
    { fields: { '工事契約番号': 'CNT-001', '中工程名': '基礎コンクリート打設', '予定開始日': new Date('2025-05-01').getTime(), '予定終了日': new Date('2025-06-30').getTime(), '進捗率': 0, 'ステータス': '未着手', '担当者': '山田太郎', 'クリティカルパス': true }},
  ]);
  console.log(`  ✅ 中工程: ${count}件`);

  // 小工程
  count = await batchCreateRecords(token, TABLES.小工程, [
    { fields: { '工事契約番号': 'CNT-001', '小工程名': '根切り(1F部分)', '作業内容': '1階部分の根切り掘削', '予定開始日': new Date('2025-02-15').getTime(), '予定終了日': new Date('2025-03-15').getTime(), '予定数量': 5000, '実績数量': 4500, '単位': 'm3', '進捗率': 90, 'ステータス': '進行中', '担当者': '山田太郎', '必要人工': 200, '投入人工': 180, '協力会社': '東建工業株式会社', '使用資機材': 'バックホー(0.7m3)', '天候影響': '雨天可', 'ガントチャート表示': true }},
    { fields: { '工事契約番号': 'CNT-001', '小工程名': '根切り(B1F部分)', '作業内容': '地下1階部分の根切り掘削', '予定開始日': new Date('2025-03-10').getTime(), '予定終了日': new Date('2025-04-15').getTime(), '予定数量': 3000, '実績数量': 2100, '単位': 'm3', '進捗率': 70, 'ステータス': '進行中', '担当者': '山田太郎', '必要人工': 150, '投入人工': 100, '協力会社': '東建工業株式会社', '使用資機材': 'バックホー(0.7m3)', '先行工程': '根切り(1F部分)', '天候影響': '雨天可', 'ガントチャート表示': true }},
    { fields: { '工事契約番号': 'CNT-001', '小工程名': '基礎配筋(A通り)', '作業内容': 'A通りの基礎鉄筋組立', '予定開始日': new Date('2025-04-01').getTime(), '予定終了日': new Date('2025-04-20').getTime(), '予定数量': 45000, '実績数量': 30000, '単位': 'kg', '進捗率': 67, 'ステータス': '進行中', '担当者': '高橋次郎', '必要人工': 80, '投入人工': 55, '協力会社': '鉄筋工業株式会社', '天候影響': '雨天可', 'ガントチャート表示': true }},
    { fields: { '工事契約番号': 'CNT-001', '小工程名': '基礎配筋(B通り)', '作業内容': 'B通りの基礎鉄筋組立', '予定開始日': new Date('2025-04-15').getTime(), '予定終了日': new Date('2025-05-05').getTime(), '予定数量': 45000, '単位': 'kg', '進捗率': 20, 'ステータス': '進行中', '担当者': '高橋次郎', '必要人工': 80, '協力会社': '鉄筋工業株式会社', '先行工程': '基礎配筋(A通り)', '天候影響': '雨天可', 'ガントチャート表示': true }},
    { fields: { '工事契約番号': 'CNT-001', '小工程名': '基礎配筋(C通り)', '作業内容': 'C通りの基礎鉄筋組立', '予定開始日': new Date('2025-05-01').getTime(), '予定終了日': new Date('2025-05-15').getTime(), '予定数量': 45000, '単位': 'kg', '進捗率': 0, 'ステータス': '未着手', '担当者': '高橋次郎', '必要人工': 80, '協力会社': '鉄筋工業株式会社', '先行工程': '基礎配筋(B通り)', '天候影響': '雨天可', 'ガントチャート表示': true }},
  ]);
  console.log(`  ✅ 小工程: ${count}件`);

  // 人員配置
  count = await batchCreateRecords(token, TABLES.人員配置, [
    { fields: { '工事契約番号': 'CNT-001', '氏名': '山田太郎', '役割': '現場所長', '配置開始日': new Date('2025-01-15').getTime(), '配置終了日': new Date('2026-09-30').getTime(), 'ステータス': '配置中' }},
    { fields: { '工事契約番号': 'CNT-001', '氏名': '高橋次郎', '役割': '工事主任', '配置開始日': new Date('2025-01-15').getTime(), '配置終了日': new Date('2026-09-30').getTime(), 'ステータス': '配置中' }},
    { fields: { '工事契約番号': 'CNT-001', '氏名': '佐藤花子', '役割': '品質担当', '配置開始日': new Date('2025-03-01').getTime(), '配置終了日': new Date('2026-09-30').getTime(), 'ステータス': '配置中' }},
  ]);
  console.log(`  ✅ 人員配置: ${count}件`);

  // 機材配置
  count = await batchCreateRecords(token, TABLES.機材配置, [
    { fields: { '工事契約番号': 'CNT-001', '資機材名': 'バックホー(0.7m3)', '数量': 2, '単位': '台', '配置開始日': new Date('2025-02-01').getTime(), '配置終了日': new Date('2025-06-30').getTime(), '日額': 45000, 'ステータス': '使用中' }},
    { fields: { '工事契約番号': 'CNT-001', '資機材名': 'ラフタークレーン(25t)', '数量': 1, '単位': '台', '配置開始日': new Date('2025-05-01').getTime(), '配置終了日': new Date('2026-01-31').getTime(), '日額': 80000, 'ステータス': '予約中' }},
    { fields: { '工事契約番号': 'CNT-001', '資機材名': 'タワークレーン', '数量': 1, '単位': '基', '配置開始日': new Date('2025-05-15').getTime(), '配置終了日': new Date('2026-06-30').getTime(), 'ステータス': '予約中' }},
  ]);
  console.log(`  ✅ 機材配置: ${count}件`);

  console.log('\n✅ サンプルデータ追加投入完了\n');
}

main();
