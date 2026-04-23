/**
 * Verify OAuth Connection
 *
 * Checks if Google Drive OAuth connection is working
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ygquvauptwyvlhkyxkwy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncXV2YXVwdHd5dmxoa3l4a3d5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk2MTA1NCwiZXhwIjoyMDc5NTM3MDU0fQ.SniWiVIv7QAF_medPRZiamHSRpgCy1N53LGDpQf6TwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkOAuthConnection() {
  console.log('=== Checking OAuth Connection ===\n');

  // Get all OAuth tokens
  const { data: tokens, error } = await supabase
    .from('oauth_tokens')
    .select('*')
    .order('connected_at', { ascending: false });

  if (error) {
    console.log('✗ Error checking tokens:', error.message);
    return;
  }

  if (!tokens || tokens.length === 0) {
    console.log('✗ No OAuth connections found');
    console.log('\nYou need to:');
    console.log('1. Complete the OAuth setup (see QUICK_START_GOOGLE_OAUTH.md)');
    console.log('2. Click "Connect Google Drive" in the app');
    console.log('3. Authorize the connection');
    return;
  }

  console.log(`✅ Found ${tokens.length} OAuth connection(s):\n`);

  tokens.forEach((token, i) => {
    console.log(`Connection ${i + 1}:`);
    console.log(`  Provider: ${token.provider}`);
    console.log(`  User ID: ${token.user_id}`);
    console.log(`  Organization: ${token.organization_id}`);
    console.log(`  Provider Email: ${token.provider_email || 'N/A'}`);
    console.log(`  Connected: ${token.connected_at}`);
    console.log(`  Active: ${token.is_active ? 'Yes' : 'No'}`);
    console.log(`  Expires: ${token.token_expires_at || 'N/A'}`);
    console.log(`  Scopes: ${token.scopes?.join(', ') || 'N/A'}`);

    // Check if token is expired
    if (token.token_expires_at) {
      const expiresAt = new Date(token.token_expires_at);
      const now = new Date();
      const isExpired = expiresAt < now;
      console.log(`  Status: ${isExpired ? '⚠️ EXPIRED' : '✅ Valid'}`);

      if (isExpired) {
        console.log(`  ⚠️ Token expired on ${expiresAt.toLocaleString()}`);
        console.log(`  💡 The app should auto-refresh this token`);
      }
    }
  });

  console.log('\n=== Verification Complete ===\n');

  // Check if we can decrypt a token
  if (tokens && tokens.length > 0) {
    console.log('Testing token decryption...');
    const { data: decrypted, error: decryptError } = await supabase
      .rpc('decrypt_token', { data: tokens[0].access_token_encrypted });

    if (decryptError) {
      console.log('✗ Decryption failed:', decryptError.message);
      console.log('  This means the pgcrypto functions might not be set up yet.');
      console.log('  Solution: Run the migration: 20260326_oauth_tokens.sql');
    } else {
      console.log('✅ Token decryption working');
      console.log(`  Token preview: ${decrypted.substring(0, 20)}...`);
    }
  }
}

checkOAuthConnection().catch(console.error);
