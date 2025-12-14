/**
 * Lark Base API Client
 * Lark Open API を使用してBaseテーブルにアクセス
 */

export interface LarkConfig {
  appId: string;
  appSecret: string;
  baseUrl?: string;
}

export interface LarkTokenResponse {
  code: number;
  msg: string;
  tenant_access_token: string;
  expire: number;
}

export interface LarkApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface BaseRecord {
  record_id: string;
  fields: Record<string, unknown>;
}

export interface ListRecordsResponse {
  has_more: boolean;
  page_token?: string;
  total: number;
  items: BaseRecord[];
}

export class LarkClient {
  private config: LarkConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: LarkConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://open.larksuite.com/open-apis',
    };
  }

  /**
   * テナントアクセストークンを取得
   */
  async getAccessToken(): Promise<string> {
    const now = Date.now() / 1000;

    // トークンがまだ有効な場合は再利用
    if (this.accessToken && this.tokenExpiry > now + 60) {
      return this.accessToken;
    }

    const response = await fetch(
      `${this.config.baseUrl}/auth/v3/tenant_access_token/internal`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: this.config.appId,
          app_secret: this.config.appSecret,
        }),
      }
    );

    const data = await response.json() as LarkTokenResponse;

    if (data.code !== 0) {
      throw new Error(`Failed to get access token: ${data.msg}`);
    }

    this.accessToken = data.tenant_access_token;
    this.tokenExpiry = now + data.expire;

    return this.accessToken;
  }

  /**
   * Base内のテーブル一覧を取得
   */
  async listTables(appToken: string): Promise<LarkApiResponse<{ items: Array<{ table_id: string; name: string }> }>> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.config.baseUrl}/bitable/v1/apps/${appToken}/tables`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.json() as Promise<LarkApiResponse<{ items: Array<{ table_id: string; name: string }> }>>;
  }

  /**
   * テーブルのレコード一覧を取得
   */
  async listRecords(
    appToken: string,
    tableId: string,
    options?: {
      pageSize?: number;
      pageToken?: string;
      filter?: string;
      sort?: string[];
    }
  ): Promise<LarkApiResponse<ListRecordsResponse>> {
    const token = await this.getAccessToken();

    const params = new URLSearchParams();
    if (options?.pageSize) params.set('page_size', options.pageSize.toString());
    if (options?.pageToken) params.set('page_token', options.pageToken);
    if (options?.filter) params.set('filter', options.filter);
    if (options?.sort) options.sort.forEach(s => params.append('sort', s));

    const url = `${this.config.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records?${params}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.json() as Promise<LarkApiResponse<ListRecordsResponse>>;
  }

  /**
   * レコードを取得
   */
  async getRecord(
    appToken: string,
    tableId: string,
    recordId: string
  ): Promise<LarkApiResponse<{ record: BaseRecord }>> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.config.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.json() as Promise<LarkApiResponse<{ record: BaseRecord }>>;
  }

  /**
   * レコードを作成
   */
  async createRecord(
    appToken: string,
    tableId: string,
    fields: Record<string, unknown>
  ): Promise<LarkApiResponse<{ record: BaseRecord }>> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.config.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );

    return response.json() as Promise<LarkApiResponse<{ record: BaseRecord }>>;
  }

  /**
   * 複数レコードを一括作成
   */
  async batchCreateRecords(
    appToken: string,
    tableId: string,
    records: Array<{ fields: Record<string, unknown> }>
  ): Promise<LarkApiResponse<{ records: BaseRecord[] }>> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.config.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records }),
      }
    );

    return response.json() as Promise<LarkApiResponse<{ records: BaseRecord[] }>>;
  }

  /**
   * レコードを更新
   */
  async updateRecord(
    appToken: string,
    tableId: string,
    recordId: string,
    fields: Record<string, unknown>
  ): Promise<LarkApiResponse<{ record: BaseRecord }>> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.config.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );

    return response.json() as Promise<LarkApiResponse<{ record: BaseRecord }>>;
  }

  /**
   * レコードを削除
   */
  async deleteRecord(
    appToken: string,
    tableId: string,
    recordId: string
  ): Promise<LarkApiResponse<{ deleted: boolean }>> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.config.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.json() as Promise<LarkApiResponse<{ deleted: boolean }>>;
  }

  /**
   * テーブルを作成
   */
  async createTable(
    appToken: string,
    name: string,
    fields: Array<{
      field_name: string;
      type: number;
      property?: Record<string, unknown>;
    }>
  ): Promise<LarkApiResponse<{ table_id: string }>> {
    const token = await this.getAccessToken();

    const response = await fetch(
      `${this.config.baseUrl}/bitable/v1/apps/${appToken}/tables`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: { name, fields },
        }),
      }
    );

    return response.json() as Promise<LarkApiResponse<{ table_id: string }>>;
  }
}

// フィールドタイプの定数
export const FIELD_TYPES = {
  TEXT: 1,           // テキスト
  NUMBER: 2,         // 数値
  SELECT: 3,         // 単一選択
  MULTI_SELECT: 4,   // 複数選択
  DATE: 5,           // 日付
  CHECKBOX: 7,       // チェックボックス
  PERSON: 11,        // ユーザー
  PHONE: 13,         // 電話番号
  URL: 15,           // URL
  ATTACHMENT: 17,    // 添付ファイル
  LINK: 18,          // リンク（他テーブル参照）
  FORMULA: 20,       // 数式
  CREATED_TIME: 1001,// 作成日時
  UPDATED_TIME: 1002,// 更新日時
  CREATED_BY: 1003,  // 作成者
  UPDATED_BY: 1004,  // 更新者
} as const;
