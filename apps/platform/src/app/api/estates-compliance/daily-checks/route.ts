/**
 * Daily Checks API Route
 *
 * Handles:
 * - GET: Fetch daily check completions for a date
 * - POST: Create/update daily check completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getTodayDate,
  getChecklistStatusForToday,
  type DailyCheckType,
  type DailyCheckCompletion,
  type ChecklistStatus,
  type DailyCheckCompletionInput,
  type Routine,
} from '@/lib/estates-compliance/daily-checks';

/**
 * GET /api/estates-compliance/daily-checks
 *
 * Query params:
 * - organization_id: required
 * - date: optional (defaults to today)
 * - type: optional ('opening' | 'closing')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organization_id');
    const date = searchParams.get('date') || getTodayDate();
    const type = searchParams.get('type') as DailyCheckType | null;

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Fetch all active routines for the organization
    const { data: activeRoutines } = await supabase
      .from('estates_routines')
      .select('*, items:estates_routine_items(*)')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    // 2. Filter routines that should happen on this date
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.toLocaleDateString('en-US', { weekday: 'long' });

    const routinesForToday = (activeRoutines || []).filter(routine => {
      if (routine.recurrence === 'daily') return true;
      if (routine.recurrence === 'weekly') {
        return routine.recurrence_days && routine.recurrence_days.includes(dayOfWeek);
      }
      // Monthly/Once logic can be added here
      return true; // Fallback
    });

    // 3. Fetch completions for this date
    let query = supabase
      .from('estates_daily_check_completions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('check_date', date);

    if (type) {
      query = query.eq('check_type', type);
    }

    const { data: completions, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching daily check completions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch daily check completions' },
        { status: 500 }
      );
    }

    // 4. Calculate statuses for each routine due today
    const dynamicStatuses: Record<string, any> = {};

    // Include legacy categories if they exist (or map them to dynamic)
    const openingCompletion = completions?.find(c => c.check_type === 'opening');
    const closingCompletion = completions?.find(c => c.check_type === 'closing');

    // Process dynamic routines
    routinesForToday.forEach(routine => {
      const completion = completions?.find(c => c.routine_id === routine.id);

      dynamicStatuses[routine.id] = {
        id: routine.id,
        name: routine.name,
        type: routine.type,
        deadline_time: routine.deadline_time,
        items_count: routine.items?.length || 0,
        completed: completion?.status === 'completed' || completion?.status === 'completed_with_issues',
        inProgress: completion?.status === 'in_progress',
        last_updated: completion?.updated_at,
        result: completion ? {
          passed: completion.passed_items,
          failed: completion.failed_items,
          notApplicable: completion.not_applicable_items,
          total: completion.total_items
        } : null
      };
    });

    // Backward compatibility for the card if it expects fixed keys
    const openingStatus = getChecklistStatusForToday(completions || [], 'opening');
    const closingStatus = getChecklistStatusForToday(completions || [], 'closing');

    return NextResponse.json({
      completions: completions || [],
      routines: routinesForToday,
      statuses: {
        opening: openingStatus,
        closing: closingStatus,
        ...dynamicStatuses
      },
      date,
    });
  } catch (error) {
    console.error('Error in daily checks GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/estates-compliance/daily-checks
 *
 * Actions:
 * - start: Create a new in-progress completion
 * - resume: Return existing in-progress completion
 * - complete: Complete the checklist
 * - update: Update individual item results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organization_id,
      user_id,
      check_type,
      action,
      results,
      notes,
      photos,
      routine_id,
    } = body;

    if (!organization_id || !user_id || (!check_type && !routine_id)) {
      return NextResponse.json(
        { error: 'organization_id, user_id, and check_type are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const today = getTodayDate();

    // Check for existing in-progress completion
    let existingQuery = supabase
      .from('estates_daily_check_completions')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('check_date', today);

    if (routine_id) {
      existingQuery = existingQuery.eq('routine_id', routine_id);
    } else {
      existingQuery = existingQuery.eq('check_type', check_type);
    }

    const { data: existing } = await existingQuery
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (action === 'start' || action === 'resume') {
      // If there's an in-progress completion, return it
      if (existing && existing.status === 'in_progress') {
        return NextResponse.json({
          completion: existing,
          action: 'resumed',
        });
      }

      // If there's a completed one and action is resume, return it
      if (existing && existing.status === 'completed' && action === 'resume') {
        return NextResponse.json({
          completion: existing,
          action: 'viewing_completed',
        });
      }

      // Create new in-progress completion
      let total_items = 0;
      let final_check_type = check_type;

      if (routine_id) {
        const { data: routine } = await supabase
          .from('estates_routines')
          .select('*, items:estates_routine_items(id)')
          .eq('id', routine_id)
          .single();

        if (routine) {
          total_items = routine.items?.length || 0;
          final_check_type = routine.type || 'custom';
        }
      } else {
        const { DAILY_CHECKLISTS } = await import('@/lib/estates-compliance/daily-checks');
        const checklist = DAILY_CHECKLISTS[check_type as 'opening' | 'closing'];
        if (checklist) {
          total_items = checklist.items.length;
        }
      }

      const { data: newCompletion, error } = await supabase
        .from('estates_daily_check_completions')
        .insert({
          organization_id,
          user_id,
          routine_id,
          check_type: final_check_type,
          check_date: today,
          started_at: new Date().toISOString(),
          status: 'in_progress',
          results: [],
          total_items,
          passed_items: 0,
          failed_items: 0,
          not_applicable_items: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating daily check completion:', error);
        return NextResponse.json(
          { error: 'Failed to create completion' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        completion: newCompletion,
        action: 'created',
      });
    }

    if (action === 'update') {
      if (!existing) {
        return NextResponse.json(
          { error: 'No completion found to update' },
          { status: 404 }
        );
      }

      // Calculate counts
      let passed = 0;
      let failed = 0;
      let notApplicable = 0;

      for (const result of results) {
        if (result.status === 'passed') passed++;
        else if (result.status === 'failed') failed++;
        else if (result.status === 'not_applicable') notApplicable++;
      }

      const { data: updated, error } = await supabase
        .from('estates_daily_check_completions')
        .update({
          results,
          passed_items: passed,
          failed_items: failed,
          not_applicable_items: notApplicable,
          notes,
          photos: photos || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating daily check completion:', error);
        return NextResponse.json(
          { error: 'Failed to update completion' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        completion: updated,
        action: 'updated',
      });
    }

    if (action === 'complete') {
      if (!existing) {
        return NextResponse.json(
          { error: 'No completion found to complete' },
          { status: 404 }
        );
      }

      // Calculate counts
      let passed = 0;
      let failed = 0;
      let notApplicable = 0;

      for (const result of results || existing.results) {
        if (result.status === 'passed') passed++;
        else if (result.status === 'failed') failed++;
        else if (result.status === 'not_applicable') notApplicable++;
      }

      const { data: completed, error } = await supabase
        .from('estates_daily_check_completions')
        .update({
          results: results || existing.results,
          status: failed > 0 ? 'completed_with_issues' : 'completed',
          completed_at: new Date().toISOString(),
          passed_items: passed,
          failed_items: failed,
          not_applicable_items: notApplicable,
          notes,
          photos: photos || existing.photos || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error completing daily check completion:', error);
        return NextResponse.json(
          { error: 'Failed to complete checklist' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        completion: completed,
        action: 'completed',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in daily checks POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
