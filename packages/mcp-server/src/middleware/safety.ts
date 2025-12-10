/**
 * Tool Safety Middleware
 * 
 * GDPR & Safeguarding Compliance:
 * - Logs every tool request/response
 * - Blocks high-risk tools requiring human approval
 * - Sanitizes sensitive data in audit logs
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthContext } from '@schoolgle/core/auth';

export interface ToolRequest {
  toolName: string;
  inputs: Record<string, any>;
  context: AuthContext;
}

export interface ToolResponse {
  success: boolean;
  data?: any;
  error?: string;
  requiresApproval?: boolean;
  approvalRequestId?: string;
}

export interface ToolDefinition {
  tool_key: string;
  tool_name: string;
  description: string;
  module_key: string;
  risk_level: 'low' | 'medium' | 'high';
  requires_approval: boolean;
  approval_required_for: string[] | null;
  sanitize_inputs: boolean;
  sensitive_fields: string[] | null;
}

/**
 * Sanitize inputs for audit logging
 * Removes sensitive fields to comply with GDPR
 */
function sanitizeInputs(
  inputs: Record<string, any>,
  sensitiveFields: string[] | null
): Record<string, any> {
  if (!sensitiveFields || sensitiveFields.length === 0) {
    return inputs;
  }

  const sanitized = { ...inputs };
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Check if tool requires approval based on inputs
 */
function requiresApproval(
  toolDef: ToolDefinition,
  inputs: Record<string, any>
): boolean {
  if (!toolDef.requires_approval) {
    return false;
  }

  // Check if any approval-required actions are in inputs
  if (toolDef.approval_required_for) {
    for (const action of toolDef.approval_required_for) {
      if (inputs[action] !== undefined && inputs[action] !== null) {
        return true;
      }
    }
  }

  // High-risk tools always require approval
  return toolDef.risk_level === 'high';
}

/**
 * Tool Safety Middleware
 * 
 * 1. Logs request to audit_logs table
 * 2. Checks if tool requires approval
 * 3. Blocks execution if approval required
 * 4. Logs response after execution
 */
export class ToolSafetyMiddleware {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Process tool request through safety middleware
   */
  async processRequest(
    request: ToolRequest,
    toolHandler: (request: ToolRequest) => Promise<any>
  ): Promise<ToolResponse> {
    const { toolName, inputs, context } = request;

    // Get tool definition
    const { data: toolDef, error: toolDefError } = await this.supabase
      .from('tool_definitions')
      .select('*')
      .eq('tool_key', toolName)
      .eq('is_active', true)
      .single();

    if (toolDefError || !toolDef) {
      return {
        success: false,
        error: `Tool ${toolName} not found or inactive`
      };
    }

    // Sanitize inputs for audit log
    const sanitizedInputs = toolDef.sanitize_inputs
      ? sanitizeInputs(inputs, toolDef.sensitive_fields)
      : inputs;

    // Create audit log entry
    const auditLogId = crypto.randomUUID();
    const { error: auditError } = await this.supabase
      .from('tool_audit_logs')
      .insert({
        id: auditLogId,
        organization_id: context.organizationId,
        user_id: context.userId.startsWith('api_key:') ? null : context.userId,
        tool_name: toolName,
        tool_module_key: toolDef.module_key,
        request_inputs: sanitizedInputs,
        request_timestamp: new Date().toISOString(),
        risk_level: toolDef.risk_level,
        requires_approval: false, // Will update if needed
        response_status: 'pending_approval'
      });

    if (auditError) {
      console.error('[ToolSafety] Failed to create audit log:', auditError);
      // Continue execution but log error
    }

    // Check if approval is required
    const needsApproval = requiresApproval(toolDef, inputs);

    if (needsApproval) {
      // Update audit log with approval requirement
      await this.supabase
        .from('tool_audit_logs')
        .update({
          requires_approval: true,
          response_status: 'pending_approval'
        })
        .eq('id', auditLogId);

      // Block execution and return approval required response
      return {
        success: false,
        requiresApproval: true,
        approvalRequestId: auditLogId,
        error: `Tool ${toolName} requires human approval before execution. Please approve via dashboard.`
      };
    }

    // Execute tool handler
    let responseData: any;
    let responseError: string | undefined;
    let responseStatus: 'success' | 'error' = 'success';

    try {
      responseData = await toolHandler(request);
    } catch (error) {
      responseError = error instanceof Error ? error.message : 'Unknown error';
      responseStatus = 'error';
    }

    // Sanitize response for audit log
    const sanitizedResponse = toolDef.sanitize_inputs
      ? sanitizeInputs(responseData || {}, toolDef.sensitive_fields)
      : responseData;

    // Update audit log with response
    await this.supabase
      .from('tool_audit_logs')
      .update({
        response_output: sanitizedResponse,
        response_timestamp: new Date().toISOString(),
        response_status: responseStatus,
        error_message: responseError || null
      })
      .eq('id', auditLogId);

    if (responseError) {
      return {
        success: false,
        error: responseError
      };
    }

    return {
      success: true,
      data: responseData
    };
  }

  /**
   * Approve a pending tool request
   */
  async approveRequest(
    auditLogId: string,
    approvedBy: string,
    context: AuthContext
  ): Promise<{ success: boolean; error?: string }> {
    // Get audit log
    const { data: auditLog, error: fetchError } = await this.supabase
      .from('tool_audit_logs')
      .select('*')
      .eq('id', auditLogId)
      .eq('organization_id', context.organizationId)
      .single();

    if (fetchError || !auditLog) {
      return {
        success: false,
        error: 'Audit log not found'
      };
    }

    if (auditLog.approved_at) {
      return {
        success: false,
        error: 'Request already approved'
      };
    }

    // Update audit log with approval
    const { error: updateError } = await this.supabase
      .from('tool_audit_logs')
      .update({
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        requires_approval: false
      })
      .eq('id', auditLogId);

    if (updateError) {
      return {
        success: false,
        error: updateError.message
      };
    }

    return { success: true };
  }
}


