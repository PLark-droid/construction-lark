/**
 * Setup Command - テーブル自動作成
 */

import ora from 'ora';
import chalk from 'chalk';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { LarkClient } from '../../api/lark-client.js';
import { ConstructionService } from '../../services/construction-service.js';

export interface SetupCommandOptions {
  force?: boolean;
}

/**
 * Setup コマンド実行
 * 工事管理Baseのテーブルを自動作成
 */
export async function setupCommand(options: SetupCommandOptions = {}): Promise<void> {
  console.log(chalk.cyan.bold('\n🔧 Construction Lark - テーブルセットアップ\n'));

  // 環境変数の読み込み
  const envPath = join(process.cwd(), '.env');
  let appId: string;
  let appSecret: string;
  let appToken: string;

  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = parseEnvFile(envContent);

    appId = envVars.LARK_APP_ID || process.env.LARK_APP_ID || '';
    appSecret = envVars.LARK_APP_SECRET || process.env.LARK_APP_SECRET || '';
    appToken = envVars.LARK_BASE_APP_TOKEN || process.env.LARK_BASE_APP_TOKEN || '';

    if (!appId || !appSecret || !appToken) {
      throw new Error('環境変数が不足しています');
    }
  } catch (error) {
    console.error(chalk.red('❌ .envファイルが見つかりません'));
    console.log(chalk.yellow('\n先に init コマンドを実行してください:'));
    console.log(chalk.gray('  npx construction-lark init\n'));
    process.exit(1);
  }

  // Lark クライアント初期化
  const client = new LarkClient({ appId, appSecret });

  // 既存テーブルの確認
  const checkSpinner = ora('既存テーブルを確認中...').start();

  try {
    const tablesResponse = await client.listTables(appToken);

    if (tablesResponse.code !== 0) {
      throw new Error(`テーブル一覧取得失敗: ${tablesResponse.msg}`);
    }

    const existingTables = tablesResponse.data.items;
    checkSpinner.succeed(chalk.green(`✅ 既存テーブル: ${existingTables.length}個`));

    // 必要なテーブル名
    const requiredTables = [
      '工事契約情報',
      '資格者マスタ',
      '協力会社マスタ',
      '資機材マスタ',
      '工程マスタ',
      'スケジュール',
    ];

    const existingTableNames = existingTables.map(t => t.name);
    const missingTables = requiredTables.filter(t => !existingTableNames.includes(t));

    if (missingTables.length === 0 && !options.force) {
      console.log(chalk.green('\n✅ 必要なテーブルは既に存在しています'));
      console.log(chalk.yellow('\n再作成する場合は --force オプションを使用してください\n'));
      return;
    }

    if (existingTables.length > 0 && !options.force) {
      console.log(chalk.yellow('\n⚠️  Base内に既存のテーブルがあります'));
      console.log(chalk.gray('不足しているテーブルのみを作成します:\n'));
      missingTables.forEach(t => console.log(chalk.white(`  - ${t}`)));
      console.log('');
    }

  } catch (error) {
    checkSpinner.fail(chalk.red('❌ テーブル確認失敗'));
    console.error(chalk.red(`エラー: ${(error as Error).message}`));
    process.exit(1);
  }

  // テーブル作成
  console.log(chalk.yellow('📊 テーブルを作成します...\n'));

  const service = new ConstructionService({
    larkClient: client,
    appToken,
    tableIds: {
      contracts: '',
      qualifiedPersons: '',
      subcontractors: '',
      equipment: '',
      processMaster: '',
    },
  });

  const creationSpinner = ora('テーブル作成中...').start();

  try {
    await service.initializeConstructionBase();
    creationSpinner.succeed(chalk.green('✅ テーブル作成完了'));
  } catch (error) {
    creationSpinner.fail(chalk.red('❌ テーブル作成失敗'));
    console.error(chalk.red(`エラー: ${(error as Error).message}`));
    process.exit(1);
  }

  // テーブルIDを取得して .env に保存
  const updateSpinner = ora('テーブルIDを取得中...').start();

  try {
    const tablesResponse = await client.listTables(appToken);
    const tables = tablesResponse.data.items;

    const tableIdMap: Record<string, string> = {};
    tables.forEach(table => {
      switch (table.name) {
        case '工事契約情報':
          tableIdMap.LARK_TABLE_CONTRACTS = table.table_id;
          break;
        case '資格者マスタ':
          tableIdMap.LARK_TABLE_QUALIFIED_PERSONS = table.table_id;
          break;
        case '協力会社マスタ':
          tableIdMap.LARK_TABLE_SUBCONTRACTORS = table.table_id;
          break;
        case '資機材マスタ':
          tableIdMap.LARK_TABLE_EQUIPMENT = table.table_id;
          break;
        case '工程マスタ':
          tableIdMap.LARK_TABLE_PROCESS_MASTER = table.table_id;
          break;
        case 'スケジュール':
          tableIdMap.LARK_TABLE_SCHEDULES = table.table_id;
          break;
      }
    });

    // .env ファイル更新
    let envContent = readFileSync(envPath, 'utf-8');

    Object.entries(tableIdMap).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    });

    writeFileSync(envPath, envContent, 'utf-8');

    updateSpinner.succeed(chalk.green('✅ .env ファイルにテーブルIDを保存しました'));

    // テーブルID一覧表示
    console.log(chalk.cyan('\n📋 作成されたテーブル:\n'));
    Object.entries(tableIdMap).forEach(([key, value]) => {
      const tableName = key.replace('LARK_TABLE_', '').toLowerCase();
      console.log(chalk.white(`  ${tableName.padEnd(20)} : ${value}`));
    });

  } catch (error) {
    updateSpinner.fail(chalk.red('❌ テーブルID取得失敗'));
    console.error(chalk.red(`エラー: ${(error as Error).message}`));
  }

  // 完了
  console.log(chalk.cyan.bold('\n✨ セットアップが完了しました！\n'));
  console.log(chalk.white('次のステップ:'));
  console.log(chalk.gray('  npx construction-lark demo   （サンプルデータ投入）\n'));
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
