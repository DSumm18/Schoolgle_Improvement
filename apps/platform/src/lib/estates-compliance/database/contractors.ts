/**
 * Contractors Database Functions
 *
 * Helper functions for querying estates_contractors and estates_contracts tables
 */

import { createServiceRoleClient } from "@/lib/supabase-server";
import type {
  Contractor,
  ContractorInput,
  Contract,
  PaginatedResponse,
} from "@/types/estates-compliance";

const supabase = createServiceRoleClient();

// ============================================================================
// CONTRACTORS
// ============================================================================

/**
 * Get all contractors for an organization
 */
export async function getContractors(
  organizationId: string,
  filters?: {
    status?: "active" | "inactive" | "restricted";
    preferred?: boolean;
  },
): Promise<Contractor[]> {
  let query = supabase
    .from("estates_contractors")
    .select("*")
    .eq("organization_id", organizationId);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.preferred !== undefined) {
    query = query.eq("preferred", filters.preferred);
  }

  query = query
    .order("preferred", { ascending: false })
    .order("company_name", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching contractors:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single contractor by ID
 */
export async function getContractorById(
  contractorId: string,
): Promise<Contractor | null> {
  const { data, error } = await supabase
    .from("estates_contractors")
    .select("*")
    .eq("id", contractorId)
    .single();

  if (error) {
    console.error("Error fetching contractor:", error);
    throw error;
  }

  return data;
}

/**
 * Create a new contractor
 */
export async function createContractor(
  organizationId: string,
  contractor: ContractorInput,
): Promise<Contractor> {
  const { data, error } = await supabase
    .from("estates_contractors")
    .insert({
      organization_id: organizationId,
      ...contractor,
      services: contractor.services || [],
      accreditations: contractor.accreditations || [],
      insurance_certificates: contractor.insurance_certificates || [],
      safeguarding_docs: contractor.safeguarding_docs || [],
      status: contractor.status || "active",
      preferred: contractor.preferred || false,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating contractor:", error);
    throw error;
  }

  return data;
}

/**
 * Update an existing contractor
 */
export async function updateContractor(
  contractorId: string,
  updates: Partial<ContractorInput>,
): Promise<Contractor> {
  const { data, error } = await supabase
    .from("estates_contractors")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractorId)
    .select()
    .single();

  if (error) {
    console.error("Error updating contractor:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a contractor
 */
export async function deleteContractor(contractorId: string): Promise<void> {
  const { error } = await supabase
    .from("estates_contractors")
    .delete()
    .eq("id", contractorId);

  if (error) {
    console.error("Error deleting contractor:", error);
    throw error;
  }
}

/**
 * Search contractors by name, service, or accreditation
 */
export async function searchContractors(
  organizationId: string,
  searchTerm: string,
  limit = 20,
): Promise<Contractor[]> {
  const { data, error } = await supabase
    .from("estates_contractors")
    .select("*")
    .eq("organization_id", organizationId)
    .or(`company_name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%`)
    .limit(limit);

  if (error) {
    console.error("Error searching contractors:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get contractors by service type
 */
export async function getContractorsByService(
  organizationId: string,
  serviceType: string,
): Promise<Contractor[]> {
  const { data, error } = await supabase
    .from("estates_contractors")
    .select("*")
    .eq("organization_id", organizationId)
    .contains("services", [{ service_type: serviceType }])
    .eq("status", "active")
    .order("preferred", { ascending: false })
    .order("company_name", { ascending: true });

  if (error) {
    console.error("Error fetching contractors by service:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get contractors with expiring accreditations or insurance
 */
export async function getContractorsWithExpiringDocuments(
  organizationId: string,
  daysUntilExpiry = 30,
): Promise<Array<{ contractor: Contractor; expiring_items: string[] }>> {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);
  const expiryDateStr = expiryDate.toISOString().split("T")[0];

  const { data: contractors, error } = await supabase
    .from("estates_contractors")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  if (error) {
    console.error("Error fetching contractors:", error);
    throw error;
  }

  const results: Array<{ contractor: Contractor; expiring_items: string[] }> =
    [];

  for (const contractor of contractors || []) {
    const expiringItems: string[] = [];

    // Check accreditations
    for (const acc of contractor.accreditations || []) {
      if (acc.expiry_date && acc.expiry_date <= expiryDateStr) {
        expiringItems.push(`Accreditation: ${acc.type}`);
      }
    }

    // Check insurance
    for (const ins of contractor.insurance_certificates || []) {
      if (ins.expiry_date && ins.expiry_date <= expiryDateStr) {
        expiringItems.push(`Insurance: ${ins.type}`);
      }
    }

    // Check safeguarding docs
    for (const doc of contractor.safeguarding_docs || []) {
      if (doc.expiry_date && doc.expiry_date <= expiryDateStr) {
        expiringItems.push(`Safeguarding: ${doc.type}`);
      }
    }

    if (expiringItems.length > 0) {
      results.push({ contractor, expiring_items: expiringItems });
    }
  }

  return results;
}

// ============================================================================
// CONTRACTS
// ============================================================================

/**
 * Get all contracts for an organization
 */
export async function getContracts(
  organizationId: string,
  filters?: { status?: string; contractor_id?: string },
): Promise<Contract[]> {
  let query = supabase
    .from("estates_contracts")
    .select("*, contractor:estates_contractors(*)")
    .eq("organization_id", organizationId);

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.contractor_id) {
    query = query.eq("contractor_id", filters.contractor_id);
  }

  query = query.order("end_date", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching contracts:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single contract by ID
 */
export async function getContractById(
  contractId: string,
): Promise<Contract | null> {
  const { data, error } = await supabase
    .from("estates_contracts")
    .select("*, contractor:estates_contractors(*)")
    .eq("id", contractId)
    .single();

  if (error) {
    console.error("Error fetching contract:", error);
    throw error;
  }

  return data;
}

/**
 * Create a new contract
 */
export async function createContract(
  organizationId: string,
  contract: ContractInput,
): Promise<Contract> {
  const { data, error } = await supabase
    .from("estates_contracts")
    .insert({
      organization_id: organizationId,
      ...contract,
      asset_ids: contract.asset_ids || [],
      compliance_domains: contract.compliance_domains || [],
      notice_period_days: contract.notice_period_days || 30,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating contract:", error);
    throw error;
  }

  return data;
}

/**
 * Update an existing contract
 */
export async function updateContract(
  contractId: string,
  updates: Partial<ContractInput>,
): Promise<Contract> {
  const { data, error } = await supabase
    .from("estates_contracts")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId)
    .select()
    .single();

  if (error) {
    console.error("Error updating contract:", error);
    throw error;
  }

  return data;
}

/**
 * Delete a contract
 */
export async function deleteContract(contractId: string): Promise<void> {
  const { error } = await supabase
    .from("estates_contracts")
    .delete()
    .eq("id", contractId);

  if (error) {
    console.error("Error deleting contract:", error);
    throw error;
  }
}

/**
 * Get contracts expiring soon
 */
export async function getExpiringContracts(
  organizationId: string,
  daysUntilExpiry = 90,
): Promise<Contract[]> {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);
  const expiryDateStr = expiryDate.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("estates_contracts")
    .select("*, contractor:estates_contractors(*)")
    .eq("organization_id", organizationId)
    .lte("end_date", expiryDateStr)
    .gt("end_date", new Date().toISOString().split("T")[0])
    .order("end_date", { ascending: true });

  if (error) {
    console.error("Error fetching expiring contracts:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get active contracts for a specific asset
 */
export async function getAssetContracts(assetId: string): Promise<Contract[]> {
  const { data, error } = await supabase
    .from("estates_contracts")
    .select("*, contractor:estates_contractors(*)")
    .contains("asset_ids", [assetId])
    .eq("status", "active")
    .order("end_date", { ascending: true });

  if (error) {
    console.error("Error fetching asset contracts:", error);
    throw error;
  }

  return data || [];
}

// ============================================================================
// TYPES
// ============================================================================

export interface ContractorInput {
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: Record<string, unknown>;
  services?: Array<{ service_type: string; description?: string }>;
  accreditations?: Array<{
    type: string;
    number?: string;
    expiry_date?: string;
    issuing_body?: string;
  }>;
  insurance_certificates?: Array<{
    type: string;
    expiry_date: string;
    document_url?: string;
  }>;
  safeguarding_docs?: Array<{
    type: "dbs_check" | "safeguarding_policy" | "insurance" | "other";
    expiry_date?: string;
    document_url?: string;
  }>;
  notes?: string;
  status?: "active" | "inactive" | "restricted";
  preferred?: boolean;
}

export interface ContractInput {
  contractor_id: string;
  title: string;
  description?: string;
  contract_type:
    | "maintenance"
    | "service"
    | "inspection"
    | "consultancy"
    | "installation";
  start_date: string;
  end_date?: string;
  renewal_date?: string;
  notice_period_days?: number;
  sla?: {
    response_time_hours?: number;
    attendance_window?: string[];
    required_certifications?: string[];
  };
  annual_cost?: number;
  billing_frequency?: "monthly" | "quarterly" | "annually" | "one_off";
  asset_ids?: string[];
  compliance_domains?: string[];
  contract_document_url?: string;
  notes?: string;
}
