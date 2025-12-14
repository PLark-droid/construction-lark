/**
 * 工程管理Base - 型定義
 * ガントチャート・スケジュール管理
 */

import type {
  ConstructionContract,
  QualifiedPerson,
  Subcontractor,
  Equipment,
  ProcessMaster,
} from './construction';

// ========================================
// 工程スケジュール（実際の工程）
// ========================================
export interface ScheduleItem {
  id: string;
  contractId: string;            // 工事契約ID
  processId: string;             // 工程マスタID
  name: string;                  // 工程名（表示用）
  plannedStartDate: string;      // 予定開始日
  plannedEndDate: string;        // 予定終了日
  actualStartDate?: string;      // 実績開始日
  actualEndDate?: string;        // 実績終了日
  progress: number;              // 進捗率（0-100）
  status: ScheduleStatus;        // ステータス
  assignedPersonIds: string[];   // 担当者ID（資格者）
  assignedSubcontractorIds: string[]; // 担当協力会社ID
  assignedEquipmentIds: string[];    // 使用機材ID
  predecessorIds: string[];      // 先行工程ID
  successorIds: string[];        // 後続工程ID
  notes?: string;                // 備考
  milestoneFlag: boolean;        // マイルストーンフラグ
  criticalPath: boolean;         // クリティカルパスフラグ
  createdAt: string;
  updatedAt: string;
}

export type ScheduleStatus =
  | 'not_started'                // 未着手
  | 'in_progress'                // 進行中
  | 'delayed'                    // 遅延
  | 'completed'                  // 完了
  | 'on_hold';                   // 保留

// ========================================
// ガントチャート用データ構造
// ========================================
export interface GanttChartData {
  contract: ConstructionContract;
  scheduleItems: GanttItem[];
  milestones: Milestone[];
  summary: GanttSummary;
}

export interface GanttItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: ScheduleStatus;
  level: number;                 // 階層レベル
  parentId?: string;             // 親工程ID
  children: GanttItem[];         // 子工程
  dependencies: string[];        // 依存関係（先行工程ID）
  assignees: AssigneeInfo[];     // 担当情報
  equipment: EquipmentInfo[];    // 機材情報
  color?: string;                // 表示色
  isCriticalPath: boolean;
}

export interface AssigneeInfo {
  id: string;
  name: string;
  type: 'person' | 'subcontractor';
  role?: string;
}

export interface EquipmentInfo {
  id: string;
  name: string;
  quantity: number;
}

export interface Milestone {
  id: string;
  name: string;
  date: string;
  status: 'pending' | 'achieved' | 'missed';
  description?: string;
}

export interface GanttSummary {
  totalDuration: number;         // 総工期（日）
  elapsedDays: number;           // 経過日数
  remainingDays: number;         // 残日数
  overallProgress: number;       // 全体進捗率
  delayedItems: number;          // 遅延工程数
  criticalPathLength: number;    // クリティカルパス長
}

// ========================================
// フィルタリング条件
// ========================================
export interface GanttFilter {
  contractId?: string;           // 工事別
  personId?: string;             // 人別
  subcontractorId?: string;      // 協力会社別
  equipmentId?: string;          // 機材別
  dateRange?: DateRange;         // 期間
  status?: ScheduleStatus[];     // ステータス
  showCriticalPathOnly?: boolean;// クリティカルパスのみ
}

export interface DateRange {
  start: string;
  end: string;
}

// ========================================
// 人別ガントチャート
// ========================================
export interface PersonGanttData {
  person: QualifiedPerson;
  assignments: PersonAssignment[];
  workload: WorkloadSummary;
}

export interface PersonAssignment {
  scheduleItem: ScheduleItem;
  contractName: string;
  role: string;
  period: DateRange;
}

export interface WorkloadSummary {
  totalAssignments: number;
  currentAssignments: number;
  upcomingAssignments: number;
  utilizationRate: number;       // 稼働率（%）
}

// ========================================
// 機材別ガントチャート
// ========================================
export interface EquipmentGanttData {
  equipment: Equipment;
  allocations: EquipmentAllocation[];
  availability: AvailabilitySummary;
}

export interface EquipmentAllocation {
  scheduleItem: ScheduleItem;
  contractName: string;
  quantity: number;
  period: DateRange;
}

export interface AvailabilitySummary {
  totalQuantity: number;
  currentlyUsed: number;
  available: number;
  utilizationRate: number;       // 稼働率（%）
  conflicts: AllocationConflict[];
}

export interface AllocationConflict {
  date: string;
  requiredQuantity: number;
  availableQuantity: number;
  affectedSchedules: string[];
}

// ========================================
// 協力会社別ガントチャート
// ========================================
export interface SubcontractorGanttData {
  subcontractor: Subcontractor;
  assignments: SubcontractorAssignment[];
  capacity: CapacitySummary;
}

export interface SubcontractorAssignment {
  scheduleItem: ScheduleItem;
  contractName: string;
  workType: string;
  period: DateRange;
}

export interface CapacitySummary {
  currentProjects: number;
  totalContractValue: number;
  performanceScore: number;
}
