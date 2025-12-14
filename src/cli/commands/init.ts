/**
 * Init Command - Lark認証・Base作成を対話的に実行
 */

import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { LarkClient } from '../../api/lark-client.js';

export interface InitCommandOptions {
  skipEnv?: boolean;
}

/**
 * Init コマンド実行
 * 対話的にLark認証・Base作成を行う
 */
export async function initCommand(options: InitCommandOptions = {}): Promise<void> {
  console.log(chalk.cyan.bold('\n🏗️  Construction Lark - 初期化セットアップ\n'));

  // Step 1: Lark認証情報の入力
  console.log(chalk.yellow('📝 Lark API 認証情報を入力してください\n'));
  console.log(chalk.gray('Lark Developer Consoleから取得してください'));
  console.log(chalk.gray('https://open.larksuite.com/app\n'));

  const authAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'appId',
      message: 'App ID:',
      validate: (input: string) => input.length > 0 || 'App IDを入力してください',
    },
    {
      type: 'password',
      name: 'appSecret',
      message: 'App Secret:',
      validate: (input: string) => input.length > 0 || 'App Secretを入力してください',
    },
  ]);

  // Step 2: 認証テスト
  const authSpinner = ora('認証情報を検証中...').start();

  try {
    const client = new LarkClient({
      appId: authAnswers.appId,
      appSecret: authAnswers.appSecret,
    });

    await client.getAccessToken();
    authSpinner.succeed(chalk.green('✅ 認証成功'));
  } catch (error) {
    authSpinner.fail(chalk.red('❌ 認証失敗'));
    console.error(chalk.red(`エラー: ${(error as Error).message}`));
    console.log(chalk.yellow('\nApp IDとApp Secretを確認してください'));
    process.exit(1);
  }

  // Step 3: Base作成方法の選択
  console.log(chalk.yellow('\n📊 Baseの設定方法を選択してください\n'));

  const baseSetupAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'setupMethod',
      message: 'Baseの設定方法:',
      choices: [
        { name: '新規Baseを作成する（推奨）', value: 'create' },
        { name: '既存のBaseを使用する', value: 'existing' },
      ],
    },
  ]);

  let appToken: string;

  if (baseSetupAnswers.setupMethod === 'create') {
    // 新規Base作成
    console.log(chalk.yellow('\n🆕 新規Baseを作成します\n'));
    console.log(chalk.gray('注: Base作成APIは管理者権限が必要です'));
    console.log(chalk.gray('手動でBaseを作成してApp Tokenを入力することを推奨します\n'));

    const createAnswers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'useManual',
        message: '手動でBaseを作成しますか？',
        default: true,
      },
    ]);

    if (createAnswers.useManual) {
      console.log(chalk.cyan('\n📋 以下の手順でBaseを作成してください:\n'));
      console.log(chalk.white('1. Larkにログイン'));
      console.log(chalk.white('2. Baseアプリを開く'));
      console.log(chalk.white('3. 「+新規作成」をクリック'));
      console.log(chalk.white('4. 「空のBaseから作成」を選択'));
      console.log(chalk.white('5. Base名を「工事管理Base」に設定'));
      console.log(chalk.white('6. 作成後、右上の「...」→「APIを開く」→「App Tokenをコピー」\n'));

      const tokenAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'appToken',
          message: 'Base App Token:',
          validate: (input: string) => input.length > 0 || 'App Tokenを入力してください',
        },
      ]);

      appToken = tokenAnswers.appToken;
    } else {
      console.log(chalk.red('\n⚠️  自動Base作成は現在サポートされていません'));
      console.log(chalk.yellow('手動でBaseを作成してください\n'));
      process.exit(0);
    }
  } else {
    // 既存Base使用
    const existingAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'appToken',
        message: '既存Base App Token:',
        validate: (input: string) => input.length > 0 || 'App Tokenを入力してください',
      },
    ]);

    appToken = existingAnswers.appToken;
  }

  // Step 4: Base接続テスト
  const baseSpinner = ora('Baseに接続中...').start();

  try {
    const client = new LarkClient({
      appId: authAnswers.appId,
      appSecret: authAnswers.appSecret,
    });

    const tables = await client.listTables(appToken);

    if (tables.code !== 0) {
      throw new Error(`Base接続失敗: ${tables.msg}`);
    }

    baseSpinner.succeed(chalk.green(`✅ Base接続成功 (既存テーブル数: ${tables.data.items.length})`));
  } catch (error) {
    baseSpinner.fail(chalk.red('❌ Base接続失敗'));
    console.error(chalk.red(`エラー: ${(error as Error).message}`));
    console.log(chalk.yellow('\nApp Tokenを確認してください'));
    process.exit(1);
  }

  // Step 5: .env ファイル作成
  if (!options.skipEnv) {
    console.log(chalk.yellow('\n💾 環境変数ファイルを作成します\n'));

    const envAnswers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'createEnv',
        message: '.envファイルを作成しますか？',
        default: true,
      },
    ]);

    if (envAnswers.createEnv) {
      const envContent = `# Lark API 認証情報
LARK_APP_ID=${authAnswers.appId}
LARK_APP_SECRET=${authAnswers.appSecret}

# Base App Token
LARK_BASE_APP_TOKEN=${appToken}

# テーブルID（setup コマンド実行後に自動設定されます）
LARK_TABLE_CONTRACTS=
LARK_TABLE_QUALIFIED_PERSONS=
LARK_TABLE_SUBCONTRACTORS=
LARK_TABLE_EQUIPMENT=
LARK_TABLE_PROCESS_MASTER=
LARK_TABLE_SCHEDULES=
`;

      const envPath = join(process.cwd(), '.env');
      writeFileSync(envPath, envContent, 'utf-8');

      console.log(chalk.green(`✅ .env ファイルを作成しました: ${envPath}`));
    }
  }

  // 完了
  console.log(chalk.cyan.bold('\n✨ 初期化が完了しました！\n'));
  console.log(chalk.white('次のステップ:'));
  console.log(chalk.gray('  1. npx construction-lark setup  （テーブル自動作成）'));
  console.log(chalk.gray('  2. npx construction-lark demo   （サンプルデータ投入）\n'));
}
