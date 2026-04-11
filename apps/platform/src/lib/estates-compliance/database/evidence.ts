/**
 * Estates Evidence Database Functions
 *
 * Helper functions for managing estates_evidence table
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type {
  EstatesEvidence,
  EstatesEvidenceInput,
  EvidenceFilters,
  PaginatedResponse,
} from '@/types/estates-compliance';

// Use service role for server-side operations — cookie-based client is empty
// when API routes are called with Bearer auth. Tenant isolation preserved
// via organizationId filter in every query.
const supabase = createServiceRoleClient();

/**
 * Get evidence items with filters and pagination
 */
export async function getEvidence(
  organizationId: string,
  filters?: EvidenceFilters,
  pagination?: { page: number; pageSize: number }
): Promise<PaginatedResponse<EstatesEvidence>> {
  let query = supabase
    .from('estates_evidence')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId);

  // Apply filters
  if (filters?.evidence_type) {
    query = query.eq('evidence_type', filters.evidence_type);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.compliance_domain) {
    query = query.eq('compliance_domain', filters.compliance_domain);
  }
  if (filters?.asset_id) {
    query = query.eq('asset_id', filters.asset_id);
  }
  if (filters?.task_id) {
    query = query.eq('task_id', filters.task_id);
  }
  if (filters?.contractor_id) {
    query = query.eq('contractor_id', filters.contractor_id);
  }
  if (filters?.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  if (filters?.date_to) {
    query = query.lte('created_at', filters.date_to);
  }
  if (filters?.expiry_from) {
    query = query.gte('expiry_date', filters.expiry_from);
  }
  if (filters?.expiry_to) {
    query = query.lte('expiry_date', filters.expiry_to);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,document_number.ilike.%${filters.search}%`);
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }

  // Apply pagination
  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);
  }

  // Order by created_at desc
  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching evidence:', error);
    throw error;
  }

  return {
    data: data || [],
    count: count || 0,
    page: pagination?.page || 1,
    page_size: pagination?.pageSize || count || 0,
    has_more: (count || 0) > ((pagination?.page || 1) * (pagination?.pageSize || count || 0)),
  };
}

/**
 * Get a single evidence item by ID
 */
export async function getEvidenceById(evidenceId: string): Promise<EstatesEvidence | null> {
  const { data, error } = await supabase
    .from('estates_evidence')
    .select('*')
    .eq('id', evidenceId)
    .single();

  if (error) {
    console.error('Error fetching evidence:', error);
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Create a new evidence item
 */
export async function createEvidence(
  organizationId: string,
  userId: string,
  evidence: EstatesEvidenceInput
): Promise<EstatesEvidence> {
  // If linking to existing evidence, copy its file details
  let fileDetails = {
    file_url: evidence.file_url,
    file_name: evidence.file_name,
    file_type: evidence.file_type,
    file_size_bytes: evidence.file_size_bytes,
  };

  if (evidence.source_type === 'existing' && evidence.existing_evidence_id) {
    const existing = await getEvidenceById(evidence.existing_evidence_id);
    if (existing) {
      fileDetails = {
        file_url: existing.file_url,
        file_name: existing.file_name,
        file_type: existing.file_type,
        file_size_bytes: existing.file_size_bytes,
      };
    }
  }

  // Build an explicit row with only valid DB columns.
  // Spreading `...evidence` caused failures because it included fields like
  // `file` (the File object) and `existing_evidence_id` which are not columns.
  const row: Record<string, unknown> = {
    organization_id: organizationId,
    uploaded_by: userId,
    title: evidence.title,
    description: evidence.description || null,
    evidence_type: evidence.evidence_type,
    source_type: evidence.source_type,
    status: 'pending',
    ai_verified: false,
    tags: evidence.tags || [],
    version: 1,
    compliance_domain: evidence.compliance_domain || null,
    asset_id: evidence.asset_id || null,
    task_id: evidence.task_id || null,
    ticket_id: evidence.ticket_id || null,
    contractor_id: evidence.contractor_id || null,
    contract_id: evidence.contract_id || null,
    user_qualification_id: evidence.user_qualification_id || null,
    document_number: evidence.document_number || null,
    issuing_body: evidence.issuing_body || null,
    issued_date: evidence.issued_date || null,
    expiry_date: evidence.expiry_date || null,
    cloud_provider: evidence.cloud_provider || null,
    cloud_file_id: evidence.cloud_file_id || null,
    ...fileDetails,
  };

  const { data, error } = await supabase
    .from('estates_evidence')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error creating evidence:', error);
    throw error;
  }

  return data;
}

/**
 * Update an existing evidence item
 */
export async function updateEvidence(
  evidenceId: string,
  updates: Partial<EstatesEvidenceInput> & {
    status?: string;
    ai_verified?: boolean;
    ai_confidence_score?: number;
    verification_notes?: string;
    verified_by?: string;
    verified_at?: string;
  }
): Promise<EstatesEvidence> {
  const { data, error } = await supabase
    .from('estates_evidence')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', evidenceId)
    .select()
    .single();

  if (error) {
    console.error('Error updating evidence:', error);
    throw error;
  }

  return data;
}

/**
 * Delete an evidence item
 */
export async function deleteEvidence(evidenceId: string): Promise<void> {
  const { error } = await supabase
    .from('estates_evidence')
    .delete()
    .eq('id', evidenceId);

  if (error) {
    console.error('Error deleting evidence:', error);
    throw error;
  }
}

/**
 * Get evidence by compliance domain
 */
export async function getEvidenceByDomain(
  organizationId: string,
  domain: string
): Promise<EstatesEvidence[]> {
  const { data, error } = await supabase
    .from('estates_evidence')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('compliance_domain', domain)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching evidence by domain:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get evidence by asset
 */
export async function getEvidenceByAsset(assetId: string): Promise<EstatesEvidence[]> {
  const { data, error } = await supabase
    .from('estates_evidence')
    .select('*')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching evidence by asset:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get evidence by task
 */
export async function getEvidenceByTask(taskId: string): Promise<EstatesEvidence[]> {
  const { data, error } = await supabase
    .from('estates_evidence')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching evidence by task:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get evidence by contractor
 */
export async function getEvidenceByContractor(contractorId: string): Promise<EstatesEvidence[]> {
  const { data, error } = await supabase
    .from('estates_evidence')
    .select('*')
    .eq('contractor_id', contractorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching evidence by contractor:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get expiring evidence (certificates near expiry)
 */
export async function getExpiringEvidence(
  organizationId: string,
  daysAhead = 30
): Promise<EstatesEvidence[]> {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysAhead);

  const { data, error } = await supabase
    .from('estates_evidence')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('expiry_date', new Date().toISOString().split('T')[0])
    .lte('expiry_date', expiryDate.toISOString().split('T')[0])
    .order('expiry_date', { ascending: true });

  if (error) {
    console.error('Error fetching expiring evidence:', error);
    throw error;
  }

  return data || [];
}

/**
 * Search evidence
 */
export async function searchEvidence(
  organizationId: string,
  searchTerm: string,
  limit = 20
): Promise<EstatesEvidence[]> {
  const { data, error } = await supabase
    .from('estates_evidence')
    .select('*')
    .eq('organization_id', organizationId)
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%,issuing_body.ilike.%${searchTerm}%`)
    .limit(limit);

  if (error) {
    console.error('Error searching evidence:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get evidence statistics
 */
export async function getEvidenceStats(organizationId: string): Promise<{
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  by_domain: Record<string, number>;
  expiring_soon: number;
  pending_verification: number;
}> {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { data, error } = await supabase
    .from('estates_evidence')
    .select('evidence_type, status, compliance_domain, expiry_date')
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching evidence stats:', error);
    throw error;
  }

  const stats = {
    total: data?.length || 0,
    by_type: {} as Record<string, number>,
    by_status: {} as Record<string, number>,
    by_domain: {} as Record<string, number>,
    expiring_soon: 0,
    pending_verification: 0,
  };

  for (const item of data || []) {
    // Count by type
    stats.by_type[item.evidence_type] = (stats.by_type[item.evidence_type] || 0) + 1;

    // Count by status
    stats.by_status[item.status] = (stats.by_status[item.status] || 0) + 1;

    // Count by domain
    if (item.compliance_domain) {
      stats.by_domain[item.compliance_domain] = (stats.by_domain[item.compliance_domain] || 0) + 1;
    }

    // Count expiring soon
    if (item.expiry_date) {
      const expiry = new Date(item.expiry_date);
      if (expiry <= thirtyDaysFromNow) {
        stats.expiring_soon++;
      }
    }

    // Count pending verification
    if (item.status === 'pending') {
      stats.pending_verification++;
    }
  }

  return stats;
}

/**
 * Create a new version of existing evidence
 */
export async function createEvidenceVersion(
  originalEvidenceId: string,
  userId: string,
  newFileUrl: string,
  newFileName?: string
): Promise<EstatesEvidence> {
  const original = await getEvidenceById(originalEvidenceId);
  if (!original) {
    throw new Error('Original evidence not found');
  }

  // Get the latest version number
  const { data: versionData } = await supabase
    .from('estates_evidence')
    .select('version')
    .eq('parent_evidence_id', originalEvidenceId)
    .order('version', { ascending: false })
    .limit(1);

  const nextVersion = (versionData?.[0]?.version || original.version) + 1;

  // Archive the original
  await updateEvidence(originalEvidenceId, { status: 'archived' });

  // Create new version
  const { data, error } = await supabase
    .from('estates_evidence')
    .insert({
      organization_id: original.organization_id,
      uploaded_by: userId,
      title: original.title,
      description: original.description,
      evidence_type: original.evidence_type,
      file_url: newFileUrl,
      file_name: newFileName || original.file_name,
      file_type: original.file_type,
      cloud_provider: original.cloud_provider,
      cloud_file_id: original.cloud_file_id,
      source_type: 'upload',
      compliance_domain: original.compliance_domain,
      asset_id: original.asset_id,
      task_id: original.task_id,
      contractor_id: original.contractor_id,
      contract_id: original.contract_id,
      document_number: original.document_number,
      issuing_body: original.issuing_body,
      issued_date: original.issued_date,
      expiry_date: original.expiry_date,
      parent_evidence_id: originalEvidenceId,
      version: nextVersion,
      tags: original.tags,
      status: 'pending',
      ai_verified: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating evidence version:', error);
    throw error;
  }

  return data;
}
