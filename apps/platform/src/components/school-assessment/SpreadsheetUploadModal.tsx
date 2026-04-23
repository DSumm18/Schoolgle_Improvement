// Modal for uploading and previewing spreadsheet data import.

import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X, Download } from "lucide-react";
import { toast } from "sonner";

interface ValidationError {
  row: number;
  col: number;
  cell: string;
  message: string;
  severity: 'error' | 'warning';
}

interface PreviewData {
  yearGroups: string[];
  sections: string[];
  totalCells: number;
  filledCells: number;
}

interface UploadResult {
  success: boolean;
  data?: Array<{ year_group: string; section: string; metric: string; value: number | null }>;
  preview?: PreviewData;
  errors?: ValidationError[];
  warnings?: ValidationError[];
  rowCount?: number;
}

interface SpreadsheetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: Array<{ year_group: string; section: string; metric: string; value: number | null }>) => void;
  organizationId: string;
  accessToken?: string;
}

export function SpreadsheetUploadModal({
  isOpen,
  onClose,
  onConfirm,
  organizationId,
  accessToken,
}: SpreadsheetUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
    }
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = { 'Content-Type': 'multipart/form-data' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    try {
      const res = await fetch('/api/school-assessment/upload-spreadsheet', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        toast.error(err.error || 'Failed to upload spreadsheet');
        setUploading(false);
        return;
      }

      const data = (await res.json()) as UploadResult;
      setResult(data);

      if (data.success) {
        toast.success(`Validated ${data.rowCount} cells successfully`);
      } else {
        toast.error(`Found ${data.errors?.length || 0} validation errors`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload spreadsheet');
    } finally {
      setUploading(false);
    }
  }, [file, accessToken]);

  const handleConfirm = useCallback(() => {
    if (result?.data) {
      onConfirm(result.data);
      onClose();
      setFile(null);
      setResult(null);
    }
  }, [result, onConfirm, onClose]);

  const handleDownloadTemplate = useCallback(() => {
    // Create a simple template
    const template = [
      ['Year Group', 'Cohort', 'SEND', 'EHCP', 'FSM'],
      ['EYFS', '', '', '', ''],
      ['Year 1', '', '', '', ''],
      ['Year 2', '', '', '', ''],
      ['Year 3', '', '', '', ''],
      ['Year 4', '', '', '', ''],
      ['Year 5', '', '', '', ''],
      ['Year 6', '', '', '', ''],
    ];

    const csv = template.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assessment-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-blue-600" />
            Import Assessment Data
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {!result && (
            <>
              <div className="text-sm text-gray-600">
                Upload an Excel spreadsheet (.xlsx) with your assessment data. The file should have:
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-gray-500">
                  <li>Year group columns (EYFS, Year 1, Year 2, etc.)</li>
                  <li>Section rows (Cohort, All Pupils, FSM6, Not FSM6)</li>
                  <li>Standard metric columns (R ARE, W ARE, M ARE, etc.)</li>
                </ul>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="space-y-3">
                    <Upload size={32} className="mx-auto text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">
                      {file ? file.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500">Excel files (.xlsx, .xls) up to 5MB</p>
                  </div>
                </label>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
                type="button"
              >
                <Download size={14} /> Download template
              </button>
            </>
          )}

          {result && (
            <div className="space-y-4">
              {/* Success/Error Summary */}
              {result.success ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Spreadsheet validated successfully</p>
                    <p className="text-xs text-emerald-700 mt-1">
                      Found {result.preview?.yearGroups.length || 0} year groups,{' '}
                      {result.preview?.sections.length || 0} sections,{' '}
                      {result.preview?.filledCells || 0} filled cells
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Validation errors found</p>
                    <p className="text-xs text-red-700 mt-1">
                      {result.errors?.length || 0} error(s) - please fix and re-upload
                    </p>
                  </div>
                </div>
              )}

              {/* Warnings */}
              {result.warnings && result.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-900 mb-2">
                    {result.warnings.length} warning(s)
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-700">
                        Row {w.row}, Col {w.col}: {w.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {result.errors && result.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-red-900 mb-2">
                    {result.errors.length} error(s)
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {result.errors.map((e, i) => (
                      <p key={i} className="text-xs text-red-700">
                        Row {e.row}, Col {e.col}: {e.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              {result.preview && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-900 mb-2">Preview</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>Year groups: {result.preview.yearGroups.join(', ')}</p>
                    <p>Sections: {result.preview.sections.join(', ')}</p>
                    <p>Total cells: {result.preview.totalCells}</p>
                    <p>Filled cells: {result.preview.filledCells}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
          <button
            onClick={() => {
              onClose();
              setFile(null);
              setResult(null);
            }}
            className="text-sm px-3 py-1.5 rounded-lg text-gray-700 hover:bg-gray-100"
            type="button"
          >
            Cancel
          </button>
          {!result && (
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
              type="button"
            >
              {uploading ? 'Validating...' : 'Validate'}
            </button>
          )}
          {result && result.success && (
            <button
              onClick={handleConfirm}
              className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              type="button"
            >
              Import Data
            </button>
          )}
          {result && !result.success && (
            <button
              onClick={() => {
                setResult(null);
                setFile(null);
              }}
              className="text-sm px-3 py-1.5 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
              type="button"
            >
              Try Different File
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
