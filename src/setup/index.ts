/**
 * Setup Module - Lark Base自動作成・初期化
 *
 * このモジュールは建設業向けLark Baseの自動セットアップ機能を提供します。
 *
 * @example
 * ```typescript
 * import { LarkClient } from '../api/lark-client.js';
 * import { setupConstructionBase } from './index.js';
 *
 * const client = new LarkClient({
 *   appId: process.env.LARK_APP_ID!,
 *   appSecret: process.env.LARK_APP_SECRET!,
 * });
 *
 * const result = await setupConstructionBase(client);
 * console.log(`Base URL: ${result.baseUrl}`);
 * ```
 *
 * @module setup
 */

export { BaseCreator } from './base-creator.js';
export type { BaseCreatorConfig, BaseCreationResult } from './base-creator.js';

export { TableCreator } from './table-creator.js';
export type { TableCreationResult, FieldDefinition } from './table-creator.js';

export { SampleData } from './sample-data.js';
export type { SampleDataResult, TableIdMapping } from './sample-data.js';

export { ViewCreator } from './view-creator.js';
export type { ViewCreationResult, ViewDefinition } from './view-creator.js';

import type { LarkClient } from '../api/lark-client.js';
import { BaseCreator } from './base-creator.js';
import { TableCreator } from './table-creator.js';
import { SampleData } from './sample-data.js';
import type { TableIdMapping } from './sample-data.js';

/**
 * セットアップ完了結果
 */
export interface SetupResult {
  appToken: string;
  baseUrl: string;
  baseName: string;
  tables: Array<{ tableId: string; tableName: string; recordCount: number }>;
  totalRecords: number;
  success: boolean;
  createdAt: string;
}

/**
 * セットアップオプション
 */
export interface SetupOptions {
  folderToken?: string;
  includeSampleData?: boolean;
  customBaseName?: string;
}

/**
 * 建設業向けLark Baseを完全セットアップ
 *
 * この関数は以下を自動的に実行します:
 * 1. 新しいBaseの作成
 * 2. 6つの標準テーブルの作成
 * 3. サンプルデータの投入（オプション）
 *
 * @param client - LarkClientインスタンス
 * @param options - セットアップオプション
 * @returns セットアップ結果
 *
 * @example
 * ```typescript
 * const result = await setupConstructionBase(client, {
 *   includeSampleData: true,
 *   customBaseName: '自社工事管理Base'
 * });
 * ```
 */
export async function setupConstructionBase(
  client: LarkClient,
  options: SetupOptions = {}
): Promise<SetupResult> {
  const {
    folderToken,
    includeSampleData = false,
    customBaseName,
  } = options;

  try {
    // Step 1: Baseを作成
    console.log('Step 1/3: Creating Base...');
    const baseCreator = new BaseCreator(client);

    const baseResult = customBaseName
      ? await baseCreator.createBase({
          name: customBaseName,
          description: '工事契約情報、工程管理、資格者管理、協力会社管理、資機材管理を統合管理するBase',
          folderToken,
        })
      : await baseCreator.createConstructionBase(folderToken);

    console.log(`Base created: ${baseResult.appUrl}`);

    // Step 2: テーブルを作成
    console.log('Step 2/3: Creating tables...');
    const tableCreator = new TableCreator(client);
    const tableResults = await tableCreator.createAllConstructionTables(baseResult.appToken);

    console.log(`Created ${tableResults.length} tables`);

    // テーブルIDマッピングを作成
    const tableIdMapping: TableIdMapping = {
      contracts: tableResults.find((t) => t.tableName === '工事契約情報')?.tableId || '',
      qualifiedPersons: tableResults.find((t) => t.tableName === '資格者マスタ')?.tableId || '',
      subcontractors: tableResults.find((t) => t.tableName === '協力会社マスタ')?.tableId || '',
      equipment: tableResults.find((t) => t.tableName === '資機材マスタ')?.tableId || '',
      processMaster: tableResults.find((t) => t.tableName === '工程マスタ')?.tableId || '',
      schedule: tableResults.find((t) => t.tableName === '工程スケジュール')?.tableId || '',
    };

    // Step 3: サンプルデータを投入（オプション）
    let sampleDataResults: Array<{ tableName: string; recordCount: number }> = [];

    if (includeSampleData) {
      console.log('Step 3/3: Inserting sample data...');
      const sampleData = new SampleData(client);
      const results = await sampleData.insertAllSampleData(baseResult.appToken, tableIdMapping);

      sampleDataResults = results.map((r) => ({
        tableName: r.tableName,
        recordCount: r.recordCount,
      }));

      console.log(sampleData.generateSummary(results));
    } else {
      console.log('Step 3/3: Skipping sample data insertion');
    }

    // 結果をまとめる
    const tables = tableResults.map((table, index) => ({
      tableId: table.tableId,
      tableName: table.tableName,
      recordCount: sampleDataResults[index]?.recordCount || 0,
    }));

    const totalRecords = sampleDataResults.reduce((sum, r) => sum + r.recordCount, 0);

    const setupResult: SetupResult = {
      appToken: baseResult.appToken,
      baseUrl: baseResult.appUrl,
      baseName: baseResult.name,
      tables,
      totalRecords,
      success: true,
      createdAt: new Date().toISOString(),
    };

    console.log('\nSetup completed successfully!');
    console.log(`Base URL: ${setupResult.baseUrl}`);
    console.log(`App Token: ${setupResult.appToken}`);
    console.log(`Total Tables: ${tables.length}`);
    console.log(`Total Records: ${totalRecords}`);

    return setupResult;
  } catch (error) {
    console.error('Setup failed:', error);
    throw error;
  }
}

/**
 * セットアップ結果を環境変数形式で出力
 *
 * .envファイルに追加するための形式で出力します
 *
 * @param result - セットアップ結果
 * @returns 環境変数形式の文字列
 *
 * @example
 * ```typescript
 * const envVars = generateEnvConfig(result);
 * console.log(envVars);
 * // LARK_BASE_APP_TOKEN=bascnxxxxxx
 * // LARK_TABLE_CONTRACTS=tblxxxxxx
 * // ...
 * ```
 */
export function generateEnvConfig(result: SetupResult): string {
  const lines = [
    '# Lark Base Configuration',
    `# Generated at ${result.createdAt}`,
    `# Base URL: ${result.baseUrl}`,
    '',
    `LARK_BASE_APP_TOKEN=${result.appToken}`,
    '',
  ];

  const tableMap: Record<string, string> = {
    '工事契約情報': 'LARK_TABLE_CONTRACTS',
    '資格者マスタ': 'LARK_TABLE_QUALIFIED_PERSONS',
    '協力会社マスタ': 'LARK_TABLE_SUBCONTRACTORS',
    '資機材マスタ': 'LARK_TABLE_EQUIPMENT',
    '工程マスタ': 'LARK_TABLE_PROCESS_MASTER',
    '工程スケジュール': 'LARK_TABLE_SCHEDULE',
  };

  result.tables.forEach((table) => {
    const envKey = tableMap[table.tableName] || `LARK_TABLE_${table.tableName.toUpperCase()}`;
    lines.push(`${envKey}=${table.tableId}`);
  });

  return lines.join('\n');
}

/**
 * セットアップ状態を確認
 *
 * 既存のBaseが正しくセットアップされているか確認します
 *
 * @param client - LarkClientインスタンス
 * @param appToken - 確認するBaseのappToken
 * @returns 確認結果
 *
 * @example
 * ```typescript
 * const status = await verifySetup(client, 'bascnxxxxxx');
 * console.log(`Tables: ${status.tableCount}/6`);
 * ```
 */
export async function verifySetup(
  client: LarkClient,
  appToken: string
): Promise<{
  exists: boolean;
  tableCount: number;
  expectedTableCount: number;
  missingTables: string[];
  complete: boolean;
}> {
  const expectedTables = [
    '工事契約情報',
    '資格者マスタ',
    '協力会社マスタ',
    '資機材マスタ',
    '工程マスタ',
    '工程スケジュール',
  ];

  try {
    const baseCreator = new BaseCreator(client);
    const exists = await baseCreator.baseExists(appToken);

    if (!exists) {
      return {
        exists: false,
        tableCount: 0,
        expectedTableCount: expectedTables.length,
        missingTables: expectedTables,
        complete: false,
      };
    }

    const tableCreator = new TableCreator(client);
    const tables = await tableCreator.listTables(appToken);

    const existingTableNames = tables.map((t) => t.tableName);
    const missingTables = expectedTables.filter((name) => !existingTableNames.includes(name));

    return {
      exists: true,
      tableCount: tables.length,
      expectedTableCount: expectedTables.length,
      missingTables,
      complete: missingTables.length === 0,
    };
  } catch (error) {
    console.error('Verify failed:', error);
    return {
      exists: false,
      tableCount: 0,
      expectedTableCount: expectedTables.length,
      missingTables: expectedTables,
      complete: false,
    };
  }
}
