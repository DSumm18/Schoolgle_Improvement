"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, FileCheck, BookOpen, CheckSquare, Settings } from "lucide-react";
import OfstedFrameworkView from "@/components/OfstedFrameworkView";
import SiamsFrameworkView from "@/components/SiamsFrameworkView";
import ActionsDashboard from "@/components/ActionsDashboard";
import SettingsView from "@/components/SettingsView";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";

type ActiveView = 'dashboard' | 'ofsted' | 'siams' | 'actions' | 'settings';

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
    const { user, loading, signOut } = useAuth();
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
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🏫</span>
                            <span className="font-bold text-xl text-gray-900">Schoolgle</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">{user.email}</span>
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                {user.email?.[0].toUpperCase()}
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tab Navigation */}
                <div className="mb-8 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveView('dashboard')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeView === 'dashboard'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <LayoutDashboard size={18} />
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActiveView('ofsted')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeView === 'ofsted'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <FileCheck size={18} />
                            Ofsted Framework
                        </button>
                        <button
                            onClick={() => setActiveView('siams')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeView === 'siams'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <BookOpen size={18} />
                            SIAMS Framework
                        </button>
                        <button
                            onClick={() => setActiveView('actions')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeView === 'actions'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <CheckSquare size={18} />
                            Action Plan
                        </button>
                        <button
                            onClick={() => setActiveView('settings')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeView === 'settings'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <Settings size={18} />
                            Settings
                        </button>
                    </nav>
                </div>

                {/* Dashboard View */}
                {activeView === 'dashboard' && (
                    <>
                        {/* Search Section */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Search Your Documents</h1>
                            <SearchBar onSearch={handleSearch} isLoading={isSearching} />

                            {searchQuery && (
                                <div className="mt-8">
                                    <SearchResults results={searchResults} query={searchQuery} />
                                </div>
                            )}
                        </div>

                        {/* Scan Status Message */}
                        {scanStatus && (
                            <div className={`mb-6 p-4 rounded-lg text-center ${scanStatus.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                                }`}>
                                {scanStatus}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Left Column: Evidence Sources */}
                            <div className="col-span-1 space-y-6">
                                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Evidence Sources</h2>
                                    <p className="text-sm text-gray-600">
                                        Connect your Google Drive or OneDrive to scan for evidence.
                                    </p>
                                    <p className="text-xs text-gray-500 mt-4">
                                        Evidence scanning features coming soon.
                                    </p>
                                </div>
                            </div>

                            {/* Right Column: Dashboard Widgets */}
                            <div className="col-span-2 space-y-6">
                                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Readiness Overview</h2>
                                    <p className="text-gray-600">
                                        Use the tabs above to access the Ofsted Framework, SIAMS Framework, or Action Plan views.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* Ofsted Framework View */}
                {activeView === 'ofsted' && (
                    <OfstedFrameworkView
                        assessments={ofstedAssessments}
                        setAssessments={setOfstedAssessments}
                    />
                )}

                {/* SIAMS Framework View */}
                {activeView === 'siams' && (
                    <SiamsFrameworkView />
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

                {/* Settings View */}
                {activeView === 'settings' && (
                    <SettingsView />
                )}
            </main>
        </div>
    );
}
