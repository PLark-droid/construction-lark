/**
 * サンプルデータ投入機能
 * 建設業向けのサンプルデータを自動投入します
 */

import type { LarkClient } from '../api/lark-client.js';

/**
 * サンプルデータ投入結果
 */
export interface SampleDataResult {
  tableName: string;
  recordCount: number;
  success: boolean;
}

/**
 * テーブルIDマッピング
 */
export interface TableIdMapping {
  contracts: string;
  qualifiedPersons: string;
  subcontractors: string;
  equipment: string;
  processMaster: string;
  schedule: string;
}

/**
 * SampleData - 建設業向けサンプルデータを投入
 *
 * @example
 * ```typescript
 * const sampleData = new SampleData(larkClient);
 * const results = await sampleData.insertAllSampleData(appToken, tableIds);
 * console.log(`サンプルデータ投入完了: ${results.length}テーブル`);
 * ```
 */
export class SampleData {
  private client: LarkClient;

  /**
   * SampleDataを初期化
   * @param client - LarkClientインスタンス
   */
  constructor(client: LarkClient) {
    this.client = client;
  }

  /**
   * 工事契約情報のサンプルデータを投入
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @returns 投入結果
   */
  async insertContractsSampleData(
    appToken: string,
    tableId: string
  ): Promise<SampleDataResult> {
    const sampleRecords = [
      {
        fields: {
          契約番号: 'K2025-001',
          工事名: '本社ビル新築工事',
          発注者名: '株式会社サンプル商事',
          契約金額: 500000000,
          契約日: new Date('2025-01-15').getTime(),
          着工日: new Date('2025-02-01').getTime(),
          竣工予定日: new Date('2025-12-31').getTime(),
          工事現場住所: '東京都千代田区丸の内1-1-1',
          ステータス: '施工中',
          現場責任者: '山田太郎',
          備考: '地上15階建てオフィスビル',
        },
      },
      {
        fields: {
          契約番号: 'K2025-002',
          工事名: '橋梁補修工事',
          発注者名: '国土交通省',
          契約金額: 120000000,
          契約日: new Date('2025-02-01').getTime(),
          着工日: new Date('2025-03-01').getTime(),
          竣工予定日: new Date('2025-08-31').getTime(),
          工事現場住所: '神奈川県横浜市中区本町1-1',
          ステータス: '計画中',
          現場責任者: '佐藤花子',
          備考: '老朽化した橋梁の耐震補強',
        },
      },
      {
        fields: {
          契約番号: 'K2025-003',
          工事名: 'マンション大規模修繕工事',
          発注者名: '〇〇マンション管理組合',
          契約金額: 80000000,
          契約日: new Date('2025-03-01').getTime(),
          着工日: new Date('2025-04-01').getTime(),
          竣工予定日: new Date('2025-09-30').getTime(),
          工事現場住所: '東京都新宿区西新宿2-2-2',
          ステータス: '契約済',
          現場責任者: '鈴木一郎',
          備考: '築20年、外壁塗装・防水工事',
        },
      },
    ];

    const response = await this.client.batchCreateRecords(appToken, tableId, sampleRecords);

    return {
      tableName: '工事契約情報',
      recordCount: response.data?.records?.length || 0,
      success: response.code === 0,
    };
  }

  /**
   * 資格者マスタのサンプルデータを投入
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @returns 投入結果
   */
  async insertQualifiedPersonsSampleData(
    appToken: string,
    tableId: string
  ): Promise<SampleDataResult> {
    const sampleRecords = [
      {
        fields: {
          社員番号: 'EMP-001',
          氏名: '山田太郎',
          所属部署: '建築部',
          保有資格: ['1級建築施工管理技士', '安全管理者'],
          連絡先電話番号: '090-1234-5678',
          メールアドレス: 'yamada@example.com',
          在籍フラグ: true,
        },
      },
      {
        fields: {
          社員番号: 'EMP-002',
          氏名: '佐藤花子',
          所属部署: '土木部',
          保有資格: ['1級土木施工管理技士', '測量士'],
          連絡先電話番号: '090-2345-6789',
          メールアドレス: 'sato@example.com',
          在籍フラグ: true,
        },
      },
      {
        fields: {
          社員番号: 'EMP-003',
          氏名: '鈴木一郎',
          所属部署: '建築部',
          保有資格: ['2級建築施工管理技士'],
          連絡先電話番号: '090-3456-7890',
          メールアドレス: 'suzuki@example.com',
          在籍フラグ: true,
        },
      },
      {
        fields: {
          社員番号: 'EMP-004',
          氏名: '高橋次郎',
          所属部署: '機材管理課',
          保有資格: ['クレーン運転士', '安全管理者'],
          連絡先電話番号: '090-4567-8901',
          メールアドレス: 'takahashi@example.com',
          在籍フラグ: true,
        },
      },
      {
        fields: {
          社員番号: 'EMP-005',
          氏名: '田中美咲',
          所属部署: '設備部',
          保有資格: ['1級建築士', '1級建築施工管理技士'],
          連絡先電話番号: '090-5678-9012',
          メールアドレス: 'tanaka@example.com',
          在籍フラグ: true,
        },
      },
    ];

    const response = await this.client.batchCreateRecords(appToken, tableId, sampleRecords);

    return {
      tableName: '資格者マスタ',
      recordCount: response.data?.records?.length || 0,
      success: response.code === 0,
    };
  }

  /**
   * 協力会社マスタのサンプルデータを投入
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @returns 投入結果
   */
  async insertSubcontractorsSampleData(
    appToken: string,
    tableId: string
  ): Promise<SampleDataResult> {
    const sampleRecords = [
      {
        fields: {
          会社コード: 'SUB-001',
          会社名: '株式会社鉄筋工業',
          代表者名: '鉄筋太郎',
          住所: '東京都江東区豊洲3-3-3',
          電話番号: '03-1234-5678',
          メールアドレス: 'tekkin@example.com',
          専門分野: ['鉄筋'],
          評価ランク: 'A',
          労災保険: true,
          賠償責任保険: true,
          保険期限: new Date('2026-03-31').getTime(),
          取引フラグ: true,
        },
      },
      {
        fields: {
          会社コード: 'SUB-002',
          会社名: '有限会社型枠施工',
          代表者名: '型枠次郎',
          住所: '神奈川県川崎市川崎区1-1-1',
          電話番号: '044-2345-6789',
          メールアドレス: 'katawaku@example.com',
          専門分野: ['型枠'],
          評価ランク: 'A',
          労災保険: true,
          賠償責任保険: true,
          保険期限: new Date('2026-06-30').getTime(),
          取引フラグ: true,
        },
      },
      {
        fields: {
          会社コード: 'SUB-003',
          会社名: '電気工事株式会社',
          代表者名: '電気花子',
          住所: '東京都品川区五反田2-2-2',
          電話番号: '03-3456-7890',
          メールアドレス: 'denki@example.com',
          専門分野: ['電気'],
          評価ランク: 'B',
          労災保険: true,
          賠償責任保険: true,
          保険期限: new Date('2025-12-31').getTime(),
          取引フラグ: true,
        },
      },
      {
        fields: {
          会社コード: 'SUB-004',
          会社名: '内装仕上げ工業',
          代表者名: '内装一郎',
          住所: '東京都渋谷区渋谷1-1-1',
          電話番号: '03-4567-8901',
          メールアドレス: 'naisou@example.com',
          専門分野: ['内装'],
          評価ランク: 'B',
          労災保険: true,
          賠償責任保険: false,
          取引フラグ: true,
        },
      },
    ];

    const response = await this.client.batchCreateRecords(appToken, tableId, sampleRecords);

    return {
      tableName: '協力会社マスタ',
      recordCount: response.data?.records?.length || 0,
      success: response.code === 0,
    };
  }

  /**
   * 資機材マスタのサンプルデータを投入
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @returns 投入結果
   */
  async insertEquipmentSampleData(
    appToken: string,
    tableId: string
  ): Promise<SampleDataResult> {
    const sampleRecords = [
      {
        fields: {
          資機材コード: 'EQ-001',
          名称: 'バックホー(0.7m3)',
          分類: '重機',
          メーカー: 'コマツ',
          型番: 'PC200-8',
          仕様: 'バケット容量0.7m3',
          保有数量: 3,
          単位: '台',
          日額単価: 45000,
          保管場所: '本社ヤード',
          状態: '使用可能',
          最終点検日: new Date('2025-11-01').getTime(),
          次回点検予定日: new Date('2026-02-01').getTime(),
        },
      },
      {
        fields: {
          資機材コード: 'EQ-002',
          名称: 'ラフタークレーン25t',
          分類: '重機',
          メーカー: 'タダノ',
          型番: 'GR-250N',
          仕様: '最大吊り上げ荷重25t',
          保有数量: 2,
          単位: '台',
          日額単価: 80000,
          保管場所: '本社ヤード',
          状態: '使用中',
          最終点検日: new Date('2025-10-15').getTime(),
          次回点検予定日: new Date('2026-01-15').getTime(),
        },
      },
      {
        fields: {
          資機材コード: 'EQ-003',
          名称: '足場材(単管パイプ)',
          分類: '足場材',
          仕様: '長さ3.0m',
          保有数量: 1000,
          単位: '本',
          日額単価: 50,
          保管場所: '資材倉庫A',
          状態: '使用可能',
        },
      },
      {
        fields: {
          資機材コード: 'EQ-004',
          名称: 'トータルステーション',
          分類: '測量機器',
          メーカー: 'ニコン',
          型番: 'NPL-322',
          仕様: '精度±2秒',
          保有数量: 5,
          単位: '台',
          保管場所: '測量機器保管庫',
          状態: '使用可能',
          最終点検日: new Date('2025-09-01').getTime(),
          次回点検予定日: new Date('2026-03-01').getTime(),
        },
      },
      {
        fields: {
          資機材コード: 'EQ-005',
          名称: 'ダンプトラック(4t)',
          分類: '車両',
          メーカー: '三菱ふそう',
          型番: 'キャンター',
          仕様: '最大積載量4t',
          保有数量: 5,
          単位: '台',
          日額単価: 25000,
          保管場所: '本社ヤード',
          状態: '使用可能',
          最終点検日: new Date('2025-11-20').getTime(),
          次回点検予定日: new Date('2026-05-20').getTime(),
        },
      },
    ];

    const response = await this.client.batchCreateRecords(appToken, tableId, sampleRecords);

    return {
      tableName: '資機材マスタ',
      recordCount: response.data?.records?.length || 0,
      success: response.code === 0,
    };
  }

  /**
   * 工程マスタのサンプルデータを投入
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @returns 投入結果
   */
  async insertProcessMasterSampleData(
    appToken: string,
    tableId: string
  ): Promise<SampleDataResult> {
    const sampleRecords = [
      {
        fields: {
          工程コード: 'P-001',
          工程名: '仮設工事',
          工程分類: '準備工',
          '標準工期(日)': 10,
          必要資格: ['なし'],
          必要機材: '仮囲い、足場材',
          説明: '現場の仮囲いと仮設事務所の設置',
        },
      },
      {
        fields: {
          工程コード: 'P-002',
          工程名: '掘削工事',
          工程分類: '土工',
          '標準工期(日)': 15,
          必要資格: ['施工管理技士'],
          必要機材: 'バックホー、ダンプトラック',
          先行工程: 'P-001',
          説明: '基礎部分の地盤掘削',
        },
      },
      {
        fields: {
          工程コード: 'P-003',
          工程名: '基礎工事',
          工程分類: '基礎工',
          '標準工期(日)': 20,
          必要資格: ['施工管理技士'],
          必要機材: 'コンクリートポンプ車',
          先行工程: 'P-002',
          説明: '基礎コンクリート打設',
        },
      },
      {
        fields: {
          工程コード: 'P-004',
          工程名: '鉄骨建方',
          工程分類: '躯体工',
          '標準工期(日)': 30,
          必要資格: ['施工管理技士', 'クレーン運転士'],
          必要機材: 'ラフタークレーン',
          先行工程: 'P-003',
          説明: '鉄骨の組立て',
        },
      },
      {
        fields: {
          工程コード: 'P-005',
          工程名: '外装工事',
          工程分類: '外装工',
          '標準工期(日)': 25,
          必要資格: ['施工管理技士'],
          必要機材: '足場材、高所作業車',
          先行工程: 'P-004',
          説明: '外壁パネル取付け、防水工事',
        },
      },
      {
        fields: {
          工程コード: 'P-006',
          工程名: '内装工事',
          工程分類: '内装工',
          '標準工期(日)': 40,
          必要資格: ['なし'],
          必要機材: '電動工具',
          先行工程: 'P-005',
          説明: '内装仕上げ、建具取付け',
        },
      },
      {
        fields: {
          工程コード: 'P-007',
          工程名: '電気設備工事',
          工程分類: '設備工',
          '標準工期(日)': 30,
          必要資格: ['なし'],
          必要機材: '電動工具、測定器',
          先行工程: 'P-004',
          説明: '電気配線、照明器具取付け',
        },
      },
      {
        fields: {
          工程コード: 'P-008',
          工程名: '竣工検査',
          工程分類: '検査',
          '標準工期(日)': 5,
          必要資格: ['建築士', '施工管理技士'],
          先行工程: 'P-006,P-007',
          説明: '最終検査と引き渡し準備',
        },
      },
    ];

    const response = await this.client.batchCreateRecords(appToken, tableId, sampleRecords);

    return {
      tableName: '工程マスタ',
      recordCount: response.data?.records?.length || 0,
      success: response.code === 0,
    };
  }

  /**
   * 工程スケジュールのサンプルデータを投入
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @param contractRecordId - 工事契約のレコードID
   * @returns 投入結果
   */
  async insertScheduleSampleData(
    appToken: string,
    tableId: string,
    contractRecordId: string = 'K2025-001'
  ): Promise<SampleDataResult> {
    const baseDate = new Date('2025-02-01');

    const sampleRecords = [
      {
        fields: {
          工事契約ID: contractRecordId,
          工程マスタID: 'P-001',
          工程名: '仮設工事',
          予定開始日: baseDate.getTime(),
          予定終了日: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000).getTime(),
          実績開始日: baseDate.getTime(),
          進捗率: 100,
          ステータス: '完了',
          担当者ID: 'EMP-003',
          マイルストーン: true,
          クリティカルパス: false,
        },
      },
      {
        fields: {
          工事契約ID: contractRecordId,
          工程マスタID: 'P-002',
          工程名: '掘削工事',
          予定開始日: new Date(baseDate.getTime() + 11 * 24 * 60 * 60 * 1000).getTime(),
          予定終了日: new Date(baseDate.getTime() + 25 * 24 * 60 * 60 * 1000).getTime(),
          実績開始日: new Date(baseDate.getTime() + 11 * 24 * 60 * 60 * 1000).getTime(),
          進捗率: 80,
          ステータス: '進行中',
          担当者ID: 'EMP-002',
          使用機材ID: 'EQ-001,EQ-005',
          先行工程ID: 'P-001',
          マイルストーン: false,
          クリティカルパス: true,
        },
      },
      {
        fields: {
          工事契約ID: contractRecordId,
          工程マスタID: 'P-003',
          工程名: '基礎工事',
          予定開始日: new Date(baseDate.getTime() + 26 * 24 * 60 * 60 * 1000).getTime(),
          予定終了日: new Date(baseDate.getTime() + 45 * 24 * 60 * 60 * 1000).getTime(),
          進捗率: 0,
          ステータス: '未着手',
          担当者ID: 'EMP-001',
          担当協力会社ID: 'SUB-001',
          先行工程ID: 'P-002',
          マイルストーン: true,
          クリティカルパス: true,
        },
      },
      {
        fields: {
          工事契約ID: contractRecordId,
          工程マスタID: 'P-004',
          工程名: '鉄骨建方',
          予定開始日: new Date(baseDate.getTime() + 46 * 24 * 60 * 60 * 1000).getTime(),
          予定終了日: new Date(baseDate.getTime() + 75 * 24 * 60 * 60 * 1000).getTime(),
          進捗率: 0,
          ステータス: '未着手',
          担当者ID: 'EMP-004',
          使用機材ID: 'EQ-002',
          先行工程ID: 'P-003',
          マイルストーン: true,
          クリティカルパス: true,
        },
      },
    ];

    const response = await this.client.batchCreateRecords(appToken, tableId, sampleRecords);

    return {
      tableName: '工程スケジュール',
      recordCount: response.data?.records?.length || 0,
      success: response.code === 0,
    };
  }

  /**
   * すべてのテーブルにサンプルデータを一括投入
   *
   * @param appToken - BaseのappToken
   * @param tableIds - テーブルIDマッピング
   * @returns 投入結果の一覧
   */
  async insertAllSampleData(
    appToken: string,
    tableIds: TableIdMapping
  ): Promise<SampleDataResult[]> {
    const results: SampleDataResult[] = [];

    // 順番に投入（参照関係があるため）
    results.push(await this.insertContractsSampleData(appToken, tableIds.contracts));
    results.push(await this.insertQualifiedPersonsSampleData(appToken, tableIds.qualifiedPersons));
    results.push(await this.insertSubcontractorsSampleData(appToken, tableIds.subcontractors));
    results.push(await this.insertEquipmentSampleData(appToken, tableIds.equipment));
    results.push(await this.insertProcessMasterSampleData(appToken, tableIds.processMaster));
    results.push(await this.insertScheduleSampleData(appToken, tableIds.schedule));

    return results;
  }

  /**
   * サンプルデータ投入のサマリーを生成
   *
   * @param results - 投入結果の一覧
   * @returns サマリー文字列
   */
  generateSummary(results: SampleDataResult[]): string {
    const totalRecords = results.reduce((sum, r) => sum + r.recordCount, 0);
    const successCount = results.filter((r) => r.success).length;

    const lines = [
      '='.repeat(50),
      'サンプルデータ投入完了',
      '='.repeat(50),
      `総テーブル数: ${results.length}`,
      `成功: ${successCount}`,
      `失敗: ${results.length - successCount}`,
      `総レコード数: ${totalRecords}`,
      '',
      '詳細:',
      ...results.map(
        (r) => `  - ${r.tableName}: ${r.recordCount}件 ${r.success ? '' : '(失敗)'}`
      ),
      '='.repeat(50),
    ];

    return lines.join('\n');
  }
}
