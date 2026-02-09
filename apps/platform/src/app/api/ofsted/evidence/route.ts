import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
    OfstedEvidenceMatch,
    OfstedCategoryId,
    OfstedSubCategoryId,
    GetOfstedEvidenceRequest,
    GetOfstedEvidenceResponse,
    MatchOfstedDocumentRequest,
    MatchOfstedDocumentResponse,
} from '@/lib/ofsted';
import { v4 as uuidv4 } from 'uuid';
import { OFSTED_SUBCATEGORIES } from '@/lib/ofsted';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/ofsted/evidence
 * Get Ofsted evidence matches for an organization
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');
        const categoryId = searchParams.get('categoryId') as OfstedCategoryId | null;
        const subcategoryId = searchParams.get('subcategoryId') as OfstedSubCategoryId | null;
        const documentId = searchParams.get('documentId');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId parameter' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let query = supabase
            .from('ofsted_evidence_matches')
            .select('*')
            .eq('organization_id', organizationId);

        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }
        if (subcategoryId) {
            query = query.eq('subcategory_id', subcategoryId);
        }
        if (documentId) {
            query = query.eq('document_id', documentId);
        }

        const { data: evidence, error } = await query;

        if (error) {
            console.error('Error fetching Ofsted evidence:', error);
            return NextResponse.json(
                { error: 'Failed to fetch evidence' },
                { status: 500 }
            );
        }

        // Group by category and confidence
        const byCategory: Record<OfstedCategoryId, number> = {
            'quality-of-education': 0,
            'behaviour-attitudes': 0,
            'personal-development': 0,
            'leadership-management': 0,
        };

        const byConfidence = { HIGH: 0, MEDIUM: 0, LOW: 0 };

        for (const match of evidence || []) {
            if (match.category_id in byCategory) {
                byCategory[match.category_id as OfstedCategoryId]++;
            }
            if (match.confidence in byConfidence) {
                byConfidence[match.confidence as keyof typeof byConfidence]++;
            }
        }

        const response: GetOfstedEvidenceResponse = {
            evidence: evidence || [],
            total: evidence?.length || 0,
            by_category: byCategory,
            by_confidence: byConfidence,
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Ofsted evidence API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/ofsted/evidence
 * Match a document to Ofsted criteria (AI-powered)
 */
export async function POST(req: NextRequest) {
    try {
        const body: MatchOfstedDocumentRequest = await req.json();
        const { organization_id, document_id, document_text, document_metadata } = body;

        if (!organization_id || !document_id || !document_text) {
            return NextResponse.json(
                { error: 'Missing required fields: organization_id, document_id, document_text' },
                { status: 400 }
            );
        }

        // For now, return empty matches
        // TODO: Integrate with AI evidence matcher
        const response: MatchOfstedDocumentResponse = {
            matches: [],
            total_matches: 0,
            categories_matched: [],
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Ofsted match API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
