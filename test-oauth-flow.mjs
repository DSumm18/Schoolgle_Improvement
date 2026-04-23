/**
 * Test OAuth Flow for Google Drive Connection
 *
 * This script simulates the OAuth flow for connecting Google Drive
 * to Grove House Primary School.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables
const envContent = readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const GROVE_HOUSE_ORG_ID = 'd9d1ac2c-5eff-4043-98f4-e1c43f616fd3';

async function testOAuthFlow() {
  console.log('🔐 Testing Google Drive OAuth Flow\n');
  console.log('Target: Grove House Primary School');
  console.log('Org ID:', GROVE_HOUSE_ORG_ID);
  console.log('');

  // Step 1: Check existing connections
  console.log('1️⃣ Checking existing connections...');
  const { data: existingConnections, error: connError } = await supabase
    .from('school_data_connections')
    .select('*')
    .eq('organization_id', GROVE_HOUSE_ORG_ID);

  if (connError) {
    console.error('  ❌ Error checking connections:', connError.message);
  } else {
    console.log(`  ✅ Found ${existingConnections.length} existing connection(s)`);
    existingConnections.forEach(conn => {
      console.log(`     - ${conn.provider}: ${conn.folder_name} (${conn.is_active ? 'active' : 'inactive'})`);
    });
  }
  console.log('');

  // Step 2: Check OAuth tokens
  console.log('2️⃣ Checking OAuth tokens...');
  const { data: oauthTokens, error: tokenError } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('organization_id', GROVE_HOUSE_ORG_ID)
    .eq('provider', 'google');

  if (tokenError) {
    console.error('  ❌ Error checking tokens:', tokenError.message);
  } else {
    console.log(`  ✅ Found ${oauthTokens.length} OAuth token(s)`);
    oauthTokens.forEach(token => {
      console.log(`     - User: ${token.provider_email}`);
      console.log(`     - Active: ${token.is_active}`);
      console.log(`     - Expires: ${token.token_expires_at}`);
    });
  }
  console.log('');

  // Step 3: Test OAuth authorize endpoint
  console.log('3️⃣ Testing OAuth authorize endpoint...');
  try {
    const authResponse = await fetch('http://localhost:3000/api/oauth/authorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'google',
        organizationId: GROVE_HOUSE_ORG_ID,
      }),
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('  ✅ OAuth authorize endpoint working');
      console.log(`     Auth URL length: ${authData.authorizationUrl?.length || 0} chars`);
      console.log(`     State: ${authData.state || 'none'}`);
    } else {
      console.error('  ❌ OAuth authorize failed:', await authResponse.text());
    }
  } catch (e) {
    console.error('  ❌ OAuth authorize error:', e.message);
  }
  console.log('');

  // Step 4: List folders endpoint (requires valid OAuth token)
  console.log('4️⃣ Testing list-folders endpoint...');
  try {
    const foldersResponse = await fetch(
      `http://localhost:3000/api/data-connections/list-folders?organizationId=${GROVE_HOUSE_ORG_ID}`
    );

    if (foldersResponse.ok) {
      const foldersData = await foldersResponse.json();
      console.log('  ✅ List folders endpoint working');
      console.log(`     Found ${foldersData.folders?.length || 0} folders`);
    } else {
      const errorText = await foldersResponse.text();
      console.error('  ❌ List folders failed:', foldersResponse.status, errorText.slice(0, 100));
    }
  } catch (e) {
    console.error('  ❌ List folders error:', e.message);
  }
  console.log('');

  // Step 5: Check data connections endpoint
  console.log('5️⃣ Testing data-connections endpoint...');
  try {
    const connResponse = await fetch(
      `http://localhost:3000/api/data-connections?organizationId=${GROVE_HOUSE_ORG_ID}`
    );

    if (connResponse.ok) {
      const connData = await connResponse.json();
      console.log('  ✅ Data connections endpoint working');
      console.log(`     Found ${connData.connections?.length || 0} connection(s)`);
    } else {
      console.error('  ❌ Data connections failed:', await connResponse.text());
    }
  } catch (e) {
    console.error('  ❌ Data connections error:', e.message);
  }
  console.log('');

  console.log('✅ OAuth flow test complete!');
  console.log('');
  console.log('📝 Next steps:');
  console.log('   1. Navigate to http://localhost:3000/settings/data-connections');
  console.log('   2. Click "Connect Google Drive"');
  console.log('   3. Complete OAuth flow in Google popup');
  console.log('   4. Verify connection appears in the UI');
}

testOAuthFlow().catch(console.error);
