import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
    SiamsAssessment,
    SiamsAssessmentForm,
    SiamsRating,
    SiamsStrandId,
    SiamsQuestionId,
    GetSiamsAssessmentsRequest,
    GetSiamsAssessmentsResponse,
    UpsertSiamsAssessmentsRequest,
    UpsertSiamsAssessmentsResponse,
} from '@/lib/siams';
import { v4 as uuidv4 } from 'uuid';
import { SIAMS_STRANDS, SIAMS_QUESTIONS } from '@/lib/siams';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/siams/assessments
 * Get SIAMS assessments for an organization
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');
        const strandId = searchParams.get('strandId') as SiamsStrandId | null;
        const questionId = searchParams.get('questionId') as SiamsQuestionId | null;

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId parameter' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let query = supabase
            .from('siams_assessments')
            .select('*')
            .eq('organization_id', organizationId);

        if (strandId) {
            query = query.eq('strand_id', strandId);
        }
        if (questionId) {
            query = query.eq('question_id', questionId);
        }

        const { data: assessments, error } = await query;

        if (error) {
            console.error('Error fetching SIAMS assessments:', error);
            return NextResponse.json(
                { error: 'Failed to fetch assessments' },
                { status: 500 }
            );
        }

        // Enrich with question and strand info
        const enrichedAssessments = (assessments || []).map((assessment) => {
            const strandInfo = SIAMS_STRANDS[assessment.strand_id as SiamsStrandId];
            const questionInfo = SIAMS_QUESTIONS[assessment.question_id as SiamsQuestionId];

            return {
                ...assessment,
                question_text: questionInfo?.text || '',
                strand_name: strandInfo?.name || '',
                strand_short_name: strandInfo?.shortName || '',
                strand_color: strandInfo?.color || '',
                strand_order: strandInfo?.order || 0,
                readiness_score: calculateReadinessScore(assessment),
            };
        });

        // Group by strand for summary
        const strandsMap = new Map<SiamsStrandId, {
            strand_id: SiamsStrandId;
            strand_name: string;
            strand_short_name: string;
            strand_color: string;
            total_questions: number;
            questions_with_evidence: number;
            total_evidence: number;
            average_score: number;
            average_rating: SiamsRating | 'not_assessed';
            last_updated: string;
        }>();

        // Initialize strands
        Object.values(SIAMS_STRANDS).forEach((strand) => {
            strandsMap.set(strand.id as SiamsStrandId, {
                strand_id: strand.id as SiamsStrandId,
                strand_name: strand.name,
                strand_short_name: strand.shortName,
                strand_color: strand.color,
                total_questions: 0,
                questions_with_evidence: 0,
                total_evidence: 0,
                average_score: 0,
                average_rating: 'not_assessed',
                last_updated: '',
            });
        });

        // Populate from assessments
        enrichedAssessments.forEach((assessment: any) => {
            const strand = strandsMap.get(assessment.strand_id as SiamsStrandId);
            if (strand) {
                strand.total_questions += 1;
                if (assessment.evidence_count > 0) {
                    strand.questions_with_evidence += 1;
                }
                strand.total_evidence += assessment.evidence_count || 0;

                const score = calculateReadinessScore(assessment);
                strand.average_score += score;

                if (assessment.school_rating && assessment.school_rating !== 'not_assessed') {
                    strand.average_rating = assessment.school_rating;
                }

                if (!strand.last_updated || new Date(assessment.updated_at) > new Date(strand.last_updated)) {
                    strand.last_updated = assessment.updated_at;
                }
            }
        });

        // Calculate averages
        strandsMap.forEach((strand) => {
            if (strand.total_questions > 0) {
                strand.average_score = Math.round(strand.average_score / strand.total_questions);
            }
        });

        const strands = Array.from(strandsMap.values());
        const totalEvidence = enrichedAssessments.reduce((sum, a) => sum + (a.evidence_count || 0), 0);

        const response: GetSiamsAssessmentsResponse = {
            assessments: enrichedAssessments,
            strands,
            total_evidence: totalEvidence,
            last_updated: enrichedAssessments.length > 0
                ? enrichedAssessments.reduce((latest, a) =>
                    a.updated_at > latest ? a.updated_at : latest, '')
                : '',
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('SIAMS Assessments API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/siams/assessments
 * Create or update SIAMS assessments (bulk upsert)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            organizationId,
            userId,
            assessments,
        } = body as UpsertSiamsAssessmentsRequest;

        if (!organizationId || !assessments || !Array.isArray(assessments)) {
            return NextResponse.json(
                { error: 'Missing required fields: organizationId, assessments (array)' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Prepare records for upsert
        const records = assessments.map((assessment) => ({
            organization_id: organizationId,
            strand_id: assessment.strand_id,
            question_id: assessment.question_id,
            school_rating: assessment.school_rating,
            school_rationale: assessment.school_rationale,
            assessed_by: userId,
            assessed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }));

        // Perform upsert
        const { data, error } = await supabase
            .from('siams_assessments')
            .upsert(records, {
                onConflict: 'organization_id,question_id',
                ignoreDuplicates: false,
            })
            .select();

        if (error) {
            console.error('Error upserting SIAMS assessments:', error);
            return NextResponse.json(
                { error: 'Failed to save assessments' },
                { status: 500 }
            );
        }

        // Count created vs updated
        const updated = records.length;
        const created = 0; // Supabase upsert doesn't distinguish easily

        const response: UpsertSiamsAssessmentsResponse = {
            success: true,
            updated,
            created,
            assessments: data || [],
        };

        return NextResponse.json(response);

    } catch (error: any) {
        console.error('SIAMS Assessments upsert error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/siams/assessments
 * Bulk update SIAMS assessments
 */
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            organizationId,
            updates,
        } = body as {
            organizationId: string;
            updates: Array<{
                id?: string;
                question_id: SiamsQuestionId;
                changes: Partial<SiamsAssessmentForm>;
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
            updates.map(async ({ id, question_id, changes }) => {
                let query = supabase
                    .from('siams_assessments')
                    .update({
                        ...changes,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('organization_id', organizationId);

                if (id) {
                    query = query.eq('id', id);
                } else if (question_id) {
                    query = query.eq('question_id', question_id);
                } else {
                    return { assessment: null, error: 'Missing id or question_id' };
                }

                const { data, error } = await query.select().maybeSingle();

                return { assessment: data, error };
            })
        );

        const successCount = results.filter(r => !r.error && r.assessment).length;
        const errors = results.filter(r => r.error).map(r => r.error);

        return NextResponse.json({
            updated: successCount,
            failed: results.length - successCount,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error: any) {
        console.error('SIAMS Assessments update error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/siams/assessments
 * Delete SIAMS assessments by question_id
 */
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');
        const questionIds = searchParams.get('questionIds')?.split(',');

        if (!organizationId || !questionIds || questionIds.length === 0) {
            return NextResponse.json(
                { error: 'Missing required parameters: organizationId, questionIds' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { error } = await supabase
            .from('siams_assessments')
            .delete()
            .eq('organization_id', organizationId)
            .in('question_id', questionIds);

        if (error) {
            console.error('Error deleting SIAMS assessments:', error);
            return NextResponse.json(
                { error: 'Failed to delete assessments' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, deleted: questionIds.length });

    } catch (error: any) {
        console.error('SIAMS Assessments deletion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Helper function to calculate readiness score from assessment
 */
function calculateReadinessScore(assessment: SiamsAssessment): number {
    if (assessment.school_rating) {
        switch (assessment.school_rating) {
            case 'excellent': return 100;
            case 'good': return 75;
            case 'requires_improvement': return 50;
            case 'ineffective': return 25;
            default: return 0;
        }
    }

    if (assessment.evidence_count > 0) {
        return Math.min(assessment.evidence_count * 20, 100);
    }

    return 0;
}
