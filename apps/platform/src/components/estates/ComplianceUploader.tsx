'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, CheckCircle2, Loader2, Clipboard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ComplianceUploaderProps {
    onUploadSuccess?: (data: any) => void;
    domainName: string;
}

export default function ComplianceUploader({ onUploadSuccess, domainName }: ComplianceUploaderProps) {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'ANALYZING' | 'SUCCESS'>('IDLE');

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const processUpload = async () => {
        if (!file) return;

        setStatus('UPLOADING');
        try {
            // 1. Get User Context
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 2. Upload to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `compliance-evidence/${user.id}/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('compliance')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('compliance')
                .getPublicUrl(filePath);

            // 4. Call Edge Function ("The Clerk" & "The Auditor")
            setStatus('ANALYZING');

            const { data, error: functionError } = await supabase.functions.invoke('process-compliance-doc', {
                body: {
                    file_url: publicUrl,
                    user_id: user.id,
                    school_id: user.user_metadata?.school_id // Assuming school_id is in metadata
                }
            });

            if (functionError) throw functionError;

            setStatus('SUCCESS');
            toast.success(`Verified: ${data.log.ai_summary}`);

            onUploadSuccess?.(data.log);

        } catch (error: any) {
            console.error('Compliance Error:', error);
            setStatus('IDLE');
            toast.error(error.message || 'Failed to verify document');
        }
    };

    return (
        <Card className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
            <CardContent className="p-10">
                <div
                    className={`flex flex-col items-center justify-center text-center space-y-4 ${dragActive ? 'scale-105' : ''} transition-all`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {status === 'IDLE' && !file && (
                        <>
                            <div className="p-4 bg-white dark:bg-zinc-950 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-800">
                                <Upload className="h-8 w-8 text-indigo-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-xl">Paste-to-See Verification</h3>
                                <p className="text-zinc-500 dark:text-zinc-400 max-w-xs text-sm">
                                    Drag and drop your {domainName} certificate here, or press <kbd className="px-1.5 py-0.5 rounded border bg-zinc-100 dark:bg-zinc-800 text-[10px]">Ctrl+V</kbd> to paste a screenshot.
                                </p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                id="file-upload"
                                onChange={handleChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <label htmlFor="file-upload">
                                <Button variant="outline" className="mt-2" asChild>
                                    <span>Select File</span>
                                </Button>
                            </label>
                        </>
                    )}

                    {file && status === 'IDLE' && (
                        <div className="w-full space-y-4">
                            <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                <div className="flex items-center space-x-3 text-left">
                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg text-indigo-600">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                                        <p className="text-xs text-zinc-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                            <Button onClick={processUpload} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 h-12 text-lg">
                                Verify with AI Agent
                            </Button>
                        </div>
                    )}

                    {(status === 'UPLOADING' || status === 'ANALYZING') && (
                        <div className="flex flex-col items-center space-y-4 py-6">
                            <div className="relative">
                                <div className="h-16 w-16 rounded-full border-4 border-zinc-100 dark:border-zinc-800" />
                                <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium text-lg">
                                    {status === 'UPLOADING' ? 'Ingesting Document...' : 'Agent "Ed" is verifying...'}
                                </p>
                                <p className="text-sm text-zinc-500">
                                    {status === 'UPLOADING' ? 'Storing in secure vaults' : 'Reading taxonomy & checking rules'}
                                </p>
                            </div>
                        </div>
                    )}

                    {status === 'SUCCESS' && (
                        <div className="flex flex-col items-center space-y-4 py-4">
                            <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-600">
                                <CheckCircle2 className="h-10 w-10 animate-in zoom-in duration-300" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-xl text-emerald-600">Verification Complete</p>
                                <p className="text-sm text-zinc-500">Digital proof has been filed against this asset.</p>
                            </div>
                            <Button variant="outline" onClick={() => { setFile(null); setStatus('IDLE'); }}>
                                Reset Uploader
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
