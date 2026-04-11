#!/usr/bin/env npx tsx

/**
 * Direct Upload of Mock Ofsted Documents to Google Drive
 *
 * This script:
 * 1. Opens a local HTTP server to handle OAuth callback
 * 2. Opens browser for Google consent
 * 3. Creates a "Schoolgle Mock Ofsted Evidence" folder
 * 4. Uploads all 8 mock documents
 * 5. Stores the refresh token in Supabase for future use
 *
 * Usage: npx tsx apps/platform/scripts/upload-mock-ofsted-direct.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { exec } from 'child_process';

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const CLIENT_ID = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET || env.GOOGLE_DRIVE_CLIENT_SECRET;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const ORG_ID = 'c64ed86b-9eab-49ee-9829-0706ff371083';
const REDIRECT_URI = 'http://localhost:9876/callback';
const DOCS_DIR = path.resolve(__dirname, 'mock-ofsted-docs');

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing Google OAuth credentials in .env.local');
  process.exit(1);
}

interface DriveFile {
  id: string;
  name: string;
  webViewLink?: string;
}

async function getAccessTokenViaOAuth(): Promise<{ access_token: string; refresh_token: string }> {
  return new Promise((resolve, reject) => {
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
    ];
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scopes.join(' '))}` +
      `&access_type=offline` +
      `&prompt=consent`;

    const server = http.createServer(async (req, res) => {
      if (!req.url?.startsWith('/callback')) return;

      const url = new URL(req.url, `http://localhost:9876`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error || !code) {
        res.writeHead(400);
        res.end('Auth failed: ' + (error || 'no code'));
        server.close();
        reject(new Error('Auth failed'));
        return;
      }

      // Exchange code for token
      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: CLIENT_ID!,
            client_secret: CLIENT_SECRET!,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
          }),
        });

        if (!tokenRes.ok) {
          const err = await tokenRes.text();
          throw new Error(`Token exchange failed: ${err}`);
        }

        const tokenData = await tokenRes.json();
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Auth successful! You can close this tab.</h1><script>window.close()</script>');
        server.close();
        resolve({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
        });
      } catch (err) {
        res.writeHead(500);
        res.end('Token exchange failed');
        server.close();
        reject(err);
      }
    });

    server.listen(9876, () => {
      console.log('Opening browser for Google Drive authorization...');
      console.log(`If browser doesn't open, visit:\n${authUrl}\n`);
      exec(`open "${authUrl}"`);
    });

    // Timeout after 2 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('OAuth timeout - no callback received within 2 minutes'));
    }, 120000);
  });
}

async function createFolder(accessToken: string, folderName: string, parentId?: string): Promise<DriveFile> {
  const metadata: Record<string, unknown> = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) metadata.parents = [parentId];

  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) throw new Error(`Create folder failed: ${await res.text()}`);
  return res.json();
}

async function uploadFile(accessToken: string, fileName: string, content: string, folderId: string): Promise<DriveFile> {
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const boundary = '----FormBoundary' + Date.now();
  const body = Buffer.concat([
    Buffer.from(
      `\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n--${boundary}\r\nContent-Type: text/plain\r\n\r\n`
    ),
    Buffer.from(content, 'utf-8'),
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  return res.json();
}

async function storeTokenInSupabase(accessToken: string, refreshToken: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('  (Skipping Supabase token storage - no credentials)');
    return;
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/ofsted_drive_connections?organization_id=eq.${ORG_ID}&provider=eq.google`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      access_token_encrypted: accessToken,
      refresh_token_encrypted: refreshToken,
      token_expiry: new Date(Date.now() + 3600 * 1000).toISOString(),
    }),
  });

  if (res.ok) {
    console.log('  Tokens stored in Supabase for future use');
  } else {
    console.log('  Warning: Failed to store tokens:', await res.text());
  }
}

async function main() {
  console.log('=== Mock Ofsted Document Uploader (Direct) ===\n');

  // 1. Get OAuth token
  console.log('Step 1: Authenticating with Google Drive...');
  const { access_token, refresh_token } = await getAccessTokenViaOAuth();
  console.log('Authenticated successfully!\n');

  // Store tokens for future use
  console.log('Storing tokens for future API use...');
  await storeTokenInSupabase(access_token, refresh_token);
  console.log();

  // 2. Read documents
  const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.txt')).sort();
  console.log(`Step 2: Found ${files.length} documents to upload:`);
  files.forEach(f => console.log(`  - ${f}`));
  console.log();

  // 3. Create folder
  console.log('Step 3: Creating folder "Schoolgle Mock Ofsted Evidence"...');
  const folder = await createFolder(access_token, 'Schoolgle Mock Ofsted Evidence');
  console.log(`  Folder created: ${folder.id}`);
  console.log(`  Link: ${folder.webViewLink}\n`);

  // 4. Upload each document
  console.log('Step 4: Uploading documents...\n');
  const results: Array<{ fileName: string; id: string; link: string }> = [];

  for (const fileName of files) {
    const content = fs.readFileSync(path.join(DOCS_DIR, fileName), 'utf-8');
    process.stdout.write(`  Uploading ${fileName}... `);

    const uploaded = await uploadFile(access_token, fileName, content, folder.id);
    results.push({ fileName, id: uploaded.id, link: uploaded.webViewLink || '' });
    console.log(`Done (${uploaded.id})`);

    // Small delay
    await new Promise(r => setTimeout(r, 300));
  }

  // 5. Summary
  console.log('\n=== UPLOAD COMPLETE ===\n');
  console.log(`Folder: ${folder.webViewLink}`);
  console.log(`Documents uploaded: ${results.length}/8\n`);

  results.forEach(r => {
    console.log(`  ${r.fileName}`);
    console.log(`    ID: ${r.id}`);
    console.log(`    Link: ${r.link}`);
  });

  // JSON output for Notion
  const output = {
    folder: { id: folder.id, name: 'Schoolgle Mock Ofsted Evidence', link: folder.webViewLink },
    documents: results,
    uploadedAt: new Date().toISOString(),
    organizationId: ORG_ID,
  };

  console.log('\n=== JSON ===');
  console.log(JSON.stringify(output, null, 2));

  // Write output to a file for reference
  const outputPath = path.resolve(__dirname, 'upload-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\nResults saved to: ${outputPath}`);
}

main().catch(err => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
