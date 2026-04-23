/**
 * Knowledge Base Query
 * Queries the ed_knowledge_base table for cached answers
 */

import type {
  Domain,
  ConfidenceLevel,
  KnowledgeEntry,
  KnowledgeQueryOptions,
} from '../types';

/**
 * Query the knowledge base for relevant answers
 */
export async function queryKnowledgeBase(
  supabase: any,
  question: string,
  domain?: Domain,
  options: KnowledgeQueryOptions = {}
): Promise<KnowledgeEntry | null> {
  if (!supabase) return null;

  // Search by topic or content relevance
  const { data, error } = await supabase
    .from('compliance_knowledge')
    .select('*')
    .or(`topic.ilike.%${question}%,content.ilike.%${question}%`)
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  return transformToKnowledgeEntry(data[0]);
}

/**
 * Get knowledge entry by ID
 */
export async function getKnowledgeEntry(
  supabase: any,
  id: string
): Promise<KnowledgeEntry | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('compliance_knowledge')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return transformToKnowledgeEntry(data);
}

/**
 * Search knowledge base by topic
 */
export async function searchByTopic(
  supabase: any,
  topic: string,
  domain: Domain,
  options: KnowledgeQueryOptions = {}
): Promise<KnowledgeEntry[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('compliance_knowledge')
    .select('*')
    .eq('domain', domain)
    .ilike('topic', `%${topic}%`)
    .limit(options.limit || 5);

  if (error || !data) return [];
  return data.map(transformToKnowledgeEntry);
}

/**
 * Get knowledge entries due for review
 */
export async function getEntriesDueForReview(
  supabase: any,
  domain?: Domain
): Promise<KnowledgeEntry[]> {
  if (!supabase) return [];

  let query = supabase
    .from('compliance_knowledge')
    .select('*')
    .lt('next_review_due', new Date().toISOString());

  if (domain) {
    query = query.eq('domain', domain);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return data.map(transformToKnowledgeEntry);
}

/**
 * Add new knowledge entry
 */
export async function addKnowledgeEntry(
  supabase: any,
  entry: Omit<KnowledgeEntry, 'id' | 'version' | 'rank' | 'lastVerified'>
): Promise<KnowledgeEntry | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('compliance_knowledge')
    .insert({
      domain: entry.domain,
      topic: entry.topic,
      content: entry.answer,
      is_statutory: entry.isStatutory,
      legislation_reference: entry.legislationReference,
      contractor_context: entry.contractorContext,
    })
    .select()
    .single();

  if (error || !data) return null;
  return transformToKnowledgeEntry(data);
}

/**
 * Update existing knowledge entry
 */
export async function updateKnowledgeEntry(
  supabase: any,
  id: string,
  updates: Partial<Omit<KnowledgeEntry, 'id' | 'version'>>,
  incrementVersion = true
): Promise<KnowledgeEntry | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('compliance_knowledge')
    .update({
      topic: updates.topic,
      content: updates.answer,
      is_statutory: updates.isStatutory,
      legislation_reference: updates.legislationReference,
      contractor_context: updates.contractorContext,
      next_review_due: updates.nextReviewDue?.toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return null;
  return transformToKnowledgeEntry(data);
}

/**
 * Check if knowledge is stale (needs refresh)
 */
export function isKnowledgeStale(entry: KnowledgeEntry): boolean {
  if (!entry.nextReviewDue) {
    const daysSinceVerified = Date.now() - new Date(entry.lastVerified).getTime();
    const daysToReview = entry.confidence === 'HIGH' ? 90 : 30;
    return daysSinceVerified > daysToReview * 24 * 60 * 60 * 1000;
  }

  return new Date(entry.nextReviewDue) < new Date();
}

/**
 * Transform database row to KnowledgeEntry
 */
function transformToKnowledgeEntry(row: any): KnowledgeEntry {
  return {
    id: row.id,
    domain: row.domain,
    topic: row.topic,
    question: row.topic, // Use topic as question context
    answer: row.content,
    sourceUrl: row.source_url,
    sourceName: row.source_name || (row.is_statutory ? 'Statutory Guidance' : 'Knowledge Base'),
    sourceType: row.source_type || 'database',
    confidence: 'HIGH', // Database content is verified
    lastVerified: new Date(row.last_updated || row.created_at),
    nextReviewDue: row.next_review_due ? new Date(row.next_review_due) : undefined,
    version: row.version || 1,
    isStatutory: row.is_statutory,
    legislationReference: row.legislation_reference,
    contractorContext: row.contractor_context,
  };
}
