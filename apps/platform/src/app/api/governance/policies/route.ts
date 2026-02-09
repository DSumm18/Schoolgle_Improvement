import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
    GovernancePolicyReview,
    GovernancePolicyReviewForm,
    PolicyCategory,
    PolicyReviewStatus,
} from '@/lib/governance';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/governance/policies
 * Get policy review records for an organization
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');
        const reviewStatus = searchParams.get('reviewStatus') as PolicyReviewStatus | null;
        const policyCategory = searchParams.get('policyCategory') as PolicyCategory | null;
        const includeOverdue = searchParams.get('includeOverdue') === 'true';

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId parameter' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let query = supabase
            .from('governance_policy_reviews')
            .select(`
                *,
                policy_owner:governors (
                    id,
                    full_name,
                    email
                )
            `)
            .eq('organization_id', organizationId)
            .order('next_review_date', { ascending: true });

        if (reviewStatus) {
            query = query.eq('review_status', reviewStatus);
        }
        if (policyCategory) {
            query = query.eq('policy_category', policyCategory);
        }

        const { data: policies, error } = await query;

        if (error) {
            console.error('Error fetching policy reviews:', error);
            return NextResponse.json(
                { error: 'Failed to fetch policy reviews' },
                { status: 500 }
            );
        }

        const today = new Date();
        const enrichedPolicies = policies?.map((policy: any) => {
            const nextReview = new Date(policy.next_review_date);
            const daysUntil = Math.ceil((nextReview.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const daysOverdue = Math.floor((today.getTime() - nextReview.getTime()) / (1000 * 60 * 60 * 24));

            return {
                ...policy,
                policy_owner_name: policy.policy_owner?.full_name || null,
                days_until_review: daysUntil,
                days_overdue: daysOverdue > 0 ? daysOverdue : 0,
                is_overdue: nextReview < today,
            };
        }) || [];

        // Filter by overdue if requested
        const filteredPolicies = includeOverdue
            ? enrichedPolicies.filter((p: any) => p.is_overdue)
            : enrichedPolicies;

        const current = filteredPolicies.filter((p: any) => p.review_status === 'current').length;
        const needReview = filteredPolicies.filter((p: any) => p.review_status === 'under_review' || p.is_overdue).length;
        const overdue = filteredPolicies.filter((p: any) => p.is_overdue).length;

        return NextResponse.json({
            policies: filteredPolicies,
            total: filteredPolicies.length,
            current,
            need_review,
            overdue,
        });

    } catch (error: any) {
        console.error('Policy reviews API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/governance/policies
 * Create a new policy review record
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            organizationId,
            policy_name,
            policy_category,
            document_id,
            last_review_date,
            next_review_date,
            review_frequency_months,
            policy_owner_id,
            review_committee,
            is_statutory,
            statutory_reference,
        } = body as {
            organizationId: string;
            policy_name: string;
            policy_category: PolicyCategory;
            document_id?: string;
            last_review_date?: string;
            next_review_date: string;
            review_frequency_months?: number;
            policy_owner_id?: string;
            review_committee?: string;
            is_statutory?: boolean;
            statutory_reference?: string;
        };

        if (!organizationId || !policy_name || !policy_category || !next_review_date) {
            return NextResponse.json(
                { error: 'Missing required fields: organizationId, policy_name, policy_category, next_review_date' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: policy, error } = await supabase
            .from('governance_policy_reviews')
            .insert({
                id: uuidv4(),
                organization_id: organizationId,
                policy_name,
                policy_category,
                document_id: document_id || null,
                last_review_date: last_review_date || null,
                next_review_date,
                review_frequency_months: review_frequency_months || 36,
                policy_owner_id: policy_owner_id || null,
                review_committee: review_committee || null,
                review_status: 'current',
                is_statutory: is_statutory || false,
                statutory_reference: statutory_reference || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating policy review:', error);
            return NextResponse.json(
                { error: 'Failed to create policy review' },
                { status: 500 }
            );
        }

        return NextResponse.json({ policy }, { status: 201 });

    } catch (error: any) {
        console.error('Policy review creation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/governance/policies
 * Bulk update policy reviews
 */
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { organizationId, updates } = body as {
            organizationId: string;
            updates: Array<{
                id: string;
                changes: Partial<GovernancePolicyReviewForm>;
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
                // Auto-update review status if next_review_date is being changed
                let updateData: any = { ...changes };
                if (changes.next_review_date) {
                    const today = new Date();
                    const nextReview = new Date(changes.next_review_date);
                    updateData.review_status = nextReview < today ? 'outdated' : 'current';
                }

                const { data, error } = await supabase
                    .from('governance_policy_reviews')
                    .update({
                        ...updateData,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id)
                    .eq('organization_id', organizationId)
                    .select()
                    .single();

                return { policy: data, error };
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
        console.error('Bulk policy update error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/governance/policies
 * Delete policy review records
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
            .from('governance_policy_reviews')
            .delete()
            .in('id', ids)
            .eq('organization_id', organizationId);

        if (error) {
            console.error('Error deleting policy reviews:', error);
            return NextResponse.json(
                { error: 'Failed to delete policy reviews' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, deleted: ids.length });

    } catch (error: any) {
        console.error('Policy deletion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
