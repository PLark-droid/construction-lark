/**
 * シンプル建設業務管理パッケージ v2.0 - サービスクラス
 * ISO9001準拠設計
 */

import { LarkClient, BaseRecord } from '../api/lark-client.js';
import {
  Employee,
  EmployeeStatus,
  QualificationMaster,
  SimpleQualificationCategory,
  QualificationRecord,
  QualificationRecordStatus,
  Project,
  ProjectStatus,
  Task,
  TaskStatus,
  DashboardKPI,
  ProjectProgress,
  Alert,
} from '../types/simple-base.js';

export interface SimpleBaseConfig {
  appToken: string;
  tableIds: {
    employees: string;
    qualifications: string;
    qualificationRecords: string;
    projects: string;
    tasks: string;
  };
}

export class SimpleBaseService {
  private client: LarkClient;
  private config: SimpleBaseConfig;

  constructor(client: LarkClient, config: SimpleBaseConfig) {
    this.client = client;
    this.config = config;
  }

  // ========================================
  // 従業員マスタ
  // ========================================

  async getEmployees(): Promise<Employee[]> {
    const response = await this.client.listRecords(
      this.config.appToken,
      this.config.tableIds.employees
    );

    if (response.code !== 0) {
      throw new Error(`従業員取得失敗: ${response.msg}`);
    }

    return response.data.items.map(this.mapToEmployee);
  }

  async getActiveEmployees(): Promise<Employee[]> {
    const employees = await this.getEmployees();
    return employees.filter(e => e.status === '在籍');
  }

  async getEmployeeById(employeeId: string): Promise<Employee | null> {
    const employees = await this.getEmployees();
    return employees.find(e => e.employeeId === employeeId) || null;
  }

  private mapToEmployee(record: BaseRecord): Employee {
    const f = record.fields;
    return {
      id: record.record_id,
      employeeId: f['社員番号'] as string || '',
      name: f['氏名'] as string || '',
      nameKana: f['フリガナ'] as string || '',
      department: f['所属'] as Employee['department'] || '本社',
      position: f['役職'] as Employee['position'] || '一般',
      hireDate: f['入社日'] as string || '',
      phone: f['連絡先'] as string,
      status: f['状態'] as EmployeeStatus || '在籍',
      createdAt: f['作成日時'] as string || '',
      updatedAt: f['更新日時'] as string || '',
    };
  }

  // ========================================
  // 資格マスタ
  // ========================================

  async getQualificationMasters(): Promise<QualificationMaster[]> {
    const response = await this.client.listRecords(
      this.config.appToken,
      this.config.tableIds.qualifications
    );

    if (response.code !== 0) {
      throw new Error(`資格マスタ取得失敗: ${response.msg}`);
    }

    return response.data.items.map(this.mapToQualificationMaster);
  }

  private mapToQualificationMaster(record: BaseRecord): QualificationMaster {
    const f = record.fields;
    return {
      id: record.record_id,
      qualificationCode: f['資格コード'] as string || '',
      name: f['資格名'] as string || '',
      category: f['カテゴリ'] as QualificationMaster['category'] || '国家資格',
      hasExpiry: f['有効期限管理'] as boolean || false,
      renewalCycleYears: f['更新周期（年）'] as number,
      requiredDepartments: f['必須部署'] as QualificationMaster['requiredDepartments'] || [],
      notes: f['備考'] as string,
      createdAt: f['作成日時'] as string || '',
      updatedAt: f['更新日時'] as string || '',
    };
  }

  // ========================================
  // 資格記録（力量管理）
  // ========================================

  async getQualificationRecords(): Promise<QualificationRecord[]> {
    const response = await this.client.listRecords(
      this.config.appToken,
      this.config.tableIds.qualificationRecords
    );

    if (response.code !== 0) {
      throw new Error(`資格記録取得失敗: ${response.msg}`);
    }

    return response.data.items.map(this.mapToQualificationRecord);
  }

  /**
   * 期限切れ間近の資格を取得（ISO9001 力量管理）
   * @param daysThreshold 何日以内に期限が切れるものを取得するか（デフォルト: 30日）
   */
  async getExpiringQualifications(daysThreshold = 30): Promise<QualificationRecord[]> {
    const records = await this.getQualificationRecords();
    const today = new Date();
    const thresholdDate = new Date(today.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

    return records.filter(r => {
      if (!r.expiryDate || r.status === '期限切れ') return false;
      const expiryDate = new Date(r.expiryDate);
      return expiryDate <= thresholdDate && expiryDate >= today;
    });
  }

  private mapToQualificationRecord(record: BaseRecord): QualificationRecord {
    const f = record.fields;
    return {
      id: record.record_id,
      employeeId: f['従業員名'] as string || '', // テキストとして保存されている場合
      qualificationId: f['資格名'] as string || '',
      acquisitionDate: f['取得日'] as string || '',
      expiryDate: f['有効期限'] as string,
      certificateNumber: f['証明書番号'] as string,
      status: f['状態'] as QualificationRecordStatus || '有効',
      nextRenewalDate: f['次回更新予定'] as string,
      notes: f['備考'] as string,
      createdAt: f['作成日時'] as string || '',
      updatedAt: f['更新日時'] as string || '',
    };
  }

  // ========================================
  // 案件管理
  // ========================================

  async getProjects(): Promise<Project[]> {
    const response = await this.client.listRecords(
      this.config.appToken,
      this.config.tableIds.projects
    );

    if (response.code !== 0) {
      throw new Error(`案件取得失敗: ${response.msg}`);
    }

    return response.data.items.map(this.mapToProject);
  }

  async getActiveProjects(): Promise<Project[]> {
    const projects = await this.getProjects();
    return projects.filter(p => p.status === '進行中');
  }

  async getProjectById(projectNumber: string): Promise<Project | null> {
    const projects = await this.getProjects();
    return projects.find(p => p.projectNumber === projectNumber) || null;
  }

  private mapToProject(record: BaseRecord): Project {
    const f = record.fields;
    return {
      id: record.record_id,
      projectNumber: f['案件番号'] as string || '',
      projectName: f['案件名'] as string || '',
      clientName: f['顧客名'] as string || '',
      siteAddress: f['現場住所'] as string || '',
      contractAmount: f['契約金額'] as number,
      startDate: f['着工日'] as string || '',
      plannedEndDate: f['竣工予定日'] as string || '',
      actualEndDate: f['竣工実績日'] as string,
      status: f['状態'] as ProjectStatus || '計画中',
      progressRate: f['進捗率'] as number || 0,
      managerId: f['責任者'] as string || '',
      memberIds: (f['担当者'] as string || '').split(',').filter(Boolean),
      createdAt: f['作成日時'] as string || '',
      updatedAt: f['更新日時'] as string || '',
    };
  }

  // ========================================
  // 工程管理
  // ========================================

  async getTasks(): Promise<Task[]> {
    const response = await this.client.listRecords(
      this.config.appToken,
      this.config.tableIds.tasks
    );

    if (response.code !== 0) {
      throw new Error(`工程取得失敗: ${response.msg}`);
    }

    return response.data.items.map(this.mapToTask);
  }

  async getTasksByProject(projectName: string): Promise<Task[]> {
    const tasks = await this.getTasks();
    return tasks
      .filter(t => t.projectId === projectName)
      .sort((a, b) => a.order - b.order);
  }

  async getDelayedTasks(): Promise<Task[]> {
    const tasks = await this.getTasks();
    const today = new Date();

    return tasks.filter(t => {
      if (t.status === '完了' || t.status === '保留') return false;
      const plannedEndDate = new Date(t.plannedEndDate);
      return plannedEndDate < today && t.progressRate < 100;
    });
  }

  private mapToTask(record: BaseRecord): Task {
    const f = record.fields;
    return {
      id: record.record_id,
      projectId: f['案件名'] as string || '',
      taskName: f['工程名'] as string || '',
      order: f['順序'] as number || 0,
      plannedStartDate: f['開始予定日'] as string || '',
      plannedEndDate: f['終了予定日'] as string || '',
      actualStartDate: f['開始実績日'] as string,
      actualEndDate: f['終了実績日'] as string,
      status: f['状態'] as TaskStatus || '未着手',
      progressRate: f['進捗率'] as number || 0,
      assigneeId: f['担当者'] as string,
      requiredQualificationIds: (f['必要資格'] as string || '').split(',').filter(Boolean),
      notes: f['備考'] as string,
      createdAt: f['作成日時'] as string || '',
      updatedAt: f['更新日時'] as string || '',
    };
  }

  // ========================================
  // ダッシュボード・KPI
  // ========================================

  /**
   * ダッシュボードKPIを取得
   */
  async getDashboardKPI(): Promise<DashboardKPI> {
    const [projects, employees, expiringQualifications] = await Promise.all([
      this.getProjects(),
      this.getEmployees(),
      this.getExpiringQualifications(30),
    ]);

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return {
      activeProjects: projects.filter(p => p.status === '進行中').length,
      completedThisMonth: projects.filter(p =>
        p.status === '完了' &&
        p.actualEndDate &&
        new Date(p.actualEndDate) >= firstDayOfMonth
      ).length,
      expiringQualifications: expiringQualifications.length,
      totalEmployees: employees.filter(e => e.status === '在籍').length,
    };
  }

  /**
   * プロジェクト進捗一覧を取得
   */
  async getProjectProgress(): Promise<ProjectProgress[]> {
    const projects = await this.getActiveProjects();
    const today = new Date();

    return projects.map(p => {
      const plannedEndDate = new Date(p.plannedEndDate);
      const daysRemaining = Math.ceil(
        (plannedEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        projectId: p.id,
        projectName: p.projectName,
        progressRate: p.progressRate,
        status: p.status,
        daysRemaining,
      };
    });
  }

  /**
   * アラート一覧を取得
   */
  async getAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // 資格期限切れアラート
    const expiringQualifications = await this.getExpiringQualifications(30);
    for (const q of expiringQualifications) {
      const daysUntilExpiry = q.expiryDate
        ? Math.ceil((new Date(q.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 0;

      alerts.push({
        type: 'qualification_expiring',
        severity: daysUntilExpiry <= 7 ? 'critical' : 'warning',
        message: `${q.employeeId}: ${q.qualificationId} 期限切れまで${daysUntilExpiry}日`,
        targetId: q.id,
        targetName: q.qualificationId,
      });
    }

    // 遅延タスクアラート
    const delayedTasks = await this.getDelayedTasks();
    for (const t of delayedTasks) {
      const daysDelayed = Math.ceil(
        (Date.now() - new Date(t.plannedEndDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      alerts.push({
        type: 'task_overdue',
        severity: daysDelayed > 7 ? 'critical' : 'warning',
        message: `${t.projectId}: ${t.taskName} ${daysDelayed}日遅延`,
        targetId: t.id,
        targetName: t.taskName,
      });
    }

    return alerts;
  }

  // ========================================
  // 進捗率自動計算
  // ========================================

  /**
   * 案件の進捗率を工程から自動計算
   */
  async calculateProjectProgress(projectName: string): Promise<number> {
    const tasks = await this.getTasksByProject(projectName);

    if (tasks.length === 0) return 0;

    const totalProgress = tasks.reduce((sum, t) => sum + t.progressRate, 0);
    return Math.round(totalProgress / tasks.length);
  }

  /**
   * 全案件の進捗率を一括更新
   */
  async updateAllProjectProgress(): Promise<void> {
    const projects = await this.getProjects();

    for (const project of projects) {
      const calculatedProgress = await this.calculateProjectProgress(project.projectName);

      if (calculatedProgress !== project.progressRate) {
        await this.client.updateRecord(
          this.config.appToken,
          this.config.tableIds.projects,
          project.id,
          { '進捗率': calculatedProgress }
        );
        console.log(`✅ ${project.projectName}: ${project.progressRate}% → ${calculatedProgress}%`);
      }
    }
  }
}
