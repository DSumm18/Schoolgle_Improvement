/**
 * Browse Schoolgle Drive Folder (OAuth)
 *
 * ONLY lists files/folders within the "Schoolgle Drive" folder
 * This ensures we never access files outside this specific folder
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

const SCHOOLGLE_DRIVE_FOLDER = 'Schoolgle Drive';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  parents?: string[];
}

interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
  parent?: string;
}

/**
 * GET /api/data-connections/browse?organizationId=xxx&folderId=xxx
 *
 * Lists contents of a folder within Schoolgle Drive
 * - If no folderId specified, lists top-level folders in Schoolgle Drive
 * - Otherwise, lists contents of that specific subfolder
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get('organizationId');
  const folderId = searchParams.get('folderId'); // Optional: browse specific subfolder

  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Get OAuth token for this user/org
  const { data: tokenData, error: tokenError } = await supabase
    .rpc('get_active_oauth_token', {
      p_user_id: auth.userId,
      p_organization_id: organizationId,
      p_provider: 'google',
    });

  if (tokenError || !tokenData || tokenData.length === 0) {
    return NextResponse.json(
      { error: 'No OAuth token found. Please connect your Google account first.' },
      { status: 401 }
    );
  }

  const { access_token } = tokenData[0];

  try {
    // First, get the stored Schoolgle Drive folder ID from the connection
    const { data: connection } = await supabase
      .from('school_data_connections')
      .select('folder_id, folder_name, metadata')
      .eq('organization_id', organizationId)
      .eq('provider', 'google')
      .eq('is_active', true)
      .single();

    if (!connection) {
      return NextResponse.json(
        { error: 'No active connection found. Please connect your account first.' },
        { status: 404 }
      );
    }

    const schoolgleDriveFolderId = connection.folder_id;

    // If browsing a specific subfolder, verify it's within Schoolgle Drive
    let targetFolderId = schoolgleDriveFolderId;
    let currentPath = [{ id: schoolgleDriveFolderId, name: connection.folder_name || SCHOOLGLE_DRIVE_FOLDER }];

    if (folderId) {
      // Verify the folder is within Schoolgle Drive by checking its ancestry
      const isWithinScope = await verifyFolderWithinScope(access_token, folderId, schoolgleDriveFolderId);
      if (!isWithinScope) {
        return NextResponse.json(
          { error: 'Access denied: This folder is outside the Schoolgle Drive scope.' },
          { status: 403 }
        );
      }
      targetFolderId = folderId;

      // Build breadcrumb path (fetch parent hierarchy)
      currentPath = await buildFolderPath(access_token, folderId, schoolgleDriveFolderId);
    }

    // List contents of the target folder
    const items = await listFolderContents(access_token, targetFolderId);

    // Separate folders and files
    const folders = items.filter(item => item.mimeType === 'application/vnd.google-apps.folder');
    const files = items.filter(item => item.mimeType !== 'application/vnd.google-apps.folder');

    return NextResponse.json({
      currentFolder: {
        id: targetFolderId,
        name: currentPath[currentPath.length - 1]?.name || SCHOOLGLE_DRIVE_FOLDER,
      },
      path: currentPath,
      folders: folders.map(f => ({
        id: f.id,
        name: f.name,
        modifiedTime: f.modifiedTime,
      })),
      files: files.map(f => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
        modifiedTime: f.modifiedTime,
        type: getFileType(f.mimeType),
      })),
      scope: {
        limited: true,
        description: 'Only accessing files within "Schoolgle Drive" folder',
        rootFolder: connection.folder_name || SCHOOLGLE_DRIVE_FOLDER,
      },
    });
  } catch (error: any) {
    console.error('Browse folder error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to browse folder' },
      { status: 500 }
    );
  }
});

/**
 * Verify a folder is within the Schoolgle Drive folder
 */
async function verifyFolderWithinScope(
  accessToken: string,
  folderId: string,
  rootFolderId: string
): Promise<boolean> {
  try {
    // Get folder's parents
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?fields=parents`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) return false;

    const data = await res.json();
    const parents = data.parents || [];

    // Direct child of root?
    if (parents.includes(rootFolderId)) return true;

    // Check if any ancestor is the root folder
    for (const parentId of parents) {
      if (await verifyFolderWithinScope(accessToken, parentId, rootFolderId)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Build breadcrumb path from root to current folder
 */
async function buildFolderPath(
  accessToken: string,
  folderId: string,
  rootFolderId: string,
  visited = new Set<string>()
): Promise<Array<{ id: string; name: string }>> {
  if (visited.has(folderId)) return [];
  visited.add(folderId);

  // Get folder metadata
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,parents`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return [];

  const folder = await res.json();
  const parents = folder.parents || [];

  // If we've reached the root, return
  if (folder.id === rootFolderId || parents.length === 0) {
    return [{ id: folder.id, name: folder.name }];
  }

  // Recursively build path
  const parentPath = await buildFolderPath(accessToken, parents[0], rootFolderId, visited);
  return [...parentPath, { id: folder.id, name: folder.name }];
}

/**
 * List contents of a folder
 */
async function listFolderContents(
  accessToken: string,
  folderId: string
): Promise<DriveFile[]> {
  const query = `'${folderId}' in parents and trashed = false`;
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime,size,parents)&pageSize=100&orderBy=name`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return [];

  const data = await res.json();
  return data.files || [];
}

/**
 * Categorize file type for display
 */
function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('text')) return 'document';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint') || mimeType.includes('slides')) return 'presentation';
  return 'file';
}
