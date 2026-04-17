import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { executeGovernorReportSkill } from '@/lib/intelligence-brain/skills';
import { generateGovernorReportHtml, GovernorReportData } from '@/lib/trust-assessor/report-templates/governor-assessment';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * POST /api/trust-assessor/generate-report
 *
 * Generates a self-contained HTML governor board report using the AI skill
 * and the HTML template generator.
 *
 * Body: {
 *   schoolAbbrev: string,
 *   schoolData: { ... computed metrics from the trust assessor dashboard ... },
 *   format?: 'html' | 'json',  // default 'html'
 *   options?: { includeDataAppendix?: boolean; confidential?: boolean }
 * }
 */
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const { schoolAbbrev, schoolData, format = 'html', options = {} } = body;

  if (!schoolAbbrev || !schoolData) {
    return apiError('schoolAbbrev and schoolData are required', 400);
  }

  // 1. Generate AI narrative
  let narrative: Awaited<ReturnType<typeof executeGovernorReportSkill>>;
  try {
    narrative = await executeGovernorReportSkill(schoolData as Record<string, unknown>);
  } catch (err) {
    console.error('[generate-report] AI narrative error:', err);
    return apiError(
      `Failed to generate AI narrative: ${err instanceof Error ? err.message : 'Unknown error'}`,
      500,
    );
  }

  // 2. Fetch school branding (best-effort, graceful fallback)
  const supabase = createServiceRoleClient();
  let branding: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    school_name?: string;
    trust_name?: string;
  } = {};

  if (auth.organizationId) {
    try {
      const { data } = await supabase
        .from('school_branding')
        .select('logo_url, primary_color, secondary_color, school_name, trust_name')
        .eq('organization_id', auth.organizationId)
        .maybeSingle();
      if (data) branding = data;
    } catch {
      // Non-fatal — fall back to defaults
    }
  }

  // 3. Build full report data object
  const sd = schoolData as Record<string, unknown>;

  const reportData: GovernorReportData = {
    schoolName: (sd.schoolName as string) ?? branding.school_name ?? schoolAbbrev,
    schoolLogoUrl: branding.logo_url ?? null,
    trustName: branding.trust_name ?? null,
    generatedAt: new Date(),
    reportDate: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    academicYear: (sd.academicYear as string) ?? '2025/26',
    y6Combined: (sd.y6Combined as number | null) ?? null,
    nationalPercentile: (sd.nationalPercentile as number | null) ?? null,
    nationalRank: (sd.nationalRank as { rank: number; total: number } | null) ?? null,
    threeYearAverage: (sd.threeYearAverage as number | null) ?? null,
    fsmPct: (sd.fsmPct as number | null) ?? null,
    sendPct: (sd.sendPct as number | null) ?? null,
    trustFsmPct: (sd.trustFsmPct as number | null) ?? null,
    totalPupils: (sd.totalPupils as number | null) ?? null,
    dataQualityAlerts: (sd.dataQualityAlerts as GovernorReportData['dataQualityAlerts']) ?? [],
    cohortJourney: (sd.cohortJourney as GovernorReportData['cohortJourney']) ?? undefined,
    narrative,
    primaryColor: branding.primary_color ?? undefined,
    secondaryColor: branding.secondary_color ?? undefined,
    includeDataAppendix: (options as Record<string, unknown>).includeDataAppendix as boolean | undefined,
    confidential: (options as Record<string, unknown>).confidential as boolean | undefined,
  };

  // 4. Generate HTML
  let html: string;
  try {
    html = generateGovernorReportHtml(reportData);
  } catch (err) {
    console.error('[generate-report] HTML generation error:', err);
    return apiError(
      `Failed to generate report HTML: ${err instanceof Error ? err.message : 'Unknown error'}`,
      500,
    );
  }

  // 5. Save to generated_documents for history (non-fatal)
  const shareToken = crypto.randomBytes(12).toString('base64url');

  if (auth.organizationId) {
    try {
      await supabase.from('generated_documents').insert({
        organization_id: auth.organizationId,
        document_type: 'governor_assessment_report',
        subject: `${reportData.schoolName} — Governor Assessment Report`,
        body: html,
        recipient_name: 'Governors',
        recipient_email: null,
        metadata: { schoolAbbrev, shareToken, severity: narrative.severity },
        created_by: auth.userId,
      });
    } catch {
      // Non-fatal — continue even if history save fails
    }
  }

  if (format === 'json') {
    return apiSuccess({ narrative, reportData, html, shareToken });
  }

  return apiSuccess({ html, shareToken, narrative });
}, { orgOptional: true });
