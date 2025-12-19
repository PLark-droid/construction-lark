/**
 * ScheduleService Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScheduleService } from '../src/services/schedule-service';
import { LarkClient } from '../src/api/lark-client';
import type { ScheduleStatus } from '../src/types/schedule';

// Mock LarkClient
vi.mock('../src/api/lark-client', () => ({
  LarkClient: vi.fn().mockImplementation(() => ({
    listRecords: vi.fn(),
    getRecord: vi.fn(),
    createRecord: vi.fn(),
    updateRecord: vi.fn(),
    deleteRecord: vi.fn(),
    createTable: vi.fn(),
  })),
  FIELD_TYPES: {
    TEXT: 1,
    NUMBER: 2,
    SELECT: 3,
    MULTI_SELECT: 4,
    DATE: 5,
    CHECKBOX: 7,
    PHONE: 11,
  },
}));

describe('ScheduleService', () => {
  let service: ScheduleService;
  let mockClient: {
    listRecords: ReturnType<typeof vi.fn>;
    getRecord: ReturnType<typeof vi.fn>;
    createRecord: ReturnType<typeof vi.fn>;
    updateRecord: ReturnType<typeof vi.fn>;
    deleteRecord: ReturnType<typeof vi.fn>;
    createTable: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      listRecords: vi.fn(),
      getRecord: vi.fn(),
      createRecord: vi.fn(),
      updateRecord: vi.fn(),
      deleteRecord: vi.fn(),
      createTable: vi.fn(),
    };

    service = new ScheduleService({
      larkClient: mockClient as unknown as LarkClient,
      appToken: 'test-app-token',
      tableIds: {
        schedules: 'tbl_schedules',
        contracts: 'tbl_contracts',
        processMaster: 'tbl_process_master',
      },
    });
  });

  describe('getSchedules', () => {
    it('should return all schedules without filter', async () => {
      mockClient.listRecords.mockResolvedValue({
        code: 0,
        data: {
          items: [
            {
              record_id: 'rec_001',
              fields: {
                'contractId': 'contract_001',
                'processId': 'process_001',
                '工程名': '基礎工事',
                '予定開始日': '2024-01-01',
                '予定終了日': '2024-01-15',
                '進捗率': 50,
                'ステータス': '進行中',
              },
            },
          ],
        },
      });

      const schedules = await service.getSchedules();

      expect(schedules).toHaveLength(1);
      expect(schedules[0].name).toBe('基礎工事');
      expect(schedules[0].progress).toBe(50);
      expect(schedules[0].status).toBe('in_progress');
    });

    it('should filter by contractId', async () => {
      mockClient.listRecords.mockResolvedValue({
        code: 0,
        data: { items: [] },
      });

      await service.getSchedules({ contractId: 'contract_001' });

      expect(mockClient.listRecords).toHaveBeenCalledWith(
        'test-app-token',
        'tbl_schedules',
        expect.objectContaining({
          filter: expect.stringContaining('contract_001'),
        })
      );
    });

    it('should throw error on API failure', async () => {
      mockClient.listRecords.mockResolvedValue({
        code: 1,
        msg: 'API Error',
      });

      await expect(service.getSchedules()).rejects.toThrow('Failed to get schedules');
    });
  });

  describe('createSchedule', () => {
    it('should create a new schedule', async () => {
      mockClient.createRecord.mockResolvedValue({
        code: 0,
        data: {
          record: {
            record_id: 'rec_new',
            fields: {
              'contractId': 'contract_001',
              'processId': 'process_001',
              '工程名': '新規工程',
              '予定開始日': '2024-02-01',
              '予定終了日': '2024-02-15',
              '進捗率': 0,
              'ステータス': '未着手',
            },
          },
        },
      });

      const schedule = await service.createSchedule({
        contractId: 'contract_001',
        processId: 'process_001',
        name: '新規工程',
        plannedStartDate: '2024-02-01',
        plannedEndDate: '2024-02-15',
      });

      expect(schedule.name).toBe('新規工程');
      expect(schedule.status).toBe('not_started');
    });
  });

  describe('updateProgress', () => {
    it('should update progress and auto-update status', async () => {
      // Mock getScheduleById
      mockClient.getRecord.mockResolvedValue({
        code: 0,
        data: {
          record: {
            record_id: 'rec_001',
            fields: {
              'contractId': 'contract_001',
              'processId': 'process_001',
              '工程名': '基礎工事',
              '予定開始日': '2024-01-01',
              '予定終了日': '2099-12-31', // Future date
              '進捗率': 0,
              'ステータス': '未着手',
            },
          },
        },
      });

      // Mock updateRecord
      mockClient.updateRecord.mockResolvedValue({
        code: 0,
        data: {
          record: {
            record_id: 'rec_001',
            fields: {
              '進捗率': 50,
              'ステータス': '進行中',
            },
          },
        },
      });

      const schedule = await service.updateProgress('rec_001', { progress: 50 });

      expect(mockClient.updateRecord).toHaveBeenCalled();
    });

    it('should mark as completed when progress is 100', async () => {
      mockClient.getRecord.mockResolvedValue({
        code: 0,
        data: {
          record: {
            record_id: 'rec_001',
            fields: {
              'contractId': 'contract_001',
              'processId': 'process_001',
              '工程名': '基礎工事',
              '予定開始日': '2024-01-01',
              '予定終了日': '2024-01-15',
              '進捗率': 90,
              'ステータス': '進行中',
            },
          },
        },
      });

      mockClient.updateRecord.mockResolvedValue({
        code: 0,
        data: {
          record: {
            record_id: 'rec_001',
            fields: {
              '進捗率': 100,
              'ステータス': '完了',
            },
          },
        },
      });

      await service.updateProgress('rec_001', { progress: 100 });

      expect(mockClient.updateRecord).toHaveBeenCalledWith(
        'test-app-token',
        'tbl_schedules',
        'rec_001',
        expect.objectContaining({
          '進捗率': 100,
          'ステータス': '完了',
        })
      );
    });
  });

  describe('getAlerts', () => {
    it('should detect overdue schedules', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      mockClient.listRecords.mockResolvedValue({
        code: 0,
        data: {
          items: [
            {
              record_id: 'rec_overdue',
              fields: {
                'contractId': 'contract_001',
                '工程名': '期限超過工程',
                '予定開始日': '2024-01-01',
                '予定終了日': yesterdayStr,
                '進捗率': 80,
                'ステータス': '進行中',
              },
            },
          ],
        },
      });

      const alerts = await service.getAlerts();

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('overdue');
      expect(alerts[0].severity).toBe('critical');
    });

    it('should detect upcoming deadlines', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      mockClient.listRecords.mockResolvedValue({
        code: 0,
        data: {
          items: [
            {
              record_id: 'rec_upcoming',
              fields: {
                'contractId': 'contract_001',
                '工程名': '期限間近工程',
                '予定開始日': '2024-01-01',
                '予定終了日': tomorrowStr,
                '進捗率': 90,
                'ステータス': '進行中',
              },
            },
          ],
        },
      });

      const alerts = await service.getAlerts();

      expect(alerts.some(a => a.type === 'upcoming_deadline')).toBe(true);
    });

    it('should prioritize critical alerts', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      mockClient.listRecords.mockResolvedValue({
        code: 0,
        data: {
          items: [
            {
              record_id: 'rec_upcoming',
              fields: {
                'contractId': 'contract_001',
                '工程名': '期限間近',
                '予定開始日': '2024-01-01',
                '予定終了日': tomorrow.toISOString().split('T')[0],
                '進捗率': 90,
                'ステータス': '進行中',
              },
            },
            {
              record_id: 'rec_overdue',
              fields: {
                'contractId': 'contract_001',
                '工程名': '期限超過',
                '予定開始日': '2024-01-01',
                '予定終了日': yesterday.toISOString().split('T')[0],
                '進捗率': 80,
                'ステータス': '進行中',
              },
            },
          ],
        },
      });

      const alerts = await service.getAlerts();

      // Critical alerts should come first
      expect(alerts[0].severity).toBe('critical');
    });
  });
});
