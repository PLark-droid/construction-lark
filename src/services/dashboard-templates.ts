/**
 * Dashboard Templates for Construction Industry
 * 建設業向けダッシュボードテンプレート定義
 */

import type { DashboardTemplate, BlockTemplate } from '../types/dashboard.js';

/**
 * 工事進捗ダッシュボード
 */
export function createConstructionProgressDashboard(
  tableIds: {
    contracts: string;
    schedules: string;
  }
): DashboardTemplate {
  return {
    name: '工事進捗ダッシュボード',
    description: '工事別の進捗状況と工程管理を可視化',
    blocks: [
      // 全体進捗率（数値カード）
      {
        name: '全体進捗率',
        type: 'number',
        config: {
          source: {
            table_id: tableIds.schedules,
            fields: ['progress'],
          },
          display: {
            aggregation: {
              field_id: 'progress',
              function: 'average',
            },
            format: {
              type: 'percentage',
              decimal_places: 1,
            },
            color_rules: [
              {
                condition: {
                  field_id: 'progress',
                  operator: 'less_than',
                  value: 30,
                },
                color: '#FF4D4F',
              },
              {
                condition: {
                  field_id: 'progress',
                  operator: 'less_than',
                  value: 70,
                },
                color: '#FAAD14',
              },
              {
                condition: {
                  field_id: 'progress',
                  operator: 'greater_than_or_equal_to',
                  value: 70,
                },
                color: '#52C41A',
              },
            ],
          },
        },
        position: { x: 0, y: 0 },
        size: { width: 2, height: 2 },
      },
      // 遅延工程数（数値カード）
      {
        name: '遅延工程数',
        type: 'number',
        config: {
          source: {
            table_id: tableIds.schedules,
            fields: ['status'],
            filter: {
              conjunction: 'and',
              conditions: [
                {
                  field_id: 'status',
                  operator: 'is',
                  value: 'delayed',
                },
              ],
            },
          },
          display: {
            aggregation: {
              field_id: 'status',
              function: 'count',
            },
            format: {
              type: 'number',
              decimal_places: 0,
            },
            color_rules: [
              {
                condition: {
                  field_id: 'status',
                  operator: 'greater_than',
                  value: 0,
                },
                color: '#FF4D4F',
              },
            ],
          },
        },
        position: { x: 2, y: 0 },
        size: { width: 2, height: 2 },
      },
      // 工事別進捗率（棒グラフ）
      {
        name: '工事別進捗率',
        type: 'chart',
        config: {
          source: {
            table_id: tableIds.schedules,
            fields: ['contractId', 'progress'],
            group_by: ['contractId'],
          },
          display: {
            chart_type: 'bar',
            x_axis_field: 'contractId',
            y_axis_fields: ['progress'],
            aggregations: [
              {
                field_id: 'progress',
                function: 'average',
              },
            ],
            show_legend: true,
            show_data_labels: true,
          },
        },
        position: { x: 0, y: 2 },
        size: { width: 6, height: 4 },
      },
      // 工程ステータス別件数（ドーナツグラフ）
      {
        name: '工程ステータス別件数',
        type: 'chart',
        config: {
          source: {
            table_id: tableIds.schedules,
            fields: ['status'],
            group_by: ['status'],
          },
          display: {
            chart_type: 'donut',
            aggregations: [
              {
                field_id: 'status',
                function: 'count',
              },
            ],
            show_legend: true,
            show_data_labels: true,
            color_scheme: 'status',
          },
        },
        position: { x: 6, y: 2 },
        size: { width: 4, height: 4 },
      },
      // 今週の作業予定（テーブル）
      {
        name: '今週の作業予定',
        type: 'table',
        config: {
          source: {
            table_id: tableIds.schedules,
            fields: [
              'name',
              'contractId',
              'plannedStartDate',
              'plannedEndDate',
              'status',
              'assignedPersonIds',
            ],
            filter: {
              conjunction: 'and',
              conditions: [
                {
                  field_id: 'plannedStartDate',
                  operator: 'greater_than_or_equal_to',
                  value: '{{start_of_week}}',
                },
                {
                  field_id: 'plannedStartDate',
                  operator: 'less_than_or_equal_to',
                  value: '{{end_of_week}}',
                },
              ],
            },
            sort: [{ field_id: 'plannedStartDate', desc: false }],
          },
        },
        position: { x: 0, y: 6 },
        size: { width: 10, height: 4 },
      },
    ],
  };
}

/**
 * 機材管理ダッシュボード
 */
export function createEquipmentManagementDashboard(
  tableIds: {
    equipment: string;
    schedules: string;
  }
): DashboardTemplate {
  return {
    name: '機材管理ダッシュボード',
    description: '機材の稼働状況と使用計画を管理',
    blocks: [
      // 総機材数（数値カード）
      {
        name: '総機材数',
        type: 'number',
        config: {
          source: {
            table_id: tableIds.equipment,
            fields: ['quantity'],
          },
          display: {
            aggregation: {
              field_id: 'quantity',
              function: 'sum',
            },
            format: {
              type: 'number',
              decimal_places: 0,
              show_thousands_separator: true,
            },
          },
        },
        position: { x: 0, y: 0 },
        size: { width: 2, height: 2 },
      },
      // 使用中機材数（数値カード）
      {
        name: '使用中機材数',
        type: 'number',
        config: {
          source: {
            table_id: tableIds.equipment,
            fields: ['status', 'quantity'],
            filter: {
              conjunction: 'and',
              conditions: [
                {
                  field_id: 'status',
                  operator: 'is',
                  value: 'in_use',
                },
              ],
            },
          },
          display: {
            aggregation: {
              field_id: 'quantity',
              function: 'sum',
            },
            format: {
              type: 'number',
              decimal_places: 0,
              show_thousands_separator: true,
            },
          },
        },
        position: { x: 2, y: 0 },
        size: { width: 2, height: 2 },
      },
      // 機材稼働率（ドーナツグラフ）
      {
        name: '機材稼働率',
        type: 'chart',
        config: {
          source: {
            table_id: tableIds.equipment,
            fields: ['status', 'quantity'],
            group_by: ['status'],
          },
          display: {
            chart_type: 'donut',
            aggregations: [
              {
                field_id: 'quantity',
                function: 'sum',
              },
            ],
            show_legend: true,
            show_data_labels: true,
          },
        },
        position: { x: 4, y: 0 },
        size: { width: 4, height: 4 },
      },
      // 機材別使用状況（積み上げ棒グラフ）
      {
        name: '機材別使用状況',
        type: 'chart',
        config: {
          source: {
            table_id: tableIds.equipment,
            fields: ['category', 'status', 'quantity'],
            group_by: ['category', 'status'],
          },
          display: {
            chart_type: 'stacked_bar',
            x_axis_field: 'category',
            y_axis_fields: ['quantity'],
            aggregations: [
              {
                field_id: 'quantity',
                function: 'sum',
              },
            ],
            stacked: true,
            show_legend: true,
          },
        },
        position: { x: 0, y: 2 },
        size: { width: 8, height: 4 },
      },
      // 空き機材一覧（テーブル）
      {
        name: '空き機材一覧',
        type: 'table',
        config: {
          source: {
            table_id: tableIds.equipment,
            fields: ['name', 'category', 'quantity', 'location'],
            filter: {
              conjunction: 'and',
              conditions: [
                {
                  field_id: 'status',
                  operator: 'is',
                  value: 'available',
                },
              ],
            },
            sort: [{ field_id: 'category', desc: false }],
          },
        },
        position: { x: 0, y: 6 },
        size: { width: 10, height: 4 },
      },
    ],
  };
}

/**
 * 人員配置ダッシュボード
 */
export function createPersonnelAllocationDashboard(
  tableIds: {
    qualifiedPersons: string;
    schedules: string;
  }
): DashboardTemplate {
  return {
    name: '人員配置ダッシュボード',
    description: '作業員の配置状況と稼働率を管理',
    blocks: [
      // 総人員数（数値カード）
      {
        name: '総人員数',
        type: 'number',
        config: {
          source: {
            table_id: tableIds.qualifiedPersons,
            fields: ['isActive'],
            filter: {
              conjunction: 'and',
              conditions: [
                {
                  field_id: 'isActive',
                  operator: 'is',
                  value: true,
                },
              ],
            },
          },
          display: {
            aggregation: {
              field_id: 'isActive',
              function: 'count',
            },
            format: {
              type: 'number',
              decimal_places: 0,
            },
          },
        },
        position: { x: 0, y: 0 },
        size: { width: 2, height: 2 },
      },
      // 稼働中人員数（数値カード）
      {
        name: '稼働中人員数',
        type: 'number',
        config: {
          source: {
            table_id: tableIds.schedules,
            fields: ['assignedPersonIds', 'status'],
            filter: {
              conjunction: 'and',
              conditions: [
                {
                  field_id: 'status',
                  operator: 'is',
                  value: 'in_progress',
                },
              ],
            },
          },
          display: {
            aggregation: {
              field_id: 'assignedPersonIds',
              function: 'count_distinct',
            },
            format: {
              type: 'number',
              decimal_places: 0,
            },
          },
        },
        position: { x: 2, y: 0 },
        size: { width: 2, height: 2 },
      },
      // 担当者別工程数（棒グラフ）
      {
        name: '担当者別工程数',
        type: 'chart',
        config: {
          source: {
            table_id: tableIds.schedules,
            fields: ['assignedPersonIds'],
            group_by: ['assignedPersonIds'],
          },
          display: {
            chart_type: 'bar',
            x_axis_field: 'assignedPersonIds',
            y_axis_fields: ['assignedPersonIds'],
            aggregations: [
              {
                field_id: 'assignedPersonIds',
                function: 'count',
              },
            ],
            show_legend: false,
            show_data_labels: true,
          },
        },
        position: { x: 0, y: 2 },
        size: { width: 6, height: 4 },
      },
      // 稼働率グラフ（折れ線グラフ）
      {
        name: '稼働率グラフ',
        type: 'chart',
        config: {
          source: {
            table_id: tableIds.schedules,
            fields: ['plannedStartDate', 'assignedPersonIds'],
            group_by: ['plannedStartDate'],
          },
          display: {
            chart_type: 'line',
            x_axis_field: 'plannedStartDate',
            y_axis_fields: ['assignedPersonIds'],
            aggregations: [
              {
                field_id: 'assignedPersonIds',
                function: 'count_distinct',
              },
            ],
            show_legend: true,
            show_data_labels: false,
          },
        },
        position: { x: 6, y: 2 },
        size: { width: 4, height: 4 },
      },
      // 今日の配置状況（テーブル）
      {
        name: '今日の配置状況',
        type: 'table',
        config: {
          source: {
            table_id: tableIds.schedules,
            fields: [
              'name',
              'contractId',
              'assignedPersonIds',
              'plannedStartDate',
              'plannedEndDate',
              'status',
            ],
            filter: {
              conjunction: 'and',
              conditions: [
                {
                  field_id: 'status',
                  operator: 'is',
                  value: 'in_progress',
                },
                {
                  field_id: 'plannedStartDate',
                  operator: 'less_than_or_equal_to',
                  value: '{{today}}',
                },
                {
                  field_id: 'plannedEndDate',
                  operator: 'greater_than_or_equal_to',
                  value: '{{today}}',
                },
              ],
            },
            sort: [{ field_id: 'contractId', desc: false }],
          },
        },
        position: { x: 0, y: 6 },
        size: { width: 10, height: 4 },
      },
    ],
  };
}

/**
 * 安全管理ダッシュボード
 */
export function createSafetyManagementDashboard(
  tableIds: {
    contracts: string;
    safetyRecords?: string;
  }
): DashboardTemplate {
  return {
    name: '安全管理ダッシュボード',
    description: '安全活動の実施状況と事故防止対策を管理',
    blocks: [
      // 今月の安全スコア（数値カード）
      {
        name: '今月の安全スコア',
        type: 'number',
        config: {
          source: {
            table_id: tableIds.safetyRecords || tableIds.contracts,
            fields: ['safetyScore'],
          },
          display: {
            aggregation: {
              field_id: 'safetyScore',
              function: 'average',
            },
            format: {
              type: 'number',
              decimal_places: 1,
            },
            comparison: {
              type: 'target_value',
              target_value: 90,
              show_difference: true,
            },
            color_rules: [
              {
                condition: {
                  field_id: 'safetyScore',
                  operator: 'less_than',
                  value: 70,
                },
                color: '#FF4D4F',
              },
              {
                condition: {
                  field_id: 'safetyScore',
                  operator: 'less_than',
                  value: 85,
                },
                color: '#FAAD14',
              },
              {
                condition: {
                  field_id: 'safetyScore',
                  operator: 'greater_than_or_equal_to',
                  value: 85,
                },
                color: '#52C41A',
              },
            ],
          },
        },
        position: { x: 0, y: 0 },
        size: { width: 2, height: 2 },
      },
      // KY活動実施率（進捗バー）
      {
        name: 'KY活動実施率',
        type: 'progress',
        config: {
          source: {
            table_id: tableIds.safetyRecords || tableIds.contracts,
            fields: ['kyActivityCompleted', 'kyActivityPlanned'],
          },
          display: {
            current_value_field: 'kyActivityCompleted',
            target_value_field: 'kyActivityPlanned',
            show_percentage: true,
            format: {
              type: 'percentage',
              decimal_places: 1,
            },
            color: '#1890FF',
          },
        },
        position: { x: 2, y: 0 },
        size: { width: 4, height: 2 },
      },
      // 安全パトロール結果（棒グラフ）
      {
        name: '安全パトロール結果',
        type: 'chart',
        config: {
          source: {
            table_id: tableIds.safetyRecords || tableIds.contracts,
            fields: ['patrolDate', 'issuesFound', 'issuesResolved'],
            group_by: ['patrolDate'],
          },
          display: {
            chart_type: 'column',
            x_axis_field: 'patrolDate',
            y_axis_fields: ['issuesFound', 'issuesResolved'],
            show_legend: true,
            show_data_labels: true,
          },
        },
        position: { x: 0, y: 2 },
        size: { width: 6, height: 4 },
      },
      // 事故・ヒヤリハット件数（折れ線グラフ）
      {
        name: '事故・ヒヤリハット件数',
        type: 'chart',
        config: {
          source: {
            table_id: tableIds.safetyRecords || tableIds.contracts,
            fields: ['reportDate', 'incidentType', 'severity'],
            group_by: ['reportDate', 'incidentType'],
          },
          display: {
            chart_type: 'line',
            x_axis_field: 'reportDate',
            y_axis_fields: ['incidentType'],
            aggregations: [
              {
                field_id: 'incidentType',
                function: 'count',
              },
            ],
            show_legend: true,
            show_data_labels: false,
          },
        },
        position: { x: 6, y: 2 },
        size: { width: 4, height: 4 },
      },
      // 未対応の指摘事項（テーブル）
      {
        name: '未対応の指摘事項',
        type: 'table',
        config: {
          source: {
            table_id: tableIds.safetyRecords || tableIds.contracts,
            fields: [
              'patrolDate',
              'contractId',
              'issueDescription',
              'severity',
              'responsiblePerson',
              'dueDate',
            ],
            filter: {
              conjunction: 'and',
              conditions: [
                {
                  field_id: 'status',
                  operator: 'is_not',
                  value: 'resolved',
                },
              ],
            },
            sort: [
              { field_id: 'severity', desc: true },
              { field_id: 'dueDate', desc: false },
            ],
          },
        },
        position: { x: 0, y: 6 },
        size: { width: 10, height: 4 },
      },
    ],
  };
}
