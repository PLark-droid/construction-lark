/**
 * Sample Data Command - サンプルデータ投入
 *
 * Features:
 * - 工事台帳サンプルデータ
 * - 作業員マスタサンプルデータ
 * - 協力会社マスタサンプルデータ
 * - 資機材マスタサンプルデータ
 * - 工程表サンプルデータ
 * - 日報サンプルデータ
 */

import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LarkClient } from '../../api/lark-client.js';

export interface SampleDataCommandOptions {
  minimal?: boolean;
}

/**
 * Sample Data コマンド実行
 * Baseにサンプルデータを投入
 */
export async function sampleDataCommand(
  options: SampleDataCommandOptions = {}
): Promise<void> {
  console.log(chalk.cyan.bold('\n📊 サンプルデータ投入\n'));

  // 環境変数の読み込み
  const envPath = join(process.cwd(), '.env');
  let appId: string;
  let appSecret: string;
  let appToken: string;
  let tableIds: Record<string, string>;

  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = parseEnvFile(envContent);

    appId = envVars.LARK_APP_ID || '';
    appSecret = envVars.LARK_APP_SECRET || '';
    appToken = envVars.LARK_BASE_APP_TOKEN || '';

    tableIds = {
      contracts: envVars.LARK_TABLE_CONTRACTS || '',
      workers: envVars.LARK_TABLE_WORKERS || '',
      subcontractors: envVars.LARK_TABLE_SUBCONTRACTORS || '',
      equipment: envVars.LARK_TABLE_EQUIPMENT || '',
      schedules: envVars.LARK_TABLE_SCHEDULES || '',
      dailyReports: envVars.LARK_TABLE_DAILY_REPORTS || '',
    };

    if (!appId || !appSecret || !appToken) {
      throw new Error('環境変数が不足しています');
    }
  } catch (error) {
    console.error(chalk.red('❌ .envファイルが見つかりません'));
    console.log(chalk.yellow('\n先に init コマンドを実行してください:'));
    console.log(chalk.gray('  npx construction-lark init\n'));
    process.exit(1);
  }

  // データ量の確認
  const dataSetAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'dataSet',
      message: 'サンプルデータのセットを選択してください:',
      choices: [
        { name: '最小限（各テーブル3-5件）', value: 'minimal' },
        { name: '標準（各テーブル10-20件）', value: 'standard' },
        { name: '大規模（各テーブル50-100件）', value: 'large' },
      ],
      default: 'minimal',
    },
  ]);

  const dataSet = options.minimal ? 'minimal' : dataSetAnswer.dataSet;

  console.log(chalk.yellow(`\n${getDataSetName(dataSet)}のサンプルデータを投入します\n`));

  // 確認
  const confirmAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: '続行しますか？',
      default: true,
    },
  ]);

  if (!confirmAnswer.confirm) {
    console.log(chalk.yellow('\nキャンセルしました\n'));
    process.exit(0);
  }

  // Lark クライアント初期化
  const client = new LarkClient({ appId, appSecret });

  // サンプルデータ投入
  const spinner = ora('サンプルデータを投入中...').start();

  try {
    const counts = await insertSampleData(client, appToken, tableIds, dataSet);

    spinner.succeed(chalk.green('サンプルデータ投入完了'));

    console.log(chalk.cyan('\n投入されたデータ:\n'));
    console.log(chalk.white(`  工事台帳        : ${counts.contracts}件`));
    console.log(chalk.white(`  作業員マスタ    : ${counts.workers}件`));
    console.log(chalk.white(`  協力会社マスタ  : ${counts.subcontractors}件`));
    console.log(chalk.white(`  資機材マスタ    : ${counts.equipment}件`));
    console.log(chalk.white(`  工程表          : ${counts.schedules}件`));
    console.log(chalk.white(`  日報            : ${counts.dailyReports}件`));

    console.log(chalk.green.bold('\n✅ サンプルデータ投入完了！\n'));
    console.log(chalk.white('次のステップ:\n'));
    console.log(chalk.cyan('1. Lark Baseを開いてデータを確認'));
    console.log(chalk.cyan('2. ダッシュボードを作成'));
    console.log(chalk.gray('   コマンド: npm run dashboard:create\n'));
  } catch (error) {
    spinner.fail(chalk.red('サンプルデータ投入失敗'));
    console.error(chalk.red(`\nエラー: ${(error as Error).message}\n`));
    process.exit(1);
  }
}

/**
 * サンプルデータを投入
 */
async function insertSampleData(
  client: LarkClient,
  appToken: string,
  tableIds: Record<string, string>,
  dataSet: string
): Promise<Record<string, number>> {
  const counts = {
    contracts: 0,
    workers: 0,
    subcontractors: 0,
    equipment: 0,
    schedules: 0,
    dailyReports: 0,
  };

  const dataCount = getDataCount(dataSet);

  // 1. 作業員マスタ
  if (tableIds.workers) {
    const workers = generateWorkerData(dataCount.workers);
    for (const worker of workers) {
      await client.createRecord(appToken, tableIds.workers, worker);
      counts.workers++;
    }
  }

  // 2. 協力会社マスタ
  if (tableIds.subcontractors) {
    const subcontractors = generateSubcontractorData(dataCount.subcontractors);
    for (const subcontractor of subcontractors) {
      await client.createRecord(appToken, tableIds.subcontractors, subcontractor);
      counts.subcontractors++;
    }
  }

  // 3. 資機材マスタ
  if (tableIds.equipment) {
    const equipment = generateEquipmentData(dataCount.equipment);
    for (const item of equipment) {
      await client.createRecord(appToken, tableIds.equipment, item);
      counts.equipment++;
    }
  }

  // 4. 工事台帳
  if (tableIds.contracts) {
    const contracts = generateContractData(dataCount.contracts);
    for (const contract of contracts) {
      await client.createRecord(appToken, tableIds.contracts, contract);
      counts.contracts++;
    }
  }

  // 5. 工程表（実装は省略 - リレーションが必要）
  counts.schedules = 0;

  // 6. 日報（実装は省略 - リレーションが必要）
  counts.dailyReports = 0;

  return counts;
}

/**
 * データセット名を取得
 */
function getDataSetName(dataSet: string): string {
  switch (dataSet) {
    case 'minimal':
      return '最小限';
    case 'standard':
      return '標準';
    case 'large':
      return '大規模';
    default:
      return '不明';
  }
}

/**
 * データセットごとのデータ件数を取得
 */
function getDataCount(dataSet: string): Record<string, number> {
  switch (dataSet) {
    case 'minimal':
      return {
        contracts: 3,
        workers: 5,
        subcontractors: 3,
        equipment: 5,
        schedules: 10,
        dailyReports: 5,
      };
    case 'standard':
      return {
        contracts: 10,
        workers: 20,
        subcontractors: 10,
        equipment: 20,
        schedules: 50,
        dailyReports: 30,
      };
    case 'large':
      return {
        contracts: 50,
        workers: 100,
        subcontractors: 30,
        equipment: 100,
        schedules: 200,
        dailyReports: 150,
      };
    default:
      return {
        contracts: 3,
        workers: 5,
        subcontractors: 3,
        equipment: 5,
        schedules: 10,
        dailyReports: 5,
      };
  }
}

/**
 * 工事台帳サンプルデータ生成
 */
function generateContractData(count: number): Array<Record<string, unknown>> {
  const contracts: Array<Record<string, unknown>> = [];
  const statuses = ['計画中', '進行中', '完了'];
  const clients = ['A建設株式会社', 'B開発株式会社', 'C不動産株式会社', 'D建設', 'E建設工業'];

  for (let i = 1; i <= count; i++) {
    const startDate = new Date(2024, 0, i * 10);
    const endDate = new Date(2024, 0, i * 10 + 180);

    contracts.push({
      工事番号: `K-2024-${String(i).padStart(4, '0')}`,
      工事名: `サンプル工事${i}号`,
      発注者: clients[i % clients.length],
      契約金額: Math.floor(Math.random() * 100000000) + 10000000,
      着工日: startDate.getTime(),
      竣工予定日: endDate.getTime(),
      ステータス: statuses[i % statuses.length],
      進捗率: Math.floor(Math.random() * 100) / 100,
    });
  }

  return contracts;
}

/**
 * 作業員マスタサンプルデータ生成
 */
function generateWorkerData(count: number): Array<Record<string, unknown>> {
  const workers: Array<Record<string, unknown>> = [];
  const departments = ['工事部', '技術部', '営業部', '管理部'];
  const qualifications = ['1級建築士', '1級土木施工管理技士', '2級建築士', '安全管理者'];

  for (let i = 1; i <= count; i++) {
    workers.push({
      社員番号: `E${String(i).padStart(4, '0')}`,
      氏名: `作業員${i}`,
      所属部署: departments[i % departments.length],
      保有資格: [qualifications[i % qualifications.length]],
      連絡先: `090-0000-${String(i).padStart(4, '0')}`,
      メールアドレス: `worker${i}@example.com`,
      在籍フラグ: true,
    });
  }

  return workers;
}

/**
 * 協力会社マスタサンプルデータ生成
 */
function generateSubcontractorData(count: number): Array<Record<string, unknown>> {
  const subcontractors: Array<Record<string, unknown>> = [];
  const specialties = ['基礎工事', '鉄骨工事', '左官工事', '電気工事', '設備工事'];
  const ranks = ['A', 'B', 'C'];

  for (let i = 1; i <= count; i++) {
    subcontractors.push({
      会社コード: `SUB${String(i).padStart(4, '0')}`,
      会社名: `協力会社${i}`,
      代表者名: `代表者${i}`,
      住所: `東京都〇〇区〇〇 ${i}-${i}-${i}`,
      電話番号: `03-0000-${String(i).padStart(4, '0')}`,
      専門分野: [specialties[i % specialties.length]],
      評価ランク: ranks[i % ranks.length],
    });
  }

  return subcontractors;
}

/**
 * 資機材マスタサンプルデータ生成
 */
function generateEquipmentData(count: number): Array<Record<string, unknown>> {
  const equipment: Array<Record<string, unknown>> = [];
  const categories = ['重機', '測量機器', '電動工具', '安全用品'];
  const statuses = ['使用可能', '貸出中', '点検中'];

  for (let i = 1; i <= count; i++) {
    equipment.push({
      資機材コード: `EQ${String(i).padStart(4, '0')}`,
      名称: `資機材${i}`,
      分類: categories[i % categories.length],
      メーカー: `メーカー${(i % 3) + 1}`,
      保有数量: Math.floor(Math.random() * 20) + 1,
      状態: statuses[i % statuses.length],
      備考: `サンプルデータ${i}`,
    });
  }

  return equipment;
}

/**
 * .env ファイルをパース
 */
function parseEnvFile(content: string): Record<string, string> {
  const vars: Record<string, string> = {};

  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        vars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return vars;
}
