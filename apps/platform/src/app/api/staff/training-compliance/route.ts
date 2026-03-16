/**
 * Training Compliance Dashboard API
 *
 * GET /api/staff/training-compliance — Overview of mandatory training status across all staff
 * Shows: expiring soon, expired, never completed for each mandatory category
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

const MANDATORY_CATEGORIES = [
  { category: "safeguarding", label: "Safeguarding", refresh_months: 12 },
  {
    category: "child_protection",
    label: "Child Protection",
    refresh_months: 12,
  },
  { category: "prevent", label: "Prevent Duty", refresh_months: 12 },
  { category: "fire_safety", label: "Fire Safety", refresh_months: 12 },
  { category: "first_aid", label: "First Aid", refresh_months: 36 },
  {
    category: "gdpr_data_protection",
    label: "GDPR/Data Protection",
    refresh_months: 12,
  },
  { category: "health_safety", label: "Health & Safety", refresh_months: 12 },
];

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 86400000);

  // Get all active staff
  const { data: staff } = await supabase
    .from("staff_directory")
    .select("id, first_name, last_name, job_title, role_category")
    .eq("organization_id", auth.organizationId)
    .eq("is_active", true);

  if (!staff || staff.length === 0) {
    return apiSuccess({ categories: [], staff_count: 0 });
  }

  const staffIds = staff.map((s) => s.id);

  // Get all mandatory training records
  const { data: records } = await supabase
    .from("staff_training_records")
    .select("*")
    .in("staff_id", staffIds)
    .eq("is_mandatory", true);

  const trainingByStaff = new Map<string, any[]>();
  (records || []).forEach((r) => {
    const arr = trainingByStaff.get(r.staff_id) || [];
    arr.push(r);
    trainingByStaff.set(r.staff_id, arr);
  });

  // Analyse each mandatory category
  const categories = MANDATORY_CATEGORIES.map((mc) => {
    const expired: any[] = [];
    const expiring_soon: any[] = [];
    const compliant: any[] = [];
    const never_completed: any[] = [];

    staff.forEach((s) => {
      const staffTraining = trainingByStaff.get(s.id) || [];
      const relevant = staffTraining
        .filter((t) => t.training_category === mc.category)
        .sort(
          (a: any, b: any) =>
            new Date(b.completion_date).getTime() -
            new Date(a.completion_date).getTime(),
        );

      const latest = relevant[0];
      const staffInfo = {
        staff_id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        job_title: s.job_title,
      };

      if (!latest) {
        never_completed.push(staffInfo);
      } else if (latest.expiry_date && new Date(latest.expiry_date) < now) {
        expired.push({
          ...staffInfo,
          expired_date: latest.expiry_date,
          last_completed: latest.completion_date,
        });
      } else if (
        latest.expiry_date &&
        new Date(latest.expiry_date) < thirtyDays
      ) {
        expiring_soon.push({
          ...staffInfo,
          expiry_date: latest.expiry_date,
          last_completed: latest.completion_date,
        });
      } else {
        compliant.push({
          ...staffInfo,
          last_completed: latest.completion_date,
          expiry_date: latest.expiry_date,
        });
      }
    });

    return {
      category: mc.category,
      label: mc.label,
      refresh_months: mc.refresh_months,
      total_staff: staff.length,
      compliant: compliant.length,
      expiring_soon_count: expiring_soon.length,
      expired_count: expired.length,
      never_completed_count: never_completed.length,
      compliance_pct:
        staff.length > 0
          ? Math.round((compliant.length / staff.length) * 100)
          : 0,
      expired,
      expiring_soon,
      never_completed,
    };
  });

  return apiSuccess({
    categories,
    staff_count: staff.length,
    overall_compliance_pct:
      categories.length > 0
        ? Math.round(
            categories.reduce((sum, c) => sum + c.compliance_pct, 0) /
              categories.length,
          )
        : 0,
  });
});
