import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

// GET /api/finance/suppliers — list with search, filter, pagination, sort
export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const url = req.nextUrl;

  const orgId = url.searchParams.get("organizationId") || auth.organizationId;
  if (!orgId) return apiError("Organization ID required", 400);

  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)),
  );
  const offset = (page - 1) * limit;
  const search = url.searchParams.get("search")?.trim();
  const category = url.searchParams.get("category")?.trim();
  const activeOnly = url.searchParams.get("active") !== "false";
  const sortBy = url.searchParams.get("sort") || "total_spend_ytd";
  const sortDir = url.searchParams.get("dir") === "asc" ? true : false;

  // Build query
  let query = supabase
    .from("finance_suppliers")
    .select("*", { count: "exact" })
    .eq("organization_id", orgId);

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  if (search) {
    query = query.or(
      `supplier_name.ilike.%${search}%,display_name.ilike.%${search}%,contact_name.ilike.%${search}%,supplier_ref.ilike.%${search}%`,
    );
  }

  if (category) {
    query = query.eq("category", category);
  }

  // Sort
  const validSorts = [
    "total_spend_ytd",
    "supplier_name",
    "service_rating",
    "transaction_count_ytd",
    "last_transaction_date",
    "contract_end",
    "created_at",
  ];
  const sortColumn = validSorts.includes(sortBy) ? sortBy : "total_spend_ytd";
  query = query.order(sortColumn, { ascending: sortDir, nullsFirst: false });

  query = query.range(offset, offset + limit - 1);

  const { data: suppliers, count, error } = await query;

  if (error) {
    console.error("[finance/suppliers] GET error:", error);
    return apiError("Failed to fetch suppliers", 500);
  }

  // Fetch summary stats in parallel
  // Compute stats from the fetched supplier list
  const allSuppliers = suppliers ?? [];
  const summary = {
    total_suppliers: count || 0,
    total_spend_ytd: 0,
    avg_spend_per_supplier: 0,
    framework_count: 0,
    category_count: 0,
  };

  {
    // Compute summary stats from a lightweight query
    const { data: statsSuppliers } = await supabase
      .from("finance_suppliers")
      .select("total_spend_ytd, is_framework_supplier, category")
      .eq("organization_id", orgId)
      .eq("is_active", true);

    if (statsSuppliers) {
      const allSuppliers = statsSuppliers;
      const totalSpend = allSuppliers.reduce(
        (s, r) => s + (r.total_spend_ytd || 0),
        0,
      );
      const spenders = allSuppliers.filter((r) => (r.total_spend_ytd || 0) > 0);
      const categories = new Set(
        allSuppliers.map((r) => r.category).filter(Boolean),
      );

      summary = {
        total_suppliers: allSuppliers.length,
        total_spend_ytd: totalSpend,
        avg_spend_per_supplier:
          spenders.length > 0 ? totalSpend / spenders.length : 0,
        framework_count: allSuppliers.filter((r) => r.is_framework_supplier)
          .length,
        category_count: categories.size,
      };
    }
  }

  // Get distinct categories for filter dropdown
  const { data: categories } = await supabase
    .from("finance_suppliers")
    .select("category")
    .eq("organization_id", orgId)
    .eq("is_active", true)
    .not("category", "is", null)
    .order("category");

  const uniqueCategories = [
    ...new Set((categories || []).map((c) => c.category)),
  ];

  return apiSuccess({
    suppliers: suppliers || [],
    summary,
    categories: uniqueCategories,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
});

// POST /api/finance/suppliers — create a new supplier
export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const body = await req.json();

  const orgId = body.organizationId || auth.organizationId;
  if (!orgId) return apiError("Organization ID required", 400);

  if (!body.supplier_name?.trim()) {
    return apiError("Supplier name is required", 400);
  }

  const record = {
    organization_id: orgId,
    supplier_name: body.supplier_name.trim(),
    display_name: body.display_name?.trim() || null,
    supplier_ref: body.supplier_ref?.trim() || null,
    category: body.category?.trim() || null,
    contact_name: body.contact_name?.trim() || null,
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    address: body.address?.trim() || null,
    website: body.website?.trim() || null,
    notes: body.notes?.trim() || null,
    vat_number: body.vat_number?.trim() || null,
    company_number: body.company_number?.trim() || null,
    preferred_contact_method: body.preferred_contact_method || "email",
    contract_start: body.contract_start || null,
    contract_end: body.contract_end || null,
    contract_value: body.contract_value || null,
    payment_terms: body.payment_terms?.trim() || null,
    is_framework_supplier: body.is_framework_supplier || false,
    framework_name: body.framework_name?.trim() || null,
    service_rating: body.service_rating || null,
    service_notes: body.service_notes?.trim() || null,
    tags: body.tags || [],
    is_active: true,
    source_system: "manual",
  };

  const { data, error } = await supabase
    .from("finance_suppliers")
    .insert(record)
    .select()
    .single();

  if (error) {
    console.error("[finance/suppliers] POST error:", error);
    return apiError("Failed to create supplier", 500);
  }

  return apiSuccess({ supplier: data }, 201);
});
