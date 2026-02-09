"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { GovernanceDashboard } from '@/components/governance';
import { GovernorModal } from '@/components/governance';
import { MeetingModal } from '@/components/governance';
import { TrainingModal } from '@/components/governance';
import { PolicyModal } from '@/components/governance';
import { VisitModal } from '@/components/governance';
import type { Governor, Meeting, TrainingRecord, PolicyReview, MonitoringVisit } from '@/lib/governance';

export default function GovernancePage() {
    const { organization } = useAuth();
    const [selectedGovernor, setSelectedGovernor] = useState<Governor | null>(null);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [selectedTraining, setSelectedTraining] = useState<TrainingRecord | null>(null);
    const [selectedPolicy, setSelectedPolicy] = useState<PolicyReview | null>(null);
    const [selectedVisit, setSelectedVisit] = useState<MonitoringVisit | null>(null);

    const [isGovernorModalOpen, setIsGovernorModalOpen] = useState(false);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

    const organizationId = organization?.id || '';

    const handleRefresh = () => {
        // Force re-fetch by triggering a state update
        window.location.reload();
    };

    return (
        <div className="p-6 md:p-8 space-y-6 min-h-screen max-w-[1600px] mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-6"
            >
                <div className="p-3 bg-amber-100 dark:bg-amber-900/20 rounded-2xl">
                    <ShieldCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs uppercase tracking-[0.2em] mb-1">
                        <Sparkles size={14} className="animate-pulse" />
                        Strategic Oversight
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Governance Portal
                    </h1>
                </div>
            </motion.div>

            {/* Main Dashboard */}
            <GovernanceDashboard
                organizationId={organizationId}
                onAddGovernor={() => {
                    setSelectedGovernor(null);
                    setIsGovernorModalOpen(true);
                }}
                onAddMeeting={() => {
                    setSelectedMeeting(null);
                    setIsMeetingModalOpen(true);
                }}
                onAddTraining={() => {
                    setSelectedTraining(null);
                    setIsTrainingModalOpen(true);
                }}
                onAddPolicy={() => {
                    setSelectedPolicy(null);
                    setIsPolicyModalOpen(true);
                }}
                onAddVisit={() => {
                    setSelectedVisit(null);
                    setIsVisitModalOpen(true);
                }}
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
