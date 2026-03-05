/**
 * Statutory Check Completions Database Functions
 *
 * Functions for tracking completion status of predefined statutory checks
 */

import { createClient } from '@/lib/supabase/server';
import type { ComplianceDomain } from '@/types/estates-compliance';

/**
 * Completion record for a statutory check
 */
export interface StatutoryCompletion {
  id: string;
  organization_id: string;
  check_id: string;
  compliance_domain: ComplianceDomain;
  status: 'pending' | 'completed' | 'overdue' | 'not_applicable' | 'in_progress' | 'awaiting_documentation';
  completed_at?: string;
  completed_by?: string;
  completion_notes?: string;
  next_due_date: string;
  last_due_date?: string;
  evidence_ids: string[];
  documents_received: boolean;
  contractor_id?: string;
  completion_duration_minutes?: number;
  findings: unknown[];
  rag_status: 'red' | 'amber' | 'green';
  created_at: string;
  updated_at: string;
}

/**
 * Summary of completions for a domain
 */
export interface DomainCompletionSummary {
  domain: ComplianceDomain;
  totalChecks: number;
  completedChecks: number;
  overdueChecks: number;
  pendingChecks: number;
  status: 'compliant' | 'attention' | 'critical';
  completions: StatutoryCompletion[];
}

/**
 * Input for creating a completion record
 */
export interface CreateCompletionInput {
  check_id: string;
  compliance_domain: ComplianceDomain;
  next_due_date: string;
  last_due_date?: string;
}

/**
 * Input for updating a completion record
 */
export interface UpdateCompletionInput {
  status?: StatutoryCompletion['status'];
  completed_at?: string;
  completed_by?: string;
  completion_notes?: string;
  next_due_date?: string;
  evidence_ids?: string[];
  documents_received?: boolean;
  contractor_id?: string;
  completion_duration_minutes?: number;
  findings?: unknown[];
  rag_status?: 'red' | 'amber' | 'green';
}

/**
 * Get all completions for an organization
 */
export async function getStatutoryCompletions(
  organizationId: string,
  filters?: {
    domain?: ComplianceDomain;
    status?: StatutoryCompletion['status'];
    check_id?: string;
  }
): Promise<StatutoryCompletion[]> {
  const supabase = await createClient();

  let query = supabase
    .from('estates_statutory_completions')
    .select('*')
    .eq('organization_id', organizationId);

  if (filters?.domain) {
    query = query.eq('compliance_domain', filters.domain);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.check_id) {
    query = query.eq('check_id', filters.check_id);
  }

  // Order by next due date
  query = query.order('next_due_date', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching statutory completions:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get latest completion for a specific check
 */
export async function getLatestCompletion(
  organizationId: string,
  checkId: string
): Promise<StatutoryCompletion | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('estates_statutory_completions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('check_id', checkId)
    .order('next_due_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No completion record found
    }
    console.error('Error fetching latest completion:', error);
    throw error;
  }

  return data;
}

/**
 * Get completions summary for all domains
 * IMPORTANT: Always shows ALL statutory checks from statutory-checks.ts,
 * even if no completion record exists in the database yet
 */
export async function getDomainsCompletionSummary(
  organizationId: string,
  domains: ComplianceDomain[]
): Promise<DomainCompletionSummary[]> {
  const completions = await getStatutoryCompletions(organizationId);

  // Import here to avoid circular dependency
  const { getChecksForDomain } = await import('@/lib/estates-compliance/statutory-checks');

  // Group by domain
  const domainMap = new Map<ComplianceDomain, DomainCompletionSummary>();

  for (const domain of domains) {
    // Get ALL statutory checks for this domain (from statutory-checks.ts)
    const allStatutoryChecks = getChecksForDomain(domain);
    const totalChecks = allStatutoryChecks.length;

    // Get existing completions from database
    const domainCompletions = completions.filter(c => c.compliance_domain === domain);

    // Create a map of check_id -> completion for easy lookup
    const completionMap = new Map<string, StatutoryCompletion>();
    for (const completion of domainCompletions) {
      completionMap.set(completion.check_id, completion);
    }

    // Build completions array with ALL checks, using pending status for missing ones
    const allCompletions: StatutoryCompletion[] = allStatutoryChecks.map(check => {
      const existing = completionMap.get(check.id);
      if (existing) {
        return existing;
      }
      // Return a pending completion record for checks not yet in database
      return {
        id: '', // Will be generated when first completed
        organization_id: organizationId,
        check_id: check.id,
        compliance_domain: domain,
        status: 'pending',
        next_due_date: calculateNextDueDate(check.frequency),
        evidence_ids: [],
        documents_received: false,
        findings: [],
        rag_status: 'amber',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    const completedChecks = allCompletions.filter(c => c.status === 'completed').length;
    const overdueChecks = allCompletions.filter(c => c.status === 'overdue').length;
    const pendingChecks = allCompletions.filter(c => c.status === 'pending' || c.status === 'in_progress').length;

    // Determine domain status
    let status: 'compliant' | 'attention' | 'critical';
    if (overdueChecks > 0) {
      status = 'critical';
    } else if (totalChecks > 0 && (completedChecks / totalChecks) < 0.8) {
      status = 'attention';
    } else {
      status = 'compliant';
    }

    domainMap.set(domain, {
      domain,
      totalChecks,
      completedChecks,
      overdueChecks,
      pendingChecks,
      status,
      completions: allCompletions,
    });
  }

  return Array.from(domainMap.values());
}

/**
 * Create a new completion record
 */
export async function createCompletion(
  organizationId: string,
  input: CreateCompletionInput
): Promise<StatutoryCompletion> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('estates_statutory_completions')
    .insert({
      organization_id: organizationId,
      check_id: input.check_id,
      compliance_domain: input.compliance_domain,
      next_due_date: input.next_due_date,
      last_due_date: input.last_due_date,
      status: 'pending',
      rag_status: 'amber',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating completion record:', error);
    throw error;
  }

  return data;
}

/**
 * Update a completion record
 */
export async function updateCompletion(
  completionId: string,
  updates: UpdateCompletionInput
): Promise<StatutoryCompletion> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('estates_statutory_completions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', completionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating completion record:', error);
    throw error;
  }

  return data;
}

/**
 * Complete a statutory check
 */
export async function completeStatutoryCheck(
  organizationId: string,
  checkId: string,
  updates: Omit<UpdateCompletionInput, 'next_due_date'> & {
    next_due_date?: string;
  }
): Promise<StatutoryCompletion> {
  // First get the existing completion
  const existing = await getLatestCompletion(organizationId, checkId);

  if (existing) {
    // Update existing record
    return updateCompletion(existing.id, {
      ...updates,
      status: updates.status || 'completed',
      rag_status: updates.rag_status || 'green',
      completed_at: updates.completed_at || new Date().toISOString(),
    });
  } else {
    // Create new completion record
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('estates_statutory_completions')
      .insert({
        organization_id: organizationId,
        check_id: checkId,
        compliance_domain: updates.compliance_domain,
        next_due_date: updates.next_due_date || calculateNextDueDate('annual'),
        status: 'completed',
        rag_status: 'green',
        completed_at: updates.completed_at || new Date().toISOString(),
        completed_by: updates.completed_by,
        completion_notes: updates.completion_notes,
        evidence_ids: updates.evidence_ids || [],
        documents_received: updates.documents_received || false,
        contractor_id: updates.contractor_id,
        completion_duration_minutes: updates.completion_duration_minutes,
        findings: updates.findings || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating completion record:', error);
      throw error;
    }

    return data;
  }
}

/**
 * Get overdue checks
 */
export async function getOverdueChecks(organizationId: string): Promise<StatutoryCompletion[]> {
  return getStatutoryCompletions(organizationId, { status: 'overdue' });
}

/**
 * Get checks due within N days
 */
export async function getUpcomingChecks(
  organizationId: string,
  daysAhead: number = 30
): Promise<StatutoryCompletion[]> {
  const supabase = await createClient();

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('estates_statutory_completions')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('next_due_date', new Date().toISOString().split('T')[0])
    .lte('next_due_date', futureDate.toISOString().split('T')[0])
    .in('status', ['pending', 'in_progress'])
    .order('next_due_date', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming checks:', error);
    throw error;
  }

  return data || [];
}

/**
 * Calculate next due date based on frequency
 */
export function calculateNextDueDate(frequency: string): string {
  const date = new Date();

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'annual':
    case 'annually':
      date.setFullYear(date.getFullYear() + 1);
      break;
    case 'termly':
      // Approximate 3 months
      date.setMonth(date.getMonth() + 3);
      break;
    default:
      date.setFullYear(date.getFullYear() + 1);
  }

  return date.toISOString().split('T')[0];
}

/**
 * Initialize completions for all statutory checks in a domain
 */
export async function initializeDomainCompletions(
  organizationId: string,
  domain: ComplianceDomain,
  checkIds: string[]
): Promise<void> {
  for (const checkId of checkIds) {
    const existing = await getLatestCompletion(organizationId, checkId);

    if (!existing) {
      // Get frequency from statutory check definition
      // This would need to import the statutory checks data
      // For now, default to annual
      await createCompletion(organizationId, {
        check_id: checkId,
        compliance_domain: domain,
        next_due_date: calculateNextDueDate('annual'),
      });
    }
  }
}

/**
 * Bulk initialize completions for all statutory checks
 */
export async function initializeAllStatutoryCompletions(
  organizationId: string,
  domains: ComplianceDomain[],
  domainCheckIds: Record<ComplianceDomain, string[]>
): Promise<void> {
  for (const domain of domains) {
    const checkIds = domainCheckIds[domain] || [];
    await initializeDomainCompletions(organizationId, domain, checkIds);
  }
}
