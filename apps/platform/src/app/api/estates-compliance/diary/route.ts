/**
 * Daily Diary API Route
 *
 * Handles:
 * - GET: Fetch diary entries for an organization
 * - POST: Create new diary entry
 * - PATCH: Update diary entry
 * - DELETE: Delete diary entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/estates-compliance/diary
 *
 * Query params:
 * - organization_id: required
 * - user_id: optional (filter by user)
 * - search: optional (search in entry text)
 * - tags: optional (comma-separated tag filter)
 * - date_from: optional (ISO date string)
 * - date_to: optional (ISO date string)
 * - limit: optional (default 50)
 * - offset: optional (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organization_id');
    const userId = searchParams.get('user_id');
    const searchText = searchParams.get('search');
    const tagsParam = searchParams.get('tags');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let query = supabase
      .from('estates_daily_diary')
      .select('*, user:user_id(id, email, user_metadata)')
      .eq('organization_id', organizationId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (searchText) {
      query = query.ilike('entry', `%${searchText}%`);
    }

    if (tagsParam) {
      const tags = tagsParam.split(',').map(t => t.trim());
      query = query.contains('tags', tags);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: entries, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching diary entries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch diary entries' },
        { status: 500 }
      );
    }

    // Get total count
    const { count } = await supabase
      .from('estates_daily_diary')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    return NextResponse.json({
      entries: entries || [],
      count: count || 0,
      limit,
      offset,
      has_more: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error('Error in diary GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/estates-compliance/diary
 *
 * Body:
 * - organization_id: required
 * - user_id: required
 * - entry: required (diary text)
 * - photos: optional array of photo URLs
 * - tags: optional array of tags
 * - location: optional
 * - weather: optional object with temperature, conditions
 * - mood: optional ('positive' | 'neutral' | 'negative')
 * - visibility: optional ('private' | 'team' | 'organization')
 * - attachments: optional array of attachment URLs
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organization_id,
      user_id,
      entry,
      photos = [],
      tags = [],
      location,
      weather,
      mood,
      visibility = 'private',
      attachments = [],
    } = body;

    if (!organization_id || !user_id || !entry) {
      return NextResponse.json(
        { error: 'organization_id, user_id, and entry are required' },
        { status: 400 }
      );
    }

    if (entry.trim().length === 0) {
      return NextResponse.json(
        { error: 'Entry cannot be empty' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: newEntry, error } = await supabase
      .from('estates_daily_diary')
      .insert({
        organization_id,
        user_id,
        entry: entry.trim(),
        photos,
        tags,
        location,
        weather,
        mood,
        visibility,
        attachments,
      })
      .select('*, user:user_id(id, email, user_metadata)')
      .single();

    if (error) {
      console.error('Error creating diary entry:', error);
      return NextResponse.json(
        { error: 'Failed to create diary entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      entry: newEntry,
      message: 'Diary entry created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error in diary POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/estates-compliance/diary
 *
 * Body:
 * - id: required (entry ID)
 * - entry: optional
 * - photos: optional
 * - tags: optional
 * - location: optional
 * - weather: optional
 * - mood: optional
 * - visibility: optional
 * - attachments: optional
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: updatedEntry, error } = await supabase
      .from('estates_daily_diary')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, user:user_id(id, email, user_metadata)')
      .single();

    if (error) {
      console.error('Error updating diary entry:', error);
      return NextResponse.json(
        { error: 'Failed to update diary entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      entry: updatedEntry,
      message: 'Diary entry updated successfully',
    });
  } catch (error) {
    console.error('Error in diary PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/estates-compliance/diary
 *
 * Query params:
 * - id: required (entry ID)
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Entry ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First check if entry exists and is within 24 hours
    const { data: entry } = await supabase
      .from('estates_daily_diary')
      .select('created_at')
      .eq('id', id)
      .single();

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    const entryAge = Date.now() - new Date(entry.created_at).getTime();
    const hours24 = 24 * 60 * 60 * 1000;

    if (entryAge > hours24) {
      return NextResponse.json(
        { error: 'Entries older than 24 hours cannot be deleted' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('estates_daily_diary')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting diary entry:', error);
      return NextResponse.json(
        { error: 'Failed to delete diary entry' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Diary entry deleted successfully',
    });
  } catch (error) {
    console.error('Error in diary DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
