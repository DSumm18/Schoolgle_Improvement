/**
 * DATA IMPORT PREVIEW COMPONENT
 *
 * Shows detected files and data summary before importing
 * Displays: "421 pupils, 37 staff, 14 classes ready to import"
 */

'use client';

import { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, FileText, FolderOpen, CheckCircle2, AlertCircle, Database, ChevronRight } from 'lucide-react';

interface DetectedFile {
  id: string;
  name: string;
  type: 'census' | 'assessment' | 'sen' | 'pp' | 'attendance' | 'staff' | 'other';
  size: number;
  category?: string;
  status: 'detected' | 'processing' | 'ready' | 'error';
  recordCount?: number;
}

interface ImportSummary {
  totalFiles: number;
  estimatedPupils: number;
  estimatedStaff: number;
  estimatedClasses: number;
  censusFiles: number;
  assessmentFiles: number;
  senFiles: number;
  ppFiles: number;
  staffFiles: number;
  attendanceFiles: number;
}

interface DataImportPreviewProps {
  organizationId: string;
  folderId?: string;
  onImport?: (summary: ImportSummary) => void;
}

export function DataImportPreview({ organizationId, folderId, onImport }: DataImportPreviewProps) {
  const [files, setFiles] = useState<DetectedFile[]>([]);
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  // Simulate file detection (in real implementation, this would scan the Drive)
  useEffect(() => {
    if (folderId) {
      scanFolder(folderId);
    }
  }, [folderId]);

  const scanFolder = async (folderId: string) => {
    setScanning(true);
    try {
      // In real implementation, this would call the API to list files
      const response = await fetch(`/api/data-import/scan?folderId=${folderId}`);
      const data = await response.json();

      if (data.files) {
        setFiles(data.files);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = async (uploadedFiles: File[]) => {
    setScanning(true);

    const detected: DetectedFile[] = [];

    for (const file of uploadedFiles) {
      const type = detectFileType(file.name);
      detected.push({
        id: crypto.randomUUID(),
        name: file.name,
        type,
        size: file.size,
        status: 'detected',
        recordCount: estimateRecordCount(type, file.size)
      });
    }

    setFiles(detected);
    calculateSummary(detected);
    setScanning(false);
  };

  const detectFileType(filename: string): DetectedFile['type'] {
    const name = filename.toLowerCase();
    if (name.includes('census') || name.endsWith('.xml')) return 'census';
    if (name.includes('eyfs') || name.includes('phonics') || name.includes('ks1') || name.includes('ks2') || name.includes('mtc')) return 'assessment';
    if (name.includes('sen') || name.includes('send')) return 'sen';
    if (name.includes('pp') || name.includes('pupil premium')) return 'pp';
    if (name.includes('attendance')) return 'attendance';
    if (name.includes('staff') || name.includes('employee')) return 'staff';
    return 'other';
  };

  const estimateRecordCount = (type: string, size: number): number => {
    // Rough estimates based on file size
    if (type === 'census') return Math.floor(size / 500); // ~500 bytes per pupil
    if (type === 'assessment') return Math.floor(size / 200);
    if (type === 'staff') return Math.floor(size / 300);
    return 0;
  };

  const calculateSummary = (detectedFiles: DetectedFile[]) => {
    const summary: ImportSummary = {
      totalFiles: detectedFiles.length,
      estimatedPupils: 0,
      estimatedStaff: 0,
      estimatedClasses: 0,
      censusFiles: detectedFiles.filter(f => f.type === 'census').length,
      assessmentFiles: detectedFiles.filter(f => f.type === 'assessment').length,
      senFiles: detectedFiles.filter(f => f.type === 'sen').length,
      ppFiles: detectedFiles.filter(f => f.type === 'pp').length,
      staffFiles: detectedFiles.filter(f => f.type === 'staff').length,
      attendanceFiles: detectedFiles.filter(f => f.type === 'attendance').length,
    };

    // Estimate counts from file sizes
    const censusFiles_data = detectedFiles.filter(f => f.type === 'census');
    if (censusFiles_data.length > 0) {
      const totalSize = censusFiles_data.reduce((sum, f) => sum + f.size, 0);
      summary.estimatedPupils = Math.floor(totalSize / 500);
      summary.estimatedClasses = Math.ceil(summary.estimatedPupils / 30);
    }

    const staffFiles_data = detectedFiles.filter(f => f.type === 'staff');
    if (staffFiles_data.length > 0) {
      const totalSize = staffFiles_data.reduce((sum, f) => sum + f.size, 0);
      summary.estimatedStaff = Math.floor(totalSize / 300);
    }

    setSummary(summary);
  };

  const handleImport = async () => {
    if (!summary) return;

    setImporting(true);
    try {
      const response = await fetch('/api/data-import/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          fileIds: files.map(f => f.id)
        })
      });

      const result = await response.json();

      if (result.success) {
        onImport?.(summary);
        // Show success state
        files.forEach(f => {
          if (f.status !== 'error') {
            f.status = 'ready';
          }
        });
      }
    } catch (error) {
      console.error('Import failed:', error);
      // Mark as error
      files.forEach(f => f.status = 'error');
    } finally {
      setImporting(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'census': return FileSpreadsheet;
      case 'assessment': return FileText;
      case 'sen':
      case 'pp':
      case 'attendance': return FolderOpen;
      case 'staff': return FileText;
      default: return FileText;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'census': return 'text-blue-600 bg-blue-50';
      case 'assessment': return 'text-green-600 bg-green-50';
      case 'sen': return 'text-purple-600 bg-purple-50';
      case 'pp': return 'text-orange-600 bg-orange-50';
      case 'attendance': return 'text-red-600 bg-red-50';
      case 'staff': return 'text-teal-600 bg-teal-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>;
      case 'ready': return <CheckCircle2 className="text-green-500" size={16} />;
      case 'error': return <AlertCircle className="text-red-500" size={16} />;
      default: return <div className="w-2 h-2 rounded-full bg-gray-300"></div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-600">
          Drag and drop school data files here, or click to browse
        </p>
        <input
          type="file"
          multiple
          accept=".xlsx,.xls,.xml,.pdf,.csv"
          className="mx-auto"
          onChange={(e) => e.target.files && handleFileUpload(Array.from(e.target.files))}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => document.querySelector('input[type="file"]')?.click()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Select Files
        </button>
      </div>

      {/* Scanning State */}
      {scanning && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mr-3"></div>
          <span className="text-sm text-gray-600">Scanning files and analyzing data structure...</span>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Detected Files</h3>
            <span className="text-sm text-gray-500">{files.length} files</span>
          </div>

          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(file.type)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {file.type.charAt(0).toUpperCase() + file.type.slice(1)} • {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(file.type)}`}>
                    {file.category || file.type}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {file.recordCount && (
                    <span className="text-sm text-gray-500">~{file.recordCount} records</span>
                  )}
                  {getStatusIcon(file.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Import Summary */}
      {summary && !importing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="text-blue-600" />
            <h3 className="text-lg font-semibold">Ready to Import</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <p className="text-2xl font-bold text-blue-600">{summary.estimatedPupils}</p>
              <p className="text-xs text-gray-600">Pupils</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <p className="text-2xl font-bold text-green-600">{summary.estimatedStaff}</p>
              <p className="text-xs text-gray-600">Staff</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <p className="text-2xl font-bold text-purple-600">{summary.estimatedClasses}</p>
              <p className="text-xs text-gray-600">Classes</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <p className="text-2xl font-bold text-gray-600">{summary.totalFiles}</p>
              <p className="text-xs text-gray-600">Files</p>
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <p>• {summary.censusFiles} Census file{summary.censusFiles !== 1 ? 's' : ''}</p>
            <p>• {summary.assessmentFiles} Assessment file{summary.assessmentFiles !== 1 ? 's' : ''}</p>
            <p>• {summary.senFiles} SEN file{summary.senFiles !== 1 ? 's' : ''}</p>
            <p>• {summary.ppFiles} Pupil Premium file{summary.ppFiles !== 1 ? 's' : ''}</p>
            {summary.staffFiles > 0 && <p>• {summary.staffFiles} Staff file{summary.staffFiles !== 1 ? 's' : ''}</p>}
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Importing...
              </>
            ) : (
              <>
                <Database size={18} />
                Import Data
              </>
            )}
          </button>
        </div>
      )}

      {/* Import Complete State */}
      {files.some(f => f.status === 'ready') && !importing && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-green-500 mb-2" />
          <h3 className="text-lg font-semibold text-green-800">Import Complete!</h3>
          <p className="text-sm text-green-700">Your data has been successfully imported and is ready to use.</p>
        </div>
      )}
    </div>
  );
}

// Helper for crypto in browser
declare const crypto: {
  randomBytes: (length: number, callback: (err: Error | null, buffer: Buffer) => void) => void;
  randomUUID: () => string;
};
