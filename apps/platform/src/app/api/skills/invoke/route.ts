import { NextRequest, NextResponse } from 'next/server';
import {
    createStaffMember,
    updateStaffMember,
    listStaff,
    deactivateStaffMember,
    createAction,
    updateAction,
    listActions,
    getActionStats,
    suggestEEFStrategy,
    extractEstatesDocument,
    analyzeSpatialImpact,
    createHelpdeskTicket,
    updateHelpdeskTicket,
} from '@/lib/skills';
import { SkillRunner } from '@schoolgle/ed-agents';
import { CommunicationRouter } from '@schoolgle/ed-agents/src/communication/communication-router';
import { createCreditManager } from '@schoolgle/ed-agents/src/credit/manager';

/**
 * POST /api/skills/invoke
 *
 * Unified endpoint for AI assistant to invoke skills.
 *
 * Request body:
 * {
 *   "function": "function_name",
 *   "parameters": { ... }
 * }
 *
 * Response:
 * {
 *   "success": true/false,
 *   "data": { ... },
 *   "error": "..." (if failed)
 * }
 */
import { getSkillTier, queueForApproval, getUserRole, canRoleExecuteSkill } from '@/lib/skills/approvals';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { function: functionName, parameters } = body;

        if (!functionName) {
            return NextResponse.json(
                { success: false, error: 'Function name is required' },
                { status: 400 }
            );
        }

        const orgId = parameters.organization_id || parameters.orgId;
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();

        if (orgId && user) {
            const userRole = await getUserRole(orgId, user.id);
            const tier = await getSkillTier(orgId, functionName);
            const isAuthorized = userRole ? canRoleExecuteSkill(userRole, functionName) : false;

            // CRITIQUE REFINEMENT: If user is not authorized for a high-stakes skill,
            // always force to REVIEW queue regardless of organization tier.
            if (!isAuthorized && (functionName.includes('safety') || functionName.includes('emergency'))) {
                await queueForApproval(orgId, functionName, parameters, user.id);
                return NextResponse.json({
                    success: true,
                    status: 'queued',
                    message: 'Your role does not have permission to trigger this action directly. It has been queued for SLT approval.'
                });
            }

            if (tier === 'BLOCKED') {
                return NextResponse.json({
                    success: false,
                    error: `The skill '${functionName}' is currently blocked for your school.`,
                    blocked: true
                });
            }

            if (tier === 'REVIEW') {
                await queueForApproval(orgId, functionName, parameters, user.id);
                return NextResponse.json({
                    success: true,
                    status: 'queued',
                    message: 'This action requires human approval and has been sent to the Approval Hub.'
                });
            }

            if (tier === 'SHADOW') {
                // Async queue for shadow logging, but proceed with execution
                queueForApproval(orgId, functionName, parameters, user.id).catch(console.error);
            }
        }

        let result;

        // =====================================================
        // STAFF DIRECTORY FUNCTIONS
        // =====================================================

        switch (functionName) {
            // Staff Directory
            case 'create_staff_member':
                result = await createStaffMember(parameters);
                break;

            case 'update_staff_member':
                result = await updateStaffMember(parameters);
                break;

            case 'list_staff':
                result = await listStaff(parameters);
                break;

            case 'deactivate_staff_member':
                result = await deactivateStaffMember(parameters.staff_id);
                break;

            case 'export_staff_csv':
                // This would need to be implemented as a separate endpoint
                // that returns a file download
                result = {
                    success: false,
                    error: 'Use GET /api/staff/import?type=export for CSV export'
                };
                break;

            case 'import_staff_csv':
                // This would need to be implemented with the import route
                result = {
                    success: false,
                    error: 'Use POST /api/staff/import for CSV import'
                };
                break;

            // Actions Hub
            case 'create_action':
                result = await createAction(parameters);
                break;

            case 'update_action':
                result = await updateAction(parameters);
                break;

            case 'list_actions':
                result = await listActions(parameters);
                break;

            case 'get_action_stats':
                result = await getActionStats(parameters.organization_id);
                break;

            case 'suggest_eef_strategy':
                result = {
                    success: true,
                    data: suggestEEFStrategy(
                        parameters.action_description,
                        parameters.focus_area
                    )
                };
                break;

            case 'add_action_note':
                // This would need to be implemented
                result = {
                    success: false,
                    error: 'add_action_note not yet implemented via API'
                };
                break;

            // Compliance & Estates
            case 'search_knowledge':
                const { searchKnowledge } = await import('@/lib/skills');
                result = await searchKnowledge(parameters);
                break;

            case 'list_compliance_tasks':
                const { listComplianceTasks } = await import('@/lib/skills');
                result = await listComplianceTasks(parameters);
                break;

            case 'search_contractors':
                const { searchContractors } = await import('@/lib/skills');
                result = await searchContractors(parameters);
                break;

            case 'validate_contractor_recommendation':
                const { validateContractorRecommendation } = await import('@/lib/skills');
                result = await validateContractorRecommendation(parameters);
                break;

            case 'extract_estates_document':
                result = await extractEstatesDocument(parameters);
                break;

            case 'analyze_spatial_impact':
                result = await analyzeSpatialImpact(parameters);
                break;

            case 'create_helpdesk_ticket':
                result = await createHelpdeskTicket(parameters);
                break;

            case 'update_helpdesk_ticket':
                result = await updateHelpdeskTicket(parameters);
                break;

            default:
                result = {
                    success: false,
                    error: `Unknown function: ${functionName}`
                };
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Error in POST /api/skills/invoke:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Internal server error'
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/skills/invoke
 *
 * Returns available functions and their schemas for discovery.
 */
export async function GET() {
    const { STAFF_FUNCTION_SCHEMAS, ACTIONS_FUNCTION_SCHEMAS } = await import('@/lib/skills');

    return NextResponse.json({
        success: true,
        data: {
            functions: [...STAFF_FUNCTION_SCHEMAS, ...ACTIONS_FUNCTION_SCHEMAS],
            categories: {
                staff: {
                    name: 'Staff Directory',
                    description: 'Manage school staff directory',
                    functions: STAFF_FUNCTION_SCHEMAS.map(f => f.name)
                },
                actions: {
                    name: 'Actions Hub',
                    description: 'AI-augmented school improvement',
                    functions: ACTIONS_FUNCTION_SCHEMAS.map(f => f.name)
                }
            }
        }
    });
}
