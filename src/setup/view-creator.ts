/**
 * Lark Base ビュー自動作成機能
 * 建設業向けの最適なビューを自動作成します
 */

import type { LarkClient } from '../api/lark-client.js';
import { VIEW_TYPES } from '../api/lark-client.js';

/**
 * ビュー作成結果
 */
export interface ViewCreationResult {
  viewId: string;
  viewName: string;
  viewType: string;
  tableId: string;
}

/**
 * ビュー定義
 */
export interface ViewDefinition {
  name: string;
  type: 'grid' | 'kanban' | 'gallery' | 'gantt' | 'form';
  description: string;
}

/**
 * ViewCreator - Lark Baseにビューを自動作成
 *
 * @example
 * ```typescript
 * const creator = new ViewCreator(larkClient);
 * const views = await creator.createConstructionContractViews(appToken, tableId);
 * console.log(`作成完了: ${views.length}個のビュー`);
 * ```
 */
export class ViewCreator {
  private client: LarkClient;

  /**
   * ViewCreatorを初期化
   * @param client - LarkClientインスタンス
   */
  constructor(client: LarkClient) {
    this.client = client;
  }

  /**
   * 工事契約テーブルのビューを作成
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @returns ビュー作成結果の配列
   */
  async createConstructionContractViews(
    appToken: string,
    tableId: string
  ): Promise<ViewCreationResult[]> {
    const views: ViewDefinition[] = [
      {
        name: '全工事一覧',
        type: VIEW_TYPES.GRID,
        description: 'すべての工事を一覧表示',
      },
      {
        name: '工事進捗管理',
        type: VIEW_TYPES.KANBAN,
        description: 'ステータス別カンバン表示',
      },
      {
        name: '施工中案件',
        type: VIEW_TYPES.GRID,
        description: '施工中の工事のみ表示',
      },
      {
        name: '完了予定（今月）',
        type: VIEW_TYPES.GRID,
        description: '今月竣工予定の工事',
      },
    ];

    return this.createViews(appToken, tableId, views);
  }

  /**
   * 大工程テーブルのビューを作成
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @returns ビュー作成結果の配列
   */
  async createLargeProcessViews(
    appToken: string,
    tableId: string
  ): Promise<ViewCreationResult[]> {
    const views: ViewDefinition[] = [
      {
        name: '工程スケジュール',
        type: VIEW_TYPES.GANTT,
        description: '全工程のガントチャート',
      },
      {
        name: '全工程一覧',
        type: VIEW_TYPES.GRID,
        description: 'すべての工程を一覧表示',
      },
      {
        name: '進行中工程',
        type: VIEW_TYPES.GRID,
        description: '進行中の工程のみ',
      },
    ];

    return this.createViews(appToken, tableId, views);
  }

  /**
   * 中工程テーブルのビューを作成
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @returns ビュー作成結果の配列
   */
  async createMediumProcessViews(
    appToken: string,
    tableId: string
  ): Promise<ViewCreationResult[]> {
    const views: ViewDefinition[] = [
      {
        name: '中工程スケジュール',
        type: VIEW_TYPES.GANTT,
        description: '中工程のガントチャート',
      },
      {
        name: '中工程進捗',
        type: VIEW_TYPES.KANBAN,
        description: 'ステータス別カンバン表示',
      },
      {
        name: '全中工程一覧',
        type: VIEW_TYPES.GRID,
        description: 'すべての中工程を一覧表示',
      },
    ];

    return this.createViews(appToken, tableId, views);
  }

  /**
   * 小工程テーブルのビューを作成
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @returns ビュー作成結果の配列
   */
  async createSmallProcessViews(
    appToken: string,
    tableId: string
  ): Promise<ViewCreationResult[]> {
    const views: ViewDefinition[] = [
      {
        name: '小工程スケジュール',
        type: VIEW_TYPES.GANTT,
        description: '小工程のガントチャート',
      },
      {
        name: '小工程タスクボード',
        type: VIEW_TYPES.KANBAN,
        description: 'ステータス別カンバン表示',
      },
      {
        name: '今週の作業',
        type: VIEW_TYPES.GRID,
        description: '今週着手予定の小工程',
      },
    ];

    return this.createViews(appToken, tableId, views);
  }

  /**
   * 人員配置テーブルのビューを作成
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @returns ビュー作成結果の配列
   */
  async createPersonnelAssignmentViews(
    appToken: string,
    tableId: string
  ): Promise<ViewCreationResult[]> {
    const views: ViewDefinition[] = [
      {
        name: '全人員配置',
        type: VIEW_TYPES.GRID,
        description: 'すべての人員配置を一覧表示',
      },
      {
        name: '人員稼働スケジュール',
        type: VIEW_TYPES.GANTT,
        description: '人員別の配置スケジュール',
      },
      {
        name: '今月の配置',
        type: VIEW_TYPES.GRID,
        description: '今月配置される人員',
      },
      {
        name: '担当者別',
        type: VIEW_TYPES.GRID,
        description: '担当者でグループ化',
      },
    ];

    return this.createViews(appToken, tableId, views);
  }

  /**
   * 機材配置テーブルのビューを作成
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @returns ビュー作成結果の配列
   */
  async createEquipmentAssignmentViews(
    appToken: string,
    tableId: string
  ): Promise<ViewCreationResult[]> {
    const views: ViewDefinition[] = [
      {
        name: '全機材配置',
        type: VIEW_TYPES.GRID,
        description: 'すべての機材配置を一覧表示',
      },
      {
        name: '機材使用スケジュール',
        type: VIEW_TYPES.GANTT,
        description: '機材別の使用スケジュール',
      },
      {
        name: '使用中機材',
        type: VIEW_TYPES.GRID,
        description: '現在使用中の機材のみ',
      },
      {
        name: '機材種別',
        type: VIEW_TYPES.GRID,
        description: '機材分類でグループ化',
      },
    ];

    return this.createViews(appToken, tableId, views);
  }

  /**
   * 資格者マスタテーブルのビューを作成
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @returns ビュー作成結果の配列
   */
  async createQualifiedPersonsViews(
    appToken: string,
    tableId: string
  ): Promise<ViewCreationResult[]> {
    const views: ViewDefinition[] = [
      {
        name: '資格者一覧',
        type: VIEW_TYPES.GRID,
        description: 'すべての資格者を一覧表示',
      },
      {
        name: '資格別',
        type: VIEW_TYPES.GRID,
        description: '保有資格でグループ化',
      },
      {
        name: '在籍者のみ',
        type: VIEW_TYPES.GRID,
        description: '在籍フラグが有効な資格者のみ',
      },
      {
        name: '部署別',
        type: VIEW_TYPES.GRID,
        description: '所属部署でグループ化',
      },
    ];

    return this.createViews(appToken, tableId, views);
  }

  /**
   * 資機材マスタテーブルのビューを作成
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @returns ビュー作成結果の配列
   */
  async createEquipmentMasterViews(
    appToken: string,
    tableId: string
  ): Promise<ViewCreationResult[]> {
    const views: ViewDefinition[] = [
      {
        name: '資機材一覧',
        type: VIEW_TYPES.GRID,
        description: 'すべての資機材を一覧表示',
      },
      {
        name: '使用可能機材',
        type: VIEW_TYPES.GRID,
        description: '使用可能な機材のみ',
      },
      {
        name: '分類別',
        type: VIEW_TYPES.GRID,
        description: '分類でグループ化',
      },
      {
        name: '点検管理',
        type: VIEW_TYPES.GRID,
        description: '点検予定日順に表示',
      },
      {
        name: '機材カタログ',
        type: VIEW_TYPES.GALLERY,
        description: '機材の写真を大きく表示',
      },
    ];

    return this.createViews(appToken, tableId, views);
  }

  /**
   * 安全パトロールテーブルのビューを作成
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @returns ビュー作成結果の配列
   */
  async createSafetyPatrolViews(
    appToken: string,
    tableId: string
  ): Promise<ViewCreationResult[]> {
    const views: ViewDefinition[] = [
      {
        name: '全パトロール記録',
        type: VIEW_TYPES.GRID,
        description: 'すべての記録を一覧表示',
      },
      {
        name: '写真で確認',
        type: VIEW_TYPES.GALLERY,
        description: '指摘箇所の写真を大きく表示',
      },
      {
        name: '是正状況管理',
        type: VIEW_TYPES.KANBAN,
        description: '是正状況別カンバン表示',
      },
      {
        name: '未対応事項',
        type: VIEW_TYPES.GRID,
        description: '未対応のみ表示',
      },
      {
        name: '今月の記録',
        type: VIEW_TYPES.GRID,
        description: '今月実施した記録のみ',
      },
    ];

    return this.createViews(appToken, tableId, views);
  }

  /**
   * KY活動記録テーブルのビューを作成
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @returns ビュー作成結果の配列
   */
  async createKYActivityViews(
    appToken: string,
    tableId: string
  ): Promise<ViewCreationResult[]> {
    const views: ViewDefinition[] = [
      {
        name: '全KY活動',
        type: VIEW_TYPES.GRID,
        description: 'すべてのKY活動を一覧表示',
      },
      {
        name: '今週の活動',
        type: VIEW_TYPES.GRID,
        description: '今週実施した活動のみ',
      },
      {
        name: '工事別',
        type: VIEW_TYPES.GRID,
        description: '工事名でグループ化',
      },
    ];

    return this.createViews(appToken, tableId, views);
  }

  /**
   * 作業日報テーブルのビューを作成
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @returns ビュー作成結果の配列
   */
  async createWorkDailyReportViews(
    appToken: string,
    tableId: string
  ): Promise<ViewCreationResult[]> {
    const views: ViewDefinition[] = [
      {
        name: '全作業日報',
        type: VIEW_TYPES.GRID,
        description: 'すべての作業日報を一覧表示',
      },
      {
        name: '今週の作業',
        type: VIEW_TYPES.GRID,
        description: '今週の作業日報のみ',
      },
      {
        name: '作業者別',
        type: VIEW_TYPES.GRID,
        description: '作業者でグループ化',
      },
      {
        name: '工事別',
        type: VIEW_TYPES.GRID,
        description: '工事名でグループ化',
      },
    ];

    return this.createViews(appToken, tableId, views);
  }

  /**
   * ビュー定義の配列からビューを作成
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @param views - ビュー定義の配列
   * @returns ビュー作成結果の配列
   */
  private async createViews(
    appToken: string,
    tableId: string,
    views: ViewDefinition[]
  ): Promise<ViewCreationResult[]> {
    const results: ViewCreationResult[] = [];

    for (const view of views) {
      try {
        const response = await this.client.createView(
          appToken,
          tableId,
          view.name,
          view.type
        );

        if (response.code === 0 && response.data) {
          results.push({
            viewId: response.data.view_id,
            viewName: view.name,
            viewType: view.type,
            tableId: tableId,
          });
          console.log(`✓ ビュー作成成功: ${view.name} (${view.type})`);
        } else {
          console.error(`✗ ビュー作成失敗: ${view.name} - ${response.msg}`);
        }
      } catch (error) {
        console.error(`✗ ビュー作成エラー: ${view.name}`, error);
      }

      // API制限を避けるため、少し待機
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return results;
  }

  /**
   * すべての建設業向けビューを一括作成
   *
   * @param appToken - BaseのappToken
   * @param tableIds - テーブルIDのマップ
   * @returns すべてのビュー作成結果
   */
  async createAllConstructionViews(
    appToken: string,
    tableIds: {
      contracts?: string;
      largeProcess?: string;
      mediumProcess?: string;
      smallProcess?: string;
      personnelAssignment?: string;
      equipmentAssignment?: string;
      qualifiedPersons?: string;
      equipmentMaster?: string;
      safetyPatrol?: string;
      kyActivity?: string;
      workDailyReport?: string;
    }
  ): Promise<Record<string, ViewCreationResult[]>> {
    const allResults: Record<string, ViewCreationResult[]> = {};

    if (tableIds.contracts) {
      console.log('\n=== 工事契約テーブルのビュー作成 ===');
      allResults.contracts = await this.createConstructionContractViews(
        appToken,
        tableIds.contracts
      );
    }

    if (tableIds.largeProcess) {
      console.log('\n=== 大工程テーブルのビュー作成 ===');
      allResults.largeProcess = await this.createLargeProcessViews(
        appToken,
        tableIds.largeProcess
      );
    }

    if (tableIds.mediumProcess) {
      console.log('\n=== 中工程テーブルのビュー作成 ===');
      allResults.mediumProcess = await this.createMediumProcessViews(
        appToken,
        tableIds.mediumProcess
      );
    }

    if (tableIds.smallProcess) {
      console.log('\n=== 小工程テーブルのビュー作成 ===');
      allResults.smallProcess = await this.createSmallProcessViews(
        appToken,
        tableIds.smallProcess
      );
    }

    if (tableIds.personnelAssignment) {
      console.log('\n=== 人員配置テーブルのビュー作成 ===');
      allResults.personnelAssignment = await this.createPersonnelAssignmentViews(
        appToken,
        tableIds.personnelAssignment
      );
    }

    if (tableIds.equipmentAssignment) {
      console.log('\n=== 機材配置テーブルのビュー作成 ===');
      allResults.equipmentAssignment = await this.createEquipmentAssignmentViews(
        appToken,
        tableIds.equipmentAssignment
      );
    }

    if (tableIds.qualifiedPersons) {
      console.log('\n=== 資格者マスタテーブルのビュー作成 ===');
      allResults.qualifiedPersons = await this.createQualifiedPersonsViews(
        appToken,
        tableIds.qualifiedPersons
      );
    }

    if (tableIds.equipmentMaster) {
      console.log('\n=== 資機材マスタテーブルのビュー作成 ===');
      allResults.equipmentMaster = await this.createEquipmentMasterViews(
        appToken,
        tableIds.equipmentMaster
      );
    }

    if (tableIds.safetyPatrol) {
      console.log('\n=== 安全パトロールテーブルのビュー作成 ===');
      allResults.safetyPatrol = await this.createSafetyPatrolViews(
        appToken,
        tableIds.safetyPatrol
      );
    }

    if (tableIds.kyActivity) {
      console.log('\n=== KY活動記録テーブルのビュー作成 ===');
      allResults.kyActivity = await this.createKYActivityViews(
        appToken,
        tableIds.kyActivity
      );
    }

    if (tableIds.workDailyReport) {
      console.log('\n=== 作業日報テーブルのビュー作成 ===');
      allResults.workDailyReport = await this.createWorkDailyReportViews(
        appToken,
        tableIds.workDailyReport
      );
    }

    return allResults;
  }

  /**
   * ビューが存在するか確認
   *
   * @param appToken - BaseのappToken
   * @param tableId - テーブルID
   * @param viewName - ビュー名
   * @returns 存在する場合true
   */
  async viewExists(appToken: string, tableId: string, viewName: string): Promise<boolean> {
    try {
      const response = await this.client.listViews(appToken, tableId);

      if (response.code !== 0 || !response.data) {
        return false;
      }

      return response.data.items.some((view) => view.view_name === viewName);
    } catch {
      return false;
    }
  }
}
