/**
 * DATA IMPORT API ROUTES
 *
 * API endpoints for scanning and importing school data
 */

import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { SchoolDataImporter, Pseudonymiser } from '@/lib/data-import/pipeline';

/**
 * GET /api/data-import/scan?folderId=xxx
 *
 * Scans a Google Drive folder for importable files
 */
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get('folderId');

  if (!folderId) {
    return apiError('folderId is required', 400);
  }

  const supabase = createServiceRoleClient();

  // Get the data connection for this organization
  const { data: connection } = await supabase
    .from('school_data_connections')
    .select('*')
    .eq('organization_id', auth.organizationId)
    .eq('folder_id', folderId)
    .single();

  if (!connection) {
    return apiError('Folder not connected. Please connect the folder first.', 404);
  }

  try {
    // Import the Google Drive API
    const { GOOGLE_API_KEY } = process.env;

    // Use detected_folders from connection first
    if (connection.detected_folders && Object.keys(connection.detected_folders).length > 0) {
      const files = [];
      let pupilCount = 0;

      for (const [path, info] of Object.entries(connection.detected_folders)) {
        files.push({
          id: info.folderId,
          name: path.split('/').pop() || path,
          type: info.category,
          category: info.category,
          size: 0,
          status: 'detected' as const,
          recordCount: info.files
        });

        if (info.category === 'census' || info.category === 'assessments') {
          pupilCount += info.files;
        }
      }

      return apiSuccess({
        files,
        summary: {
          totalFiles: files.length,
          estimatedPupils: pupilCount,
          estimatedStaff: 0,
          estimatedClasses: pupilCount > 0 ? Math.ceil(pupilCount / 30) : 0,
          censusFiles: files.filter(f => f.type === 'census').length,
          assessmentFiles: files.filter(f => f.type === 'assessments').length,
          senFiles: files.filter(f => f.type === 'send').length,
          ppFiles: files.filter(f => f.type === 'pp').length,
          staffFiles: 0,
          attendanceFiles: files.filter(f => f.type === 'attendance').length
        }
      });
    }

    // If no detected_folders, do a fresh scan
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?` +
        new URLSearchParams({
          q: `'${folderId}' in parents and trashed = false`,
          fields: 'files(id,name,mimeType,size',
          pageSize: '100',
          supportsAllDrives: 'true',
          includeItemsFromAllDrives: 'true'
        }),
      );

    if (!response.ok) {
      return apiError('Failed to scan folder', 500);
    }

    const data = await response.json();
    const files = [];

    let pupilCount = 0;

    for (const file of (data.files || [])) {
      const type = detectFileType(file.name);
      const category = getCategory(type);

      files.push({
        id: file.id,
        name: file.name,
        type,
        category,
        size: parseInt(file.size) || 0,
        status: 'detected' as const,
        recordCount: 0
      });

      if (type === 'census' || category === 'census') {
        // Estimate pupils from file size
        pupilCount += estimatePupilCount(file.size);
      }
    }

    return apiSuccess({
      files,
      summary: {
        totalFiles: files.length,
        estimatedPupils: pupilCount,
        estimatedStaff: 0,
        estimatedClasses: pupilCount > 0 ? Math.ceil(pupilCount / 30) : 0,
        censusFiles: files.filter(f => f.type === 'census').length,
        assessmentFiles: files.filter(f => f.type === 'assessment').length,
        senFiles: files.filter(f => f.type === 'send').length,
        ppFiles: files.filter(f => f.type === 'pp').length,
        staffFiles: 0,
        attendanceFiles: files.filter(f => f.type === 'attendance').length
      }
    });

  } catch (error: any) {
    console.error('Scan error:', error);
    return apiError(error.message || 'Failed to scan folder', 500);
  }
});

/**
 * POST /api/data-import/import
 *
 * Import data from detected files
 */
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const { organizationId, fileIds } = await req.json();

  if (!organizationId) {
    return apiError('organizationId is required', 400);
  }

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return apiError('fileIds is required', 400);
  }

  const supabase = createServiceRoleClient();

  // Get the data connection for this organization
  const { data: connection } = await supabase
    .from('school_data_connections')
    .select('*')
    .eq('organization_id', auth.organizationId)
    .single();

  if (!connection) {
    return apiError('No data connection found', 404);
  }

  try {
    // Get the import files from the request (they could be uploaded or from Drive)
    const body = await req.json();
    const { files } = body;

    if (!files || files.length === 0) {
      return apiError('No files to import', 400);
    }

    // Initialize the importer
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return apiError('Database configuration missing', 500);
    }

    const importer = new SchoolDataImporter(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, organizationId);
    await importer.initializeSalt();

    const results = [];
    let totalPupils = 0;
    let totalAssessments = 0;

    for (const file of files) {
      try {
        const fileType = detectFileType(file.name);

        if (fileType === 'census' && file.content) {
          // Import census XML
          const result = await importer.importCensusXML(file.content, file.name);
          totalPupils += result.pupilsInserted;
          results.push({
            file: file.name,
            type: 'census',
            success: true,
            pupils: result.pupilsInserted
          });
        } else if (fileType === 'assessment' && file.content) {
          // Import assessment Excel
          const buffer = Buffer.from(file.content, 'base64');
          const result = await importer.importAssessmentExcel(buffer, file.name);
          totalAssessments += result.recordsInserted;
          results.push({
            file: file.name,
            type: 'assessment',
            success: true,
            records: result.recordsInserted
          });
        } else {
          results.push({
            file: file.name,
            type: fileType,
            success: false,
            error: 'File type not yet supported or no content provided'
          });
        }
      } catch (fileError: any) {
        console.error(`Error importing ${file.name}:`, fileError);
        results.push({
          file: file.name,
          success: false,
          error: fileError.message || 'Import failed'
        });
      }
    }

    return apiSuccess({
      success: true,
      message: 'Import completed',
      summary: {
        totalFiles: files.length,
        successfulImports: results.filter(r => r.success).length,
        failedImports: results.filter(r => !r.success).length,
        totalPupils,
        totalAssessments
      },
      details: results
    });

  } catch (error: any) {
    console.error('Import error:', error);
    return apiError(error.message || 'Import failed', 500);
  }
});

function detectFileType(filename: string): string {
  const name = filename.toLowerCase();
  if (name.includes('census') || name.endsWith('.xml')) return 'census';
  if (name.includes('eyfs') || name.includes('phonics') || name.includes('ks1') || name.includes('ks2') || name.includes('mtc')) return 'assessment';
  if (name.includes('sen') || name.includes('send')) return 'sen';
  if (name.includes('pp') || name.includes('pupil premium')) return 'pp';
  if (name.includes('attendance')) return 'attendance';
  if (name.includes('staff') || name.includes('employee')) return 'staff';
  return 'other';
}

function getCategory(type: string): string {
  switch (type) {
    case 'census': return 'census';
    case 'assessment': return 'assessments';
    case 'sen':
    case 'send': return 'send';
    case 'pp': return 'pupil_premium';
    case 'attendance': return 'attendance';
    case 'staff': return 'staff';
    default: return 'other';
  }
}

function estimatePupilCount(fileSize: number): number {
  // Census XML is roughly 500 bytes per pupil
  return Math.floor(fileSize / 500);
}
