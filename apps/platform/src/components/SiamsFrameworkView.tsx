"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/SupabaseAuthContext';
import ErrorBoundary from "@/components/common/ErrorBoundary";
import {
    SIAMS_FRAMEWORK,
    calculateStrandReadiness,
    calculateOverallSiamsReadiness
} from '@/lib/siams-framework';
import { FrameworkCategoryCard } from './framework/FrameworkCategoryCard';
import { SubcategoryAssessment } from './framework/SubcategoryAssessment';
import ActionModal from './action-plan/ActionModal';
import EdAnalysisPanel from './EdAnalysisPanel';
import { FrameworkAssessment, LocalEvidenceMatch } from './framework/types';
import { Church, Cross, BookOpen, Star, Users, Heart } from 'lucide-react';

interface SiamsFrameworkViewProps {
    assessments?: FrameworkAssessment;
    setAssessments?: (assessments: FrameworkAssessment) => void;
    localEvidence?: Record<string, LocalEvidenceMatch[]>;
}

const STRAND_ICONS: Record<string, any> = {
    'vision': Cross,
    'wisdom': BookOpen,
    'character': Star,
    'community': Users,
    'dignity': Heart,
    'worship': Church,
    're': BookOpen,
};

export default function SiamsFrameworkView({
    assessments = {},
    setAssessments = () => { },
    localEvidence = {}
}: SiamsFrameworkViewProps) {
    const { signInWithGoogle, signInWithMicrosoft } = useAuth();

    const [expandedStrands, setExpandedStrands] = useState<Set<string>>(new Set(['vision']));
    const [actionModal, setActionModal] = useState<{ isOpen: boolean; subId: string | null; evidenceId: string | null }>({
        isOpen: false,
        subId: null,
        evidenceId: null
    });
    const [showEdPanel, setShowEdPanel] = useState(false);
    const [edContext, setEdContext] = useState({ strand: '', rating: '', evidenceCount: 0 });

    const overallScores = useMemo(() => calculateOverallSiamsReadiness(assessments), [assessments]);

    const toggleStrand = useCallback((id: string) => {
        setExpandedStrands(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const openEdAnalysis = (strand: string, rating: string = 'Not Assessed', evidenceCount: number = 0) => {
        setEdContext({ strand, rating, evidenceCount });
        setShowEdPanel(true);
    };

    const handleAddAction = (subId: string, evidenceId?: string) => {
        setActionModal({ isOpen: true, subId, evidenceId: evidenceId || null });
    };

    const SIAMS_TO_EVIDENCE: Record<string, string[]> = {
        'vision': ['leadership', 'vision'],
        'wisdom': ['quality-intent', 'quality-implementation', 'quality-impact'],
        'character': ['personal-development', 'character'],
        'community': ['behaviour', 'community'],
        'dignity': ['dignity', 'equality'],
        'worship': ['worship', 'collective-worship'],
        're': ['re', 'religious-education'],
    };

    return (
        <ErrorBoundary name="SiamsFrameworkView">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animated-mesh min-h-screen">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                            <Church className="text-purple-600" size={32} />
                            SIAMS Readiness
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Statutory Inspection of Anglican and Methodist Schools
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Self Readiness</div>
                            <div className="text-3xl font-black text-slate-900 dark:text-white">{overallScores.userScore}%</div>
                        </div>
                        <div className="text-right border-l border-slate-200 dark:border-slate-800 pl-6">
                            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Total Evidence</div>
                            <div className="text-3xl font-black text-purple-600">{overallScores.totalEvidence}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {SIAMS_FRAMEWORK.map((strand) => {
                        const { userScore, evidenceCount } = calculateStrandReadiness(strand.id, assessments);
                        const isExpanded = expandedStrands.has(strand.id);

                        return (
                            <FrameworkCategoryCard
                                key={strand.id}
                                category={{
                                    id: strand.id,
                                    name: strand.name,
                                    description: strand.description,
                                    color: (strand as any).color || 'purple',
                                    guidanceSummary: strand.keyIndicators.join(' • ')
                                }}
                                isExpanded={isExpanded}
                                onToggle={() => toggleStrand(strand.id)}
                                userScore={userScore}
                                aiScore={0}
                                onInfoClick={(e) => e.stopPropagation()}
                                openEdAnalysis={() => openEdAnalysis(strand.name)}
                            >
                                <div className="space-y-6">
                                    {strand.inspectionQuestions.map(question => (
                                        <SubcategoryAssessment
                                            key={question.id}
                                            subcategory={{
                                                id: question.id,
                                                name: question.question,
                                                description: question.guidance,
                                                evidenceRequired: question.evidenceRequired.map((er, idx) => ({ id: `${idx}`, name: er }))
                                            }}
                                            assessment={assessments[question.id] || {}}
                                            evidenceMatches={Object.fromEntries(
                                                question.evidenceRequired.map((er, idx) => {
                                                    const areas = SIAMS_TO_EVIDENCE[strand.id] || [strand.id];
                                                    const matches = areas.flatMap(area => localEvidence[area] || []);
                                                    return [`${question.id}_${idx}`, matches];
                                                })
                                            )}
                                            onEditClick={() => { }}
                                            onAddAction={(e, evidenceId) => {
                                                e.stopPropagation();
                                                handleAddAction(question.id, evidenceId);
                                            }}
                                            onViewEvidence={() => { }}
                                        />
                                    ))}
                                </div>
                            </FrameworkCategoryCard>
                        );
                    })}
                </div>

                {actionModal.isOpen && (
                    <ActionModal
                        isOpen={actionModal.isOpen}
                        onClose={() => setActionModal({ ...actionModal, isOpen: false })}
                        subCategoryName={SIAMS_FRAMEWORK.flatMap(s => s.inspectionQuestions).find(q => q.id === actionModal.subId)?.question || ''}
                        evidenceItem={actionModal.evidenceId || undefined}
                        onSave={(action) => {
                            const subId = actionModal.subId!;
                            const subAssessment = assessments[subId] || {};
                            const currentActions = subAssessment.actions || [];

                            setAssessments({
                                ...assessments,
                                [subId]: {
                                    ...subAssessment,
                                    actions: [...currentActions, action as any]
                                }
                            });
                            setActionModal({ ...actionModal, isOpen: false });
                        }}
                    />
                )}

                {showEdPanel && (
                    <EdAnalysisPanel
                        isOpen={showEdPanel}
                        onClose={() => setShowEdPanel(false)}
                        categoryName={edContext.strand}
                        currentRating={edContext.rating}
                        evidenceCount={edContext.evidenceCount}
                        onActionCreated={() => { }}
                    />
                )}
            </div>
        </ErrorBoundary>
    );
}
