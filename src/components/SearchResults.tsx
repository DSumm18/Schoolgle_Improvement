"use client";

import { FileText, ExternalLink } from "lucide-react";

interface SearchResult {
    id: number;
    content: string;
    metadata: {
        filename: string;
        fileId?: string;
        mimeType?: string;
        provider?: string;
    };
    similarity: number;
}

interface SearchResultsProps {
    results: SearchResult[];
    query: string;
}

export default function SearchResults({ results, query }: SearchResultsProps) {
    if (results.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No results found for &quot;{query}&quot;</p>
                <p className="text-sm mt-2">Try a different search term or scan more documents</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-4">
            <p className="text-sm text-gray-600 mb-4">
                Found {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
            </p>

            {results.map((result) => (
                <div
                    key={result.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-lg text-gray-900">
                                {result.metadata.filename}
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {Math.round(result.similarity * 100)}% match
                            </span>
                            {result.metadata.fileId && (
                                <a
                                    href={`https://drive.google.com/file/d/${result.metadata.fileId}/view`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>

                    <p className="text-gray-700 line-clamp-3 mb-3">
                        {result.content.substring(0, 300)}
                        {result.content.length > 300 ? "..." : ""}
                    </p>

                    <div className="flex gap-2 text-xs text-gray-500">
                        {result.metadata.mimeType && (
                            <span className="bg-gray-100 px-2 py-1 rounded">
                                {result.metadata.mimeType.split("/").pop()}
                            </span>
                        )}
                        {result.metadata.provider && (
                            <span className="bg-gray-100 px-2 py-1 rounded capitalize">
                                {result.metadata.provider.replace(".com", "")}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
