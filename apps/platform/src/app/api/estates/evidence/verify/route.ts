/**
 * AI Document Verification API
 *
 * POST /api/estates/evidence/verify
 *
 * Verifies uploaded compliance documents using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyComplianceDocument, type VerificationInput } from '@/lib/estates-compliance/ai-document-verifier';
import { getEvidenceById, updateEvidence } from '@/lib/estates-compliance/database/evidence';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for AI processing

/**
 * POST /api/estates/evidence/verify
 *
 * Request body:
 * {
 *   evidence_id: string;
 *   organization_id: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { evidence_id, organization_id } = body;

    if (!evidence_id) {
      return NextResponse.json(
        { error: 'evidence_id is required' },
        { status: 400 }
      );
    }

    // Fetch evidence details
    const evidence = await getEvidenceById(evidence_id);

    if (!evidence) {
      return NextResponse.json(
        { error: 'Evidence not found' },
        { status: 404 }
      );
    }

    // Check organization access
    if (evidence.organization_id !== organization_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Prepare verification input
    const verificationInput: VerificationInput = {
      evidenceId: evidence.id,
      fileUrl: evidence.file_url,
      fileName: evidence.file_name,
      fileType: evidence.file_type,
      evidenceType: evidence.evidence_type,
      complianceDomain: evidence.compliance_domain || undefined,
      expectedDetails: {
        issuingBody: evidence.issuing_body || undefined,
        documentNumber: evidence.document_number || undefined,
        issuedDate: evidence.issued_date || undefined,
        expiryDate: evidence.expiry_date || undefined,
      }
    };

    // Run AI verification
    const result = await verifyComplianceDocument(verificationInput);

    // Update evidence with verification results
    await updateEvidence(evidence_id, {
      ai_verified: result.verified,
      ai_confidence_score: result.confidence,
      ai_insights: {
        ...result,
        verified_at: new Date().toISOString(),
      },
      // Auto-fill extracted data if available
      certificate_number: result.certificateInfo?.certificateNumber || evidence.certificate_number,
      issuing_body: result.certificateInfo?.issuingBody || evidence.issuing_body,
      issued_date: result.certificateInfo?.issuedDate || evidence.issued_date,
      expiry_date: result.certificateInfo?.expiryDate || evidence.expiry_date,
      // Update status based on verification
      status: result.verified ? 'verified' : evidence.status,
      verification_notes: result.issues.length > 0
        ? `Issues: ${result.issues.join('; ')}`
        : result.warnings.join('; ') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        evidence_id: evidence_id,
        verification: result,
        updated_fields: {
          certificate_number: result.certificateInfo?.certificateNumber,
          issuing_body: result.certificateInfo?.issuingBody,
          issued_date: result.certificateInfo?.issuedDate,
          expiry_date: result.certificateInfo?.expiryDate,
        }
      }
    });

  } catch (error: any) {
    console.error('[AI Verification] Error:', error);

    return NextResponse.json(
      {
        error: 'Verification failed',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/estates/evidence/verify
 *
 * Check verification status of an evidence item
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const evidenceId = searchParams.get('evidence_id');

    if (!evidenceId) {
      return NextResponse.json(
        { error: 'evidence_id is required' },
        { status: 400 }
      );
    }

    const evidence = await getEvidenceById(evidenceId);

    if (!evidence) {
      return NextResponse.json(
        { error: 'Evidence not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        evidence_id: evidence.id,
        ai_verified: evidence.ai_verified,
        ai_confidence_score: evidence.ai_confidence_score,
        ai_insights: evidence.ai_insights,
        verified_by: evidence.verified_by,
        verified_at: evidence.verified_at,
        verification_notes: evidence.verification_notes,
      }
    });

  } catch (error: any) {
    console.error('[AI Verification] Error fetching status:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch verification status',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
