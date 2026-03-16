/**
 * Evidence Service
 *
 * Business logic layer for evidence management in Estates Compliance
 */

import {
  getEvidence,
  getEvidenceById,
  createEvidence as dbCreateEvidence,
  updateEvidence as dbUpdateEvidence,
  deleteEvidence as dbDeleteEvidence,
  getEvidenceByDomain,
  getEvidenceByAsset,
  getEvidenceByTask,
  getEvidenceByContractor,
  getExpiringEvidence,
  searchEvidence,
  getEvidenceStats,
  createEvidenceVersion,
} from "../database/evidence";
import type {
  EstatesEvidence,
  EstatesEvidenceInput,
  EvidenceFilters,
  PaginatedResponse,
} from "@/types/estates-compliance";

/**
 * Evidence Service class
 */
export class EvidenceService {
  /**
   * Get evidence with filters and pagination
   */
  static async list(
    organizationId: string,
    filters?: EvidenceFilters,
    pagination?: { page: number; pageSize: number },
  ): Promise<PaginatedResponse<EstatesEvidence>> {
    return getEvidence(organizationId, filters, pagination);
  }

  /**
   * Get a single evidence item by ID
   */
  static async get(evidenceId: string): Promise<EstatesEvidence | null> {
    return getEvidenceById(evidenceId);
  }

  /**
   * Upload and create new evidence
   */
  static async upload(
    organizationId: string,
    userId: string,
    input: EstatesEvidenceInput & { file?: File },
  ): Promise<EstatesEvidence> {
    // If file is provided, upload to Supabase storage
    let fileUrl = input.file_url;
    let fileName = input.file_name;
    let fileSize = input.file_size_bytes;
    let fileType = input.file_type;

    if (input.file) {
      const file = input.file;
      const fileExt = file.name.split(".").pop();
      const fileNameWithoutExt = file.name.replace(`.${fileExt}`, "");
      const timestamp = Date.now();
      const filePath = `${organizationId}/${timestamp}-${fileNameWithoutExt}.${fileExt}`;

      // Determine bucket based on file type
      const isImage = file.type.startsWith("image/");
      const bucket = isImage ? "estates-images" : "estates-documents";

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await fetch(
        `/api/upload?bucket=${bucket}&path=${filePath}`,
        {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        },
      ).then((res) => res.json());

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      fileUrl = uploadData.publicUrl;
      fileName = file.name;
      fileSize = file.size;
      fileType = file.type;
    }

    return dbCreateEvidence(organizationId, userId, {
      ...input,
      file_url: fileUrl,
      file_name: fileName,
      file_size_bytes: fileSize,
      file_type: fileType,
    });
  }

  /**
   * Link to Google Drive document (future - placeholder)
   */
  static async linkGoogleDrive(
    organizationId: string,
    userId: string,
    input: Omit<EstatesEvidenceInput, "source_type"> & { driveFileId: string },
  ): Promise<EstatesEvidence> {
    // TODO: Implement Google Drive picker integration
    // For now, just create a link record
    return dbCreateEvidence(organizationId, userId, {
      ...input,
      source_type: "google_drive",
      cloud_provider: "google",
      cloud_file_id: input.driveFileId,
    });
  }

  /**
   * Link to existing evidence
   */
  static async linkExisting(
    organizationId: string,
    userId: string,
    existingEvidenceId: string,
    linkData: {
      title?: string;
      description?: string;
      compliance_domain?: string;
      asset_id?: string;
      task_id?: string;
      contractor_id?: string;
      contract_id?: string;
    },
  ): Promise<EstatesEvidence> {
    return dbCreateEvidence(organizationId, userId, {
      title: linkData.title || "Linked Evidence",
      description: linkData.description,
      source_type: "existing",
      existing_evidence_id: existingEvidenceId,
      compliance_domain: linkData.compliance_domain,
      asset_id: linkData.asset_id,
      task_id: linkData.task_id,
      contractor_id: linkData.contractor_id,
      contract_id: linkData.contract_id,
      evidence_type: "document",
    });
  }

  /**
   * Update evidence metadata
   */
  static async update(
    evidenceId: string,
    updates: Partial<EstatesEvidenceInput> & {
      status?: string;
      ai_verified?: boolean;
      verification_notes?: string;
    },
  ): Promise<EstatesEvidence> {
    // Check evidence exists
    const existing = await getEvidenceById(evidenceId);
    if (!existing) {
      throw new Error(`Evidence not found: ${evidenceId}`);
    }

    return dbUpdateEvidence(evidenceId, updates);
  }

  /**
   * Verify evidence (manual verification by user)
   */
  static async verify(
    evidenceId: string,
    verifierId: string,
    approved: boolean,
    notes?: string,
  ): Promise<EstatesEvidence> {
    const existing = await getEvidenceById(evidenceId);
    if (!existing) {
      throw new Error(`Evidence not found: ${evidenceId}`);
    }

    return dbUpdateEvidence(evidenceId, {
      status: approved ? "verified" : "rejected",
      verified_by: verifierId,
      verified_at: new Date().toISOString(),
      verification_notes: notes,
    });
  }

  /**
   * Delete evidence
   */
  static async delete(evidenceId: string): Promise<void> {
    const evidence = await getEvidenceById(evidenceId);
    if (!evidence) {
      throw new Error(`Evidence not found: ${evidenceId}`);
    }

    // TODO: Delete file from storage if not linked
    // For now, just delete the record
    return dbDeleteEvidence(evidenceId);
  }

  /**
   * Get evidence by compliance domain
   */
  static async getByDomain(
    organizationId: string,
    domain: string,
  ): Promise<EstatesEvidence[]> {
    return getEvidenceByDomain(organizationId, domain);
  }

  /**
   * Get evidence linked to an asset
   */
  static async getByAsset(assetId: string): Promise<EstatesEvidence[]> {
    return getEvidenceByAsset(assetId);
  }

  /**
   * Get evidence linked to a task
   */
  static async getByTask(taskId: string): Promise<EstatesEvidence[]> {
    return getEvidenceByTask(taskId);
  }

  /**
   * Get evidence linked to a contractor
   */
  static async getByContractor(
    contractorId: string,
  ): Promise<EstatesEvidence[]> {
    return getEvidenceByContractor(contractorId);
  }

  /**
   * Get expiring evidence (certificates)
   */
  static async getExpiring(
    organizationId: string,
    daysAhead = 30,
  ): Promise<EstatesEvidence[]> {
    return getExpiringEvidence(organizationId, daysAhead);
  }

  /**
   * Search evidence
   */
  static async search(
    organizationId: string,
    searchTerm: string,
    limit = 20,
  ): Promise<EstatesEvidence[]> {
    return searchEvidence(organizationId, searchTerm, limit);
  }

  /**
   * Get evidence statistics
   */
  static async getStats(organizationId: string) {
    return getEvidenceStats(organizationId);
  }

  /**
   * Create a new version of existing evidence
   */
  static async createVersion(
    originalEvidenceId: string,
    userId: string,
    newFileUrl: string,
    newFileName?: string,
  ): Promise<EstatesEvidence> {
    return createEvidenceVersion(
      originalEvidenceId,
      userId,
      newFileUrl,
      newFileName,
    );
  }

  /**
   * Upload a new version of existing evidence
   */
  static async uploadVersion(
    originalEvidenceId: string,
    userId: string,
    file: File,
  ): Promise<EstatesEvidence> {
    const original = await getEvidenceById(originalEvidenceId);
    if (!original) {
      throw new Error(`Original evidence not found: ${originalEvidenceId}`);
    }

    // Upload new file
    const fileExt = file.name.split(".").pop();
    const fileNameWithoutExt = file.name.replace(`.${fileExt}`, "");
    const timestamp = Date.now();
    const filePath = `${original.organization_id}/${timestamp}-${fileNameWithoutExt}.${fileExt}`;

    const isImage = file.type.startsWith("image/");
    const bucket = isImage ? "estates-images" : "estates-documents";

    const { data: uploadData, error: uploadError } = await fetch(
      `/api/upload?bucket=${bucket}&path=${filePath}`,
      {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      },
    ).then((res) => res.json());

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    return createEvidenceVersion(
      originalEvidenceId,
      userId,
      uploadData.publicUrl,
      file.name,
    );
  }

  /**
   * Process evidence with AI for verification
   */
  static async processWithAI(evidenceId: string): Promise<EstatesEvidence> {
    const evidence = await getEvidenceById(evidenceId);
    if (!evidence) {
      throw new Error(`Evidence not found: ${evidenceId}`);
    }

    // Import the verifier dynamically to avoid issues when not needed
    const { verifyComplianceDocument } =
      await import("../ai-document-verifier");

    // Run AI verification
    const result = await verifyComplianceDocument({
      evidenceId: evidence.id,
      fileUrl: evidence.file_url || "",
      fileName: evidence.file_name || "",
      fileType: evidence.file_type || "",
      evidenceType: evidence.evidence_type as any,
      complianceDomain: evidence.compliance_domain || undefined,
      expectedDetails: {
        issuingBody: evidence.issuing_body || undefined,
        documentNumber: evidence.document_number || undefined,
        issuedDate: evidence.issued_date || undefined,
        expiryDate: evidence.expiry_date || undefined,
      },
    });

    // Update evidence with verification results
    return dbUpdateEvidence(evidenceId, {
      ai_verified: result.verified,
      ai_confidence_score: result.confidence,
      // Auto-fill extracted data if available
      document_number:
        result.certificateInfo?.certificateNumber || evidence.document_number,
      issuing_body:
        result.certificateInfo?.issuingBody || evidence.issuing_body,
      issued_date: result.certificateInfo?.issuedDate || evidence.issued_date,
      expiry_date: result.certificateInfo?.expiryDate || evidence.expiry_date,
      // Update status based on verification
      status: result.verified ? "verified" : evidence.status,
      verification_notes:
        result.issues.length > 0
          ? `Issues: ${result.issues.join("; ")}`
          : result.warnings.join("; ") || undefined,
    } as any);
  }

  /**
   * Batch link evidence to task
   */
  static async linkToTask(
    taskId: string,
    evidenceIds: string[],
  ): Promise<void> {
    for (const evidenceId of evidenceIds) {
      await dbUpdateEvidence(evidenceId, { task_id: taskId });
    }
  }

  /**
   * Batch link evidence to asset
   */
  static async linkToAsset(
    assetId: string,
    evidenceIds: string[],
  ): Promise<void> {
    for (const evidenceId of evidenceIds) {
      await dbUpdateEvidence(evidenceId, { asset_id: assetId });
    }
  }
}

/**
 * Alias for backward compatibility
 */
export const evidenceService = EvidenceService;
