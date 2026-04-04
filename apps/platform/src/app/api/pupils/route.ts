/**
 * Pupils API Routes
 *
 * GET  /api/pupils          - List pupils for organization (with filters)
 * POST /api/pupils          - Import pupils from CSV or create single pupil
 *
 * CRITICAL DATA SAFETY RULE:
 * This route MUST NOT store PII (first_name, last_name, date_of_birth, ethnicity)
 * in Supabase. Only pseudonymised identifiers (pupil_hash via SHA-256) and
 * non-identifying demographic flags are stored server-side.
 * Names are resolved LIVE from Google Drive at display time — never persisted.
 * See: /lib/pupil-pseudonymiser.ts for the client-side pseudonymisation flow.
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { createHmac } from "crypto";
import Papa from "papaparse";

// Valid SEN statuses
const VALID_SEN_STATUSES = ["K", "E", "monitoring", "removed"];

// Valid primary needs (DfE codes)
const VALID_PRIMARY_NEEDS = [
  "SPLD",
  "MLD",
  "SLD",
  "PMLD",
  "SEMH",
  "SLCN",
  "HI",
  "VI",
  "MSI",
  "PD",
  "ASD",
  "OTH",
  "NSA",
];

/**
 * GET /api/pupils
 */
export const GET = protectedRoute(
  async (auth, request) => {
    const supabase = createServiceRoleClient();
    const { organizationId } = auth;
    const searchParams = request.nextUrl.searchParams;

    const yearGroup = searchParams.get("year_group");
    const className = searchParams.get("class_name");
    const senStatus = searchParams.get("sen_status");
    const activeOnly = searchParams.get("active_only") !== "false";

    // NEVER select * — explicitly list only non-PII columns
    let query = supabase
      .from("pupils")
      .select("id,organization_id,pupil_id,year_group,class_name,gender,pupil_ref,is_pupil_premium,is_eal,is_looked_after,has_send_support,sen_status,primary_need,fsm_eligible,is_active,import_source,imported_at,updated_at")
      .eq("organization_id", organizationId)
      .order("year_group")
      .order("pupil_id");

    if (activeOnly) query = query.eq("is_active", true);
    if (yearGroup) query = query.eq("year_group", yearGroup);
    if (className) query = query.eq("class_name", className);
    if (senStatus) query = query.eq("sen_status", senStatus);

    const { data, error } = await query;

    if (error) {
      console.error("[Pupils] List error:", error);
      return apiError("Failed to fetch pupils", 500);
    }

    return apiSuccess({
      pupils: data || [],
      count: (data || []).length,
    });
  },
  { requiredRole: "teacher" },
);

/**
 * POST /api/pupils
 *
 * Accepts JSON body with either:
 * - { pupils: [...] } for bulk import
 * - { pupil_id, first_name, last_name, year_group, ... } for single creation
 * - { csv: "..." } for CSV text import
 * - { template: true } to download CSV template
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const supabase = createServiceRoleClient();
    const { organizationId } = auth;

    const body = await request.json();

    // Template download
    if (body.template) {
      const template = [
        "# Schoolgle Pupil Import Template",
        "# Required: pupil_id, year_group",
        "# Optional: class_name, gender, pupil_ref, is_pupil_premium, is_eal, is_looked_after, sen_status, primary_need, fsm_eligible",
        "#",
        "# PRIVACY: pupil_id is hashed server-side (SHA-256). Names, DOB, and ethnicity",
        "# are NEVER stored on Schoolgle servers. Use the UPN or school MIS ID as pupil_id.",
        "# Names are resolved live from Google Drive at display time only.",
        "#",
        "# year_group: R (Reception), 1-13 (Year 1 to Year 13), N (Nursery)",
        "# sen_status: K (SEN Support), E (EHCP), monitoring, removed",
        "# primary_need: SPLD, MLD, SLD, PMLD, SEMH, SLCN, HI, VI, MSI, PD, ASD, OTH, NSA",
        "# gender: M, F, O",
        "# is_pupil_premium / is_eal / is_looked_after / fsm_eligible: yes/no",
        "#",
        "pupil_id,year_group,class_name,gender,pupil_ref,is_pupil_premium,is_eal,is_looked_after,sen_status,primary_need,fsm_eligible",
        "PUP001,3,3A,M,,no,no,no,,,",
        "PUP002,3,3A,F,,yes,yes,no,,,",
        "PUP003,4,4B,M,,no,no,no,K,SPLD,",
        "PUP004,R,Reception,F,,no,yes,no,,,",
        "PUP005,6,6A,M,,yes,no,no,E,ASD,",
      ].join("\n");

      return apiSuccess({
        template,
        filename: "schoolgle-pupil-import-template.csv",
      });
    }

    // Parse CSV if provided
    let pupils: any[] = [];
    if (body.csv) {
      // Filter out comment lines before parsing
      const csvLines = body.csv.split("\n");
      const dataLines = csvLines.filter(
        (line: string) => !line.trim().startsWith("#"),
      );
      const filteredCsv = dataLines.join("\n");

      const parseResult = Papa.parse(filteredCsv, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) =>
          header.toLowerCase().trim().replace(/[\s-]/g, "_"),
      });

      if (parseResult.errors.length > 0) {
        return apiError(
          "Failed to parse CSV: " +
            parseResult.errors.map((e: any) => e.message).join(", "),
          400,
        );
      }

      const headers = parseResult.meta.fields || [];
      const requiredHeaders = [
        "pupil_id",
        "year_group",
      ];
      const missingHeaders = requiredHeaders.filter(
        (h) => !headers.includes(h),
      );
      if (missingHeaders.length > 0) {
        return apiError(
          `Missing required columns: ${missingHeaders.join(", ")}`,
          400,
        );
      }

      pupils = parseResult.data as any[];
    } else if (body.pupils) {
      pupils = body.pupils;
    } else if (body.pupil_id) {
      pupils = [body];
    } else {
      return apiError(
        "Provide 'csv', 'pupils' array, or single pupil fields",
        400,
      );
    }

    // Validate and prepare
    const results = {
      imported: 0,
      updated: 0,
      errors: [] as { row: number; pupil_id: string; error: string }[],
      warnings: [] as string[],
    };

    const parseBool = (v: string | boolean | undefined): boolean => {
      if (typeof v === "boolean") return v;
      if (!v) return false;
      return ["yes", "true", "y", "1"].includes(v.toLowerCase());
    };

    const normaliseYearGroup = (yg: string): string => {
      const upper = yg.toUpperCase().trim();
      if (upper === "R" || upper === "RECEPTION") return "R";
      if (upper === "N" || upper === "NURSERY") return "N";
      const num = parseInt(upper.replace(/^Y(EAR)?/i, ""), 10);
      if (!isNaN(num) && num >= 1 && num <= 13) return String(num);
      return yg.trim();
    };

    const normaliseGender = (g: string): string | null => {
      if (!g) return null;
      const upper = g.toUpperCase().trim();
      if (upper === "M" || upper === "MALE" || upper === "BOY") return "M";
      if (upper === "F" || upper === "FEMALE" || upper === "GIRL") return "F";
      if (
        upper === "O" ||
        upper === "OTHER" ||
        upper === "NON-BINARY" ||
        upper === "NONBINARY"
      )
        return "O";
      return upper; // Store as-is if not recognised
    };

    for (let i = 0; i < pupils.length; i++) {
      const p = pupils[i];
      const rowNum = i + 1;
      const pupilId = (p.pupil_id || "").trim();
      // PII fields intentionally NOT extracted — never stored server-side
      const yearGroup = normaliseYearGroup(p.year_group || "");

      // Validation
      if (!pupilId) {
        results.errors.push({
          row: rowNum,
          pupil_id: pupilId,
          error: "Missing pupil_id",
        });
        continue;
      }
      if (!yearGroup) {
        results.errors.push({
          row: rowNum,
          pupil_id: pupilId,
          error: "Missing year_group",
        });
        continue;
      }

      const senStatus = (p.sen_status || "").toUpperCase().trim();
      if (senStatus && !VALID_SEN_STATUSES.includes(senStatus)) {
        results.errors.push({
          row: rowNum,
          pupil_id: pupilId,
          error: `Invalid sen_status "${senStatus}". Valid: ${VALID_SEN_STATUSES.join(", ")}`,
        });
        continue;
      }

      const primaryNeed = (p.primary_need || "").toUpperCase().trim();
      if (primaryNeed && !VALID_PRIMARY_NEEDS.includes(primaryNeed)) {
        results.errors.push({
          row: rowNum,
          pupil_id: pupilId,
          error: `Invalid primary_need "${primaryNeed}". Valid: ${VALID_PRIMARY_NEEDS.join(", ")}`,
        });
        continue;
      }

      // --- PSEUDONYMISE: Hash the pupil_id, NEVER store names/DOB/ethnicity ---
      const orgSalt = process.env.PUPIL_HASH_SALT || organizationId;
      const pupilHash = createHmac("sha256", orgSalt)
        .update(`${pupilId}`.toLowerCase().trim())
        .digest("hex");

      const record: Record<string, any> = {
        organization_id: organizationId,
        pupil_id: pupilHash, // Pseudonymised hash, NOT the raw ID
        // NEVER stored: first_name, last_name, date_of_birth, ethnicity
        year_group: yearGroup,
        class_name: (p.class_name || "").trim() || null,
        gender: normaliseGender(p.gender || ""),
        // date_of_birth: REMOVED — PII
        pupil_ref: (p.pupil_ref || "").trim() || null,
        is_pupil_premium: parseBool(p.is_pupil_premium),
        is_eal: parseBool(p.is_eal),
        is_looked_after: parseBool(p.is_looked_after),
        has_send_support: !!senStatus && senStatus !== "REMOVED",
        sen_status: senStatus || null,
        primary_need: primaryNeed || null,
        fsm_eligible: parseBool(p.fsm_eligible),
        // ethnicity: REMOVED — PII
        is_active: true,
        import_source: "csv",
        imported_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Remove null values for cleaner upsert
      Object.keys(record).forEach((k) => {
        if (record[k] === null) delete record[k];
      });

      // Upsert by (organization_id, pupil_id)
      const { error: upsertErr } = await supabase
        .from("pupils")
        .upsert(record, { onConflict: "organization_id,pupil_id" });

      if (upsertErr) {
        results.errors.push({
          row: rowNum,
          pupil_id: pupilId,
          error: upsertErr.message,
        });
      } else {
        // Check if it was an insert or update by checking if record existed before
        results.imported++;
      }
    }

    // Summary warnings
    const withoutClass = pupils.filter(
      (p) => !(p.class_name || "").trim(),
    ).length;
    if (withoutClass > 0) {
      results.warnings.push(
        `${withoutClass} pupils without class_name — attendance registration may be affected`,
      );
    }

    // date_of_birth intentionally NOT tracked — PII not stored server-side

    return apiSuccess({
      success: true,
      ...results,
      total_processed: pupils.length,
    });
  },
  { requiredRole: "slt" },
);
