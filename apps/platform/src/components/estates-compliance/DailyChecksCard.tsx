'use client';

/**
 * Daily Checks Card Component
 *
 * Mobile-friendly component for daily opening and closing checklists.
 * Features:
 * - Quick tap-through interface with large buttons
 * - Progress tracking for each checklist
 * - Visual status indicators (pending, in progress, completed with/without failures)
 * - One-tap start/continue functionality
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, Play, Check, AlertTriangle, Clock, RotateCcw } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase as supabaseClient } from '@/lib/supabase';
import {
  DAILY_CHECKLISTS,
  type DailyCheckType,
  type ChecklistStatus,
  getTodayDate,
  getChecklistIcon,
  getChecklistColor,
  type DailyCheckCompletion,
} from '@/lib/estates-compliance/daily-checks';
import confetti from 'canvas-confetti';

interface DailyChecksCardProps {
  onCheckComplete?: (type: string) => void;
}

/**
 * Trigger celebration confetti
 */
const triggerCelebration = () => {
  const duration = 1500;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    });
  }, 250);
};

export function DailyChecksCard({ onCheckComplete }: DailyChecksCardProps) {
  const { organizationId, user, loading: authLoading } = useAuth();
  const [statuses, setStatuses] = useState<Record<string, ChecklistStatus>>({});
  const [loading, setLoading] = useState(true);
  const [celebrating, setCelebrating] = useState<DailyCheckType | null>(null);

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const timeEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙';

  // Fetch daily check completion status
  const fetchDailyCheckStatus = useCallback(async (signal?: AbortSignal) => {
    // If already aborted, don't start
    if (signal?.aborted) return;

    // Use a local controller to manage the fetch timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('Daily checks fetch timed out'), 30000);

    // Link the passed signal to our local controller
    const onAbort = () => controller.abort(signal?.reason);
    if (signal) {
      if (signal.aborted) onAbort();
      else signal.addEventListener('abort', onAbort, { once: true });
    }

    try {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: { session } } = await supabaseClient.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(
        `/api/estates-compliance/daily-checks?organization_id=${organizationId}&date=${getTodayDate()}`,
        {
          headers,
          signal: controller.signal
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStatuses(data.statuses || {});
      } else if (response.status === 404) {
        setStatuses({});
      }
    } catch (error: any) {
      const errorString = typeof error === 'string' ? error : error?.message || '';
      const isAbort = error.name === 'AbortError' || errorString.toLowerCase().includes('abort') || errorString.toLowerCase().includes('unmounted') || errorString.toLowerCase().includes('refreshed');

      if (isAbort) {
        console.info('[DailyChecksCard] Fetch aborted:', errorString);
      } else {
        console.error('Error fetching daily check status:', error);
        toast.error('Failed to load daily routines');
      }
    } finally {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onAbort);
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDailyCheckStatus(controller.signal);
    return () => controller.abort('Component updated or unmounted');
  }, [fetchDailyCheckStatus]);

  const handleStartChecklist = async (typeOrId: string) => {
    // Add timeout to prevents hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('Request timed out'), 30000);

    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const isDynamic = !['opening', 'closing'].includes(typeOrId);

      // Start or resume the checklist
      const response = await fetch('/api/estates-compliance/daily-checks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          organization_id: organizationId,
          user_id: user?.id,
          check_type: isDynamic ? undefined : typeOrId,
          routine_id: isDynamic ? typeOrId : undefined,
          action: statuses[typeOrId]?.inProgress ? 'resume' : 'start',
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Navigate to the checklist page
        window.location.href = `/estates-compliance/daily-checks/${typeOrId}`;
      } else {
        toast.error('Failed to start checklist', {
          description: 'Please try again',
        });
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError' || error?.message?.includes('aborted')) {
        console.warn('Checklist start request timed out');
        toast.error('Request timed out', {
          description: 'Please check your connection and try again',
        });
      } else {
        console.error('Error starting checklist:', error);
        toast.error('Failed to start checklist', {
          description: 'Please try again',
        });
      }
    }
  };

  const getButtonProps = (status: ChecklistStatus) => {
    if (status.completed) {
      return {
        variant: 'outline' as const,
        icon: status.result?.failed ? AlertTriangle : Check,
        label: status.result?.failed ? 'Review Issues' : 'View Completed',
        className: 'border-green-200 hover:bg-green-50 text-green-700',
      };
    }
    if (status.inProgress) {
      return {
        variant: 'default' as const,
        icon: Play,
        label: 'Continue',
        className: 'bg-blue-600 hover:bg-blue-700 text-white',
      };
    }
    return {
      variant: 'default' as const,
      icon: Play,
      label: 'Start Checklist',
      className: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    };
  };

  if (loading || authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Routines</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRoutineDisplayName = (id: string, status: ChecklistStatus) => {
    if (id === 'opening') return DAILY_CHECKLISTS.opening.name;
    if (id === 'closing') return DAILY_CHECKLISTS.closing.name;
    return status.name || 'Custom Routine';
  };

  const getRoutineDescription = (id: string, status: ChecklistStatus) => {
    if (id === 'opening') return DAILY_CHECKLISTS.opening.description;
    if (id === 'closing') return DAILY_CHECKLISTS.closing.description;
    return status.description || 'Custom tailored checklist';
  };

  const sortedStatusEntries = Object.entries(statuses).sort(([idA, sA], [idB, sB]) => {
    if (idA === 'opening') return -1;
    if (idB === 'opening') return 1;
    if (idA === 'closing') return 1;
    if (idB === 'closing') return -1;
    return (sA.name || '').localeCompare(sB.name || '');
  });

  const allCompleted = sortedStatusEntries.every(([_, s]) => s.completed);
  const pendingCount = sortedStatusEntries.filter(([_, s]) => !s.completed).length;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <span className="text-2xl drop-shadow-sm">{timeEmoji}</span>
              Daily Routines
            </CardTitle>
            <CardDescription className="font-medium">
              {timeGreeting}! Complete your routines to stay compliant
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={
              allCompleted
                ? 'bg-green-100 text-green-700 border-green-300 shadow-sm'
                : 'bg-orange-100 text-orange-700 border-orange-300 shadow-sm'
            }
          >
            {allCompleted
              ? 'All Complete'
              : `${pendingCount} pending`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {sortedStatusEntries.map(([id, status]) => (
          <div
            key={id}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${status.inProgress
              ? 'border-blue-300 bg-blue-50/50 shadow-md translate-y-[-2px]'
              : status.completed
                ? status.result?.failed
                  ? 'border-amber-300 bg-amber-50/50 shadow-sm'
                  : 'border-green-300 bg-green-50/50 shadow-sm'
                : 'border-gray-200 bg-background hover:bg-gray-50/50 hover:border-gray-300'
              }`}
          >
            <div className="flex items-start gap-4">
              <div className={`text-4xl filter drop-shadow-sm ${celebrating === id ? 'animate-bounce' : ''}`}>
                {getChecklistIcon(status as any)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-800">{getRoutineDisplayName(id, status)}</h3>
                  {status.completed && status.result && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-bold px-1.5 h-5 leading-none ${status.result.failed > 0
                        ? 'bg-amber-100 text-amber-700 border-amber-300'
                        : 'bg-green-100 text-green-700 border-green-300'
                        }`}
                    >
                      {status.result.failed === 0
                        ? `${status.result.passed}/${status.result.total} Passed`
                        : `${status.result.failed} Issues`}
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-3 line-clamp-2">
                  {getRoutineDescription(id, status)}
                </p>

                {status.completed && status.result ? (
                  <div className="flex items-center gap-3">
                    <Progress
                      value={(status.result.passed / status.result.total) * 100}
                      className="h-1.5 flex-1 bg-gray-200"
                    />
                    <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                      {Math.round((status.result.passed / status.result.total) * 100)}%
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-primary/60" />
                      {status.deadline_time ? `Deadline: ${status.deadline_time.slice(0, 5)}` : 'No deadline'}
                    </div>
                    {status.items_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-primary/60" />
                        {status.items_count} checks
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleStartChecklist(id)}
                variant={status.completed ? 'outline' : 'default'}
                size={status.completed ? 'sm' : 'default'}
                className={`transition-all rounded-xl font-bold shadow-sm ${status.completed
                  ? 'border-green-200 hover:bg-green-50 text-green-700 bg-white'
                  : status.inProgress
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-primary hover:bg-primary/90'
                  }`}
              >
                {status.completed ? (
                  <>
                    {status.result?.failed ? <AlertTriangle className="h-4 w-4 mr-1.5" /> : <Check className="h-4 w-4 mr-1.5" />}
                    Review
                  </>
                ) : status.inProgress ? (
                  <>
                    <Play className="h-4 w-4 mr-1.5 fill-current" />
                    Resume
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1.5 fill-current" />
                    Start
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}

        {/* Quick Stats Row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="text-xs font-medium text-muted-foreground">
            {allCompleted
              ? 'Excellent! All routines are complete for today.'
              : `${pendingCount} routine${pendingCount > 1 ? 's' : ''} left for today.`}
          </div>
          <Link
            href="/estates-compliance/daily-checks/history"
            className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            History
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
