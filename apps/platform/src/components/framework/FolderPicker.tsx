"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, FolderOpen, ChevronRight, Check, Loader2, AlertCircle } from 'lucide-react';

export interface DriveFolder {
    id: string;
    name: string;
    parentId: string | null;
    path: string;
}

interface FolderPickerProps {
    accessToken: string | null;
    provider: 'google' | 'microsoft';
    onSelect: (folderIds: string[]) => void;
    onClose: () => void;
    initialSelection?: string[];
}

export const FolderPicker: React.FC<FolderPickerProps> = ({
    accessToken,
    provider,
    onSelect,
    onClose,
    initialSelection = []
}) => {
    const [folders, setFolders] = useState<DriveFolder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
    const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set(initialSelection));
    const [currentPath, setCurrentPath] = useState<string>('root');

    // Fetch folders from Google Drive or OneDrive
    const fetchFolders = useCallback(async () => {
        if (!accessToken) {
            setError('No access token available');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (provider === 'google') {
                // List folders from Google Drive
                const response = await fetch(
                    `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.folder'+and+trashed=false&fields=files(id,name,parents)&pageSize=100`,
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || 'Failed to fetch folders');
                }

                const data = await response.json();
                const folderList: DriveFolder[] = (data.files || []).map((folder: any) => ({
                    id: folder.id,
                    name: folder.name,
                    parentId: folder.parents?.[0] || null,
                    path: folder.name
                }));

                // Add root folder
                folderList.unshift({
                    id: 'root',
                    name: 'My Drive',
                    parentId: null,
                    path: 'My Drive'
                });

                setFolders(folderList);
            } else {
                // OneDrive - fetch from /me/drive/root/children
                const response = await fetch(
                    'https://graph.microsoft.com/v1.0/me/drive/root/children?select=id,name,folder,parentReference',
                    {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch OneDrive folders');
                }

                const data = await response.json();
                const folderList: DriveFolder[] = [
                    { id: 'root', name: 'OneDrive', parentId: null, path: 'OneDrive' }
                ];

                for (const item of data.value || []) {
                    if (item.folder) {
                        folderList.push({
                            id: item.id,
                            name: item.name,
                            parentId: item.parentReference?.id || 'root',
                            path: `${item.name}`
                        });
                    }
                }

                setFolders(folderList);
            }
        } catch (err: any) {
            console.error('Error fetching folders:', err);
            setError(err.message || 'Failed to load folders');
        } finally {
            setLoading(false);
        }
    }, [accessToken, provider]);

    useEffect(() => {
        fetchFolders();
    }, [fetchFolders]);

    // Get immediate children of a folder
    const getChildren = (parentId: string): DriveFolder[] => {
        return folders.filter(f => f.parentId === parentId);
    };

    // Toggle folder expansion
    const toggleExpand = (folderId: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    // Toggle folder selection
    const toggleSelect = (folderId: string, hasChildren: boolean) => {
        setSelectedFolders(prev => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    // Confirm selection
    const handleConfirm = () => {
        onSelect(Array.from(selectedFolders));
    };

    // Render folder tree
    const renderFolder = (folder: DriveFolder, depth: number = 0): React.ReactNode => {
        const children = getChildren(folder.id);
        const hasChildren = children.length > 0;
        const isExpanded = expandedFolders.has(folder.id);
        const isSelected = selectedFolders.has(folder.id);

        return (
            <div key={folder.id} className="select-none">
                <div
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    style={{ paddingLeft: `${depth * 16 + 12}px` }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasChildren) {
                            toggleExpand(folder.id);
                        }
                        toggleSelect(folder.id, hasChildren);
                    }}
                >
                    {/* Expand/Collapse icon */}
                    <span className="w-4 h-4 flex items-center justify-center">
                        {hasChildren ? (
                            <ChevronRight
                                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            />
                        ) : (
                            <span className="w-3 h-3" />
                        )}
                    </span>

                    {/* Folder icon */}
                    {isSelected ? (
                        <Check className="w-4 h-4 text-blue-600" />
                    ) : isExpanded ? (
                        <FolderOpen className="w-4 h-4 text-amber-500" />
                    ) : (
                        <Folder className="w-4 h-4 text-slate-400" />
                    )}

                    {/* Folder name */}
                    <span className="text-sm font-medium truncate flex-1">{folder.name}</span>

                    {/* Selection indicator */}
                    {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                        </div>
                    )}
                </div>

                {/* Render children if expanded */}
                {isExpanded && hasChildren && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        {children.map(child => renderFolder(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Build tree starting from root
    const buildTree = (): DriveFolder[] => {
        const rootFolder = folders.find(f => f.id === 'root');
        if (!rootFolder) return [];

        const rootChildren = getChildren('root');
        return [rootFolder, ...rootChildren];
    };

    const folderTree = buildTree();
    const selectedCount = selectedFolders.size;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                Select Folders to Scan
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                {provider === 'google' ? 'Google Drive' : 'OneDrive'} –
                                You can only scan folders you have access to
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-slate-600 dark:text-slate-400">Loading folders...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <div className="text-center max-w-md">
                            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                            <p className="text-slate-900 dark:text-white font-medium mb-2">
                                Unable to load folders
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{error}</p>
                            <button
                                onClick={fetchFolders}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* Folder Tree */}
                {!loading && !error && (
                    <div className="flex-1 overflow-y-auto p-4">
                        {folderTree.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                No folders found
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {folderTree.map(folder => renderFolder(folder))}
                            </div>
                        )}
                    </div>
                )}

                {/* Info Banner */}
                {!loading && !error && (
                    <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-900/30">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                            <strong>Read-only access:</strong> We can only view documents. We cannot edit, delete,
                            or create any files. You can revoke access anytime.
                        </p>
                    </div>
                )}

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedCount === 0
                            ? 'Select folders to scan'
                            : `${selectedCount} folder${selectedCount !== 1 ? 's' : ''} selected`}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={selectedCount === 0}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                            Scan Selected Folders
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
