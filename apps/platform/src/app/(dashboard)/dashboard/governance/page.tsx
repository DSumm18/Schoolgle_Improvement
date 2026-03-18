"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { ModulePageHeader } from "@/components/ui/module-page-header";
import { useAuth } from "@/context/SupabaseAuthContext";
import { GovernanceDashboard } from "@/components/governance";
import { GovernorModal } from "@/components/governance";
import { MeetingModal } from "@/components/governance";
import { TrainingModal } from "@/components/governance";
import { PolicyModal } from "@/components/governance";
import { VisitModal } from "@/components/governance";
import type {
  Governor,
  GovernorMeeting,
  GovernorTraining,
  GovernancePolicyReviewWithOwner,
  GovernorVisitWithGovernor,
} from "@/lib/governance";

export default function GovernancePage() {
  const { organization } = useAuth();
  const [selectedGovernor, setSelectedGovernor] = useState<Governor | null>(
    null,
  );
  const [selectedMeeting, setSelectedMeeting] =
    useState<GovernorMeeting | null>(null);
  const [selectedTraining, setSelectedTraining] =
    useState<GovernorTraining | null>(null);
  const [selectedPolicy, setSelectedPolicy] =
    useState<GovernancePolicyReviewWithOwner | null>(null);
  const [selectedVisit, setSelectedVisit] =
    useState<GovernorVisitWithGovernor | null>(null);

  const [isGovernorModalOpen, setIsGovernorModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const organizationId = organization?.id || "";

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
      <ModulePageHeader
        moduleId="governance"
        icon={ShieldCheck}
        label="Strategic Oversight"
        title="Governance Portal"
      />

      {/* Main Dashboard */}
      <GovernanceDashboard
        organizationId={organizationId}
        refreshKey={refreshKey}
        {...({
          onAddGovernor: () => {
            setSelectedGovernor(null);
            setIsGovernorModalOpen(true);
          },
          onAddMeeting: () => {
            setSelectedMeeting(null);
            setIsMeetingModalOpen(true);
          },
          onAddTraining: () => {
            setSelectedTraining(null);
            setIsTrainingModalOpen(true);
          },
          onAddPolicy: () => {
            setSelectedPolicy(null);
            setIsPolicyModalOpen(true);
          },
          onAddVisit: () => {
            setSelectedVisit(null);
            setIsVisitModalOpen(true);
          },
        } as any)}
      />

      {/* Modals */}
      <GovernorModal
        isOpen={isGovernorModalOpen}
        onClose={() => {
          setIsGovernorModalOpen(false);
          setSelectedGovernor(null);
        }}
        onSave={handleRefresh}
        organizationId={organizationId}
        initialData={selectedGovernor}
      />

      <MeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => {
          setIsMeetingModalOpen(false);
          setSelectedMeeting(null);
        }}
        onSave={handleRefresh}
        organizationId={organizationId}
        initialData={selectedMeeting}
      />

      <TrainingModal
        isOpen={isTrainingModalOpen}
        onClose={() => {
          setIsTrainingModalOpen(false);
          setSelectedTraining(null);
        }}
        onSave={handleRefresh}
        organizationId={organizationId}
        initialData={selectedTraining}
      />

      <PolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => {
          setIsPolicyModalOpen(false);
          setSelectedPolicy(null);
        }}
        onSave={handleRefresh}
        organizationId={organizationId}
        initialData={selectedPolicy}
      />

      <VisitModal
        isOpen={isVisitModalOpen}
        onClose={() => {
          setIsVisitModalOpen(false);
          setSelectedVisit(null);
        }}
        onSave={handleRefresh}
        organizationId={organizationId}
        initialData={selectedVisit}
      />
    </div>
  );
}
