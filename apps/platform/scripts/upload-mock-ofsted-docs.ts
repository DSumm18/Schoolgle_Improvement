#!/usr/bin/env npx tsx

/**
 * Upload Mock Ofsted Documents to Google Drive
 *
 * Usage: npx tsx apps/platform/scripts/upload-mock-ofsted-docs.ts
 *
 * Requires:
 * - Active Google Drive connection for the organization in ofsted_drive_connections
 * - NEXT_PUBLIC_APP_URL or defaults to http://localhost:3001
 */

import * as fs from 'fs';
import * as path from 'path';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
const ORG_ID = process.env.ORGANIZATION_ID || '';

const DOCS_DIR = path.resolve(__dirname, 'mock-ofsted-docs');

interface UploadResult {
  fileName: string;
  success: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

async function callDriveAPI(body: Record<string, unknown>) {
  const response = await fetch(`${API_BASE}/api/drive/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

async function main() {
  console.log('=== Mock Ofsted Document Uploader ===\n');

  if (!ORG_ID) {
    console.error('ERROR: Set ORGANIZATION_ID environment variable');
    console.error('Usage: ORGANIZATION_ID=xxx npx tsx apps/platform/scripts/upload-mock-ofsted-docs.ts');
    process.exit(1);
  }

  // 1. Read all documents
  const files = fs.readdirSync(DOCS_DIR)
    .filter(f => f.endsWith('.txt'))
    .sort();

  console.log(`Found ${files.length} documents to upload:\n`);
  files.forEach(f => console.log(`  - ${f}`));
  console.log();

  // 2. Create folder
  console.log('Creating folder "Schoolgle Mock Ofsted Evidence"...');
  const folderResult = await callDriveAPI({
    action: 'create_folder',
    organization_id: ORG_ID,
    folder_name: 'Schoolgle Mock Ofsted Evidence',
  });

  if (!folderResult.success) {
    console.error('Failed to create folder:', folderResult.error);
    process.exit(1);
  }

  const folderId = folderResult.data.id;
  console.log(`Folder created: ${folderId}\n`);

  // 3. Upload each document
  const results: UploadResult[] = [];

  for (const fileName of files) {
    const filePath = path.join(DOCS_DIR, fileName);
    const content = fs.readFileSync(filePath, 'utf-8');

    console.log(`Uploading: ${fileName} (${content.length} chars)...`);

    try {
      const uploadResult = await callDriveAPI({
        action: 'upload',
        organization_id: ORG_ID,
        file_name: fileName,
        content,
        mime_type: 'text/plain',
        folder_id: folderId,
      });

      if (uploadResult.success) {
        results.push({
          fileName,
          success: true,
          fileId: uploadResult.data.id,
          webViewLink: uploadResult.data.webViewLink,
        });
        console.log(`  ✓ Uploaded: ${uploadResult.data.id}`);
      } else {
        results.push({ fileName, success: false, error: uploadResult.error });
        console.log(`  ✗ Failed: ${uploadResult.error}`);
      }
    } catch (err: any) {
      results.push({ fileName, success: false, error: err.message });
      console.log(`  ✗ Error: ${err.message}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  // 4. Summary
  console.log('\n=== Upload Summary ===\n');
  console.log(`Folder: ${folderResult.data.webViewLink || folderId}`);
  console.log(`Total: ${results.length} | Success: ${results.filter(r => r.success).length} | Failed: ${results.filter(r => !r.success).length}\n`);

  results.forEach(r => {
    if (r.success) {
      console.log(`  ✓ ${r.fileName}`);
      console.log(`    ID: ${r.fileId}`);
      console.log(`    Link: ${r.webViewLink}`);
    } else {
      console.log(`  ✗ ${r.fileName}: ${r.error}`);
    }
  });

  // Output JSON for Notion posting
  console.log('\n=== JSON Output ===');
  console.log(JSON.stringify({
    folder: { id: folderId, link: folderResult.data.webViewLink },
    documents: results,
    uploadedAt: new Date().toISOString(),
  }, null, 2));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
