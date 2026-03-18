/**
 * Single Central Record (SCR) API
 *
 * GET /api/staff/scr — Ofsted-ready Single Central Record
 * Returns all staff with their safeguarding compliance status:
 * - Identity verified
 * - DBS check (type, date, status, update service)
 * - Barred list check
 * - Right to work
 * - Qualifications (QTS/teaching qualification)
 * - Safeguarding training
 * - Professional references (tracked, not stored)
 * - Overseas checks where applicable
 *
 * This is the #1 thing Ofsted checks on inspection day 1.
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

interface SCREntry {
  staff_id: string;
  name: string;
  job_title: string;
  role_category: string;
  start_date: string | null;
  is_active: boolean;
  // SCR columns
  identity_verified: boolean;
  dbs_type: string | null;
  dbs_status: string | null;
  dbs_date: string | null;
  dbs_certificate_number: string | null;
  dbs_update_service: boolean;
  dbs_next_check: string | null;
  dbs_overdue: boolean;
  barred_list_checked: boolean;
  children_barred_list: boolean;
  right_to_work_type: string | null;
  right_to_work_date: string | null;
  right_to_work_expiry: string | null;
  right_to_work_overdue: boolean;
  has_qts: boolean;
  has_teaching_qual: boolean;
  safeguarding_trained: boolean;
  safeguarding_expiry: string | null;
  safeguarding_overdue: boolean;
  prevent_trained: boolean;
  overseas_check_required: boolean;
  overseas_check_status: string | null;
  // Compliance summary
  fully_compliant: boolean;
  issues: string[];
}

export const GET = protectedRoute(
  async (auth, req: NextRequest) => {
    const { searchParams } = req.nextUrl;
    const source = searchParams.get("source"); // "mis" | "db" | null (auto)

    // Try MIS resolver first (reads from Drive/Wonde, never stored)
    if (source !== "db") {
      try {
        const { resolveSCR } = await import("@/lib/mis/staff-resolver");
        const result = await resolveSCR(auth.organizationId);
        if (result.entries.length > 0) {
          const compliant = result.entries.filter((e) => e.compliant).length;
          return apiSuccess({
            scr: result.entries,
            summary: {
              total: result.entries.length,
              compliant,
              issues: result.entries.length - compliant,
              dbs_missing: result.entries.filter(
                (e) => e.dbs_status === "missing",
              ).length,
              rtw_missing: result.entries.filter(
                (e) => e.rtw_status === "missing",
              ).length,
              safeguarding_missing: result.entries.filter(
                (e) => e.safeguarding_status === "missing",
              ).length,
            },
            source: result.source,
            data_tier: "mis_read_only",
          });
        }
      } catch (e: any) {
        console.warn(
          "[SCR API] MIS resolver failed, falling back to DB:",
          e.message,
        );
      }
    }

    // Fallback: read from Supabase (legacy synced data)
    const supabase = createServiceRoleClient();
    const now = new Date();

    // Fetch all active staff
    const { data: staff } = await supabase
      .from("staff_directory")
      .select(
        "id, first_name, last_name, job_title, role_category, start_date, is_active",
      )
      .eq("organization_id", auth.organizationId)
      .eq("is_active", true)
      .order("last_name");

    if (!staff || staff.length === 0) {
      return apiSuccess({
        scr: [],
        summary: { total: 0, compliant: 0, issues: 0 },
      });
    }

    const staffIds = staff.map((s) => s.id);

    // Fetch all compliance data in parallel
    const [dbsRes, rtwRes, qualsRes, trainingRes] = await Promise.all([
      supabase.from("staff_dbs_records").select("*").in("staff_id", staffIds),
      supabase
        .from("staff_right_to_work")
        .select("*")
        .in("staff_id", staffIds)
        .eq("is_current", true),
      supabase
        .from("staff_qualifications")
        .select("*")
        .in("staff_id", staffIds)
        .in("qualification_type", [
          "qts",
          "pgce",
          "bed",
          "ba_education",
          "eyts",
        ]),
      supabase
        .from("staff_training_records")
        .select("*")
        .in("staff_id", staffIds)
        .in("training_category", [
          "safeguarding",
          "child_protection",
          "prevent",
          "kcsie",
        ]),
    ]);

    // Index by staff_id for fast lookup
    const dbsByStaff = new Map<string, any>();
    (dbsRes.data || []).forEach((d) => {
      const existing = dbsByStaff.get(d.staff_id);
      if (!existing || new Date(d.issue_date) > new Date(existing.issue_date)) {
        dbsByStaff.set(d.staff_id, d);
      }
    });

    const rtwByStaff = new Map<string, any>();
    (rtwRes.data || []).forEach((r) => rtwByStaff.set(r.staff_id, r));

    const qualsByStaff = new Map<string, any[]>();
    (qualsRes.data || []).forEach((q) => {
      const arr = qualsByStaff.get(q.staff_id) || [];
      arr.push(q);
      qualsByStaff.set(q.staff_id, arr);
    });

    const trainingByStaff = new Map<string, any[]>();
    (trainingRes.data || []).forEach((t) => {
      const arr = trainingByStaff.get(t.staff_id) || [];
      arr.push(t);
      trainingByStaff.set(t.staff_id, arr);
    });

    // Build SCR entries
    const scr: SCREntry[] = staff.map((s) => {
      const dbs = dbsByStaff.get(s.id);
      const rtw = rtwByStaff.get(s.id);
      const quals = qualsByStaff.get(s.id) || [];
      const training = trainingByStaff.get(s.id) || [];

      const safeguarding = training.find(
        (t) =>
          t.training_category === "safeguarding" ||
          t.training_category === "child_protection" ||
          t.training_category === "kcsie",
      );
      const prevent = training.find((t) => t.training_category === "prevent");

      const hasQts = quals.some((q) => q.qualification_type === "qts");
      const hasTeachingQual = quals.some((q) =>
        ["qts", "pgce", "bed", "ba_education", "eyts"].includes(
          q.qualification_type,
        ),
      );

      const dbsOverdue = dbs?.next_check_due
        ? new Date(dbs.next_check_due) < now
        : !dbs;
      const rtwOverdue = rtw?.expiry_date
        ? new Date(rtw.expiry_date) < now
        : false;
      const safeguardingOverdue = safeguarding?.expiry_date
        ? new Date(safeguarding.expiry_date) < now
        : !safeguarding;

      const issues: string[] = [];
      if (!dbs) issues.push("No DBS record");
      else if (dbs.status !== "clear") issues.push(`DBS status: ${dbs.status}`);
      else if (dbsOverdue) issues.push("DBS check overdue");
      if (!dbs?.barred_list_checked) issues.push("Barred list not checked");
      if (!rtw) issues.push("No right to work check");
      else if (rtwOverdue) issues.push("Right to work expired");
      if (!safeguarding) issues.push("No safeguarding training");
      else if (safeguardingOverdue)
        issues.push("Safeguarding training expired");
      if (!prevent) issues.push("Prevent training missing");

      // Teachers need QTS
      const isTeacher = [
        "headteacher",
        "deputy_headteacher",
        "assistant_headteacher",
        "class_teacher",
        "subject_lead",
        "phase_lead",
        "sendco",
      ].includes(s.role_category);
      if (isTeacher && !hasQts) issues.push("QTS not recorded");

      if (
        dbs?.overseas_check_required &&
        dbs?.overseas_check_status !== "clear"
      ) {
        issues.push("Overseas check incomplete");
      }

      return {
        staff_id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        job_title: s.job_title,
        role_category: s.role_category,
        start_date: s.start_date,
        is_active: s.is_active,
        identity_verified: !!rtw,
        dbs_type: dbs?.dbs_type || null,
        dbs_status: dbs?.status || null,
        dbs_date: dbs?.issue_date || null,
        dbs_certificate_number: dbs?.certificate_number || null,
        dbs_update_service: dbs?.update_service_registered || false,
        dbs_next_check: dbs?.next_check_due || null,
        dbs_overdue: dbsOverdue,
        barred_list_checked: dbs?.barred_list_checked || false,
        children_barred_list: dbs?.children_barred_list || false,
        right_to_work_type: rtw?.right_to_work_type || null,
        right_to_work_date: rtw?.check_date || null,
        right_to_work_expiry: rtw?.expiry_date || null,
        right_to_work_overdue: rtwOverdue,
        has_qts: hasQts,
        has_teaching_qual: hasTeachingQual,
        safeguarding_trained: !!safeguarding,
        safeguarding_expiry: safeguarding?.expiry_date || null,
        safeguarding_overdue: safeguardingOverdue,
        prevent_trained: !!prevent,
        overseas_check_required: dbs?.overseas_check_required || false,
        overseas_check_status: dbs?.overseas_check_status || null,
        fully_compliant: issues.length === 0,
        issues,
      };
    });

    const compliant = scr.filter((s) => s.fully_compliant).length;

    return apiSuccess({
      scr,
      summary: {
        total: scr.length,
        compliant,
        issues: scr.length - compliant,
        dbs_overdue: scr.filter((s) => s.dbs_overdue).length,
        safeguarding_expired: scr.filter((s) => s.safeguarding_overdue).length,
        prevent_missing: scr.filter((s) => !s.prevent_trained).length,
      },
      data_tier: "supabase_stored",
    });
  },
  { requiredRole: "slt" },
);
