"use client";

import { useState, useRef } from 'react';
import {
    Upload,
    Download,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Info,
    ArrowRightLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog-simple';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ImportResult {
    success: boolean;
    imported: number;
    updated: number;
    archived: number;
    errors: Array<{
        row: number;
        data: any;
        error: string;
    }>;
    warnings: string[];
}

interface StaffImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (result: ImportResult) => void;
    organizationId: string;
}

export default function StaffImportModal({
    isOpen,
    onClose,
    onComplete,
    organizationId,
}: StaffImportModalProps) {
    const [step, setStep] = useState<'upload' | 'importing' | 'complete'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setFile(null);
        setStep('upload');
        setImporting(false);
        setProgress(0);
        setResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.csv')) {
                alert('Please select a CSV file');
                return;
            }
            setFile(selectedFile);
        }
    };

    const downloadTemplate = async () => {
        try {
            const response = await fetch('/api/staff/import?type=template');
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'staff_directory_template.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Error downloading template:', error);
        }
    };

    const downloadCurrentData = async () => {
        try {
            const response = await fetch(
                `/api/staff/import?type=export&organizationId=${organizationId}`
            );
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `staff_directory_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Error downloading current data:', error);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setImporting(true);
        setStep('importing');
        setProgress(0);

        try {
            const text = await file.text();

            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 200);

            const response = await fetch('/api/staff/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId,
                    csvData: text,
                }),
            });

            clearInterval(progressInterval);
            setProgress(100);

            if (response.ok) {
                const data: ImportResult = await response.json();
                setResult(data);
                setStep('complete');
                onComplete(data);
            } else {
                const error = await response.json();
                setResult({
                    success: false,
                    imported: 0,
                    updated: 0,
                    archived: 0,
                    errors: [{ row: 0, data: null, error: error.error || 'Import failed' }],
                    warnings: [],
                });
                setStep('complete');
            }
        } catch (error) {
            console.error('Error importing staff:', error);
            setResult({
                success: false,
                imported: 0,
                updated: 0,
                archived: 0,
                errors: [{ row: 0, data: null, error: 'Network error or server error' }],
                warnings: [],
            });
            setStep('complete');
        } finally {
            setImporting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Import Staff from CSV</DialogTitle>
                    <DialogDescription>
                        Import staff members in bulk. You can add new staff, update existing records,
                        or remove staff who have left.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === 'upload' && (
                        <div className="space-y-6">
                            {/* How it works hint */}
                            <Alert className="border-blue-200 bg-blue-50">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-sm text-blue-800">
                                    <strong>Round-trip workflow:</strong> Export your current data,
                                    make changes in Excel/Google Sheets, then re-import. The system
                                    automatically handles adds, updates, and removals.
                                </AlertDescription>
                            </Alert>

                            {/* Export/Download Buttons */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadCurrentData}
                                    className="flex-1"
                                >
                                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                                    Export Current Data
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={downloadTemplate}
                                    className="flex-1"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Template
                                </Button>
                            </div>

                            {/* File Upload */}
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                                    file
                                        ? 'border-blue-300 bg-blue-50'
                                        : 'border-slate-300 hover:border-slate-400'
                                }`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                {file ? (
                                    <div className="space-y-2">
                                        <FileSpreadsheet className="w-12 h-12 text-blue-500 mx-auto" />
                                        <p className="font-medium text-slate-900">{file.name}</p>
                                        <p className="text-sm text-slate-500">
                                            {(file.size / 1024).toFixed(1)} KB
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = '';
                                                }
                                            }}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                                        <p className="font-medium text-slate-900">
                                            Drop CSV file here or click to browse
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            Supports CSV files up to 5MB
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Expected Columns */}
                            <div>
                                <p className="text-sm font-medium text-slate-700 mb-2">
                                    CSV columns (see instructions in downloaded file):
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {[
                                        { name: 'salutation', required: false },
                                        { name: 'first_name', required: true },
                                        { name: 'last_name', required: true },
                                        { name: 'email', required: false },
                                        { name: 'phone', required: false },
                                        { name: 'employee_id', required: false },
                                        { name: 'job_title', required: true },
                                        { name: 'role_category', required: false },
                                        { name: 'is_super_user', required: false },
                                        { name: 'is_active', required: false },
                                        { name: 'action', required: false },
                                    ].map((col) => (
                                        <Badge
                                            key={col.name}
                                            variant="outline"
                                            className={col.required ? 'border-blue-300 bg-blue-50' : ''}
                                        >
                                            {col.name + (col.required ? '*' : '')}
                                        </Badge>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    * Required · Action: <code>new</code>/<code>keep</code>/<code>update</code>/<code>remove</code> · Booleans: <code>yes</code>/<code>no</code>
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'importing' && (
                        <div className="space-y-4 py-8">
                            <div className="text-center">
                                <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-bounce" />
                                <p className="font-medium text-slate-900">Importing staff...</p>
                                <p className="text-sm text-slate-500">Please wait</p>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}

                    {step === 'complete' && result && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <Alert
                                className={
                                    result.success && result.errors.length === 0
                                        ? 'border-emerald-200 bg-emerald-50'
                                        : 'border-amber-200 bg-amber-50'
                                }
                            >
                                {result.success && result.errors.length === 0 ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                )}
                                <AlertDescription>
                                    <div className="font-semibold">
                                        {result.imported > 0 && (
                                            <span className="text-emerald-600">{result.imported} added</span>
                                        )}
                                        {result.updated > 0 && (
                                            <span className="text-blue-600">
                                                {result.imported > 0 && ' · '}
                                                {result.updated} updated
                                            </span>
                                        )}
                                        {result.archived > 0 && (
                                            <span className="text-slate-600">
                                                {result.imported > 0 || result.updated > 0 ? ' · ' : ''}
                                                {result.archived} archived
                                            </span>
                                        )}
                                        {result.errors.length > 0 && (
                                            <span className="text-rose-600">
                                                {' · '}
                                                {result.errors.length} error
                                                {result.errors.length > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>
                                </AlertDescription>
                            </Alert>

                            {/* Warnings */}
                            {result.warnings.length > 0 && (
                                <Alert className="border-amber-200 bg-amber-50">
                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                    <AlertDescription>
                                        <ul className="list-disc list-inside text-sm">
                                            {result.warnings.map((warning, i) => (
                                                <li key={i}>{warning}</li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* Errors */}
                            {result.errors.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-2">
                                        Errors ({result.errors.length})
                                    </h4>
                                    <div className="max-h-48 overflow-y-auto space-y-2">
                                        {result.errors.map((err, i) => (
                                            <Alert key={i} className="border-rose-200 bg-rose-50">
                                                <XCircle className="h-4 w-4 text-rose-600" />
                                                <AlertDescription>
                                                    <span className="font-medium">Row {err.row}:</span>{' '}
                                                    {err.error}
                                                </AlertDescription>
                                            </Alert>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Success message */}
                            {result.success && result.errors.length === 0 && (
                                <div className="text-center py-4">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                                    <p className="font-medium text-slate-900">
                                        Staff import completed successfully!
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2">
                    {step === 'upload' && (
                        <>
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={!file || importing}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Import
                            </Button>
                        </>
                    )}
                    {step === 'complete' && (
                        <Button onClick={handleClose} className="bg-blue-600 hover:bg-blue-700">
                            Done
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
