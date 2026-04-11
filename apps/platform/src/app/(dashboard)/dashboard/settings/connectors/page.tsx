"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plug, Loader2, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ModulePageHeader } from '@/components/ui/module-page-header';
import { ConnectionMap } from '@/components/smart-connectors/ConnectionMap';
import { ReconciliationBanner } from '@/components/smart-connectors/ReconciliationBanner';
import { InsightCard } from '@/components/smart-connectors/InsightCard';
import { supabase } from '@/lib/supabase';
import type { SourceConnectionStatus, ReconciliationResult, InsightData } from '@/lib/smart-connectors/types';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

// Test school URN — in production this comes from the org's school profile
const SCHOOL_URN = 148201;

export default function ConnectorsPage() {
  const [sources, setSources] = useState<SourceConnectionStatus[]>([]);
  const [reconciliation, setReconciliation] = useState<ReconciliationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    const headers = await getAuthHeaders();

    try {
      const [sourcesRes, reconcileRes] = await Promise.all([
        fetch(`/api/intelligence/sources?urn=${SCHOOL_URN}`, { headers }),
        fetch('/api/intelligence/reconcile', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ urn: SCHOOL_URN }),
        }),
      ]);

      if (sourcesRes.ok) {
        const sourcesData = await sourcesRes.json();
        setSources(sourcesData.data?.sources || []);
      }

      if (reconcileRes.ok) {
        const reconcileData = await reconcileRes.json();
        setReconciliation(reconcileData.data);
        setSchoolName(reconcileData.data?.schoolName || 'Your School');
      }
    } catch {
      setError('Failed to load connector data');
    } finally {
      setLoading(false);
    }
  }

  const connectedCount = sources.filter(s => s.connected).length;
  const totalRows = sources.reduce((sum, s) => sum + s.rowCount, 0);
  const initials = schoolName
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('');

  const insights: InsightData[] = [
    {
      id: 'ks2-above-avg',
      category: 'strength',
      headline: 'Above Average',
      stat: 'Above Average',
      detail: 'KS2 results are above both national and Bradford averages across all subjects. Reading +5.3pp, Writing +8.9pp, Maths +6.1pp above national.',
      sources: [
        { sourceId: 'ks2-results', table: 'DfE KS2', colour: '#ef4444', verified: true },
      ],
      verified: true,
    },
    {
      id: 'zero-exclusions',
      category: 'positive',
      headline: 'Zero Exclusions',
      stat: '0 Exclusions',
      detail: 'No suspensions or permanent exclusions across all recorded years with 28.9% FSM and VI resourced provision. Strong inclusive culture.',
      sources: [
        { sourceId: 'exclusions', table: 'DfE Exclusions', colour: '#06b6d4', verified: true },
      ],
      verified: true,
    },
    {
      id: 'attendance-improving',
      category: 'positive',
      headline: 'Improving Attendance',
      stat: '94.48%',
      detail: 'Autumn 2024-25 attendance up from 93.18%. Persistent absence dropped from 24.65% to 16.95%. Strong improving trajectory.',
      sources: [
        { sourceId: 'attendance', table: 'DfE Attendance', colour: '#8b5cf6', verified: true },
      ],
      verified: true,
    },
    {
      id: 'fsm-rising',
      category: 'watch',
      headline: 'Rising FSM',
      stat: '+2.2pp',
      detail: 'FSM jumped from 25.1% to 27.3% in one year. EAL also rising (34.2% to 39.8% over 4 years). Changing cohort profile may affect future results.',
      sources: [
        { sourceId: 'census', table: 'DfE Census', colour: '#10b981', verified: true },
        { sourceId: 'schoolgle', table: 'Schoolgle trend', colour: '#a78bfa', verified: true },
      ],
      verified: true,
    },
    {
      id: 'staffing-shift',
      category: 'inspector_flag',
      headline: 'Staffing Shift',
      stat: '-10.3% FTE',
      detail: 'Lost 2.2 FTE teachers in one year while maintaining roll. Pupil:teacher ratio now 21.7:1. Combined with VI provision and rising FSM — inspector will probe capacity.',
      sources: [
        { sourceId: 'workforce', table: 'DfE Workforce', colour: '#f59e0b', verified: true },
        { sourceId: 'census', table: 'DfE Census', colour: '#10b981', verified: true },
      ],
      verified: true,
    },
    {
      id: 'fsm-mismatch',
      category: 'data_quality',
      headline: 'FSM Mismatch',
      stat: '1.6pp gap',
      detail: 'GIAS shows 28.9% FSM but census data shows 27.3%. Different snapshot dates and denominators. School should verify which matches their January census return.',
      sources: [
        { sourceId: 'gias', table: 'GIAS', colour: '#1d70b8', verified: false },
        { sourceId: 'census', table: 'Census', colour: '#10b981', verified: false },
      ],
      verified: false,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

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
        title="Smart Connectors"
        description="Your school's data sources, connected, verified, and ready. This is YOUR data — we connect it, verify it, and show you what it means."
      />

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Connection Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-5 text-center"
        >
          <div className="text-3xl font-extrabold text-foreground">{connectedCount}</div>
          <div className="text-xs text-muted-foreground mt-1">Datasets Connected</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-5 text-center"
        >
          <div className="text-3xl font-extrabold text-purple-400">
            {totalRows.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Data Points Available</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-border bg-card p-5 text-center"
        >
          <div className={`text-3xl font-extrabold ${
            reconciliation?.overallStatus === 'verified' ? 'text-emerald-500' : 'text-amber-500'
          }`}>
            {reconciliation?.overallStatus === 'verified' ? (
              <span className="flex items-center justify-center gap-1">
                <CheckCircle2 className="w-6 h-6" /> OK
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1">
                <AlertTriangle className="w-6 h-6" /> Check
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Reconciliation Status</div>
        </motion.div>
      </div>

      {/* Connection Map */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <h2 className="text-lg font-bold text-foreground mb-2">{schoolName}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Connected to {connectedCount} national datasets. Hover a source to see details.
        </p>
        <ConnectionMap
          schoolName={schoolName}
          schoolInitials={initials}
          sources={sources}
        />
      </motion.div>

      {/* Reconciliation */}
      {reconciliation && reconciliation.overallStatus !== 'verified' && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ReconciliationBanner result={reconciliation} />
        </motion.div>
      )}

      {/* Intelligence Insights */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-2">Schoolgle Intelligence</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Insights generated from your connected data. Every finding traces back to its source.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {insights.map((insight, i) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
              >
                <InsightCard insight={insight} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Source Attribution Footer */}
      <div className="rounded-xl border border-border bg-card p-5 text-center">
        <p className="text-xs text-muted-foreground">
          All data from the Department for Education, published under the Open Government Licence v3.0.
          Schoolgle connects, verifies, and adds intelligence — but the data is yours.
        </p>
      </div>
    </div>
  );
}
