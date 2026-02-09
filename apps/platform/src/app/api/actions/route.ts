import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/actions - List actions for an organization
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');
        const frameworkType = searchParams.get('frameworkType');
        const userStatus = searchParams.get('userStatus');
        const aiStatus = searchParams.get('aiStatus');

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
        }

        let query = supabase
            .from('actions')
            .select('*')
            .eq('organization_id', organizationId);

        if (frameworkType) {
            query = query.eq('framework_type', frameworkType);
        }

        if (userStatus) {
            query = query.eq('user_status', userStatus);
        }

        if (aiStatus) {
            query = query.eq('ai_status', aiStatus);
        }

        const { data: actions, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching actions:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(actions || []);
    } catch (error) {
        console.error('Error in GET /api/actions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/actions - Create a new action
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const body = await request.json();

        const {
            organization_id,
            title,
            description,
            success_criteria,
            framework_type,
            category_id,
            subcategory_id,
            user_status,
            ai_status,
            ai_rationale,
            owner_id,
            owner_name,
            assigned_date,
            due_date,
            completed_date,
            implementation_date,
            priority,
            estimated_cost,
            actual_cost,
            funding_source,
            financial_year,
            eef_strategy,
            eef_impact_months,
            notes,
            source,
            created_by,
        } = body;

        if (!organization_id || !title) {
            return NextResponse.json(
                { error: 'organization_id and title are required' },
                { status: 400 }
            );
        }

        const { data: action, error } = await supabase
            .from('actions')
            .insert({
                organization_id,
                title,
                description: description || null,
                success_criteria: success_criteria || null,
                framework_type: framework_type || 'ofsted',
                category_id: category_id || null,
                subcategory_id: subcategory_id || null,
                user_status: user_status || 'draft',
                ai_status: ai_status || 'not_assessed',
                ai_rationale: ai_rationale || null,
                owner_id: owner_id || null,
                owner_name: owner_name || null,
                assigned_date: assigned_date || null,
                due_date: due_date || null,
                completed_date: completed_date || null,
                implementation_date: implementation_date || null,
                priority: priority || 'medium',
                estimated_cost: estimated_cost || 0,
                actual_cost: actual_cost || 0,
                funding_source: funding_source || null,
                financial_year: financial_year || null,
                eef_strategy: eef_strategy || null,
                eef_impact_months: eef_impact_months || null,
                notes: notes || [],
                source: source || 'manual',
                created_by: created_by || null,
                evidence_count: 0,
                chase_count: 0,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating action:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Record status history
        await supabase.from('action_status_history').insert({
            action_id: action.id,
            organization_id,
            to_status: user_status || 'draft',
            status_type: 'user',
            changed_by: created_by || null,
            changed_by_type: 'user',
        });

        return NextResponse.json(action, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/actions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/actions - Update an action
export async function PUT(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const body = await request.json();

        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Action ID is required' }, { status: 400 });
        }

        // Get current action for status history tracking
        const { data: currentAction } = await supabase
            .from('actions')
            .select('*')
            .eq('id', id)
            .single();

        if (!currentAction) {
            return NextResponse.json({ error: 'Action not found' }, { status: 404 });
        }

        // Update action
        const { data: action, error } = await supabase
            .from('actions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating action:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Record status change if user_status changed
        if (updates.user_status && updates.user_status !== currentAction.user_status) {
            await supabase.from('action_status_history').insert({
                action_id: id,
                organization_id: currentAction.organization_id,
                from_status: currentAction.user_status,
                to_status: updates.user_status,
                status_type: 'user',
                changed_by: updates.updated_by || null,
                changed_by_type: 'user',
            });
        }

        // Record AI status change if ai_status changed
        if (updates.ai_status && updates.ai_status !== currentAction.ai_status) {
            await supabase.from('action_status_history').insert({
                action_id: id,
                organization_id: currentAction.organization_id,
                from_status: currentAction.ai_status,
                to_status: updates.ai_status,
                status_type: 'ai',
                changed_by: updates.updated_by || null,
                changed_by_type: 'user',
                ai_rationale: updates.ai_rationale || null,
            });
        }

        return NextResponse.json(action);
    } catch (error) {
        console.error('Error in PUT /api/actions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/actions - Delete an action
export async function DELETE(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Action ID is required' }, { status: 400 });
        }

        const { error } = await supabase.from('actions').delete().eq('id', id);

        if (error) {
            console.error('Error deleting action:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/actions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
