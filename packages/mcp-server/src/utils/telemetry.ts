/**
 * Telemetry Logging
 * 
 * Logs tool usage for cost tracking and investor narrative.
 * 
 * Purpose:
 * - Prove deterministic vs LLM usage
 * - Support pricing & investor narrative
 * - Track cost per tool
 */

export type TelemetryOutcome = 
  | 'success' 
  | 'no_rules_found' 
  | 'rules_filtered_no_citations' 
  | 'insufficient_data'
  | 'error';

export interface TelemetryLog {
  tool_name: string;
  used_llm: boolean;
  model?: string;
  timestamp: string;
  organization_id?: string;
  user_id?: string;
  duration_ms?: number;
  request_id?: string; // Unique request ID for tracing
  session_id?: string; // Session ID for grouping related requests
  outcome: TelemetryOutcome; // Outcome of the tool call
  error_code?: string; // Error code if outcome is 'error'
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Log telemetry to Supabase if configured, otherwise console
 */
export async function logTelemetry(
  log: TelemetryLog,
  supabase?: any
): Promise<void> {
  const timestamp = new Date().toISOString();
  
  // Try Supabase first
  if (supabase) {
    try {
      await supabase
        .from('tool_telemetry')
        .insert({
          tool_name: log.tool_name,
          used_llm: log.used_llm,
          model: log.model || null,
          timestamp: log.timestamp || timestamp,
          organization_id: log.organization_id || null,
          user_id: log.user_id || null,
          duration_ms: log.duration_ms || null,
          request_id: log.request_id || null,
          session_id: log.session_id || null,
          outcome: log.outcome,
          error_code: log.error_code || null,
          token_usage: log.token_usage ? JSON.stringify(log.token_usage) : null,
        });
      return;
    } catch (error) {
      console.warn('[Telemetry] Supabase logging failed, using console fallback:', error);
    }
  }
  
  // Console fallback
  console.log('[Telemetry]', JSON.stringify({
    ...log,
    timestamp: log.timestamp || timestamp,
  }));
}

/**
 * Wrap a tool handler with telemetry
 */
export function withTelemetry<T extends any[], R>(
  toolName: string,
  usesLLM: boolean,
  handler: (...args: T) => Promise<R>,
  supabase?: any,
  context?: { organizationId?: string; userId?: string }
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    let model: string | undefined;
    
    try {
      const result = await handler(...args);
      const duration = Date.now() - startTime;
      
      // Extract model from result if it's an LLM call
      if (usesLLM && typeof result === 'object' && result !== null) {
        model = (result as any).model || 'unknown';
      }
      
      await logTelemetry(
        {
          tool_name: toolName,
          used_llm: usesLLM,
          model,
          timestamp: new Date().toISOString(),
          organization_id: context?.organizationId,
          user_id: context?.userId,
          duration_ms: duration,
        },
        supabase
      );
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await logTelemetry(
        {
          tool_name: toolName,
          used_llm: usesLLM,
          model,
          timestamp: new Date().toISOString(),
          organization_id: context?.organizationId,
          user_id: context?.userId,
          duration_ms: duration,
        },
        supabase
      );
      
      throw error;
    }
  };
}

