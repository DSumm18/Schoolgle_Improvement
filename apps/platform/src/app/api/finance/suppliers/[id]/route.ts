import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET /api/finance/suppliers/[id] — single supplier with recent transactions
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const segments = req.nextUrl.pathname.split("/");
  const id = segments[segments.length - 1];

  if (!id) return apiError("Supplier ID required", 400);

  const orgId =
    req.nextUrl.searchParams.get("organizationId") || auth.organizationId;
  if (!orgId) return apiError("Organization ID required", 400);

  // Fetch the supplier
  const { data: supplier, error } = await supabase
    .from("finance_suppliers")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (error || !supplier) {
    return apiError("Supplier not found", 404);
  }

  // Fetch recent transactions by matching supplier_name
  const txPage = parseInt(req.nextUrl.searchParams.get("txPage") || "1", 10);
  const txLimit = Math.min(
    50,
    parseInt(req.nextUrl.searchParams.get("txLimit") || "20", 10),
  );
  const txOffset = (txPage - 1) * txLimit;

  const { data: transactions, count: txCount } = await supabase
    .from("finance_transactions")
    .select("*", { count: "exact" })
    .eq("organization_id", orgId)
    .eq("supplier_name", supplier.supplier_name)
    .order("transaction_date", { ascending: false })
    .range(txOffset, txOffset + txLimit - 1);

  // Compute monthly spend aggregation for chart
  const { data: monthlyRaw } = await supabase
    .from("finance_transactions")
    .select("transaction_date, amount")
    .eq("organization_id", orgId)
    .eq("supplier_name", supplier.supplier_name)
    .order("transaction_date", { ascending: true });

  const monthlySpend: Record<string, number> = {};
  (monthlyRaw || []).forEach((tx) => {
    if (tx.transaction_date) {
      const key = tx.transaction_date.substring(0, 7); // YYYY-MM
      monthlySpend[key] = (monthlySpend[key] || 0) + Math.abs(tx.amount || 0);
    }
  });

  const monthlyChart = Object.entries(monthlySpend)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, spend]) => ({
      month,
      label: formatMonthLabel(month),
      spend: Math.round(spend * 100) / 100,
    }));

  return apiSuccess({
    supplier,
    transactions: transactions || [],
    transactionPagination: {
      page: txPage,
      limit: txLimit,
      total: txCount || 0,
      totalPages: Math.ceil((txCount || 0) / txLimit),
    },
    monthlyChart,
  });
});

// PATCH /api/finance/suppliers/[id] — update supplier profile
export const PATCH = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const segments = req.nextUrl.pathname.split("/");
  const id = segments[segments.length - 1];

  if (!id) return apiError("Supplier ID required", 400);

  const body = await req.json();
  const orgId = body.organizationId || auth.organizationId;
  if (!orgId) return apiError("Organization ID required", 400);

  // Allowed update fields
  const allowedFields = [
    "display_name",
    "supplier_ref",
    "category",
    "contact_name",
    "email",
    "phone",
    "address",
    "website",
    "notes",
    "vat_number",
    "company_number",
    "preferred_contact_method",
    "contract_start",
    "contract_end",
    "contract_value",
    "payment_terms",
    "is_framework_supplier",
    "framework_name",
    "service_rating",
    "service_notes",
    "tags",
    "is_active",
    "logo_url",
  ];

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("finance_suppliers")
    .update(updates)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (error) {
    console.error("[finance/suppliers/[id]] PATCH error:", error);
    return apiError("Failed to update supplier", 500);
  }

  if (!data) {
    return apiError("Supplier not found", 404);
  }

  return apiSuccess({ supplier: data });
});

function formatMonthLabel(yyyymm: string): string {
  const [year, month] = yyyymm.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[parseInt(month, 10) - 1]} ${year.slice(2)}`;
}
