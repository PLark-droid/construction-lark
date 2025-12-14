/**
 * Lark Base自動作成機能
 * 新しいLark Baseを自動的に作成し、必要な初期設定を行います
 */

import type { LarkClient } from '../api/lark-client.js';

/**
 * Base作成用の設定インターフェース
 */
export interface BaseCreatorConfig {
  name: string;
  description?: string;
  folderToken?: string; // 作成先フォルダ
}

/**
 * Base作成結果
 */
export interface BaseCreationResult {
  appToken: string;
  appUrl: string;
  name: string;
  createdAt: string;
}

/**
 * BaseCreator - 新しいLark Baseを自動作成
 *
 * @example
 * ```typescript
 * const creator = new BaseCreator(larkClient);
 * const result = await creator.createBase({
 *   name: '建設工事管理Base',
 *   description: '工事契約・工程管理・資格者管理を統合管理'
 * });
 * console.log(`Base作成完了: ${result.appUrl}`);
 * ```
 */
export class BaseCreator {
  private client: LarkClient;

  /**
   * BaseCreatorを初期化
   * @param client - LarkClientインスタンス
   */
  constructor(client: LarkClient) {
    this.client = client;
  }

  /**
   * 新しいBaseを作成
   *
   * @param config - Base作成設定
   * @returns Base作成結果
   * @throws アクセストークン取得失敗、Base作成失敗
   */
  async createBase(config: BaseCreatorConfig): Promise<BaseCreationResult> {
    const token = await this.client.getAccessToken();

    const requestBody: Record<string, unknown> = {
      name: config.name,
    };

    if (config.description) {
      requestBody.description = config.description;
    }

    if (config.folderToken) {
      requestBody.folder_token = config.folderToken;
    }

    const response = await fetch(
      'https://open.larksuite.com/open-apis/bitable/v1/apps',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json() as {
      code: number;
      msg: string;
      data?: {
        app: {
          app_token: string;
          url: string;
          name: string;
        };
      };
    };

    if (data.code !== 0 || !data.data) {
      throw new Error(`Failed to create Base: ${data.msg}`);
    }

    const result: BaseCreationResult = {
      appToken: data.data.app.app_token,
      appUrl: data.data.app.url,
      name: data.data.app.name,
      createdAt: new Date().toISOString(),
    };

    return result;
  }

  /**
   * 建設業向けBaseを作成（プリセット）
   *
   * 工事管理に必要な標準的なBase構成で自動作成します。
   *
   * @param folderToken - 作成先フォルダ（省略可）
   * @returns Base作成結果
   */
  async createConstructionBase(folderToken?: string): Promise<BaseCreationResult> {
    return this.createBase({
      name: '建設工事管理Base',
      description: '工事契約情報、工程管理、資格者管理、協力会社管理、資機材管理を統合管理するBase',
      folderToken,
    });
  }

  /**
   * Baseが存在するか確認
   *
   * @param appToken - 確認するBaseのapp_token
   * @returns 存在する場合true
   */
  async baseExists(appToken: string): Promise<boolean> {
    try {
      const token = await this.client.getAccessToken();

      const response = await fetch(
        `https://open.larksuite.com/open-apis/bitable/v1/apps/${appToken}/tables`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json() as { code: number };
      return data.code === 0;
    } catch {
      return false;
    }
  }

  /**
   * Baseを削除（開発・テスト用）
   *
   * 注意: この操作は取り消せません
   *
   * @param appToken - 削除するBaseのapp_token
   * @returns 削除成功したらtrue
   */
  async deleteBase(appToken: string): Promise<boolean> {
    const token = await this.client.getAccessToken();

    const response = await fetch(
      `https://open.larksuite.com/open-apis/bitable/v1/apps/${appToken}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json() as { code: number };
    return data.code === 0;
  }

  /**
   * Base情報を取得
   *
   * @param appToken - BaseのappToken
   * @returns Base情報
   */
  async getBaseInfo(appToken: string): Promise<{
    name: string;
    tableCount: number;
    url: string;
  }> {
    const token = await this.client.getAccessToken();

    // テーブル一覧を取得してBase情報を確認
    const tablesResponse = await this.client.listTables(appToken);

    if (tablesResponse.code !== 0) {
      throw new Error(`Failed to get Base info: ${tablesResponse.msg}`);
    }

    // Base詳細情報を取得
    const response = await fetch(
      `https://open.larksuite.com/open-apis/bitable/v1/apps/${appToken}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json() as {
      code: number;
      msg: string;
      data?: {
        app: {
          app_token: string;
          name: string;
          url: string;
        };
      };
    };

    if (data.code !== 0 || !data.data) {
      throw new Error(`Failed to get Base info: ${data.msg}`);
    }

    return {
      name: data.data.app.name,
      tableCount: tablesResponse.data?.items?.length || 0,
      url: data.data.app.url,
    };
  }
}
