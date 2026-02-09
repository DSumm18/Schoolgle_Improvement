/**
 * HelpdeskService - Business logic for helpdesk ticket management
 */

import {
  getHelpdeskTickets,
  getHelpdeskTicketById,
  getHelpdeskTicketByNumber,
  createHelpdeskTicket,
  updateHelpdeskTicket,
  deleteHelpdeskTicket,
  getOpenTickets,
  getHighPriorityTickets,
  type CreateTicketInput,
  type UpdateTicketInput,
  type TicketFilters,
  type PaginatedResponse,
} from '../database/helpdesk';
import type { HelpdeskTicket, TicketStatus } from '@/types/estates-compliance';

/**
 * Service class for managing helpdesk tickets
 */
export class HelpdeskService {
  /**
   * List tickets with optional filters and pagination
   */
  static async list(
    organizationId: string,
    filters?: TicketFilters,
    pagination?: { page: number; pageSize: number }
  ): Promise<PaginatedResponse<HelpdeskTicket>> {
    return getHelpdeskTickets(organizationId, filters, pagination);
  }

  /**
   * Get a single ticket by ID
   */
  static async getById(ticketId: string): Promise<HelpdeskTicket | null> {
    return getHelpdeskTicketById(ticketId);
  }

  /**
   * Get a single ticket by ticket number
   */
  static async getByNumber(ticketNumber: string): Promise<HelpdeskTicket | null> {
    return getHelpdeskTicketByNumber(ticketNumber);
  }

  /**
   * Create a new ticket
   */
  static async create(organizationId: string, input: Omit<CreateTicketInput, 'organization_id'>): Promise<HelpdeskTicket> {
    const ticket = await createHelpdeskTicket({
      ...input,
      organization_id: organizationId,
    });

    // TODO: Send email notifications
    // - To the reporter confirming receipt
    // - To assigned user if assigned
    // - To estates team for high priority tickets

    return ticket;
  }

  /**
   * Update an existing ticket
   */
  static async update(ticketId: string, updates: UpdateTicketInput): Promise<HelpdeskTicket> {
    return updateHelpdeskTicket(ticketId, updates);
  }

  /**
   * Delete a ticket
   */
  static async delete(ticketId: string): Promise<void> {
    return deleteHelpdeskTicket(ticketId);
  }

  /**
   * Assign ticket to a user
   */
  static async assign(ticketId: string, userId: string): Promise<HelpdeskTicket> {
    const ticket = await this.update(ticketId, { assigned_to: userId });

    // TODO: Send email notification to assigned user

    return ticket;
  }

  /**
   * Update ticket status
   */
  static async updateStatus(ticketId: string, status: TicketStatus): Promise<HelpdeskTicket> {
    return this.update(ticketId, { status });
  }

  /**
   * Resolve a ticket
   */
  static async resolve(
    ticketId: string,
    userId: string,
    resolutionNotes: string,
    actualCost?: number
  ): Promise<HelpdeskTicket> {
    const ticket = await this.update(ticketId, {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
      resolution_notes: resolutionNotes,
      actual_cost: actualCost,
    });

    // TODO: Send email notification to reporter

    return ticket;
  }

  /**
   * Reopen a resolved ticket
   */
  static async reopen(ticketId: string, reason: string): Promise<HelpdeskTicket> {
    return this.update(ticketId, {
      status: 'open',
      resolution_notes: `Reopened: ${reason}`,
    });
  }

  /**
   * Get open tickets
   */
  static async getOpen(
    organizationId: string,
    pagination?: { page: number; pageSize: number }
  ): Promise<PaginatedResponse<HelpdeskTicket>> {
    return getOpenTickets(organizationId, pagination);
  }

  /**
   * Get high priority tickets
   */
  static async getHighPriority(
    organizationId: string,
    pagination?: { page: number; pageSize: number }
  ): Promise<PaginatedResponse<HelpdeskTicket>> {
    return getHighPriorityTickets(organizationId, pagination);
  }

  /**
   * Get ticket statistics for dashboard
   */
  static async getStats(organizationId: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    highPriority: number;
  }> {
    const [allTickets, openTickets, highPriority] = await Promise.all([
      this.list(organizationId, undefined, { page: 1, pageSize: 1000 }),
      this.getOpen(organizationId, { page: 1, pageSize: 1000 }),
      this.getHighPriority(organizationId, { page: 1, pageSize: 1000 }),
    ]);

    const inProgress = allTickets.data.filter(t => t.status === 'in_progress').length;
    const resolved = allTickets.data.filter(t => t.status === 'resolved').length;
    const closed = allTickets.data.filter(t => t.status === 'closed').length;

    return {
      total: allTickets.total,
      open: openTickets.total,
      inProgress,
      resolved,
      closed,
      highPriority: highPriority.total,
    };
  }

  /**
   * Add a comment to a ticket
   */
  static async addComment(
    ticketId: string,
    userId: string,
    comment: string,
    isInternal: boolean = false
  ): Promise<void> {
    // TODO: Implement comment creation
    // This would add an entry to estates_helpdesk_comments table
  }

  /**
   * Escalate a ticket
   */
  static async escalate(ticketId: string, reason: string, escalatedTo: string): Promise<HelpdeskTicket> {
    const ticket = await this.getById(ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    return this.update(ticketId, {
      priority: 'critical',
      assigned_to: escalatedTo,
    });
  }
}
