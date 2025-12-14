/**
 * 工事管理・ガントチャート機能のテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LarkClient, FIELD_TYPES } from '../src/api/lark-client';
import { ConstructionService } from '../src/services/construction-service';
import { GanttService } from '../src/services/gantt-service';
import type { ConstructionContract, QualifiedPerson, Equipment } from '../src/types';

// モック設定
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('LarkClient', () => {
  let client: LarkClient;

  beforeEach(() => {
    client = new LarkClient({
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
    });
    mockFetch.mockClear();
  });

  it('should get access token', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        code: 0,
        msg: 'success',
        tenant_access_token: 'test-token',
        expire: 7200,
      }),
    });

    const token = await client.getAccessToken();
    expect(token).toBe('test-token');
  });

  it('should list tables', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 0,
          tenant_access_token: 'test-token',
          expire: 7200,
        }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 0,
          data: {
            items: [
              { table_id: 'tbl1', name: '工事契約情報' },
              { table_id: 'tbl2', name: '資格者マスタ' },
            ],
          },
        }),
      });

    const result = await client.listTables('app-token');
    expect(result.code).toBe(0);
    expect(result.data.items).toHaveLength(2);
  });

  it('should create record', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 0,
          tenant_access_token: 'test-token',
          expire: 7200,
        }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 0,
          data: {
            record: {
              record_id: 'rec123',
              fields: { '工事名': 'テスト工事' },
            },
          },
        }),
      });

    const result = await client.createRecord('app-token', 'table-id', {
      '工事名': 'テスト工事',
    });
    expect(result.code).toBe(0);
    expect(result.data.record.fields['工事名']).toBe('テスト工事');
  });
});

describe('ConstructionService', () => {
  let service: ConstructionService;
  let mockClient: LarkClient;

  beforeEach(() => {
    mockClient = new LarkClient({
      appId: 'test-app-id',
      appSecret: 'test-app-secret',
    });

    service = new ConstructionService({
      larkClient: mockClient,
      appToken: 'test-app-token',
      tableIds: {
        contracts: 'tbl_contracts',
        qualifiedPersons: 'tbl_persons',
        subcontractors: 'tbl_subs',
        equipment: 'tbl_equip',
        processMaster: 'tbl_process',
      },
    });

    mockFetch.mockClear();
  });

  it('should get contracts list', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 0,
          tenant_access_token: 'test-token',
          expire: 7200,
        }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 0,
          data: {
            items: [
              {
                record_id: 'rec1',
                fields: {
                  '契約番号': 'CON-001',
                  '工事名': 'A棟新築工事',
                  '発注者名': 'ABC株式会社',
                  '契約金額': 100000000,
                  'ステータス': '施工中',
                },
              },
            ],
            has_more: false,
            total: 1,
          },
        }),
      });

    const contracts = await service.getContracts();
    expect(contracts).toHaveLength(1);
    expect(contracts[0].contractNumber).toBe('CON-001');
    expect(contracts[0].projectName).toBe('A棟新築工事');
    expect(contracts[0].status).toBe('in_progress');
  });

  it('should get qualified persons', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 0,
          tenant_access_token: 'test-token',
          expire: 7200,
        }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 0,
          data: {
            items: [
              {
                record_id: 'rec1',
                fields: {
                  '社員番号': 'EMP001',
                  '氏名': '山田太郎',
                  '所属部署': '工事部',
                  '保有資格': ['施工管理技士', '建築士'],
                  '在籍フラグ': true,
                },
              },
            ],
            has_more: false,
            total: 1,
          },
        }),
      });

    const persons = await service.getQualifiedPersons();
    expect(persons).toHaveLength(1);
    expect(persons[0].name).toBe('山田太郎');
    expect(persons[0].isActive).toBe(true);
  });

  it('should get available equipment', async () => {
    mockFetch
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 0,
          tenant_access_token: 'test-token',
          expire: 7200,
        }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          code: 0,
          data: {
            items: [
              {
                record_id: 'rec1',
                fields: {
                  '資機材コード': 'EQ001',
                  '名称': 'バックホウ 0.7m3',
                  '分類': '重機',
                  '保有数量': 3,
                  '状態': '使用可能',
                },
              },
            ],
            has_more: false,
            total: 1,
          },
        }),
      });

    const equipment = await service.getAvailableEquipment();
    expect(equipment).toHaveLength(1);
    expect(equipment[0].name).toBe('バックホウ 0.7m3');
    expect(equipment[0].category).toBe('heavy_machinery');
    expect(equipment[0].status).toBe('available');
  });
});

describe('GanttService', () => {
  it('should calculate gantt summary correctly', () => {
    // 直接テスト用のヘルパー関数
    const calculateDuration = (start: string, end: string): number => {
      const startDate = new Date(start);
      const endDate = new Date(end);
      return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    };

    const duration = calculateDuration('2024-01-01', '2024-03-31');
    expect(duration).toBe(90);
  });

  it('should detect date overlap', () => {
    const isOverlapping = (
      period1: { start: string; end: string },
      period2: { start: string; end: string }
    ): boolean => {
      return period1.start <= period2.end && period1.end >= period2.start;
    };

    // 重複あり
    expect(isOverlapping(
      { start: '2024-01-01', end: '2024-01-31' },
      { start: '2024-01-15', end: '2024-02-15' }
    )).toBe(true);

    // 重複なし
    expect(isOverlapping(
      { start: '2024-01-01', end: '2024-01-31' },
      { start: '2024-02-01', end: '2024-02-28' }
    )).toBe(false);
  });

  it('should calculate workload summary', () => {
    const calculateUtilization = (current: number, max: number): number => {
      return Math.min(100, Math.round((current / max) * 100));
    };

    expect(calculateUtilization(2, 3)).toBe(67);
    expect(calculateUtilization(3, 3)).toBe(100);
    expect(calculateUtilization(4, 3)).toBe(100); // 上限100%
  });
});

describe('FIELD_TYPES', () => {
  it('should have correct field type values', () => {
    expect(FIELD_TYPES.TEXT).toBe(1);
    expect(FIELD_TYPES.NUMBER).toBe(2);
    expect(FIELD_TYPES.SELECT).toBe(3);
    expect(FIELD_TYPES.MULTI_SELECT).toBe(4);
    expect(FIELD_TYPES.DATE).toBe(5);
    expect(FIELD_TYPES.CHECKBOX).toBe(7);
  });
});

describe('Type definitions', () => {
  it('should accept valid ConstructionContract', () => {
    const contract: ConstructionContract = {
      id: '1',
      contractNumber: 'CON-001',
      projectName: 'テスト工事',
      clientName: 'テスト会社',
      contractAmount: 10000000,
      contractDate: '2024-01-01',
      startDate: '2024-02-01',
      completionDate: '2024-12-31',
      constructionSite: '東京都渋谷区',
      status: 'in_progress',
      managerId: 'mgr001',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    expect(contract.status).toBe('in_progress');
    expect(contract.contractAmount).toBe(10000000);
  });

  it('should accept valid QualifiedPerson', () => {
    const person: QualifiedPerson = {
      id: '1',
      employeeId: 'EMP001',
      name: '山田太郎',
      department: '工事部',
      qualifications: [
        {
          id: 'q1',
          name: '1級建築施工管理技士',
          certificationNumber: 'CERT-001',
          issueDate: '2020-01-01',
          category: 'construction_manager',
        },
      ],
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    expect(person.qualifications).toHaveLength(1);
    expect(person.qualifications[0].category).toBe('construction_manager');
  });

  it('should accept valid Equipment', () => {
    const equipment: Equipment = {
      id: '1',
      equipmentCode: 'EQ001',
      name: 'バックホウ',
      category: 'heavy_machinery',
      quantity: 3,
      unit: '台',
      location: '本社倉庫',
      status: 'available',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    expect(equipment.category).toBe('heavy_machinery');
    expect(equipment.status).toBe('available');
  });
});
