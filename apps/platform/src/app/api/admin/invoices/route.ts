import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

/**
 * GET - List all invoices with filtering
 * POST - Create new invoice
 * PATCH - Update invoice (status, reminder, etc.)
 */
export const GET = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const organizationId = searchParams.get("organizationId");
    const overdue = searchParams.get("overdue");

    // Check if requester is super admin
    const { data: isAdmin } = await supabase
      .from("super_admins")
      .select("access_level")
      .eq("user_id", auth.userId)
      .single();

    if (!isAdmin) {
      return apiError("Unauthorized. Super admin access required.", 403);
    }

    let query = supabase
      .from("invoices")
      .select(
        `
        *,
        organization:organizations(id, name, urn),
        subscription:subscriptions(id, plan, status)
      `
      )
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    if (overdue === "true") {
      query = query.lt("due_date", new Date().toISOString().split("T")[0]);
      query = query.in("status", ["sent", "overdue"]);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate summary
    const summary = {
      total: data?.length || 0,
      draft: data?.filter((i) => i.status === "draft").length || 0,
      sent: data?.filter((i) => i.status === "sent").length || 0,
      paid: data?.filter((i) => i.status === "paid").length || 0,
      overdue: data?.filter((i) => i.status === "overdue").length || 0,
      outstanding:
        data
          ?.filter((i) => ["sent", "overdue"].includes(i.status))
          .reduce((sum, i) => sum + i.amount_due, 0) || 0,
    };

    return apiSuccess({ data, summary });
  },
  { requiredRole: "admin" }
);

export const POST = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const body = await req.json();
    const {
      organizationId,
      subscriptionId,
      description,
      lineItems,
      subtotal,
      dueDays = 30,
      notes,
    } = body;

    // Check if requester is super admin
    const { data: isAdmin } = await supabase
      .from("super_admins")
      .select("access_level")
      .eq("user_id", auth.userId)
      .single();

    if (!isAdmin) {
      return apiError("Unauthorized. Super admin access required.", 403);
    }

    // Generate invoice number
    const { data: invoiceNum } = await supabase.rpc(
      "generate_invoice_number"
    );

    // Calculate dates
    const invoiceDate = new Date().toISOString().split("T")[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);

    // Calculate totals (in pence)
    const total = subtotal || 0;
    const amountDue = subtotal || 0;

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        organization_id: organizationId,
        subscription_id: subscriptionId,
        invoice_number: invoiceNum,
        status: "draft",
        subtotal: total / 100, // Store in pounds for easier display
        tax: 0,
        total: total / 100,
        amount_due: amountDue / 100,
        description,
        line_items: lineItems || [],
        invoice_date: invoiceDate,
        due_date: dueDate.toISOString().split("T")[0],
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    return apiSuccess({ data });
  },
  { requiredRole: "admin" }
);

export const PATCH = protectedRoute(
  async (auth, req) => {
    const supabase = createServiceRoleClient();
    const body = await req.json();
    const { invoiceId, action, amountPaid, notes } = body;

    // Check if requester is super admin
    const { data: isAdmin } = await supabase
      .from("super_admins")
      .select("access_level")
      .eq("user_id", auth.userId)
      .single();

    if (!isAdmin) {
      return apiError("Unauthorized. Super admin access required.", 403);
    }

    let updateData: any = { updated_at: new Date().toISOString() };

    switch (action) {
      case "send":
        updateData.status = "sent";
        updateData.sent_at = new Date().toISOString();
        break;

      case "mark_paid":
        updateData.status = "paid";
        updateData.paid_at = new Date().toISOString();
        updateData.amount_paid = amountPaid;
        break;

      case "mark_overdue":
        updateData.status = "overdue";
        break;

      case "send_reminder":
        updateData.reminder_sent_at = new Date().toISOString();
        const reminderResult = await supabase
          .from("invoices")
          .select("reminder_count")
          .eq("id", invoiceId)
          .single();
        updateData.reminder_count = (reminderResult.data?.reminder_count || 0) + 1;
        break;

      case "cancel":
        updateData.status = "cancelled";
        break;

      case "update_notes":
        updateData.notes = notes;
        break;
    }

    const { data, error } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", invoiceId)
      .select()
      .single();

    if (error) throw error;

    return apiSuccess({ data });
  },
  { requiredRole: "admin" }
);
