/**
 * Dashboard Service
 * Lark Base Dashboard APIを使用してダッシュボードとブロックを作成・管理
 */

import { LarkClient } from '../api/lark-client.js';
import type {
  Dashboard,
  CreateDashboardRequest,
  CreateDashboardResponse,
  DashboardBlock,
  CreateBlockRequest,
  CreateBlockResponse,
  BlockConfig,
  ChartBlockConfig,
  NumberBlockConfig,
  ProgressBlockConfig,
  DashboardTemplate,
} from '../types/dashboard.js';

export class DashboardService {
  constructor(
    private client: LarkClient,
    private appToken: string
  ) {}

  /**
   * ダッシュボードを作成
   */
  async createDashboard(request: CreateDashboardRequest): Promise<string> {
    const token = await this.client.getAccessToken();

    const response = await fetch(
      `${this.client['config'].baseUrl}/bitable/v1/apps/${this.appToken}/dashboards`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    const data = await response.json() as { code: number; msg: string; data: CreateDashboardResponse };

    if (data.code !== 0) {
      throw new Error(`Failed to create dashboard: ${data.msg}`);
    }

    return data.data.dashboard_id;
  }

  /**
   * ダッシュボード一覧を取得
   */
  async listDashboards(): Promise<Dashboard[]> {
    const token = await this.client.getAccessToken();

    const response = await fetch(
      `${this.client['config'].baseUrl}/bitable/v1/apps/${this.appToken}/dashboards`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json() as { code: number; msg: string; data: { items: Dashboard[] } };

    if (data.code !== 0) {
      throw new Error(`Failed to list dashboards: ${data.msg}`);
    }

    return data.data.items;
  }

  /**
   * ダッシュボードを削除
   */
  async deleteDashboard(dashboardId: string): Promise<void> {
    const token = await this.client.getAccessToken();

    const response = await fetch(
      `${this.client['config'].baseUrl}/bitable/v1/apps/${this.appToken}/dashboards/${dashboardId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json() as { code: number; msg: string };

    if (data.code !== 0) {
      throw new Error(`Failed to delete dashboard: ${data.msg}`);
    }
  }

  /**
   * ダッシュボードブロックを作成
   */
  async createBlock(
    dashboardId: string,
    request: CreateBlockRequest
  ): Promise<string> {
    const token = await this.client.getAccessToken();

    const response = await fetch(
      `${this.client['config'].baseUrl}/bitable/v1/apps/${this.appToken}/dashboards/${dashboardId}/blocks`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    const data = await response.json() as { code: number; msg: string; data: CreateBlockResponse };

    if (data.code !== 0) {
      throw new Error(`Failed to create block: ${data.msg}`);
    }

    return data.data.block_id;
  }

  /**
   * ダッシュボードのブロック一覧を取得
   */
  async listBlocks(dashboardId: string): Promise<DashboardBlock[]> {
    const token = await this.client.getAccessToken();

    const response = await fetch(
      `${this.client['config'].baseUrl}/bitable/v1/apps/${this.appToken}/dashboards/${dashboardId}/blocks`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json() as { code: number; msg: string; data: { items: DashboardBlock[] } };

    if (data.code !== 0) {
      throw new Error(`Failed to list blocks: ${data.msg}`);
    }

    return data.data.items;
  }

  /**
   * ブロックを更新
   */
  async updateBlock(
    dashboardId: string,
    blockId: string,
    config: Partial<CreateBlockRequest>
  ): Promise<void> {
    const token = await this.client.getAccessToken();

    const response = await fetch(
      `${this.client['config'].baseUrl}/bitable/v1/apps/${this.appToken}/dashboards/${dashboardId}/blocks/${blockId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      }
    );

    const data = await response.json() as { code: number; msg: string };

    if (data.code !== 0) {
      throw new Error(`Failed to update block: ${data.msg}`);
    }
  }

  /**
   * ブロックを削除
   */
  async deleteBlock(dashboardId: string, blockId: string): Promise<void> {
    const token = await this.client.getAccessToken();

    const response = await fetch(
      `${this.client['config'].baseUrl}/bitable/v1/apps/${this.appToken}/dashboards/${dashboardId}/blocks/${blockId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json() as { code: number; msg: string };

    if (data.code !== 0) {
      throw new Error(`Failed to delete block: ${data.msg}`);
    }
  }

  /**
   * テンプレートからダッシュボードを作成
   */
  async createDashboardFromTemplate(
    template: DashboardTemplate
  ): Promise<{ dashboardId: string; blockIds: string[] }> {
    // ダッシュボードを作成
    const dashboardId = await this.createDashboard({
      name: template.name,
    });

    // ブロックを作成
    const blockIds: string[] = [];

    for (const blockTemplate of template.blocks) {
      const blockId = await this.createBlock(dashboardId, {
        name: blockTemplate.name,
        type: blockTemplate.type,
        config: blockTemplate.config as BlockConfig,
        position: blockTemplate.position,
        size: blockTemplate.size,
      });

      blockIds.push(blockId);
    }

    return { dashboardId, blockIds };
  }

  /**
   * フィールドIDをフィールド名から取得
   */
  async getFieldId(tableId: string, fieldName: string): Promise<string> {
    const token = await this.client.getAccessToken();

    const response = await fetch(
      `${this.client['config'].baseUrl}/bitable/v1/apps/${this.appToken}/tables/${tableId}/fields`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json() as {
      code: number;
      msg: string;
      data: { items: Array<{ field_id: string; field_name: string }> };
    };

    if (data.code !== 0) {
      throw new Error(`Failed to get fields: ${data.msg}`);
    }

    const field = data.data.items.find((f) => f.field_name === fieldName);

    if (!field) {
      throw new Error(`Field not found: ${fieldName}`);
    }

    return field.field_id;
  }

  /**
   * 複数フィールドのIDを一括取得
   */
  async getFieldIds(
    tableId: string,
    fieldNames: string[]
  ): Promise<Record<string, string>> {
    const token = await this.client.getAccessToken();

    const response = await fetch(
      `${this.client['config'].baseUrl}/bitable/v1/apps/${this.appToken}/tables/${tableId}/fields`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json() as {
      code: number;
      msg: string;
      data: { items: Array<{ field_id: string; field_name: string }> };
    };

    if (data.code !== 0) {
      throw new Error(`Failed to get fields: ${data.msg}`);
    }

    const fieldMap: Record<string, string> = {};

    for (const fieldName of fieldNames) {
      const field = data.data.items.find((f) => f.field_name === fieldName);

      if (!field) {
        throw new Error(`Field not found: ${fieldName}`);
      }

      fieldMap[fieldName] = field.field_id;
    }

    return fieldMap;
  }
}
