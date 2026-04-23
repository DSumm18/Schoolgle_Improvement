/**
 * Test the OAuth authorize endpoint to see what URL it generates
 */

async function testOAuthEndpoint() {
  const TEST_ORG_ID = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3'; // Grove House

  // First, we need to get a session token
  // This requires logging in, so let's check what the OAuth URL looks like
  // by manually constructing it

  const clientId = '982985229064-q626gq0ikjvtca9j0p10ffck4ke8qdvq.apps.googleusercontent.com';
  const redirectUri = 'http://localhost:3000/api/oauth/callback?provider=google';
  const scope = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email';
  const responseType = 'code';
  const state = 'test-state-123';
  const codeChallenge = 'test-challenge'; // Would be SHA-256 of verifier
  const codeChallengeMethod = 'S256';

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `response_type=${encodeURIComponent(responseType)}&` +
    `state=${encodeURIComponent(state)}&` +
    `code_challenge=${encodeURIComponent(codeChallenge)}&` +
    `code_challenge_method=${encodeURIComponent(codeChallengeMethod)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  console.log('=== Generated OAuth Authorization URL ===');
  console.log('');
  console.log(authUrl);
  console.log('');
  console.log('=== Things to check in Google Cloud Console ===');
  console.log('');
  console.log('1. OAuth consent screen:');
  console.log('   - Go to: https://console.cloud.google.com/apis/credentials/consent');
  console.log('   - Make sure consent screen is configured');
  console.log('   - Check if it\'s in "Testing" mode - if so, add your test user email');
  console.log('');
  console.log('2. OAuth 2.0 Client ID:');
  console.log('   - Go to: https://console.cloud.google.com/apis/credentials');
  console.log('   - Click the OAuth 2.0 Client ID');
  console.log('   - Verify Authorized redirect URIs includes:');
  console.log('     ' + redirectUri);
  console.log('');
  console.log('3. Try opening the URL above directly in a browser');
  console.log('   If you see "invalid_client", the issue is with the client configuration');
  console.log('   If you see the consent screen, the OAuth setup is correct');
}

testOAuthEndpoint();
