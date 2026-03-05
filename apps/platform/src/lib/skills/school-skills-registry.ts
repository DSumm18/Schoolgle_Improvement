/**
 * School Skills Registry
 *
 * Function schemas for AI-powered school management.
 * These schemas define the functions the AI assistant can call
 * to interact with Staff Directory and Actions Hub.
 */

// =====================================================
// STAFF DIRECTORY SKILLS
// =====================================================

export const STAFF_FUNCTION_SCHEMAS = [
    {
        name: 'create_staff_member',
        description: 'Add a new staff member to the directory',
        parameters: {
            type: 'object',
            properties: {
                organization_id: {
                    type: 'string',
                    description: 'Organization ID to assign staff to'
                },
                first_name: {
                    type: 'string',
                    description: 'Staff member first name (required)'
                },
                last_name: {
                    type: 'string',
                    description: 'Staff member last name (required)'
                },
                salutation: {
                    type: 'string',
                    enum: ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Miss', ''],
                    description: 'Title/salutation'
                },
                email: {
                    type: 'string',
                    description: 'Email address (used for matching)'
                },
                phone: {
                    type: 'string',
                    description: 'Contact phone number'
                },
                employee_id: {
                    type: 'string',
                    description: 'Staff/employee ID (used for matching)'
                },
                job_title: {
                    type: 'string',
                    description: 'Job title or position (required)'
                },
                role_category: {
                    type: 'string',
                    enum: ['headteacher', 'deputy_headteacher', 'assistant_headteacher',
                        'subject_lead', 'phase_lead', 'class_teacher', 'sendco',
                        'business_manager', 'site_manager', 'governor',
                        'teaching_assistant', 'support_staff', 'other'],
                    description: 'Role category for filtering'
                },
                is_super_user: {
                    type: 'boolean',
                    description: 'Has elevated permissions across all modules'
                },
                is_active: {
                    type: 'boolean',
                    description: 'Staff member is currently active (default: true)'
                }
            },
            required: ['organization_id', 'first_name', 'last_name', 'job_title']
        }
    },
    {
        name: 'update_staff_member',
        description: 'Update an existing staff member record',
        parameters: {
            type: 'object',
            properties: {
                staff_id: {
                    type: 'string',
                    description: 'Staff member ID to update (required)'
                },
                first_name: {
                    type: 'string',
                    description: 'First name'
                },
                last_name: {
                    type: 'string',
                    description: 'Last name'
                },
                email: {
                    type: 'string',
                    description: 'Email address'
                },
                phone: {
                    type: 'string',
                    description: 'Phone number'
                },
                employee_id: {
                    type: 'string',
                    description: 'Employee ID'
                },
                job_title: {
                    type: 'string',
                    description: 'Job title'
                },
                role_category: {
                    type: 'string',
                    enum: ['headteacher', 'deputy_headteacher', 'assistant_headteacher',
                        'subject_lead', 'phase_lead', 'class_teacher', 'sendco',
                        'business_manager', 'site_manager', 'governor',
                        'teaching_assistant', 'support_staff', 'other'],
                    description: 'Role category'
                },
                is_super_user: {
                    type: 'boolean',
                    description: 'Super user status'
                },
                is_active: {
                    type: 'boolean',
                    description: 'Active status'
                }
            },
            required: ['staff_id']
        }
    },
    {
        name: 'list_staff',
        description: 'List all staff members with optional filtering',
        parameters: {
            type: 'object',
            properties: {
                organization_id: {
                    type: 'string',
                    description: 'Organization ID to filter by (required)'
                },
                role_category: {
                    type: 'string',
                    description: 'Filter by role category'
                },
                is_active: {
                    type: 'boolean',
                    description: 'Filter by active status'
                },
                search: {
                    type: 'string',
                    description: 'Search by name or email'
                }
            },
            required: ['organization_id']
        }
    },
    {
        name: 'export_staff_csv',
        description: 'Export staff directory as CSV for round-trip editing',
        parameters: {
            type: 'object',
            properties: {
                organization_id: {
                    type: 'string',
                    description: 'Organization ID to export for (required)'
                }
            },
            required: ['organization_id']
        }
    },
    {
        name: 'import_staff_csv',
        description: 'Import staff from CSV (supports add/update/remove actions)',
        parameters: {
            type: 'object',
            properties: {
                organization_id: {
                    type: 'string',
                    description: 'Organization ID (required)'
                },
                csv_data: {
                    type: 'string',
                    description: 'CSV data with embedded instructions (required)'
                }
            },
            required: ['organization_id', 'csv_data']
        }
    },
    {
        name: 'deactivate_staff_member',
        description: 'Deactivate (archive) a staff member without deleting',
        parameters: {
            type: 'object',
            properties: {
                staff_id: {
                    type: 'string',
                    description: 'Staff member ID to deactivate (required)'
                }
            },
            required: ['staff_id']
        }
    }
];

// =====================================================
// ACTIONS HUB SKILLS
// =====================================================

export const ACTIONS_FUNCTION_SCHEMAS = [
    {
        name: 'create_action',
        description: 'Create a new improvement action with EEF research backing',
        parameters: {
            type: 'object',
            properties: {
                organization_id: {
                    type: 'string',
                    description: 'Organization ID (required)'
                },
                title: {
                    type: 'string',
                    description: 'Action title (required)'
                },
                description: {
                    type: 'string',
                    description: 'Detailed description'
                },
                success_criteria: {
                    type: 'string',
                    description: 'How will we know this action is complete?'
                },
                framework_type: {
                    type: 'string',
                    enum: ['ofsted', 'siams'],
                    description: 'Framework: Ofsted or SIAMS (default: ofsted)'
                },
                priority: {
                    type: 'string',
                    enum: ['critical', 'high', 'medium', 'low'],
                    description: 'Priority level (default: medium)'
                },
                owner_id: {
                    type: 'string',
                    description: 'Staff ID to assign to'
                },
                owner_name: {
                    type: 'string',
                    description: 'Owner name (if ID not available)'
                },
                due_date: {
                    type: 'string',
                    description: 'Due date in YYYY-MM-DD format'
                },
                user_status: {
                    type: 'string',
                    enum: ['draft', 'assigned', 'in_progress', 'pending_review', 'complete', 'cancelled'],
                    description: 'User progress status (default: draft)'
                },
                ai_status: {
                    type: 'string',
                    enum: ['not_met', 'partially_met', 'met', 'not_assessed'],
                    description: 'AI evidence validation (default: not_assessed)'
                },
                estimated_cost: {
                    type: 'number',
                    description: 'Estimated cost in pounds'
                },
                funding_source: {
                    type: 'string',
                    enum: ['pupil_premium', 'school_budget', 'sports_premium', 'catch_up_premium',
                        'devolved_capital', 'central_grant', 'other'],
                    description: 'Funding source'
                },
                financial_year: {
                    type: 'string',
                    description: 'Financial year (e.g., 2024-25)'
                },
                eef_strategy: {
                    type: 'string',
                    description: 'EEF strategy ID for research backing'
                },
                eef_impact_months: {
                    type: 'number',
                    description: 'Expected months to impact'
                }
            },
            required: ['organization_id', 'title']
        }
    },
    {
        name: 'update_action',
        description: 'Update an existing action',
        parameters: {
            type: 'object',
            properties: {
                action_id: {
                    type: 'string',
                    description: 'Action ID to update (required)'
                },
                title: {
                    type: 'string',
                    description: 'Action title'
                },
                description: {
                    type: 'string',
                    description: 'Description'
                },
                success_criteria: {
                    type: 'string',
                    description: 'Success criteria'
                },
                priority: {
                    type: 'string',
                    enum: ['critical', 'high', 'medium', 'low'],
                    description: 'Priority level'
                },
                owner_id: {
                    type: 'string',
                    description: 'Assign to staff ID'
                },
                owner_name: {
                    type: 'string',
                    description: 'Owner name'
                },
                due_date: {
                    type: 'string',
                    description: 'Due date in YYYY-MM-DD format'
                },
                user_status: {
                    type: 'string',
                    enum: ['draft', 'assigned', 'in_progress', 'pending_review', 'complete', 'cancelled'],
                    description: 'User status'
                },
                ai_status: {
                    type: 'string',
                    enum: ['not_met', 'partially_met', 'met', 'not_assessed'],
                    description: 'AI assessment status'
                },
                ai_rationale: {
                    type: 'string',
                    description: 'Explanation for AI assessment'
                },
                actual_cost: {
                    type: 'number',
                    description: 'Actual cost spent'
                },
                implementation_date: {
                    type: 'string',
                    description: 'Implementation date in YYYY-MM-DD format'
                }
            },
            required: ['action_id']
        }
    },
    {
        name: 'list_actions',
        description: 'List all actions with filtering options',
        parameters: {
            type: 'object',
            properties: {
                organization_id: {
                    type: 'string',
                    description: 'Organization ID (required)'
                },
                user_status: {
                    type: 'string',
                    enum: ['draft', 'assigned', 'in_progress', 'pending_review', 'complete', 'cancelled'],
                    description: 'Filter by user status'
                },
                ai_status: {
                    type: 'string',
                    enum: ['not_met', 'partially_met', 'met', 'not_assessed'],
                    description: 'Filter by AI status'
                },
                priority: {
                    type: 'string',
                    enum: ['critical', 'high', 'medium', 'low'],
                    description: 'Filter by priority'
                },
                owner_id: {
                    type: 'string',
                    description: 'Filter by owner'
                },
                framework_type: {
                    type: 'string',
                    enum: ['ofsted', 'siams'],
                    description: 'Filter by framework'
                },
                overdue_only: {
                    type: 'boolean',
                    description: 'Only show overdue actions'
                }
            },
            required: ['organization_id']
        }
    },
    {
        name: 'get_action_stats',
        description: 'Get dashboard statistics for actions',
        parameters: {
            type: 'object',
            properties: {
                organization_id: {
                    type: 'string',
                    description: 'Organization ID (required)'
                }
            },
            required: ['organization_id']
        }
    },
    {
        name: 'suggest_eef_strategy',
        description: 'Suggest EEF research-backed strategies based on action description',
        parameters: {
            type: 'object',
            properties: {
                action_description: {
                    type: 'string',
                    description: 'Description of the action or improvement area (required)'
                },
                focus_area: {
                    type: 'string',
                    enum: ['teaching', 'learning', 'behaviour', 'attendance', 'pastoral', 'leadership'],
                    description: 'Primary focus area'
                },
                budget_level: {
                    type: 'string',
                    enum: ['£', '££', '£££', '££££', '£££££'],
                    description: 'Available budget level'
                }
            },
            required: ['action_description']
        }
    },
    {
        name: 'add_action_note',
        description: 'Add a progress note to an action',
        parameters: {
            type: 'object',
            properties: {
                action_id: {
                    type: 'string',
                    description: 'Action ID (required)'
                },
                content: {
                    type: 'string',
                    description: 'Note content (required)'
                },
                author: {
                    type: 'string',
                    description: 'Note author name'
                }
            },
            required: ['action_id', 'content']
        }
    }
];

// =====================================================
// ESTATES & COMPLIANCE SKILLS
// =====================================================

export const ESTATES_FUNCTION_SCHEMAS = [
    {
        name: 'create_helpdesk_ticket',
        description: 'Log a new maintenance or helpdesk ticket (e.g., repairs, leaks, broken equipment)',
        parameters: {
            type: 'object',
            properties: {
                organization_id: {
                    type: 'string',
                    description: 'Organization ID (required)'
                },
                title: {
                    type: 'string',
                    description: 'Brief title of the issue (required)'
                },
                description: {
                    type: 'string',
                    description: 'Detailed description of the maintenance issue'
                },
                priority: {
                    type: 'string',
                    enum: ['critical', 'high', 'medium', 'low'],
                    description: 'Urgency of the repair (default: medium)'
                },
                location: {
                    type: 'string',
                    description: 'Building, room, or area where the issue is (plain text)'
                },
                location_id: {
                    type: 'string',
                    description: 'The unique ID of the location from estates_locations (preferred)'
                },
                compliance_domain: {
                    type: 'string',
                    enum: ['fire', 'water', 'electrical', 'gas', 'asbestos', 'structural', 'security', 'general'],
                    description: 'Compliance domain this falls under'
                }
            },
            required: ['organization_id', 'title']
        }
    },
    {
        name: 'update_helpdesk_ticket',
        description: 'Update status, assignee, or notes for an existing ticket',
        parameters: {
            type: 'object',
            properties: {
                ticket_id: {
                    type: 'string',
                    description: 'ID of the ticket to update (required)'
                },
                status: {
                    type: 'string',
                    enum: ['open', 'in_progress', 'resolved', 'closed', 'cancelled'],
                    description: 'New status for the ticket'
                },
                assignee_id: {
                    type: 'string',
                    description: 'ID of the staff member or contractor assigned'
                },
                resolution_notes: {
                    type: 'string',
                    description: 'Notes explaining how the issue was resolved'
                }
            },
            required: ['ticket_id']
        }
    },
    {
        name: 'search_contractors',
        description: 'Find contractors by service type (plumber, electrician, etc.) or name',
        parameters: {
            type: 'object',
            properties: {
                organization_id: {
                    type: 'string',
                    description: 'Organization ID (required)'
                },
                service_type: {
                    type: 'string',
                    description: 'Type of trade or service (e.g., plumbing, roofing)'
                },
                search: {
                    type: 'string',
                    description: 'Search string for contractor name'
                }
            },
            required: ['organization_id']
        }
    },
    {
        name: 'check_contractor_accreditation',
        description: 'Verify if a contractor has valid DBS or trade accreditations (IOSH, SafeContractor, etc.)',
        parameters: {
            type: 'object',
            properties: {
                contractor_id: {
                    type: 'string',
                    description: 'Contractor ID to check (required)'
                },
                accreditation_type: {
                    type: 'string',
                    description: 'Specific accreditation to check (e.g., DBS)'
                }
            },
            required: ['contractor_id']
        }
    },
    {
        name: 'list_compliance_tasks',
        description: 'List upcoming or overdue compliance tasks (fire checks, water testing, etc.)',
        parameters: {
            type: 'object',
            properties: {
                organization_id: {
                    type: 'string',
                    description: 'Organization ID (required)'
                },
                status: {
                    type: 'string',
                    enum: ['pending', 'in_progress', 'overdue', 'completed'],
                    description: 'Filter by task status'
                },
                domain: {
                    type: 'string',
                    enum: ['fire', 'water', 'electrical', 'gas', 'asbestos', 'security', 'general'],
                    description: 'Filter by compliance domain'
                },
                location_id: {
                    type: 'string',
                    description: 'Filter tasks for a specific location ID'
                }
            },
            required: ['organization_id']
        }
    },
    {
        name: 'search_knowledge',
        description: 'Search the statutory compliance knowledge base for legislation, frequencies, and guidance',
        parameters: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'The topic or legislation to search for (e.g., "Legionella flushing frequency")'
                },
                domain: {
                    type: 'string',
                    enum: ['estates', 'hr', 'safeguarding', 'fire', 'water', 'asbestos', 'electrical', 'gas', 'it', 'send'],
                    description: 'Optional domain to narrow the search'
                }
            },
            required: ['query']
        }
    },
    {
        name: 'extract_estates_document',
        description: 'Extract asset or compliance information from an uploaded document (PDF/Image) using vision/LLM',
        parameters: {
            type: 'object',
            properties: {
                organization_id: {
                    type: 'string',
                    description: 'Organization ID (required)'
                },
                file_url: {
                    type: 'string',
                    description: 'URL of the uploaded document (required)'
                },
                document_type: {
                    type: 'string',
                    enum: ['compliance_certificate', 'asset_list', 'invoice', 'inspection_report'],
                    description: 'The category of the document to aid extraction'
                }
            },
            required: ['organization_id', 'file_url']
        }
    },
    {
        name: 'analyze_spatial_impact',
        description: 'Analyze the impact of an issue or maintenance task on adjacent rooms/areas based on proximity',
        parameters: {
            type: 'object',
            properties: {
                organization_id: {
                    type: 'string',
                    description: 'Organization ID (required)'
                },
                location_id: {
                    type: 'string',
                    description: 'Location ID of the source issue (required)'
                },
                issue_type: {
                    type: 'string',
                    description: 'Type of issue (e.g., "leak", "power failure", "boiler maintenance")'
                }
            },
            required: ['organization_id', 'location_id']
        }
    }
];

// =====================================================
// COMBINED REGISTRY
// =====================================================

export const SCHOOL_FUNCTION_SCHEMAS = [
    ...STAFF_FUNCTION_SCHEMAS,
    ...ACTIONS_FUNCTION_SCHEMAS,
    ...ESTATES_FUNCTION_SCHEMAS
];

// Helper to get all function names
export function getStaffFunctionNames(): string[] {
    return STAFF_FUNCTION_SCHEMAS.map(f => f.name);
}

export function getActionsFunctionNames(): string[] {
    return ACTIONS_FUNCTION_SCHEMAS.map(f => f.name);
}

export function getEstatesFunctionNames(): string[] {
    return ESTATES_FUNCTION_SCHEMAS.map(f => f.name);
}

export function getAllSchoolFunctionNames(): string[] {
    return SCHOOL_FUNCTION_SCHEMAS.map(f => f.name);
}

// Helper to get function schema by name
export function getFunctionSchema(functionName: string) {
    return SCHOOL_FUNCTION_SCHEMAS.find(f => f.name === functionName);
}

// Category helpers for skill routing
export const STAFF_FUNCTIONS = new Set(getStaffFunctionNames());
export const ACTIONS_FUNCTIONS = new Set(getActionsFunctionNames());
export const ESTATES_FUNCTIONS = new Set(getEstatesFunctionNames());

export function getSkillForFunction(functionName: string): 'staff' | 'actions' | 'estates' | null {
    if (STAFF_FUNCTIONS.has(functionName)) return 'staff';
    if (ACTIONS_FUNCTIONS.has(functionName)) return 'actions';
    if (ESTATES_FUNCTIONS.has(functionName)) return 'estates';
    return null;
}
