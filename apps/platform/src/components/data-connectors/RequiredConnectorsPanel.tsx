"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Link2, AlertCircle } from 'lucide-react';
import { ConnectorCardV2 } from './ConnectorCardV2';
import { supabase } from '@/lib/supabase';
import type { Connector } from '@/lib/data-connectors/types';

interface RequiredConnectorsPanelProps {
  consumerId: string;
  title?: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

export function RequiredConnectorsPanel({ consumerId, title = 'Required Data Connectors' }: RequiredConnectorsPanelProps) {
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/connectors/registry?consumer=${encodeURIComponent(consumerId)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setConnectors(data.data?.connectors ?? []);
      }
      setLoading(false);
    }
    load();
  }, [consumerId]);

  if (loading) return null;
  if (connectors.length === 0) return null;

  const activeCount = connectors.filter(c => c.status === 'active').length;
  const setupNeeded = connectors.filter(c => c.status === 'setup-needed');

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <Link2 className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {activeCount} of {connectors.length} connected
        </span>
      </div>

      {setupNeeded.length > 0 && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span className="text-[11px] text-amber-500 font-semibold">
            {setupNeeded.length} connector{setupNeeded.length > 1 ? 's' : ''} need setup
          </span>
          <Link
            href="/dashboard/settings/connectors"
            className="ml-auto text-[10px] font-bold text-amber-500 hover:text-amber-400"
          >
            Set up →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {connectors.map(c => (
          <ConnectorCardV2 key={c.id} connector={c} />
        ))}
      </div>
    </div>
  );
}
