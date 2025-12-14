# Lark Authentication Guide

## Overview

The `LarkAuth` module provides automatic OAuth authentication for Lark internal apps using the App Access Token flow. It handles token acquisition, automatic refresh, and persistent storage.

## Features

- **Automatic Authentication**: Seamlessly obtains app access tokens
- **Token Persistence**: Saves tokens to local file system (`~/.construction-lark/credentials.json`)
- **Auto-Refresh**: Automatically refreshes expired tokens
- **Type-Safe**: Full TypeScript support with strict typing
- **Simple API**: Easy-to-use methods for authentication management

## Installation

```bash
npm install construction-lark
```

## Quick Start

```typescript
import { LarkAuth } from 'construction-lark';

// Initialize
const auth = new LarkAuth({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!
});

// Get access token (auto-authenticates if needed)
const token = await auth.getAccessToken();

// Use token with Lark API
const response = await fetch(
  'https://open.larksuite.com/open-apis/bitable/v1/apps/your_app/tables',
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);
```

## API Reference

### Constructor

```typescript
new LarkAuth(config: LarkAuthConfig)
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config.appId` | `string` | Yes | Lark App ID |
| `config.appSecret` | `string` | Yes | Lark App Secret |
| `config.baseUrl` | `string` | No | Lark API base URL (default: `https://open.larksuite.com/open-apis`) |
| `config.credentialsPath` | `string` | No | Custom credentials file path (default: `~/.construction-lark/credentials.json`) |

### Methods

#### `authenticate()`

Explicitly authenticates with Lark API and obtains a new access token.

```typescript
const token = await auth.authenticate();
```

**Returns**: `Promise<string>` - App access token

**Use case**: Force a new token request (rarely needed, use `getAccessToken()` instead)

---

#### `getAccessToken()`

Gets a valid access token, automatically refreshing if expired.

```typescript
const token = await auth.getAccessToken();
```

**Returns**: `Promise<string>` - Valid app access token

**How it works**:
1. Checks if cached token is valid
2. If not, loads from file system
3. If expired or missing, requests new token
4. Returns valid token

**Use case**: Primary method for getting tokens in your application

---

#### `isAuthenticated()`

Checks if currently authenticated with a valid token.

```typescript
const authenticated = await auth.isAuthenticated();
if (authenticated) {
  console.log('Ready to use Lark API');
}
```

**Returns**: `Promise<boolean>` - `true` if authenticated with valid token

---

#### `refreshToken()`

Forces a token refresh, ignoring cached tokens.

```typescript
const newToken = await auth.refreshToken();
```

**Returns**: `Promise<string>` - New app access token

**Use case**: When you suspect the token is invalid or want to ensure latest token

---

#### `getCredentials()`

Gets current credentials information.

```typescript
const credentials = auth.getCredentials();
if (credentials) {
  console.log('Token expires at:', new Date(credentials.expiresAt * 1000));
}
```

**Returns**: `LarkCredentials | null`

**Credentials structure**:
```typescript
interface LarkCredentials {
  accessToken: string;
  expiresAt: number;      // Unix timestamp (seconds)
  appId: string;
  updatedAt: string;      // ISO 8601 timestamp
}
```

---

#### `getCredentialsPath()`

Gets the credentials file path.

```typescript
const path = auth.getCredentialsPath();
console.log('Credentials stored at:', path);
```

**Returns**: `string` - Full path to credentials file

---

#### `clearCredentials()`

Clears stored credentials (both in-memory and file-based).

```typescript
await auth.clearCredentials();
```

**Returns**: `Promise<void>`

**Use case**: Logout or switching to a different app

## Usage Examples

### Example 1: Basic Authentication

```typescript
import { LarkAuth } from 'construction-lark';

const auth = new LarkAuth({
  appId: 'cli_xxxxxxxxxxxx',
  appSecret: 'xxxxxxxxxxxxxxxxxxxxxxxx'
});

// Get token (auto-authenticates)
const token = await auth.getAccessToken();
console.log('Access token:', token);
```

### Example 2: Integration with LarkClient

```typescript
import { LarkAuth, LarkClient } from 'construction-lark';

// Set up authentication
const auth = new LarkAuth({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!
});

// Get token
const token = await auth.getAccessToken();

// Use with LarkClient (manual token injection)
const client = new LarkClient({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!
});

// LarkClient manages its own tokens internally
// But you can use LarkAuth for other direct API calls
```

### Example 3: Custom Credentials Path

```typescript
const auth = new LarkAuth({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!,
  credentialsPath: '/var/app/config/lark-credentials.json'
});

console.log('Credentials will be saved to:', auth.getCredentialsPath());
```

### Example 4: Check Before Use

```typescript
const auth = new LarkAuth({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!
});

if (await auth.isAuthenticated()) {
  console.log('Already authenticated, using cached token');
} else {
  console.log('Not authenticated, will obtain new token');
}

const token = await auth.getAccessToken();
```

### Example 5: Error Handling

```typescript
import { LarkAuth } from 'construction-lark';

const auth = new LarkAuth({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!
});

try {
  const token = await auth.authenticate();
  console.log('Authentication successful');
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('HTTP 401')) {
      console.error('Invalid credentials');
    } else if (error.message.includes('Lark API error')) {
      console.error('Lark API returned error:', error.message);
    } else {
      console.error('Authentication failed:', error.message);
    }
  }
}
```

### Example 6: Using with Direct API Calls

```typescript
const auth = new LarkAuth({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!
});

async function listTables(appToken: string) {
  const token = await auth.getAccessToken();

  const response = await fetch(
    `https://open.larksuite.com/open-apis/bitable/v1/apps/${appToken}/tables`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.json();
}

const tables = await listTables('bascnxxxxxxxxxxxxxx');
console.log('Tables:', tables.data.items);
```

## Token Lifecycle

### Token Validity

- Tokens typically expire after **2 hours** (7200 seconds)
- `LarkAuth` considers tokens expired **5 minutes before** actual expiration (safety buffer)
- Automatically refreshes when needed

### Token Storage

**Default location**: `~/.construction-lark/credentials.json`

**File structure**:
```json
{
  "accessToken": "t-xxxxxxxxxxxxxxxxxxxxxxxx",
  "expiresAt": 1234567890,
  "appId": "cli_xxxxxxxxxxxx",
  "updatedAt": "2024-01-15T12:34:56.789Z"
}
```

### Security Considerations

1. **File Permissions**: Credentials file should have restricted permissions (600)
2. **App Secret**: Never commit `LARK_APP_SECRET` to version control
3. **Token Scope**: App access tokens have app-level permissions
4. **Token Reuse**: Same token is reused until expiration (efficient)

## Environment Variables

Set up your environment variables:

```bash
# .env
LARK_APP_ID=cli_xxxxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

Load with dotenv or similar:

```typescript
import dotenv from 'dotenv';
dotenv.config();

const auth = new LarkAuth({
  appId: process.env.LARK_APP_ID!,
  appSecret: process.env.LARK_APP_SECRET!
});
```

## Testing

Run the authentication tests:

```bash
npm test -- src/auth/__tests__/lark-auth.test.ts
```

## Troubleshooting

### "Failed to get access token" Error

**Cause**: Invalid App ID or App Secret

**Solution**:
- Verify your credentials in Lark Developer Console
- Check environment variables are set correctly
- Ensure App ID starts with `cli_`

### "Failed to save credentials" Error

**Cause**: Permission denied or disk full

**Solution**:
- Check file system permissions
- Ensure home directory is writable
- Use custom `credentialsPath` if needed

### Credentials File Not Found

**Cause**: First time using or credentials were cleared

**Solution**: Normal behavior - `LarkAuth` will automatically authenticate and create the file

## Best Practices

1. **Reuse Instance**: Create one `LarkAuth` instance and reuse it
   ```typescript
   // Good
   const auth = new LarkAuth(config);
   const token1 = await auth.getAccessToken();
   const token2 = await auth.getAccessToken(); // Uses cached token

   // Less efficient
   const token1 = await new LarkAuth(config).getAccessToken();
   const token2 = await new LarkAuth(config).getAccessToken(); // May load from file twice
   ```

2. **Use `getAccessToken()`**: Don't call `authenticate()` directly
   ```typescript
   // Good
   const token = await auth.getAccessToken();

   // Unnecessary
   const token = await auth.authenticate(); // Forces new request
   ```

3. **Environment Variables**: Use environment variables for secrets
   ```typescript
   // Good
   appSecret: process.env.LARK_APP_SECRET!

   // Bad
   appSecret: 'hardcoded_secret' // Never do this!
   ```

4. **Error Handling**: Always wrap in try-catch
   ```typescript
   try {
     const token = await auth.getAccessToken();
   } catch (error) {
     console.error('Authentication failed:', error);
     // Handle error appropriately
   }
   ```

## Related Documentation

- [Lark Open API Documentation](https://open.larksuite.com/document/home/introduction-to-custom-app-development/self-built-application-development-process)
- [App Access Token Guide](https://open.larksuite.com/document/server-docs/authentication-management/access-token/app_access_token_internal)
- [LarkClient API Reference](./lark-client.md)

## Support

For issues or questions:
- GitHub Issues: https://github.com/PLark-droid/construction-lark/issues
- Lark Open Platform: https://open.larksuite.com/
