import React from 'react';
import { X, FileText, ExternalLink, AlertCircle, CheckCircle, Folder } from 'lucide-react';

interface EvidenceMatch {
    documentName: string;
    documentLink?: string;
    confidence: number;
    confidenceLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
    relevanceExplanation: string;
    keyQuotes?: string[];
    matchedKeywords?: string[];
    folderPath?: string;
}

interface EvidenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    categoryName: string;
    subcategoryName: string;
    evidenceItem: string;
    matches: EvidenceMatch[];
}

export default function EvidenceModal({
    isOpen,
    onClose,
    categoryName,
    subcategoryName,
    evidenceItem,
    matches
}: EvidenceModalProps) {
    if (!isOpen) return null;

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
        if (confidence >= 0.6) return 'text-blue-600 bg-blue-50 border-blue-200';
        return 'text-amber-600 bg-amber-50 border-amber-200';
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50 rounded-t-xl">
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <span>{categoryName}</span>
                            <span>•</span>
                            <span>{subcategoryName}</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="text-blue-600" size={24} />
                            Evidence Details
                        </h2>
                        <p className="text-gray-600 mt-1 font-medium">
                            "{evidenceItem}"
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {matches.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No Evidence Found Yet</h3>
                            <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                                The AI scanner hasn't found any documents that strongly match this requirement. Try scanning more folders or uploading relevant documents.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900">
                                    Found {matches.length} Document{matches.length !== 1 ? 's' : ''}
                                </h3>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    Sorted by relevance
                                </span>
                            </div>

                            {matches.map((match, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-all shadow-sm hover:shadow-md bg-white">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 mt-1">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 text-lg hover:text-blue-600 transition-colors">
                                                    {match.documentLink ? (
                                                        <a href={match.documentLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                                            {match.documentName}
                                                            <ExternalLink size={14} />
                                                        </a>
                                                    ) : (
                                                        match.documentName
                                                    )}
                                                </h4>
                                                {match.folderPath && (
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                                        <Folder size={12} />
                                                        <span className="truncate max-w-md" title={match.folderPath}>
                                                            {match.folderPath}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getConfidenceColor(match.confidence)}`}>
                                                {match.confidenceLevel || (Math.round(match.confidence * 100) + '% Match')}
                                            </div>
                                            {match.confidenceLevel && (
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {Math.round(match.confidence * 100)}% Accuracy
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="ml-12 space-y-3">
                                        <div className="bg-gray-50 p-3 rounded-md text-sm text-gray-700 border border-gray-100">
                                            <span className="font-semibold text-gray-900 block mb-1">Why it matches:</span>
                                            {match.relevanceExplanation}
                                        </div>

                                        {match.matchedKeywords && match.matchedKeywords.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {match.matchedKeywords.map((kw, kwIdx) => (
                                                    <span key={kwIdx} className="px-2 py-0.5 bg-blue-100/50 text-blue-700 text-[10px] font-bold rounded-md border border-blue-200/50">
                                                        {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {match.keyQuotes && match.keyQuotes.length > 0 && (
                                            <div>
                                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Key Excerpts</span>
                                                <div className="space-y-2">
                                                    {match.keyQuotes.map((quote, qIdx) => (
                                                        <div key={qIdx} className="flex gap-2 text-sm text-gray-600 italic bg-yellow-50/50 p-2 rounded border-l-2 border-yellow-300">
                                                            <span className="text-yellow-400 font-serif text-lg leading-none">"</span>
                                                            {quote}
                                                            <span className="text-yellow-400 font-serif text-lg leading-none">"</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
