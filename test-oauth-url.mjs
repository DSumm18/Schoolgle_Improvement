/**
 * Test OAuth URL Generation
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { generateAuthUrl, generateState, generateCodeVerifier } from './apps/platform/src/lib/oauth-config.ts';

// Load environment
const envContent = readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

console.log('Environment variables:');
console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID:', env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
console.log('GOOGLE_CLIENT_SECRET:', env.GOOGLE_CLIENT_SECRET?.substring(0, 10) + '...');
console.log('NEXT_PUBLIC_APP_URL:', env.NEXT_PUBLIC_APP_URL);
console.log('');

// Mock the OAUTH_CONFIG to check values
const clientId = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const clientSecret = env.GOOGLE_CLIENT_SECRET || '';
const redirectUri = `${env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/oauth/callback?provider=google`;

console.log('OAuth Config:');
console.log('client_id:', clientId);
console.log('client_secret set:', !!clientSecret);
console.log('redirect_uri:', redirectUri);
console.log('');

// Check if client ID is the placeholder
if (clientId.includes('your-google-client-id-here') || clientId.includes('placeholder')) {
  console.error('❌ ERROR: Client ID is still a placeholder!');
}

if (!clientId || !clientSecret) {
  console.error('❌ ERROR: Missing credentials!');
}

console.log('');
console.log('📋 Required Google Cloud Console settings:');
console.log('');
console.log('1. Authorized redirect URIs:');
console.log('   - ' + redirectUri);
console.log('   - https://www.schoolgle.co.uk/api/oauth/callback?provider=google');
console.log('');
console.log('2. OAuth consent screen:');
console.log('   - User Type: External or Internal');
console.log('   - Scopes: https://www.googleapis.com/auth/drive.readonly');
console.log('            https://www.googleapis.com/auth/userinfo.email');
