/**
 * スケジュール管理サービス
 * 工程スケジュールのCRUD・進捗管理・アラート機能
 */

import { LarkClient, FIELD_TYPES } from '../api/lark-client';
import type {
  ScheduleItem,
  ScheduleStatus,
  DateRange,
} from '../types/schedule';

export interface ScheduleServiceConfig {
  larkClient: LarkClient;
  appToken: string;
  tableIds: {
    schedules: string;
    contracts: string;
    processMaster: string;
  };
}

export interface ScheduleCreateInput {
  contractId: string;
  processId: string;
  name: string;
  plannedStartDate: string;
  plannedEndDate: string;
  assignedPersonIds?: string[];
  assignedSubcontractorIds?: string[];
  assignedEquipmentIds?: string[];
  predecessorIds?: string[];
  notes?: string;
  milestoneFlag?: boolean;
}

export interface ScheduleUpdateInput {
  name?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progress?: number;
  status?: ScheduleStatus;
  assignedPersonIds?: string[];
  assignedSubcontractorIds?: string[];
  assignedEquipmentIds?: string[];
  notes?: string;
}

export interface ProgressUpdateInput {
  progress: number;
  actualStartDate?: string;
  actualEndDate?: string;
  notes?: string;
}

export interface AlertConfig {
  delayThresholdDays: number;
  upcomingDays: number;
}

export interface ScheduleAlert {
  type: 'delayed' | 'upcoming_deadline' | 'overdue' | 'milestone_approaching';
  severity: 'critical' | 'warning' | 'info';
  scheduleId: string;
  scheduleName: string;
  contractId: string;
  message: string;
  dueDate: string;
  daysRemaining: number;
}

export class ScheduleService {
  private client: LarkClient;
  private appToken: string;
  private tableIds: ScheduleServiceConfig['tableIds'];

  constructor(config: ScheduleServiceConfig) {
    this.client = config.larkClient;
    this.appToken = config.appToken;
    this.tableIds = config.tableIds;
  }

  // ========================================
  // スケジュールCRUD
  // ========================================

  async getSchedules(filter?: {
    contractId?: string;
    status?: ScheduleStatus[];
    dateRange?: DateRange;
  }): Promise<ScheduleItem[]> {
    const filters: string[] = [];

    if (filter?.contractId) {
      filters.push(`CurrentValue.[contractId] = "${filter.contractId}"`);
    }

    if (filter?.status && filter.status.length > 0) {
      const statusConditions = filter.status
        .map(s => `CurrentValue.[ステータス] = "${this.statusToJapanese(s)}"`)
        .join(' OR ');
      filters.push(`(${statusConditions})`);
    }

    if (filter?.dateRange) {
      filters.push(`CurrentValue.[予定開始日] >= "${filter.dateRange.start}"`);
      filters.push(`CurrentValue.[予定終了日] <= "${filter.dateRange.end}"`);
    }

    const response = await this.client.listRecords(
      this.appToken,
      this.tableIds.schedules,
      {
        filter: filters.length > 0 ? filters.join(' AND ') : undefined,
        sort: ['予定開始日 ASC'],
      }
    );

    if (response.code !== 0) {
      throw new Error(`Failed to get schedules: ${response.msg}`);
    }

    return response.data.items.map(item => this.mapToScheduleItem(item.fields, item.record_id));
  }

  async getScheduleById(id: string): Promise<ScheduleItem | null> {
    const response = await this.client.getRecord(
      this.appToken,
      this.tableIds.schedules,
      id
    );

    if (response.code !== 0) {
      return null;
    }

    return this.mapToScheduleItem(response.data.record.fields, id);
  }

  async createSchedule(input: ScheduleCreateInput): Promise<ScheduleItem> {
    const fields = {
      'contractId': input.contractId,
      'processId': input.processId,
      '工程名': input.name,
      '予定開始日': input.plannedStartDate,
      '予定終了日': input.plannedEndDate,
      '進捗率': 0,
      'ステータス': '未着手',
      '担当者ID': input.assignedPersonIds || [],
      '協力会社ID': input.assignedSubcontractorIds || [],
      '使用機材ID': input.assignedEquipmentIds || [],
      '先行工程ID': input.predecessorIds || [],
      '備考': input.notes || '',
      'マイルストーン': input.milestoneFlag || false,
      'クリティカルパス': false,
    };

    const response = await this.client.createRecord(
      this.appToken,
      this.tableIds.schedules,
      fields
    );

    if (response.code !== 0) {
      throw new Error(`Failed to create schedule: ${response.msg}`);
    }

    return this.mapToScheduleItem(
      response.data.record.fields,
      response.data.record.record_id
    );
  }

  async updateSchedule(id: string, input: ScheduleUpdateInput): Promise<ScheduleItem> {
    const fields: Record<string, unknown> = {};

    if (input.name !== undefined) fields['工程名'] = input.name;
    if (input.plannedStartDate !== undefined) fields['予定開始日'] = input.plannedStartDate;
    if (input.plannedEndDate !== undefined) fields['予定終了日'] = input.plannedEndDate;
    if (input.actualStartDate !== undefined) fields['実績開始日'] = input.actualStartDate;
    if (input.actualEndDate !== undefined) fields['実績終了日'] = input.actualEndDate;
    if (input.progress !== undefined) fields['進捗率'] = input.progress;
    if (input.status !== undefined) fields['ステータス'] = this.statusToJapanese(input.status);
    if (input.assignedPersonIds !== undefined) fields['担当者ID'] = input.assignedPersonIds;
    if (input.assignedSubcontractorIds !== undefined) fields['協力会社ID'] = input.assignedSubcontractorIds;
    if (input.assignedEquipmentIds !== undefined) fields['使用機材ID'] = input.assignedEquipmentIds;
    if (input.notes !== undefined) fields['備考'] = input.notes;

    const response = await this.client.updateRecord(
      this.appToken,
      this.tableIds.schedules,
      id,
      fields
    );

    if (response.code !== 0) {
      throw new Error(`Failed to update schedule: ${response.msg}`);
    }

    return this.mapToScheduleItem(response.data.record.fields, id);
  }

  async deleteSchedule(id: string): Promise<void> {
    const response = await this.client.deleteRecord(
      this.appToken,
      this.tableIds.schedules,
      id
    );

    if (response.code !== 0) {
      throw new Error(`Failed to delete schedule: ${response.msg}`);
    }
  }

  // ========================================
  // 進捗管理
  // ========================================

  async updateProgress(id: string, input: ProgressUpdateInput): Promise<ScheduleItem> {
    const currentSchedule = await this.getScheduleById(id);
    if (!currentSchedule) {
      throw new Error(`Schedule not found: ${id}`);
    }

    // 進捗率に基づいてステータスを自動更新
    let status: ScheduleStatus = currentSchedule.status;

    if (input.progress === 0) {
      status = 'not_started';
    } else if (input.progress === 100) {
      status = 'completed';
    } else if (input.progress > 0) {
      // 遅延チェック
      const today = new Date();
      const endDate = new Date(currentSchedule.plannedEndDate);
      const expectedProgress = this.calculateExpectedProgress(
        currentSchedule.plannedStartDate,
        currentSchedule.plannedEndDate
      );

      if (today > endDate && input.progress < 100) {
        status = 'delayed';
      } else if (input.progress < expectedProgress - 10) {
        // 予定進捗より10%以上遅れている場合
        status = 'delayed';
      } else {
        status = 'in_progress';
      }
    }

    return this.updateSchedule(id, {
      progress: input.progress,
      actualStartDate: input.actualStartDate || currentSchedule.actualStartDate,
      actualEndDate: input.progress === 100 ? (input.actualEndDate || new Date().toISOString().split('T')[0]) : undefined,
      status,
      notes: input.notes,
    });
  }

  async batchUpdateProgress(updates: Array<{ id: string; progress: number }>): Promise<ScheduleItem[]> {
    const results: ScheduleItem[] = [];

    for (const update of updates) {
      const result = await this.updateProgress(update.id, { progress: update.progress });
      results.push(result);
    }

    return results;
  }

  private calculateExpectedProgress(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    if (today < start) return 0;
    if (today > end) return 100;

    const totalDuration = end.getTime() - start.getTime();
    const elapsed = today.getTime() - start.getTime();

    return Math.round((elapsed / totalDuration) * 100);
  }

  // ========================================
  // アラート機能
  // ========================================

  async getAlerts(config: AlertConfig = { delayThresholdDays: 3, upcomingDays: 7 }): Promise<ScheduleAlert[]> {
    const schedules = await this.getSchedules({
      status: ['not_started', 'in_progress', 'delayed'],
    });

    const alerts: ScheduleAlert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const schedule of schedules) {
      const endDate = new Date(schedule.plannedEndDate);
      endDate.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // 期限超過
      if (daysRemaining < 0 && schedule.progress < 100) {
        alerts.push({
          type: 'overdue',
          severity: 'critical',
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          contractId: schedule.contractId,
          message: `工程「${schedule.name}」が${Math.abs(daysRemaining)}日超過しています`,
          dueDate: schedule.plannedEndDate,
          daysRemaining,
        });
      }
      // 遅延中
      else if (schedule.status === 'delayed') {
        alerts.push({
          type: 'delayed',
          severity: 'warning',
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          contractId: schedule.contractId,
          message: `工程「${schedule.name}」が遅延しています（進捗: ${schedule.progress}%）`,
          dueDate: schedule.plannedEndDate,
          daysRemaining,
        });
      }
      // 期限間近
      else if (daysRemaining >= 0 && daysRemaining <= config.upcomingDays) {
        if (schedule.milestoneFlag) {
          alerts.push({
            type: 'milestone_approaching',
            severity: daysRemaining <= config.delayThresholdDays ? 'warning' : 'info',
            scheduleId: schedule.id,
            scheduleName: schedule.name,
            contractId: schedule.contractId,
            message: `マイルストーン「${schedule.name}」まで残り${daysRemaining}日`,
            dueDate: schedule.plannedEndDate,
            daysRemaining,
          });
        } else {
          alerts.push({
            type: 'upcoming_deadline',
            severity: daysRemaining <= config.delayThresholdDays ? 'warning' : 'info',
            scheduleId: schedule.id,
            scheduleName: schedule.name,
            contractId: schedule.contractId,
            message: `工程「${schedule.name}」の期限まで残り${daysRemaining}日`,
            dueDate: schedule.plannedEndDate,
            daysRemaining,
          });
        }
      }
    }

    // 重要度順にソート
    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  async getAlertsByContract(contractId: string, config?: AlertConfig): Promise<ScheduleAlert[]> {
    const allAlerts = await this.getAlerts(config);
    return allAlerts.filter(alert => alert.contractId === contractId);
  }

  // ========================================
  // スケジュールテーブル初期化
  // ========================================

  async initializeScheduleTable(): Promise<string> {
    const response = await this.client.createTable(this.appToken, 'スケジュール', [
      { field_name: 'contractId', type: FIELD_TYPES.TEXT },
      { field_name: 'processId', type: FIELD_TYPES.TEXT },
      { field_name: '工程名', type: FIELD_TYPES.TEXT },
      { field_name: '予定開始日', type: FIELD_TYPES.DATE },
      { field_name: '予定終了日', type: FIELD_TYPES.DATE },
      { field_name: '実績開始日', type: FIELD_TYPES.DATE },
      { field_name: '実績終了日', type: FIELD_TYPES.DATE },
      { field_name: '進捗率', type: FIELD_TYPES.NUMBER },
      { field_name: 'ステータス', type: FIELD_TYPES.SELECT, property: {
        options: [
          { name: '未着手' },
          { name: '進行中' },
          { name: '遅延' },
          { name: '完了' },
          { name: '保留' },
        ]
      }},
      { field_name: '担当者ID', type: FIELD_TYPES.MULTI_SELECT },
      { field_name: '協力会社ID', type: FIELD_TYPES.MULTI_SELECT },
      { field_name: '使用機材ID', type: FIELD_TYPES.MULTI_SELECT },
      { field_name: '先行工程ID', type: FIELD_TYPES.MULTI_SELECT },
      { field_name: '後続工程ID', type: FIELD_TYPES.MULTI_SELECT },
      { field_name: '備考', type: FIELD_TYPES.TEXT },
      { field_name: 'マイルストーン', type: FIELD_TYPES.CHECKBOX },
      { field_name: 'クリティカルパス', type: FIELD_TYPES.CHECKBOX },
    ]);

    if (response.code !== 0) {
      throw new Error(`Failed to create schedule table: ${response.msg}`);
    }

    return response.data.table_id;
  }

  // ========================================
  // ヘルパー関数
  // ========================================

  private mapToScheduleItem(fields: Record<string, unknown>, recordId: string): ScheduleItem {
    return {
      id: recordId,
      contractId: fields['contractId'] as string || '',
      processId: fields['processId'] as string || '',
      name: fields['工程名'] as string || '',
      plannedStartDate: this.formatDate(fields['予定開始日']),
      plannedEndDate: this.formatDate(fields['予定終了日']),
      actualStartDate: this.formatDate(fields['実績開始日']),
      actualEndDate: this.formatDate(fields['実績終了日']),
      progress: fields['進捗率'] as number || 0,
      status: this.japaneseToStatus(fields['ステータス'] as string),
      assignedPersonIds: this.parseMultiSelect(fields['担当者ID']),
      assignedSubcontractorIds: this.parseMultiSelect(fields['協力会社ID']),
      assignedEquipmentIds: this.parseMultiSelect(fields['使用機材ID']),
      predecessorIds: this.parseMultiSelect(fields['先行工程ID']),
      successorIds: this.parseMultiSelect(fields['後続工程ID']),
      notes: fields['備考'] as string,
      milestoneFlag: fields['マイルストーン'] as boolean || false,
      criticalPath: fields['クリティカルパス'] as boolean || false,
      createdAt: fields['作成日時'] as string || new Date().toISOString(),
      updatedAt: fields['更新日時'] as string || new Date().toISOString(),
    };
  }

  private formatDate(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') {
      // Unix timestamp (milliseconds)
      return new Date(value).toISOString().split('T')[0];
    }
    return '';
  }

  private parseMultiSelect(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') return [value];
    return [];
  }

  private statusToJapanese(status: ScheduleStatus): string {
    const map: Record<ScheduleStatus, string> = {
      'not_started': '未着手',
      'in_progress': '進行中',
      'delayed': '遅延',
      'completed': '完了',
      'on_hold': '保留',
    };
    return map[status];
  }

  private japaneseToStatus(status: string): ScheduleStatus {
    const map: Record<string, ScheduleStatus> = {
      '未着手': 'not_started',
      '進行中': 'in_progress',
      '遅延': 'delayed',
      '完了': 'completed',
      '保留': 'on_hold',
    };
    return map[status] || 'not_started';
  }
}
