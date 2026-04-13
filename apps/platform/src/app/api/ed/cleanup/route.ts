import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * POST /api/ed/cleanup
 * Delete expired chat cache entries based on each school's retention settings.
 * Protected by a simple secret header — intended for cron jobs, not user access.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  let totalDeleted = 0;

  try {
    // Get all orgs with memory settings
    const { data: settings } = await supabase
      .from('ed_memory_settings')
      .select('organization_id, chat_cache_retention_days');

    // Delete expired entries for orgs with custom settings
    const orgIdsWithSettings = new Set<string>();

    if (settings) {
      for (const setting of settings) {
        orgIdsWithSettings.add(setting.organization_id);

        if (setting.chat_cache_retention_days === 0) {
          // Retention disabled — delete ALL cache for this org
          const { data } = await supabase
            .from('ed_chat_cache')
            .delete()
            .eq('organization_id', setting.organization_id)
            .select('id');

          totalDeleted += data?.length ?? 0;
        } else {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - setting.chat_cache_retention_days);

          const { data } = await supabase
            .from('ed_chat_cache')
            .delete()
            .eq('organization_id', setting.organization_id)
            .lt('created_at', cutoff.toISOString())
            .select('id');

          totalDeleted += data?.length ?? 0;
        }
      }
    }

    // Default 7-day cleanup for orgs WITHOUT settings rows
    const defaultCutoff = new Date();
    defaultCutoff.setDate(defaultCutoff.getDate() - 7);

    // Get distinct org IDs that have expired cache entries but no settings
    const { data: allCacheOrgs } = await supabase
      .from('ed_chat_cache')
      .select('organization_id')
      .lt('created_at', defaultCutoff.toISOString());

    if (allCacheOrgs) {
      const defaultOrgs = new Set(
        allCacheOrgs
          .map((r: any) => r.organization_id)
          .filter((id: string) => !orgIdsWithSettings.has(id))
      );

      for (const orgId of defaultOrgs) {
        const { data } = await supabase
          .from('ed_chat_cache')
          .delete()
          .eq('organization_id', orgId)
          .lt('created_at', defaultCutoff.toISOString())
          .select('id');

        totalDeleted += data?.length ?? 0;
      }
    }

    return NextResponse.json({
      success: true,
      deleted: totalDeleted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Ed Cleanup] Error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}
