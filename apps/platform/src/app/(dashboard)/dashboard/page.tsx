"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { useAuth } from "@/context/SupabaseAuthContext";
import { AlertTriangle, TrendingDown, TrendingUp, Minus, Sparkles, Brain, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetcher } from "@/lib/fetchers";
import { MODULES, canUserAccess, Role } from "@/lib/modules/registry";

const InterventionTimeline = dynamic(() => import("@/components/InterventionTimeline"), {
  loading: () => <div className="h-40 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />,
  ssr: false
});

const MorningBriefing = dynamic(() => import("@/components/MorningBriefing"), {
  loading: () => <div className="h-40 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />,
  ssr: false
});

interface RiskProfile {
  urn: string;
  schoolName: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedWindow: {
    earliest: string;
    latest: string;
  };
  lastInspection: {
    date: string | null;
    rating: string | null;
    daysSince: number | null;
  };
  headteacher: {
    startDate: string | null;
    tenureMonths: number | null;
    isNew: boolean;
  };
  riskFactors: Array<{
    category: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    impact: number;
  }>;
  recommendations: string[];
}

export default function DashboardPage() {
  const { user, organization } = useAuth();

  // Risk Profile SWR
  const { data: riskProfile, error: riskError, isLoading: riskLoading } = useSWR(
    organization?.urn ? ['/api/risk/profile', organization.urn] : null,
    async ([url, urn]) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urn }),
      });
      if (!res.ok) throw new Error('Failed to fetch risk profile');
      return res.json() as Promise<RiskProfile>;
    },
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // Analytics SWR
  const { data: analytics, isLoading: analyticsLoading } = useSWR(
    organization?.id ? ['dashboard-analytics', organization.id] : null,
    async ([, orgId]) => {
      const [evidence, assessments, sdp, recent] = await Promise.all([
        supabase.from('evidence_matches').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('ofsted_assessments').select('category_id').eq('organization_id', orgId),
        supabase.from('sdp_documents').select('priorities').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(1),
        supabase.from('evidence_matches').select('document_name, created_at').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(3)
      ]);

      const coverageMap = (assessments.data || []).reduce((acc: any, curr: any) => {
        const cat = curr.category_id || 'unassigned';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      // Identify gaps for recommendations
      const lowRated = (assessments.data || []).filter((a: any) =>
        ['needs_attention', 'urgent_improvement'].includes(a.school_rating)
      );

      const gaps = lowRated.slice(0, 2).map((a: any) =>
        `Address identified gaps in ${a.category_id.replace(/-/g, ' ')} area`
      );

      return {
        evidenceCount: evidence.count || 0,
        matchedAreas: assessments.data?.length || 0,
        recentMatches: recent.data || [],
        activePriorities: sdp.data?.[0]?.priorities?.slice(0, 2) || [],
        coverage: Object.entries(coverageMap).map(([id, count]) => ({ id, count: count as number })),
        dynamicRecommendations: gaps
      };
    },
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const loading = riskLoading || analyticsLoading;
  const error = riskError;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Principal';
  const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="p-8 space-y-8 animated-mesh min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-10 animated-mesh min-h-screen max-w-[1600px] mx-auto">

      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 blur-2xl text-blue-500">
          <Sparkles size={160} />
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Live System Intelligence
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {getGreeting()}, {userName}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
              <Clock size={16} />
              {currentTime} • {riskProfile?.schoolName || organization?.name}
              {riskProfile?.urn && <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold">URN {riskProfile.urn}</span>}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {riskProfile?.lastInspection?.date && (
              <Badge
                label="Last Inspection"
                value={`${new Date(riskProfile.lastInspection.date).getFullYear()} • ${riskProfile.lastInspection.rating}`}
                color="blue"
              />
            )}
            {riskProfile?.headteacher?.tenureMonths !== null && riskProfile?.headteacher?.tenureMonths !== undefined && (
              <Badge
                label="HT Tenure"
                value={`${Math.floor((riskProfile.headteacher.tenureMonths || 0) / 12)}y ${(riskProfile.headteacher.tenureMonths || 0) % 12}m`}
                color="amber"
              />
            )}
            <Badge
              label="Role"
              value={organization?.organization_type?.replace('_', ' ') || 'Member'}
              color="slate"
            />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-8">

          <MorningBriefing organizationId={organization?.id || null} />

          {/* Risk Profile Card */}
          {riskProfile && canUserAccess(MODULES.find(m => m.id === 'improvement')?.requiredPermissions || [], organization?.role as Role) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-3xl p-10 overflow-hidden group shadow-2xl"
            >
              <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Inspection Readiness</h2>
                  <p className="text-slate-500 dark:text-slate-400 font-bold mt-1">Real-time risk profile based on regional and internal benchmarks</p>
                </div>
                <div className={`px-8 py-4 rounded-[2rem] border-2 font-black text-sm flex items-center gap-3 shadow-lg transition-transform hover:scale-105 active:scale-95 ${riskProfile.riskScore >= 70 ? 'bg-rose-50 border-rose-200 text-rose-600' :
                  riskProfile.riskScore >= 40 ? 'bg-amber-50 border-amber-200 text-amber-600' :
                    'bg-emerald-50 border-emerald-200 text-emerald-600'
                  }`}>
                  {riskProfile.riskScore >= 70 ? <AlertTriangle size={24} /> : <Brain size={24} className="animate-pulse" />}
                  {riskProfile.riskLevel.toUpperCase()} LEVEL
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-10">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Readiness Index</span>
                      <span className="text-4xl font-black text-slate-900 dark:text-white leading-none">{100 - riskProfile.riskScore}%</span>
                    </div>
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - riskProfile.riskScore}%` }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className={`h-full rounded-full shadow-lg relative z-10 ${riskProfile.riskScore >= 70 ? 'bg-gradient-to-r from-rose-500 to-orange-500' :
                          riskProfile.riskScore >= 40 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                            'bg-gradient-to-r from-emerald-500 to-teal-400'
                          }`}
                      />
                      <div className="absolute inset-0 flex justify-between px-10 opacity-20 pointer-events-none">
                        {[20, 40, 60, 80].map(x => <div key={x} className="w-px h-full bg-slate-400" />)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {riskProfile.riskFactors.slice(0, 4).map((factor, i) => (
                      <div key={i} className="p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all group/factor">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{factor.category}</span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${factor.severity === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                            }`}>-{factor.impact}%</span>
                        </div>
                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight group-hover/factor:text-blue-600 transition-colors">{factor.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evidence Coverage Visual */}
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M0 50 Q 25 25, 50 50 T 100 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
                      <path d="M0 70 Q 25 45, 50 70 T 100 70" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    </svg>
                  </div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Framework Evidence Coverage</h4>
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                      <motion.circle
                        cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="8"
                        strokeDasharray="283"
                        initial={{ strokeDashoffset: 283 }}
                        animate={{ strokeDashoffset: 283 - (283 * ((analytics?.matchedAreas || 0) / 50)) }} // Assuming 50 sub-areas
                        transition={{ duration: 2.5, ease: "easeInOut" }}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">{analytics?.matchedAreas || 0}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase mt-1">Matched</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full mt-10">
                    {analytics?.coverage?.slice(0, 4).map((c: any, i: number) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{c.id.replace(/-/g, ' ')}</span>
                        <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-blue-400" style={{ width: `${(c.count / 10) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Intervention Timeline */}
          {organization?.id && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white px-2">Intervention Landscape</h2>
              <InterventionTimeline organizationId={organization.id} />
            </div>
          )}
        </div>

        {/* Sidebar / Recommended */}
        <div className="space-y-8">
          {riskProfile?.recommendations && canUserAccess(MODULES.find(m => m.id === 'improvement')?.requiredPermissions || [], organization?.role as Role) && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-3xl p-8 bg-slate-900 text-white"
            >
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <Brain size={20} className="text-blue-400" />
                Strategic AI Guidance
              </h3>
              <div className="space-y-4">
                {[...((analytics as any)?.dynamicRecommendations || []), ...(riskProfile.recommendations || [])].map((rec, i) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0 group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                    <p className="text-sm text-slate-300 font-medium leading-relaxed group-hover:text-white transition-colors">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
              <a href="/dashboard/sef" className="block w-full text-center mt-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl">
                Draft Executive SEF
              </a>
            </motion.div>
          )}

          <div className="glass-card rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Active Priorities</h3>
            <div className="space-y-4">
              {(analytics?.activePriorities?.length || 0) > 0 ? analytics?.activePriorities?.map((p: any, i: number) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">{p.title}</span>
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">LIVE</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
                    <div className="h-full bg-blue-500 w-[60%]" />
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">No active priorities</p>
                  <a href="/dashboard/sdp" className="text-[10px] font-black text-blue-600 uppercase mt-2 block">Create SDP</a>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-8 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <h3 className="text-lg font-black mb-2 relative z-10">Platform Power</h3>
            <p className="text-blue-100 text-sm mb-6 relative z-10">You've matched {analytics?.evidenceCount || 0} documents. System confidence is at 94%.</p>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md">
                <div className="text-2xl font-black">{analytics?.matchedAreas || 0}</div>
                <div className="text-[10px] font-black uppercase opacity-60">Matched Areas</div>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md">
                <div className="text-2xl font-black">{Math.floor((analytics?.evidenceCount || 0) / 10)}h</div>
                <div className="text-[10px] font-black uppercase opacity-60">Time Saved</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Badge = ({ label, value, color }: { label: string; value: string; color: string }) => {
  const styles: any = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
    amber: 'bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
    slate: 'bg-slate-50 border-slate-100 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
  };

  return (
    <div className={`px-4 py-2 rounded-2xl border flex flex-col items-start ${styles[color] || styles.slate}`}>
      <span className="text-[10px] uppercase font-bold opacity-60 tracking-wider transition-opacity">{label}</span>
      <span className="text-sm font-black whitespace-nowrap">{value}</span>
    </div>
  );
};
