"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { AlertTriangle, Calendar, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import InterventionTimeline from "@/components/InterventionTimeline";
import MorningBriefing from "@/components/MorningBriefing";

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
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRiskProfile() {
      if (!organization?.id) {
        setLoading(false);
        return;
      }

      try {

        // Get organization URN
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('urn, name')
          .eq('id', organization.id)
          .single();

        if (orgError || !org) {
          throw new Error('Organization not found');
        }

        if (!org.urn) {
          setError('Organization URN not set. Please add URN to organization record.');
          setLoading(false);
          return;
        }

        // Call the risk profile API endpoint (which uses the MCP tool)
        const response = await fetch('/api/risk/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urn: org.urn }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch risk profile');
        }

        const data = await response.json();
        setRiskProfile(data);
      } catch (err) {
        console.error('Error fetching risk profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load risk profile');
      } finally {
        setLoading(false);
      }
    }

    fetchRiskProfile();
  }, [organization?.id]);

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return 'High Risk';
    if (score >= 40) return 'Medium Risk';
    return 'Low Risk';
  };

  const getTrendIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="text-red-600" size={20} />;
    if (score >= 40) return <Minus className="text-yellow-600" size={20} />;
    return <TrendingDown className="text-green-600" size={20} />;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="text-red-600" size={20} />
          <span className="text-red-800">{error}</span>
        </div>
      </div>
    );
  }

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';
  const currentTime = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Header & School Snapshot */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 overflow-hidden relative">
        {/* Subtle background gradient for "premium" feel */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32 -z-10"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {getGreeting()}, {userName}
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {currentTime} • {riskProfile?.schoolName || organization?.name || 'Schoolgle'}
              {riskProfile?.urn && <span className="text-sm text-gray-400 font-medium">URN: {riskProfile.urn}</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Intelligence Anchor Badges */}
            {riskProfile && riskProfile.headteacher && riskProfile.headteacher.tenureMonths !== null && (
              <div className="flex flex-col bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl shadow-sm">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">HT Tenure</span>
                <span className="text-sm font-bold text-amber-900">
                  {Math.floor(riskProfile.headteacher.tenureMonths / 12)}y {riskProfile.headteacher.tenureMonths % 12}m
                </span>
              </div>
            )}

            {riskProfile && riskProfile.lastInspection && riskProfile.lastInspection.date && (
              <div className="flex flex-col bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl shadow-sm">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Last Inspection</span>
                <span className="text-sm font-bold text-blue-900">
                  {new Date(riskProfile.lastInspection.date).getFullYear()} • {riskProfile.lastInspection.rating}
                </span>
              </div>
            )}

            {organization && (
              <div className="flex flex-col bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl shadow-sm">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Role</span>
                <span className="text-sm font-bold text-gray-900 capitalize">
                  {organization.organization_type?.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Risk Dashboard Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Inspection Risk Assessment</h2>
        <p className="text-gray-600 mt-1">
          Real-time inspection readiness monitoring
        </p>
      </div>

      {/* Morning Briefing */}
      <MorningBriefing organizationId={organization?.id || null} />

      {/* Risk Meter Card */}
      {riskProfile && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Inspection Risk Score</h2>
              <p className="text-sm text-gray-500 mt-1">
                Based on current assessment data
              </p>
            </div>
            <div className={`px-4 py-2 rounded-lg border ${getRiskColor(riskProfile.riskScore)}`}>
              <div className="flex items-center gap-2">
                {getTrendIcon(riskProfile.riskScore)}
                <span className="font-semibold">{getRiskLabel(riskProfile.riskScore)}</span>
              </div>
            </div>
          </div>

          {/* Readiness Gauge (Enhanced) */}
          <div className="space-y-6">
            <div className="relative pt-2">
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Inspection Readiness</span>
                <span className={`text-xs font-bold uppercase tracking-widest ${riskProfile.riskScore >= 70 ? 'text-red-500' : riskProfile.riskScore >= 40 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                  {100 - riskProfile.riskScore}% Ready
                </span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner flex">
                {/* 100 - riskScore is the "Readiness" */}
                <div
                  className={`h-full transition-all duration-1000 ease-out shadow-lg rounded-full ${riskProfile.riskScore >= 70
                    ? 'bg-gradient-to-r from-red-600 to-orange-500'
                    : riskProfile.riskScore >= 40
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                      : 'bg-gradient-to-r from-green-500 to-emerald-400'
                    }`}
                  style={{ width: `${100 - riskProfile.riskScore}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase">
                <span>Critical Risk</span>
                <span>Optimized</span>
              </div>
            </div>

            {/* Last Inspection */}
            {riskProfile.lastInspection.date && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="text-gray-600" size={18} />
                  <h3 className="font-semibold text-gray-900">Last Inspection</h3>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {new Date(riskProfile.lastInspection.date).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  {riskProfile.lastInspection.rating && (
                    <>
                      <span className="text-gray-300">•</span>
                      <div>
                        <span className="text-gray-500">Rating:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {riskProfile.lastInspection.rating}
                        </span>
                      </div>
                    </>
                  )}
                  {riskProfile.lastInspection.daysSince && (
                    <>
                      <span className="text-gray-300">•</span>
                      <div>
                        <span className="text-gray-500">Days since:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {Math.floor(riskProfile.lastInspection.daysSince / 365)} years, {Math.floor((riskProfile.lastInspection.daysSince % 365) / 30)} months
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Headteacher Info */}
            {riskProfile.headteacher.startDate && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-semibold text-gray-900">Headteacher</h3>
                  {riskProfile.headteacher.isNew && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                      New
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <p>
                    In post since: {new Date(riskProfile.headteacher.startDate).toLocaleDateString('en-GB', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                  {riskProfile.headteacher.tenureMonths !== null && (
                    <p className="mt-1">
                      Tenure: {Math.floor(riskProfile.headteacher.tenureMonths / 12)} years, {riskProfile.headteacher.tenureMonths % 12} months
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Predicted Window */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="text-gray-600" size={18} />
                <h3 className="font-semibold text-gray-900">Predicted Inspection Window</h3>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Earliest:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {new Date(riskProfile.predictedWindow.earliest).toLocaleDateString('en-GB', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <span className="text-gray-300">→</span>
                <div>
                  <span className="text-gray-500">Latest:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {new Date(riskProfile.predictedWindow.latest).toLocaleDateString('en-GB', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            {riskProfile.riskFactors.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Key Risk Factors</h3>
                <div className="space-y-2">
                  {riskProfile.riskFactors.map((factor, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${factor.severity === 'high'
                        ? 'bg-red-50 border-red-200'
                        : factor.severity === 'medium'
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-green-50 border-green-200'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{factor.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Impact: {factor.impact}%</span>
                          <span className={`text-xs px-2 py-1 rounded ${factor.severity === 'high'
                            ? 'bg-red-100 text-red-700'
                            : factor.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                            }`}>
                            {factor.severity.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{factor.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {riskProfile.recommendations && riskProfile.recommendations.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {riskProfile.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Intervention Timeline */}
      {organization?.id && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Intervention Timeline</h2>
          <InterventionTimeline organizationId={organization.id} />
        </div>
      )}
    </div>
  );
}
