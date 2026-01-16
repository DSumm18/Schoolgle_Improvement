"use client";

import React, { useState, useEffect } from 'react';
import { History, RotateCcw, ChevronRight, ChevronDown, CheckCircle, FileText, Loader2, X } from 'lucide-react';
import { PackVersion, PackSection } from '@/lib/packs/types';

interface VersionHistoryProps {
    packId: string;
    organizationId: string;
    userId: string;
    onRestore: (updatedPack: any) => void;
    onClose: () => void;
}

export default function VersionHistory({ packId, organizationId, userId, onRestore, onClose }: VersionHistoryProps) {
    const [versions, setVersions] = useState<PackVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [restoring, setRestoring] = useState<string | null>(null);
    const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                const response = await fetch(`/api/packs/${packId}/versions`);
                if (response.ok) {
                    const data = await response.json();
                    setVersions(data.versions || []);
                }
            } catch (err) {
                console.error('Error fetching versions:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchVersions();
    }, [packId]);

    const handleRestore = async (version: PackVersion) => {
        if (!window.confirm(`Are you sure you want to restore to Version ${version.version_number}? Current changes will be lost.`)) return;

        setRestoring(version.id);
        try {
            const response = await fetch(`/api/packs/${packId}/versions/restore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    versionNumber: version.version_number,
                    userId,
                    organizationId
                })
            });

            if (response.ok) {
                const updatedPack = await response.json();
                onRestore(updatedPack);
                onClose();
            }
        } catch (err) {
            console.error('Restore error:', err);
        } finally {
            setRestoring(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-900 text-white">
                <div className="flex items-center gap-3">
                    <History className="text-blue-400" size={24} />
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Version history</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Audit trail & manual snapshots</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Retrieving snapshots...</p>
                    </div>
                ) : versions.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-gray-400">No previous versions found.</p>
                    </div>
                ) : (
                    versions.map((version) => (
                        <div
                            key={version.id}
                            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md"
                        >
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm">
                                        v{version.version_number}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                            {version.trigger_type === 'submit' ? 'Submitted for Approval' :
                                                version.trigger_type === 'approval' ? 'Approved Version' :
                                                    version.trigger_type === 'restore' ? 'Restored Snapshot' : 'Manual Save'}
                                        </h4>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                                            {formatDate(version.created_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
                                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {expandedVersion === version.id ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </button>
                                    <button
                                        onClick={() => handleRestore(version)}
                                        disabled={restoring === version.id}
                                        className="flex items-center gap-2 bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-black hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {restoring === version.id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                        RESTORE
                                    </button>
                                </div>
                            </div>

                            {expandedVersion === version.id && (
                                <div className="px-14 pb-4 animate-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-4 pt-4 border-t border-gray-50">
                                        <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Section Snapshot</h5>
                                        {version.sections.map((section, si) => (
                                            <div key={si} className="flex gap-4">
                                                <div className="w-1 h-1 bg-blue-300 rounded-full mt-1.5" />
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900">{section.title}</p>
                                                    <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{section.content || 'Empty'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100 flex justify-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                    Restoring clones the snapshot into a new draft. original history is NEVER deleted.
                </p>
            </div>
        </div>
    );
}
