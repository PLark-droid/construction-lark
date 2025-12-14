/**
 * Demo Command - サンプルデータ投入
 */

import ora from 'ora';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LarkClient } from '../../api/lark-client.js';
import { ConstructionService } from '../../services/construction-service.js';

export interface DemoCommandOptions {
  minimal?: boolean;
}

/**
 * Demo コマンド実行
 * サンプルデータを投入
 */
export async function demoCommand(options: DemoCommandOptions = {}): Promise<void> {
  console.log(chalk.cyan.bold('\n🎭 Construction Lark - サンプルデータ投入\n'));

  // 環境変数の読み込み
  const envPath = join(process.cwd(), '.env');
  let appId: string;
  let appSecret: string;
  let appToken: string;
  let tableIds: {
    contracts: string;
    qualifiedPersons: string;
    subcontractors: string;
    equipment: string;
    processMaster: string;
    schedules: string;
  };

  try {
    const envContent = readFileSync(envPath, 'utf-8');
    const envVars = parseEnvFile(envContent);

    appId = envVars.LARK_APP_ID || process.env.LARK_APP_ID || '';
    appSecret = envVars.LARK_APP_SECRET || process.env.LARK_APP_SECRET || '';
    appToken = envVars.LARK_BASE_APP_TOKEN || process.env.LARK_BASE_APP_TOKEN || '';

    tableIds = {
      contracts: envVars.LARK_TABLE_CONTRACTS || '',
      qualifiedPersons: envVars.LARK_TABLE_QUALIFIED_PERSONS || '',
      subcontractors: envVars.LARK_TABLE_SUBCONTRACTORS || '',
      equipment: envVars.LARK_TABLE_EQUIPMENT || '',
      processMaster: envVars.LARK_TABLE_PROCESS_MASTER || '',
      schedules: envVars.LARK_TABLE_SCHEDULES || '',
    };

    if (!appId || !appSecret || !appToken) {
      throw new Error('認証情報が不足しています');
    }

    const missingTables = Object.entries(tableIds).filter(([_, id]) => !id);
    if (missingTables.length > 0) {
      throw new Error('テーブルIDが不足しています');
    }

  } catch (error) {
    console.error(chalk.red('❌ 環境変数が正しく設定されていません'));
    console.log(chalk.yellow('\n以下のコマンドを順番に実行してください:'));
    console.log(chalk.gray('  1. npx construction-lark init   （初期化）'));
    console.log(chalk.gray('  2. npx construction-lark setup  （テーブル作成）'));
    console.log(chalk.gray('  3. npx construction-lark demo   （サンプルデータ）\n'));
    process.exit(1);
  }

  // サービス初期化
  const client = new LarkClient({ appId, appSecret });
  const service = new ConstructionService({
    larkClient: client,
    appToken,
    tableIds,
  });

  console.log(chalk.yellow('📝 サンプルデータを投入します...\n'));

  // 1. 資格者マスタ
  const personsSpinner = ora('資格者マスタにサンプルデータを投入中...').start();

  try {
    const persons = [
      {
        fields: {
          '社員番号': 'EMP001',
          '氏名': '山田太郎',
          '所属部署': '施工部',
          '保有資格': ['施工管理技士', '安全管理者'],
          '連絡先電話番号': '090-1234-5678',
          'メールアドレス': 'yamada@example.com',
          '在籍フラグ': true,
        },
      },
      {
        fields: {
          '社員番号': 'EMP002',
          '氏名': '佐藤花子',
          '所属部署': '設計部',
          '保有資格': ['建築士', '測量士'],
          '連絡先電話番号': '090-2345-6789',
          'メールアドレス': 'sato@example.com',
          '在籍フラグ': true,
        },
      },
      {
        fields: {
          '社員番号': 'EMP003',
          '氏名': '鈴木一郎',
          '所属部署': '施工部',
          '保有資格': ['クレーン運転士', '溶接技能者'],
          '連絡先電話番号': '090-3456-7890',
          'メールアドレス': 'suzuki@example.com',
          '在籍フラグ': true,
        },
      },
    ];

    await client.batchCreateRecords(appToken, tableIds.qualifiedPersons, persons);
    personsSpinner.succeed(chalk.green(`✅ 資格者マスタ: ${persons.length}件`));

  } catch (error) {
    personsSpinner.fail(chalk.red('❌ 資格者マスタの投入失敗'));
    console.error(chalk.red(`エラー: ${(error as Error).message}`));
  }

  // 2. 協力会社マスタ
  const subcontractorsSpinner = ora('協力会社マスタにサンプルデータを投入中...').start();

  try {
    const subcontractors = [
      {
        fields: {
          '会社コード': 'SUB001',
          '会社名': '株式会社東建工務店',
          '代表者名': '東建太郎',
          '住所': '東京都港区芝1-2-3',
          '電話番号': '03-1234-5678',
          'メールアドレス': 'info@token.example.com',
          '専門分野': ['とび', '型枠', '鉄筋'],
          '評価ランク': 'A',
          '取引フラグ': true,
        },
      },
      {
        fields: {
          '会社コード': 'SUB002',
          '会社名': '有限会社西電設',
          '代表者名': '西電一郎',
          '住所': '東京都新宿区西新宿2-3-4',
          '電話番号': '03-2345-6789',
          'メールアドレス': 'info@seiden.example.com',
          '専門分野': ['電気'],
          '評価ランク': 'A',
          '取引フラグ': true,
        },
      },
      {
        fields: {
          '会社コード': 'SUB003',
          '会社名': '南設備工業',
          '代表者名': '南設花子',
          '住所': '神奈川県横浜市中区1-2-3',
          '電話番号': '045-3456-7890',
          'メールアドレス': 'info@minami.example.com',
          '専門分野': ['設備'],
          '評価ランク': 'B',
          '取引フラグ': true,
        },
      },
    ];

    await client.batchCreateRecords(appToken, tableIds.subcontractors, subcontractors);
    subcontractorsSpinner.succeed(chalk.green(`✅ 協力会社マスタ: ${subcontractors.length}件`));

  } catch (error) {
    subcontractorsSpinner.fail(chalk.red('❌ 協力会社マスタの投入失敗'));
    console.error(chalk.red(`エラー: ${(error as Error).message}`));
  }

  // 3. 資機材マスタ
  const equipmentSpinner = ora('資機材マスタにサンプルデータを投入中...').start();

  try {
    const equipment = [
      {
        fields: {
          '資機材コード': 'EQ001',
          '名称': 'バックホウ 0.45m³',
          '分類': '重機',
          'メーカー': 'コマツ',
          '型番': 'PC78US-11',
          '保有数量': 3,
          '単位': '台',
          '日額単価': 25000,
          '保管場所': '第1資材置場',
          '状態': '使用可能',
        },
      },
      {
        fields: {
          '資機材コード': 'EQ002',
          '名称': 'ダンプトラック 10t',
          '分類': '車両',
          'メーカー': '日野',
          '型番': 'プロフィア',
          '保有数量': 5,
          '単位': '台',
          '日額単価': 18000,
          '保管場所': '第1資材置場',
          '状態': '使用可能',
        },
      },
      {
        fields: {
          '資機材コード': 'EQ003',
          '名称': '鋼製足場',
          '分類': '足場材',
          'メーカー': 'アルインコ',
          '型番': 'SS-350',
          '保有数量': 100,
          '単位': 'スパン',
          '日額単価': 500,
          '保管場所': '第2資材置場',
          '状態': '使用可能',
        },
      },
      {
        fields: {
          '資機材コード': 'EQ004',
          '名称': 'トータルステーション',
          '分類': '測量機器',
          'メーカー': 'トプコン',
          '型番': 'GM-105',
          '保有数量': 2,
          '単位': '台',
          '日額単価': 8000,
          '保管場所': '事務所',
          '状態': '使用可能',
        },
      },
    ];

    await client.batchCreateRecords(appToken, tableIds.equipment, equipment);
    equipmentSpinner.succeed(chalk.green(`✅ 資機材マスタ: ${equipment.length}件`));

  } catch (error) {
    equipmentSpinner.fail(chalk.red('❌ 資機材マスタの投入失敗'));
    console.error(chalk.red(`エラー: ${(error as Error).message}`));
  }

  // 4. 工程マスタ
  const processSpinner = ora('工程マスタにサンプルデータを投入中...').start();

  try {
    const processes = [
      {
        fields: {
          '工程コード': 'PR001',
          '工程名': '仮設工事',
          '工程分類': '準備工',
          '標準工期': 7,
          '説明': '現場事務所、仮設トイレ、仮囲い等の設置',
        },
      },
      {
        fields: {
          '工程コード': 'PR002',
          '工程名': '掘削工事',
          '工程分類': '土工',
          '標準工期': 14,
          '説明': '根切り、床付け、残土処理',
        },
      },
      {
        fields: {
          '工程コード': 'PR003',
          '工程名': '基礎配筋工事',
          '工程分類': '基礎工',
          '標準工期': 10,
          '説明': '基礎鉄筋組立、配筋検査',
        },
      },
      {
        fields: {
          '工程コード': 'PR004',
          '工程名': '基礎コンクリート打設',
          '工程分類': '基礎工',
          '標準工期': 5,
          '説明': '基礎型枠、コンクリート打設',
        },
      },
      {
        fields: {
          '工程コード': 'PR005',
          '工程名': '躯体工事',
          '工程分類': '躯体工',
          '標準工期': 30,
          '説明': '柱・梁・スラブの型枠・配筋・コンクリート',
        },
      },
    ];

    await client.batchCreateRecords(appToken, tableIds.processMaster, processes);
    processSpinner.succeed(chalk.green(`✅ 工程マスタ: ${processes.length}件`));

  } catch (error) {
    processSpinner.fail(chalk.red('❌ 工程マスタの投入失敗'));
    console.error(chalk.red(`エラー: ${(error as Error).message}`));
  }

  // 5. 工事契約情報
  const contractsSpinner = ora('工事契約情報にサンプルデータを投入中...').start();

  try {
    const contracts = [
      {
        fields: {
          '契約番号': 'CNT-2024-001',
          '工事名': '〇〇ビル新築工事',
          '発注者名': '株式会社〇〇開発',
          '契約金額': 500000000,
          '契約日': '2024-01-15',
          '着工日': '2024-02-01',
          '竣工予定日': '2024-12-31',
          '工事現場住所': '東京都千代田区丸の内1-1-1',
          'ステータス': '施工中',
          '備考': 'RC造 地上10階建て',
        },
      },
      {
        fields: {
          '契約番号': 'CNT-2024-002',
          '工事名': '△△マンション改修工事',
          '発注者名': '△△管理組合',
          '契約金額': 120000000,
          '契約日': '2024-03-01',
          '着工日': '2024-04-01',
          '竣工予定日': '2024-09-30',
          '工事現場住所': '東京都渋谷区渋谷2-2-2',
          'ステータス': '施工中',
          '備考': '外壁塗装・防水工事',
        },
      },
    ];

    if (!options.minimal) {
      contracts.push({
        fields: {
          '契約番号': 'CNT-2024-003',
          '工事名': '□□工場増築工事',
          '発注者名': '□□製作所',
          '契約金額': 300000000,
          '契約日': '2024-02-20',
          '着工日': '2024-03-15',
          '竣工予定日': '2024-11-30',
          '工事現場住所': '神奈川県川崎市川崎区1-2-3',
          'ステータス': '施工中',
          '備考': 'S造 平屋建て 1000㎡',
        },
      });
    }

    await client.batchCreateRecords(appToken, tableIds.contracts, contracts);
    contractsSpinner.succeed(chalk.green(`✅ 工事契約情報: ${contracts.length}件`));

  } catch (error) {
    contractsSpinner.fail(chalk.red('❌ 工事契約情報の投入失敗'));
    console.error(chalk.red(`エラー: ${(error as Error).message}`));
  }

  // 完了
  console.log(chalk.cyan.bold('\n✨ サンプルデータの投入が完了しました！\n'));
  console.log(chalk.white('次のステップ:'));
  console.log(chalk.gray('  1. Lark Baseを開いてデータを確認'));
  console.log(chalk.gray('  2. TypeScript/JavaScriptからAPIを使用\n'));
  console.log(chalk.cyan('使用例:\n'));
  console.log(chalk.white('  import { initializeConstructionSystem } from "construction-lark";'));
  console.log(chalk.white('  const system = await initializeConstructionSystem(config);'));
  console.log(chalk.white('  const contracts = await system.constructionService.getContracts();\n'));
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
