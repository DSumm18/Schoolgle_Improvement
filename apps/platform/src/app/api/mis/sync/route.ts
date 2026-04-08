/**
 * MIS Sync API — Staff
 *
 * POST /api/mis/sync?type=staff
 *
 * Reads staff data from Google Drive (or local test harness) and upserts
 * into Supabase tables: staff_directory, staff_contracts, staff_dbs_records,
 * staff_training_records, staff_right_to_work, staff_qualifications.
 *
 * Uses BOTH the transformed MISStaffMember data AND the raw Excel rows
 * (which contain extra columns: DBS Check, DBS Date, Safeguarding Training,
 * Prevent Training, Teaching FTE, Class Assignment, Bradford Factor, etc.).
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import type { MISStaffMember } from "@/lib/mis/types";

// ─── Role Category Mapping ──────────────────────────────────

const ROLE_CATEGORY_MAPPINGS: Record<string, string> = {
  headteacher: "headteacher",
  head_teacher: "headteacher",
  head: "headteacher",
  ht: "headteacher",
  deputy_headteacher: "deputy_headteacher",
  deputy_head: "deputy_headteacher",
  deputy: "deputy_headteacher",
  dht: "deputy_headteacher",
  assistant_headteacher: "assistant_headteacher",
  assistant_head: "assistant_headteacher",
  ah: "assistant_headteacher",
  aht: "assistant_headteacher",
  subject_lead: "subject_lead",
  subject_leader: "subject_lead",
  subject_coordinator: "subject_lead",
  phase_lead: "phase_lead",
  phase_leader: "phase_lead",
  phase_coordinator: "phase_lead",
  class_teacher: "class_teacher",
  teacher: "class_teacher",
  classteacher: "class_teacher",
  sendco: "sendco",
  senco: "sendco",
  sen_co: "sendco",
  special_educational_needs_coordinator: "sendco",
  business_manager: "business_manager",
  bm: "business_manager",
  sbm: "business_manager",
  school_business_manager: "business_manager",
  site_manager: "site_manager",
  site: "site_manager",
  caretaker: "site_manager",
  facilities: "site_manager",
  governor: "governor",
  teaching_assistant: "teaching_assistant",
  ta: "teaching_assistant",
  teaching_assistant_level_1: "teaching_assistant",
  teaching_assistant_level_2: "teaching_assistant",
  ta2: "teaching_assistant",
  hlta: "teaching_assistant",
  support_staff: "support_staff",
  support: "support_staff",
  admin: "support_staff",
  administrator: "support_staff",
  office_manager: "support_staff",
  receptionist: "support_staff",
  lunchtime_supervisor: "support_staff",
  midday_supervisor: "support_staff",
};

function normalizeRoleCategory(jobTitle: string): string {
  if (!jobTitle) return "other";
  const normalized = jobTitle.toLowerCase().trim().replace(/[\s-]/g, "_");

  // Direct match
  if (ROLE_CATEGORY_MAPPINGS[normalized]) {
    return ROLE_CATEGORY_MAPPINGS[normalized];
  }

  // Fuzzy: check if any mapping key is contained in the title
  for (const [key, value] of Object.entries(ROLE_CATEGORY_MAPPINGS)) {
    if (normalized.includes(key)) return value;
  }

  // Fallback by role type keywords
  if (/head/i.test(jobTitle)) return "headteacher";
  if (/deputy/i.test(jobTitle)) return "deputy_headteacher";
  if (/assistant.*head/i.test(jobTitle)) return "assistant_headteacher";
  if (/teacher/i.test(jobTitle)) return "class_teacher";
  if (/ta\b|teaching.?assistant/i.test(jobTitle)) return "teaching_assistant";
  if (/sen/i.test(jobTitle)) return "sendco";
  if (/business/i.test(jobTitle)) return "business_manager";
  if (/site|caretaker|facilities/i.test(jobTitle)) return "site_manager";

  return "other";
}

// ─── Pay Scale Splitting ────────────────────────────────────

interface ParsedPayScale {
  pay_scale: string;
  pay_point: string;
}

function parsePayScale(raw: string | undefined): ParsedPayScale | null {
  if (!raw || raw.trim() === "") return null;
  const s = raw.trim();

  // Leadership: L1-L43 → Leadership / L1
  const leadershipMatch = s.match(/^L(\d+)$/i);
  if (leadershipMatch) {
    return { pay_scale: "Leadership", pay_point: `L${leadershipMatch[1]}` };
  }

  // MPS: M1-M6 → MPS / M1
  const mpsMatch = s.match(/^M(\d+)$/i);
  if (mpsMatch) {
    return { pay_scale: "MPS", pay_point: `M${mpsMatch[1]}` };
  }

  // UPS: UPS1-UPS3 or U1-U3 → UPS / U1
  const upsMatch = s.match(/^(?:UPS|U)(\d+)$/i);
  if (upsMatch) {
    return { pay_scale: "UPS", pay_point: `U${upsMatch[1]}` };
  }

  // Support scales: SO1, SO2, SC1-SC6, etc. → Support / SO2
  const supportMatch = s.match(/^(S[OC])(\d+)$/i);
  if (supportMatch) {
    return {
      pay_scale: "Support",
      pay_point: `${supportMatch[1].toUpperCase()}${supportMatch[2]}`,
    };
  }

  // SCP (Spinal Column Point): SCP1-SCP43 → Support / SCP12
  const scpMatch = s.match(/^SCP(\d+)$/i);
  if (scpMatch) {
    return { pay_scale: "Support", pay_point: `SCP${scpMatch[1]}` };
  }

  // Generic fallback: use as-is
  return { pay_scale: s, pay_point: s };
}

// ─── Date Parsing ───────────────────────────────────────────

function parseDate(raw: unknown): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s || s === "undefined" || s === "null" || s === "N/A") return null;

  // Excel serial date number
  if (/^\d{5}$/.test(s)) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + parseInt(s) * 86400000);
    return date.toISOString().split("T")[0];
  }

  // DD/MM/YYYY
  const ukDate = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ukDate) {
    return `${ukDate[3]}-${ukDate[2].padStart(2, "0")}-${ukDate[1].padStart(2, "0")}`;
  }

  // YYYY-MM-DD (already ISO)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.substring(0, 10);
  }

  // Try JS Date parse
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }

  return null;
}

// ─── Salutation Normalization ───────────────────────────────

function normalizeSalutation(val: unknown): string | null {
  if (!val) return null;
  const s = String(val).trim();
  const valid = ["Mr", "Mrs", "Ms", "Dr", "Prof", "Miss"];
  // Normalize common variations
  const normalized =
    s.charAt(0).toUpperCase() + s.slice(1).toLowerCase().replace(/\.$/, "");
  return valid.includes(normalized) ? normalized : null;
}

// ─── DBS Type Normalization ─────────────────────────────────

function normalizeDBS(val: unknown): string | null {
  if (!val) return null;
  const s = String(val).toLowerCase().trim();
  if (s.includes("enhanced")) return "enhanced";
  if (s.includes("standard")) return "standard";
  if (s.includes("basic")) return "basic";
  if (s === "yes" || s === "y" || s === "true") return "enhanced"; // Default to enhanced for schools
  return null;
}

// ─── Sync Handler ───────────────────────────────────────────

export const POST = protectedRoute(async (auth, request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");

  if (type !== "staff") {
    return apiError(
      `Invalid or missing sync type: "${type}". Currently supported: staff`,
      400,
      "INVALID_SYNC_TYPE",
    );
  }

  const orgId = auth.organizationId;
  const supabase = createServiceRoleClient();

  const counts = { created: 0, updated: 0, skipped: 0, errors: 0 };
  const errors: Array<{ staffId: string; step: string; message: string }> = [];
  const warnings: string[] = [];

  try {
    // ── 1. Get the MIS data service and read transformed staff data ──
    const { getMISDataServiceForOrg } = await import("@/lib/mis/data-service");
    const service = await getMISDataServiceForOrg(orgId);
    const staffResult = await service.read<MISStaffMember>(orgId, "staff");

    if (staffResult.recordCount === 0) {
      return apiSuccess({
        success: true,
        message: "No staff data found in MIS source",
        counts,
        warnings: staffResult.warnings,
      });
    }

    // ── 2. Get raw Excel rows for extra fields (DBS, training, etc.) ──
    // The transformed MISStaffMember drops DBS Check, DBS Date, Safeguarding Training,
    // Prevent Training, etc. We need to read the raw rows too.
    let rawRows: Record<string, unknown>[] = [];

    try {
      // Try local test harness first
      const fs = await import("fs");
      const pathMod = await import("path");
      const XLSX = await import("xlsx");

      const localPath = pathMod.join(
        process.cwd(),
        "test-harness",
        "aurora-primary",
        "arbor-exports",
        "arbor_staff_export.xlsx",
      );

      if (fs.existsSync(localPath)) {
        const workbook = XLSX.readFile(localPath);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        rawRows = XLSX.utils.sheet_to_json(firstSheet) as Record<
          string,
          unknown
        >[];
      }
    } catch {
      // Local file not available
    }

    // If local didn't work, try Google Drive raw download
    if (rawRows.length === 0 && staffResult.source.driveFileId) {
      try {
        const XLSX = await import("xlsx");
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

        if (GOOGLE_API_KEY && staffResult.source.driveFileId) {
          const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${staffResult.source.driveFileId}?alt=media&key=${GOOGLE_API_KEY}`,
          );
          if (res.ok) {
            const buffer = Buffer.from(await res.arrayBuffer());
            const workbook = XLSX.read(buffer, { type: "buffer" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            rawRows = XLSX.utils.sheet_to_json(firstSheet) as Record<
              string,
              unknown
            >[];
          }
        }
      } catch (e: any) {
        warnings.push(
          `Could not read raw Excel for extra fields: ${e.message}`,
        );
      }
    }

    // Build a lookup map from Staff ID to raw row
    const rawByStaffId = new Map<string, Record<string, unknown>>();
    for (const row of rawRows) {
      const id = String(row["Staff ID"] || "");
      if (id) rawByStaffId.set(id, row);
    }

    // ── 3. Load pay_scales_reference for salary lookups ──
    const { data: payScales } = await supabase
      .from("pay_scales_reference")
      .select("scale_name, point_label, annual_salary")
      .eq("organization_id", orgId);

    const payScaleMap = new Map<string, number>();
    if (payScales) {
      for (const ps of payScales) {
        const key = `${ps.scale_name}|${ps.point_label}`;
        payScaleMap.set(key, ps.annual_salary);
      }
    }

    // ── 4. Process each staff member ──
    for (const staff of staffResult.data) {
      const raw = rawByStaffId.get(staff.staff_id) || {};
      const rawRole = String(raw["Role"] || staff.job_title || "");
      const rawTitle = String(raw["Title"] || "");
      const rawFirstName = String(raw["First Name"] || "");
      const rawLastName = String(raw["Last Name"] || "");

      try {
        // ── 4a. Upsert staff_directory ──
        const displayName =
          `${rawTitle} ${rawFirstName} ${rawLastName}`.trim() ||
          staff.display_name;
        const roleCategory = normalizeRoleCategory(rawRole);

        const directoryRecord: Record<string, unknown> = {
          organization_id: orgId,
          employee_id: staff.staff_id,
          salutation: normalizeSalutation(rawTitle),
          first_name:
            rawFirstName ||
            staff.display_name.split(" ").slice(1, -1).join(" ") ||
            "",
          last_name: rawLastName || staff.display_name.split(" ").pop() || "",
          // display_name is a GENERATED ALWAYS column — do not include
          email: String(raw["Email"] || staff.email || ""),
          phone: raw["Phone"] ? String(raw["Phone"]) : undefined,
          job_title: rawRole || staff.job_title,
          role_category: roleCategory,
          is_active: true,
          import_source: "mis_sync",
          imported_at: new Date().toISOString(),
          start_date:
            parseDate(staff.start_date) || parseDate(raw["Start Date"]),
          teacher_reference_number: raw["TRN"] ? String(raw["TRN"]) : undefined,
          national_insurance_number: raw["NI Number"]
            ? String(raw["NI Number"])
            : undefined,
          payroll_number: raw["Payroll Number"]
            ? String(raw["Payroll Number"])
            : undefined,
        };
        // Remove undefined values
        for (const k of Object.keys(directoryRecord)) {
          if (directoryRecord[k] === undefined) delete directoryRecord[k];
        }

        // Check if exists by employee_id + organization_id
        const { data: existingStaff } = await supabase
          .from("staff_directory")
          .select("id")
          .eq("organization_id", orgId)
          .eq("employee_id", staff.staff_id)
          .maybeSingle();

        let staffDirectoryId: string;
        let wasCreated: boolean;

        if (existingStaff) {
          // Update
          const { error: updateError } = await supabase
            .from("staff_directory")
            .update(directoryRecord)
            .eq("id", existingStaff.id);

          if (updateError) {
            errors.push({
              staffId: staff.staff_id,
              step: "staff_directory_update",
              message: updateError.message,
            });
            counts.errors++;
            continue;
          }
          staffDirectoryId = existingStaff.id;
          wasCreated = false;
        } else {
          // Insert
          const { data: inserted, error: insertError } = await supabase
            .from("staff_directory")
            .insert(directoryRecord)
            .select("id")
            .single();

          if (insertError || !inserted) {
            errors.push({
              staffId: staff.staff_id,
              step: "staff_directory_insert",
              message: insertError?.message || "No ID returned",
            });
            counts.errors++;
            continue;
          }
          staffDirectoryId = inserted.id;
          wasCreated = true;
        }

        // ── 4b. Upsert staff_contracts ──
        try {
          const parsedPay = parsePayScale(staff.pay_scale);
          const fte = staff.fte;
          // Arbor "Contract Type" might contain employment type info (Part-Time, Full-Time)
          // Normalize to valid contract_type values: permanent, fixed_term, casual, zero_hours, supply, agency
          const rawContractType = (staff.contract_type || "Permanent")
            .toLowerCase()
            .replace(/\s+/g, "_");
          const VALID_CONTRACT_TYPES = [
            "permanent",
            "fixed_term",
            "casual",
            "zero_hours",
            "supply",
            "agency",
          ];
          const contractType = VALID_CONTRACT_TYPES.includes(rawContractType)
            ? rawContractType
            : rawContractType.includes("fixed")
              ? "fixed_term"
              : rawContractType.includes("supply")
                ? "supply"
                : rawContractType.includes("agency")
                  ? "agency"
                  : rawContractType.includes("casual") ||
                      rawContractType.includes("zero")
                    ? "casual"
                    : "permanent"; // Part-Time, Full-Time, etc. default to permanent

          // Look up salary
          let annualSalary: number | null = null;
          if (parsedPay) {
            const salaryKey = `${parsedPay.pay_scale}|${parsedPay.pay_point}`;
            annualSalary = payScaleMap.get(salaryKey) || null;
          }

          const salaryFte = annualSalary;
          const salaryActual =
            annualSalary && fte ? Math.round(annualSalary * fte) : annualSalary;

          const hoursPerWeek = raw["Hours Per Week"]
            ? Number(raw["Hours Per Week"])
            : null;
          const weeksPerYear = raw["Weeks Per Year"]
            ? Number(raw["Weeks Per Year"])
            : null;
          const noticePeriod = raw["Notice Period (Weeks)"]
            ? Number(raw["Notice Period (Weeks)"])
            : null;

          let empType = fte >= 1.0 ? "full_time" : "part_time";
          if (weeksPerYear && weeksPerYear < 52) empType = "term_time_only";

          const contractRecord: Record<string, unknown> = {
            organization_id: orgId,
            staff_id: staffDirectoryId,
            contract_type: contractType,
            employment_type: empType,
            fte: fte,
            pay_scale: parsedPay?.pay_scale || null,
            pay_point: parsedPay?.pay_point || null,
            salary_fte: salaryFte,
            salary_actual: salaryActual,
            hours_per_week: hoursPerWeek,
            weeks_per_year: weeksPerYear,
            notice_period_weeks: noticePeriod,
            start_date:
              parseDate(staff.start_date) || parseDate(raw["Start Date"]),
            end_date: parseDate(raw["End Date"]),
            continuous_service_date: parseDate(raw["Continuous Service Date"]),
            is_current: true,
            source: "mis_sync",
            last_synced_at: new Date().toISOString(),
          };
          for (const k of Object.keys(contractRecord)) {
            if (contractRecord[k] === undefined || contractRecord[k] === null)
              delete contractRecord[k];
          }

          // Upsert: find existing current contract for this staff member
          const { data: existingContract } = await supabase
            .from("staff_contracts")
            .select("id")
            .eq("organization_id", orgId)
            .eq("staff_id", staffDirectoryId)
            .eq("is_current", true)
            .maybeSingle();

          if (existingContract) {
            await supabase
              .from("staff_contracts")
              .update(contractRecord)
              .eq("id", existingContract.id);
          } else {
            await supabase.from("staff_contracts").insert(contractRecord);
          }
        } catch (e: any) {
          errors.push({
            staffId: staff.staff_id,
            step: "staff_contracts",
            message: e.message,
          });
        }

        // ── 4c. Upsert staff_dbs_records ──
        try {
          const dbsType = normalizeDBS(raw["DBS Check"]);
          const dbsDate = parseDate(raw["DBS Date"]);

          if (dbsType) {
            const dbsCertNo = raw["DBS Certificate Number"]
              ? String(raw["DBS Certificate Number"])
              : null;
            const dbsUpdateService = String(raw["DBS Update Service"] || "")
              .toLowerCase()
              .trim();
            const isUpdateServiceRegistered =
              dbsUpdateService === "yes" || dbsUpdateService === "true";

            const dbsRecord: Record<string, unknown> = {
              organization_id: orgId,
              staff_id: staffDirectoryId,
              dbs_type: dbsType,
              certificate_number: dbsCertNo,
              issue_date: dbsDate,
              update_service_registered: isUpdateServiceRegistered,
              status: "clear",
              barred_list_checked: true,
              children_barred_list: true,
            };
            // Remove nulls
            for (const k of Object.keys(dbsRecord)) {
              if (dbsRecord[k] === null || dbsRecord[k] === undefined)
                delete dbsRecord[k];
            }

            const { data: existingDbs } = await supabase
              .from("staff_dbs_records")
              .select("id")
              .eq("organization_id", orgId)
              .eq("staff_id", staffDirectoryId)
              .maybeSingle();

            if (existingDbs) {
              await supabase
                .from("staff_dbs_records")
                .update(dbsRecord)
                .eq("id", existingDbs.id);
            } else {
              await supabase.from("staff_dbs_records").insert(dbsRecord);
            }
          }
        } catch (e: any) {
          errors.push({
            staffId: staff.staff_id,
            step: "staff_dbs_records",
            message: e.message,
          });
        }

        // ── 4d. Upsert staff_training_records ──
        try {
          const trainingEntries: Array<{
            name: string;
            category: string;
            dateKey: string;
            expiryKey?: string;
            isMandatory: boolean;
            refreshMonths?: number;
          }> = [
            {
              name: "Safeguarding Training",
              category: "safeguarding",
              dateKey: "Safeguarding Training",
              isMandatory: true,
              refreshMonths: 12,
            },
            {
              name: "Prevent Training",
              category: "prevent",
              dateKey: "Prevent Training",
              isMandatory: true,
              refreshMonths: 36,
            },
            {
              name: "First Aid",
              category: "first_aid",
              dateKey: "First Aid Date",
              expiryKey: "First Aid Expiry",
              isMandatory: false,
              refreshMonths: 36,
            },
          ];

          for (const entry of trainingEntries) {
            const completionDate = parseDate(raw[entry.dateKey]);
            if (!completionDate) continue;

            let expiryDate = entry.expiryKey
              ? parseDate(raw[entry.expiryKey])
              : null;
            // Auto-calculate expiry from refresh frequency if not provided
            if (!expiryDate && entry.refreshMonths) {
              const d = new Date(completionDate);
              d.setMonth(d.getMonth() + entry.refreshMonths);
              expiryDate = d.toISOString().split("T")[0];
            }

            const trainingName =
              entry.category === "first_aid" && raw["First Aid Type"]
                ? String(raw["First Aid Type"])
                : entry.name;

            const { data: existing } = await supabase
              .from("staff_training_records")
              .select("id")
              .eq("organization_id", orgId)
              .eq("staff_id", staffDirectoryId)
              .eq("training_category", entry.category)
              .maybeSingle();

            const record = {
              organization_id: orgId,
              staff_id: staffDirectoryId,
              training_name: trainingName,
              training_category: entry.category,
              completion_date: completionDate,
              expiry_date: expiryDate,
              refresh_frequency_months: entry.refreshMonths || null,
              is_mandatory: entry.isMandatory,
              status:
                expiryDate && new Date(expiryDate) < new Date()
                  ? "expired"
                  : "completed",
            };

            if (existing) {
              await supabase
                .from("staff_training_records")
                .update(record)
                .eq("id", existing.id);
            } else {
              await supabase.from("staff_training_records").insert(record);
            }
          }
        } catch (e: any) {
          errors.push({
            staffId: staff.staff_id,
            step: "staff_training_records",
            message: e.message,
          });
        }

        // ── 4e. Upsert staff_right_to_work ──
        try {
          const rtwType = raw["RTW Type"] ? String(raw["RTW Type"]) : null;
          const rtwCheckDate = parseDate(raw["RTW Check Date"]);

          if (rtwType) {
            const rtwExpiry = parseDate(raw["RTW Expiry"]);

            const rtwRecord: Record<string, unknown> = {
              organization_id: orgId,
              staff_id: staffDirectoryId,
              right_to_work_type: rtwType.includes("British")
                ? "british_citizen"
                : rtwType.includes("Irish")
                  ? "irish_citizen"
                  : rtwType.includes("Settled")
                    ? "settled_status"
                    : rtwType.includes("Pre")
                      ? "pre_settled_status"
                      : rtwType.includes("EEA")
                        ? "eea_national"
                        : "other",
              document_type: rtwType,
              check_date: rtwCheckDate,
              checked_by: "MIS Sync (Arbor)",
              expiry_date: rtwExpiry,
              is_current: true,
            };
            for (const k of Object.keys(rtwRecord)) {
              if (rtwRecord[k] === null || rtwRecord[k] === undefined)
                delete rtwRecord[k];
            }

            const { data: existingRtw } = await supabase
              .from("staff_right_to_work")
              .select("id")
              .eq("organization_id", orgId)
              .eq("staff_id", staffDirectoryId)
              .eq("is_current", true)
              .maybeSingle();

            if (existingRtw) {
              await supabase
                .from("staff_right_to_work")
                .update(rtwRecord)
                .eq("id", existingRtw.id);
            } else {
              await supabase.from("staff_right_to_work").insert(rtwRecord);
            }
          }
        } catch (e: any) {
          errors.push({
            staffId: staff.staff_id,
            step: "staff_right_to_work",
            message: e.message,
          });
        }

        // ── 4f. Upsert staff_qualifications (QTS) ──
        try {
          const qtsStatus = raw["QTS Status"]
            ? String(raw["QTS Status"]).trim()
            : null;

          if (qtsStatus && qtsStatus.toLowerCase() !== "") {
            const qualRecord: Record<string, unknown> = {
              organization_id: orgId,
              staff_id: staffDirectoryId,
              qualification_type: "qts",
              qualification_name:
                qtsStatus === "Qualified"
                  ? "Qualified Teacher Status (QTS)"
                  : qtsStatus,
              is_mandatory: true,
              is_verified: true,
            };

            const { data: existingQual } = await supabase
              .from("staff_qualifications")
              .select("id")
              .eq("organization_id", orgId)
              .eq("staff_id", staffDirectoryId)
              .eq("qualification_type", "qts")
              .maybeSingle();

            if (existingQual) {
              await supabase
                .from("staff_qualifications")
                .update(qualRecord)
                .eq("id", existingQual.id);
            } else {
              await supabase.from("staff_qualifications").insert(qualRecord);
            }
          }
        } catch (e: any) {
          errors.push({
            staffId: staff.staff_id,
            step: "staff_qualifications",
            message: e.message,
          });
        }

        // ── 4g. Update staff_directory with demographic fields from Arbor ──
        try {
          const demoUpdates: Record<string, unknown> = {};
          if (raw["Gender"])
            demoUpdates.gender = String(raw["Gender"])
              .toLowerCase()
              .replace(/[\s-]/g, "_");
          // date_of_birth: REMOVED — PII. Never store DOB in Supabase.

          if (Object.keys(demoUpdates).length > 0) {
            await supabase
              .from("staff_directory")
              .update(demoUpdates)
              .eq("id", staffDirectoryId);
          }
        } catch {
          // Non-critical — don't block sync for demographic fields
        }

        // Count result
        if (wasCreated) {
          counts.created++;
        } else {
          counts.updated++;
        }
      } catch (e: any) {
        errors.push({
          staffId: staff.staff_id,
          step: "general",
          message: e.message,
        });
        counts.errors++;
      }
    }

    return apiSuccess({
      success: true,
      message: `Staff sync complete: ${counts.created} created, ${counts.updated} updated, ${counts.skipped} skipped, ${counts.errors} errors`,
      counts,
      totalProcessed: staffResult.recordCount,
      source: staffResult.source,
      warnings: [...staffResult.warnings, ...warnings],
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[MIS Sync] Error:", error.message);
    return apiError(
      error.message || "Failed to sync MIS staff data",
      500,
      "MIS_SYNC_ERROR",
    );
  }
});
