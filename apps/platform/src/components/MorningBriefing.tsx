"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle, Clock, AlertCircle, TrendingUp, FileCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PendingAction {
  id: string;
  type: 'pulse_check' | 'evidence_review' | 'intervention_update' | 'assessment';
  title: string;
  description: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  count?: number;
}

export default function MorningBriefing({ organizationId }: { organizationId: string | null }) {
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPendingActions() {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      try {

        // Query pulse checks that need review (placeholder - adjust based on your schema)
        const { data: pulseChecks, error: pcError } = await supabase
          .from('pulse_checks')
          .select('id, date, topic, intervention_id, school_interventions!inner(organization_id)')
          .eq('school_interventions.organization_id', organizationId)
          .order('date', { ascending: false })
          .limit(5);

        // Query interventions that need updates
        const { data: interventions, error: intError } = await supabase
          .from('school_interventions')
          .select('id, start_date, status, research_strategies(title)')
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .limit(5);

        const pendingActions: PendingAction[] = [];

        // Add pulse checks
        if (pulseChecks && pulseChecks.length > 0) {
          pendingActions.push({
            id: 'pulse-checks',
            type: 'pulse_check',
            title: `${pulseChecks.length} Pulse Check${pulseChecks.length > 1 ? 's' : ''} to Review`,
            description: 'Review recent intervention progress data',
            priority: 'medium',
            count: pulseChecks.length,
          });
        }

        // Add interventions
        if (interventions && interventions.length > 0) {
          pendingActions.push({
            id: 'interventions',
            type: 'intervention_update',
            title: `${interventions.length} Active Intervention${interventions.length > 1 ? 's' : ''}`,
            description: 'Monitor ongoing intervention progress',
            priority: 'high',
            count: interventions.length,
          });
        }

        setActions(pendingActions);
      } catch (error) {
        console.error('Error fetching pending actions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPendingActions();
  }, [organizationId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50 hover:bg-red-100';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100';
      default:
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pulse_check':
        return <CheckCircle size={20} className="text-blue-600" />;
      case 'intervention_update':
        return <TrendingUp size={20} className="text-green-600" />;
      case 'evidence_review':
        return <FileCheck size={20} className="text-purple-600" />;
      default:
        return <AlertCircle size={20} className="text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-gray-600" size={20} />
          <h2 className="text-xl font-bold text-gray-900">Morning Briefing</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <CheckCircle size={48} className="mx-auto mb-2 text-green-500 opacity-50" />
          <p>All caught up! No pending actions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="text-gray-600" size={20} />
        <h2 className="text-xl font-bold text-gray-900">Morning Briefing</h2>
      </div>

      <div className="space-y-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              // TODO: Navigate to specific action or open in-place
              console.log('Action clicked:', action);
            }}
            className={`w-full text-left p-4 rounded-lg border transition-colors ${getPriorityColor(action.priority)}`}
          >
            <div className="flex items-start gap-3">
              {getIcon(action.type)}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  {action.count && (
                    <span className="px-2 py-1 bg-white rounded text-xs font-semibold text-gray-700">
                      {action.count}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{action.description}</p>
                {action.dueDate && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Clock size={12} />
                    <span>Due: {new Date(action.dueDate).toLocaleDateString('en-GB')}</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

