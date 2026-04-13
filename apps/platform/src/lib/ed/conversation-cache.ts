/**
 * Ed Conversation Cache — Write + Read helpers
 *
 * Write path: scrub message via SchoolDataGuardian → store in ed_chat_cache
 * Read path: query recent scrubbed messages → format as context block for Ed
 */

import { SchoolDataGuardian } from '../school-data-guardian';

// Types
export interface PreparedMessage {
  role: 'user' | 'assistant';
  scrubbed_content: string;
  domain: string | null;
  was_scrubbed: boolean;
  guardian_categories: string[];
}

export interface CachedMessage {
  role: string;
  scrubbed_content: string;
  domain: string | null;
  created_at: string;
}

export interface MemorySettings {
  exclude_safeguarding: boolean;
  exclude_hr: boolean;
}

/**
 * Scrub PII from a message and prepare it for cache storage
 */
export function scrubAndPrepareMessage(
  content: string,
  role: 'user' | 'assistant',
  domain: string | null,
): PreparedMessage {
  const result = SchoolDataGuardian.scrub(content, {
    callerName: 'ed-conversation-cache',
  });

  return {
    role,
    scrubbed_content: result.sanitised,
    domain,
    was_scrubbed: !result.isClean,
    guardian_categories: result.categoriesDetected,
  };
}

/**
 * Check if a domain should be excluded from cache based on school settings
 */
export function shouldExcludeDomain(
  domain: string | null,
  settings: MemorySettings,
): boolean {
  if (!domain) return false;
  const d = domain.toLowerCase();
  if (settings.exclude_safeguarding && (d === 'safeguarding' || d === 'safeguard')) return true;
  if (settings.exclude_hr && d === 'hr') return true;
  return false;
}

/**
 * Write a conversation message to the cache
 * Returns the conversation_id (creates a new conversation if needed)
 */
export async function writeToCache(
  supabase: any,
  orgId: string,
  userId: string,
  conversationId: string | null,
  message: PreparedMessage,
): Promise<string> {
  let convId = conversationId;

  if (!convId) {
    const { data: conv } = await supabase
      .from('ed_conversations')
      .insert({
        organization_id: orgId,
        user_id: userId,
        domain: message.domain,
      })
      .select('id')
      .single();

    convId = conv?.id;
    if (!convId) return '';
  }

  await supabase.from('ed_chat_cache').insert({
    conversation_id: convId,
    organization_id: orgId,
    user_id: userId,
    role: message.role,
    scrubbed_content: message.scrubbed_content,
    domain: message.domain,
    guardian_categories: message.guardian_categories,
  });

  await supabase
    .from('ed_conversations')
    .update({
      last_message_at: new Date().toISOString(),
      message_count: supabase.rpc ? undefined : 1,
    })
    .eq('id', convId);

  return convId;
}

/**
 * Read recent cached messages for context injection
 */
export async function readRecentContext(
  supabase: any,
  orgId: string,
  userId: string,
  retentionDays: number = 7,
  limit: number = 10,
): Promise<CachedMessage[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const { data } = await supabase
    .from('ed_chat_cache')
    .select('role, scrubbed_content, domain, created_at')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).reverse();
}

/**
 * Get memory settings for a school, with defaults
 */
export async function getMemorySettings(
  supabase: any,
  orgId: string,
): Promise<{ retention_days: number; exclude_safeguarding: boolean; exclude_hr: boolean }> {
  const { data } = await supabase
    .from('ed_memory_settings')
    .select('chat_cache_retention_days, exclude_safeguarding, exclude_hr')
    .eq('organization_id', orgId)
    .single();

  return {
    retention_days: data?.chat_cache_retention_days ?? 7,
    exclude_safeguarding: data?.exclude_safeguarding ?? true,
    exclude_hr: data?.exclude_hr ?? false,
  };
}

/**
 * Format cached messages into a context block for Ed's system prompt
 */
export function formatRecentContext(messages: CachedMessage[]): string {
  if (!messages || messages.length === 0) return '';

  const lines: string[] = ['## Recent conversation context'];

  for (const msg of messages) {
    const date = new Date(msg.created_at);
    const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    const timeLabel = daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`;
    const domain = msg.domain ? ` (${msg.domain})` : '';
    const content = msg.scrubbed_content.length > 200
      ? msg.scrubbed_content.substring(0, 197) + '...'
      : msg.scrubbed_content;
    const roleLabel = msg.role === 'user' ? 'User' : 'Ed';

    lines.push(`- ${timeLabel}${domain} — ${roleLabel}: ${content}`);
  }

  lines.push('');
  lines.push("Use this context to maintain continuity. Don't repeat information the user already knows from prior conversations.");

  return lines.join('\n');
}

/**
 * Delete expired cache entries for a specific org
 */
export async function cleanupExpiredCache(
  supabase: any,
  orgId: string,
  retentionDays: number,
): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);

  const { data } = await supabase
    .from('ed_chat_cache')
    .delete()
    .eq('organization_id', orgId)
    .lt('created_at', cutoff.toISOString())
    .select('id');

  return data?.length ?? 0;
}
