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
    compliance_domain:
      searchParams.get("compliance_domain") ||
      searchParams.get("domain") ||
      undefined,
    statutory_check_id:
      searchParams.get("statutory_check_id") ||
      searchParams.get("check_id") ||
      searchParams.get("checkId") ||
      undefined,
    custom_check_id:
      searchParams.get("custom_check_id") ||
      searchParams.get("customCheckId") ||
      undefined,
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

  const supabase = createServiceRoleClient();
  const userIds = Array.from(
    new Set(
      result.data
        .flatMap((ticket) => [ticket.raised_by, ticket.assigned_to])
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const contractorIds = Array.from(
    new Set(
      result.data
        .map((ticket) => ticket.assigned_contractor_id)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [{ data: users }, { data: contractors }] = await Promise.all([
    userIds.length
      ? supabase
          .from("users")
          .select("id, display_name, email")
          .in("id", userIds)
      : Promise.resolve({ data: [] }),
    contractorIds.length
      ? supabase
          .from("estates_contractors")
          .select("id, company_name")
          .eq("organization_id", organizationId)
          .in("id", contractorIds)
      : Promise.resolve({ data: [] }),
  ]);

  const userNames = new Map(
    (users || []).map((user) => [
      user.id,
      user.display_name || user.email || user.id,
    ]),
  );
  const contractorNames = new Map(
    (contractors || []).map((contractor) => [
      contractor.id,
      contractor.company_name || contractor.id,
    ]),
  );
  const tickets = result.data.map((ticket) => ({
    ...ticket,
    raised_by_name: ticket.raised_by
      ? userNames.get(ticket.raised_by) || ticket.raised_by
      : undefined,
    assigned_to_name:
      ticket.assigned_to_name ||
      (ticket.assigned_to
        ? userNames.get(ticket.assigned_to) || ticket.assigned_to
        : undefined),
    assigned_contractor_name: ticket.assigned_contractor_id
      ? contractorNames.get(ticket.assigned_contractor_id) ||
        ticket.assigned_contractor_id
      : undefined,
  }));

  return apiSuccess({
    tickets,
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
