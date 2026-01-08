"use client";

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/lib/supabase';
import {
    OFSTED_FRAMEWORK,
    calculateCategoryReadiness,
    calculateOverallReadiness
} from '@/lib/ofsted-framework';
import { FrameworkCategoryCard } from './framework/FrameworkCategoryCard';
import { SubcategoryAssessment } from './framework/SubcategoryAssessment';
import { FrameworkScanControls } from './framework/FrameworkScanControls';
import ActionModal from './action-plan/ActionModal';
import EvidenceModal from './EvidenceModal';
import EdAnalysisPanel from './EdAnalysisPanel';
import { ActionItem, FrameworkAssessment, LocalEvidenceMatch } from './framework/types';

interface OfstedFrameworkViewProps {
    assessments: FrameworkAssessment;
    setAssessments: (assessments: FrameworkAssessment) => void;
    localEvidence?: Record<string, LocalEvidenceMatch[]>;
}

export default function OfstedFrameworkView({
    assessments,
    setAssessments,
    localEvidence = {}
}: OfstedFrameworkViewProps) {
    const { organization, accessToken, providerId, signInWithGoogle, signInWithMicrosoft } = useAuth();

    // -- State --
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['quality_of_education']));
    const [showScanConfig, setShowScanConfig] = useState(false);
    const [selectedFolderId, setSelectedFolderId] = useState('root');
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState({ status: 'idle' as any, message: '', stats: undefined });

    // Modal states
    const [actionModal, setActionModal] = useState<{ isOpen: boolean; subId: string; evidenceId: string | null }>({
        isOpen: false,
        subId: '',
        evidenceId: null
    });
    const [evidenceModal, setEvidenceModal] = useState({ isOpen: false, data: {} as any });
    const [showEdPanel, setShowEdPanel] = useState(false);
    const [edContext, setEdContext] = useState({ category: '', rating: '', evidenceCount: 0 });
    const [dbActions, setDbActions] = useState<any[]>([]);

    useEffect(() => {
        if (organization?.id) {
            fetchActions();
        }
    }, [organization?.id]);

    async function fetchActions() {
        const { data } = await supabase
            .from('actions')
            .select('*')
            .eq('organization_id', organization?.id);
        // Re-applying framework filter if necessary, but organization scope is primary

        if (data) setDbActions(data);
    }

    // -- Calculations --
    const overallScores = useMemo(() => calculateOverallReadiness(assessments), [assessments]);

    // -- Handlers --
    const toggleCategory = useCallback((id: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const handleStartScan = async () => {
        setIsScanning(true);
        setScanProgress({ status: 'scanning', message: 'Initiating AI Evidence Scan...', stats: undefined });
        setShowScanConfig(false);

        try {
            const response = await fetch('/api/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId: organization?.id,
                    provider: providerId === 'microsoft.com' ? 'microsoft.com' : 'google.com',
                    accessToken,
                    folderId: selectedFolderId === 'root' ? undefined : selectedFolderId,
                    recursive: true
                })
            });

            if (!response.ok) throw new Error('Scan initiation failed');

            const reader = response.body?.getReader();
            if (!reader) throw new Error('ReadableStream not supported');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = new TextDecoder().decode(value);
                const lines = text.split('\n').filter(l => l.trim());

                for (const line of lines) {
                    try {
                        const update = JSON.parse(line);
                        if (update.type === 'progress') {
                            setScanProgress({
                                status: 'scanning',
                                message: update.message,
                                stats: update.stats
                            });
                        } else if (update.type === 'complete') {
                            setScanProgress({
                                status: 'complete',
                                message: 'Scan completed successfully!',
                                stats: update.stats
                            });
                            setIsScanning(false);
                        } else if (update.type === 'error') {
                            throw new Error(update.message);
                        }
                    } catch (e) {
                        console.warn('Failed to parse scan update:', e);
                    }
                }
            }
        } catch (error: any) {
            console.error('Scan error:', error);
            setScanProgress({
                status: 'error',
                message: error.message || 'An error occurred during evidence scanning.',
                stats: undefined
            });
            setIsScanning(false);
        }
    };

    const openEdAnalysis = (category: string, rating: string = 'Not Assessed', evidenceCount: number = 0) => {
        setEdContext({ category, rating, evidenceCount });
        setShowEdPanel(true);
    };

    const handleAddAction = (subId: string, evidenceId?: string) => {
        setActionModal({ isOpen: true, subId, evidenceId: evidenceId || null });
    };

    const handleViewEvidence = (subId: string, evidenceId: string, evidenceName: string, matches: any[]) => {
        const subcategory = OFSTED_FRAMEWORK.flatMap(c => c.subcategories).find(s => s.id === subId);
        const category = OFSTED_FRAMEWORK.find(c => c.subcategories.some(s => s.id === subId));

        setEvidenceModal({
            isOpen: true,
            data: {
                categoryName: category?.name || '',
                subcategoryName: subcategory?.name || '',
                evidenceItem: evidenceName,
                matches: matches.map(m => ({
                    documentName: m.fileName,
                    documentLink: m.filePath,
                    confidence: m.confidence,
                    confidenceLevel: m.confidenceLevel,
                    relevanceExplanation: m.relevantExcerpt,
                    matchedKeywords: m.matchedKeywords,
                    folderPath: m.filePath.split('/').slice(0, -1).join('/')
                }))
            }
        });
    };

    return (
        <ErrorBoundary name="OfstedFrameworkView">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animated-mesh min-h-screen">
                <FrameworkScanControls
                    isScanning={isScanning}
                    accessToken={accessToken}
                    providerId={providerId}
                    showScanConfig={showScanConfig}
                    setShowScanConfig={setShowScanConfig}
                    selectedFolderId={selectedFolderId}
                    setSelectedFolderId={setSelectedFolderId}
                    onStartScan={handleStartScan}
                    onConnect={() => providerId === 'microsoft.com' ? signInWithMicrosoft() : signInWithGoogle()}
                    scanProgress={scanProgress}
                    setScanProgress={setScanProgress}
                />

                <div className="grid grid-cols-1 gap-4">
                    {OFSTED_FRAMEWORK.map((category) => {
                        const { userScore, aiScore } = calculateCategoryReadiness(category.id, assessments);
                        const isExpanded = expandedCategories.has(category.id);

                        return (
                            <FrameworkCategoryCard
                                key={category.id}
                                category={category}
                                isExpanded={isExpanded}
                                onToggle={() => toggleCategory(category.id)}
                                userScore={userScore}
                                aiScore={aiScore}
                                onInfoClick={(e) => {
                                    e.stopPropagation();
                                }}
                                openEdAnalysis={openEdAnalysis}
                            >
                                <div className="space-y-6">
                                    {category.subcategories.map(sub => (
                                        <SubcategoryAssessment
                                            key={sub.id}
                                            subcategory={sub}
                                            assessment={assessments[sub.id] || {}}
                                            evidenceMatches={Object.fromEntries(
                                                sub.evidenceRequired.map(er => [
                                                    `${sub.id}_${er.id}`,
                                                    localEvidence[`${sub.id}_${er.id}`] || []
                                                ])
                                            )}
                                            onEditClick={() => { }}
                                            onAddAction={(e, evidenceId) => {
                                                e.stopPropagation();
                                                handleAddAction(sub.id, evidenceId);
                                            }}
                                            onViewEvidence={(evidenceId, evidenceName, matches) => {
                                                handleViewEvidence(sub.id, evidenceId, evidenceName, matches);
                                            }}
                                        />
                                    ))}
                                </div>
                            </FrameworkCategoryCard>
                        );
                    })}
                </div>

                {/* Modals */}
                {actionModal.isOpen && (
                    <ActionModal
                        isOpen={actionModal.isOpen}
                        onClose={() => setActionModal({ ...actionModal, isOpen: false })}
                        subCategoryName={OFSTED_FRAMEWORK.flatMap(c => c.subcategories).find(s => s.id === actionModal.subId)?.name || ''}
                        evidenceItem={actionModal.evidenceId || undefined}
                        onSave={async (action) => {
                            const { error } = await supabase
                                .from('actions')
                                .upsert({
                                    organization_id: organization?.id,
                                    user_id: (await supabase.auth.getUser()).data.user?.id,
                                    framework_type: 'ofsted',
                                    category_id: OFSTED_FRAMEWORK.find(c => c.subcategories.some(s => s.id === actionModal.subId))?.id,
                                    subcategory_id: actionModal.subId,
                                    description: action.description,
                                    rationale: action.rationale,
                                    priority: action.priority,
                                    status: action.status,
                                    due_date: action.dueDate,
                                    owner_name: action.assignee,
                                    notes: action.notes
                                });

                            if (!error) {
                                fetchActions();
                            }
                            setActionModal({ ...actionModal, isOpen: false });
                        }}
                    />
                )}

                {evidenceModal.isOpen && (
                    <EvidenceModal
                        {...evidenceModal.data}
                        isOpen={evidenceModal.isOpen}
                        onClose={() => setEvidenceModal({ ...evidenceModal, isOpen: false })}
                    />
                )}

                {showEdPanel && (
                    <EdAnalysisPanel
                        isOpen={showEdPanel}
                        onClose={() => setShowEdPanel(false)}
                        categoryName={edContext.category}
                        currentRating={edContext.rating}
                        evidenceCount={edContext.evidenceCount}
                        onActionCreated={() => {
                            fetchActions();
                        }}
                    />
                )}
            </div>
        </ErrorBoundary>
    );
}
