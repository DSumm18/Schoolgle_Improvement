/**
 * Helpdesk Tickets API
 *
 * GET /api/estates/helpdesk - List tickets with filters
 * POST /api/estates/helpdesk - Create a new ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { HelpdeskService } from '@/lib/estates-compliance/services/HelpdeskService';

export async function GET(request: NextRequest) {
  try {
    // TODO: Get organization_id from auth context
    const organization_id = request.headers.get('x-organization-id') || 'demo';

    const searchParams = request.nextUrl.searchParams;
    const filters = {
      status: searchParams.get('status') as any,
      priority: searchParams.get('priority') as any,
      category: searchParams.get('category') as any,
      assigned_to: searchParams.get('assigned_to') || undefined,
      asset_id: searchParams.get('asset_id') || undefined,
      location: searchParams.get('location') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const result = await HelpdeskService.list(
      organization_id,
      Object.keys(filters).reduce((acc, key) => {
        const value = filters[key as keyof typeof filters];
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any),
      { page, pageSize }
    );

    return NextResponse.json({
      tickets: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error('Error fetching helpdesk tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch helpdesk tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Get organization_id and user_id from auth context
    const organization_id = request.headers.get('x-organization-id') || 'demo';
    const user_id = request.headers.get('x-user-id') || 'demo-user';

    const body = await request.json();

    const ticket = await HelpdeskService.create(organization_id, {
      ...body,
      reported_by: user_id,
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Error creating helpdesk ticket:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create helpdesk ticket' },
      { status: 500 }
    );
  }
}
