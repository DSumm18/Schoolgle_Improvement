import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface ComplianceStatusBadgeProps {
    status: 'PASS' | 'FAIL' | 'WARNING' | 'PENDING' | 'PROCESSING';
}

export default function ComplianceStatusBadge({ status }: ComplianceStatusBadgeProps) {
    const config = {
        PASS: {
            label: 'Pass',
            className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
            icon: <CheckCircle2 className="mr-1 h-3 w-3" />,
        },
        FAIL: {
            label: 'Fail',
            className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
            icon: <XCircle className="mr-1 h-3 w-3" />,
        },
        WARNING: {
            label: 'Warning',
            className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
            icon: <AlertTriangle className="mr-1 h-3 w-3" />,
        },
        PENDING: {
            label: 'Pending',
            className: 'bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-950/30 dark:text-zinc-400 dark:border-zinc-800',
            icon: <Clock className="mr-1 h-3 w-3" />,
        },
        PROCESSING: {
            label: 'Analyzing',
            className: 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800',
            icon: <Clock className="mr-1 h-3 w-3" />,
        },
    };

    const current = config[status];

    return (
        <Badge variant="outline" className={`font-medium px-2 py-0.5 rounded-full flex items-center w-fit ${current.className}`}>
            {current.icon}
            {current.label}
        </Badge>
    );
}
