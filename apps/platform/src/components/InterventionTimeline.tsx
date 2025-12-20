"use client";

import { useState, useEffect } from "react";
import { Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Intervention {
  id: string;
  cohort_id: string;
  strategy_id: string;
  start_date: string;
  status: string;
  cohort_name?: string;
  strategy_title?: string;
}

interface PulseCheck {
  id: string;
  intervention_id: string;
  date: string;
  topic: string;
  results: {
    summary?: {
      average: number;
      participation: number;
    };
    individual_scores?: Array<{
      student_id: string;
      score: number;
    }>;
  };
}

interface InterventionTimelineProps {
  organizationId: string;
}

export default function InterventionTimeline({ organizationId }: InterventionTimelineProps) {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [pulseChecks, setPulseChecks] = useState<Record<string, PulseCheck[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {

        // Fetch interventions
        const { data: interventionsData, error: interventionsError } = await supabase
          .from('school_interventions')
          .select(`
            id,
            cohort_id,
            strategy_id,
            start_date,
            status,
            cohorts:cohort_id (name),
            research_strategies:strategy_id (title)
          `)
          .eq('organization_id', organizationId)
          .order('start_date', { ascending: false });

        if (interventionsError) {
          console.error('Error fetching interventions:', interventionsError);
          setLoading(false);
          return;
        }

        // Transform data
        const transformedInterventions = (interventionsData || []).map((iv: any) => ({
          id: iv.id,
          cohort_id: iv.cohort_id,
          strategy_id: iv.strategy_id,
          start_date: iv.start_date,
          status: iv.status,
          cohort_name: iv.cohorts?.name || 'Unknown Cohort',
          strategy_title: iv.research_strategies?.title || 'Unknown Strategy'
        }));

        setInterventions(transformedInterventions);

        // Fetch pulse checks for each intervention
        if (transformedInterventions.length > 0) {
          const interventionIds = transformedInterventions.map(iv => iv.id);
          const { data: pulseChecksData, error: pulseChecksError } = await supabase
            .from('pulse_checks')
            .select('*')
            .in('intervention_id', interventionIds)
            .order('date', { ascending: true });

          if (pulseChecksError) {
            console.error('Error fetching pulse checks:', pulseChecksError);
          } else {
            // Group pulse checks by intervention_id
            const grouped: Record<string, PulseCheck[]> = {};
            (pulseChecksData || []).forEach((pc: PulseCheck) => {
              if (!grouped[pc.intervention_id]) {
                grouped[pc.intervention_id] = [];
              }
              grouped[pc.intervention_id].push(pc);
            });
            setPulseChecks(grouped);
          }
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) {
      fetchData();
    }
  }, [organizationId]);

  const calculateTrend = (pulseChecks: PulseCheck[]) => {
    if (pulseChecks.length < 2) return null;

    const scores = pulseChecks.map(pc => {
      if (pc.results.individual_scores && pc.results.individual_scores.length > 0) {
        const avg = pc.results.individual_scores.reduce((sum, s) => sum + s.score, 0) / pc.results.individual_scores.length;
        return avg;
      }
      return pc.results.summary?.average || 0;
    });

    const first = scores[0];
    const last = scores[scores.length - 1];
    const change = last - first;

    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (interventions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <p className="text-gray-500 text-center py-8">
          No interventions found. Create your first intervention to track progress.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="space-y-6">
        {interventions.map((intervention) => {
          const checks = pulseChecks[intervention.id] || [];
          const trend = calculateTrend(checks);

          return (
            <div key={intervention.id} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{intervention.strategy_title}</h3>
                  <p className="text-sm text-gray-600">{intervention.cohort_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    intervention.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {intervention.status}
                  </span>
                  {trend && (
                    <div className="flex items-center gap-1">
                      {trend === 'up' && <TrendingUp className="text-green-600" size={16} />}
                      {trend === 'down' && <TrendingDown className="text-red-600" size={16} />}
                      {trend === 'stable' && <Minus className="text-gray-600" size={16} />}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <Calendar size={14} />
                <span>
                  Started: {new Date(intervention.start_date).toLocaleDateString('en-GB')}
                </span>
              </div>

              {/* Pulse Check Timeline */}
              {checks.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Progress Tracking</h4>
                  <div className="space-y-2">
                    {checks.map((check) => {
                      const avgScore = check.results.individual_scores && check.results.individual_scores.length > 0
                        ? check.results.individual_scores.reduce((sum, s) => sum + s.score, 0) / check.results.individual_scores.length
                        : check.results.summary?.average || 0;

                      return (
                        <div key={check.id} className="flex items-center gap-3 text-sm">
                          <div className="w-20 text-gray-500">
                            {new Date(check.date).toLocaleDateString('en-GB', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all"
                                  style={{ width: `${Math.min(avgScore, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-700 w-12 text-right">
                                {Math.round(avgScore)}%
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{check.topic}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {checks.length === 0 && (
                <p className="text-xs text-gray-400 italic mt-2">
                  No pulse checks recorded yet
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

