"use client";

import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/SupabaseAuthContext";
import { ComplianceDashboard } from "@/components/compliance";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import { FeatureChecklist } from "@/components/ui/feature-discovery";
import { COMPLIANCE_FEATURES } from "@/lib/feature-definitions";

export default function CompliancePage() {
  const { organization } = useAuth();
  const organizationId = organization?.id || "";

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="compliance"
        icon={ShieldCheck}
        label="Statutory Assurance"
        title="Compliance Hub"
      />

      <ComplianceDashboard organizationId={organizationId} />

      <FeatureChecklist
        features={COMPLIANCE_FEATURES}
        moduleFilter="compliance"
        accentColor="#E6C3FF"
      />
    </div>
  );
}
