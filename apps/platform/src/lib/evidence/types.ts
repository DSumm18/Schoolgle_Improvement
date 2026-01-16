export type FileType = 'image' | 'pdf' | 'doc' | 'screenshot' | 'spreadsheet';
export type SourceType = 'upload' | 'sop' | 'navigator' | 'pack' | 'cloud_sync';

export interface EvidenceItem {
    id: string;
    organization_id: string;
    title: string;
    description?: string;
    file_url: string;
    file_type: FileType;
    file_size_bytes?: number;
    file_name?: string;
    category?: string;
    subcategory?: string;
    tags: string[];
    source_type: SourceType;
    source_id?: string;
    cloud_provider?: 'google' | 'onedrive';
    cloud_file_id?: string;
    uploaded_by: string;
    created_at: string;
    updated_at: string;
}

export type TimelineEntryType =
    | 'evidence_added'
    | 'pack_created'
    | 'pack_exported'
    | 'pack_approved'
    | 'sop_started'
    | 'sop_completed'
    | 'approval_decision'
    | 'manual'
    | 'system';

export interface TimelineEntry {
    id: string;
    organization_id: string;
    title: string;
    description?: string;
    entry_type: TimelineEntryType;
    source_type?: string;
    source_id?: string;
    evidence_ids: string[];
    category?: string;
    subcategory?: string;
    tags: string[];
    icon?: string;
    color?: string;
    created_by: string;
    created_at: string;
}

export const EVIDENCE_CATEGORIES = [
    { id: 'safeguarding', label: 'Safeguarding', color: 'red' },
    { id: 'teaching', label: 'Teaching & Learning', color: 'blue' },
    { id: 'leadership', label: 'Leadership', color: 'purple' },
    { id: 'finance', label: 'Finance', color: 'green' },
    { id: 'estates', label: 'Premises & Estates', color: 'orange' },
    { id: 'governance', label: 'Governance', color: 'indigo' },
    { id: 'attendance', label: 'Attendance', color: 'cyan' },
    { id: 'behaviour', label: 'Behaviour', color: 'yellow' },
    { id: 'compliance', label: 'Compliance', color: 'emerald' },
    { id: 'hr', label: 'HR & Staffing', color: 'pink' },
] as const;
