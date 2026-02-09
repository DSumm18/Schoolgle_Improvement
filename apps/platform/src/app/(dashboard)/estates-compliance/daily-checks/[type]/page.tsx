'use client';

/**
 * Daily Checklist Page
 *
 * Mobile-optimized interactive checklist for opening and closing routines.
 * Features:
 * - Large tap targets for easy mobile use
 * - Clear visual feedback for pass/fail/N/A
 * - Progress indicator
 * - Photo capture for failed items
 * - Notes field for issues
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Check, X, Minus, Camera, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase as supabaseClient } from '@/lib/supabase';
import {
  DAILY_CHECKLISTS,
  getDailyChecklist,
  getTodayDate,
  calculateProgress,
  type DailyCheckType,
  type DailyCheckItem,
  type DailyCheckCompletion,
  type DailyCheckResult,
  type DailyCheckStatus,
} from '@/lib/estates-compliance/daily-checks';
import confetti from 'canvas-confetti';

export default function DailyChecklistPage() {
  const router = useRouter();
  const params = useParams();
  const checkType = params.type as string;
  const { organizationId, user, session } = useAuth();

  const [checklist, setChecklist] = useState<{ name: string; description: string; items: any[] }>(
    ['opening', 'closing'].includes(checkType)
      ? getDailyChecklist(checkType as 'opening' | 'closing')
      : { name: 'Loading...', description: '', items: [] }
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Record<string, DailyCheckResult>>({});
  const [completion, setCompletion] = useState<DailyCheckCompletion | null>(null);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentItem = checklist.items[currentIndex];
  const totalItems = checklist.items.length;
  const completedItems = Object.keys(results).length;
  const progressPercent = calculateProgress(Object.values(results));

  // Load dynamic checklist if needed
  useEffect(() => {
    const controller = new AbortController();

    const loadDynamicChecklist = async () => {
      const isDynamic = !['opening', 'closing'].includes(checkType);
      if (!isDynamic || !organizationId) return;

      try {
        const response = await fetch(`/api/estates-compliance/routines?organization_id=${organizationId}`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          const routine = data.routines?.find((r: any) => r.id === checkType);
          if (routine) {
            setChecklist({
              name: routine.name,
              description: routine.description,
              items: routine.items || [],
            });
          } else {
            toast.error('Routine not found');
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.error('Error loading dynamic routine:', error);
      }
    };

    loadDynamicChecklist();
    return () => controller.abort('Component updated or unmounted');
  }, [checkType, organizationId, session]);

  // Fetch existing completion
  useEffect(() => {
    const controller = new AbortController();
    fetchCompletion(controller.signal);
    return () => controller.abort('Component updated or unmounted');
  }, [organizationId, checkType, checklist]);

  const fetchCompletion = async (signal?: AbortSignal) => {
    try {
      if (!organizationId) return;

      const { data: { session } } = await supabaseClient.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const isDynamic = !['opening', 'closing'].includes(checkType);
      const url = `/api/estates-compliance/daily-checks?organization_id=${organizationId}&${isDynamic ? 'routine_id=' + checkType : 'type=' + checkType}`;

      const response = await fetch(url, {
        headers,
        signal: signal
      });

      if (response.ok) {
        const data = await response.json();
        if (data.completions && data.completions.length > 0) {
          const existing = data.completions[0];
          setCompletion(existing);

          // Restore results
          const resultsMap: Record<string, DailyCheckResult> = {};
          for (const result of existing.results || []) {
            resultsMap[result.item_id] = result;
          }
          setResults(resultsMap);

          // Find next incomplete item
          if (checklist.items.length > 0) {
            const nextIndex = checklist.items.findIndex(
              (item) => !resultsMap[item.id] || resultsMap[item.id].status === 'pending'
            );
            setCurrentIndex(nextIndex >= 0 ? nextIndex : checklist.items.length - 1);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching completion:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (newResults: Record<string, DailyCheckResult>, isComplete = false) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const resultsArray = Object.values(newResults);

      const isDynamic = !['opening', 'closing'].includes(checkType);

      const response = await fetch('/api/estates-compliance/daily-checks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          organization_id: organizationId,
          user_id: user?.id,
          check_type: isDynamic ? undefined : checkType,
          routine_id: isDynamic ? checkType : undefined,
          action: isComplete ? 'complete' : 'update',
          results: resultsArray,
          notes: isComplete ? notes : undefined,
          photos: isComplete ? photos : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCompletion(data.completion);
        return data.completion;
      } else {
        toast.error('Failed to save progress');
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleItemResult = useCallback(async (status: DailyCheckStatus) => {
    const newResults = {
      ...results,
      [currentItem.id]: {
        item_id: currentItem.id,
        status,
        notes: status === 'failed' ? results[currentItem.id]?.notes || '' : undefined,
        photo_url: status === 'failed' ? results[currentItem.id]?.photo_url : undefined,
        completed_at: new Date().toISOString(),
      },
    };

    setResults(newResults);

    // Auto-save progress
    await saveProgress(newResults);

    // Move to next item
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last item - show completion
      await saveProgress(newResults, true);
      handleComplete();
    }
  }, [currentItem, currentIndex, results, totalItems]);

  const handleComplete = () => {
    // Trigger celebration
    const duration = 2000;
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

    toast.success('Checklist completed!', {
      description: 'Great job staying on top of daily routines.',
    });

    // Redirect back after a moment
    setTimeout(() => {
      router.push('/estates-compliance');
    }, 2000);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalItems - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    const newResults = {
      ...results,
      [currentItem.id]: {
        item_id: currentItem.id,
        status: 'not_applicable' as DailyCheckStatus,
        completed_at: new Date().toISOString(),
      },
    };
    setResults(newResults);
    saveProgress(newResults);

    if (currentIndex < totalItems - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      saveProgress(newResults, true);
      handleComplete();
    }
  };

  const handleNoteChange = (value: string) => {
    const newResults = {
      ...results,
      [currentItem.id]: {
        ...results[currentItem.id],
        item_id: currentItem.id,
        status: results[currentItem.id]?.status || 'failed' as DailyCheckStatus,
        notes: value,
      },
    };
    setResults(newResults);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const currentResult = results[currentItem.id];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{checklist.name}</h1>
            <p className="text-sm text-muted-foreground">
              Item {currentIndex + 1} of {totalItems}
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            {Math.round(progressPercent)}%
          </Badge>
        </div>
        <div className="px-4 pb-2">
          <Progress value={progressPercent} className="h-2" />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-lg mx-auto pb-32">
        {/* Category Badge */}
        <div className="mb-4">
          <Badge variant="outline" className="text-xs capitalize">
            {currentItem.category}
          </Badge>
        </div>

        {/* Check Item Card */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="text-4xl">{currentItem.icon}</span>
              <div className="flex-1">
                <CardTitle className="text-xl">{currentItem.name}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {currentItem.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          {currentResult?.status === 'failed' && (
            <CardContent className="border-t bg-amber-50/50">
              <div className="flex items-center gap-2 text-amber-700 mb-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Issue flagged</span>
              </div>
              <Textarea
                placeholder="Add notes about the issue..."
                value={currentResult?.notes || ''}
                onChange={(e) => handleNoteChange(e.target.value)}
                className="min-h-[80px]"
              />
              {currentItem.requiresPhoto && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => {
                    toast.info('Photo capture', {
                      description: 'Camera integration coming soon',
                    });
                  }}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Add Photo
                </Button>
              )}
            </CardContent>
          )}

          {currentResult?.status === 'not_applicable' && (
            <CardContent className="border-t bg-gray-50/50">
              <p className="text-sm text-muted-foreground">
                This item has been marked as not applicable.
              </p>
            </CardContent>
          )}
        </Card>

        {/* Action Buttons - Large for mobile */}
        {!currentResult || currentResult.status === 'pending' ? (
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={() => handleItemResult('passed')}
              variant="default"
              className="h-24 flex flex-col gap-2 bg-green-600 hover:bg-green-700"
              disabled={saving}
            >
              <Check className="h-8 w-8" />
              <span className="text-sm font-medium">Pass</span>
            </Button>
            <Button
              onClick={() => handleItemResult('failed')}
              variant="default"
              className="h-24 flex flex-col gap-2 bg-red-600 hover:bg-red-700"
              disabled={saving}
            >
              <X className="h-8 w-8" />
              <span className="text-sm font-medium">Fail</span>
            </Button>
            <Button
              onClick={handleSkip}
              variant="outline"
              className="h-24 flex flex-col gap-2"
              disabled={saving}
            >
              <Minus className="h-8 w-8" />
              <span className="text-sm font-medium">N/A</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handlePrevious}
              variant="outline"
              disabled={currentIndex === 0}
              className="h-16"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              variant="default"
              disabled={currentIndex === totalItems - 1}
              className="h-16"
            >
              Next
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Item Navigation Dots */}
        <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
          {checklist.items.map((item, index) => {
            const result = results[item.id];
            return (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${index === currentIndex
                  ? 'bg-primary scale-125'
                  : result?.status === 'passed'
                    ? 'bg-green-500'
                    : result?.status === 'failed'
                      ? 'bg-red-500'
                      : result?.status === 'not_applicable'
                        ? 'bg-gray-400'
                        : 'bg-gray-200'
                  }`}
              />
            );
          })}
        </div>
      </main>

      {/* Summary Footer (when all items done) */}
      {completedItems === totalItems && (
        <footer className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
          <div className="max-w-lg mx-auto">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-green-800">All items reviewed!</p>
                    <p className="text-sm text-green-600">
                      {Object.values(results).filter(r => r.status === 'passed').length} passed,
                      {Object.values(results).filter(r => r.status === 'failed').length} failed,
                      {Object.values(results).filter(r => r.status === 'not_applicable').length} N/A
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      const finalResults = results;
                      saveProgress(finalResults, true);
                      handleComplete();
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Complete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </footer>
      )}
    </div>
  );
}
