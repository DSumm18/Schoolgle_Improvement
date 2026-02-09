/**
 * Compliance Tasks API
 *
 * GET /api/estates/tasks - List tasks with filters
 * POST /api/estates/tasks - Create a new task
 */

import { NextRequest, NextResponse } from 'next/server';
import { TaskService } from '@/lib/estates-compliance/services/TaskService';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get organization_id from auth context
    const organization_id = request.headers.get('x-organization-id') || 'demo';

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      status: searchParams.get('status') as any,
      priority: searchParams.get('priority') as any,
      domain: searchParams.get('domain') as any,
      assigned_to: searchParams.get('assigned_to') || undefined,
      overdue_only: searchParams.get('overdue_only') === 'true',
      search: searchParams.get('search') || undefined,
    };

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await TaskService.list(
      organization_id,
      Object.keys(filters).reduce((acc, key) => {
        const value = filters[key as keyof typeof filters];
        if (value !== undefined && value !== false) {
          acc[key] = value;
        }
        return acc;
      }, {} as any),
      { page, pageSize }
    );

    return NextResponse.json({
      tasks: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Get organization_id from auth context
    const organization_id = request.headers.get('x-organization-id') || 'demo';

    const body = await request.json();

    const task = await TaskService.create(organization_id, body);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 500 }
    );
  }
}
