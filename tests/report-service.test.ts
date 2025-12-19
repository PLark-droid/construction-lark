/**
 * ReportService Tests
 */

import { describe, it, expect } from 'vitest';
import { ReportService } from '../src/services/report-service';
import type {
  GanttChartData,
  PersonGanttData,
  EquipmentGanttData,
  ScheduleAlert,
} from '../src/types/schedule';
import type { ConstructionContract, QualifiedPerson, Equipment } from '../src/types/construction';

describe('ReportService', () => {
  const service = new ReportService();

  // Mock data
  const mockContract: ConstructionContract = {
    id: 'contract_001',
    contractNumber: 'C-2024-001',
    projectName: 'テスト工事',
    clientName: 'テスト発注者',
    contractAmount: 10000000,
    contractDate: '2024-01-01',
    startDate: '2024-01-15',
    completionDate: '2024-06-30',
    constructionSite: '東京都渋谷区',
    status: 'in_progress',
    managerId: 'manager_001',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockGanttData: GanttChartData = {
    contract: mockContract,
    scheduleItems: [
      {
        id: 'schedule_001',
        name: '基礎工事',
        startDate: '2024-01-15',
        endDate: '2024-02-15',
        progress: 100,
        status: 'completed',
        level: 0,
        children: [],
        dependencies: [],
        assignees: [],
        equipment: [],
        isCriticalPath: true,
      },
      {
        id: 'schedule_002',
        name: '躯体工事',
        startDate: '2024-02-16',
        endDate: '2024-04-15',
        progress: 50,
        status: 'in_progress',
        level: 0,
        children: [],
        dependencies: ['schedule_001'],
        assignees: [],
        equipment: [],
        isCriticalPath: true,
      },
    ],
    milestones: [
      {
        id: 'milestone_001',
        name: '基礎完了',
        date: '2024-02-15',
        status: 'achieved',
      },
    ],
    summary: {
      totalDuration: 167,
      elapsedDays: 60,
      remainingDays: 107,
      overallProgress: 50,
      delayedItems: 0,
      criticalPathLength: 2,
    },
  };

  describe('generateGanttCSV', () => {
    it('should generate valid CSV format', () => {
      const csv = service.generateGanttCSV(mockGanttData);

      expect(csv).toContain('# 工程表レポート');
      expect(csv).toContain('工事名: テスト工事');
      expect(csv).toContain('発注者: テスト発注者');
      expect(csv).toContain('全体進捗率,50%');
      expect(csv).toContain('基礎工事');
      expect(csv).toContain('躯体工事');
    });

    it('should include milestones', () => {
      const csv = service.generateGanttCSV(mockGanttData);

      expect(csv).toContain('## マイルストーン');
      expect(csv).toContain('基礎完了');
      expect(csv).toContain('達成');
    });

    it('should translate status to Japanese', () => {
      const csv = service.generateGanttCSV(mockGanttData);

      expect(csv).toContain('完了');
      expect(csv).toContain('進行中');
    });
  });

  describe('generateGanttJSON', () => {
    it('should generate valid JSON format', () => {
      const jsonStr = service.generateGanttJSON(mockGanttData);
      const json = JSON.parse(jsonStr);

      expect(json.meta.type).toBe('gantt_chart_report');
      expect(json.contract.projectName).toBe('テスト工事');
      expect(json.schedules).toHaveLength(2);
      expect(json.milestones).toHaveLength(1);
    });

    it('should include config metadata', () => {
      const jsonStr = service.generateGanttJSON(mockGanttData, {
        author: 'Test Author',
      });
      const json = JSON.parse(jsonStr);

      expect(json.meta.author).toBe('Test Author');
    });
  });

  describe('generatePersonReportCSV', () => {
    const mockPersonGanttData: PersonGanttData[] = [
      {
        person: {
          id: 'person_001',
          employeeId: 'E001',
          name: '田中太郎',
          department: '土木部',
          qualifications: [],
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        assignments: [
          {
            scheduleItem: {
              id: 'schedule_001',
              contractId: 'contract_001',
              processId: 'process_001',
              name: '基礎工事',
              plannedStartDate: '2024-01-15',
              plannedEndDate: '2024-02-15',
              progress: 50,
              status: 'in_progress',
              assignedPersonIds: ['person_001'],
              assignedSubcontractorIds: [],
              assignedEquipmentIds: [],
              predecessorIds: [],
              successorIds: [],
              milestoneFlag: false,
              criticalPath: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            contractName: 'テスト工事',
            role: '担当者',
            period: {
              start: '2024-01-15',
              end: '2024-02-15',
            },
          },
        ],
        workload: {
          totalAssignments: 1,
          currentAssignments: 1,
          upcomingAssignments: 0,
          utilizationRate: 33,
        },
      },
    ];

    it('should generate valid CSV format', () => {
      const csv = service.generatePersonReportCSV(mockPersonGanttData);

      expect(csv).toContain('# 人別稼働レポート');
      expect(csv).toContain('田中太郎');
      expect(csv).toContain('土木部');
      expect(csv).toContain('33%');
    });

    it('should include assignment details', () => {
      const csv = service.generatePersonReportCSV(mockPersonGanttData);

      expect(csv).toContain('## 詳細割当');
      expect(csv).toContain('テスト工事');
      expect(csv).toContain('基礎工事');
    });
  });

  describe('generateEquipmentReportCSV', () => {
    const mockEquipmentGanttData: EquipmentGanttData[] = [
      {
        equipment: {
          id: 'equipment_001',
          equipmentCode: 'EQ001',
          name: 'バックホー',
          category: 'heavy_machinery',
          quantity: 3,
          unit: '台',
          location: '倉庫A',
          status: 'in_use',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        allocations: [
          {
            scheduleItem: {
              id: 'schedule_001',
              contractId: 'contract_001',
              processId: 'process_001',
              name: '基礎工事',
              plannedStartDate: '2024-01-15',
              plannedEndDate: '2024-02-15',
              progress: 50,
              status: 'in_progress',
              assignedPersonIds: [],
              assignedSubcontractorIds: [],
              assignedEquipmentIds: ['equipment_001'],
              predecessorIds: [],
              successorIds: [],
              milestoneFlag: false,
              criticalPath: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
            contractName: 'テスト工事',
            quantity: 2,
            period: {
              start: '2024-01-15',
              end: '2024-02-15',
            },
          },
        ],
        availability: {
          totalQuantity: 3,
          currentlyUsed: 2,
          available: 1,
          utilizationRate: 67,
          conflicts: [],
        },
      },
    ];

    it('should generate valid CSV format', () => {
      const csv = service.generateEquipmentReportCSV(mockEquipmentGanttData);

      expect(csv).toContain('# 機材別稼働レポート');
      expect(csv).toContain('バックホー');
      expect(csv).toContain('heavy_machinery');
      expect(csv).toContain('67%');
    });

    it('should show availability summary', () => {
      const csv = service.generateEquipmentReportCSV(mockEquipmentGanttData);

      expect(csv).toContain('3'); // totalQuantity
      expect(csv).toContain('2'); // currentlyUsed
      expect(csv).toContain('1'); // available
    });
  });

  describe('generateAlertReportCSV', () => {
    const mockAlerts: ScheduleAlert[] = [
      {
        type: 'overdue',
        severity: 'critical',
        scheduleId: 'schedule_001',
        scheduleName: '期限超過工程',
        contractId: 'contract_001',
        message: '工程「期限超過工程」が3日超過しています',
        dueDate: '2024-01-10',
        daysRemaining: -3,
      },
      {
        type: 'upcoming_deadline',
        severity: 'warning',
        scheduleId: 'schedule_002',
        scheduleName: '期限間近工程',
        contractId: 'contract_001',
        message: '工程「期限間近工程」の期限まで残り2日',
        dueDate: '2024-01-15',
        daysRemaining: 2,
      },
    ];

    it('should generate valid CSV format', () => {
      const csv = service.generateAlertReportCSV(mockAlerts);

      expect(csv).toContain('# アラートレポート');
      expect(csv).toContain('アラート件数: 2件');
    });

    it('should include summary counts', () => {
      const csv = service.generateAlertReportCSV(mockAlerts);

      expect(csv).toContain('重大,1件');
      expect(csv).toContain('警告,1件');
    });

    it('should translate severity to Japanese', () => {
      const csv = service.generateAlertReportCSV(mockAlerts);

      expect(csv).toContain('重大');
      expect(csv).toContain('警告');
    });
  });

  describe('generateAlertReportJSON', () => {
    const mockAlerts: ScheduleAlert[] = [
      {
        type: 'overdue',
        severity: 'critical',
        scheduleId: 'schedule_001',
        scheduleName: '期限超過工程',
        contractId: 'contract_001',
        message: '工程「期限超過工程」が3日超過しています',
        dueDate: '2024-01-10',
        daysRemaining: -3,
      },
    ];

    it('should generate valid JSON format', () => {
      const jsonStr = service.generateAlertReportJSON(mockAlerts);
      const json = JSON.parse(jsonStr);

      expect(json.meta.type).toBe('alert_report');
      expect(json.summary.total).toBe(1);
      expect(json.summary.critical).toBe(1);
      expect(json.alerts).toHaveLength(1);
    });
  });
});
