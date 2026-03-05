import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SiamsAssessment, SiamsQuestionId } from '@/lib/siams';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface RouteContext {
    params: { questionId: SiamsQuestionId };
}

/**
 * GET /api/siams/assessments/[questionId]
 * Get a specific SIAMS assessment by question ID
 */
export async function GET(
    req: NextRequest,
    context: RouteContext
) {
    try {
        const { questionId } = context.params;
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId parameter' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: assessment, error } = await supabase
            .from('siams_assessments')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('question_id', questionId)
            .single();

        if (error || !assessment) {
            return NextResponse.json(
                { error: 'Assessment not found' },
                { status: 404 }
            );
        }

        // Get evidence matches for this question
        const { data: evidenceMatches } = await supabase
            .from('siams_evidence_matches')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('question_id', questionId)
            .order('created_at', { ascending: false });

        return NextResponse.json({
            assessment,
            evidence: evidenceMatches || [],
            evidence_count: evidenceMatches?.length || 0,
        });

    } catch (error: any) {
        console.error('SIAMS Assessment detail API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/siams/assessments/[questionId]
 * Update a specific SIAMS assessment
 */
export async function PATCH(
    req: NextRequest,
    context: RouteContext
) {
    try {
        const { questionId } = context.params;
        const body = await req.json();
        const {
            organizationId,
            school_rating,
            school_rationale,
        } = body as {
            organizationId: string;
            school_rating?: string;
            school_rationale?: string;
            userId?: string;
        };

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: assessment, error } = await supabase
            .from('siams_assessments')
            .update({
                school_rating: school_rating || null,
                school_rationale: school_rationale || null,
                updated_at: new Date().toISOString(),
            })
            .eq('organization_id', organizationId)
            .eq('question_id', questionId)
            .select()
            .single();

        if (error || !assessment) {
            return NextResponse.json(
                { error: 'Assessment not found or update failed' },
                { status: 404 }
            );
        }

        return NextResponse.json({ assessment });

    } catch (error: any) {
        console.error('SIAMS Assessment update error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/siams/assessments/[questionId]
 * Reset a specific SIAMS assessment (remove ratings but keep evidence)
 */
export async function DELETE(
    req: NextRequest,
    context: RouteContext
) {
    try {
        const { questionId } = context.params;
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId parameter' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { error } = await supabase
            .from('siams_assessments')
            .update({
                school_rating: null,
                school_rationale: null,
                updated_at: new Date().toISOString(),
            })
            .eq('organization_id', organizationId)
            .eq('question_id', questionId);

        if (error) {
            console.error('Error resetting SIAMS assessment:', error);
            return NextResponse.json(
                { error: 'Failed to reset assessment' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('SIAMS Assessment reset error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
