/**
 * Pupils API Routes
 *
 * GET  /api/pupils          - List pupils for organization (with filters)
 * POST /api/pupils          - Import pupils from CSV or create single pupil
 */

import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
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

    let query = supabase
      .from("pupils")
      .select("*")
      .eq("organization_id", organizationId)
      .order("year_group")
      .order("last_name");

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
        "# Required: pupil_id, first_name, last_name, year_group",
        "# Optional: class_name, gender, date_of_birth, pupil_ref, is_pupil_premium, is_eal, is_looked_after, sen_status, primary_need, fsm_eligible, ethnicity",
        "#",
        "# year_group: R (Reception), 1-13 (Year 1 to Year 13), N (Nursery)",
        "# sen_status: K (SEN Support), E (EHCP), monitoring, removed",
        "# primary_need: SPLD, MLD, SLD, PMLD, SEMH, SLCN, HI, VI, MSI, PD, ASD, OTH, NSA",
        "# gender: M, F, O",
        "# is_pupil_premium / is_eal / is_looked_after / fsm_eligible: yes/no",
        "#",
        "pupil_id,first_name,last_name,year_group,class_name,gender,date_of_birth,pupil_ref,is_pupil_premium,is_eal,is_looked_after,sen_status,primary_need,fsm_eligible,ethnicity",
        "PUP001,Oliver,Thompson,3,3A,M,2017-09-15,,no,no,no,,,,WBRI",
        "PUP002,Amelia,Patel,3,3A,F,2017-11-02,,yes,yes,no,,,,AIND",
        "PUP003,Jack,Williams,4,4B,M,2016-07-20,,no,no,no,K,SPLD,,WBRI",
        "PUP004,Isla,Khan,R,Reception,F,2020-03-12,,no,yes,no,,,,APKN",
        "PUP005,George,Brown,6,6A,M,2014-12-01,,yes,no,no,E,ASD,,WBRI",
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
        "first_name",
        "last_name",
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
      const firstName = (p.first_name || "").trim();
      const lastName = (p.last_name || "").trim();
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
      if (!firstName) {
        results.errors.push({
          row: rowNum,
          pupil_id: pupilId,
          error: "Missing first_name",
        });
        continue;
      }
      if (!lastName) {
        results.errors.push({
          row: rowNum,
          pupil_id: pupilId,
          error: "Missing last_name",
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

      const record: Record<string, any> = {
        organization_id: organizationId,
        pupil_id: pupilId,
        first_name: firstName,
        last_name: lastName,
        year_group: yearGroup,
        class_name: (p.class_name || "").trim() || null,
        gender: normaliseGender(p.gender || ""),
        date_of_birth: p.date_of_birth || null,
        pupil_ref: (p.pupil_ref || "").trim() || null,
        is_pupil_premium: parseBool(p.is_pupil_premium),
        is_eal: parseBool(p.is_eal),
        is_looked_after: parseBool(p.is_looked_after),
        has_send_support: !!senStatus && senStatus !== "REMOVED",
        sen_status: senStatus || null,
        primary_need: primaryNeed || null,
        fsm_eligible: parseBool(p.fsm_eligible),
        ethnicity: (p.ethnicity || "").trim() || null,
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

    const withoutDob = pupils.filter((p) => !p.date_of_birth).length;
    if (withoutDob > 0) {
      results.warnings.push(
        `${withoutDob} pupils without date_of_birth — this is optional but useful for age-based analysis`,
      );
    }

    return apiSuccess({
      success: true,
      ...results,
      total_processed: pupils.length,
    });
  },
  { requiredRole: "slt" },
);
