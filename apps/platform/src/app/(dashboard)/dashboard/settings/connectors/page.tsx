"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plug, Plus, ArrowLeft } from 'lucide-react';
import { ModulePageHeader } from '@/components/ui/module-page-header';
import { ConnectorLayerSection } from '@/components/data-connectors/ConnectorLayerSection';
import { supabase } from '@/lib/supabase';
import type { Connector } from '@/lib/data-connectors/types';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

export default function ConnectorsPage() {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const headers = await getAuthHeaders();
    const res = await fetch('/api/connectors/registry', { headers });
    if (res.ok) {
      const data = await res.json();
      setConnectors(data.data?.connectors ?? []);
    }
    setLoading(false);
  }

  const l1 = connectors.filter(c => c.layer === 1);
  const l2 = connectors.filter(c => c.layer === 2);
  const l3 = connectors.filter(c => c.layer === 3);
  const l4 = connectors.filter(c => c.layer === 4);

  const activeCount = connectors.filter(c => c.status === 'active').length;
  const setupNeededCount = connectors.filter(c => c.status === 'setup-needed').length;
  const plannedCount = connectors.filter(c => c.status === 'planned').length;

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1400px] mx-auto">
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Settings
      </Link>

      <ModulePageHeader
        moduleId="intelligence"
        icon={Plug}
        label="Settings"
        title="Connector Registry"
        description="Every module pulls data through connectors. Four layers: we-control, school-control, bring-your-own, and derived reports. This is the universal data primitive."
      />

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-extrabold text-foreground">{connectors.length}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total</div>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-card p-4 text-center">
          <div className="text-2xl font-extrabold text-emerald-500">{activeCount}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Active</div>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-card p-4 text-center">
          <div className="text-2xl font-extrabold text-amber-500">{setupNeededCount}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Setup Needed</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-extrabold text-muted-foreground">{plannedCount}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Planned</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-sm text-muted-foreground">Loading registry...</div>
      ) : (
        <>
          <ConnectorLayerSection layer={1} connectors={l1} />
          <ConnectorLayerSection layer={2} connectors={l2} />
          <ConnectorLayerSection
            layer={3}
            connectors={l3}
            extraAction={
              <Link
                href="/dashboard/settings/connectors/byo/new"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-500/15 text-purple-500 border border-purple-500/30 text-xs font-semibold hover:bg-purple-500/25 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add BYO Connector
              </Link>
            }
          />
          <ConnectorLayerSection layer={4} connectors={l4} />
        </>
      )}
    </div>
  );
}
