"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, FileCheck, BookOpen, CheckSquare, Settings, FileText, Eye, FolderOpen, Mic, Search, FileSpreadsheet } from "lucide-react";
import OrigamiParticles from "@/components/OrigamiParticles";
import OfstedFrameworkView from "@/components/OfstedFrameworkView";
import SiamsFrameworkView from "@/components/SiamsFrameworkView";
import ActionsDashboard from "@/components/ActionsDashboard";
import SettingsView from "@/components/SettingsView";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import EdChatbot from "@/components/EdChatbot";
import SEFGenerator from "@/components/SEFGenerator";
import LessonObservationModal from "@/components/LessonObservationModal";
import LocalFolderScanner from "@/components/LocalFolderScanner";
import MondayDashboard from "@/components/MondayDashboard";
import VoiceObservation from "@/components/VoiceObservation";
import MockInspector from "@/components/MockInspector";
import ReportGenerator from "@/components/ReportGenerator";

type ActiveView = 'dashboard' | 'ofsted' | 'siams' | 'actions' | 'sef' | 'settings' | 'voice' | 'inspector' | 'reports';

interface SearchResult {
    id: number;
    content: string;
    metadata: {
        filename: string;
        fileId?: string;
        mimeType?: string;
        provider?: string;
    };
    similarity: number;
}

export default function DashboardPage() {
    const { user, loading, signOut, organization } = useAuth();
    const router = useRouter();
    const [activeView, setActiveView] = useState<ActiveView>('dashboard');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [scanStatus, setScanStatus] = useState('');

    // Ofsted Assessments State
    const [ofstedAssessments, setOfstedAssessments] = useState<Record<string, any>>({});

    // SIAMS Assessments State  
    const [siamsAssessments, setSiamsAssessments] = useState<Record<string, any>>({});

    // Observations State
    const [observations, setObservations] = useState<any[]>([]);
    const [showObservationModal, setShowObservationModal] = useState(false);

    // Local Folder Scanner State
    const [showLocalScanner, setShowLocalScanner] = useState(false);
    const [scannedFiles, setScannedFiles] = useState<any[]>([]);
    
    // Actions State (aggregated from assessments)
    const [actions, setActions] = useState<any[]>([]);

    const handleSaveObservation = (observation: any) => {
        setObservations(prev => [...prev, observation]);
        console.log('Observation saved:', observation);
    };

    // Evidence analysis results (shared between scanner and framework)
    const [evidenceMatches, setEvidenceMatches] = useState<any[]>([]);
    const [evidenceByArea, setEvidenceByArea] = useState<Record<string, any[]>>({});

    const handleLocalScanComplete = (files: any[]) => {
        // REPLACE files instead of appending (fixes duplicate counting)
        setScannedFiles(files);
        console.log('Local scan complete:', files.length, 'files');
    };

    const handleAnalysisComplete = (analysis: any) => {
        console.log('Evidence analysis complete:', analysis);
        setEvidenceMatches(analysis.allMatches || []);
        setEvidenceByArea(analysis.matchesByArea || {});
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        setIsSearching(true);

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, userId: user.uid }),
            });

            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.results || []);
            } else {
                console.error('Search failed');
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="min-h-screen bg-white relative">
            {/* Origami Particle Background */}
            <OrigamiParticles text="Improve" opacity={0.2} />
            
            <nav className="relative z-10 border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                                <span className="text-white font-bold text-sm">S</span>
                            </div>
                            <span className="font-semibold text-gray-900">Schoolgle</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">{user.email}</span>
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-medium text-sm">
                                {user.email?.[0].toUpperCase()}
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 max-w-6xl mx-auto px-6 py-8">
                {/* Tab Navigation */}
                <div className="mb-8 border-b border-gray-100">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        <button
                            onClick={() => setActiveView('dashboard')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${activeView === 'dashboard'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <LayoutDashboard size={16} />
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveView('ofsted')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${activeView === 'ofsted'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <FileCheck size={16} />
                            Ofsted Framework
                        </button>
                        <button
                            onClick={() => setActiveView('siams')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${activeView === 'siams'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <BookOpen size={16} />
                            SIAMS Framework
                        </button>
                        <button
                            onClick={() => setActiveView('actions')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${activeView === 'actions'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <CheckSquare size={16} />
                            Action Plan
                        </button>
                        <button
                            onClick={() => setActiveView('voice')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${activeView === 'voice'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Mic size={16} />
                            Voice
                        </button>
                        <button
                            onClick={() => setActiveView('reports')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${activeView === 'reports'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <FileSpreadsheet size={16} />
                            Reports
                        </button>
                        <button
                            onClick={() => setActiveView('inspector')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${activeView === 'inspector'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Search size={16} />
                            Mock Inspector
                        </button>
                        <button
                            onClick={() => setActiveView('settings')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors whitespace-nowrap ${activeView === 'settings'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <Settings size={16} />
                            Settings
                        </button>
                    </nav>
                </div>

                {/* Dashboard View */}
                {activeView === 'dashboard' && (
                    <MondayDashboard
                        organizationId={organization?.id}
                        ofstedAssessments={ofstedAssessments}
                        siamsAssessments={siamsAssessments}
                        actions={Object.values({ ...ofstedAssessments, ...siamsAssessments })
                            .flatMap((assessment: any) => assessment?.actions || [])}
                        evidenceCount={evidenceMatches.length}
                        isChurchSchool={true}
                        onNavigate={(view) => setActiveView(view as ActiveView)}
                    />
                )}

                {/* Ofsted Framework View */}
                {activeView === 'ofsted' && (
                    <OfstedFrameworkView
                        assessments={ofstedAssessments}
                        setAssessments={setOfstedAssessments}
                        localEvidence={evidenceByArea}
                    />
                )}

                {/* SIAMS Framework View */}
                {activeView === 'siams' && (
                    <SiamsFrameworkView
                        assessments={siamsAssessments}
                        setAssessments={setSiamsAssessments}
                        localEvidence={evidenceByArea}
                    />
                )}

                {/* Actions Dashboard View */}
                {activeView === 'actions' && (
                    <ActionsDashboard
                        actions={
                            Object.values({ ...ofstedAssessments, ...siamsAssessments })
                                .flatMap((assessment: any) => assessment?.actions || [])
                        }
                        onUpdateAction={(updatedAction) => {
                            console.log('Action updated:', updatedAction);
                        }}
                    />
                )}

                {/* SEF View */}
                {activeView === 'sef' && (
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Self-Evaluation Form</h2>
                                <p className="text-gray-600">Generate inspection-ready documentation</p>
                            </div>
                            <button
                                onClick={() => setShowObservationModal(true)}
                                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 flex items-center gap-2"
                            >
                                <Eye size={18} />
                                New Observation
                            </button>
                        </div>

                        {/* Recent Observations */}
                        {observations.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Recent Observations ({observations.length})</h3>
                                <div className="space-y-2">
                                    {observations.slice(0, 5).map((obs, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <span className="font-medium text-gray-900">{obs.teacher}</span>
                                                <span className="text-gray-500 mx-2">•</span>
                                                <span className="text-gray-600">{obs.subject}</span>
                                                <span className="text-gray-500 mx-2">•</span>
                                                <span className="text-gray-500 text-sm">{obs.date}</span>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                obs.overallJudgement === 'outstanding' ? 'bg-green-100 text-green-700' :
                                                obs.overallJudgement === 'good' ? 'bg-blue-100 text-blue-700' :
                                                obs.overallJudgement === 'requires_improvement' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {obs.overallJudgement?.replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SEF Generator */}
                        <SEFGenerator
                            schoolName={organization?.name || 'Your School'}
                            assessments={ofstedAssessments}
                            actions={Object.values({ ...ofstedAssessments, ...siamsAssessments })
                                .flatMap((assessment: any) => assessment?.actions || [])}
                            observations={observations}
                        />
                    </div>
                )}

                {/* Voice-to-Observation View */}
                {activeView === 'voice' && (
                    <VoiceObservation
                        onSaveObservation={(observation) => {
                            setObservations(prev => [...prev, observation]);
                            console.log('Voice observation saved:', observation);
                        }}
                    />
                )}

                {/* One-Click Reports View */}
                {activeView === 'reports' && (
                    <ReportGenerator
                        schoolData={{
                            name: organization?.name || 'Your School',
                            academicYear: '2024-2025',
                            isChurchSchool: true
                        }}
                        ofstedAssessments={ofstedAssessments}
                        siamsAssessments={siamsAssessments}
                        actions={Object.values({ ...ofstedAssessments, ...siamsAssessments })
                            .flatMap((assessment: any) => assessment?.actions || [])}
                        evidenceMatches={evidenceMatches}
                    />
                )}

                {/* Mock Inspector View */}
                {activeView === 'inspector' && (
                    <MockInspector
                        schoolData={{
                            name: organization?.name || 'Your School',
                            phase: 'Primary'
                        }}
                        ofstedAssessments={ofstedAssessments}
                        actions={Object.values({ ...ofstedAssessments, ...siamsAssessments })
                            .flatMap((assessment: any) => assessment?.actions || [])}
                        evidenceCount={evidenceMatches.length}
                    />
                )}

                {/* Settings View */}
                {activeView === 'settings' && (
                    <SettingsView />
                )}
            </main>

            {/* Lesson Observation Modal */}
            <LessonObservationModal
                isOpen={showObservationModal}
                onClose={() => setShowObservationModal(false)}
                onSave={handleSaveObservation}
                currentUser={{ id: user?.uid || '', name: user?.displayName || user?.email || '' }}
            />

            {/* Local Folder Scanner Modal */}
            {showLocalScanner && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="max-w-2xl w-full">
                        <LocalFolderScanner
                            onScanComplete={handleLocalScanComplete}
                            onAnalysisComplete={handleAnalysisComplete}
                            onClose={() => setShowLocalScanner(false)}
                        />
                    </div>
                </div>
            )}

            {/* Ed Chatbot - Always visible */}
            <EdChatbot 
                context={{
                    schoolName: organization?.name,
                    currentView: activeView,
                    topic: activeView === 'ofsted' ? 'ofsted framework inspection' : 
                           activeView === 'siams' ? 'siams church school inspection' :
                           activeView === 'actions' ? 'school improvement actions' : undefined
                }}
            />
        </div>
    );
}
