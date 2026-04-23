/**
 * Folder Link Diagnostic
 *
 * Paste your Google Drive folder link here to diagnose the issue
 */

// Test different folder link formats
const testLinks = [
  'https://drive.google.com/drive/folders/14QgdEXLctas5g2RkqXR9wQXvXkf3nZo8',
  'https://drive.google.com/open?id=14QgdEXLctas5g2RkqXR9wQXvXkf3nZo8',
  'https://drive.google.com/file/d/14QgdEXLctas5g2RkqXR9wQXvXkf3nZo8/view',
  '14QgdEXLctas5g2RkqXR9wQXvXkf3nZo8', // Raw ID
];

function extractFolderId(input) {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function extractFolderIdImproved(input) {
  const trimmed = input.trim();

  // Raw folder ID
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;

  // Format: https://drive.google.com/drive/folders/XXXXX
  const foldersMatch = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (foldersMatch) return foldersMatch[1];

  // Format: https://drive.google.com/open?id=XXXXX
  const openMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return openMatch[1];

  // Format: https://drive.google.com/file/d/XXXXX/view
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return fileMatch[1];

  return null;
}

console.log('=== Folder Link Diagnostic ===\n');

console.log('Testing extractFolderId function (current):');
testLinks.forEach(link => {
  const extracted = extractFolderId(link);
  console.log(`Link: ${link}`);
  console.log(`Extracted: ${extracted || 'NULL'} ✓`);
});

console.log('\nTesting extractFolderIdImproved function:');
testLinks.forEach(link => {
  const extracted = extractFolderIdImproved(link);
  console.log(`Link: ${link}`);
  console.log(`Extracted: ${extracted || 'NULL'} ✓`);
});

console.log('\n=== Your Folder Link ===');
console.log('Paste your folder link between the quotes below:');

const YOUR_LINK = ''; // PASTE HERE

if (YOUR_LINK) {
  console.log('\nYour link:', YOUR_LINK);
  console.log('Current function:', extractFolderId(YOUR_LINK) || 'FAILED');
  console.log('Improved function:', extractFolderIdImproved(YOUR_LINK) || 'FAILED');

  // Test if it works with Google API
  const GOOGLE_API_KEY = 'AIzaSyCiKd34mTRiNGLXFIXtQJqeiasaXd-Alys';
  const folderId = extractFolderIdImproved(YOUR_LINK);

  if (folderId) {
    console.log('\nTesting with Google Drive API...');
    fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?key=${GOOGLE_API_KEY}&fields=id,name,mimeType,shared&supportsAllDrives=true`
    )
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.log('✗ API Error:', data.error.message);
          console.log('  Reason:', data.error.errors?.[0]?.reason);

          if (data.error.message.includes('File not found')) {
            console.log('\n⚠️ POSSIBLE ISSUES:');
            console.log('1. Folder ID is incorrect');
            console.log('2. Folder does not exist');
            console.log('3. Folder is deleted');
          }
          if (data.error.message.includes('not found')) {
            console.log('\n⚠️ SHARING ISSUE:');
            console.log('The folder exists but is NOT shared as "Anyone with the link"');
            console.log('Fix: Right-click folder → Share → "Anyone with the link" → Viewer');
          }
        } else {
          console.log('✓ SUCCESS!');
          console.log('  Folder:', data.name);
          console.log('  Type:', data.mimeType);
          console.log('  Shared:', data.shared);
        }
      });
  }
}

console.log('\n=== Complete ===\n');
