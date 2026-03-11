/**
 * SEF Data Aggregator
 *
 * Queries ALL Schoolgle modules to build CrossModuleData for the Living SEF engine.
 * Each function is a focused query against a specific Supabase table set.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { CrossModuleData } from "./living-sef-engine";

/**
 * Aggregate all cross-module data for a given organization
 */
export async function aggregateCrossModuleData(
  supabase: SupabaseClient,
  organizationId: string,
  schoolName: string,
  schoolType: string,
  academicYear: string,
): Promise<CrossModuleData> {
  // Run all queries in parallel for speed
  const [
    assessments,
    evidence,
    actions,
    dfeData,
    estates,
    governance,
    compliance,
    staff,
  ] = await Promise.all([
    fetchAssessments(supabase, organizationId),
    fetchEvidence(supabase, organizationId),
    fetchActions(supabase, organizationId),
    fetchDfEData(supabase, organizationId),
    fetchEstatesData(supabase, organizationId),
    fetchGovernanceData(supabase, organizationId),
    fetchComplianceData(supabase, organizationId),
    fetchStaffData(supabase, organizationId),
  ]);

  return {
    assessments,
    evidence,
    actions,
    dfeData,
    estates,
    governance,
    compliance,
    staff,
    schoolName,
    schoolType,
    academicYear,
  };
}

// --- Individual Module Queries ---

async function fetchAssessments(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<CrossModuleData["assessments"]> {
  const { data, error } = await supabase
    .from("ofsted_assessments")
    .select(
      "subcategory_id, category_id, school_rating, ai_rating, ai_rationale, evidence_count, updated_at",
    )
    .eq("organization_id", organizationId);

  if (error) {
    console.error("[SEF Aggregator] assessments error:", error.message);
    return [];
  }

  return (data || []).map((a) => ({
    subcategoryId: a.subcategory_id,
    categoryId: a.category_id,
    schoolRating: a.school_rating,
    aiRating: a.ai_rating,
    aiRationale: a.ai_rationale,
    evidenceCount: a.evidence_count || 0,
    updatedAt: a.updated_at,
  }));
}

async function fetchEvidence(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<CrossModuleData["evidence"]> {
  const { data, error } = await supabase
    .from("ofsted_evidence_matches")
    .select(
      "document_name, category_id, subcategory_id, confidence, matched_keywords, key_quotes",
    )
    .eq("organization_id", organizationId)
    .order("confidence", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[SEF Aggregator] evidence error:", error.message);
    return [];
  }

  return (data || []).map((e) => ({
    documentName: e.document_name,
    categoryId: e.category_id,
    subcategoryId: e.subcategory_id,
    confidence: e.confidence || 0,
    matchedKeywords: e.matched_keywords || [],
    keyQuotes: e.key_quotes || [],
  }));
}

async function fetchActions(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<CrossModuleData["actions"]> {
  const { data, error } = await supabase
    .from("actions")
    .select(
      "id, title, description, category_id, subcategory_id, user_status, ai_status, priority, due_date, eef_strategy, eef_impact_months, estimated_cost, owner_name",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[SEF Aggregator] actions error:", error.message);
    return [];
  }

  return (data || []).map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description || "",
    categoryId: a.category_id || "",
    subcategoryId: a.subcategory_id,
    userStatus: a.user_status,
    aiStatus: a.ai_status,
    priority: a.priority,
    dueDate: a.due_date,
    eefStrategy: a.eef_strategy,
    eefImpactMonths: a.eef_impact_months,
    estimatedCost: a.estimated_cost,
    ownerName: a.owner_name,
  }));
}

async function fetchDfEData(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<CrossModuleData["dfeData"]> {
  const result: CrossModuleData["dfeData"] = {};

  // Try to get school URN from organization
  const { data: org } = await supabase
    .from("organizations")
    .select("urn, metadata")
    .eq("id", organizationId)
    .single();

  if (!org?.urn) return result;

  // Attendance data
  const { data: attendance } = await supabase
    .from("dfe_attendance")
    .select("overall_absence, persistent_absence")
    .eq("urn", org.urn)
    .order("academic_year", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (attendance) {
    result.attendance = {
      overall: 100 - (attendance.overall_absence || 5),
      persistentAbsence: attendance.persistent_absence || 0,
      nationalAverage: 94.5, // DfE national average
    };
  }

  // Census data
  const { data: census } = await supabase
    .from("dfe_census")
    .select("total_pupils, fsm_percentage, send_percentage, eal_percentage")
    .eq("urn", org.urn)
    .order("academic_year", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (census) {
    result.census = {
      totalPupils: census.total_pupils || 0,
      fsmPercentage: census.fsm_percentage || 0,
      sendPercentage: census.send_percentage || 0,
      ealPercentage: census.eal_percentage || 0,
    };
  }

  // Check metadata for Ofsted rating
  if (org.metadata) {
    const meta =
      typeof org.metadata === "string"
        ? JSON.parse(org.metadata)
        : org.metadata;
    result.ofstedRating = meta.ofstedRating;
    result.lastInspectionDate = meta.lastInspectionDate;
  }

  return result;
}

async function fetchEstatesData(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<CrossModuleData["estates"]> {
  const defaults: CrossModuleData["estates"] = {
    overdueTasks: 0,
    criticalIssues: [],
    complianceRate: 100,
    recentCompletions: [],
    upcomingDeadlines: [],
  };

  // Overdue tasks
  const { data: overdue, error: overdueErr } = await supabase
    .from("estates_tasks")
    .select("id, title, priority")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .lt("due_date", new Date().toISOString());

  if (overdueErr) {
    console.error(
      "[SEF Aggregator] estates overdue error:",
      overdueErr.message,
    );
    return defaults;
  }

  defaults.overdueTasks = overdue?.length || 0;
  defaults.criticalIssues = (overdue || [])
    .filter((t) => t.priority === "critical" || t.priority === "high")
    .map((t) => t.title)
    .slice(0, 5);

  // Compliance rate: completed / total tasks
  const { count: totalTasks } = await supabase
    .from("estates_tasks")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const { count: completedTasks } = await supabase
    .from("estates_tasks")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "completed");

  if (totalTasks && totalTasks > 0) {
    defaults.complianceRate = Math.round(
      ((completedTasks || 0) / totalTasks) * 100,
    );
  }

  // Recent completions (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: completions } = await supabase
    .from("estates_tasks")
    .select("title")
    .eq("organization_id", organizationId)
    .eq("status", "completed")
    .gte("updated_at", thirtyDaysAgo.toISOString())
    .limit(5);

  defaults.recentCompletions = (completions || []).map((c) => c.title);

  // Upcoming deadlines (next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { data: upcoming } = await supabase
    .from("estates_tasks")
    .select("title, due_date")
    .eq("organization_id", organizationId)
    .neq("status", "completed")
    .gte("due_date", new Date().toISOString())
    .lte("due_date", thirtyDaysFromNow.toISOString())
    .order("due_date", { ascending: true })
    .limit(5);

  defaults.upcomingDeadlines = (upcoming || []).map((u) => ({
    task: u.title,
    dueDate: u.due_date,
  }));

  return defaults;
}

async function fetchGovernanceData(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<CrossModuleData["governance"]> {
  const defaults: CrossModuleData["governance"] = {
    meetingsThisTerm: 0,
    governorTrainingRate: 0,
    recentVisits: [],
    keyDecisions: [],
    challengeExamples: [],
  };

  // Meetings this term (last 4 months)
  const fourMonthsAgo = new Date();
  fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

  const { count: meetingCount } = await supabase
    .from("governance_meetings")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .gte("meeting_date", fourMonthsAgo.toISOString());

  defaults.meetingsThisTerm = meetingCount || 0;

  // Governor training rate
  const { data: governors } = await supabase
    .from("governors")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  if (governors && governors.length > 0) {
    const { count: trainedCount } = await supabase
      .from("governor_training")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in(
        "governor_id",
        governors.map((g) => g.id),
      );

    defaults.governorTrainingRate = Math.round(
      ((trainedCount || 0) / governors.length) * 100,
    );
  }

  // Recent monitoring visits
  const { data: visits } = await supabase
    .from("governance_visits")
    .select("purpose")
    .eq("organization_id", organizationId)
    .gte("visit_date", fourMonthsAgo.toISOString())
    .limit(5);

  defaults.recentVisits = (visits || []).map((v) => v.purpose);

  return defaults;
}

async function fetchComplianceData(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<CrossModuleData["compliance"]> {
  const defaults: CrossModuleData["compliance"] = {
    policiesUpToDate: 0,
    policiesTotal: 0,
    scr: { complete: false, gaps: 0 },
    gdprStatus: "unknown",
    trainingCompliance: 0,
  };

  // Policies
  const { count: totalPolicies } = await supabase
    .from("compliance_policies")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const { count: currentPolicies } = await supabase
    .from("compliance_policies")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "current");

  defaults.policiesTotal = totalPolicies || 0;
  defaults.policiesUpToDate = currentPolicies || 0;

  // SCR completeness
  const { data: scrEntries } = await supabase
    .from("compliance_scr_entries")
    .select("dbs_status")
    .eq("organization_id", organizationId);

  if (scrEntries && scrEntries.length > 0) {
    const gaps = scrEntries.filter(
      (e) => !e.dbs_status || e.dbs_status === "missing",
    ).length;
    defaults.scr = {
      complete: gaps === 0,
      gaps,
    };
  }

  // Training compliance
  const { count: totalTraining } = await supabase
    .from("compliance_training_records")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId);

  const { count: completedTraining } = await supabase
    .from("compliance_training_records")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "completed");

  if (totalTraining && totalTraining > 0) {
    defaults.trainingCompliance = Math.round(
      ((completedTraining || 0) / totalTraining) * 100,
    );
  }

  return defaults;
}

async function fetchStaffData(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<CrossModuleData["staff"]> {
  const defaults: CrossModuleData["staff"] = {
    totalTeachers: 0,
    vacancies: 0,
    cpdHoursAverage: 0,
  };

  // Staff counts
  const { count: teacherCount } = await supabase
    .from("staff")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .in("role", [
      "teacher",
      "head_of_department",
      "assistant_head",
      "deputy_head",
      "headteacher",
    ]);

  defaults.totalTeachers = teacherCount || 0;

  // Vacancies (staff with status 'vacancy')
  const { count: vacancyCount } = await supabase
    .from("staff")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("status", "vacancy");

  defaults.vacancies = vacancyCount || 0;

  return defaults;
}
