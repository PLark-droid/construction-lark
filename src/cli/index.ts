#!/usr/bin/env node

/**
 * Construction Lark CLI
 * 建設業向けLark Base管理コマンドラインツール
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { setupCommand } from './commands/setup.js';
import { demoCommand } from './commands/demo.js';

const program = new Command();

// バージョン情報
program
  .name('construction-lark')
  .description('建設業向けLark Base連携 - 工事管理・工程管理・ガントチャート')
  .version('0.1.0');

// Init コマンド
program
  .command('init')
  .description('対話的にLark認証・Base作成を行う')
  .option('--skip-env', '.envファイルの作成をスキップ')
  .action(async (options) => {
    try {
      await initCommand(options);
    } catch (error) {
      console.error(chalk.red('\n❌ エラーが発生しました'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

// Setup コマンド
program
  .command('setup')
  .description('工事管理Baseのテーブルを自動作成')
  .option('-f, --force', '既存テーブルがある場合でも強制的に再作成')
  .action(async (options) => {
    try {
      await setupCommand(options);
    } catch (error) {
      console.error(chalk.red('\n❌ エラーが発生しました'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

// Demo コマンド
program
  .command('demo')
  .description('サンプルデータを投入')
  .option('-m, --minimal', '最小限のサンプルデータのみ投入')
  .action(async (options) => {
    try {
      await demoCommand(options);
    } catch (error) {
      console.error(chalk.red('\n❌ エラーが発生しました'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

// ヘルプコマンドのカスタマイズ
program.on('--help', () => {
  console.log('');
  console.log(chalk.cyan.bold('使用例:'));
  console.log('');
  console.log(chalk.white('  初期セットアップ:'));
  console.log(chalk.gray('    $ npx construction-lark init'));
  console.log(chalk.gray('    $ npx construction-lark setup'));
  console.log(chalk.gray('    $ npx construction-lark demo'));
  console.log('');
  console.log(chalk.white('  再セットアップ:'));
  console.log(chalk.gray('    $ npx construction-lark setup --force'));
  console.log('');
  console.log(chalk.cyan.bold('詳細情報:'));
  console.log(chalk.gray('  GitHub: https://github.com/PLark-droid/construction-lark'));
  console.log(chalk.gray('  Docs:   https://github.com/PLark-droid/construction-lark#readme'));
  console.log('');
});

// コマンドが指定されていない場合はヘルプを表示
if (process.argv.length <= 2) {
  console.log(chalk.cyan.bold('\n🏗️  Construction Lark CLI\n'));
  console.log(chalk.white('建設業向けLark Base連携ツール'));
  console.log(chalk.gray('工事管理・工程管理・ガントチャート機能を提供\n'));
  program.outputHelp();
  console.log('');
  console.log(chalk.yellow('まずは以下のコマンドで初期化してください:'));
  console.log(chalk.cyan('  npx construction-lark init\n'));
  process.exit(0);
}

// コマンド解析・実行
program.parse(process.argv);
