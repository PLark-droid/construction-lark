#!/usr/bin/env node
/**
 * ダッシュボード作成スクリプト
 * Lark Baseに建設業向けダッシュボードを作成
 */

import { config } from 'dotenv';
import { Command } from 'commander';
import {
  createDashboardsCommand,
  getTableIdsFromEnv,
  promptTableIds,
} from '../cli/commands/create-dashboards.js';
import chalk from 'chalk';

// 環境変数を読み込み
config();

const program = new Command();

program
  .name('create-dashboards')
  .description('Lark Baseに建設業向けダッシュボードを作成')
  .version('0.1.0')
  .option(
    '-a, --app-token <token>',
    'Lark Base App Token',
    process.env.LARK_BASE_APP_TOKEN
  )
  .option(
    '--contracts <tableId>',
    '工事契約情報テーブルID',
    process.env.LARK_TABLE_CONTRACTS
  )
  .option(
    '--schedules <tableId>',
    'スケジュールテーブルID',
    process.env.LARK_TABLE_SCHEDULES
  )
  .option(
    '--qualified-persons <tableId>',
    '資格者マスタテーブルID',
    process.env.LARK_TABLE_QUALIFIED_PERSONS
  )
  .option(
    '--equipment <tableId>',
    '資機材マスタテーブルID',
    process.env.LARK_TABLE_EQUIPMENT
  )
  .option(
    '--safety-records <tableId>',
    '安全記録テーブルID (オプション)',
    process.env.LARK_TABLE_SAFETY_RECORDS
  )
  .option('-i, --interactive', '対話モードでテーブルIDを入力')
  .action(async (options) => {
    try {
      // App Tokenの確認
      if (!options.appToken) {
        console.error(
          chalk.red(
            'エラー: LARK_BASE_APP_TOKENを環境変数に設定するか、--app-tokenオプションを指定してください'
          )
        );
        process.exit(1);
      }

      // テーブルIDの取得
      let tableIds;

      if (options.interactive) {
        // 対話モード
        tableIds = await promptTableIds();
      } else if (
        options.contracts &&
        options.schedules &&
        options.qualifiedPersons &&
        options.equipment
      ) {
        // コマンドライン引数から取得
        tableIds = {
          contracts: options.contracts,
          schedules: options.schedules,
          qualifiedPersons: options.qualifiedPersons,
          equipment: options.equipment,
          safetyRecords: options.safetyRecords,
        };
      } else {
        // 環境変数から取得
        tableIds = getTableIdsFromEnv();

        // 必須テーブルIDの確認
        if (
          !tableIds.contracts ||
          !tableIds.schedules ||
          !tableIds.qualifiedPersons ||
          !tableIds.equipment
        ) {
          console.error(
            chalk.red(
              'エラー: テーブルIDを環境変数に設定するか、--interactiveオプションを使用してください'
            )
          );
          console.log(chalk.yellow('\n必須の環境変数:'));
          console.log(chalk.gray('  LARK_TABLE_CONTRACTS'));
          console.log(chalk.gray('  LARK_TABLE_SCHEDULES'));
          console.log(chalk.gray('  LARK_TABLE_QUALIFIED_PERSONS'));
          console.log(chalk.gray('  LARK_TABLE_EQUIPMENT'));
          console.log(chalk.yellow('\nオプションの環境変数:'));
          console.log(chalk.gray('  LARK_TABLE_SAFETY_RECORDS'));
          process.exit(1);
        }
      }

      // ダッシュボード作成実行
      await createDashboardsCommand({
        appToken: options.appToken,
        tableIds,
      });
    } catch (error) {
      console.error(chalk.red('\nエラーが発生しました:'));
      console.error(error);
      process.exit(1);
    }
  });

program.parse();
