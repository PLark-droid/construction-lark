/**
 * ガントチャートサービス
 * 工事別・人別・機材別のガントチャートデータ生成
 */

import { LarkClient } from '../api/lark-client';
import { ConstructionService } from './construction-service';
import type {
  ConstructionContract,
  QualifiedPerson,
  Equipment,
  Subcontractor,
} from '../types/construction';
import type {
  ScheduleItem,
  GanttChartData,
  GanttItem,
  GanttSummary,
  GanttFilter,
  PersonGanttData,
  EquipmentGanttData,
  SubcontractorGanttData,
  Milestone,
  DateRange,
  WorkloadSummary,
  AvailabilitySummary,
  AllocationConflict,
} from '../types/schedule';

export interface GanttServiceConfig {
  larkClient: LarkClient;
  appToken: string;
  tableIds: {
    schedules: string;
    contracts: string;
    qualifiedPersons: string;
    subcontractors: string;
    equipment: string;
    processMaster: string;
  };
}

export class GanttService {
  private client: LarkClient;
  private appToken: string;
  private tableIds: GanttServiceConfig['tableIds'];
  private constructionService: ConstructionService;

  constructor(config: GanttServiceConfig) {
    this.client = config.larkClient;
    this.appToken = config.appToken;
    this.tableIds = config.tableIds;
    this.constructionService = new ConstructionService({
      larkClient: config.larkClient,
      appToken: config.appToken,
      tableIds: {
        contracts: config.tableIds.contracts,
        qualifiedPersons: config.tableIds.qualifiedPersons,
        subcontractors: config.tableIds.subcontractors,
        equipment: config.tableIds.equipment,
        processMaster: config.tableIds.processMaster,
      },
    });
  }

  // ========================================
  // 工事別ガントチャート
  // ========================================

  async getContractGanttChart(contractId: string): Promise<GanttChartData> {
    const contract = await this.constructionService.getContractById(contractId);
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }

    const scheduleItems = await this.getSchedulesByContract(contractId);
    const ganttItems = this.buildGanttItems(scheduleItems);
    const milestones = this.extractMilestones(scheduleItems);
    const summary = this.calculateSummary(contract, scheduleItems);

    return {
      contract,
      scheduleItems: ganttItems,
      milestones,
      summary,
    };
  }

  // ========================================
  // 人別ガントチャート
  // ========================================

  async getPersonGanttChart(personId: string): Promise<PersonGanttData> {
    const person = await this.constructionService.getQualifiedPersonById(personId);
    if (!person) {
      throw new Error(`Person not found: ${personId}`);
    }

    const schedules = await this.getSchedulesByPerson(personId);
    const contracts = await this.constructionService.getContracts();

    const assignments = schedules.map(schedule => {
      const contract = contracts.find(c => c.id === schedule.contractId);
      return {
        scheduleItem: schedule,
        contractName: contract?.projectName || '不明',
        role: '担当者',
        period: {
          start: schedule.plannedStartDate,
          end: schedule.plannedEndDate,
        },
      };
    });

    const workload = this.calculateWorkload(schedules);

    return {
      person,
      assignments,
      workload,
    };
  }

  async getAllPersonsGanttChart(filter?: GanttFilter): Promise<PersonGanttData[]> {
    const persons = await this.constructionService.getQualifiedPersons();
    const results: PersonGanttData[] = [];

    for (const person of persons) {
      if (!person.isActive) continue;

      const ganttData = await this.getPersonGanttChart(person.id);

      // フィルタリング
      if (filter?.dateRange) {
        ganttData.assignments = ganttData.assignments.filter(a =>
          this.isOverlapping(a.period, filter.dateRange!)
        );
      }

      if (ganttData.assignments.length > 0) {
        results.push(ganttData);
      }
    }

    return results;
  }

  // ========================================
  // 機材別ガントチャート
  // ========================================

  async getEquipmentGanttChart(equipmentId: string): Promise<EquipmentGanttData> {
    const equipmentList = await this.constructionService.getEquipment();
    const equipment = equipmentList.find(e => e.id === equipmentId);
    if (!equipment) {
      throw new Error(`Equipment not found: ${equipmentId}`);
    }

    const schedules = await this.getSchedulesByEquipment(equipmentId);
    const contracts = await this.constructionService.getContracts();

    const allocations = schedules.map(schedule => {
      const contract = contracts.find(c => c.id === schedule.contractId);
      return {
        scheduleItem: schedule,
        contractName: contract?.projectName || '不明',
        quantity: 1, // TODO: 実際の数量を取得
        period: {
          start: schedule.plannedStartDate,
          end: schedule.plannedEndDate,
        },
      };
    });

    const availability = this.calculateAvailability(equipment, allocations);

    return {
      equipment,
      allocations,
      availability,
    };
  }

  async getAllEquipmentGanttChart(filter?: GanttFilter): Promise<EquipmentGanttData[]> {
    const equipmentList = await this.constructionService.getEquipment();
    const results: EquipmentGanttData[] = [];

    for (const equipment of equipmentList) {
      if (equipment.status === 'disposed') continue;

      const ganttData = await this.getEquipmentGanttChart(equipment.id);

      // フィルタリング
      if (filter?.dateRange) {
        ganttData.allocations = ganttData.allocations.filter(a =>
          this.isOverlapping(a.period, filter.dateRange!)
        );
      }

      results.push(ganttData);
    }

    return results;
  }

  // ========================================
  // 協力会社別ガントチャート
  // ========================================

  async getSubcontractorGanttChart(subcontractorId: string): Promise<SubcontractorGanttData> {
    const subcontractors = await this.constructionService.getSubcontractors();
    const subcontractor = subcontractors.find(s => s.id === subcontractorId);
    if (!subcontractor) {
      throw new Error(`Subcontractor not found: ${subcontractorId}`);
    }

    const schedules = await this.getSchedulesBySubcontractor(subcontractorId);
    const contracts = await this.constructionService.getContracts();

    const assignments = schedules.map(schedule => {
      const contract = contracts.find(c => c.id === schedule.contractId);
      return {
        scheduleItem: schedule,
        contractName: contract?.projectName || '不明',
        workType: subcontractor.specialties[0] || '一般',
        period: {
          start: schedule.plannedStartDate,
          end: schedule.plannedEndDate,
        },
      };
    });

    const capacity = {
      currentProjects: assignments.filter(a =>
        a.scheduleItem.status === 'in_progress'
      ).length,
      totalContractValue: 0, // TODO: 実際の契約金額を計算
      performanceScore: this.calculatePerformanceScore(subcontractor),
    };

    return {
      subcontractor,
      assignments,
      capacity,
    };
  }

  // ========================================
  // スケジュール取得
  // ========================================

  private async getSchedulesByContract(contractId: string): Promise<ScheduleItem[]> {
    const filter = `CurrentValue.[contractId] = "${contractId}"`;
    const response = await this.client.listRecords(
      this.appToken,
      this.tableIds.schedules,
      { filter, sort: ['plannedStartDate ASC'] }
    );

    if (response.code !== 0) {
      throw new Error(`Failed to get schedules: ${response.msg}`);
    }

    return response.data.items.map(item => this.mapToScheduleItem(item.fields));
  }

  private async getSchedulesByPerson(personId: string): Promise<ScheduleItem[]> {
    const filter = `CurrentValue.[assignedPersonIds] contains "${personId}"`;
    const response = await this.client.listRecords(
      this.appToken,
      this.tableIds.schedules,
      { filter, sort: ['plannedStartDate ASC'] }
    );

    if (response.code !== 0) {
      throw new Error(`Failed to get schedules: ${response.msg}`);
    }

    return response.data.items.map(item => this.mapToScheduleItem(item.fields));
  }

  private async getSchedulesByEquipment(equipmentId: string): Promise<ScheduleItem[]> {
    const filter = `CurrentValue.[assignedEquipmentIds] contains "${equipmentId}"`;
    const response = await this.client.listRecords(
      this.appToken,
      this.tableIds.schedules,
      { filter, sort: ['plannedStartDate ASC'] }
    );

    if (response.code !== 0) {
      throw new Error(`Failed to get schedules: ${response.msg}`);
    }

    return response.data.items.map(item => this.mapToScheduleItem(item.fields));
  }

  private async getSchedulesBySubcontractor(subcontractorId: string): Promise<ScheduleItem[]> {
    const filter = `CurrentValue.[assignedSubcontractorIds] contains "${subcontractorId}"`;
    const response = await this.client.listRecords(
      this.appToken,
      this.tableIds.schedules,
      { filter, sort: ['plannedStartDate ASC'] }
    );

    if (response.code !== 0) {
      throw new Error(`Failed to get schedules: ${response.msg}`);
    }

    return response.data.items.map(item => this.mapToScheduleItem(item.fields));
  }

  // ========================================
  // ヘルパー関数
  // ========================================

  private buildGanttItems(schedules: ScheduleItem[]): GanttItem[] {
    return schedules.map(schedule => ({
      id: schedule.id,
      name: schedule.name,
      startDate: schedule.plannedStartDate,
      endDate: schedule.plannedEndDate,
      progress: schedule.progress,
      status: schedule.status,
      level: 0,
      children: [],
      dependencies: schedule.predecessorIds,
      assignees: [],
      equipment: [],
      isCriticalPath: schedule.criticalPath,
    }));
  }

  private extractMilestones(schedules: ScheduleItem[]): Milestone[] {
    return schedules
      .filter(s => s.milestoneFlag)
      .map(s => ({
        id: s.id,
        name: s.name,
        date: s.plannedEndDate,
        status: s.status === 'completed' ? 'achieved' :
                s.status === 'delayed' ? 'missed' : 'pending',
      }));
  }

  private calculateSummary(contract: ConstructionContract, schedules: ScheduleItem[]): GanttSummary {
    const startDate = new Date(contract.startDate);
    const endDate = new Date(contract.completionDate);
    const today = new Date();

    const totalDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, totalDuration - elapsedDays);

    const completedWeight = schedules.filter(s => s.status === 'completed').length;
    const totalWeight = schedules.length || 1;
    const overallProgress = Math.round((completedWeight / totalWeight) * 100);

    const delayedItems = schedules.filter(s => s.status === 'delayed').length;
    const criticalPathLength = schedules.filter(s => s.criticalPath).length;

    return {
      totalDuration,
      elapsedDays,
      remainingDays,
      overallProgress,
      delayedItems,
      criticalPathLength,
    };
  }

  private calculateWorkload(schedules: ScheduleItem[]): WorkloadSummary {
    const today = new Date().toISOString().split('T')[0];

    const currentAssignments = schedules.filter(s =>
      s.plannedStartDate <= today && s.plannedEndDate >= today
    ).length;

    const upcomingAssignments = schedules.filter(s =>
      s.plannedStartDate > today
    ).length;

    // 稼働率: 現在担当している工程数 / 最大同時担当可能数（仮に3とする）
    const utilizationRate = Math.min(100, Math.round((currentAssignments / 3) * 100));

    return {
      totalAssignments: schedules.length,
      currentAssignments,
      upcomingAssignments,
      utilizationRate,
    };
  }

  private calculateAvailability(
    equipment: Equipment,
    allocations: Array<{ period: DateRange; quantity: number }>
  ): AvailabilitySummary {
    const today = new Date().toISOString().split('T')[0];

    const currentAllocations = allocations.filter(a =>
      a.period.start <= today && a.period.end >= today
    );

    const currentlyUsed = currentAllocations.reduce((sum, a) => sum + a.quantity, 0);
    const available = equipment.quantity - currentlyUsed;
    const utilizationRate = Math.round((currentlyUsed / equipment.quantity) * 100);

    // 競合検出
    const conflicts: AllocationConflict[] = [];
    // TODO: 日付ごとの競合チェックを実装

    return {
      totalQuantity: equipment.quantity,
      currentlyUsed,
      available: Math.max(0, available),
      utilizationRate,
      conflicts,
    };
  }

  private calculatePerformanceScore(subcontractor: Subcontractor): number {
    // 評価ランクに基づくスコア
    const rankScores: Record<string, number> = {
      'A': 95,
      'B': 80,
      'C': 65,
      'D': 50,
    };
    return rankScores[subcontractor.rating] || 50;
  }

  private isOverlapping(period1: DateRange, period2: DateRange): boolean {
    return period1.start <= period2.end && period1.end >= period2.start;
  }

  private mapToScheduleItem(fields: Record<string, unknown>): ScheduleItem {
    return {
      id: fields['record_id'] as string || '',
      contractId: fields['contractId'] as string || '',
      processId: fields['processId'] as string || '',
      name: fields['工程名'] as string || '',
      plannedStartDate: fields['予定開始日'] as string || '',
      plannedEndDate: fields['予定終了日'] as string || '',
      actualStartDate: fields['実績開始日'] as string,
      actualEndDate: fields['実績終了日'] as string,
      progress: fields['進捗率'] as number || 0,
      status: this.mapScheduleStatus(fields['ステータス'] as string),
      assignedPersonIds: (fields['担当者ID'] as string[]) || [],
      assignedSubcontractorIds: (fields['協力会社ID'] as string[]) || [],
      assignedEquipmentIds: (fields['使用機材ID'] as string[]) || [],
      predecessorIds: (fields['先行工程ID'] as string[]) || [],
      successorIds: (fields['後続工程ID'] as string[]) || [],
      notes: fields['備考'] as string,
      milestoneFlag: fields['マイルストーン'] as boolean || false,
      criticalPath: fields['クリティカルパス'] as boolean || false,
      createdAt: fields['作成日時'] as string || new Date().toISOString(),
      updatedAt: fields['更新日時'] as string || new Date().toISOString(),
    };
  }

  private mapScheduleStatus(status: string): ScheduleItem['status'] {
    const statusMap: Record<string, ScheduleItem['status']> = {
      '未着手': 'not_started',
      '進行中': 'in_progress',
      '遅延': 'delayed',
      '完了': 'completed',
      '保留': 'on_hold',
    };
    return statusMap[status] || 'not_started';
  }
}
