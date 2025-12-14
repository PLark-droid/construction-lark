/**
 * Lark OAuth Authentication Module
 *
 * Features:
 * - App Access Token authentication (Internal App)
 * - Automatic token refresh
 * - Token persistence to local file system
 * - Authentication status checking
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Lark authentication configuration
 */
export interface LarkAuthConfig {
  /** Lark App ID */
  appId: string;
  /** Lark App Secret */
  appSecret: string;
  /** Base URL for Lark API (default: https://open.larksuite.com/open-apis) */
  baseUrl?: string;
  /** Custom credentials file path (default: ~/.construction-lark/credentials.json) */
  credentialsPath?: string;
}

/**
 * Stored credentials structure
 */
export interface LarkCredentials {
  /** App access token */
  accessToken: string;
  /** Token expiration timestamp (Unix timestamp in seconds) */
  expiresAt: number;
  /** App ID used for this token */
  appId: string;
  /** Last updated timestamp */
  updatedAt: string;
}

/**
 * Lark API token response
 */
interface LarkTokenResponse {
  code: number;
  msg: string;
  app_access_token: string;
  expire: number;
}

/**
 * Lark OAuth Authentication Manager
 *
 * Handles app access token authentication for Lark internal apps.
 * Automatically saves and refreshes tokens.
 *
 * @example
 * ```typescript
 * const auth = new LarkAuth({
 *   appId: process.env.LARK_APP_ID!,
 *   appSecret: process.env.LARK_APP_SECRET!
 * });
 *
 * // Authenticate and get token
 * const token = await auth.authenticate();
 *
 * // Check if authenticated
 * if (await auth.isAuthenticated()) {
 *   console.log('Already authenticated');
 * }
 *
 * // Get current token (auto-refresh if needed)
 * const currentToken = await auth.getAccessToken();
 * ```
 */
export class LarkAuth {
  private config: Required<LarkAuthConfig>;
  private credentials: LarkCredentials | null = null;
  private readonly DEFAULT_CREDENTIALS_DIR = '.construction-lark';
  private readonly DEFAULT_CREDENTIALS_FILE = 'credentials.json';

  /**
   * Creates a new LarkAuth instance
   *
   * @param config - Authentication configuration
   */
  constructor(config: LarkAuthConfig) {
    this.config = {
      appId: config.appId,
      appSecret: config.appSecret,
      baseUrl: config.baseUrl || 'https://open.larksuite.com/open-apis',
      credentialsPath: config.credentialsPath || this.getDefaultCredentialsPath(),
    };
  }

  /**
   * Gets the default credentials file path
   *
   * @returns Default path: ~/.construction-lark/credentials.json
   */
  private getDefaultCredentialsPath(): string {
    return join(homedir(), this.DEFAULT_CREDENTIALS_DIR, this.DEFAULT_CREDENTIALS_FILE);
  }

  /**
   * Ensures the credentials directory exists
   */
  private async ensureCredentialsDirectory(): Promise<void> {
    const dir = this.config.credentialsPath.substring(
      0,
      this.config.credentialsPath.lastIndexOf('/')
    );

    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  /**
   * Loads credentials from the local file system
   *
   * @returns Loaded credentials or null if not found
   */
  private async loadCredentials(): Promise<LarkCredentials | null> {
    try {
      if (!existsSync(this.config.credentialsPath)) {
        return null;
      }

      const data = await readFile(this.config.credentialsPath, 'utf-8');
      const credentials = JSON.parse(data) as LarkCredentials;

      // Validate the credentials belong to the current app
      if (credentials.appId !== this.config.appId) {
        console.warn('Stored credentials are for a different app, ignoring');
        return null;
      }

      return credentials;
    } catch (error) {
      console.error('Failed to load credentials:', (error as Error).message);
      return null;
    }
  }

  /**
   * Saves credentials to the local file system
   *
   * @param credentials - Credentials to save
   */
  private async saveCredentials(credentials: LarkCredentials): Promise<void> {
    try {
      await this.ensureCredentialsDirectory();
      await writeFile(
        this.config.credentialsPath,
        JSON.stringify(credentials, null, 2),
        'utf-8'
      );
    } catch (error) {
      throw new Error(`Failed to save credentials: ${(error as Error).message}`);
    }
  }

  /**
   * Requests a new app access token from Lark API
   *
   * @returns New access token and expiration info
   */
  private async requestNewToken(): Promise<{ accessToken: string; expiresIn: number }> {
    const response = await fetch(
      `${this.config.baseUrl}/auth/v3/app_access_token/internal`,
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as LarkTokenResponse;

    if (data.code !== 0) {
      throw new Error(`Lark API error (${data.code}): ${data.msg}`);
    }

    return {
      accessToken: data.app_access_token,
      expiresIn: data.expire,
    };
  }

  /**
   * Checks if the current token is valid and not expired
   *
   * @param bufferSeconds - Consider token expired if it expires within this many seconds (default: 300)
   * @returns True if token is valid
   */
  private isTokenValid(bufferSeconds: number = 300): boolean {
    if (!this.credentials) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return this.credentials.expiresAt > now + bufferSeconds;
  }

  /**
   * Authenticates with Lark API and obtains an app access token
   *
   * This method will:
   * 1. Request a new token from Lark API
   * 2. Save the token to local file system
   * 3. Return the access token
   *
   * @returns App access token
   * @throws Error if authentication fails
   */
  async authenticate(): Promise<string> {
    const { accessToken, expiresIn } = await this.requestNewToken();

    const now = Math.floor(Date.now() / 1000);
    this.credentials = {
      accessToken,
      expiresAt: now + expiresIn,
      appId: this.config.appId,
      updatedAt: new Date().toISOString(),
    };

    await this.saveCredentials(this.credentials);

    return accessToken;
  }

  /**
   * Gets a valid access token, automatically refreshing if needed
   *
   * This method will:
   * 1. Check if we have a valid cached token
   * 2. If not, try to load from file system
   * 3. If expired or not found, request a new token
   * 4. Return the valid access token
   *
   * @returns Valid app access token
   * @throws Error if authentication fails
   */
  async getAccessToken(): Promise<string> {
    // Check if we have a valid token in memory
    if (this.isTokenValid()) {
      return this.credentials!.accessToken;
    }

    // Try to load from file system
    this.credentials = await this.loadCredentials();

    // Check if loaded token is valid
    if (this.isTokenValid()) {
      return this.credentials!.accessToken;
    }

    // Request a new token
    return await this.authenticate();
  }

  /**
   * Checks if the user is currently authenticated
   *
   * @returns True if authenticated with a valid token
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Try to load credentials
      if (!this.credentials) {
        this.credentials = await this.loadCredentials();
      }

      // Check if token is valid
      return this.isTokenValid();
    } catch {
      return false;
    }
  }

  /**
   * Forces a token refresh
   *
   * Use this method if you suspect the token is invalid or want to ensure
   * you have the latest token.
   *
   * @returns New access token
   */
  async refreshToken(): Promise<string> {
    return await this.authenticate();
  }

  /**
   * Gets the current credentials information
   *
   * @returns Current credentials or null if not authenticated
   */
  getCredentials(): LarkCredentials | null {
    return this.credentials;
  }

  /**
   * Gets the credentials file path
   *
   * @returns Path to the credentials file
   */
  getCredentialsPath(): string {
    return this.config.credentialsPath;
  }

  /**
   * Clears the stored credentials
   *
   * This removes both the in-memory and file-based credentials.
   * After calling this method, you'll need to authenticate again.
   */
  async clearCredentials(): Promise<void> {
    this.credentials = null;

    if (existsSync(this.config.credentialsPath)) {
      const fs = await import('fs/promises');
      await fs.unlink(this.config.credentialsPath);
    }
  }
}
