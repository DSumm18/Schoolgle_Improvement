/**
 * MCP Tool: consult_knowledge_pack
 * 
 * "The Librarian" - Retrieves deterministic guidance from Knowledge Packs.
 * 
 * Cost: £0.00 (NO LLM calls)
 * 
 * Behaviour:
 * - Loads rules from Supabase if configured (preferred)
 * - Fallback to local TS packs if Supabase unavailable
 * - Filters by domain, topic, applies_when
 * - Returns guidance + citations + confidence warnings
 */

import { z } from 'zod';
import type { AuthContext } from '@schoolgle/core/auth';
import type { KnowledgeQueryResult, Rule, KnowledgePack } from '../knowledge/schema.js';
import { generatePackWarnings } from '../knowledge/schema.js';
import { getBB104Pack, getBB104Rules } from '../knowledge/packs/estates_bb104.js';
import { getEEFPack, getEEFRules } from '../knowledge/packs/research_eef.js';
import { logTelemetry } from '../utils/telemetry.js';

// ============================================================================
// ZOD SCHEMA
// ============================================================================

export const ConsultKnowledgePackSchema = z.object({
  domain: z.enum(['estates', 'send', 'hr', 'finance', 'compliance', 'research'])
    .describe('Knowledge domain to query'),
  topic: z.string()
    .describe('Topic to search for (e.g., "classroom_minimum_area", "safeguarding_reporting", "feedback")'),
  context: z.string()
    .optional()
    .describe('Optional context to filter applies_when conditions (e.g., "primary school", "wheelchair users")'),
});

export type ConsultKnowledgePackInput = z.infer<typeof ConsultKnowledgePackSchema>;

// ============================================================================
// KNOWLEDGE PACK REGISTRY (Local Fallback)
// ============================================================================

/**
 * Registry of local knowledge packs
 * In production, these should be loaded from Supabase
 */
const LOCAL_PACKS: Map<string, KnowledgePack> = new Map();
const LOCAL_RULES: Map<string, Rule[]> = new Map();

// Register BB104 pack
LOCAL_PACKS.set('bb104-v1', getBB104Pack());
LOCAL_RULES.set('bb104-v1', getBB104Rules());

// Register EEF Research pack
LOCAL_PACKS.set('eef-research-v1', getEEFPack());
LOCAL_RULES.set('eef-research-v1', getEEFRules());

// TODO: Add more packs as they're created
// LOCAL_PACKS.set('kcsie-v1', getKCSIEPack());
// LOCAL_RULES.set('kcsie-v1', getKCSIERules());

// ============================================================================
// SUPABASE RETRIEVAL (Preferred)
// ============================================================================

/**
 * Load knowledge pack from Supabase
 * Returns null if Supabase is not configured or pack not found
 */
async function loadPackFromSupabase(
  domain: string,
  supabase: AuthContext['supabase']
): Promise<KnowledgePack | null> {
  try {
    const { data, error } = await supabase
      .from('knowledge_packs')
      .select('*')
      .eq('domain', domain)
      .eq('active', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      domain: data.domain as KnowledgePack['domain'],
      title: data.title,
      version: data.version,
      effective_date: data.effective_date,
      review_by_date: data.review_by_date,
      confidence_level: data.confidence_level as KnowledgePack['confidence_level'],
      source_url: data.source_url || undefined,
      superseded_by: data.superseded_by || undefined,
    };
  } catch (error) {
    console.warn('[Knowledge] Supabase retrieval failed, using local fallback:', error);
    return null;
  }
}

/**
 * Load rules from Supabase
 * Returns empty array if Supabase is not configured or rules not found
 */
async function loadRulesFromSupabase(
  packId: string,
  topic: string,
  context: string | undefined,
  supabase: AuthContext['supabase']
): Promise<Rule[]> {
  try {
    let query = supabase
      .from('knowledge_rules')
      .select('*')
      .eq('pack_id', packId)
      .eq('topic', topic)
      .eq('active', true);

    // Simple text matching on applies_when_text (v1 - structured later)
    // Support legacy field name for backward compatibility
    if (context) {
      query = query.or(`applies_when_text.ilike.%${context}%,applies_when.ilike.%${context}%`);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      pack_id: row.pack_id,
      topic: row.topic,
      applies_when_text: row.applies_when_text || row.applies_when || '', // Support legacy field name
      applies_when_predicate: row.applies_when_predicate || undefined,
      content: row.content,
      citations: row.citations || [],
      authority_level: row.authority_level || undefined,
    }));
  } catch (error) {
    console.warn('[Knowledge] Supabase rules retrieval failed, using local fallback:', error);
    return [];
  }
}

// ============================================================================
// LOCAL RETRIEVAL (Fallback)
// ============================================================================

/**
 * Load knowledge pack from local registry
 */
function loadPackFromLocal(domain: string): KnowledgePack | null {
  if (domain === 'estates') {
    return LOCAL_PACKS.get('bb104-v1') || null;
  }
  
  if (domain === 'research') {
    return LOCAL_PACKS.get('eef-research-v1') || null;
  }
  
  return null;
}

/**
 * Load rules from local registry
 */
function loadRulesFromLocal(
  packId: string,
  topic: string,
  context: string | undefined
): Rule[] {
  const rules = LOCAL_RULES.get(packId) || [];
  
  // Filter by topic
  let filtered = rules.filter(rule => rule.topic === topic);
  
  // Simple text matching on applies_when_text (v1 - structured later)
  if (context && filtered.length > 0) {
    filtered = filtered.filter(rule => 
      rule.applies_when_text.toLowerCase().includes(context.toLowerCase())
    );
  }
  
  return filtered;
}

// ============================================================================
// HANDLER
// ============================================================================

export async function handleConsultKnowledgePack(
  args: ConsultKnowledgePackInput,
  context: AuthContext,
  requestId?: string,
  sessionId?: string
): Promise<KnowledgeQueryResult> {
  const startTime = Date.now();
  const { domain, topic, context: contextFilter } = args;
  
  // Try Supabase first (preferred)
  let pack: KnowledgePack | null = await loadPackFromSupabase(domain, context.supabase);
  let rules: Rule[] = [];
  
  if (pack) {
    // Load rules from Supabase
    rules = await loadRulesFromSupabase(pack.id, topic, contextFilter, context.supabase);
  } else {
    // Fallback to local packs
    pack = loadPackFromLocal(domain);
    
    if (pack) {
      rules = loadRulesFromLocal(pack.id, topic, contextFilter);
    }
  }
  
  // If no pack found, return error
  if (!pack) {
    const errorMsg = `No knowledge pack found for domain: ${domain}`;
    const duration = Date.now() - startTime;
    await logTelemetry(
      {
        tool_name: 'consult_knowledge_pack',
        used_llm: false,
        timestamp: new Date().toISOString(),
        organization_id: context.organizationId,
        user_id: context.userId,
        duration_ms: duration,
        request_id: requestId,
        session_id: sessionId,
        outcome: 'error',
        error_code: 'NO_PACK_FOUND',
      },
      context.supabase
    );
    throw new Error(errorMsg);
  }
  
  // Generate warnings
  const warnings = generatePackWarnings(pack);
  
  // If no rules found, add warning
  if (rules.length === 0) {
    warnings.push(`No rules found for topic: ${topic}${contextFilter ? ` with context: ${contextFilter}` : ''}`);
  }
  
  // ENFORCE: Every rule must have citations (no hallucination)
  const rulesWithoutCitations = rules.filter(rule => !rule.citations || rule.citations.length === 0);
  let missingCitationsCount = 0;
  let missingRuleIds: string[] = [];
  let missingRuleTopics: string[] = [];
  let citationFilterMessage: string | undefined;
  
  if (rulesWithoutCitations.length > 0) {
    missingCitationsCount = rulesWithoutCitations.length;
    missingRuleIds = rulesWithoutCitations.map(r => r.id);
    missingRuleTopics = rulesWithoutCitations.map(r => r.topic);
    citationFilterMessage = `${missingCitationsCount} rule(s) were excluded because they have no citations. Add citations to include them.`;
    warnings.push(`⚠️ CRITICAL: ${citationFilterMessage}`);
    // Remove rules without citations to prevent hallucination
    rules = rules.filter(rule => rule.citations && rule.citations.length > 0);
  }
  
  // Determine outcome for telemetry
  let outcome: 'success' | 'no_rules_found' | 'rules_filtered_no_citations' | 'error' = 'success';
  let errorCode: string | undefined;
  
  if (rules.length === 0 && missingCitationsCount === 0) {
    outcome = 'no_rules_found';
  } else if (missingCitationsCount > 0) {
    outcome = 'rules_filtered_no_citations';
  }
  
  // Log telemetry (deterministic retrieval, no LLM)
  const duration = Date.now() - startTime;
  await logTelemetry(
    {
      tool_name: 'consult_knowledge_pack',
      used_llm: false,
      timestamp: new Date().toISOString(),
      organization_id: context.organizationId,
      user_id: context.userId,
      duration_ms: duration,
      request_id: requestId,
      session_id: sessionId,
      outcome,
      error_code: errorCode,
    },
    context.supabase
  );
  
  return {
    rules,
    pack,
    warnings,
    retrieved_at: new Date().toISOString(),
    missing_citations_count: missingCitationsCount > 0 ? missingCitationsCount : undefined,
    missing_rule_ids: missingRuleIds.length > 0 ? missingRuleIds : undefined,
    missing_rule_topics: missingRuleTopics.length > 0 ? missingRuleTopics : undefined,
    citation_filter_message: citationFilterMessage,
  };
}

