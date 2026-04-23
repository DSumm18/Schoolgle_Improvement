// POST /api/school-assessment/upload-spreadsheet
// Upload and validate an XLSX spreadsheet for bulk import into assessment captures.
//
// Request: multipart/form-data with file field
// Response: parsed data with validation errors/warnings
//
// Flow:
// 1. Parse XLSX file
// 2. Validate structure (columns, year groups, sections)
// 3. Validate cell values (percentages, counts)
// 4. Return parsed data for user review
// 5. User confirms, then client creates capture with /api/school-assessment/captures

import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { parseAssessmentSpreadsheet, parsedCellsToCaptureData } from '@/lib/school-assessment/spreadsheet-parser';

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const orgId = auth.organizationId;
  if (!orgId) return apiError('Organization required', 400);

  // Verify user is a member of the org
  const supabase = createServiceRoleClient();
  const { data: mem } = await supabase
    .from('organization_members')
    .select('role')
    .eq('auth_id', auth.userId)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (!mem) return apiError('Not a member', 403);

  // Parse multipart form data
  const formData = await req.formData().catch(() => null);
  if (!formData) return apiError('Invalid form data', 400);

  const file = formData.get('file') as File;
  if (!file) return apiError('No file uploaded', 400);

  // Validate file type
  if (
    !file.type.includes('spreadsheet') &&
    !file.type.includes('sheet') &&
    !file.type.includes('excel') &&
    !file.name.endsWith('.xlsx') &&
    !file.name.endsWith('.xls')
  ) {
    return apiError('File must be an Excel spreadsheet (.xlsx or .xls)', 400);
  }

  // Check file size (max 5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return apiError('File too large (max 5MB)', 400);
  }

  try {
    // Parse spreadsheet
    const buffer = await file.arrayBuffer();
    const result = parseAssessmentSpreadsheet(buffer);

    if (!result.valid && result.errors.length > 0) {
      return apiSuccess({
        success: false,
        errors: result.errors,
        warnings: result.warnings,
        preview: result.preview,
      });
    }

    // Return validated data for user review
    return apiSuccess({
      success: true,
      data: parsedCellsToCaptureData(result.data),
      preview: result.preview,
      warnings: result.warnings,
      rowCount: result.data.length,
    });
  } catch (err) {
    console.error('Spreadsheet parse error:', err);
    return apiError('Failed to parse spreadsheet. Ensure it follows the expected format with year group headers and section rows (Cohort, All Pupils, FSM6, Not FSM6).', 400);
  }
});
