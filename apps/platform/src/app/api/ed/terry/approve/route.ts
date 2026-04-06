/**
 * Terry Taurus — Proposal Approval Endpoint
 *
 * POST /api/ed/terry/approve
 *
 * Handles approval, rejection, or modification of a TerryProposal.
 * Every decision is logged to ed_audit_log regardless of outcome.
 */

import { NextRequest } from 'next/server';
import { protectedRoute, apiSuccess, apiError } from '@/lib/api-utils';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { executeApprovedProposal } from '@/lib/ed/specialists/terry/handler';

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const body = await req.json();
  const { proposal, decision, reason, modifications } = body;
  // decision: 'approved' | 'rejected' | 'modified'

  if (!proposal || !decision) {
    return apiError('Missing proposal or decision', 400);
  }

  if (!['approved', 'rejected', 'modified'].includes(decision)) {
    return apiError('Invalid decision value. Must be: approved, rejected, or modified', 400);
  }

  const supabase = createServiceRoleClient();

  // Log every decision to ed_audit_log for complete audit trail
  const { error: logError } = await supabase.from('ed_audit_log').insert({
    organization_id: auth.organizationId,
    user_id: auth.userId,
    user_email: auth.email,
    action_type: proposal.tool,
    ai_proposal: proposal,
    ai_confidence: proposal.confidence,
    user_decision: decision,
    user_modifications: modifications || null,
    rejection_reason: reason || null,
    ed_model_version: 'terry-taurus-v1',
    created_at: new Date().toISOString(),
  });

  if (logError) {
    // Non-fatal — log the error but continue. Audit failure shouldn't block the action.
    console.error('[Terry Approve] Audit log insert failed:', logError.message);
  }

  if (decision === 'rejected') {
    return apiSuccess({ status: 'rejected', message: 'Proposal rejected and logged.' });
  }

  // Apply modifications if provided (for 'modified' decision)
  const finalProposal =
    modifications
      ? { ...proposal, fields: { ...proposal.fields, ...modifications } }
      : proposal;

  // Execute the approved (or modified) proposal via the platform skill
  const result = await executeApprovedProposal(
    finalProposal,
    auth.email || auth.userId,
  );

  if (!result.success) {
    return apiError(result.error || 'Failed to execute approved proposal', 500);
  }

  return apiSuccess({
    status: 'approved',
    data: result.data,
    message: 'Proposal approved and executed successfully.',
  });
});
