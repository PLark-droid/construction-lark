/**
 * シンプル建設業務管理パッケージ v2.0 - 型定義
 * ISO9001準拠設計 - 5テーブル構成
 */

// ========================================
// 1. 従業員マスタ
// ========================================
export interface Employee {
  id: string;
  employeeId: string;        // 社員番号（主キー）
  name: string;              // 氏名
  nameKana: string;          // フリガナ
  department: Department;    // 所属
  position: Position;        // 役職
  hireDate: string;          // 入社日
  phone?: string;            // 連絡先
  status: EmployeeStatus;    // 状態
  createdAt: string;
  updatedAt: string;
}

export type Department =
  | '本社'
  | '工事部'
  | '設計部'
  | '営業部'
  | '管理部';

export type Position =
  | '代表取締役'
  | '取締役'
  | '部長'
  | '課長'
  | '主任'
  | '一般';

export type EmployeeStatus =
  | '在籍'
  | '休職'
  | '退職';

// ========================================
// 2. 資格マスタ
// ========================================
export interface QualificationMaster {
  id: string;
  qualificationCode: string;     // 資格コード（主キー）
  name: string;                  // 資格名
  category: SimpleQualificationCategory; // カテゴリ
  hasExpiry: boolean;            // 有効期限管理
  renewalCycleYears?: number;    // 更新周期（年）
  requiredDepartments: Department[]; // 必須部署
  notes?: string;                // 備考
  createdAt: string;
  updatedAt: string;
}

export type SimpleQualificationCategory =
  | '国家資格'
  | '民間資格'
  | '社内認定';

// ========================================
// 3. 資格記録（力量管理）- ISO9001 7.2
// ========================================
export interface QualificationRecord {
  id: string;
  employeeId: string;            // 従業員ID → 従業員マスタ
  qualificationId: string;       // 資格ID → 資格マスタ
  acquisitionDate: string;       // 取得日
  expiryDate?: string;           // 有効期限
  certificateNumber?: string;    // 証明書番号
  status: QualificationRecordStatus; // 状態
  nextRenewalDate?: string;      // 次回更新予定
  notes?: string;                // 備考
  createdAt: string;
  updatedAt: string;
}

export type QualificationRecordStatus =
  | '有効'
  | '期限切れ'
  | '更新中';

// ========================================
// 4. 案件（工事）管理
// ========================================
export interface Project {
  id: string;
  projectNumber: string;         // 案件番号（自動採番）
  projectName: string;           // 案件名
  clientName: string;            // 顧客名
  siteAddress: string;           // 現場住所
  contractAmount?: number;       // 契約金額
  startDate: string;             // 着工日
  plannedEndDate: string;        // 竣工予定日
  actualEndDate?: string;        // 竣工実績日
  status: ProjectStatus;         // 状態
  progressRate: number;          // 進捗率（0-100）- 工程から自動計算
  managerId: string;             // 責任者ID → 従業員マスタ
  memberIds: string[];           // 担当者IDs → 従業員マスタ
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus =
  | '計画中'
  | '進行中'
  | '完了'
  | '中止';

// ========================================
// 5. 工程管理（タスク）- ISO9001 8.1
// ========================================
export interface Task {
  id: string;
  projectId: string;             // 案件ID → 案件管理
  taskName: string;              // 工程名
  order: number;                 // 順序
  plannedStartDate: string;      // 開始予定日
  plannedEndDate: string;        // 終了予定日
  actualStartDate?: string;      // 開始実績日
  actualEndDate?: string;        // 終了実績日
  status: TaskStatus;            // 状態
  progressRate: number;          // 進捗率（0-100）
  assigneeId?: string;           // 担当者ID → 従業員マスタ
  requiredQualificationIds: string[]; // 必要資格IDs → 資格マスタ
  notes?: string;                // 備考
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus =
  | '未着手'
  | '進行中'
  | '完了'
  | '保留';

// ========================================
// テーブル名定義
// ========================================
export const SIMPLE_BASE_TABLES = {
  EMPLOYEES: '従業員マスタ',
  QUALIFICATIONS: '資格マスタ',
  QUALIFICATION_RECORDS: '資格記録',
  PROJECTS: '案件管理',
  TASKS: '工程管理',
} as const;

// ========================================
// Lark Base フィールド定義
// ========================================
export interface LarkFieldDefinition {
  field_name: string;
  type: number;  // Lark Base field type
  property?: Record<string, unknown>;
}

export const EMPLOYEE_FIELDS: LarkFieldDefinition[] = [
  { field_name: '社員番号', type: 1 },  // Text
  { field_name: '氏名', type: 1 },
  { field_name: 'フリガナ', type: 1 },
  { field_name: '所属', type: 3, property: { options: [
    { name: '本社' }, { name: '工事部' }, { name: '設計部' }, { name: '営業部' }, { name: '管理部' }
  ]}},
  { field_name: '役職', type: 3, property: { options: [
    { name: '代表取締役' }, { name: '取締役' }, { name: '部長' }, { name: '課長' }, { name: '主任' }, { name: '一般' }
  ]}},
  { field_name: '入社日', type: 5 },  // Date
  { field_name: '連絡先', type: 13 }, // Phone
  { field_name: '状態', type: 3, property: { options: [
    { name: '在籍', color: 0 }, { name: '休職', color: 1 }, { name: '退職', color: 2 }
  ]}},
];

export const QUALIFICATION_MASTER_FIELDS: LarkFieldDefinition[] = [
  { field_name: '資格コード', type: 1 },
  { field_name: '資格名', type: 1 },
  { field_name: 'カテゴリ', type: 3, property: { options: [
    { name: '国家資格' }, { name: '民間資格' }, { name: '社内認定' }
  ]}},
  { field_name: '有効期限管理', type: 7 },  // Checkbox
  { field_name: '更新周期（年）', type: 2 }, // Number
  { field_name: '必須部署', type: 4, property: { options: [
    { name: '本社' }, { name: '工事部' }, { name: '設計部' }, { name: '営業部' }, { name: '管理部' }
  ]}},  // Multi-select
  { field_name: '備考', type: 1 },
];

export const QUALIFICATION_RECORD_FIELDS: LarkFieldDefinition[] = [
  { field_name: '従業員', type: 18 },  // Link (will be configured after table creation)
  { field_name: '資格', type: 18 },    // Link
  { field_name: '取得日', type: 5 },
  { field_name: '有効期限', type: 5 },
  { field_name: '証明書番号', type: 1 },
  { field_name: '状態', type: 3, property: { options: [
    { name: '有効', color: 0 }, { name: '期限切れ', color: 2 }, { name: '更新中', color: 1 }
  ]}},
  { field_name: '次回更新予定', type: 5 },
  { field_name: '備考', type: 1 },
];

export const PROJECT_FIELDS: LarkFieldDefinition[] = [
  { field_name: '案件番号', type: 1 },
  { field_name: '案件名', type: 1 },
  { field_name: '顧客名', type: 1 },
  { field_name: '現場住所', type: 1 },
  { field_name: '契約金額', type: 99001 },  // Currency
  { field_name: '着工日', type: 5 },
  { field_name: '竣工予定日', type: 5 },
  { field_name: '竣工実績日', type: 5 },
  { field_name: '状態', type: 3, property: { options: [
    { name: '計画中', color: 1 }, { name: '進行中', color: 0 }, { name: '完了', color: 3 }, { name: '中止', color: 2 }
  ]}},
  { field_name: '進捗率', type: 99002 },  // Progress
  { field_name: '責任者', type: 18 },     // Link to Employee
  { field_name: '担当者', type: 18 },     // Link to Employee (multiple)
];

export const TASK_FIELDS: LarkFieldDefinition[] = [
  { field_name: '案件', type: 18 },       // Link to Project
  { field_name: '工程名', type: 1 },
  { field_name: '順序', type: 2 },
  { field_name: '開始予定日', type: 5 },
  { field_name: '終了予定日', type: 5 },
  { field_name: '開始実績日', type: 5 },
  { field_name: '終了実績日', type: 5 },
  { field_name: '状態', type: 3, property: { options: [
    { name: '未着手', color: 1 }, { name: '進行中', color: 0 }, { name: '完了', color: 3 }, { name: '保留', color: 2 }
  ]}},
  { field_name: '進捗率', type: 2 },
  { field_name: '担当者', type: 18 },     // Link to Employee
  { field_name: '必要資格', type: 18 },   // Link to Qualification
  { field_name: '備考', type: 1 },
];

// ========================================
// ダッシュボード用KPI型
// ========================================
export interface DashboardKPI {
  activeProjects: number;        // 進行中案件数
  completedThisMonth: number;    // 今月完了数
  expiringQualifications: number; // 期限切れ間近の資格数
  totalEmployees: number;        // 従業員数
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  progressRate: number;
  status: ProjectStatus;
  daysRemaining: number;
}

export interface Alert {
  type: 'qualification_expiring' | 'project_delayed' | 'task_overdue';
  severity: 'warning' | 'critical';
  message: string;
  targetId: string;
  targetName: string;
}
