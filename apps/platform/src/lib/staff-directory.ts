// Staff Directory Types

export type StaffRoleCategory =
    | 'headteacher'
    | 'deputy_headteacher'
    | 'assistant_headteacher'
    | 'subject_lead'
    | 'phase_lead'
    | 'class_teacher'
    | 'sendco'
    | 'business_manager'
    | 'site_manager'
    | 'governor'
    | 'teaching_assistant'
    | 'support_staff'
    | 'other';

export type StaffModuleAccess =
    | 'ofsted_readiness'
    | 'siams_readiness'
    | 'teaching_learning'
    | 'estates_compliance'
    | 'hr'
    | 'finance'
    | 'governance'
    | 'safeguarding'
    | 'send';

export interface StaffMember {
    id: string;
    organization_id: string;
    salutation: 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Prof' | 'Miss' | null;
    first_name: string;
    last_name: string;
    display_name: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    employee_id?: string;
    job_title: string;
    role_category: StaffRoleCategory;
    is_super_user: boolean;
    is_active: boolean;
    accessible_modules: StaffModuleAccess[];
    import_source?: 'manual' | 'csv_import' | 'sync';
    imported_at?: string;
    created_at: string;
    updated_at: string;
}

export interface StaffCSVRow {
    salutation?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    employee_id?: string;
    job_title: string;
    role_category: StaffRoleCategory;
    is_super_user?: 'yes' | 'no' | boolean;
    is_active?: 'yes' | 'no' | boolean;
}

// CSV Import Result
export interface StaffImportResult {
    success: boolean;
    imported: number;
    updated: number;
    errors: Array<{
        row: number;
        data: any;
        error: string;
    }>;
    warnings: string[];
}
