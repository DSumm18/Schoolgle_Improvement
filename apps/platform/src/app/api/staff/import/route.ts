import { NextRequest, NextResponse } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import Papa from "papaparse";

// Valid role categories
const VALID_ROLE_CATEGORIES = [
  "headteacher",
  "deputy_headteacher",
  "assistant_headteacher",
  "subject_lead",
  "phase_lead",
  "class_teacher",
  "sendco",
  "business_manager",
  "site_manager",
  "governor",
  "teaching_assistant",
  "support_staff",
  "other",
];

// Normalize boolean values
const normalizeBoolean = (value: any): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return (
      lower === "yes" || lower === "true" || lower === "y" || lower === "1"
    );
  }
  return false;
};

// Normalize salutation
const normalizeSalutation = (value: any): string | null => {
  if (!value) return null;
  const valid = ["Mr", "Mrs", "Ms", "Dr", "Prof", "Miss"];
  const normalized = value.trim();
  return valid.includes(normalized) ? normalized : null;
};

// Normalize role category
const normalizeRoleCategory = (value: any): string => {
  if (!value) return "other";
  const normalized = value.toLowerCase().trim().replace(/[\s-]/g, "_");

  if (VALID_ROLE_CATEGORIES.includes(normalized)) {
    return normalized;
  }

  // Fuzzy matching for common variations
  const mappings: Record<string, string> = {
    head: "headteacher",
    head_teacher: "headteacher",
    ht: "headteacher",
    deputy: "deputy_headteacher",
    deputy_head: "deputy_headteacher",
    dht: "deputy_headteacher",
    assistant_head: "assistant_headteacher",
    ah: "assistant_headteacher",
    aht: "assistant_headteacher",
    subject_leader: "subject_lead",
    subject_coordinator: "subject_lead",
    phase_leader: "phase_lead",
    phase_coordinator: "phase_lead",
    teacher: "class_teacher",
    classteacher: "class_teacher",
    sen_co: "sendco",
    senco: "sendco",
    special_educational_needs_coordinator: "sendco",
    bm: "business_manager",
    sbm: "business_manager",
    school_business_manager: "business_manager",
    site: "site_manager",
    facilities: "site_manager",
    ta: "teaching_assistant",
    teaching_assistant_level_1: "teaching_assistant",
    teaching_assistant_level_2: "teaching_assistant",
    ta2: "teaching_assistant",
    support: "support_staff",
    admin: "support_staff",
    administrator: "support_staff",
  };

  return mappings[normalized] || "other";
};

// POST /api/staff/import - Import staff from CSV
export const POST = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const body = await request.json();

  const { organizationId, csvData, created_by } = body;
  const orgId = organizationId || auth.organizationId;

  if (!csvData) {
    return apiError("csvData is required", 400);
  }

  // Filter out comment lines (starting with #) before parsing
  const lines = csvData.split("\n");
  const dataLines = lines.filter(
    (line: string) => !line.trim().startsWith("#"),
  );
  const filteredCsvData = dataLines.join("\n");

  // Parse CSV (skipping comment lines)
  const parseResult = Papa.parse(filteredCsvData, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) =>
      header.toLowerCase().trim().replace(/[\s-]/g, "_"),
  });

  if (parseResult.errors.length > 0) {
    console.error("CSV parse errors:", parseResult.errors);
    return apiError(
      "Failed to parse CSV: " +
        parseResult.errors.map((e) => e.message).join(", "),
      400,
    );
  }

  const rows = parseResult.data as any[];
  const results = {
    success: true,
    imported: 0,
    updated: 0,
    archived: 0,
    errors: [] as Array<{ row: number; data: any; error: string }>,
    warnings: [] as string[],
  };

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 because header is row 1, and we're 0-indexed

    try {
      // Validate required fields
      if (!row.first_name || !row.last_name) {
        results.errors.push({
          row: rowNum,
          data: row,
          error: "Missing first_name or last_name",
        });
        continue;
      }

      if (!row.job_title) {
        results.errors.push({
          row: rowNum,
          data: row,
          error: "Missing job_title",
        });
        continue;
      }

      const normalizedData = {
        organization_id: orgId,
        salutation: normalizeSalutation(row.salutation),
        first_name: row.first_name.trim(),
        last_name: row.last_name.trim(),
        email: row.email?.trim() || null,
        phone: row.phone?.trim() || null,
        employee_id: row.employee_id?.trim() || null,
        job_title: row.job_title.trim(),
        role_category: normalizeRoleCategory(row.role_category || row.role),
        is_super_user: normalizeBoolean(row.is_super_user),
        is_active: normalizeBoolean(
          row.is_active !== undefined ? row.is_active : true,
        ),
        import_source: "csv_import" as const,
        imported_at: new Date().toISOString(),
      };

      // Check action column (what to do with this row)
      const action = (row.action || row.status || "").toLowerCase().trim();
      const removeActions = [
        "remove",
        "delete",
        "archive",
        "inactive",
        "removed",
        "archived",
        "deleted",
      ];

      // Check if staff member already exists (by email or employee_id)
      let existingStaff = null;

      if (normalizedData.email) {
        const { data: byEmail } = await supabase
          .from("staff_directory")
          .select("id, is_active")
          .eq("organization_id", orgId)
          .eq("email", normalizedData.email)
          .maybeSingle();
        existingStaff = byEmail;
      }

      if (!existingStaff && normalizedData.employee_id) {
        const { data: byEmpId } = await supabase
          .from("staff_directory")
          .select("id, is_active")
          .eq("organization_id", orgId)
          .eq("employee_id", normalizedData.employee_id)
          .maybeSingle();
        existingStaff = byEmpId;
      }

      // Handle REMOVE action
      if (removeActions.includes(action)) {
        if (existingStaff) {
          const { error: updateError } = await supabase
            .from("staff_directory")
            .update({ is_active: false })
            .eq("id", existingStaff.id);

          if (updateError) {
            results.errors.push({
              row: rowNum,
              data: row,
              error: updateError.message,
            });
          } else {
            results.archived++;
          }
        } else {
          results.warnings.push(
            `Row ${rowNum}: Staff member "${normalizedData.first_name} ${normalizedData.last_name}" not found - cannot remove`,
          );
        }
        continue;
      }

      if (existingStaff) {
        // Update existing staff
        const { error: updateError } = await supabase
          .from("staff_directory")
          .update({
            ...normalizedData,
            is_active: normalizedData.is_active, // Preserve active status from CSV
          })
          .eq("id", existingStaff.id);

        if (updateError) {
          results.errors.push({
            row: rowNum,
            data: row,
            error: updateError.message,
          });
        } else {
          results.updated++;
        }
      } else {
        // Insert new staff
        const { error: insertError } = await supabase
          .from("staff_directory")
          .insert(normalizedData);

        if (insertError) {
          results.errors.push({
            row: rowNum,
            data: row,
            error: insertError.message,
          });
        } else {
          results.imported++;
        }
      }
    } catch (err: any) {
      results.errors.push({
        row: rowNum,
        data: row,
        error: err.message || "Unknown error",
      });
    }
  }

  // Add warnings for any unusual data patterns
  const noEmailCount = rows.filter((r) => !r.email).length;
  if (noEmailCount > 0) {
    results.warnings.push(
      `${noEmailCount} staff member(s) without email address`,
    );
  }

  const noEmployeeIdCount = rows.filter((r) => !r.employee_id).length;
  if (noEmployeeIdCount > 0) {
    results.warnings.push(
      `${noEmployeeIdCount} staff member(s) without employee ID`,
    );
  }

  return apiSuccess(results);
});

// GET /api/staff/import?type=template|export
export const GET = protectedRoute(async (auth, request) => {
  const supabase = createServiceRoleClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const organizationId =
    searchParams.get("organizationId") || auth.organizationId;

  // Instruction comments to include at the top of CSV
  const instructions = [
    "# STAFF DIRECTORY IMPORT/EXPORT",
    "# ==============================",
    "#",
    "# INSTRUCTIONS:",
    "# 1. Lines starting with # are comments and will be ignored on import",
    "# 2. Fill in the required fields (marked with *)",
    '# 3. Use "yes" or "no" for boolean fields (is_super_user, is_active)',
    '# 4. Action column options: "new" (add), "keep" (no change), "update" (modify), "remove" (archive)',
    "#",
    "# FIELD DICTIONARY:",
    "# salutation     - Title: Mr, Mrs, Ms, Dr, Prof, Miss (leave blank if none)",
    "# first_name*   - Required: First name",
    "# last_name*    - Required: Last name",
    "# email         - Email address (used for matching existing staff)",
    "# phone         - Contact phone number",
    "# employee_id   - Staff ID (also used for matching existing staff)",
    "# job_title*    - Required: Job title or position",
    "# role_category - Role: headteacher, deputy_headteacher, class_teacher, sendco, etc.",
    "# is_super_user - yes/no: Has elevated permissions across all modules",
    "# is_active     - yes/no: Staff member is currently active",
    "# action        - What to do: new, keep, update, remove",
    "#",
    "# ROLE OPTIONS: headteacher, deputy_headteacher, assistant_headteacher,",
    "#              subject_lead, phase_lead, class_teacher, sendco,",
    "#              business_manager, site_manager, governor,",
    "#              teaching_assistant, support_staff, other",
    "#",
    "",
  ].join("\n");

  if (type === "export" && organizationId) {
    // Export current staff as CSV for round-trip editing
    const { data: staff } = await supabase
      .from("staff_directory")
      .select("*")
      .eq("organization_id", organizationId)
      .order("last_name", { ascending: true });

    if (!staff || staff.length === 0) {
      // Return empty template with instructions
      const headers = [
        "salutation",
        "first_name*",
        "last_name*",
        "email",
        "phone",
        "employee_id",
        "job_title*",
        "role_category",
        "is_super_user",
        "is_active",
        "action",
      ];
      const csv = [instructions, headers.join(",")].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="staff_directory_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // Build CSV with current data
    const rows = staff.map((s) => [
      s.salutation || "",
      s.first_name || "",
      s.last_name || "",
      s.email || "",
      s.phone || "",
      s.employee_id || "",
      s.job_title || "",
      s.role_category || "",
      s.is_super_user ? "yes" : "no",
      s.is_active ? "yes" : "no",
      s.is_active ? "keep" : "removed",
    ]);

    const headers = [
      "salutation",
      "first_name*",
      "last_name*",
      "email",
      "phone",
      "employee_id",
      "job_title*",
      "role_category",
      "is_super_user",
      "is_active",
      "action",
    ];
    const csv = [
      instructions,
      headers.join(","),
      ...rows.map((row) => row.map((v) => `"${v}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="staff_directory_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  }

  if (type === "template") {
    // Return CSV template with instructions, headers, and examples
    const headers = [
      "salutation",
      "first_name*",
      "last_name*",
      "email",
      "phone",
      "employee_id",
      "job_title*",
      "role_category",
      "is_super_user",
      "is_active",
      "action",
    ];
    const exampleRows = [
      [
        "Mr",
        "John",
        "Smith",
        "john.smith@school.co.uk",
        "01234 567890",
        "STF001",
        "Headteacher",
        "headteacher",
        "no",
        "yes",
        "new",
      ],
      [
        "Mrs",
        "Sarah",
        "Jones",
        "sarah.jones@school.co.uk",
        "",
        "STF002",
        "Deputy Headteacher",
        "deputy_headteacher",
        "no",
        "yes",
        "new",
      ],
      [
        "Ms",
        "Emily",
        "Brown",
        "emily.brown@school.co.uk",
        "",
        "STF003",
        "SENCO",
        "sendco",
        "no",
        "yes",
        "new",
      ],
      [
        "",
        "David",
        "Wilson",
        "david.wilson@school.co.uk",
        "",
        "STF004",
        "Class Teacher",
        "class_teacher",
        "no",
        "yes",
        "new",
      ],
      [
        "",
        "Jane",
        "Doe",
        "jane.doe@school.co.uk",
        "",
        "STF005",
        "Former Staff",
        "support_staff",
        "no",
        "no",
        "remove",
      ],
    ];

    const csv = [
      instructions,
      headers.join(","),
      ...exampleRows.map((row) => row.map((v) => `"${v}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition":
          'attachment; filename="staff_directory_template.csv"',
      },
    });
  }

  return apiError("Invalid request", 400);
});
