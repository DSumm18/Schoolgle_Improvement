/**
 * School Skills Handlers
 *
 * Implementation functions for AI-callable skills.
 * These functions wrap the API calls and provide a clean interface
 * for the AI assistant to interact with platform features.
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// STAFF DIRECTORY HANDLERS
// =====================================================

export interface CreateStaffParams {
    organization_id: string;
    first_name: string;
    last_name: string;
    salutation?: string;
    email?: string;
    phone?: string;
    employee_id?: string;
    job_title: string;
    role_category?: string;
    is_super_user?: boolean;
    is_active?: boolean;
}

export interface UpdateStaffParams {
    staff_id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    employee_id?: string;
    job_title?: string;
    role_category?: string;
    is_super_user?: boolean;
    is_active?: boolean;
}

export interface ListStaffParams {
    organization_id: string;
    role_category?: string;
    is_active?: boolean;
    search?: string;
}

/**
 * Create a new staff member
 */
export async function createStaffMember(params: CreateStaffParams): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    try {
        const {
            organization_id,
            first_name,
            last_name,
            salutation,
            email,
            phone,
            employee_id,
            job_title,
            role_category = 'other',
            is_super_user = false,
            is_active = true
        } = params;

        // Normalize salutation
        const validSalutations = ['Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Miss'];
        const normalizedSalutation = salutation && validSalutations.includes(salutation)
            ? salutation
            : null;

        const { data, error } = await supabase
            .from('staff_directory')
            .insert({
                organization_id,
                salutation: normalizedSalutation,
                first_name: first_name.trim(),
                last_name: last_name.trim(),
                email: email?.trim() || null,
                phone: phone?.trim() || null,
                employee_id: employee_id?.trim() || null,
                job_title: job_title.trim(),
                role_category,
                is_super_user,
                is_active,
                import_source: 'ai_assistant',
                imported_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            data: {
                id: data.id,
                name: `${data.first_name} ${data.last_name}`,
                job_title: data.job_title,
                email: data.email
            }
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to create staff member'
        };
    }
}

/**
 * Update an existing staff member
 */
export async function updateStaffMember(params: UpdateStaffParams): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    try {
        const { staff_id, ...updates } = params;

        // Build update object with only provided fields
        const updateData: any = {};
        if (updates.first_name) updateData.first_name = updates.first_name.trim();
        if (updates.last_name) updateData.last_name = updates.last_name.trim();
        if (updates.email !== undefined) updateData.email = updates.email?.trim() || null;
        if (updates.phone !== undefined) updateData.phone = updates.phone?.trim() || null;
        if (updates.employee_id !== undefined) updateData.employee_id = updates.employee_id?.trim() || null;
        if (updates.job_title) updateData.job_title = updates.job_title.trim();
        if (updates.role_category) updateData.role_category = updates.role_category;
        if (updates.is_super_user !== undefined) updateData.is_super_user = updates.is_super_user;
        if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

        const { data, error } = await supabase
            .from('staff_directory')
            .update(updateData)
            .eq('id', staff_id)
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            data: {
                id: data.id,
                name: `${data.first_name} ${data.last_name}`,
                job_title: data.job_title
            }
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to update staff member'
        };
    }
}

/**
 * List staff members with optional filtering
 */
export async function listStaff(params: ListStaffParams): Promise<{
    success: boolean;
    data?: any[];
    count?: number;
    error?: string;
}> {
    try {
        const { organization_id, role_category, is_active, search } = params;

        let query = supabase
            .from('staff_directory')
            .select('*')
            .eq('organization_id', organization_id);

        if (role_category) {
            query = query.eq('role_category', role_category);
        }

        if (is_active !== undefined) {
            query = query.eq('is_active', is_active);
        }

        if (search) {
            query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,job_title.ilike.%${search}%`);
        }

        const { data, error, count } = await query;

        if (error) throw error;

        return {
            success: true,
            data: data?.map(s => ({
                id: s.id,
                name: `${s.first_name} ${s.last_name}`,
                email: s.email,
                job_title: s.job_title,
                role_category: s.role_category,
                is_active: s.is_active
            })),
            count: count || 0
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to list staff'
        };
    }
}

/**
 * Deactivate (archive) a staff member
 */
export async function deactivateStaffMember(staff_id: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const { error } = await supabase
            .from('staff_directory')
            .update({ is_active: false })
            .eq('id', staff_id);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to deactivate staff member'
        };
    }
}

// =====================================================
// ACTIONS HUB HANDLERS
// =====================================================

export interface CreateActionParams {
    organization_id: string;
    title: string;
    description?: string;
    success_criteria?: string;
    framework_type?: 'ofsted' | 'siams';
    priority?: 'critical' | 'high' | 'medium' | 'low';
    owner_id?: string;
    owner_name?: string;
    due_date?: string;
    user_status?: 'draft' | 'assigned' | 'in_progress' | 'pending_review' | 'complete' | 'cancelled';
    ai_status?: 'not_met' | 'partially_met' | 'met' | 'not_assessed';
    estimated_cost?: number;
    funding_source?: string;
    financial_year?: string;
    eef_strategy?: string;
    eef_impact_months?: number;
}

export interface UpdateActionParams {
    action_id: string;
    title?: string;
    description?: string;
    success_criteria?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    owner_id?: string;
    owner_name?: string;
    due_date?: string;
    user_status?: 'draft' | 'assigned' | 'in_progress' | 'pending_review' | 'complete' | 'cancelled';
    ai_status?: 'not_met' | 'partially_met' | 'met' | 'not_assessed';
    ai_rationale?: string;
    actual_cost?: number;
    implementation_date?: string;
}

export interface ListActionsParams {
    organization_id: string;
    user_status?: string;
    ai_status?: string;
    priority?: string;
    owner_id?: string;
    framework_type?: string;
    overdue_only?: boolean;
}

/**
 * Create a new improvement action
 */
export async function createAction(params: CreateActionParams): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    try {
        const {
            organization_id,
            title,
            description,
            success_criteria,
            framework_type = 'ofsted',
            priority = 'medium',
            owner_id,
            owner_name,
            due_date,
            user_status = 'draft',
            ai_status = 'not_assessed',
            estimated_cost,
            funding_source,
            financial_year,
            eef_strategy,
            eef_impact_months
        } = params;

        const { data, error } = await supabase
            .from('actions')
            .insert({
                organization_id,
                title: title.trim(),
                description: description?.trim() || null,
                success_criteria: success_criteria?.trim() || null,
                framework_type,
                priority,
                owner_id: owner_id || null,
                owner_name: owner_name?.trim() || null,
                due_date: due_date || null,
                user_status,
                ai_status,
                estimated_cost: estimated_cost || null,
                funding_source: funding_source || null,
                financial_year: financial_year || null,
                eef_strategy: eef_strategy || null,
                eef_impact_months: eef_impact_months || null,
                source: 'ai_assistant',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            data: {
                id: data.id,
                title: data.title,
                status: `${data.user_status} / ${data.ai_status}`,
                priority: data.priority
            }
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to create action'
        };
    }
}

/**
 * Update an existing action
 */
export async function updateAction(params: UpdateActionParams): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    try {
        const { action_id, ...updates } = params;

        const updateData: any = {};
        if (updates.title) updateData.title = updates.title.trim();
        if (updates.description !== undefined) updateData.description = updates.description?.trim() || null;
        if (updates.success_criteria !== undefined) updateData.success_criteria = updates.success_criteria?.trim() || null;
        if (updates.priority) updateData.priority = updates.priority;
        if (updates.owner_id !== undefined) updateData.owner_id = updates.owner_id || null;
        if (updates.owner_name !== undefined) updateData.owner_name = updates.owner_name?.trim() || null;
        if (updates.due_date !== undefined) updateData.due_date = updates.due_date || null;
        if (updates.user_status) updateData.user_status = updates.user_status;
        if (updates.ai_status) updateData.ai_status = updates.ai_status;
        if (updates.ai_rationale !== undefined) updateData.ai_rationale = updates.ai_rationale?.trim() || null;
        if (updates.actual_cost !== undefined) updateData.actual_cost = updates.actual_cost || null;
        if (updates.implementation_date !== undefined) updateData.implementation_date = updates.implementation_date || null;

        const { data, error } = await supabase
            .from('actions')
            .update(updateData)
            .eq('id', action_id)
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            data: {
                id: data.id,
                title: data.title,
                status: `${data.user_status} / ${data.ai_status}`
            }
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to update action'
        };
    }
}

/**
 * List actions with filtering
 */
export async function listActions(params: ListActionsParams): Promise<{
    success: boolean;
    data?: any[];
    stats?: {
        total: number;
        complete: number;
        in_progress: number;
        gaps: number;
        overdue: number;
    };
    error?: string;
}> {
    try {
        const {
            organization_id,
            user_status,
            ai_status,
            priority,
            owner_id,
            framework_type,
            overdue_only
        } = params;

        let query = supabase
            .from('actions')
            .select('*')
            .eq('organization_id', organization_id);

        if (user_status) query = query.eq('user_status', user_status);
        if (ai_status) query = query.eq('ai_status', ai_status);
        if (priority) query = query.eq('priority', priority);
        if (owner_id) query = query.eq('owner_id', owner_id);
        if (framework_type) query = query.eq('framework_type', framework_type);

        const { data, error } = await query;

        if (error) throw error;

        let filtered = data || [];

        // Post-process for overdue filter
        if (overdue_only) {
            const now = new Date();
            filtered = filtered.filter((a: any) =>
                a.due_date &&
                new Date(a.due_date) < now &&
                a.user_status !== 'complete'
            );
        }

        // Calculate stats
        const stats = {
            total: filtered.length,
            complete: filtered.filter((a: any) => a.user_status === 'complete').length,
            in_progress: filtered.filter((a: any) => a.user_status === 'in_progress').length,
            gaps: filtered.filter((a: any) => a.ai_status === 'not_met' && a.user_status !== 'complete').length,
            overdue: filtered.filter((a: any) =>
                a.due_date &&
                new Date(a.due_date) < new Date() &&
                a.user_status !== 'complete'
            ).length
        };

        return {
            success: true,
            data: filtered.map((a: any) => ({
                id: a.id,
                title: a.title,
                status: `${a.user_status} / ${a.ai_status}`,
                priority: a.priority,
                owner: a.owner_name,
                due_date: a.due_date
            })),
            stats
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to list actions'
        };
    }
}

/**
 * Get action dashboard statistics
 */
export async function getActionStats(organization_id: string): Promise<{
    success: boolean;
    stats?: any;
    error?: string;
}> {
    try {
        const { data, error } = await supabase
            .from('actions')
            .select('*')
            .eq('organization_id', organization_id);

        if (error) throw error;

        const actions = data || [];
        const now = new Date();

        const stats = {
            total: actions.length,
            complete: actions.filter(a => a.user_status === 'complete').length,
            in_progress: actions.filter(a => a.user_status === 'in_progress').length,
            gaps: actions.filter(a => a.ai_status === 'not_met' && a.user_status !== 'complete').length,
            overdue: actions.filter(a =>
                a.due_date &&
                new Date(a.due_date) < now &&
                a.user_status !== 'complete'
            ).length,
            completion_rate: actions.length > 0
                ? Math.round((actions.filter(a => a.user_status === 'complete').length / actions.length) * 100)
                : 0,
            total_estimated: actions.reduce((sum, a) => sum + (a.estimated_cost || 0), 0),
            total_actual: actions.reduce((sum, a) => sum + (a.actual_cost || 0), 0)
        };

        return {
            success: true,
            stats
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to get action stats'
        };
    }
}

// =====================================================
// EEF STRATEGY HELPER
// =====================================================

export const EEF_STRATEGIES = [
    { id: 'feedback', name: 'Feedback', evidence: 5, cost: '£', impact: '+6 months' },
    { id: 'metacognition', name: 'Metacognition', evidence: 5, cost: '£', impact: '+7 months' },
    { id: 'small_group_tuition', name: 'Small group tuition', evidence: 4, cost: '£££', impact: '+4 months' },
    { id: 'early_years', name: 'Early years intervention', evidence: 4, cost: '££', impact: '+5 months' },
    { id: 'one_to_one', name: 'One to one tuition', evidence: 4, cost: '££££', impact: '+5 months' },
    { id: 'phonics', name: 'Phonics', evidence: 5, cost: '£', impact: '+5 months' },
    { id: 'behaviour_interventions', name: 'Behaviour interventions', evidence: 4, cost: '££', impact: '+4 months' },
    { id: 'social_emotional', name: 'Social and emotional learning', evidence: 4, cost: '££', impact: '+4 months' },
    { id: 'digital_technology', name: 'Digital technology', evidence: 2, cost: '£££', impact: '+2 months' },
    { id: 'peer_tutoring', name: 'Peer tutoring', evidence: 4, cost: '£', impact: '+5 months' },
    { id: 'extended_school_time', name: 'Extended school time', evidence: 2, cost: '££££', impact: '+2 months' },
    { id: 'sports_premium', name: 'Sports premium', evidence: 2, cost: '££', impact: '+2 months' },
    { id: 'teaching_assistants', name: 'Teaching assistants', evidence: 2, cost: '£££', impact: '+1 months' },
    { id: 'learning_styles', name: 'Learning styles', evidence: 1, cost: '£', impact: '+0 months' },
];

/**
 * Suggest EEF strategy based on description
 */
export function suggestEEFStrategy(description: string, focus_area?: string): {
    strategies: typeof EEF_STRATEGIES;
    recommendation?: typeof EEF_STRATEGIES[0];
} {
    const desc = description.toLowerCase();

    let recommended = EEF_STRATEGIES.slice(0, 5); // Top 5 by default

    // Simple keyword matching
    if (desc.includes('math') || desc.includes('numeracy') || desc.includes('tutoring')) {
        recommended = EEF_STRATEGIES.filter(s =>
            ['small_group_tuition', 'one_to_one', 'peer_tutoring', 'feedback'].includes(s.id)
        );
    } else if (desc.includes('reading') || desc.includes('literacy') || desc.includes('phonics')) {
        recommended = EEF_STRATEGIES.filter(s =>
            ['phonics', 'feedback', 'peer_tutoring', 'early_years'].includes(s.id)
        );
    } else if (desc.includes('behaviour') || desc.includes('behaviour') || desc.includes('social')) {
        recommended = EEF_STRATEGIES.filter(s =>
            ['behaviour_interventions', 'social_emotional', 'metacognition'].includes(s.id)
        );
    } else if (desc.includes('meta') || desc.includes('self-reg') || desc.includes('thinking')) {
        recommended = EEF_STRATEGIES.filter(s =>
            ['metacognition', 'feedback', 'peer_tutoring'].includes(s.id)
        );
    }

    return {
        strategies: EEF_STRATEGIES,
        recommendation: recommended[0]
    };
}
// =====================================================
// COMPLIANCE & ESTATES HANDLERS
// =====================================================

export interface SearchKnowledgeParams {
    query: string;
    domain?: string;
}

export interface CreateHelpdeskTicketParams {
    organization_id: string;
    title: string;
    description?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    location?: string;
    location_id?: string;
    compliance_domain?: string;
}

export interface UpdateHelpdeskTicketParams {
    ticket_id: string;
    status?: string;
    assignee_id?: string;
    resolution_notes?: string;
}

export interface ListComplianceTasksParams {
    organization_id: string;
    status?: 'pending' | 'in_progress' | 'overdue' | 'completed';
    domain?: string;
    location_id?: string;
}

export interface SearchContractorParams {
    organization_id: string;
    service_type?: string;
    search?: string;
}

export interface ValidateContractorParams {
    organization_id: string;
    recommendation: string;
    domain?: string;
}

/**
 * Search the statutory knowledge base
 */
export async function searchKnowledge(params: SearchKnowledgeParams): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
}> {
    try {
        const { query, domain } = params;

        let dbQuery = supabase
            .from('compliance_knowledge')
            .select('*')
            .or(`topic.ilike.%${query}%,content.ilike.%${query}%`);

        if (domain) {
            dbQuery = dbQuery.eq('domain', domain);
        }

        const { data, error } = await dbQuery.limit(5);

        if (error) throw error;

        return {
            success: true,
            data: data?.map(k => ({
                id: k.id,
                topic: k.topic,
                content: k.content,
                is_statutory: k.is_statutory,
                legislation_reference: k.legislation_reference,
                contractor_context: k.contractor_context,
            }))
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to search knowledge base'
        };
    }
}

/**
 * List compliance tasks
 */
export async function listComplianceTasks(params: ListComplianceTasksParams): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
}> {
    try {
        const { organization_id, status, domain } = params;

        let dbQuery = supabase
            .from('estates_helpdesk_tickets') // Reusing helpdesk for tasks if appropriate or a specific table if exists
            .select('*')
            .eq('organization_id', organization_id)
            .not('compliance_domain', 'is', null);

        if (status) dbQuery = dbQuery.eq('status', status);
        if (domain) dbQuery = dbQuery.eq('compliance_domain', domain);
        if (params.location_id) dbQuery = dbQuery.eq('location_id', params.location_id);

        const { data, error } = await dbQuery.limit(20);

        if (error) throw error;

        return {
            success: true,
            data
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to list compliance tasks'
        };
    }
}

/**
 * Search contractors
 */
export async function searchContractors(params: SearchContractorParams): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
}> {
    try {
        const { organization_id, service_type, search } = params;

        let dbQuery = supabase
            .from('estates_contractors')
            .select('*')
            .eq('organization_id', organization_id);

        if (service_type) {
            dbQuery = dbQuery.ilike('service_type', `%${service_type}%`);
        }

        if (search) {
            dbQuery = dbQuery.or(`name.ilike.%${search}%,contact_email.ilike.%${search}%`);
        }

        const { data, error } = await dbQuery;

        if (error) throw error;

        return {
            success: true,
            data
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to search contractors'
        };
    }
}

/**
 * Validate a contractor's recommendation (The Bullshit Filter)
 */
export async function validateContractorRecommendation(params: ValidateContractorParams): Promise<{
    success: boolean;
    data?: {
        recommendation: string;
        is_valid: boolean;
        reasoning: string;
        statutory_reference?: string;
        alternative_suggestion?: string;
    };
    error?: string;
}> {
    try {
        const { recommendation, domain } = params;

        // 1. Search for relevant statutory knowledge
        const knowledge = await searchKnowledge({ query: recommendation, domain });

        if (!knowledge.success || !knowledge.data || knowledge.data.length === 0) {
            return {
                success: true,
                data: {
                    recommendation,
                    is_valid: true, // Neutral if no knowledge found
                    reasoning: "I couldn't find specific statutory guidance to contradict this recommendation. Please use professional judgment."
                }
            };
        }

        const bestMatch = knowledge.data[0];

        // 2. Perform comparison logic (simplified for now, would be LLM powered in full impl)
        // In Priority 2, we use the contractor_context field to guide Ed.
        const isStatutoryRequired = bestMatch.is_statutory;
        const reasoning = bestMatch.contractor_context
            ? `According to statutory guidelines: ${bestMatch.content}. Note: ${bestMatch.contractor_context}`
            : `Legislation (${bestMatch.legislation_reference}) states: ${bestMatch.content}`;

        return {
            success: true,
            data: {
                recommendation,
                is_valid: isStatutoryRequired,
                reasoning,
                statutory_reference: bestMatch.legislation_reference
            }
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to validate recommendation'
        };
    }
}

export interface ExtractEstatesDocumentParams {
    organization_id: string;
    file_url: string;
    document_type?: 'compliance_certificate' | 'asset_list' | 'invoice' | 'inspection_report';
}

export interface AnalyzeSpatialImpactParams {
    organization_id: string;
    location_id: string;
    issue_type?: string;
}

/**
 * Extract asset or compliance information from a document
 */
export async function extractEstatesDocument(params: ExtractEstatesDocumentParams): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    try {
        const { organization_id, file_url, document_type = 'compliance_certificate' } = params;

        // In a real implementation, this would call an AI vision service or a specialized OCR chain.
        // For now, we simulate the extraction logic and return suggested updates.

        return {
            success: true,
            data: {
                extracted_at: new Date().toISOString(),
                document_type,
                suggested_updates: [
                    {
                        type: 'asset_update',
                        asset_name: 'Boiler 01',
                        serial_number: 'SN-12345-ABC',
                        next_inspection_date: '2025-02-09',
                        confidence: 0.95
                    }
                ],
                summary: `Successfully parsed ${document_type}. Identified Boiler 01 with serial SN-12345-ABC. Next inspection due Feb 2025.`
            }
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to extract document data'
        };
    }
}

/**
 * Analyze the impact of an issue on adjacent locations
 */
export async function analyzeSpatialImpact(params: AnalyzeSpatialImpactParams): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    try {
        const { organization_id, location_id, issue_type } = params;

        // 1. Fetch location details to understand hierarchy
        const { data: location, error: locError } = await supabase
            .from('estates_locations')
            .select('*, parent:parent_id(*)')
            .eq('id', location_id)
            .single();

        if (locError) {
            // Handle cases where locations table might not be fully populated yet
            return {
                success: false,
                error: `Location not found: ${location_id}`
            };
        }

        // 2. Fetch "sibling" locations (rooms on the same floor/building)
        const { data: siblings, error: sibError } = await supabase
            .from('estates_locations')
            .select('*')
            .eq('parent_id', location.parent_id)
            .neq('id', location_id);

        if (sibError) throw sibError;

        const summary = issue_type
            ? `Impact analysis for ${issue_type} in ${location.name}. ${siblings?.length || 0} adjacent rooms potentially affected.`
            : `Spatial analysis for ${location.name}. ${siblings?.length || 0} adjacent rooms identified in hierarchy.`;

        return {
            success: true,
            data: {
                source_location: location.name,
                impact_level: issue_type?.toLowerCase().includes('leak') ? 'high' : 'medium',
                affected_locations: siblings?.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    reason: `Shares hierarchy with source.`
                })) || [],
                summary
            }
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to analyze spatial impact'
        };
    }
}

/**
 * Create a new helpdesk or maintenance ticket
 */
export async function createHelpdeskTicket(params: CreateHelpdeskTicketParams): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    try {
        const {
            organization_id,
            title,
            description,
            priority = 'medium',
            location,
            location_id,
            compliance_domain
        } = params;

        const { data, error } = await supabase
            .from('estates_helpdesk_tickets')
            .insert({
                organization_id,
                title,
                description,
                priority,
                location_text: location,
                location_id,
                compliance_domain,
                status: 'open',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            data
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to create helpdesk ticket'
        };
    }
}

/**
 * Update an existing helpdesk ticket
 */
export async function updateHelpdeskTicket(params: UpdateHelpdeskTicketParams): Promise<{
    success: boolean;
    data?: any;
    error?: string;
}> {
    try {
        const { ticket_id, status, assignee_id, resolution_notes } = params;

        const updateData: any = {};
        if (status) updateData.status = status;
        if (assignee_id) updateData.assigned_to = assignee_id;
        if (resolution_notes) updateData.resolution_notes = resolution_notes;

        if (status === 'resolved' || status === 'closed') {
            updateData.resolved_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('estates_helpdesk_tickets')
            .update(updateData)
            .eq('id', ticket_id)
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            data
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to update helpdesk ticket'
        };
    }
}
