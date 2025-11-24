"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DrivePicker from "@/components/DrivePicker";
import OneDrivePicker from "@/components/OneDrivePicker";
import { Folder } from "lucide-react";

interface SelectedFolder {
    id: string;
    name: string;
    source: 'google' | 'onedrive';
}

export default function DashboardPage() {
    const { user, loading, providerId } = useAuth();
    const router = useRouter();
    const [folders, setFolders] = useState<SelectedFolder[]>([]);

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

    const handleFolderSelect = (folder: { id: string; name: string }, source: 'google' | 'onedrive') => {
        if (!folders.find((f) => f.id === folder.id)) {
            setFolders([...folders, { ...folder, source }]);
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
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column: Evidence Sources */}
                    <div className="col-span-1 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Evidence Sources</h2>
                            <div className="space-y-4">
                                {providerId === 'microsoft.com' ? (
                                    <OneDrivePicker onFolderSelect={(f) => handleFolderSelect(f, 'onedrive')} />
                                ) : (
                                    <DrivePicker onFolderSelect={(f) => handleFolderSelect(f, 'google')} />
                                )}

                                <div className="mt-6">
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                                        Connected Folders
                                    </h3>
                                    {folders.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">No folders connected yet.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {folders.map((folder) => (
                                                <li key={folder.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                    <Folder size={18} className={folder.source === 'onedrive' ? "text-blue-700" : "text-green-600"} />
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-sm font-medium text-gray-700 truncate">{folder.name}</span>
                                                        <span className="text-xs text-gray-400 capitalize">{folder.source}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Dashboard Widgets (Placeholder) */}
                    <div className="col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Readiness Overview</h2>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-center">
                                    <div className="text-2xl font-bold text-green-700">Good</div>
                                    <div className="text-xs text-green-600 uppercase mt-1">Quality of Education</div>
                                </div>
                                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-center">
                                    <div className="text-2xl font-bold text-yellow-700">Review</div>
                                    <div className="text-xs text-yellow-600 uppercase mt-1">Safeguarding</div>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
                                    <div className="text-2xl font-bold text-blue-700">96%</div>
                                    <div className="text-xs text-blue-600 uppercase mt-1">Attendance</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
