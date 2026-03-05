/**
 * Routines API Route
 * 
 * Handles management of dynamic routine templates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/estates-compliance/routines
 * 
 * Query params:
 * - organization_id: required
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const organizationId = searchParams.get('organization_id');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'organization_id is required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Fetch routines with their items
        const { data: routines, error } = await supabase
            .from('estates_routines')
            .select('*, items:estates_routine_items(*)')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching routines:', error);
            return NextResponse.json(
                { error: 'Failed to fetch routines' },
                { status: 500 }
            );
        }

        return NextResponse.json({ routines });
    } catch (error) {
        console.error('Error in routines GET:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/estates-compliance/routines
 * 
 * Body:
 * - organization_id: required
 * - name: required
 * - description: optional
 * - type: 'opening' | 'closing' | 'custom'
 * - recurrence: 'daily' | 'weekly' | 'monthly' | 'once'
 * - recurrence_days: string[] (e.g. ['Monday', 'Friday'])
 * - start_time: string (HH:MM)
 * - deadline_time: string (HH:MM)
 * - items: array of { name, description, category, icon, item_order, requires_photo, requires_notes }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            organization_id,
            name,
            description,
            type,
            recurrence,
            recurrence_days,
            start_time,
            deadline_time,
            items
        } = body;

        if (!organization_id || !name) {
            return NextResponse.json(
                { error: 'organization_id and name are required' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Insert the routine
        const { data: routine, error: routineError } = await supabase
            .from('estates_routines')
            .insert({
                organization_id,
                name,
                description,
                type: type || 'custom',
                recurrence: recurrence || 'daily',
                recurrence_days,
                start_time,
                deadline_time,
            })
            .select()
            .single();

        if (routineError) {
            console.error('Error creating routine:', routineError);
            return NextResponse.json(
                { error: 'Failed to create routine' },
                { status: 500 }
            );
        }

        // Insert items if provided
        if (items && Array.isArray(items) && items.length > 0) {
            const routineItems = items.map((item: any, index: number) => ({
                routine_id: routine.id,
                name: item.name,
                description: item.description,
                category: item.category || 'facilities',
                icon: item.icon,
                item_order: item.item_order ?? index,
                requires_photo: item.requires_photo || false,
                requires_notes: item.requires_notes || false,
            }));

            const { error: itemsError } = await supabase
                .from('estates_routine_items')
                .insert(routineItems);

            if (itemsError) {
                console.error('Error creating routine items:', itemsError);
                // Note: Routine still exists without items. 
                // In a production app we might use a DB transaction or RPC to ensure atomicity.
            }
        }

        // Return the routine with items (refetched for completeness)
        const { data: completeRoutine } = await supabase
            .from('estates_routines')
            .select('*, items:estates_routine_items(*)')
            .eq('id', routine.id)
            .single();

        return NextResponse.json({ routine: completeRoutine || routine });
    } catch (error) {
        console.error('Error in routines POST:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
