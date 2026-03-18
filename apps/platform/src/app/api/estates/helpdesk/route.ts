/**
 * Helpdesk Tickets API
 *
 * GET /api/estates/helpdesk - List tickets with filters
 * POST /api/estates/helpdesk - Create a new ticket
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { HelpdeskService } from "@/lib/estates-compliance/services/HelpdeskService";
import { createServiceRoleClient } from "@/lib/supabase-server";

export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;

  const searchParams = request.nextUrl.searchParams;
  const filters = {
    status: searchParams.get("status") as any,
    priority: searchParams.get("priority") as any,
    category: searchParams.get("category") as any,
    assigned_to: searchParams.get("assigned_to") || undefined,
    asset_id: searchParams.get("asset_id") || undefined,
    location: searchParams.get("location") || undefined,
    search: searchParams.get("search") || undefined,
  };

  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");

  const result = await HelpdeskService.list(
    organizationId,
    Object.keys(filters).reduce((acc, key) => {
      const value = filters[key as keyof typeof filters];
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any),
    { page, pageSize },
  );

  return apiSuccess({
    tickets: result.data,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
  });
});

export const POST = protectedRoute(async (auth, request) => {
  const { organizationId, userId } = auth;

  const body = await request.json();

  const ticket = await HelpdeskService.create(organizationId, {
    ...body,
    reported_by: userId,
  });

  // Send notification for new ticket
  try {
    const supabase = createServiceRoleClient();
    await supabase.from("notifications").insert({
      organization_id: organizationId,
      user_id: userId,
      type: "helpdesk_created",
      title: `New helpdesk ticket: ${body.title}`,
      message: body.description || "A new helpdesk ticket has been created.",
      link: "/estates-compliance/helpdesk",
      metadata: {
        ticketId: ticket.id,
        priority: body.priority,
        category: body.category,
      },
    });
  } catch (notifError) {
    console.error("[Helpdesk] Failed to send notification:", notifError);
  }

  return apiSuccess(ticket, 201);
});
