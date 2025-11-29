"use client";

import { useState, useRef } from 'react';
import { 
    FolderOpen, Upload, FileText, Loader2, CheckCircle, 
    AlertTriangle, X, File, RefreshCw, HardDrive, Cloud
} from 'lucide-react';

interface ScannedFile {
    name: string;
    path: string;
    type: string;
    size: number;
    content?: string;
    lastModified: Date;
}

interface ScanResult {
    totalFiles: number;
    processedFiles: number;
    skippedFiles: number;
    supportedTypes: string[];
    files: ScannedFile[];
}

interface EvidenceMatch {
    fileId: string;
    fileName: string;
    filePath: string;
    frameworkArea: string;
    frameworkAreaLabel: string;
    confidence: number;
    matchedKeywords: string[];
    relevantExcerpt: string;
}

interface AnalysisResult {
    totalMatches: number;
    matchesByArea: Record<string, EvidenceMatch[]>;
    allMatches: EvidenceMatch[];
}

interface LocalFolderScannerProps {
    onScanComplete: (files: ScannedFile[]) => void;
    onAnalysisComplete?: (analysis: AnalysisResult) => void;
    onClose?: () => void;
}

// Supported file types for evidence scanning
const SUPPORTED_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.txt', '.rtf',
    '.xls', '.xlsx', '.csv',
    '.ppt', '.pptx',
    '.png', '.jpg', '.jpeg', '.gif' // For observation photos, displays, etc.
];

const SUPPORTED_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
    'image/gif'
];

export default function LocalFolderScanner({ onScanComplete, onAnalysisComplete, onClose }: LocalFolderScannerProps) {
    const [scanMethod, setScanMethod] = useState<'folder' | 'files' | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    
    // Analysis state
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [activeTab, setActiveTab] = useState<'files' | 'evidence'>('files');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);

    // Check if File System Access API is available
    // Note: Disabled because it doesn't work well in all contexts (automated browsers, iframes, etc.)
    // Always use the reliable input[webkitdirectory] fallback instead
    const hasFileSystemAccess = false; // Forcing fallback for reliability

    const readFileContent = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(reader.error);
                reader.readAsText(file);
            } else if (file.type === 'application/pdf') {
                // For PDFs, we'd need a PDF parser - for now just note it's a PDF
                resolve(`[PDF Document: ${file.name}]`);
            } else if (file.type.startsWith('image/')) {
                // For images, note the filename (could do OCR later)
                resolve(`[Image: ${file.name}]`);
            } else {
                // For other docs, note the type
                resolve(`[Document: ${file.name}, Type: ${file.type}]`);
            }
        });
    };

    const isSupported = (file: File): boolean => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return SUPPORTED_EXTENSIONS.includes(ext) || SUPPORTED_MIME_TYPES.includes(file.type);
    };

    // Modern File System Access API (Chrome/Edge)
    const scanWithFolderPicker = async () => {
        try {
            setIsScanning(true);
            setError(null);
            setScanResult(null);
            
            // @ts-ignore - File System Access API
            const dirHandle = await window.showDirectoryPicker({
                mode: 'read'
            });
            
            const files: ScannedFile[] = [];
            let totalFiles = 0;
            let skippedFiles = 0;
            
            // Recursive function to scan directory
            async function* getFilesRecursively(dirHandle: any, path = ''): AsyncGenerator<{ file: File; path: string }> {
                for await (const entry of dirHandle.values()) {
                    if (entry.kind === 'file') {
                        const file = await entry.getFile();
                        yield { file, path: path + '/' + entry.name };
                    } else if (entry.kind === 'directory') {
                        yield* getFilesRecursively(entry, path + '/' + entry.name);
                    }
                }
            }
            
            // First pass - count files
            const filesToProcess: { file: File; path: string }[] = [];
            for await (const { file, path } of getFilesRecursively(dirHandle)) {
                if (isSupported(file)) {
                    filesToProcess.push({ file, path });
                    totalFiles++;
                } else {
                    skippedFiles++;
                }
            }
            
            setProgress({ current: 0, total: totalFiles });
            
            // Second pass - process files
            for (let i = 0; i < filesToProcess.length; i++) {
                const { file, path } = filesToProcess[i];
                setProgress({ current: i + 1, total: totalFiles });
                
                try {
                    const content = await readFileContent(file);
                    files.push({
                        name: file.name,
                        path: path,
                        type: file.type,
                        size: file.size,
                        content: content.substring(0, 10000), // Limit content size
                        lastModified: new Date(file.lastModified)
                    });
                } catch (e) {
                    console.warn(`Failed to read ${file.name}:`, e);
                    skippedFiles++;
                }
            }
            
            const result: ScanResult = {
                totalFiles: totalFiles + skippedFiles,
                processedFiles: files.length,
                skippedFiles,
                supportedTypes: [...new Set(files.map(f => f.type))],
                files
            };
            
            setScanResult(result);
            onScanComplete(files);
            
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                setError(e.message || 'Failed to scan folder');
            }
        } finally {
            setIsScanning(false);
        }
    };

    // Fallback: File input with webkitdirectory
    const scanWithFolderInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList) return;
        
        setIsScanning(true);
        setError(null);
        setScanResult(null);
        
        const files: ScannedFile[] = [];
        let skippedFiles = 0;
        const totalFiles = Array.from(fileList).filter(f => isSupported(f)).length;
        
        setProgress({ current: 0, total: totalFiles });
        
        let processed = 0;
        for (const file of Array.from(fileList)) {
            if (!isSupported(file)) {
                skippedFiles++;
                continue;
            }
            
            processed++;
            setProgress({ current: processed, total: totalFiles });
            
            try {
                const content = await readFileContent(file);
                files.push({
                    name: file.name,
                    // @ts-ignore - webkitRelativePath
                    path: file.webkitRelativePath || file.name,
                    type: file.type,
                    size: file.size,
                    content: content.substring(0, 10000),
                    lastModified: new Date(file.lastModified)
                });
            } catch (e) {
                skippedFiles++;
            }
        }
        
        const result: ScanResult = {
            totalFiles: fileList.length,
            processedFiles: files.length,
            skippedFiles,
            supportedTypes: [...new Set(files.map(f => f.type))],
            files
        };
        
        setScanResult(result);
        onScanComplete(files);
        setIsScanning(false);
    };

    // Individual file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList) return;
        
        setIsScanning(true);
        setError(null);
        
        const files: ScannedFile[] = [];
        
        for (const file of Array.from(fileList)) {
            try {
                const content = await readFileContent(file);
                files.push({
                    name: file.name,
                    path: file.name,
                    type: file.type,
                    size: file.size,
                    content: content.substring(0, 10000),
                    lastModified: new Date(file.lastModified)
                });
            } catch (e) {
                console.warn(`Failed to read ${file.name}`);
            }
        }
        
        if (scanResult) {
            // Add to existing files
            const updatedFiles = [...scanResult.files, ...files];
            setScanResult({
                ...scanResult,
                totalFiles: updatedFiles.length,
                processedFiles: updatedFiles.length,
                files: updatedFiles
            });
        } else {
            setScanResult({
                totalFiles: files.length,
                processedFiles: files.length,
                skippedFiles: 0,
                supportedTypes: [...new Set(files.map(f => f.type))],
                files
            });
        }
        
        onScanComplete(files);
        setIsScanning(false);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Analyze files for Ofsted evidence
    const analyzeForEvidence = async () => {
        if (!scanResult || scanResult.files.length === 0) return;
        
        setIsAnalyzing(true);
        setError(null);
        
        try {
            const response = await fetch('/api/analyze-local', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: scanResult.files })
            });
            
            if (!response.ok) {
                throw new Error('Analysis failed');
            }
            
            const data = await response.json();
            setAnalysisResult({
                totalMatches: data.totalMatches,
                matchesByArea: data.matchesByArea,
                allMatches: data.allMatches
            });
            setActiveTab('evidence');
            onAnalysisComplete?.(data);
            
        } catch (e: any) {
            setError(e.message || 'Analysis failed');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.7) return 'bg-green-100 text-green-700';
        if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-700';
        return 'bg-gray-100 text-gray-600';
    };

    const getAreaColor = (area: string) => {
        const colors: Record<string, string> = {
            'quality-intent': 'bg-rose-50 border-rose-200',
            'quality-implementation': 'bg-rose-50 border-rose-200',
            'quality-impact': 'bg-rose-50 border-rose-200',
            'behaviour': 'bg-teal-50 border-teal-200',
            'personal-development': 'bg-orange-50 border-orange-200',
            'leadership': 'bg-violet-50 border-violet-200',
            'safeguarding': 'bg-red-50 border-red-200',
            'send': 'bg-blue-50 border-blue-200',
            'early-years': 'bg-pink-50 border-pink-200',
            'reading': 'bg-emerald-50 border-emerald-200'
        };
        return colors[area] || 'bg-gray-50 border-gray-200';
    };

    const getFileIcon = (type: string) => {
        if (type.startsWith('image/')) return '🖼️';
        if (type.includes('pdf')) return '📄';
        if (type.includes('word') || type.includes('document')) return '📝';
        if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return '📊';
        if (type.includes('presentation') || type.includes('powerpoint')) return '📽️';
        return '📁';
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <HardDrive size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Local Evidence Scanner</h2>
                            <p className="text-blue-200 text-sm">Scan folders from your computer</p>
                        </div>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                            <X size={24} />
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Scan Method Selection */}
                {!scanResult && !isScanning && (
                    <div className="grid grid-cols-2 gap-4">
                        {/* Folder Option - Using label for reliable click */}
                        <label className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors text-center group cursor-pointer block">
                            <FolderOpen size={40} className="mx-auto mb-3 text-gray-400 group-hover:text-blue-500" />
                            <h3 className="font-semibold text-gray-900">Scan Folder</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Select an evidence folder from your computer
                            </p>
                            <p className="text-xs text-blue-500 mt-2 font-medium">
                                Click here to open folder picker
                            </p>
                            <input
                                type="file"
                                webkitdirectory=""
                                multiple
                                onChange={scanWithFolderInput}
                                className="hidden"
                            />
                        </label>

                        {/* Files Option - Using label for reliable click */}
                        <label className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors text-center group cursor-pointer block">
                            <Upload size={40} className="mx-auto mb-3 text-gray-400 group-hover:text-green-500" />
                            <h3 className="font-semibold text-gray-900">Upload Files</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Select individual files to scan
                            </p>
                            <p className="text-xs text-green-500 mt-2 font-medium">
                                Click here to select files
                            </p>
                            <input
                                type="file"
                                multiple
                                accept={SUPPORTED_EXTENSIONS.join(',')}
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                )}

                {/* Hidden file inputs (kept for programmatic access if needed) */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={SUPPORTED_EXTENSIONS.join(',')}
                    onChange={handleFileUpload}
                    className="hidden"
                />
                <input
                    ref={folderInputRef}
                    type="file"
                    webkitdirectory=""
                    multiple
                    onChange={scanWithFolderInput}
                    className="hidden"
                />

                {/* Scanning Progress */}
                {isScanning && (
                    <div className="text-center py-8">
                        <Loader2 size={48} className="mx-auto mb-4 text-blue-500 animate-spin" />
                        <h3 className="font-semibold text-gray-900">Scanning Files...</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {progress.current} of {progress.total} files processed
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-4 max-w-xs mx-auto">
                            <div 
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                        <AlertTriangle className="text-red-500 flex-shrink-0" />
                        <div>
                            <h4 className="font-medium text-red-800">Scan Failed</h4>
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    </div>
                )}

                {/* Results */}
                {scanResult && (
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="text-green-500" />
                                    <h4 className="font-semibold text-green-800">Scan Complete!</h4>
                                </div>
                                {!analysisResult && (
                                    <button
                                        onClick={analyzeForEvidence}
                                        disabled={isAnalyzing}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <FileText size={16} />
                                                🔍 Find Evidence
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{scanResult.totalFiles}</div>
                                    <div className="text-xs text-gray-500">Total Found</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-600">{scanResult.processedFiles}</div>
                                    <div className="text-xs text-gray-500">Processed</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-400">{scanResult.skippedFiles}</div>
                                    <div className="text-xs text-gray-500">Skipped</div>
                                </div>
                                {analysisResult && (
                                    <div>
                                        <div className="text-2xl font-bold text-purple-600">{analysisResult.totalMatches}</div>
                                        <div className="text-xs text-gray-500">Evidence Matches</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        {analysisResult && (
                            <div className="border-b border-gray-200">
                                <nav className="flex">
                                    <button
                                        onClick={() => setActiveTab('files')}
                                        className={`flex-1 py-2 text-sm font-medium border-b-2 ${
                                            activeTab === 'files' 
                                                ? 'border-blue-500 text-blue-600' 
                                                : 'border-transparent text-gray-500'
                                        }`}
                                    >
                                        📁 Files ({scanResult.files.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('evidence')}
                                        className={`flex-1 py-2 text-sm font-medium border-b-2 ${
                                            activeTab === 'evidence' 
                                                ? 'border-purple-500 text-purple-600' 
                                                : 'border-transparent text-gray-500'
                                        }`}
                                    >
                                        🎯 Evidence ({analysisResult.totalMatches})
                                    </button>
                                </nav>
                            </div>
                        )}

                        {/* File List */}
                        {activeTab === 'files' && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                    <h4 className="font-medium text-gray-700">Scanned Files ({scanResult.files.length})</h4>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {scanResult.files.map((file, index) => (
                                        <div key={index} className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                                            <span className="text-xl">{getFileIcon(file.type)}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{file.path}</p>
                                            </div>
                                            <span className="text-xs text-gray-400">{formatFileSize(file.size)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Evidence Matches */}
                        {activeTab === 'evidence' && analysisResult && (
                            <div className="space-y-3">
                                {Object.entries(analysisResult.matchesByArea).length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>No evidence matches found in these files.</p>
                                        <p className="text-sm">Try scanning folders with more school documents.</p>
                                    </div>
                                ) : (
                                    Object.entries(analysisResult.matchesByArea).map(([area, matches]) => (
                                        <div key={area} className={`border rounded-lg overflow-hidden ${getAreaColor(area)}`}>
                                            <div className="px-4 py-2 border-b bg-white/50">
                                                <h5 className="font-medium text-gray-900">
                                                    {matches[0]?.frameworkAreaLabel || area}
                                                </h5>
                                                <p className="text-xs text-gray-500">{matches.length} match(es)</p>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                {matches.slice(0, 3).map((match, idx) => (
                                                    <div key={idx} className="px-4 py-2 bg-white/30">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-sm font-medium text-gray-900 truncate flex-1">
                                                                {match.fileName}
                                                            </span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getConfidenceColor(match.confidence)}`}>
                                                                {Math.round(match.confidence * 100)}% match
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1 mb-1">
                                                            {match.matchedKeywords.slice(0, 4).map((kw, i) => (
                                                                <span key={i} className="text-xs bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                                                    {kw}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        {match.relevantExcerpt && (
                                                            <p className="text-xs text-gray-500 italic truncate">
                                                                {match.relevantExcerpt}
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setScanResult(null);
                                    setAnalysisResult(null);
                                    setActiveTab('files');
                                    setProgress({ current: 0, total: 0 });
                                }}
                                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={18} />
                                Scan Again
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                            >
                                <Upload size={18} />
                                Add More Files
                            </button>
                        </div>
                    </div>
                )}

                {/* Supported Types Info */}
                {!scanResult && !isScanning && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Supported File Types</h4>
                        <div className="flex flex-wrap gap-2">
                            {['PDF', 'Word', 'Excel', 'PowerPoint', 'Text', 'CSV', 'Images'].map(type => (
                                <span key={type} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600">
                                    {type}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Cloud Options Note */}
                <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Cloud size={16} />
                        <span>Cloud storage (Google Drive, OneDrive) coming soon</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

