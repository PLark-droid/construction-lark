/**
 * 工事管理Base - 型定義
 * LarkのBaseで工事管理Baseと工程管理Baseをつくる
 */

// ========================================
// 工事契約情報テーブル
// ========================================
export interface ConstructionContract {
  id: string;
  contractNumber: string;        // 契約番号
  projectName: string;           // 工事名
  clientName: string;            // 発注者名
  contractAmount: number;        // 契約金額
  contractDate: string;          // 契約日
  startDate: string;             // 着工日
  completionDate: string;        // 竣工予定日
  actualCompletionDate?: string; // 実際の竣工日
  constructionSite: string;      // 工事現場住所
  status: ConstructionStatus;    // ステータス
  managerId: string;             // 現場責任者ID
  description?: string;          // 備考
  createdAt: string;
  updatedAt: string;
}

export type ConstructionStatus =
  | 'planning'      // 計画中
  | 'contracted'    // 契約済
  | 'in_progress'   // 施工中
  | 'inspection'    // 検査中
  | 'completed'     // 完了
  | 'suspended';    // 中断

// ========================================
// 資格者マスタ
// ========================================
export interface QualifiedPerson {
  id: string;
  employeeId: string;            // 社員番号
  name: string;                  // 氏名
  department: string;            // 所属部署
  qualifications: Qualification[]; // 保有資格一覧
  contactPhone?: string;         // 連絡先電話番号
  email?: string;                // メールアドレス
  isActive: boolean;             // 在籍フラグ
  createdAt: string;
  updatedAt: string;
}

export interface Qualification {
  id: string;
  name: string;                  // 資格名
  certificationNumber: string;   // 資格証番号
  issueDate: string;             // 取得日
  expiryDate?: string;           // 有効期限
  category: QualificationCategory;
}

export type QualificationCategory =
  | 'construction_manager'       // 施工管理技士
  | 'architect'                  // 建築士
  | 'surveyor'                   // 測量士
  | 'safety_officer'             // 安全管理者
  | 'crane_operator'             // クレーン運転士
  | 'welding'                    // 溶接技能者
  | 'other';                     // その他

// ========================================
// 協力会社マスタ
// ========================================
export interface Subcontractor {
  id: string;
  companyCode: string;           // 会社コード
  companyName: string;           // 会社名
  representativeName: string;    // 代表者名
  address: string;               // 住所
  phone: string;                 // 電話番号
  fax?: string;                  // FAX番号
  email?: string;                // メールアドレス
  specialties: string[];         // 専門分野（とび、型枠、鉄筋など）
  rating: SubcontractorRating;   // 評価ランク
  insuranceStatus: InsuranceStatus; // 保険加入状況
  contractHistory: ContractHistory[];
  isActive: boolean;             // 取引フラグ
  createdAt: string;
  updatedAt: string;
}

export type SubcontractorRating = 'A' | 'B' | 'C' | 'D';

export interface InsuranceStatus {
  hasWorkersComp: boolean;       // 労災保険
  hasLiability: boolean;         // 賠償責任保険
  expiryDate?: string;           // 保険期限
}

export interface ContractHistory {
  contractId: string;
  projectName: string;
  amount: number;
  period: string;
  evaluation?: number;           // 評価点（1-5）
}

// ========================================
// 資機材マスタ
// ========================================
export interface Equipment {
  id: string;
  equipmentCode: string;         // 資機材コード
  name: string;                  // 名称
  category: EquipmentCategory;   // 分類
  manufacturer?: string;         // メーカー
  modelNumber?: string;          // 型番
  specification?: string;        // 仕様
  quantity: number;              // 保有数量
  unit: string;                  // 単位
  dailyRate?: number;            // 日額単価（レンタル時）
  location: string;              // 保管場所
  status: EquipmentStatus;       // 状態
  lastInspectionDate?: string;   // 最終点検日
  nextInspectionDate?: string;   // 次回点検予定日
  createdAt: string;
  updatedAt: string;
}

export type EquipmentCategory =
  | 'heavy_machinery'            // 重機
  | 'vehicle'                    // 車両
  | 'scaffold'                   // 足場材
  | 'formwork'                   // 型枠材
  | 'power_tool'                 // 電動工具
  | 'measuring'                  // 測量機器
  | 'safety'                     // 安全設備
  | 'temporary'                  // 仮設材
  | 'other';                     // その他

export type EquipmentStatus =
  | 'available'                  // 使用可能
  | 'in_use'                     // 使用中
  | 'maintenance'                // 整備中
  | 'broken'                     // 故障
  | 'disposed';                  // 廃棄

// ========================================
// 工程マスタ
// ========================================
export interface ProcessMaster {
  id: string;
  processCode: string;           // 工程コード
  name: string;                  // 工程名
  category: ProcessCategory;     // 工程分類
  standardDuration: number;      // 標準工期（日）
  requiredQualifications: string[]; // 必要資格
  requiredEquipment: string[];   // 必要機材
  predecessorProcesses: string[]; // 先行工程
  description?: string;          // 説明
  createdAt: string;
  updatedAt: string;
}

export type ProcessCategory =
  | 'preparation'                // 準備工
  | 'earthwork'                  // 土工
  | 'foundation'                 // 基礎工
  | 'structural'                 // 躯体工
  | 'exterior'                   // 外装工
  | 'interior'                   // 内装工
  | 'mep'                        // 設備工（機械・電気・配管）
  | 'finishing'                  // 仕上工
  | 'inspection';                // 検査
