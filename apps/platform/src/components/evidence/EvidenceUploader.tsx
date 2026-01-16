"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, Image as ImageIcon, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { EVIDENCE_CATEGORIES, FileType } from '@/lib/evidence/types';

interface EvidenceUploaderProps {
    organizationId: string;
    userId: string;
    onUploadComplete: (evidenceId: string) => void;
    onClose: () => void;
}

export default function EvidenceUploader({
    organizationId,
    userId,
    onUploadComplete,
    onClose
}: EvidenceUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const processFile = (selectedFile: File) => {
        setFile(selectedFile);
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
        setError(null);

        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            processFile(droppedFile);
        }
    };

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const pastedFile = new File([blob], `screenshot-${new Date().getTime()}.png`, { type: 'image/png' });
                    processFile(pastedFile);
                }
            }
        }
    }, []);

    const getFileType = (mimeType: string): FileType => {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType === 'application/pdf') return 'pdf';
        if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'spreadsheet';
        if (mimeType.includes('word') || mimeType.includes('officedocument.word') || mimeType === 'text/plain') return 'doc';
        return 'doc';
    };

    const handleUpload = async () => {
        if (!file || !organizationId || !userId || !title || !category) {
            setError('Please fill in all required fields');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${organizationId}/${fileName}`;

            // 1. Upload to Storage
            const { error: storageError, data: storageData } = await supabase.storage
                .from('evidence')
                .upload(filePath, file);

            if (storageError) throw storageError;

            const { data: { publicUrl } } = supabase.storage
                .from('evidence')
                .getPublicUrl(filePath);

            // 2. Create Database Record via API
            const response = await fetch('/api/evidence', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId,
                    userId,
                    title,
                    description,
                    file_url: publicUrl,
                    file_type: getFileType(file.type),
                    file_size_bytes: file.size,
                    file_name: file.name,
                    category,
                    source_type: 'upload'
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to save evidence record');
            }

            const result = await response.json();
            onUploadComplete(result.id);
            onClose();

        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'An error occurred during upload');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onPaste={handlePaste}
        >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Upload className="text-blue-600" size={24} />
                    Upload Evidence
                </h2>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
                {/* Dropzone */}
                {!file ? (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                        />
                        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <Upload className="text-blue-600" size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Click or drag file here</h3>
                        <p className="text-gray-500 mt-2">
                            Supports: Images, PDF, Word, Excel. You can also <b>paste (Ctrl+V)</b> a screenshot!
                        </p>
                    </div>
                ) : (
                    <div className="flex gap-6 items-start">
                        <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden flex-shrink-0">
                            {preview ? (
                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <FileText className="text-gray-400" size={48} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-gray-900 truncate">{file.name}</p>
                                <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700 text-xs font-medium">
                                    Remove
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB • {file.type}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Title*</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Fire Door Inspection Log"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-700">Category*</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        >
                            <option value="">Select Category</option>
                            {EVIDENCE_CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Description (Optional)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Add some context for this evidence..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                    />
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm animate-shake">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end items-center gap-3">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleUpload}
                    disabled={uploading || !file || !category || !title}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="animate-spin" size={18} />
                            Uploading...
                        </>
                    ) : (
                        <>
                            <Check size={18} />
                            Save to Library
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
