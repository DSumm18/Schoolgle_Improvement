/**
 * List Schoolgle Drive Folders (OAuth)
 *
 * Only lists folders within the "Schoolgle Drive" folder
 * This provides a clean demarcation - schools only connect this specific folder
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';

const SCHOOLGLE_DRIVE_FOLDER = 'Schoolgle Drive';

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get('organizationId');

  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
  }

  try {
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

    // First, find the "Schoolgle Drive" folder
    const searchQuery = `mimeType = "application/vnd.google-apps.folder" and name = "${SCHOOLGLE_DRIVE_FOLDER}" and trashed = false`;
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    if (!searchResponse.ok) {
      const errorBody = await searchResponse.text();
      console.error('Google Drive API error:', errorBody);
      throw new Error(`Google Drive API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const schoolgleDriveFolder = searchData.files?.[0];

    if (!schoolgleDriveFolder) {
      // No "Schoolgle Drive" folder found - return empty list with message
      return NextResponse.json({
        folders: [],
        schoolgleDriveMissing: true,
        message: `Please create a folder named "${SCHOOLGLE_DRIVE_FOLDER}" in your Google Drive and add any data folders you want to share inside it.`
      });
    }

    // List folders INSIDE the Schoolgle Drive folder
    const folderQuery = `'${schoolgleDriveFolder.id}' in parents and mimeType = "application/vnd.google-apps.folder" and trashed = false`;
    const foldersResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(folderQuery)}&fields=files(id,name,parents)&pageSize=100`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    if (!foldersResponse.ok) {
      const errorBody = await foldersResponse.text();
      console.error('Google Drive API error:', errorBody);
      throw new Error(`Google Drive API error: ${foldersResponse.status}`);
    }

    const foldersData = await foldersResponse.json();
    const folders = foldersData.files || [];

    return NextResponse.json({
      folders,
      schoolgleDriveFolder: {
        id: schoolgleDriveFolder.id,
        name: schoolgleDriveFolder.name
      }
    });
  } catch (error: any) {
    console.error('List folders error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list folders' },
      { status: 500 }
    );
  }
});
