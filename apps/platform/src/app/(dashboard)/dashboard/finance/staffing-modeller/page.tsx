import { redirect } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase-server";
import { StaffingProvider } from "@/store/staffingStore";
import {
  getSchoolSettings,
  getStaffPosts,
  getScenarios,
  getScenarioPosts,
  getPayAssumptions,
  createBaselineScenario,
} from "./actions";

// Placeholder client component — replace with actual UI
function StaffingModeller() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Staff Budget Modeller</h1>
      <p className="text-muted-foreground">Data layer loaded. UI coming soon.</p>
    </div>
  );
}

export default async function StaffingModellerPage() {
  // Get current user org from auth middleware
  const supabase = createServiceRoleClient();

  // TODO: Replace with actual auth context once wired up
  // For now, this page expects orgId to come from the auth middleware
  // The dashboard layout already provides auth context
  const orgId = ""; // Will be populated from auth context

  if (!orgId) {
    // In production, the auth middleware handles this
    // This is a safety fallback
    redirect("/dashboard");
  }

  const [schoolSettings, staffPosts, scenarios] = await Promise.all([
    getSchoolSettings(orgId),
    getStaffPosts(orgId),
    getScenarios(orgId),
  ]);

  // Create baseline scenario if none exists
  let activeScenarios = scenarios;
  if (activeScenarios.length === 0) {
    const baseline = await createBaselineScenario(orgId, staffPosts);
    activeScenarios = [baseline];
  }

  const activeScenarioId = activeScenarios[0].id;

  const [scenarioPosts, payAssumptions] = await Promise.all([
    getScenarioPosts(activeScenarioId),
    getPayAssumptions(activeScenarioId),
  ]);

  return (
    <StaffingProvider
      initialData={{
        schoolSettings,
        staffPosts,
        scenarios: activeScenarios,
        activeScenarioId,
        scenarioPosts,
        payAssumptions,
      }}
    >
      <StaffingModeller />
    </StaffingProvider>
  );
}
