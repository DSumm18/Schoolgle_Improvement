import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
    GovernorTraining,
    GovernorTrainingForm,
    TrainingType,
} from '@/lib/governance';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/governance/training
 * Get training records for governors
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');
        const governorId = searchParams.get('governorId');
        const trainingType = searchParams.get('trainingType') as TrainingType | null;
        const includeExpired = searchParams.get('includeExpired') === 'true';

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId parameter' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let query = supabase
            .from('governor_training')
            .select(`
                *,
                governor:governors (
                    id,
                    full_name,
                    email,
                    photo_url
                )
            `)
            .eq('organization_id', organizationId)
            .order('completed_date', { ascending: false });

        if (governorId) {
            query = query.eq('governor_id', governorId);
        }
        if (trainingType) {
            query = query.eq('training_type', trainingType);
        }

        const { data: training, error } = await query;

        if (error) {
            console.error('Error fetching training:', error);
            return NextResponse.json(
                { error: 'Failed to fetch training records' },
                { status: 500 }
            );
        }

        const today = new Date();
        const expired = training?.filter((t: GovernorTraining) =>
            t.expiry_date && new Date(t.expiry_date) < today
        ) || [];

        return NextResponse.json({
            training: training || [],
            total: training?.length || 0,
            expired: expired.length,
            completion_rate: 0, // Will be calculated based on required training
        });

    } catch (error: any) {
        console.error('Training API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/governance/training
 * Create a new training record
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            organizationId,
            governorId,
            title,
            provider,
            training_type,
            completed_date,
            expiry_date,
            duration_hours,
            certificate_url,
            notes,
        } = body as {
            organizationId: string;
            governorId: string;
            title: string;
            provider?: string;
            training_type: TrainingType;
            completed_date?: string;
            expiry_date?: string;
            duration_hours?: number;
            certificate_url?: string;
            notes?: string;
        };

        if (!organizationId || !governorId || !title || !training_type) {
            return NextResponse.json(
                { error: 'Missing required fields: organizationId, governorId, title, training_type' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: training, error } = await supabase
            .from('governor_training')
            .insert({
                id: uuidv4(),
                organization_id: organizationId,
                governor_id: governorId,
                title,
                provider: provider || null,
                training_type,
                completed_date: completed_date || null,
                expiry_date: expiry_date || null,
                duration_hours: duration_hours || null,
                certificate_url: certificate_url || null,
                notes: notes || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating training record:', error);
            return NextResponse.json(
                { error: 'Failed to create training record' },
                { status: 500 }
            );
        }

        return NextResponse.json({ training }, { status: 201 });

    } catch (error: any) {
        console.error('Training creation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/governance/training
 * Bulk update training records
 */
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { organizationId, updates } = body as {
            organizationId: string;
            updates: Array<{
                id: string;
                changes: Partial<GovernorTrainingForm>;
            }>;
        };

        if (!organizationId || !updates || !Array.isArray(updates)) {
            return NextResponse.json(
                { error: 'Missing required fields: organizationId, updates (array)' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const results = await Promise.all(
            updates.map(async ({ id, changes }) => {
                const { data, error } = await supabase
                    .from('governor_training')
                    .update({
                        ...changes,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id)
                    .eq('organization_id', organizationId)
                    .select()
                    .single();

                return { training: data, error };
            })
        );

        const successCount = results.filter(r => !r.error).length;
        const errors = results.filter(r => r.error).map(r => r.error);

        return NextResponse.json({
            updated: successCount,
            failed: results.length - successCount,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error: any) {
        console.error('Bulk training update error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/governance/training
 * Delete training records
 */
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');
        const ids = searchParams.get('ids')?.split(',');

        if (!organizationId || !ids || ids.length === 0) {
            return NextResponse.json(
                { error: 'Missing required parameters: organizationId, ids' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { error } = await supabase
            .from('governor_training')
            .delete()
            .in('id', ids)
            .eq('organization_id', organizationId);

        if (error) {
            console.error('Error deleting training records:', error);
            return NextResponse.json(
                { error: 'Failed to delete training records' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, deleted: ids.length });

    } catch (error: any) {
        console.error('Training deletion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
