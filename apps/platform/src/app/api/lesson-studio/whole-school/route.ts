import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export const GET = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();
  const orgId = auth.organizationId;
  if (!orgId) return apiError("No organization", 400);

  const weekCommencing = req.nextUrl.searchParams.get("weekCommencing");
  if (!weekCommencing) return apiError("weekCommencing required", 400);

  // Load all classes for the org
  const { data: classes, error: classesError } = await supabase
    .from("ls_classes")
    .select("id, class_name, year_group, teacher_user_id, teacher_name")
    .eq("organization_id", orgId)
    .order("year_group")
    .order("class_name");

  if (classesError) return apiError(classesError.message, 500);
  if (!classes || classes.length === 0) return apiSuccess({ classes: [] });

  const classIds = classes.map((c) => c.id);

  // Load all timetable slots for these classes
  const { data: slots, error: slotsError } = await supabase
    .from("ls_timetable_slots")
    .select("id, class_id, day_of_week, start_time, end_time, subject")
    .in("class_id", classIds)
    .eq("organization_id", orgId)
    .order("day_of_week")
    .order("start_time");

  if (slotsError) return apiError(slotsError.message, 500);

  // Load all lesson plans for this week
  const { data: plans, error: plansError } = await supabase
    .from("ls_lesson_plans")
    .select("id, class_id, timetable_slot_id, day_of_week, subject, title, status, week_commencing")
    .in("class_id", classIds)
    .eq("organization_id", orgId)
    .eq("week_commencing", weekCommencing);

  if (plansError) return apiError(plansError.message, 500);

  // Build a plan lookup by (class_id, day_of_week, subject)
  const planMap = new Map<string, typeof plans[number]>();
  for (const plan of plans || []) {
    const key = `${plan.class_id}:${plan.day_of_week}:${plan.subject}`;
    planMap.set(key, plan);
    // Also key by slot id if available
    if (plan.timetable_slot_id) {
      planMap.set(`slot:${plan.timetable_slot_id}`, plan);
    }
  }

  // Group slots by class_id
  const slotsByClass = new Map<string, typeof slots[number][]>();
  for (const slot of slots || []) {
    if (!slotsByClass.has(slot.class_id)) slotsByClass.set(slot.class_id, []);
    slotsByClass.get(slot.class_id)!.push(slot);
  }

  // Assemble response
  const result = (classes || []).map((cls) => {
    const classSlots = slotsByClass.get(cls.id) || [];
    return {
      id: cls.id,
      class_name: cls.class_name,
      year_group: cls.year_group,
      teacher_name: (cls as Record<string, unknown>).teacher_name as string | undefined,
      slots: classSlots.map((slot) => {
        const planBySlot = planMap.get(`slot:${slot.id}`);
        const planByKey = planMap.get(`${cls.id}:${slot.day_of_week}:${slot.subject}`);
        const plan = planBySlot || planByKey;
        return {
          id: slot.id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          subject: slot.subject,
          plan_title: plan?.title ?? undefined,
          plan_status: plan?.status ?? undefined,
        };
      }),
    };
  });

  return apiSuccess({ classes: result });
});
