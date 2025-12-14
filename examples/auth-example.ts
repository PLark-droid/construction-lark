/**
 * Lark Authentication Example
 *
 * Demonstrates how to use the LarkAuth module for authentication
 */

import { LarkAuth } from '../src/auth/index.js';

async function main() {
  console.log('==========================================');
  console.log('Lark OAuth Authentication Example');
  console.log('==========================================\n');

  // Initialize LarkAuth with your app credentials
  const auth = new LarkAuth({
    appId: process.env.LARK_APP_ID || 'your_app_id',
    appSecret: process.env.LARK_APP_SECRET || 'your_app_secret',
    // Optional: custom credentials path
    // credentialsPath: '/path/to/custom/credentials.json',
  });

  console.log('Credentials will be saved to:', auth.getCredentialsPath());
  console.log('');

  // Example 1: Check if already authenticated
  console.log('1. Checking authentication status...');
  const isAuthenticated = await auth.isAuthenticated();
  console.log(`   Authenticated: ${isAuthenticated ? 'Yes' : 'No'}`);
  console.log('');

  // Example 2: Get access token (auto-authenticates if needed)
  console.log('2. Getting access token...');
  try {
    const token = await auth.getAccessToken();
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log('   Token obtained successfully!');

    // Show credentials info
    const credentials = auth.getCredentials();
    if (credentials) {
      const expiresAt = new Date(credentials.expiresAt * 1000);
      console.log(`   Expires at: ${expiresAt.toISOString()}`);
      console.log(`   Updated at: ${credentials.updatedAt}`);
    }
  } catch (error) {
    console.error('   Error:', (error as Error).message);
  }
  console.log('');

  // Example 3: Manual authentication
  console.log('3. Manual authentication (refresh token)...');
  try {
    const token = await auth.authenticate();
    console.log(`   New token: ${token.substring(0, 20)}...`);
    console.log('   Authentication successful!');
  } catch (error) {
    console.error('   Error:', (error as Error).message);
  }
  console.log('');

  // Example 4: Use token with Lark API
  console.log('4. Using token with Lark API...');
  try {
    const token = await auth.getAccessToken();

    // Example: List tables in a Base
    const appToken = process.env.LARK_BASE_APP_TOKEN || 'your_base_token';

    const response = await fetch(
      `https://open.larksuite.com/open-apis/bitable/v1/apps/${appToken}/tables`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (data.code === 0) {
      console.log(`   Successfully accessed Lark API!`);
      console.log(`   Tables found: ${data.data?.items?.length || 0}`);
    } else {
      console.log(`   API response code: ${data.code}`);
      console.log(`   Message: ${data.msg}`);
    }
  } catch (error) {
    console.error('   Error:', (error as Error).message);
  }
  console.log('');

  // Example 5: Check authentication status again
  console.log('5. Checking authentication status again...');
  const isAuthenticatedNow = await auth.isAuthenticated();
  console.log(`   Authenticated: ${isAuthenticatedNow ? 'Yes' : 'No'}`);
  console.log('');

  // Example 6: Clear credentials (optional)
  // Uncomment to test clearing credentials
  /*
  console.log('6. Clearing credentials...');
  await auth.clearCredentials();
  console.log('   Credentials cleared!');
  console.log('');

  const isAuthenticatedAfterClear = await auth.isAuthenticated();
  console.log('   Authenticated after clear:', isAuthenticatedAfterClear ? 'Yes' : 'No');
  */

  console.log('==========================================');
  console.log('Example completed!');
  console.log('==========================================');
}

// Run the example
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
