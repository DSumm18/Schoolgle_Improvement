/**
 * Helpdesk Database Layer
 *
 * Functions for interacting with estates_helpdesk_tickets table.
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type {
  HelpdeskTicket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from '@/types/estates-compliance';

/**
 * Escape PostgREST special characters to prevent query injection via .or()
 * filter strings. Applied to any user-supplied search term before interpolation.
 */
function sanitizeSearch(input: string): string {
  return input.replace(/[%_,()\\]/g, (c) => "\\" + c);
}

// Explicit whitelist of columns that may be updated via updateHelpdeskTicket.
// Never spread raw API body — that would allow callers to overwrite
// organisation_id, ticket_number, module, or other immutable fields.
const UPDATABLE_TICKET_COLUMNS = [
  'title', 'description', 'category', 'priority', 'status',
  'assigned_to', 'assigned_to_name', 'team_id', 'resolution', 'resolution_summary',
  'assigned_contractor_id', 'contractor_id', 'compliance_domain',
  'statutory_check_id', 'custom_check_id',
  'resolved_at', 'resolved_by', 'actual_cost', 'estimated_cost',
  'due_date', 'completed_date', 'safeguarding_flag', 'risk_score',
  'notes', 'evidence_urls', 'resolution_notes',
] as const;

function pickUpdatableTicketColumns(updates: Record<string, unknown>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const key of UPDATABLE_TICKET_COLUMNS) {
    if (key in updates && updates[key] !== undefined) {
      row[key] = updates[key];
    }
  }
  return row;
}

/**
 * Filters for ticket queries
 */
export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigned_to?: string;
  team_id?: string;
  reported_by?: string;
  asset_id?: string;
  compliance_domain?: string;
  statutory_check_id?: string;
  custom_check_id?: string;
  location?: string;
  search?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get helpdesk tickets for an organization
 */
export async function getHelpdeskTickets(
  organizationId: string,
  filters?: TicketFilters,
  pagination?: PaginationOptions
): Promise<PaginatedResponse<HelpdeskTicket>> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('estates_helpdesk_tickets')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority);
  }
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.assigned_to) {
    query = query.eq('assigned_to', filters.assigned_to);
  }
  if (filters?.reported_by) {
    query = query.eq('raised_by', filters.reported_by);
  }
  if (filters?.asset_id) {
    query = query.eq('asset_id', filters.asset_id);
  }
  if (filters?.compliance_domain) {
    query = query.eq('compliance_domain', filters.compliance_domain);
  }
  if (filters?.statutory_check_id) {
    query = query.eq('statutory_check_id', filters.statutory_check_id);
  }
  if (filters?.custom_check_id) {
    query = query.eq('custom_check_id', filters.custom_check_id);
  }
  if (filters?.location) {
    query = query.eq('location', filters.location);
  }
  if (filters?.search) {
    const s = sanitizeSearch(filters.search);
    query = query.or(`title.ilike.%${s}%,description.ilike.%${s}%,ticket_number.ilike.%${s}%`);
  }

  // Apply pagination
  if (pagination) {
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching helpdesk tickets:', error);
    throw new Error('Failed to fetch helpdesk tickets');
  }

  const totalPages = pagination ? Math.ceil((count || 0) / pagination.pageSize) : 1;

  return {
    data: data || [],
    total: count || 0,
    page: pagination?.page || 1,
    pageSize: pagination?.pageSize || (data?.length || 0),
    totalPages,
  };
}

/**
 * Get a single helpdesk ticket by ID.
 * organizationId is required to prevent cross-tenant reads via the service role.
 */
export async function getHelpdeskTicketById(
  ticketId: string,
  organizationId?: string,
): Promise<HelpdeskTicket | null> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('estates_helpdesk_tickets')
    .select('*')
    .eq('id', ticketId);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') return null; // no rows
    console.error('Error fetching helpdesk ticket:', error);
    return null;
  }

  return data;
}

/**
 * Get a helpdesk ticket by ticket number
 */
export async function getHelpdeskTicketByNumber(ticketNumber: string): Promise<HelpdeskTicket | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('estates_helpdesk_tickets')
    .select('*')
    .eq('ticket_number', ticketNumber)
    .single();

  if (error) {
    console.error('Error fetching helpdesk ticket:', error);
    return null;
  }

  return data;
}

/**
 * Input for creating a ticket
 */
export interface CreateTicketInput {
  organization_id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status?: TicketStatus;
  location?: string;
  asset_id?: string;
  compliance_domain?: string;
  statutory_check_id?: string;
  custom_check_id?: string;
  reported_by: string;
  reported_by_email?: string;
  reported_by_phone?: string;
  assigned_to?: string;
  team_id?: string;
  assigned_contractor_id?: string;
  contractor_id?: string;
  estimated_cost?: number;
  actual_cost?: number;
  attachments?: string[];
  statutory_completion_id?: string;
  ticket_type?: string;
  created_via?: string;
  evidence_urls?: string[];
}

/**
 * Create a new helpdesk ticket
 */
export async function createHelpdeskTicket(input: CreateTicketInput & Record<string, unknown>): Promise<HelpdeskTicket> {
  const supabase = createServiceRoleClient();

  // Build an explicit row to avoid passing through unrelated fields
  // (e.g. camelCase organizationId from the API body) that would break the insert.
  const row: Record<string, unknown> = {
    organization_id: input.organization_id,
    title: input.title,
    description: input.description,
    category: input.category || 'general',
    priority: input.priority || 'medium',
    status: input.status || 'open',
    raised_by: input.reported_by,  // DB column is raised_by, not reported_by
    asset_id: input.asset_id || null,
    assigned_to: input.assigned_to || null,
    team_id: input.team_id || null,
    assigned_contractor_id:
      input.assigned_contractor_id || input.contractor_id || null,
    contractor_id: input.contractor_id || null,
    compliance_domain: input.compliance_domain || null,
    statutory_check_id: input.statutory_check_id || null,
    custom_check_id: input.custom_check_id || null,
    estimated_cost: input.estimated_cost || null,
    actual_cost: input.actual_cost || null,
    attachment_urls: input.attachments || [],
    statutory_completion_id: input.statutory_completion_id || null,
    module: 'estates',
  };

  // Optional extended fields from Task 022 migration
  if ('ticket_type' in input) row.ticket_type = input.ticket_type;
  if ('created_via' in input) row.created_via = input.created_via;
  if ('safeguarding_flag' in input) row.safeguarding_flag = input.safeguarding_flag;
  if ('risk_score' in input) row.risk_score = input.risk_score;
  if ('linked_compliance_check_id' in input) row.linked_compliance_check_id = input.linked_compliance_check_id;
  if ('evidence_urls' in input) row.evidence_urls = input.evidence_urls;
  if ('due_date' in input) row.due_date = input.due_date;

  // Remove undefined to avoid overriding defaults
  for (const k of Object.keys(row)) {
    if (row[k] === undefined) delete row[k];
  }

  const { data, error } = await supabase
    .from('estates_helpdesk_tickets')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('Error creating helpdesk ticket:', error);
    throw new Error(`Failed to create helpdesk ticket: ${error.message}`);
  }

  return data;
}

/**
 * Input for updating a ticket
 */
export type UpdateTicketInput = Partial<Omit<CreateTicketInput, 'organization_id' | 'reported_by'>> & {
  status?: TicketStatus;
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
};

/**
 * Update a helpdesk ticket.
 * organizationId is required to prevent cross-tenant writes via the service role.
 * Only whitelisted columns in UPDATABLE_TICKET_COLUMNS can be updated.
 */
export async function updateHelpdeskTicket(
  ticketId: string,
  updates: UpdateTicketInput,
  organizationId?: string,
): Promise<HelpdeskTicket> {
  const supabase = createServiceRoleClient();

  // Apply column whitelist to prevent callers from overwriting immutable fields
  const safeUpdates = pickUpdatableTicketColumns(updates as unknown as Record<string, unknown>);
  safeUpdates.updated_at = new Date().toISOString();

  let query = supabase
    .from('estates_helpdesk_tickets')
    .update(safeUpdates)
    .eq('id', ticketId);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { data, error } = await query.select().single();

  if (error) {
    console.error('Error updating helpdesk ticket:', error);
    throw new Error('Failed to update helpdesk ticket');
  }

  return data;
}

/**
 * Delete a helpdesk ticket.
 * organizationId is required to prevent cross-tenant deletes via the service role.
 */
export async function deleteHelpdeskTicket(
  ticketId: string,
  organizationId?: string,
): Promise<void> {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('estates_helpdesk_tickets')
    .delete()
    .eq('id', ticketId);

  if (organizationId) {
    query = query.eq('organization_id', organizationId);
  }

  const { error } = await query;

  if (error) {
    console.error('Error deleting helpdesk ticket:', error);
    throw new Error('Failed to delete helpdesk ticket');
  }
}

/**
 * Get open tickets
 */
export async function getOpenTickets(
  organizationId: string,
  pagination?: PaginationOptions
): Promise<PaginatedResponse<HelpdeskTicket>> {
  return getHelpdeskTickets(organizationId, { status: 'open' }, pagination);
}

/**
 * Get high priority tickets
 */
export async function getHighPriorityTickets(
  organizationId: string,
  pagination?: PaginationOptions
): Promise<PaginatedResponse<HelpdeskTicket>> {
  return getHelpdeskTickets(organizationId, { priority: 'critical' }, pagination);
}
