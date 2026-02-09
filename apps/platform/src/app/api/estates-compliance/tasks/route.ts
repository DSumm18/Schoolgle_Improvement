/**
 * API Route: Task Actions (Snooze, Mark N/A)
 *
 * POST /api/estates-compliance/tasks
 * Actions: snooze, mark_na
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getLatestCompletion,
  updateCompletion,
  type StatutoryCompletion,
} from '@/lib/estates-compliance/database/statutory-completions';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface SnoozeRequest {
  action: 'snooze';
  organization_id: string;
  check_id: string;
  new_due_date: string;
  reason?: string;
}

interface MarkNARequest {
  action: 'mark_na';
  organization_id: string;
  check_id: string;
  reason: string;
  reason_category: 'not_applicable_site' | 'service_outsourced' | 'equipment_not_present' | 'other';
}

type TaskActionRequest = SnoozeRequest | MarkNARequest;

interface AuditLogEntry {
  organization_id: string;
  user_id: string;
  action_type: 'snoozed' | 'marked_not_applicable';
  check_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

/**
 * POST: Handle task actions (snooze, mark N/A)
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TaskActionRequest;
    const { action, organization_id, check_id } = body;

    if (!organization_id || !check_id) {
      return NextResponse.json(
        { error: 'organization_id and check_id are required' },
        { status: 400 }
      );
    }

    if (!action || !['snooze', 'mark_na'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use: snooze, mark_na' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user is member of the organization
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get the latest completion record
    const completion = await getLatestCompletion(organization_id, check_id);

    if (!completion) {
      return NextResponse.json(
        { error: 'Check not found' },
        { status: 404 }
      );
    }

    let result: StatutoryCompletion;
    let auditLog: AuditLogEntry;

    switch (action) {
      case 'snooze': {
        const snoozeBody = body as SnoozeRequest;
        const { new_due_date, reason } = snoozeBody;

        if (!new_due_date) {
          return NextResponse.json(
            { error: 'new_due_date is required for snooze action' },
            { status: 400 }
          );
        }

        // Validate the new date is in the future
        const newDate = new Date(new_due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (newDate < today) {
          return NextResponse.json(
            { error: 'New due date must be in the future' },
            { status: 400 }
          );
        }

        // Update the completion with new due date
        result = await updateCompletion(completion.id, {
          next_due_date: new_due_date,
          // Keep status as pending if it was pending or overdue
          status: completion.status === 'overdue' ? 'pending' : completion.status,
          rag_status: 'amber',
        });

        // Create audit log entry
        auditLog = {
          organization_id,
          user_id: user.id,
          action_type: 'snoozed',
          check_id,
          details: {
            previous_due_date: completion.next_due_date,
            new_due_date: new_due_date,
            reason: reason || 'No reason provided',
          },
          created_at: new Date().toISOString(),
        };

        break;
      }

      case 'mark_na': {
        const markNABody = body as MarkNARequest;
        const { reason, reason_category } = markNABody;

        if (!reason) {
          return NextResponse.json(
            { error: 'reason is required for mark_na action' },
            { status: 400 }
          );
        }

        // Update the completion to not_applicable
        result = await updateCompletion(completion.id, {
          status: 'not_applicable',
          rag_status: 'green',
          completion_notes: `Marked N/A: ${reason} (${reason_category})`,
        });

        // Create audit log entry
        auditLog = {
          organization_id,
          user_id: user.id,
          action_type: 'marked_not_applicable',
          check_id,
          details: {
            previous_status: completion.status,
            reason,
            reason_category,
          },
          created_at: new Date().toISOString(),
        };

        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Add audit log entry to estates_audit_log table
    const { error: logError } = await supabase
      .from('estates_audit_log')
      .insert(auditLog);

    if (logError) {
      // Log the error but don't fail the request
      console.error('[Task Actions] Failed to create audit log:', logError);
    }

    return NextResponse.json({
      success: true,
      completion: result,
      audit_logged: !logError,
    });

  } catch (error) {
    console.error('[Task Actions Error]', error);
    return NextResponse.json(
      { error: 'Failed to process task action' },
      { status: 500 }
    );
  }
}

/**
 * GET: Fetch task details for a check
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const checkId = searchParams.get('check_id');

    if (!organizationId || !checkId) {
      return NextResponse.json(
        { error: 'organization_id and check_id are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user is member of the organization
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const completion = await getLatestCompletion(organizationId, checkId);

    if (!completion) {
      return NextResponse.json(
        { error: 'Check not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      completion,
    });

  } catch (error) {
    console.error('[Task Actions GET Error]', error);
    return NextResponse.json(
      { error: 'Failed to fetch task details' },
      { status: 500 }
    );
  }
}
