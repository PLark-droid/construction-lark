/**
 * Lark Base テーブル自動作成機能
 * 建設業向けの標準テーブルを自動作成します
 */

import type { LarkClient } from '../api/lark-client.js';
import { FIELD_TYPES } from '../api/lark-client.js';

/**
 * テーブル作成結果
 */
export interface TableCreationResult {
  tableId: string;
  tableName: string;
  fieldCount: number;
}

/**
 * フィールド定義
 */
export interface FieldDefinition {
  field_name: string;
  type: number;
  property?: Record<string, unknown>;
}

/**
 * TableCreator - Lark Baseにテーブルを自動作成
 *
 * @example
 * ```typescript
 * const creator = new TableCreator(larkClient);
 * const tables = await creator.createAllConstructionTables(appToken);
 * console.log(`作成完了: ${tables.length}個のテーブル`);
 * ```
 */
export class TableCreator {
  private client: LarkClient;

  /**
   * TableCreatorを初期化
   * @param client - LarkClientインスタンス
   */
  constructor(client: LarkClient) {
    this.client = client;
  }

  /**
   * 工事契約情報テーブルを作成
   *
   * @param appToken - BaseのappToken
   * @returns テーブル作成結果
   */
  async createContractsTable(appToken: string): Promise<TableCreationResult> {
    const fields: FieldDefinition[] = [
      { field_name: '契約番号', type: FIELD_TYPES.TEXT },
      { field_name: '工事名', type: FIELD_TYPES.TEXT },
      { field_name: '発注者名', type: FIELD_TYPES.TEXT },
      {
        field_name: '契約金額',
        type: FIELD_TYPES.NUMBER,
        property: { formatter: 'CNY' }, // 通貨表示
      },
      { field_name: '契約日', type: FIELD_TYPES.DATE },
      { field_name: '着工日', type: FIELD_TYPES.DATE },
      { field_name: '竣工予定日', type: FIELD_TYPES.DATE },
      { field_name: '実際の竣工日', type: FIELD_TYPES.DATE },
      { field_name: '工事現場住所', type: FIELD_TYPES.TEXT },
      {
        field_name: 'ステータス',
        type: FIELD_TYPES.SELECT,
        property: {
          options: [
            { name: '計画中' },
            { name: '契約済' },
            { name: '施工中' },
            { name: '検査中' },
            { name: '完了' },
            { name: '中断' },
          ],
        },
      },
      { field_name: '現場責任者', type: FIELD_TYPES.TEXT },
      { field_name: '備考', type: FIELD_TYPES.TEXT },
      { field_name: '作成日時', type: FIELD_TYPES.CREATED_TIME },
      { field_name: '更新日時', type: FIELD_TYPES.UPDATED_TIME },
    ];

    const response = await this.client.createTable(appToken, '工事契約情報', fields);

    if (response.code !== 0 || !response.data) {
      throw new Error(`Failed to create contracts table: ${response.msg}`);
    }

    return {
      tableId: response.data.table_id,
      tableName: '工事契約情報',
      fieldCount: fields.length,
    };
  }

  /**
   * 資格者マスタテーブルを作成
   *
   * @param appToken - BaseのappToken
   * @returns テーブル作成結果
   */
  async createQualifiedPersonsTable(appToken: string): Promise<TableCreationResult> {
    const fields: FieldDefinition[] = [
      { field_name: '社員番号', type: FIELD_TYPES.TEXT },
      { field_name: '氏名', type: FIELD_TYPES.TEXT },
      { field_name: '所属部署', type: FIELD_TYPES.TEXT },
      {
        field_name: '保有資格',
        type: FIELD_TYPES.MULTI_SELECT,
        property: {
          options: [
            { name: '1級建築士' },
            { name: '2級建築士' },
            { name: '1級建築施工管理技士' },
            { name: '2級建築施工管理技士' },
            { name: '1級土木施工管理技士' },
            { name: '測量士' },
            { name: '安全管理者' },
            { name: 'クレーン運転士' },
            { name: '溶接技能者' },
            { name: 'その他' },
          ],
        },
      },
      { field_name: '連絡先電話番号', type: FIELD_TYPES.PHONE },
      { field_name: 'メールアドレス', type: FIELD_TYPES.TEXT },
      {
        field_name: '在籍フラグ',
        type: FIELD_TYPES.CHECKBOX,
      },
      { field_name: '作成日時', type: FIELD_TYPES.CREATED_TIME },
      { field_name: '更新日時', type: FIELD_TYPES.UPDATED_TIME },
    ];

    const response = await this.client.createTable(appToken, '資格者マスタ', fields);

    if (response.code !== 0 || !response.data) {
      throw new Error(`Failed to create qualified persons table: ${response.msg}`);
    }

    return {
      tableId: response.data.table_id,
      tableName: '資格者マスタ',
      fieldCount: fields.length,
    };
  }

  /**
   * 協力会社マスタテーブルを作成
   *
   * @param appToken - BaseのappToken
   * @returns テーブル作成結果
   */
  async createSubcontractorsTable(appToken: string): Promise<TableCreationResult> {
    const fields: FieldDefinition[] = [
      { field_name: '会社コード', type: FIELD_TYPES.TEXT },
      { field_name: '会社名', type: FIELD_TYPES.TEXT },
      { field_name: '代表者名', type: FIELD_TYPES.TEXT },
      { field_name: '住所', type: FIELD_TYPES.TEXT },
      { field_name: '電話番号', type: FIELD_TYPES.PHONE },
      { field_name: 'FAX番号', type: FIELD_TYPES.TEXT },
      { field_name: 'メールアドレス', type: FIELD_TYPES.TEXT },
      {
        field_name: '専門分野',
        type: FIELD_TYPES.MULTI_SELECT,
        property: {
          options: [
            { name: 'とび・土工' },
            { name: '型枠' },
            { name: '鉄筋' },
            { name: 'コンクリート' },
            { name: '左官' },
            { name: '防水' },
            { name: '塗装' },
            { name: '内装' },
            { name: '電気' },
            { name: '設備' },
            { name: '解体' },
            { name: 'その他' },
          ],
        },
      },
      {
        field_name: '評価ランク',
        type: FIELD_TYPES.SELECT,
        property: {
          options: [
            { name: 'A' },
            { name: 'B' },
            { name: 'C' },
            { name: 'D' },
          ],
        },
      },
      { field_name: '労災保険', type: FIELD_TYPES.CHECKBOX },
      { field_name: '賠償責任保険', type: FIELD_TYPES.CHECKBOX },
      { field_name: '保険期限', type: FIELD_TYPES.DATE },
      { field_name: '取引フラグ', type: FIELD_TYPES.CHECKBOX },
      { field_name: '作成日時', type: FIELD_TYPES.CREATED_TIME },
      { field_name: '更新日時', type: FIELD_TYPES.UPDATED_TIME },
    ];

    const response = await this.client.createTable(appToken, '協力会社マスタ', fields);

    if (response.code !== 0 || !response.data) {
      throw new Error(`Failed to create subcontractors table: ${response.msg}`);
    }

    return {
      tableId: response.data.table_id,
      tableName: '協力会社マスタ',
      fieldCount: fields.length,
    };
  }

  /**
   * 資機材マスタテーブルを作成
   *
   * @param appToken - BaseのappToken
   * @returns テーブル作成結果
   */
  async createEquipmentTable(appToken: string): Promise<TableCreationResult> {
    const fields: FieldDefinition[] = [
      { field_name: '資機材コード', type: FIELD_TYPES.TEXT },
      { field_name: '名称', type: FIELD_TYPES.TEXT },
      {
        field_name: '分類',
        type: FIELD_TYPES.SELECT,
        property: {
          options: [
            { name: '重機' },
            { name: '車両' },
            { name: '足場材' },
            { name: '型枠材' },
            { name: '電動工具' },
            { name: '測量機器' },
            { name: '安全設備' },
            { name: '仮設材' },
            { name: 'その他' },
          ],
        },
      },
      { field_name: 'メーカー', type: FIELD_TYPES.TEXT },
      { field_name: '型番', type: FIELD_TYPES.TEXT },
      { field_name: '仕様', type: FIELD_TYPES.TEXT },
      { field_name: '保有数量', type: FIELD_TYPES.NUMBER },
      { field_name: '単位', type: FIELD_TYPES.TEXT },
      { field_name: '日額単価', type: FIELD_TYPES.NUMBER },
      { field_name: '保管場所', type: FIELD_TYPES.TEXT },
      {
        field_name: '状態',
        type: FIELD_TYPES.SELECT,
        property: {
          options: [
            { name: '使用可能' },
            { name: '使用中' },
            { name: '整備中' },
            { name: '故障' },
            { name: '廃棄' },
          ],
        },
      },
      { field_name: '最終点検日', type: FIELD_TYPES.DATE },
      { field_name: '次回点検予定日', type: FIELD_TYPES.DATE },
      { field_name: '作成日時', type: FIELD_TYPES.CREATED_TIME },
      { field_name: '更新日時', type: FIELD_TYPES.UPDATED_TIME },
    ];

    const response = await this.client.createTable(appToken, '資機材マスタ', fields);

    if (response.code !== 0 || !response.data) {
      throw new Error(`Failed to create equipment table: ${response.msg}`);
    }

    return {
      tableId: response.data.table_id,
      tableName: '資機材マスタ',
      fieldCount: fields.length,
    };
  }

  /**
   * 工程マスタテーブルを作成
   *
   * @param appToken - BaseのappToken
   * @returns テーブル作成結果
   */
  async createProcessMasterTable(appToken: string): Promise<TableCreationResult> {
    const fields: FieldDefinition[] = [
      { field_name: '工程コード', type: FIELD_TYPES.TEXT },
      { field_name: '工程名', type: FIELD_TYPES.TEXT },
      {
        field_name: '工程分類',
        type: FIELD_TYPES.SELECT,
        property: {
          options: [
            { name: '準備工' },
            { name: '土工' },
            { name: '基礎工' },
            { name: '躯体工' },
            { name: '外装工' },
            { name: '内装工' },
            { name: '設備工' },
            { name: '仕上工' },
            { name: '検査' },
          ],
        },
      },
      { field_name: '標準工期(日)', type: FIELD_TYPES.NUMBER },
      {
        field_name: '必要資格',
        type: FIELD_TYPES.MULTI_SELECT,
        property: {
          options: [
            { name: '建築士' },
            { name: '施工管理技士' },
            { name: '測量士' },
            { name: '安全管理者' },
            { name: 'クレーン運転士' },
            { name: '溶接技能者' },
            { name: 'なし' },
          ],
        },
      },
      { field_name: '必要機材', type: FIELD_TYPES.TEXT },
      { field_name: '先行工程', type: FIELD_TYPES.TEXT },
      { field_name: '説明', type: FIELD_TYPES.TEXT },
      { field_name: '作成日時', type: FIELD_TYPES.CREATED_TIME },
      { field_name: '更新日時', type: FIELD_TYPES.UPDATED_TIME },
    ];

    const response = await this.client.createTable(appToken, '工程マスタ', fields);

    if (response.code !== 0 || !response.data) {
      throw new Error(`Failed to create process master table: ${response.msg}`);
    }

    return {
      tableId: response.data.table_id,
      tableName: '工程マスタ',
      fieldCount: fields.length,
    };
  }

  /**
   * 工程スケジュールテーブルを作成
   *
   * @param appToken - BaseのappToken
   * @returns テーブル作成結果
   */
  async createScheduleTable(appToken: string): Promise<TableCreationResult> {
    const fields: FieldDefinition[] = [
      { field_name: '工事契約ID', type: FIELD_TYPES.TEXT },
      { field_name: '工程マスタID', type: FIELD_TYPES.TEXT },
      { field_name: '工程名', type: FIELD_TYPES.TEXT },
      { field_name: '予定開始日', type: FIELD_TYPES.DATE },
      { field_name: '予定終了日', type: FIELD_TYPES.DATE },
      { field_name: '実績開始日', type: FIELD_TYPES.DATE },
      { field_name: '実績終了日', type: FIELD_TYPES.DATE },
      {
        field_name: '進捗率',
        type: FIELD_TYPES.NUMBER,
        property: { formatter: '0%' },
      },
      {
        field_name: 'ステータス',
        type: FIELD_TYPES.SELECT,
        property: {
          options: [
            { name: '未着手' },
            { name: '進行中' },
            { name: '遅延' },
            { name: '完了' },
            { name: '保留' },
          ],
        },
      },
      { field_name: '担当者ID', type: FIELD_TYPES.TEXT },
      { field_name: '担当協力会社ID', type: FIELD_TYPES.TEXT },
      { field_name: '使用機材ID', type: FIELD_TYPES.TEXT },
      { field_name: '先行工程ID', type: FIELD_TYPES.TEXT },
      { field_name: '後続工程ID', type: FIELD_TYPES.TEXT },
      { field_name: '備考', type: FIELD_TYPES.TEXT },
      { field_name: 'マイルストーン', type: FIELD_TYPES.CHECKBOX },
      { field_name: 'クリティカルパス', type: FIELD_TYPES.CHECKBOX },
      { field_name: '作成日時', type: FIELD_TYPES.CREATED_TIME },
      { field_name: '更新日時', type: FIELD_TYPES.UPDATED_TIME },
    ];

    const response = await this.client.createTable(appToken, '工程スケジュール', fields);

    if (response.code !== 0 || !response.data) {
      throw new Error(`Failed to create schedule table: ${response.msg}`);
    }

    return {
      tableId: response.data.table_id,
      tableName: '工程スケジュール',
      fieldCount: fields.length,
    };
  }

  /**
   * すべての建設業向けテーブルを一括作成
   *
   * @param appToken - BaseのappToken
   * @returns 作成されたテーブルの一覧
   */
  async createAllConstructionTables(appToken: string): Promise<TableCreationResult[]> {
    const results: TableCreationResult[] = [];

    // 順番に作成（並列実行するとAPI制限に引っかかる可能性があるため）
    results.push(await this.createContractsTable(appToken));
    results.push(await this.createQualifiedPersonsTable(appToken));
    results.push(await this.createSubcontractorsTable(appToken));
    results.push(await this.createEquipmentTable(appToken));
    results.push(await this.createProcessMasterTable(appToken));
    results.push(await this.createScheduleTable(appToken));

    return results;
  }

  /**
   * テーブルが存在するか確認
   *
   * @param appToken - BaseのappToken
   * @param tableName - テーブル名
   * @returns 存在する場合true
   */
  async tableExists(appToken: string, tableName: string): Promise<boolean> {
    try {
      const response = await this.client.listTables(appToken);

      if (response.code !== 0 || !response.data) {
        return false;
      }

      return response.data.items.some((table) => table.name === tableName);
    } catch {
      return false;
    }
  }

  /**
   * テーブル情報を取得
   *
   * @param appToken - BaseのappToken
   * @returns テーブル一覧
   */
  async listTables(appToken: string): Promise<Array<{ tableId: string; tableName: string }>> {
    const response = await this.client.listTables(appToken);

    if (response.code !== 0 || !response.data) {
      throw new Error(`Failed to list tables: ${response.msg}`);
    }

    return response.data.items.map((table) => ({
      tableId: table.table_id,
      tableName: table.name,
    }));
  }
}
