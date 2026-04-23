/**
 * OAuth Callback Handler
 *
 * Handles OAuth callbacks from Google and Microsoft
 * Exchanges authorization code for tokens and stores them
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  exchangeCodeForToken,
  validateState,
  type OAuthProvider,
} from '@/lib/oauth-config';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider') as OAuthProvider;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/data-connections?oauth_error=${error}`
      );
    }

    // Validate required parameters
    if (!provider || !code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/data-connections?oauth_error=missing_params`
      );
    }

    // Get state and verifier from cookies
    const savedState = req.cookies.get(`oauth_state_${provider}`)?.value;
    const codeVerifier = req.cookies.get(`oauth_verifier_${provider}`)?.value;

    // Debug logging
    console.log('[OAuth Callback] Provider:', provider);
    console.log('[OAuth Callback] Received state:', state);
    console.log('[OAuth Callback] Saved state from cookie:', savedState);
    console.log('[OAuth Callback] Code verifier exists:', !!codeVerifier);

    if (!savedState || !codeVerifier) {
      console.error('[OAuth Callback] Missing cookies - savedState:', savedState, 'codeVerifier:', !!codeVerifier);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/data-connections?oauth_error=missing_state`
      );
    }

    // Validate state to prevent CSRF
    if (!validateState(state, savedState)) {
      console.error('[OAuth Callback] State mismatch - received:', state, 'expected:', savedState);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/data-connections?oauth_error=invalid_state`
      );
    }

    console.log('[OAuth Callback] State validated successfully');

    // Extract organization ID from state
    const [stateStr, organizationId] = state.split(':');

    // Exchange code for tokens
    const tokens = await exchangeCodeForToken(provider, code, codeVerifier);

    // Get user info from provider
    let userInfo = null;
    try {
      const config = provider === 'google'
        ? {
            userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
          }
        : {
            userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
          };

      const userResponse = await fetch(config.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (userResponse.ok) {
        userInfo = await userResponse.json();
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
    }

    // Store tokens in database (encrypted)
    const supabase = createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?oauth_callback=true`
      );
    }

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + (tokens.expires_in || 3600) * 1000);

    // Encrypt and store tokens using pgcrypto function
    const { data: tokenData, error: tokenError } = await supabase
      .rpc('encrypt_token', { data: tokens.access_token });

    if (tokenError) {
      throw new Error(`Failed to encrypt access token: ${tokenError.message}`);
    }

    const { data: refreshData, error: refreshError } = tokens.refresh_token
      ? await supabase.rpc('encrypt_token', { data: tokens.refresh_token })
      : { data: null };

    if (refreshError) {
      throw new Error(`Failed to encrypt refresh token: ${refreshError.message}`);
    }

    // Store or update token
    const { error: upsertError } = await supabase
      .from('oauth_tokens')
      .upsert({
        user_id: user.id,
        organization_id,
        provider,
        access_token_encrypted: tokenData,
        refresh_token_encrypted: refreshData,
        token_expires_at: expiresAt.toISOString(),
        provider_user_id: userInfo?.id || null,
        provider_email: userInfo?.email || null,
        scopes: tokens.scope?.split(' ') || [],
        is_active: true,
        connected_at: new Date().toISOString(),
        last_refreshed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,organization_id,provider'
      });

    if (upsertError) {
      throw upsertError;
    }

    // For Google Drive, find/create "Schoolgle Drive" and set up folder structure
    if (provider === 'google') {
      try {
        const SCHOOLGLE_DRIVE_FOLDER = 'Schoolgle Drive';
        const accessToken = tokens.access_token;

        // Helper function to create a folder
        async function createFolder(name: string, parentId: string): Promise<string | null> {
          const response = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [parentId],
            }),
          });

          if (!response.ok) {
            console.error(`[OAuth] Failed to create folder "${name}":`, await response.text());
            return null;
          }

          const folder = await response.json();
          console.log(`[OAuth] Created folder: ${name} (${folder.id})`);
          return folder.id;
        }

        // Helper function to create a test file
        async function createTestFile(name: string, content: string, parentId: string): Promise<boolean> {
          // Create a Google Doc for the test file
          const response = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name,
              mimeType: 'application/vnd.google-apps.document',
              parents: [parentId],
            }),
          });

          if (!response.ok) {
            console.error(`[OAuth] Failed to create test file:`, await response.text());
            return false;
          }

          const file = await response.json();

          // Now add the content to the document
          const contentResponse = await fetch(
            `https://docs.googleapis.com/v1/documents/${file.id}:batchUpdate`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                requests: [
                  {
                    insertText: {
                      location: { index: 1 },
                      text: content,
                    },
                  },
                ],
              }),
            }
          );

          if (contentResponse.ok) {
            console.log(`[OAuth] Created test file: ${name} (${file.id})`);
            return true;
          }

          return false;
        }

        // Search for "Schoolgle Drive" folder by name
        const searchQuery = `mimeType = "application/vnd.google-apps.folder" and name = "${SCHOOLGLE_DRIVE_FOLDER}" and trashed = false`;
        const searchResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name,parents)&pageSize=1`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        let schoolgleDriveFolder: { id: string; name: string; parents?: string[] } | null = null;
        let isExistingFolder = false;

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          schoolgleDriveFolder = searchData.files?.[0] || null;
          isExistingFolder = !!schoolgleDriveFolder;
        }

        // If "Schoolgle Drive" folder doesn't exist, create it
        if (!schoolgleDriveFolder) {
          console.log('[OAuth] Schoolgle Drive folder not found, creating it...');

          // Get the user's root folder ID first
          const aboutResponse = await fetch('https://www.googleapis.com/drive/v3/about?fields=rootFolderId', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          let rootFolderId = 'root';
          if (aboutResponse.ok) {
            const aboutData = await aboutResponse.json();
            rootFolderId = aboutData.rootFolderId || 'root';
          }

          const createdId = await createFolder(SCHOOLGLE_DRIVE_FOLDER, rootFolderId);
          if (createdId) {
            schoolgleDriveFolder = {
              id: createdId,
              name: SCHOOLGLE_DRIVE_FOLDER,
              parents: [rootFolderId],
            };
          }
        } else {
          console.log('[OAuth] Found existing Schoolgle Drive folder:', schoolgleDriveFolder.id);
        }

        // Create folder structure if folder exists
        if (schoolgleDriveFolder) {
          const foldersToCreate = [
            { name: '01 Census Reports', description: 'DfE census returns, validation reports' },
            { name: '02 Pupil Data', subfolders: ['Admissions', 'Attendance', 'Assessments', 'SEN Register', 'Pupil Premium'] },
            { name: '03 Staff Records', subfolders: ['HR Records', 'Training (CPD)', 'DBS Checks (SCR)'] },
            { name: '04 Finance', subfolders: ['Budgets', 'Payroll', 'Purchasing'] },
            { name: '05 Governance', subfolders: ['Board Meetings', 'Policies', 'Risk Register'] },
            { name: '06 Safeguarding', description: 'Child protection, DSL records, LAC' },
            { name: '07 Estates & Facilities', subfolders: ['Health and Safety', 'Premises', 'Asset Register'] },
            { name: '08 Compliance', description: 'GDPR, data protection, FOI requests' },
            { name: '09 Ofsted Evidence', description: 'Evidence mapped to Ofsted framework' },
          ];

          let totalFoldersCreated = 0;
          let firstSubfolderId: string | null = null;

          // Create all folders
          for (const folder of foldersToCreate) {
            const subfolderId = await createFolder(folder.name, schoolgleDriveFolder!.id);
            if (subfolderId) {
              totalFoldersCreated++;

              // Create subfolders if defined
              if (folder.subfolders) {
                for (const sub of folder.subfolders) {
                  await createFolder(sub, subfolderId);
                  totalFoldersCreated++;
                }
              }

              // Store first subfolder ID for test file creation
              if (!firstSubfolderId && subfolderId) {
                firstSubfolderId = subfolderId;
              }
            }
          }

          // Create a test file in the first folder to verify connection
          if (firstSubfolderId) {
            const testFileName = 'Schoolgle Connection Test';
            const testFileContent = `# Schoolgle Connection Test

This file confirms that your Schoolgle Drive connection is working correctly!

## Connection Details
- Connected: ${new Date().toISOString()}
- Provider: Google Drive
- Status: ✅ Connection Active

## What's Next?

You can now:
1. Add your school's documents to the appropriate folders
2. Schoolgle will automatically detect and organize your data
3. Go to Settings > Data Connections to view your connected folders

## Folder Structure Created

We've created ${totalFoldersCreated} folders for you:
- 01 Census Reports
- 02 Pupil Data (with subfolders)
- 03 Staff Records (with subfolders)
- 04 Finance (with subfolders)
- 05 Governance (with subfolders)
- 06 Safeguarding
- 07 Estates & Facilities (with subfolders)
- 08 Compliance
- 09 Ofsted Evidence

You can delete this file once you've confirmed your connection is working.

---
Need help? Contact support@schoolgle.co.uk
`;

            await createTestFile(testFileName, testFileContent, firstSubfolderId);
          }

          // Create or update school_data_connections record
          const { error: connError } = await supabase
            .from('school_data_connections')
            .upsert({
              organization_id,
              provider: 'google',
              folder_id: schoolgleDriveFolder.id,
              folder_name: schoolgleDriveFolder.name,
              connected_by: user.id,
              is_active: true,
              connected_at: new Date().toISOString(),
              scan_status: 'idle',
              detected_folders: {},
              total_files: 1, // We created 1 test file
              total_folders: totalFoldersCreated + 1, // Created folders + Schoolgle Drive root
            }, {
              onConflict: 'organization_id,provider'
            });

          if (connError) {
            console.error('Failed to create school_data_connections record:', connError);
          } else {
            console.log('[OAuth] Schoolgle Drive connection established:', {
              organization_id: organizationId,
              folder_id: schoolgleDriveFolder.id,
              folder_name: schoolgleDriveFolder.name,
              folders_created: totalFoldersCreated,
              was_existing: isExistingFolder,
            });
          }
        }
      } catch (driveError) {
        console.error('Failed to setup Schoolgle Drive folder:', driveError);
      }
    }

    // For Microsoft OneDrive, create similar folder structure
    if (provider === 'microsoft') {
      try {
        const SCHOOLGLE_DRIVE_FOLDER = 'Schoolgle Drive';
        const accessToken = tokens.access_token;

        // Helper function to create a folder in OneDrive
        async function createOneDriveFolder(name: string, parentId: string = '/drive/root'): Promise<string | null> {
          const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${parentId}/children`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name,
                folder: {},
                '@microsoft.graph.conflictBehavior': 'rename',
              }),
            }
          );

          if (!response.ok) {
            console.error(`[OAuth] Failed to create OneDrive folder "${name}":`, await response.text());
            return null;
          }

          const folder = await response.json();
          console.log(`[OAuth] Created OneDrive folder: ${name} (${folder.id})`);
          return folder.id;
        }

        // Helper function to create a test file in OneDrive
        async function createOneDriveTestFile(name: string, content: string, parentId: string): Promise<boolean> {
          const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/drive/items/${parentId}:/${encodeURIComponent(name)}:/content`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'text/plain',
              },
              body: content,
            }
          );

          if (response.ok) {
            console.log(`[OAuth] Created OneDrive test file: ${name}`);
            return true;
          }

          console.error(`[OAuth] Failed to create test file:`, await response.text());
          return false;
        }

        // Search for existing Schoolgle Drive folder
        const searchResponse = await fetch(
          `https://graph.microsoft.com/v1.0/me/drive/root/search(q='${SCHOOLGLE_DRIVE_FOLDER}')`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        let schoolgleDriveFolder: { id: string; name: string } | null = null;

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          schoolgleDriveFolder = searchData.value?.find((f: any) =>
            f.name === SCHOOLGLE_DRIVE_FOLDER && f.folder
          ) || null;
        }

        // Create folder if it doesn't exist
        if (!schoolgleDriveFolder) {
          console.log('[OAuth] Schoolgle Drive folder not found in OneDrive, creating it...');
          const createdId = await createOneDriveFolder(SCHOOLGLE_DRIVE_FOLDER);
          if (createdId) {
            schoolgleDriveFolder = { id: createdId, name: SCHOOLGLE_DRIVE_FOLDER };
          }
        } else {
          console.log('[OAuth] Found existing Schoolgle Drive folder in OneDrive:', schoolgleDriveFolder.id);
        }

        // Create folder structure
        if (schoolgleDriveFolder) {
          const foldersToCreate = [
            { name: '01 Census Reports' },
            { name: '02 Pupil Data', subfolders: ['Admissions', 'Attendance', 'Assessments', 'SEN Register', 'Pupil Premium'] },
            { name: '03 Staff Records', subfolders: ['HR Records', 'Training (CPD)', 'DBS Checks (SCR)'] },
            { name: '04 Finance', subfolders: ['Budgets', 'Payroll', 'Purchasing'] },
            { name: '05 Governance', subfolders: ['Board Meetings', 'Policies', 'Risk Register'] },
            { name: '06 Safeguarding' },
            { name: '07 Estates & Facilities', subfolders: ['Health and Safety', 'Premises', 'Asset Register'] },
            { name: '08 Compliance' },
            { name: '09 Ofsted Evidence' },
          ];

          let totalFoldersCreated = 0;
          let firstSubfolderId: string | null = null;

          for (const folder of foldersToCreate) {
            const subfolderId = await createOneDriveFolder(folder.name, schoolgleDriveFolder!.id);
            if (subfolderId) {
              totalFoldersCreated++;

              if (folder.subfolders) {
                for (const sub of folder.subfolders) {
                  await createOneDriveFolder(sub, subfolderId);
                  totalFoldersCreated++;
                }
              }

              if (!firstSubfolderId && subfolderId) {
                firstSubfolderId = subfolderId;
              }
            }
          }

          // Create test file
          if (firstSubfolderId) {
            await createOneDriveTestFile(
              'Schoolgle Connection Test.txt',
              `Schoolgle Connection Test\n\nConnected: ${new Date().toISOString()}\nProvider: Microsoft OneDrive\nStatus: Connection Active\n\nFolder structure created: ${totalFoldersCreated} folders\n\nYou can delete this file once confirmed.\n`,
              firstSubfolderId
            );
          }

          // Create or update connection record
          await supabase
            .from('school_data_connections')
            .upsert({
              organization_id,
              provider: 'microsoft',
              folder_id: schoolgleDriveFolder.id,
              folder_name: schoolgleDriveFolder.name,
              connected_by: user.id,
              is_active: true,
              connected_at: new Date().toISOString(),
              scan_status: 'idle',
              total_files: 1,
              total_folders: totalFoldersCreated + 1,
            }, {
              onConflict: 'organization_id,provider'
            });

          console.log('[OAuth] OneDrive connection established:', {
            organization_id: organizationId,
            folder_id: schoolgleDriveFolder.id,
            folders_created: totalFoldersCreated,
          });
        }
      } catch (driveError) {
        console.error('Failed to setup OneDrive folder:', driveError);
      }
    }

    // Success! Redirect back to data connections page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/data-connections?oauth_success=${provider}`
    );
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/data-connections?oauth_error=server_error`
    );
  }
}
