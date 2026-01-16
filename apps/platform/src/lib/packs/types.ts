export type PackStatus = 'draft' | 'submitted' | 'approved' | 'exported';

export interface PackSection {
    id: string;
    title: string;
    word_guide?: string;
    evidence_categories: string[];
    content: string;
    evidence_ids: string[];
    comments?: string;
}

export interface PackTemplate {
    id: string;
    name: string;
    description?: string;
    sections: PackSection[];
    created_at: string;
}

export interface Pack {
    id: string;
    organization_id: string;
    template_id: string;
    title: string;
    status: PackStatus;
    sections: PackSection[];
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface PackVersion {
    id: string;
    pack_id: string;
    version_number: number;
    sections: PackSection[];
    trigger_type: string;
    created_by: string;
    created_at: string;
}

export interface PackApproval {
    id: string;
    pack_id: string;
    user_id: string;
    status: 'approved' | 'rejected' | 'requested';
    comments?: string;
    created_at: string;
}
