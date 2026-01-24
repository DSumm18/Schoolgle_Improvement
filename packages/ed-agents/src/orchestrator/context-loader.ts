/**
 * Context Loader
 * Loads school context from DfE database
 */

import type { SchoolContext } from '../types';

/**
 * Load school context from DfE database
 *
 * Note: This is a placeholder implementation. In production, this would:
 * 1. Get the organization's school URN from Supabase
 * 2. Call lookupSchoolByURN from supabase-dfe.ts
 * 3. Transform the result into SchoolContext
 */
export async function loadSchoolContext(
  orgId: string,
  supabase: any
): Promise<SchoolContext | null> {
  try {
    // Placeholder - in production would be:
    /*
    // Get school URN from organization
    const { data: org } = await supabase
      .from('organizations')
      .select('school_urn')
      .eq('id', orgId)
      .single();

    if (!org?.school_urn) {
      return null;
    }

    // Import and use the DfE lookup function
    const { lookupSchoolByURN } = await import('@schoolgle/platform/lib/supabase-dfe');
    const schoolData = await lookupSchoolByURN(org.school_urn);

    if (!schoolData) {
      return null;
    }

    return transformToSchoolContext(schoolData);
    */

    return null;
  } catch (error) {
    // Don't fail entire request if context loading fails
    return null;
  }
}

/**
 * Transform DfE school data to SchoolContext
 */
function transformToSchoolContext(dfeData: any): SchoolContext {
  return {
    urn: dfeData.urn,
    name: dfeData.name,
    address: dfeData.address || [],
    phone: dfeData.phone,
    email: dfeData.email,
    typeName: dfeData.type_name,
    phaseName: dfeData.phase_name,
    laCode: dfeData.la_code,
    laName: dfeData.la_name,
    trustName: dfeData.trust_name,
    ofstedRating: dfeData.ofsted_rating,
    ofstedLastInspection: dfeData.ofsted_last_inspection
      ? new Date(dfeData.ofsted_last_inspection)
      : undefined,
    imdDecile: dfeData.imd_decile,
    isIndependent: dfeData.type_name?.toLowerCase().includes('independent'),
  };
}

/**
 * Build enriched prompt with school context
 */
export function buildEnrichedPrompt(
  basePrompt: string,
  schoolContext: SchoolContext | null
): string {
  if (!schoolContext) {
    return basePrompt;
  }

  const contextBlock = buildSchoolContextBlock(schoolContext);

  return `${contextBlock}\n\n${basePrompt}`;
}

/**
 * Build school context block for prompts
 */
export function buildSchoolContextBlock(schoolContext: SchoolContext): string {
  const parts = [
    '## School Context',
    `You are helping **${schoolContext.name}**`,
    '',
  ];

  // Add phase
  if (schoolContext.phaseName) {
    parts.push(`- **Type:** ${schoolContext.phaseName}`);
  }

  // Add trust if applicable
  if (schoolContext.trustName) {
    parts.push(`- **Trust:** ${schoolContext.trustName}`);
  }

  // Add LA info if not a trust
  if (schoolContext.laName && !schoolContext.trustName) {
    parts.push(`- **Local Authority:** ${schoolContext.laName}`);
  }

  // Add Ofsted info if available
  if (schoolContext.ofstedRating) {
    parts.push(`- **Ofsted Rating:** ${schoolContext.ofstedRating}`);
  }

  // Add deprivation context if available
  if (schoolContext.imdDecile !== undefined) {
    const deprivationLevel = schoolContext.imdDecile <= 3
      ? 'high deprivation area'
      : schoolContext.imdDecile <= 7
      ? 'average deprivation'
      : 'low deprivation area';
    parts.push(`- **Context:** ${deprivationLevel} (IMD decile ${schoolContext.imdDecile}/10)`);
  }

  parts.push('');
  parts.push('Use this context to provide relevant, tailored advice.');
  parts.push('');

  return parts.join('\n');
}

/**
 * Get relevant guidance based on school type
 */
export function getTypeSpecificGuidance(schoolContext: SchoolContext): string[] {
  const guidance: string[] = [];

  // Academy vs LA-maintained differences
  if (schoolContext.trustName) {
    guidance.push('This is an academy trust - check trust policies in addition to national guidance.');
  } else if (schoolContext.typeName?.toLowerCase().includes('la-maintained') ||
             schoolContext.typeName?.toLowerCase().includes('local authority')) {
    guidance.push('This is an LA-maintained school - the local authority may provide additional guidance and services.');
  }

  // Independent school considerations
  if (schoolContext.isIndependent) {
    guidance.push('This is an independent school - some statutory requirements may differ, particularly around inspection and curriculum.');
  }

  // Phase-specific guidance
  if (schoolContext.phaseName?.toLowerCase().includes('primary')) {
    guidance.push('Primary school context: Consider early years and key stage 1-2 specific requirements.');
  } else if (schoolContext.phaseName?.toLowerCase().includes('secondary')) {
    guidance.push('Secondary school context: Consider key stage 3-5, GCSE, and post-16 specific requirements.');
  }

  return guidance;
}
