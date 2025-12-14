/**
 * CLI Command: Create Dashboards
 * ダッシュボード作成コマンド
 */

import { LarkClient } from '../../api/lark-client.js';
import { DashboardService } from '../../services/dashboard-service.js';
import {
  createConstructionProgressDashboard,
  createEquipmentManagementDashboard,
  createPersonnelAllocationDashboard,
  createSafetyManagementDashboard,
} from '../../services/dashboard-templates.js';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';

interface DashboardOptions {
  appToken: string;
  tableIds: {
    contracts: string;
    schedules: string;
    qualifiedPersons: string;
    equipment: string;
    safetyRecords?: string;
  };
}

/**
 * ダッシュボード作成コマンド
 */
export async function createDashboardsCommand(options: DashboardOptions) {
  console.log(chalk.blue.bold('\n建設業向けダッシュボード作成'));
  console.log(chalk.gray('Lark Baseにダッシュボードを作成します\n'));

  // 環境変数から認証情報を取得
  const appId = process.env.LARK_APP_ID;
  const appSecret = process.env.LARK_APP_SECRET;

  if (!appId || !appSecret) {
    console.error(chalk.red('エラー: LARK_APP_IDとLARK_APP_SECRETを環境変数に設定してください'));
    process.exit(1);
  }

  // Larkクライアントを初期化
  const client = new LarkClient({ appId, appSecret });
  const dashboardService = new DashboardService(client, options.appToken);

  // 作成するダッシュボードを選択
  const { dashboards } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'dashboards',
      message: '作成するダッシュボードを選択してください:',
      choices: [
        {
          name: '工事進捗ダッシュボード',
          value: 'construction_progress',
          checked: true,
        },
        {
          name: '機材管理ダッシュボード',
          value: 'equipment_management',
          checked: true,
        },
        {
          name: '人員配置ダッシュボード',
          value: 'personnel_allocation',
          checked: true,
        },
        {
          name: '安全管理ダッシュボード',
          value: 'safety_management',
          checked: true,
        },
      ],
      validate: (answer) => {
        if (answer.length === 0) {
          return '少なくとも1つのダッシュボードを選択してください';
        }
        return true;
      },
    },
  ]);

  const results: Array<{
    name: string;
    dashboardId: string;
    blockIds: string[];
  }> = [];

  // 工事進捗ダッシュボード
  if (dashboards.includes('construction_progress')) {
    const spinner = ora('工事進捗ダッシュボードを作成中...').start();

    try {
      const template = createConstructionProgressDashboard({
        contracts: options.tableIds.contracts,
        schedules: options.tableIds.schedules,
      });

      const result = await dashboardService.createDashboardFromTemplate(
        template
      );

      results.push({
        name: template.name,
        dashboardId: result.dashboardId,
        blockIds: result.blockIds,
      });

      spinner.succeed(
        chalk.green(
          `工事進捗ダッシュボード作成完了 (ID: ${result.dashboardId})`
        )
      );
    } catch (error) {
      spinner.fail(chalk.red('工事進捗ダッシュボードの作成に失敗しました'));
      console.error(error);
    }
  }

  // 機材管理ダッシュボード
  if (dashboards.includes('equipment_management')) {
    const spinner = ora('機材管理ダッシュボードを作成中...').start();

    try {
      const template = createEquipmentManagementDashboard({
        equipment: options.tableIds.equipment,
        schedules: options.tableIds.schedules,
      });

      const result = await dashboardService.createDashboardFromTemplate(
        template
      );

      results.push({
        name: template.name,
        dashboardId: result.dashboardId,
        blockIds: result.blockIds,
      });

      spinner.succeed(
        chalk.green(
          `機材管理ダッシュボード作成完了 (ID: ${result.dashboardId})`
        )
      );
    } catch (error) {
      spinner.fail(chalk.red('機材管理ダッシュボードの作成に失敗しました'));
      console.error(error);
    }
  }

  // 人員配置ダッシュボード
  if (dashboards.includes('personnel_allocation')) {
    const spinner = ora('人員配置ダッシュボードを作成中...').start();

    try {
      const template = createPersonnelAllocationDashboard({
        qualifiedPersons: options.tableIds.qualifiedPersons,
        schedules: options.tableIds.schedules,
      });

      const result = await dashboardService.createDashboardFromTemplate(
        template
      );

      results.push({
        name: template.name,
        dashboardId: result.dashboardId,
        blockIds: result.blockIds,
      });

      spinner.succeed(
        chalk.green(
          `人員配置ダッシュボード作成完了 (ID: ${result.dashboardId})`
        )
      );
    } catch (error) {
      spinner.fail(chalk.red('人員配置ダッシュボードの作成に失敗しました'));
      console.error(error);
    }
  }

  // 安全管理ダッシュボード
  if (dashboards.includes('safety_management')) {
    const spinner = ora('安全管理ダッシュボードを作成中...').start();

    try {
      const template = createSafetyManagementDashboard({
        contracts: options.tableIds.contracts,
        safetyRecords: options.tableIds.safetyRecords,
      });

      const result = await dashboardService.createDashboardFromTemplate(
        template
      );

      results.push({
        name: template.name,
        dashboardId: result.dashboardId,
        blockIds: result.blockIds,
      });

      spinner.succeed(
        chalk.green(
          `安全管理ダッシュボード作成完了 (ID: ${result.dashboardId})`
        )
      );
    } catch (error) {
      spinner.fail(chalk.red('安全管理ダッシュボードの作成に失敗しました'));
      console.error(error);
    }
  }

  // 結果サマリー
  console.log(chalk.blue.bold('\n作成完了サマリー:'));
  console.log(chalk.gray('─'.repeat(60)));

  results.forEach((result) => {
    console.log(chalk.white(`\n${result.name}`));
    console.log(chalk.gray(`  Dashboard ID: ${result.dashboardId}`));
    console.log(
      chalk.gray(`  Blocks: ${result.blockIds.length}個のブロックを作成`)
    );
  });

  console.log(chalk.gray('\n─'.repeat(60)));
  console.log(
    chalk.green(
      `\n合計 ${results.length} 個のダッシュボードを作成しました`
    )
  );
}

/**
 * 環境変数からテーブルIDを取得
 */
export function getTableIdsFromEnv(): DashboardOptions['tableIds'] {
  return {
    contracts: process.env.LARK_TABLE_CONTRACTS || '',
    schedules: process.env.LARK_TABLE_SCHEDULES || '',
    qualifiedPersons: process.env.LARK_TABLE_QUALIFIED_PERSONS || '',
    equipment: process.env.LARK_TABLE_EQUIPMENT || '',
    safetyRecords: process.env.LARK_TABLE_SAFETY_RECORDS,
  };
}

/**
 * テーブルIDを対話的に入力
 */
export async function promptTableIds(): Promise<DashboardOptions['tableIds']> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'contracts',
      message: '工事契約情報テーブルID:',
      default: process.env.LARK_TABLE_CONTRACTS,
      validate: (input) => (input ? true : 'テーブルIDを入力してください'),
    },
    {
      type: 'input',
      name: 'schedules',
      message: 'スケジュールテーブルID:',
      default: process.env.LARK_TABLE_SCHEDULES,
      validate: (input) => (input ? true : 'テーブルIDを入力してください'),
    },
    {
      type: 'input',
      name: 'qualifiedPersons',
      message: '資格者マスタテーブルID:',
      default: process.env.LARK_TABLE_QUALIFIED_PERSONS,
      validate: (input) => (input ? true : 'テーブルIDを入力してください'),
    },
    {
      type: 'input',
      name: 'equipment',
      message: '資機材マスタテーブルID:',
      default: process.env.LARK_TABLE_EQUIPMENT,
      validate: (input) => (input ? true : 'テーブルIDを入力してください'),
    },
    {
      type: 'input',
      name: 'safetyRecords',
      message: '安全記録テーブルID (オプション):',
      default: process.env.LARK_TABLE_SAFETY_RECORDS || '',
    },
  ]);

  return answers;
}
