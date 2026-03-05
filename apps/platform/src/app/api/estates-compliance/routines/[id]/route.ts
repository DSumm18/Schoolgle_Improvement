/**
 * Individual Routine API Route
 * 
 * Handles update and deletion of specific routines.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/estates-compliance/routines/[id]
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await request.json();
        const {
            name,
            description,
            type,
            recurrence,
            recurrence_days,
            start_time,
            deadline_time,
            items,
            is_active
        } = body;

        const supabase = await createClient();

        // Update routine
        const { data: routine, error: routineError } = await supabase
            .from('estates_routines')
            .update({
                name,
                description,
                type,
                recurrence,
                recurrence_days,
                start_time,
                deadline_time,
                is_active,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (routineError) {
            console.error('Error updating routine:', routineError);
            return NextResponse.json(
                { error: 'Failed to update routine' },
                { status: 500 }
            );
        }

        // If items are provided, replace them (simple sync strategy)
        if (items && Array.isArray(items)) {
            // Delete old items
            await supabase
                .from('estates_routine_items')
                .delete()
                .eq('routine_id', id);

            // Insert new items
            if (items.length > 0) {
                const routineItems = items.map((item: any, index: number) => ({
                    routine_id: id,
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
                    console.error('Error updating routine items:', itemsError);
                }
            }
        }

        // Return the updated routine with items
        const { data: completeRoutine } = await supabase
            .from('estates_routines')
            .select('*, items:estates_routine_items(*)')
            .eq('id', id)
            .single();

        return NextResponse.json({ routine: completeRoutine || routine });
    } catch (error) {
        console.error('Error in routine PATCH:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/estates-compliance/routines/[id]
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const supabase = await createClient();

        const { error } = await supabase
            .from('estates_routines')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting routine:', error);
            return NextResponse.json(
                { error: 'Failed to delete routine' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in routine DELETE:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
