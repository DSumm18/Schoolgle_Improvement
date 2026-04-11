/**
 * Evidence API Routes
 *
 * GET    /api/estates/evidence              - List evidence
 * POST   /api/estates/evidence              - Upload/create evidence
 * PUT    /api/estates/evidence              - Update evidence
 */

import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { EvidenceService } from "@/lib/estates-compliance/services/EvidenceService";
import type {
  EstatesEvidenceInput,
  EvidenceFilters,
} from "@/types/estates-compliance";

/**
 * GET /api/estates/evidence
 *
 * Query params:
 * - page: number (default: 1)
 * - page_size: number (default: 50)
 * - evidence_type: string
 * - status: string
 * - compliance_domain: string
 * - asset_id: string
 * - task_id: string
 * - contractor_id: string
 * - date_from: string (ISO date)
 * - date_to: string (ISO date)
 * - expiry_from: string (ISO date)
 * - expiry_to: string (ISO date)
 * - search: string
 * - tags: string (comma-separated)
 */
export const GET = protectedRoute(async (auth, request) => {
  const { organizationId } = auth;

  const searchParams = request.nextUrl.searchParams;

  // Parse filters
  const filters: EvidenceFilters = {};

  if (searchParams.get("evidence_type")) {
    filters.evidence_type = searchParams.get("evidence_type") as any;
  }
  if (searchParams.get("status")) {
    filters.status = searchParams.get("status") as any;
  }
  if (searchParams.get("compliance_domain")) {
    filters.compliance_domain = searchParams.get("compliance_domain")!;
  }
  if (searchParams.get("asset_id")) {
    filters.asset_id = searchParams.get("asset_id")!;
  }
  if (searchParams.get("task_id")) {
    filters.task_id = searchParams.get("task_id")!;
  }
  if (searchParams.get("contractor_id")) {
    filters.contractor_id = searchParams.get("contractor_id")!;
  }
  if (searchParams.get("date_from")) {
    filters.date_from = searchParams.get("date_from")!;
  }
  if (searchParams.get("date_to")) {
    filters.date_to = searchParams.get("date_to")!;
  }
  if (searchParams.get("expiry_from")) {
    filters.expiry_from = searchParams.get("expiry_from")!;
  }
  if (searchParams.get("expiry_to")) {
    filters.expiry_to = searchParams.get("expiry_to")!;
  }
  if (searchParams.get("search")) {
    filters.search = searchParams.get("search")!;
  }
  if (searchParams.get("tags")) {
    filters.tags = searchParams.get("tags")!.split(",");
  }

  // Parse pagination
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("page_size") || "50", 10);

  const result = await EvidenceService.list(organizationId, filters, {
    page,
    pageSize,
  });

  return apiSuccess(result);
});

/**
 * POST /api/estates/evidence
 *
 * Body: EstatesEvidenceInput & {
 *   file?: File;
 *   driveFileId?: string; // for Google Drive links
 *   existing_evidence_id?: string; // for linking existing evidence
 * }
 */
export const POST = protectedRoute(
  async (auth, request) => {
    const { organizationId, userId } = auth;

    const formData = await request.formData();

    const sourceType = formData.get("source_type") as
      | "upload"
      | "google_drive"
      | "onedrive"
      | "link"
      | "existing";

    // Handle different source types
    if (sourceType === "upload") {
      // File upload
      const file = formData.get("file") as File | null;
      const title = formData.get("title") as string;
      const description = formData.get("description") as string | null;
      const evidenceType = formData.get("evidence_type") as any;
      const complianceDomain = formData.get("compliance_domain") as
        | string
        | null;
      const assetId = formData.get("asset_id") as string | null;
      const taskId = formData.get("task_id") as string | null;
      const ticketId = formData.get("ticket_id") as string | null;
      const contractorId = formData.get("contractor_id") as string | null;
      const contractId = formData.get("contract_id") as string | null;
      const documentNumber = formData.get("document_number") as string | null;
      const issuingBody = formData.get("issuing_body") as string | null;
      const issuedDate = formData.get("issued_date") as string | null;
      const expiryDate = formData.get("expiry_date") as string | null;
      const tags = formData.get("tags") as string | null;

      if (!file) {
        return apiError("file is required for upload", 400);
      }

      // File type validation — only allow safe document/image types
      const ALLOWED_TYPES = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/heic",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain",
        "text/csv",
      ];
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

      if (!ALLOWED_TYPES.includes(file.type)) {
        return apiError(
          `File type "${file.type}" is not allowed. Accepted types: PDF, images (JPEG/PNG/GIF/WebP/HEIC), Office documents (Word/Excel/PowerPoint), CSV, and plain text.`,
          400,
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return apiError(
          `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds the 50MB limit.`,
          400,
        );
      }

      if (!title) {
        return apiError("title is required", 400);
      }
      if (!evidenceType) {
        return apiError("evidence_type is required", 400);
      }

      const evidence = await EvidenceService.upload(organizationId, userId, {
        title,
        description: description || undefined,
        evidence_type: evidenceType,
        source_type: "upload",
        compliance_domain: complianceDomain || undefined,
        asset_id: assetId || undefined,
        task_id: taskId || undefined,
        ticket_id: ticketId || undefined,
        contractor_id: contractorId || undefined,
        contract_id: contractId || undefined,
        document_number: documentNumber || undefined,
        issuing_body: issuingBody || undefined,
        issued_date: issuedDate || undefined,
        expiry_date: expiryDate || undefined,
        tags: tags ? tags.split(",") : [],
        file,
      });

      return apiSuccess({ data: evidence }, 201);
    }

    if (sourceType === "google_drive") {
      // Google Drive link (placeholder for future)
      const driveFileId = formData.get("drive_file_id") as string;
      const title = formData.get("title") as string;
      const description = formData.get("description") as string | null;
      const evidenceType = formData.get("evidence_type") as any;
      const complianceDomain = formData.get("compliance_domain") as
        | string
        | null;
      const assetId = formData.get("asset_id") as string | null;
      const taskId = formData.get("task_id") as string | null;

      if (!driveFileId) {
        return apiError("drive_file_id is required for Google Drive link", 400);
      }
      if (!title) {
        return apiError("title is required", 400);
      }
      if (!evidenceType) {
        return apiError("evidence_type is required", 400);
      }

      const evidence = await EvidenceService.linkGoogleDrive(
        organizationId,
        userId,
        {
          driveFileId,
          title,
          description: description || undefined,
          evidence_type: evidenceType,
          compliance_domain: complianceDomain || undefined,
          asset_id: assetId || undefined,
          task_id: taskId || undefined,
        },
      );

      return apiSuccess({ data: evidence }, 201);
    }

    if (sourceType === "existing") {
      // Link to existing evidence
      const existingEvidenceId = formData.get("existing_evidence_id") as string;
      const title = formData.get("title") as string | null;
      const description = formData.get("description") as string | null;
      const complianceDomain = formData.get("compliance_domain") as
        | string
        | null;
      const assetId = formData.get("asset_id") as string | null;
      const taskId = formData.get("task_id") as string | null;
      const contractorId = formData.get("contractor_id") as string | null;
      const contractId = formData.get("contract_id") as string | null;

      if (!existingEvidenceId) {
        return apiError("existing_evidence_id is required for linking", 400);
      }

      const evidence = await EvidenceService.linkExisting(
        organizationId,
        userId,
        existingEvidenceId,
        {
          title: title || undefined,
          description: description || undefined,
          compliance_domain: complianceDomain || undefined,
          asset_id: assetId || undefined,
          task_id: taskId || undefined,
          contractor_id: contractorId || undefined,
          contract_id: contractId || undefined,
        },
      );

      return apiSuccess({ data: evidence }, 201);
    }

    return apiError("Invalid source_type", 400);
  },
  { requiredRole: "caretaker" },
);

/**
 * PUT /api/estates/evidence
 *
 * Body: Partial<EstatesEvidenceInput> & {
 *   id: string;
 *   status?: string;
 *   verified?: boolean;
 *   verification_notes?: string;
 * }
 */
export const PUT = protectedRoute(
  async (auth, request) => {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return apiError("id is required", 400);
    }

    const evidence = await EvidenceService.update(id, updates);

    return apiSuccess({ data: evidence });
  },
  { requiredRole: "caretaker" },
);
