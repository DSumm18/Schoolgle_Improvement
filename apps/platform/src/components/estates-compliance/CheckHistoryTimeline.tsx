'use client';

import {
    Check,
    Clock,
    AlertTriangle,
    FileText,
    User,
    Calendar,
    ExternalLink,
} from 'lucide-react';
import type { CheckStatus } from '@/lib/estates-compliance/statutory-checks';

export interface EvidenceItem {
    id: string;
    type: 'certificate' | 'report' | 'photo' | 'document';
    title: string;
    url: string;
    uploadedAt: string;
    uploadedBy: string;
    fileSize?: string;
}

export interface HistoryRecord {
    id: string;
    completedDate: string;
    completedBy: string;
    status: CheckStatus;
    notes: string;
    evidence: EvidenceItem[];
    nextDueDate: string;
    documentsReceived: boolean;
    contractorName?: string;
    duration?: number; // minutes
}

interface CheckHistoryTimelineProps {
    history: HistoryRecord[];
}

export function CheckHistoryTimeline({ history }: CheckHistoryTimelineProps) {
    const getStatusInfo = (status: HistoryRecord['status']) => {
        switch (status) {
            case 'completed':
                return {
                    label: 'Completed',
                    bg: 'bg-green-50 dark:bg-green-950/30',
                    border: 'border-green-300 dark:border-green-700',
                    text: 'text-green-800 dark:text-green-300',
                    icon: <Check className="w-5 h-5" />,
                };
            case 'awaiting_documentation':
                return {
                    label: 'Awaiting Documentation',
                    bg: 'bg-amber-50 dark:bg-amber-950/30',
                    border: 'border-amber-300 dark:border-amber-700',
                    text: 'text-amber-800 dark:text-amber-300',
                    icon: <Clock className="w-5 h-5" />,
                };
            case 'in_progress':
                return {
                    label: 'In Progress',
                    bg: 'bg-blue-50 dark:bg-blue-950/30',
                    border: 'border-blue-300 dark:border-blue-700',
                    text: 'text-blue-800 dark:text-blue-300',
                    icon: <Clock className="w-5 h-5" />,
                };
            default:
                // Handle 'pending', 'overdue' or 'skipped' similarly if needed
                return {
                    label: status.replace('_', ' '),
                    bg: 'bg-gray-50 dark:bg-gray-900/30',
                    border: 'border-gray-300 dark:border-gray-700',
                    text: 'text-gray-800 dark:text-gray-300',
                    icon: <AlertTriangle className="w-5 h-5" />,
                };
        }
    };

    const getEvidenceIcon = (type: EvidenceItem['type']) => {
        switch (type) {
            case 'certificate':
                return '📜';
            case 'report':
                return '📊';
            case 'photo':
                return '📷';
            case 'document':
                return '📄';
            default:
                return '📎';
        }
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    if (!history || history.length === 0) {
        return (
            <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No history yet
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Complete this check to start building a compliance history.
                </p>
            </div>
        );
    }

    return (
        <div className="relative pl-4 sm:pl-8">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-300 dark:bg-gray-700 hidden sm:block"></div>

            <div className="space-y-6">
                {history.map((record, idx) => {
                    const statusInfo = getStatusInfo(record.status);

                    return (
                        <div key={record.id} className="relative flex flex-col sm:flex-row gap-6">
                            {/* Timeline Dot */}
                            <div
                                className={`hidden sm:flex relative z-10 w-16 h-16 rounded-full border-4 items-center justify-center shadow-lg shrink-0 ${statusInfo.bg} ${statusInfo.border}`}
                            >
                                {statusInfo.icon}
                            </div>

                            {/* Content */}
                            <div
                                className={`flex-1 rounded-xl border-2 shadow-lg overflow-hidden ${statusInfo.bg} ${statusInfo.border}`}
                            >
                                <div className="p-6">
                                    {/* Header */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {idx === 0
                                                        ? 'Most Recent'
                                                        : `Completion #${history.length - idx}`}
                                                </h3>
                                                {/* Mobile Status Badge */}
                                                <span
                                                    className={`px-3 py-1 rounded-lg text-sm font-bold border-2 flex items-center gap-1.5 shadow-sm ${statusInfo.text} ${statusInfo.border} bg-white dark:bg-gray-800`}
                                                >
                                                    {statusInfo.icon}
                                                    <span className="capitalize">{statusInfo.label}</span>
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDateTime(record.completedDate)}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <User className="w-4 h-4" />
                                                    {record.completedBy}
                                                </span>
                                                {record.duration && (
                                                    <span>{record.duration} minutes</span>
                                                )}
                                            </div>
                                        </div>
                                        {record.contractorName && (
                                            <div className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600">
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                                    Contractor
                                                </p>
                                                <p className="font-bold text-gray-900 dark:text-white">
                                                    {record.contractorName}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    {record.notes && (
                                        <div className="mb-4 p-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700">
                                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                                                {record.notes}
                                            </p>
                                        </div>
                                    )}

                                    {/* Evidence */}
                                    {record.evidence && record.evidence.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                                <FileText className="w-4 h-4" />
                                                Evidence Documents ({record.evidence.length})
                                            </p>
                                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                {record.evidence.map((ev) => (
                                                    <a
                                                        key={ev.id}
                                                        href={ev.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all group"
                                                    >
                                                        <span className="text-2xl">
                                                            {getEvidenceIcon(ev.type)}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                                {ev.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                {ev.uploadedBy} •{' '}
                                                                {ev.fileSize ||
                                                                    new Date(ev.uploadedAt).toLocaleDateString(
                                                                        'en-GB'
                                                                    )}
                                                            </p>
                                                        </div>
                                                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex-shrink-0" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Document Status */}
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <div
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-bold ${record.documentsReceived
                                                    ? 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-700 text-green-800 dark:text-green-300'
                                                    : 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300'
                                                }`}
                                        >
                                            {record.documentsReceived ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                <AlertTriangle className="w-4 h-4" />
                                            )}
                                            {record.documentsReceived
                                                ? 'Documents Received'
                                                : 'Documents Outstanding'}
                                        </div>
                                        {record.nextDueDate && (
                                            <div className="px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                Next due: {formatDate(record.nextDueDate)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
