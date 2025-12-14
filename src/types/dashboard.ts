/**
 * Lark Base Dashboard API - 型定義
 * ダッシュボードとブロック（チャート、統計）の作成・管理
 */

// ========================================
// Dashboard Types
// ========================================
export interface Dashboard {
  dashboard_id: string;
  name: string;
  block_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateDashboardRequest {
  name: string;
  block_ids?: string[];
}

export interface CreateDashboardResponse {
  dashboard_id: string;
}

// ========================================
// Dashboard Block Types
// ========================================
export type BlockType =
  | 'chart'           // チャート
  | 'number'          // 数値統計
  | 'progress'        // 進捗バー
  | 'table'           // テーブル
  | 'pivot'           // ピボットテーブル
  | 'kanban'          // カンバン
  | 'gantt'           // ガントチャート
  | 'calendar'        // カレンダー
  | 'timeline';       // タイムライン

export interface DashboardBlock {
  block_id: string;
  name: string;
  type: BlockType;
  config: BlockConfig;
  position: BlockPosition;
  size: BlockSize;
}

export interface BlockPosition {
  x: number;
  y: number;
}

export interface BlockSize {
  width: number;
  height: number;
}

// ========================================
// Block Configurations
// ========================================
export interface BlockConfig {
  source: DataSource;
  display?: DisplayConfig;
}

export interface DataSource {
  table_id: string;
  view_id?: string;
  fields: string[];
  filter?: FilterConfig;
  sort?: SortConfig[];
  group_by?: string[];
}

export interface FilterConfig {
  conjunction: 'and' | 'or';
  conditions: FilterCondition[];
}

export interface FilterCondition {
  field_id: string;
  operator: FilterOperator;
  value: unknown;
}

export type FilterOperator =
  | 'is'
  | 'is_not'
  | 'contains'
  | 'does_not_contain'
  | 'is_empty'
  | 'is_not_empty'
  | 'greater_than'
  | 'less_than'
  | 'greater_than_or_equal_to'
  | 'less_than_or_equal_to';

export interface SortConfig {
  field_id: string;
  desc: boolean;
}

export interface DisplayConfig {
  // Common
  chart_type?: ChartType;
  aggregation?: AggregationConfig;
  color_scheme?: string;
  show_legend?: boolean;
  show_data_labels?: boolean;
  // Number/Progress specific
  format?: NumberFormat;
  comparison?: ComparisonConfig;
  color_rules?: ColorRule[];
  // Chart specific
  x_axis_field?: string;
  y_axis_fields?: string[];
  aggregations?: AggregationConfig[];
  stacked?: boolean;
  // Progress specific
  current_value_field?: string;
  target_value_field?: string;
  target_value?: number;
  show_percentage?: boolean;
  color?: string;
}

export type ChartType =
  | 'bar'             // 棒グラフ
  | 'line'            // 折れ線グラフ
  | 'pie'             // 円グラフ
  | 'donut'           // ドーナツグラフ
  | 'area'            // 面グラフ
  | 'scatter'         // 散布図
  | 'column'          // 縦棒グラフ
  | 'stacked_bar'     // 積み上げ棒グラフ
  | 'stacked_column'; // 積み上げ縦棒グラフ

export interface AggregationConfig {
  field_id: string;
  function: AggregationFunction;
}

export type AggregationFunction =
  | 'count'
  | 'count_distinct'
  | 'sum'
  | 'average'
  | 'min'
  | 'max'
  | 'median';

// ========================================
// Number Block (統計カード)
// ========================================
export interface NumberBlockConfig extends BlockConfig {
  display: NumberDisplayConfig;
}

export interface NumberDisplayConfig {
  aggregation: AggregationConfig;
  format?: NumberFormat;
  comparison?: ComparisonConfig;
  color_rules?: ColorRule[];
}

export interface NumberFormat {
  type: 'number' | 'currency' | 'percentage';
  decimal_places?: number;
  currency_code?: string;
  show_thousands_separator?: boolean;
}

export interface ComparisonConfig {
  type: 'previous_period' | 'target_value';
  target_value?: number;
  show_difference?: boolean;
  show_percentage_change?: boolean;
}

export interface ColorRule {
  condition: FilterCondition;
  color: string;
}

// ========================================
// Progress Block (進捗バー)
// ========================================
export interface ProgressBlockConfig extends BlockConfig {
  display: ProgressDisplayConfig;
}

export interface ProgressDisplayConfig {
  current_value_field: string;
  target_value_field?: string;
  target_value?: number;
  format?: NumberFormat;
  show_percentage?: boolean;
  color?: string;
}

// ========================================
// Chart Block (チャート)
// ========================================
export interface ChartBlockConfig extends BlockConfig {
  display: ChartDisplayConfig;
}

export interface ChartDisplayConfig {
  chart_type: ChartType;
  x_axis_field?: string;
  y_axis_fields: string[];
  aggregations?: AggregationConfig[];
  color_scheme?: string;
  show_legend?: boolean;
  show_data_labels?: boolean;
  stacked?: boolean;
}

// ========================================
// Create Block Request
// ========================================
export interface CreateBlockRequest {
  name: string;
  type: BlockType;
  config: BlockConfig;
  position?: BlockPosition;
  size?: BlockSize;
}

export interface CreateBlockResponse {
  block_id: string;
}

// ========================================
// Dashboard Template Types
// ========================================
export interface DashboardTemplate {
  name: string;
  description: string;
  blocks: BlockTemplate[];
}

export interface BlockTemplate {
  name: string;
  type: BlockType;
  config: Partial<BlockConfig>;
  position: BlockPosition;
  size: BlockSize;
}

// ========================================
// 建設業向けダッシュボード定義
// ========================================

/**
 * 工事進捗ダッシュボード
 */
export interface ConstructionProgressDashboard extends DashboardTemplate {
  blocks: [
    BlockTemplate & { type: 'chart'; name: '工事別進捗率' },
    BlockTemplate & { type: 'chart'; name: '工程ステータス別件数' },
    BlockTemplate & { type: 'table'; name: '今週の作業予定' },
    BlockTemplate & { type: 'number'; name: '全体進捗率' },
    BlockTemplate & { type: 'number'; name: '遅延工程数' }
  ];
}

/**
 * 機材管理ダッシュボード
 */
export interface EquipmentManagementDashboard extends DashboardTemplate {
  blocks: [
    BlockTemplate & { type: 'chart'; name: '機材稼働率' },
    BlockTemplate & { type: 'chart'; name: '機材別使用状況' },
    BlockTemplate & { type: 'table'; name: '空き機材一覧' },
    BlockTemplate & { type: 'number'; name: '総機材数' },
    BlockTemplate & { type: 'number'; name: '使用中機材数' }
  ];
}

/**
 * 人員配置ダッシュボード
 */
export interface PersonnelAllocationDashboard extends DashboardTemplate {
  blocks: [
    BlockTemplate & { type: 'chart'; name: '担当者別工程数' },
    BlockTemplate & { type: 'table'; name: '今日の配置状況' },
    BlockTemplate & { type: 'chart'; name: '稼働率グラフ' },
    BlockTemplate & { type: 'number'; name: '総人員数' },
    BlockTemplate & { type: 'number'; name: '稼働中人員数' }
  ];
}

/**
 * 安全管理ダッシュボード
 */
export interface SafetyManagementDashboard extends DashboardTemplate {
  blocks: [
    BlockTemplate & { type: 'progress'; name: 'KY活動実施率' },
    BlockTemplate & { type: 'chart'; name: '安全パトロール結果' },
    BlockTemplate & { type: 'chart'; name: '事故・ヒヤリハット件数' },
    BlockTemplate & { type: 'number'; name: '今月の安全スコア' },
    BlockTemplate & { type: 'table'; name: '未対応の指摘事項' }
  ];
}
