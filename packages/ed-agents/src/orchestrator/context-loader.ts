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

/**
 * Inject expert knowledge based on domain and page context
 */
export async function injectExpertKnowledge(
  domain: string,
  supabase: any
): Promise<string> {
  if (!supabase) return '';

  const detectedDomain = domain.toLowerCase();

  // Try to find knowledge entries for this domain
  const { data: entries } = await supabase
    .from('compliance_knowledge')
    .select('*')
    .eq('domain', detectedDomain)
    .limit(5);

  if (!entries || entries.length === 0) return '';

  const knowledgeBlock = [
    '## Expert Knowledge Base Injected',
    `The following ${detectedDomain} data has been retrieved from the expert knowledge base:`,
    '',
  ];

  entries.forEach((entry: any) => {
    knowledgeBlock.push(`### ${entry.topic}`);
    knowledgeBlock.push(`- **Statutory:** ${entry.is_statutory ? 'YES' : 'NO'}`);
    if (entry.legislation_reference) {
      knowledgeBlock.push(`- **Ref:** ${entry.legislation_reference}`);
    }
    knowledgeBlock.push(`${entry.content}`);
    if (entry.contractor_context) {
      knowledgeBlock.push(`- **Contractor Bullshit Filter Tip:** ${entry.contractor_context}`);
    }
    knowledgeBlock.push('');
  });

  return knowledgeBlock.join('\n');
}

/**
 * Map a URL to a compliance domain
 */
export function mapUrlToDomain(url: string): string | null {
  const path = url.toLowerCase();

  if (path.includes('legionella') || path.includes('water')) return 'legionella';
  if (path.includes('fire')) return 'fire';
  if (path.includes('asbestos')) return 'asbestos';
  if (path.includes('electrical')) return 'electrical';
  if (path.includes('staff') || path.includes('hr')) return 'hr';
  if (path.includes('send')) return 'send';

  return null;
}

/**
 * Generate proactive context for a domain (The "Wow Factor" greeting)
 */
export async function generateProactiveContext(
  orgId: string,
  domain: string,
  supabase: any
): Promise<string[]> {
  const alerts: string[] = [];
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // 1. Check Compliance Tasks (Overdue & Upcoming)
  const { data: tasks } = await supabase
    .from('estates_compliance_tasks')
    .select('*')
    .eq('organization_id', orgId)
    .eq('domain', domain)
    .or(`status.eq.overdue,due_date.lte.${nextWeek.toISOString()}`);

  if (tasks && tasks.length > 0) {
    tasks.forEach((task: any) => {
      if (task.status === 'overdue') {
        alerts.push(`ACTION REQUIRED: ${task.title} is OVERDUE (was due ${new Date(task.due_date).toLocaleDateString()}).`);
      } else if (new Date(task.due_date) <= nextWeek) {
        alerts.push(`UPCOMING: ${task.title} is due within 7 days (${new Date(task.due_date).toLocaleDateString()}).`);
      }
    });
  }

  // 2. Check Active Helpdesk Tickets
  const { data: tickets } = await supabase
    .from('estates_helpdesk_tickets')
    .select('*')
    .eq('organization_id', orgId)
    .eq('domain', domain)
    .in('status', ['open', 'in_progress']);

  if (tickets && tickets.length > 0) {
    alerts.push(`INFO: There are ${tickets.length} active helpdesk tickets related to ${domain}.`);
  }

  // 3. Check Contractor DBS/Accreditation
  const { data: contractors } = await supabase
    .from('estates_contractors')
    .select('*')
    .eq('organization_id', orgId)
    .lte('dbs_expiry_date', new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()); // 30 days buffer

  if (contractors && contractors.length > 0) {
    contractors.forEach((c: any) => {
      alerts.push(`WARNING: Contractor ${c.name}'s DBS expires soon (${new Date(c.dbs_expiry_date).toLocaleDateString()}).`);
    });
  }

  // 4. Check Recent Knowledge Base Updates
  const { data: updates } = await supabase
    .from('compliance_knowledge')
    .select('*')
    .eq('domain', domain)
    .gte('last_updated', new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()); // Last 14 days

  if (updates && updates.length > 0) {
    alerts.push(`NEW KNOWLEDGE: There are ${updates.length} recent updates to ${domain} guidance.`);
  }

  return alerts;
}
