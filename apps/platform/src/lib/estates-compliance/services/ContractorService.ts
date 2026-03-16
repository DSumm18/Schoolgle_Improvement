/**
 * Contractor Service
 *
 * Business logic layer for contractor and contract management
 */

import {
  getContractors,
  getContractorById,
  createContractor as dbCreateContractor,
  updateContractor as dbUpdateContractor,
  deleteContractor as dbDeleteContractor,
  searchContractors,
  getContractorsByService,
  getContractorsWithExpiringDocuments,
  getContracts,
  getContractById,
  createContract as dbCreateContract,
  updateContract as dbUpdateContract,
  deleteContract as dbDeleteContract,
  getExpiringContracts,
  getAssetContracts,
} from "../database/contractors";
import type {
  Contractor,
  Contract,
  ContractorInput,
  ContractInput,
} from "@/types/estates-compliance";

/**
 * Contractor Service class
 */
export class ContractorService {
  // ======================== CONTRACTORS ========================

  /**
   * Get all contractors
   */
  static async listContractors(
    organizationId: string,
    filters?: {
      status?: "active" | "inactive" | "restricted";
      preferred?: boolean;
    },
  ): Promise<Contractor[]> {
    return getContractors(organizationId, filters);
  }

  /**
   * Get a single contractor by ID
   */
  static async getContractor(contractorId: string): Promise<Contractor | null> {
    return getContractorById(contractorId);
  }

  /**
   * Create a new contractor
   */
  static async createContractor(
    organizationId: string,
    input: ContractorInput,
  ): Promise<Contractor> {
    // Validate required fields
    if (!input.company_name || input.company_name.trim() === "") {
      throw new Error("Company name is required");
    }

    // Validate email format if provided
    if (input.email && !this.isValidEmail(input.email)) {
      throw new Error("Invalid email format");
    }

    return dbCreateContractor(organizationId, input);
  }

  /**
   * Update a contractor
   */
  static async updateContractor(
    contractorId: string,
    updates: Partial<ContractorInput>,
  ): Promise<Contractor> {
    // Check contractor exists
    const existing = await getContractorById(contractorId);
    if (!existing) {
      throw new Error(`Contractor not found: ${contractorId}`);
    }

    // Validate email format if provided
    if (updates.email && !this.isValidEmail(updates.email)) {
      throw new Error("Invalid email format");
    }

    return dbUpdateContractor(contractorId, updates);
  }

  /**
   * Delete a contractor
   */
  static async deleteContractor(contractorId: string): Promise<void> {
    // Check for active contracts
    const contracts = await getContracts("", { contractor_id: contractorId });
    const activeContracts = contracts.filter((c) => c.status === "active");

    if (activeContracts.length > 0) {
      throw new Error(
        `Cannot delete contractor with ${activeContracts.length} active contract(s). End or reassign contracts first.`,
      );
    }

    return dbDeleteContractor(contractorId);
  }

  /**
   * Search contractors
   */
  static async searchContractors(
    organizationId: string,
    searchTerm: string,
  ): Promise<Contractor[]> {
    return searchContractors(organizationId, searchTerm);
  }

  /**
   * Get contractors by service type
   */
  static async getContractorsByServiceType(
    organizationId: string,
    serviceType: string,
  ): Promise<Contractor[]> {
    return getContractorsByService(organizationId, serviceType);
  }

  /**
   * Get contractors with expiring documents
   */
  static async getContractorsWithExpiringDocs(
    organizationId: string,
    daysUntilExpiry = 30,
  ): Promise<Array<{ contractor: Contractor; expiring_items: string[] }>> {
    return getContractorsWithExpiringDocuments(organizationId, daysUntilExpiry);
  }

  /**
   * Toggle preferred status
   */
  static async togglePreferred(contractorId: string): Promise<Contractor> {
    const contractor = await getContractorById(contractorId);
    if (!contractor) {
      throw new Error(`Contractor not found: ${contractorId}`);
    }

    return dbUpdateContractor(contractorId, {
      preferred: !contractor.preferred,
    });
  }

  /**
   * Set contractor status
   */
  static async setStatus(
    contractorId: string,
    status: "active" | "inactive" | "restricted",
  ): Promise<Contractor> {
    return dbUpdateContractor(contractorId, { status });
  }

  /**
   * Add accreditation to contractor
   */
  static async addAccreditation(
    contractorId: string,
    accreditation: {
      type: string;
      number?: string;
      expiry_date?: string;
      issuing_body?: string;
      certificate_url?: string;
    },
  ): Promise<Contractor> {
    const contractor = await getContractorById(contractorId);
    if (!contractor) {
      throw new Error(`Contractor not found: ${contractorId}`);
    }

    const accreditations = [
      ...(contractor.accreditations || []),
      accreditation,
    ];

    return dbUpdateContractor(contractorId, { accreditations });
  }

  /**
   * Remove accreditation from contractor
   */
  static async removeAccreditation(
    contractorId: string,
    accreditationType: string,
  ): Promise<Contractor> {
    const contractor = await getContractorById(contractorId);
    if (!contractor) {
      throw new Error(`Contractor not found: ${contractorId}`);
    }

    const accreditations = (contractor.accreditations || []).filter(
      (a) => a.type !== accreditationType,
    );

    return dbUpdateContractor(contractorId, { accreditations });
  }

  // ======================== CONTRACTS ========================

  /**
   * Get all contracts
   */
  static async listContracts(
    organizationId: string,
    filters?: { status?: string; contractor_id?: string },
  ): Promise<Contract[]> {
    return getContracts(organizationId, filters);
  }

  /**
   * Get a single contract by ID
   */
  static async getContract(contractId: string): Promise<Contract | null> {
    return getContractById(contractId);
  }

  /**
   * Create a new contract
   */
  static async createContract(
    organizationId: string,
    input: ContractInput,
  ): Promise<Contract> {
    // Validate contractor exists
    const contractor = await getContractorById(input.contractor_id);
    if (!contractor) {
      throw new Error(`Contractor not found: ${input.contractor_id}`);
    }

    // Validate contractor belongs to same organization
    if (contractor.organization_id !== organizationId) {
      throw new Error("Contractor must belong to the same organization");
    }

    // Validate dates
    if (input.end_date && input.end_date <= input.start_date) {
      throw new Error("End date must be after start date");
    }

    if (input.renewal_date && input.start_date > input.renewal_date) {
      throw new Error("Renewal date must be after start date");
    }

    return dbCreateContract(organizationId, input);
  }

  /**
   * Update a contract
   */
  static async updateContract(
    contractId: string,
    updates: Partial<ContractInput>,
  ): Promise<Contract> {
    // Check contract exists
    const existing = await getContractById(contractId);
    if (!existing) {
      throw new Error(`Contract not found: ${contractId}`);
    }

    // Validate dates if being updated
    if (
      updates.start_date &&
      updates.end_date &&
      updates.end_date <= updates.start_date
    ) {
      throw new Error("End date must be after start date");
    }

    return dbUpdateContract(contractId, updates);
  }

  /**
   * Delete a contract
   */
  static async deleteContract(contractId: string): Promise<void> {
    return dbDeleteContract(contractId);
  }

  /**
   * Get contracts expiring soon
   */
  static async getExpiringContracts(
    organizationId: string,
    daysUntilExpiry = 90,
  ): Promise<Contract[]> {
    return getExpiringContracts(organizationId, daysUntilExpiry);
  }

  /**
   * Get contracts for a specific asset
   */
  static async getAssetContracts(assetId: string): Promise<Contract[]> {
    return getAssetContracts(assetId);
  }

  /**
   * Get active contracts for a contractor
   */
  static async getContractorActiveContracts(
    contractorId: string,
  ): Promise<Contract[]> {
    return getContracts("", { contractor_id: contractorId }).then((contracts) =>
      contracts.filter((c) => c.status === "active"),
    );
  }

  // ======================== HELPERS ========================

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Alias for backward compatibility
 */
export const contractorService = ContractorService;
