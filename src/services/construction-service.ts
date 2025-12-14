/**
 * 工事管理サービス
 * Lark Baseから工事関連データを取得・管理
 */

import { LarkClient, FIELD_TYPES } from '../api/lark-client';
import type {
  ConstructionContract,
  QualifiedPerson,
  Subcontractor,
  Equipment,
  ProcessMaster,
  Qualification,
} from '../types';

export interface ConstructionServiceConfig {
  larkClient: LarkClient;
  appToken: string;
  tableIds: {
    contracts: string;
    qualifiedPersons: string;
    subcontractors: string;
    equipment: string;
    processMaster: string;
  };
}

export class ConstructionService {
  private client: LarkClient;
  private appToken: string;
  private tableIds: ConstructionServiceConfig['tableIds'];

  constructor(config: ConstructionServiceConfig) {
    this.client = config.larkClient;
    this.appToken = config.appToken;
    this.tableIds = config.tableIds;
  }

  // ========================================
  // 工事契約情報
  // ========================================

  async getContracts(): Promise<ConstructionContract[]> {
    const response = await this.client.listRecords(
      this.appToken,
      this.tableIds.contracts
    );

    if (response.code !== 0) {
      throw new Error(`Failed to get contracts: ${response.msg}`);
    }

    return response.data.items.map(item => this.mapToContract(item.fields));
  }

  async getContractById(id: string): Promise<ConstructionContract | null> {
    const response = await this.client.getRecord(
      this.appToken,
      this.tableIds.contracts,
      id
    );

    if (response.code !== 0) {
      return null;
    }

    return this.mapToContract(response.data.record.fields);
  }

  async createContract(contract: Omit<ConstructionContract, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConstructionContract> {
    const fields = this.mapFromContract(contract);
    const response = await this.client.createRecord(
      this.appToken,
      this.tableIds.contracts,
      fields
    );

    if (response.code !== 0) {
      throw new Error(`Failed to create contract: ${response.msg}`);
    }

    return this.mapToContract(response.data.record.fields);
  }

  // ========================================
  // 資格者マスタ
  // ========================================

  async getQualifiedPersons(): Promise<QualifiedPerson[]> {
    const response = await this.client.listRecords(
      this.appToken,
      this.tableIds.qualifiedPersons
    );

    if (response.code !== 0) {
      throw new Error(`Failed to get qualified persons: ${response.msg}`);
    }

    return response.data.items.map(item => this.mapToQualifiedPerson(item.fields));
  }

  async getQualifiedPersonById(id: string): Promise<QualifiedPerson | null> {
    const response = await this.client.getRecord(
      this.appToken,
      this.tableIds.qualifiedPersons,
      id
    );

    if (response.code !== 0) {
      return null;
    }

    return this.mapToQualifiedPerson(response.data.record.fields);
  }

  async getQualifiedPersonsByQualification(qualificationCategory: string): Promise<QualifiedPerson[]> {
    const filter = `CurrentValue.[qualifications] contains "${qualificationCategory}"`;
    const response = await this.client.listRecords(
      this.appToken,
      this.tableIds.qualifiedPersons,
      { filter }
    );

    if (response.code !== 0) {
      throw new Error(`Failed to get qualified persons: ${response.msg}`);
    }

    return response.data.items.map(item => this.mapToQualifiedPerson(item.fields));
  }

  // ========================================
  // 協力会社マスタ
  // ========================================

  async getSubcontractors(): Promise<Subcontractor[]> {
    const response = await this.client.listRecords(
      this.appToken,
      this.tableIds.subcontractors
    );

    if (response.code !== 0) {
      throw new Error(`Failed to get subcontractors: ${response.msg}`);
    }

    return response.data.items.map(item => this.mapToSubcontractor(item.fields));
  }

  async getSubcontractorsBySpecialty(specialty: string): Promise<Subcontractor[]> {
    const filter = `CurrentValue.[specialties] contains "${specialty}"`;
    const response = await this.client.listRecords(
      this.appToken,
      this.tableIds.subcontractors,
      { filter }
    );

    if (response.code !== 0) {
      throw new Error(`Failed to get subcontractors: ${response.msg}`);
    }

    return response.data.items.map(item => this.mapToSubcontractor(item.fields));
  }

  // ========================================
  // 資機材マスタ
  // ========================================

  async getEquipment(): Promise<Equipment[]> {
    const response = await this.client.listRecords(
      this.appToken,
      this.tableIds.equipment
    );

    if (response.code !== 0) {
      throw new Error(`Failed to get equipment: ${response.msg}`);
    }

    return response.data.items.map(item => this.mapToEquipment(item.fields));
  }

  async getAvailableEquipment(): Promise<Equipment[]> {
    const filter = 'CurrentValue.[status] = "available"';
    const response = await this.client.listRecords(
      this.appToken,
      this.tableIds.equipment,
      { filter }
    );

    if (response.code !== 0) {
      throw new Error(`Failed to get equipment: ${response.msg}`);
    }

    return response.data.items.map(item => this.mapToEquipment(item.fields));
  }

  async getEquipmentByCategory(category: string): Promise<Equipment[]> {
    const filter = `CurrentValue.[category] = "${category}"`;
    const response = await this.client.listRecords(
      this.appToken,
      this.tableIds.equipment,
      { filter }
    );

    if (response.code !== 0) {
      throw new Error(`Failed to get equipment: ${response.msg}`);
    }

    return response.data.items.map(item => this.mapToEquipment(item.fields));
  }

  // ========================================
  // 工程マスタ
  // ========================================

  async getProcessMasters(): Promise<ProcessMaster[]> {
    const response = await this.client.listRecords(
      this.appToken,
      this.tableIds.processMaster
    );

    if (response.code !== 0) {
      throw new Error(`Failed to get process masters: ${response.msg}`);
    }

    return response.data.items.map(item => this.mapToProcessMaster(item.fields));
  }

  // ========================================
  // Baseテーブル初期化（テーブル作成）
  // ========================================

  async initializeConstructionBase(): Promise<void> {
    // 工事契約情報テーブル
    await this.client.createTable(this.appToken, '工事契約情報', [
      { field_name: '契約番号', type: FIELD_TYPES.TEXT },
      { field_name: '工事名', type: FIELD_TYPES.TEXT },
      { field_name: '発注者名', type: FIELD_TYPES.TEXT },
      { field_name: '契約金額', type: FIELD_TYPES.NUMBER },
      { field_name: '契約日', type: FIELD_TYPES.DATE },
      { field_name: '着工日', type: FIELD_TYPES.DATE },
      { field_name: '竣工予定日', type: FIELD_TYPES.DATE },
      { field_name: '実際の竣工日', type: FIELD_TYPES.DATE },
      { field_name: '工事現場住所', type: FIELD_TYPES.TEXT },
      { field_name: 'ステータス', type: FIELD_TYPES.SELECT, property: {
        options: [
          { name: '計画中' },
          { name: '契約済' },
          { name: '施工中' },
          { name: '検査中' },
          { name: '完了' },
          { name: '中断' },
        ]
      }},
      { field_name: '備考', type: FIELD_TYPES.TEXT },
    ]);

    // 資格者マスタテーブル
    await this.client.createTable(this.appToken, '資格者マスタ', [
      { field_name: '社員番号', type: FIELD_TYPES.TEXT },
      { field_name: '氏名', type: FIELD_TYPES.TEXT },
      { field_name: '所属部署', type: FIELD_TYPES.TEXT },
      { field_name: '保有資格', type: FIELD_TYPES.MULTI_SELECT, property: {
        options: [
          { name: '施工管理技士' },
          { name: '建築士' },
          { name: '測量士' },
          { name: '安全管理者' },
          { name: 'クレーン運転士' },
          { name: '溶接技能者' },
        ]
      }},
      { field_name: '連絡先電話番号', type: FIELD_TYPES.PHONE },
      { field_name: 'メールアドレス', type: FIELD_TYPES.TEXT },
      { field_name: '在籍フラグ', type: FIELD_TYPES.CHECKBOX },
    ]);

    // 協力会社マスタテーブル
    await this.client.createTable(this.appToken, '協力会社マスタ', [
      { field_name: '会社コード', type: FIELD_TYPES.TEXT },
      { field_name: '会社名', type: FIELD_TYPES.TEXT },
      { field_name: '代表者名', type: FIELD_TYPES.TEXT },
      { field_name: '住所', type: FIELD_TYPES.TEXT },
      { field_name: '電話番号', type: FIELD_TYPES.PHONE },
      { field_name: 'FAX番号', type: FIELD_TYPES.TEXT },
      { field_name: 'メールアドレス', type: FIELD_TYPES.TEXT },
      { field_name: '専門分野', type: FIELD_TYPES.MULTI_SELECT, property: {
        options: [
          { name: 'とび' },
          { name: '型枠' },
          { name: '鉄筋' },
          { name: '土工' },
          { name: '電気' },
          { name: '設備' },
          { name: '内装' },
          { name: '外装' },
        ]
      }},
      { field_name: '評価ランク', type: FIELD_TYPES.SELECT, property: {
        options: [
          { name: 'A' },
          { name: 'B' },
          { name: 'C' },
          { name: 'D' },
        ]
      }},
      { field_name: '取引フラグ', type: FIELD_TYPES.CHECKBOX },
    ]);

    // 資機材マスタテーブル
    await this.client.createTable(this.appToken, '資機材マスタ', [
      { field_name: '資機材コード', type: FIELD_TYPES.TEXT },
      { field_name: '名称', type: FIELD_TYPES.TEXT },
      { field_name: '分類', type: FIELD_TYPES.SELECT, property: {
        options: [
          { name: '重機' },
          { name: '車両' },
          { name: '足場材' },
          { name: '型枠材' },
          { name: '電動工具' },
          { name: '測量機器' },
          { name: '安全設備' },
          { name: '仮設材' },
        ]
      }},
      { field_name: 'メーカー', type: FIELD_TYPES.TEXT },
      { field_name: '型番', type: FIELD_TYPES.TEXT },
      { field_name: '保有数量', type: FIELD_TYPES.NUMBER },
      { field_name: '単位', type: FIELD_TYPES.TEXT },
      { field_name: '日額単価', type: FIELD_TYPES.NUMBER },
      { field_name: '保管場所', type: FIELD_TYPES.TEXT },
      { field_name: '状態', type: FIELD_TYPES.SELECT, property: {
        options: [
          { name: '使用可能' },
          { name: '使用中' },
          { name: '整備中' },
          { name: '故障' },
          { name: '廃棄' },
        ]
      }},
    ]);

    // 工程マスタテーブル
    await this.client.createTable(this.appToken, '工程マスタ', [
      { field_name: '工程コード', type: FIELD_TYPES.TEXT },
      { field_name: '工程名', type: FIELD_TYPES.TEXT },
      { field_name: '工程分類', type: FIELD_TYPES.SELECT, property: {
        options: [
          { name: '準備工' },
          { name: '土工' },
          { name: '基礎工' },
          { name: '躯体工' },
          { name: '外装工' },
          { name: '内装工' },
          { name: '設備工' },
          { name: '仕上工' },
          { name: '検査' },
        ]
      }},
      { field_name: '標準工期', type: FIELD_TYPES.NUMBER },
      { field_name: '必要資格', type: FIELD_TYPES.MULTI_SELECT },
      { field_name: '必要機材', type: FIELD_TYPES.MULTI_SELECT },
      { field_name: '説明', type: FIELD_TYPES.TEXT },
    ]);
  }

  // ========================================
  // マッピング関数
  // ========================================

  private mapToContract(fields: Record<string, unknown>): ConstructionContract {
    return {
      id: fields['record_id'] as string || '',
      contractNumber: fields['契約番号'] as string || '',
      projectName: fields['工事名'] as string || '',
      clientName: fields['発注者名'] as string || '',
      contractAmount: fields['契約金額'] as number || 0,
      contractDate: fields['契約日'] as string || '',
      startDate: fields['着工日'] as string || '',
      completionDate: fields['竣工予定日'] as string || '',
      actualCompletionDate: fields['実際の竣工日'] as string,
      constructionSite: fields['工事現場住所'] as string || '',
      status: this.mapStatus(fields['ステータス'] as string),
      managerId: fields['現場責任者ID'] as string || '',
      description: fields['備考'] as string,
      createdAt: fields['作成日時'] as string || new Date().toISOString(),
      updatedAt: fields['更新日時'] as string || new Date().toISOString(),
    };
  }

  private mapFromContract(contract: Omit<ConstructionContract, 'id' | 'createdAt' | 'updatedAt'>): Record<string, unknown> {
    return {
      '契約番号': contract.contractNumber,
      '工事名': contract.projectName,
      '発注者名': contract.clientName,
      '契約金額': contract.contractAmount,
      '契約日': contract.contractDate,
      '着工日': contract.startDate,
      '竣工予定日': contract.completionDate,
      '実際の竣工日': contract.actualCompletionDate,
      '工事現場住所': contract.constructionSite,
      'ステータス': this.mapStatusToJapanese(contract.status),
      '備考': contract.description,
    };
  }

  private mapStatus(status: string): ConstructionContract['status'] {
    const statusMap: Record<string, ConstructionContract['status']> = {
      '計画中': 'planning',
      '契約済': 'contracted',
      '施工中': 'in_progress',
      '検査中': 'inspection',
      '完了': 'completed',
      '中断': 'suspended',
    };
    return statusMap[status] || 'planning';
  }

  private mapStatusToJapanese(status: ConstructionContract['status']): string {
    const statusMap: Record<ConstructionContract['status'], string> = {
      'planning': '計画中',
      'contracted': '契約済',
      'in_progress': '施工中',
      'inspection': '検査中',
      'completed': '完了',
      'suspended': '中断',
    };
    return statusMap[status];
  }

  private mapToQualifiedPerson(fields: Record<string, unknown>): QualifiedPerson {
    return {
      id: fields['record_id'] as string || '',
      employeeId: fields['社員番号'] as string || '',
      name: fields['氏名'] as string || '',
      department: fields['所属部署'] as string || '',
      qualifications: this.parseQualifications(fields['保有資格']),
      contactPhone: fields['連絡先電話番号'] as string,
      email: fields['メールアドレス'] as string,
      isActive: fields['在籍フラグ'] as boolean || false,
      createdAt: fields['作成日時'] as string || new Date().toISOString(),
      updatedAt: fields['更新日時'] as string || new Date().toISOString(),
    };
  }

  private parseQualifications(data: unknown): Qualification[] {
    if (!Array.isArray(data)) return [];
    return data.map((q, index) => ({
      id: `qual_${index}`,
      name: q as string,
      certificationNumber: '',
      issueDate: '',
      category: 'other' as const,
    }));
  }

  private mapToSubcontractor(fields: Record<string, unknown>): Subcontractor {
    return {
      id: fields['record_id'] as string || '',
      companyCode: fields['会社コード'] as string || '',
      companyName: fields['会社名'] as string || '',
      representativeName: fields['代表者名'] as string || '',
      address: fields['住所'] as string || '',
      phone: fields['電話番号'] as string || '',
      fax: fields['FAX番号'] as string,
      email: fields['メールアドレス'] as string,
      specialties: (fields['専門分野'] as string[]) || [],
      rating: (fields['評価ランク'] as Subcontractor['rating']) || 'C',
      insuranceStatus: { hasWorkersComp: false, hasLiability: false },
      contractHistory: [],
      isActive: fields['取引フラグ'] as boolean || false,
      createdAt: fields['作成日時'] as string || new Date().toISOString(),
      updatedAt: fields['更新日時'] as string || new Date().toISOString(),
    };
  }

  private mapToEquipment(fields: Record<string, unknown>): Equipment {
    return {
      id: fields['record_id'] as string || '',
      equipmentCode: fields['資機材コード'] as string || '',
      name: fields['名称'] as string || '',
      category: this.mapEquipmentCategory(fields['分類'] as string),
      manufacturer: fields['メーカー'] as string,
      modelNumber: fields['型番'] as string,
      quantity: fields['保有数量'] as number || 0,
      unit: fields['単位'] as string || '台',
      dailyRate: fields['日額単価'] as number,
      location: fields['保管場所'] as string || '',
      status: this.mapEquipmentStatus(fields['状態'] as string),
      createdAt: fields['作成日時'] as string || new Date().toISOString(),
      updatedAt: fields['更新日時'] as string || new Date().toISOString(),
    };
  }

  private mapEquipmentCategory(category: string): Equipment['category'] {
    const categoryMap: Record<string, Equipment['category']> = {
      '重機': 'heavy_machinery',
      '車両': 'vehicle',
      '足場材': 'scaffold',
      '型枠材': 'formwork',
      '電動工具': 'power_tool',
      '測量機器': 'measuring',
      '安全設備': 'safety',
      '仮設材': 'temporary',
    };
    return categoryMap[category] || 'other';
  }

  private mapEquipmentStatus(status: string): Equipment['status'] {
    const statusMap: Record<string, Equipment['status']> = {
      '使用可能': 'available',
      '使用中': 'in_use',
      '整備中': 'maintenance',
      '故障': 'broken',
      '廃棄': 'disposed',
    };
    return statusMap[status] || 'available';
  }

  private mapToProcessMaster(fields: Record<string, unknown>): ProcessMaster {
    return {
      id: fields['record_id'] as string || '',
      processCode: fields['工程コード'] as string || '',
      name: fields['工程名'] as string || '',
      category: this.mapProcessCategory(fields['工程分類'] as string),
      standardDuration: fields['標準工期'] as number || 0,
      requiredQualifications: (fields['必要資格'] as string[]) || [],
      requiredEquipment: (fields['必要機材'] as string[]) || [],
      predecessorProcesses: [],
      description: fields['説明'] as string,
      createdAt: fields['作成日時'] as string || new Date().toISOString(),
      updatedAt: fields['更新日時'] as string || new Date().toISOString(),
    };
  }

  private mapProcessCategory(category: string): ProcessMaster['category'] {
    const categoryMap: Record<string, ProcessMaster['category']> = {
      '準備工': 'preparation',
      '土工': 'earthwork',
      '基礎工': 'foundation',
      '躯体工': 'structural',
      '外装工': 'exterior',
      '内装工': 'interior',
      '設備工': 'mep',
      '仕上工': 'finishing',
      '検査': 'inspection',
    };
    return categoryMap[category] || 'preparation';
  }
}
