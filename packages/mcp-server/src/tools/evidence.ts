/**
 * MCP Tool: get_evidence_matches
 * 
 * Retrieves evidence matches for a specific Ofsted subcategory, automatically filtered 
 * by the authenticated organization. Returns array of matches sorted by confidence score.
 * 
 * Based on actual database schema:
 * - evidence_matches table
 * - documents table (joined)
 */

import { z } from 'zod';
import type { AuthContext } from '@schoolgle/core/auth';

/**
 * Zod schema matching actual evidence_matches table columns
 * 
 * Actual columns from schema:
 * - id: uuid
 * - organization_id: uuid (injected from context, not user input)
 * - document_id: bigint (references documents.id)
 * - framework_type: text ('ofsted' | 'siams')
 * - category_id: text
 * - subcategory_id: text
 * - confidence: decimal(3,2) (0-1)
 * - matched_keywords: text[]
 * - relevance_explanation: text
 * - key_quotes: text[]
 * - strengths: text[]
 * - gaps: text[]
 * - suggestions: text[]
 * - document_link: text
 * - created_at: timestamp
 * - updated_at: timestamp
 */
export const GetEvidenceMatchesSchema = z.object({
  // organizationId is NOT in schema - it's injected from TenantContext
  
  subcategoryId: z.string()
    .min(1, 'Subcategory ID is required')
    .describe('Ofsted subcategory ID (e.g., "curriculum-teaching-1", "inclusion-send"). Required.'),
  
  frameworkType: z.enum(['ofsted', 'siams'])
    .default('ofsted')
    .describe('Framework type. Default: "ofsted".'),
  
  categoryId: z.string()
    .optional()
    .describe('Optional filter by category ID. If provided, only returns matches for this category.'),
  
  minConfidence: z.number()
    .min(0)
    .max(1)
    .default(0.5)
    .describe('Minimum confidence score threshold (0-1). Default: 0.5. Only returns matches with confidence >= this value.'),
  
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('Maximum number of matches to return. Default: 20, Max: 100.'),
  
  includeDocumentDetails: z.boolean()
    .default(true)
    .describe('If true, includes full document details (name, link, folder path). Default: true.')
});

export type GetEvidenceMatchesInput = z.infer<typeof GetEvidenceMatchesSchema>;

export interface EvidenceMatch {
  id: string;
  documentId: number;
  frameworkType: 'ofsted' | 'siams';
  categoryId: string;
  subcategoryId: string;
  confidence: number;
  matchedKeywords: string[] | null;
  relevanceExplanation: string | null;
  keyQuotes: string[] | null;
  strengths: string[] | null;
  gaps: string[] | null;
  suggestions: string[] | null;
  documentLink: string | null;
  document?: {
    name: string;
    webViewLink: string | null;
    folderPath: string | null;
    mimeType: string | null;
    filePath: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceMatchesResult {
  matches: EvidenceMatch[];
  count: number;
  subcategoryId: string;
  frameworkType: 'ofsted' | 'siams';
  minConfidence: number;
  organizationId: string;
}

/**
 * Handler for get_evidence_matches tool
 * 
 * CRITICAL SECURITY: organizationId is injected from TenantContext, NOT from user input.
 * Any organizationId provided in args is ignored.
 */
export async function handleGetEvidenceMatches(
  args: GetEvidenceMatchesInput,
  context: AuthContext
): Promise<EvidenceMatchesResult> {
  const orgId = context.organizationId; // CRITICAL: Use context, not args
  
  // Validate user has access (RLS should handle this, but double-check)
  const { data: membership, error: membershipError } = await context.supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', context.userId)
    .single();
  
  if (membershipError || !membership) {
    throw new Error(`Access denied: User ${context.userId} is not a member of organization ${orgId}`);
  }
  
  // Build query with RLS-enforced filtering
  let query = context.supabase
    .from('evidence_matches')
    .select(`
      *,
      ${args.includeDocumentDetails ? `
      document:documents!inner (
        name,
        web_view_link,
        folder_path,
        mime_type,
        file_path
      )
      ` : ''}
    `)
    .eq('organization_id', orgId) // RLS will enforce this automatically
    .eq('subcategory_id', args.subcategoryId)
    .eq('framework_type', args.frameworkType)
    .gte('confidence', args.minConfidence)
    .order('confidence', { ascending: false })
    .limit(args.limit);
  
  // Optional category filter
  if (args.categoryId) {
    query = query.eq('category_id', args.categoryId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to fetch evidence matches: ${error.message}`);
  }
  
  // Transform data for response
  const matches: EvidenceMatch[] = (data || []).map((match: any) => {
    const result: EvidenceMatch = {
      id: match.id,
      documentId: match.document_id,
      frameworkType: match.framework_type as 'ofsted' | 'siams',
      categoryId: match.category_id,
      subcategoryId: match.subcategory_id,
      confidence: parseFloat(match.confidence.toString()),
      matchedKeywords: match.matched_keywords,
      relevanceExplanation: match.relevance_explanation,
      keyQuotes: match.key_quotes,
      strengths: match.strengths,
      gaps: match.gaps,
      suggestions: match.suggestions,
      documentLink: match.document_link,
      createdAt: match.created_at,
      updatedAt: match.updated_at
    };
    
    // Include document details if requested and available
    if (args.includeDocumentDetails && match.document) {
      result.document = {
        name: match.document.name,
        webViewLink: match.document.web_view_link,
        folderPath: match.document.folder_path,
        mimeType: match.document.mime_type,
        filePath: match.document.file_path
      };
    }
    
    return result;
  });
  
  return {
    matches,
    count: matches.length,
    subcategoryId: args.subcategoryId,
    frameworkType: args.frameworkType,
    minConfidence: args.minConfidence,
    organizationId: orgId
  };
}

