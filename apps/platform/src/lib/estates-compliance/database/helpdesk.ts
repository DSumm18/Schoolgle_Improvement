/**
 * Helpdesk Database Layer
 *
 * Functions for interacting with estates_helpdesk_tickets table.
 */

import { createClient } from '@/lib/supabase/server';
import type {
  HelpdeskTicket,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from '@/types/estates-compliance';

/**
 * Filters for ticket queries
 */
export interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigned_to?: string;
  reported_by?: string;
  asset_id?: string;
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
  const supabase = await createClient();

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
    query = query.eq('reported_by', filters.reported_by);
  }
  if (filters?.asset_id) {
    query = query.eq('asset_id', filters.asset_id);
  }
  if (filters?.location) {
    query = query.eq('location', filters.location);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,ticket_number.ilike.%${filters.search}%`);
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
 * Get a single helpdesk ticket by ID
 */
export async function getHelpdeskTicketById(ticketId: string): Promise<HelpdeskTicket | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('estates_helpdesk_tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (error) {
    console.error('Error fetching helpdesk ticket:', error);
    return null;
  }

  return data;
}

/**
 * Get a helpdesk ticket by ticket number
 */
export async function getHelpdeskTicketByNumber(ticketNumber: string): Promise<HelpdeskTicket | null> {
  const supabase = await createClient();

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
  reported_by: string;
  reported_by_email?: string;
  reported_by_phone?: string;
  assigned_to?: string;
  estimated_cost?: number;
  actual_cost?: number;
  attachments?: string[];
}

/**
 * Create a new helpdesk ticket
 */
export async function createHelpdeskTicket(input: CreateTicketInput): Promise<HelpdeskTicket> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('estates_helpdesk_tickets')
    .insert({
      ...input,
      status: input.status || 'open',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating helpdesk ticket:', error);
    throw new Error('Failed to create helpdesk ticket');
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
 * Update a helpdesk ticket
 */
export async function updateHelpdeskTicket(
  ticketId: string,
  updates: UpdateTicketInput
): Promise<HelpdeskTicket> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('estates_helpdesk_tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single();

  if (error) {
    console.error('Error updating helpdesk ticket:', error);
    throw new Error('Failed to update helpdesk ticket');
  }

  return data;
}

/**
 * Delete a helpdesk ticket
 */
export async function deleteHelpdeskTicket(ticketId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('estates_helpdesk_tickets')
    .delete()
    .eq('id', ticketId);

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
