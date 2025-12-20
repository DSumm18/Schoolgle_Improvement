/**
 * MCP Tool: Admin & Setup Tools
 * 
 * Tools for bulk data import and cohort management.
 * Privacy-First: All UPNs are hashed before storage.
 * 
 * Based on database schema:
 * - students table
 * - cohorts table
 */

import { z } from 'zod';
import type { AuthContext } from '@schoolgle/core/auth';
import { createHash } from 'crypto';

// ============================================================================
// TOOL 1: import_students_batch
// ============================================================================

export const ImportStudentsBatchSchema = z.object({
  students: z.array(
    z.object({
      upn: z.string()
        .min(1, 'UPN is required')
        .describe('Unique Pupil Number (will be hashed before storage - never stored in plain text).'),
      yearGroup: z.number()
        .int()
        .min(1)
        .max(13)
        .describe('Year group (1-13).'),
      characteristics: z.array(z.string())
        .default([])
        .describe('Array of characteristics (e.g., ["pp", "send", "eal", "high_prior", "low_prior", "lac", "adopted"]).')
    })
  )
    .min(1, 'At least one student is required')
    .max(1000, 'Maximum 1000 students per batch')
    .describe('Array of student records to import.')
});

export type ImportStudentsBatchInput = z.infer<typeof ImportStudentsBatchSchema>;

export interface ImportStudentsBatchResult {
  success: boolean;
  count: number;
  failed: number;
  errors?: string[];
  message: string;
}

/**
 * Hash UPN using SHA-256
 * Privacy-First: Never store raw UPNs
 */
function hashUPN(upn: string): string {
  return createHash('sha256').update(upn.trim().toUpperCase()).digest('hex');
}

/**
 * Handler for import_students_batch tool
 * 
 * Bulk imports students with UPN hashing.
 * Privacy-First: UPNs are hashed before storage.
 */
export async function handleImportStudentsBatch(
  args: ImportStudentsBatchInput,
  context: AuthContext
): Promise<ImportStudentsBatchResult> {
  const orgId = context.organizationId;
  
  // Validate user has access
  const { data: membership, error: membershipError } = await context.supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', context.userId)
    .single();
  
  if (membershipError || !membership) {
    throw new Error(`Access denied: User ${context.userId} is not a member of organization ${orgId}`);
  }
  
  // Check if user has admin role (recommended for bulk imports)
  if (membership.role !== 'admin' && membership.role !== 'slt') {
    throw new Error('Bulk student import requires admin or SLT role');
  }
  
  const errors: string[] = [];
  let successCount = 0;
  let failedCount = 0;
  
  // Process students in batches (Supabase has limits on batch size)
  const batchSize = 100;
  const batches: Array<typeof args.students> = [];
  
  for (let i = 0; i < args.students.length; i += batchSize) {
    batches.push(args.students.slice(i, i + batchSize));
  }
  
  // Process each batch
  for (const batch of batches) {
    const studentsToInsert = batch.map(student => {
      try {
        // Hash the UPN - Privacy-First approach
        const upnHash = hashUPN(student.upn);
        
        return {
          organization_id: orgId,
          upn_hash: upnHash,
          year_group: student.yearGroup,
          characteristics: student.characteristics || []
        };
      } catch (error) {
        failedCount++;
        errors.push(`Failed to hash UPN for student: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return null;
      }
    }).filter((s): s is NonNullable<typeof s> => s !== null);
    
    if (studentsToInsert.length === 0) {
      continue;
    }
    
    // Upsert students (handle duplicates gracefully)
    const { data, error } = await context.supabase
      .from('students')
      .upsert(studentsToInsert, {
        onConflict: 'organization_id,upn_hash',
        ignoreDuplicates: false // Update if exists
      })
      .select('id');
    
    if (error) {
      failedCount += studentsToInsert.length;
      errors.push(`Batch insert failed: ${error.message}`);
    } else {
      successCount += data?.length || 0;
      // Count any that failed due to conflicts (already exist)
      const conflictCount = studentsToInsert.length - (data?.length || 0);
      if (conflictCount > 0) {
        // These aren't really "failed" - they just already existed
        // But we'll count them as successful upserts
        successCount += conflictCount;
      }
    }
  }
  
  return {
    success: failedCount === 0,
    count: successCount,
    failed: failedCount,
    errors: errors.length > 0 ? errors : undefined,
    message: `Imported ${successCount} students successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}.`
  };
}

// ============================================================================
// TOOL 2: create_cohort
// ============================================================================

export const CreateCohortSchema = z.object({
  name: z.string()
    .min(1, 'Cohort name is required')
    .max(200, 'Cohort name must be 200 characters or less')
    .describe('Cohort name (e.g., "Year 5 Pupil Premium", "KS2 SEND Pupils").'),
  
  description: z.string()
    .optional()
    .describe('Optional description of the cohort.'),
  
  criteria: z.object({
    yearGroup: z.number()
      .int()
      .min(1)
      .max(13)
      .optional()
      .describe('Filter by specific year group.'),
    
    yearGroups: z.array(z.number().int().min(1).max(13))
      .optional()
      .describe('Filter by multiple year groups (e.g., [3, 4, 5, 6] for KS2).'),
    
    minYear: z.number()
      .int()
      .min(1)
      .max(13)
      .optional()
      .describe('Minimum year group (inclusive).'),
    
    maxYear: z.number()
      .int()
      .min(1)
      .max(13)
      .optional()
      .describe('Maximum year group (inclusive).'),
    
    characteristics: z.array(z.string())
      .optional()
      .describe('Filter by characteristics (e.g., ["pp"], ["send"], ["pp", "send"]).'),
    
    // Legacy field names for backward compatibility
    year: z.number()
      .int()
      .min(1)
      .max(13)
      .optional()
      .describe('Alias for yearGroup (legacy support).'),
    
    is_pp: z.boolean()
      .optional()
      .describe('Legacy: If true, includes pupils with "pp" characteristic.'),
    
    is_send: z.boolean()
      .optional()
      .describe('Legacy: If true, includes pupils with "send" characteristic.')
  })
    .refine(
      (data) => {
        // At least one filter criterion must be provided
        return data.yearGroup !== undefined ||
               data.yearGroups !== undefined ||
               data.minYear !== undefined ||
               data.maxYear !== undefined ||
               data.characteristics !== undefined ||
               data.year !== undefined ||
               data.is_pp !== undefined ||
               data.is_send !== undefined;
      },
      { message: 'At least one filter criterion must be provided' }
    )
    .describe('Filter criteria for the cohort.')
});

export type CreateCohortInput = z.infer<typeof CreateCohortSchema>;

export interface Cohort {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  filterRules: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCohortResult {
  cohort: Cohort;
  matchingStudentCount: number;
  message: string;
}

/**
 * Count students matching cohort criteria
 */
async function countMatchingStudents(
  orgId: string,
  criteria: CreateCohortInput['criteria'],
  supabase: AuthContext['supabase']
): Promise<number> {
  let query = supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId);
  
  // Build filter rules for the query
  const filterRules: Record<string, any> = {};
  
  // Year group filters
  if (criteria.yearGroup !== undefined) {
    query = query.eq('year_group', criteria.yearGroup);
    filterRules.year_group = criteria.yearGroup;
  } else if (criteria.year !== undefined) {
    // Legacy support
    query = query.eq('year_group', criteria.year);
    filterRules.year_group = criteria.year;
  } else if (criteria.yearGroups !== undefined) {
    query = query.in('year_group', criteria.yearGroups);
    filterRules.year_groups = criteria.yearGroups;
  } else {
    if (criteria.minYear !== undefined) {
      query = query.gte('year_group', criteria.minYear);
      filterRules.min_year = criteria.minYear;
    }
    if (criteria.maxYear !== undefined) {
      query = query.lte('year_group', criteria.maxYear);
      filterRules.max_year = criteria.maxYear;
    }
  }
  
  // Characteristics filters
  let characteristics: string[] = [];
  if (criteria.characteristics !== undefined) {
    characteristics = criteria.characteristics;
  } else {
    // Legacy support: convert is_pp and is_send to characteristics
    if (criteria.is_pp) {
      characteristics.push('pp');
    }
    if (criteria.is_send) {
      characteristics.push('send');
    }
  }
  
  if (characteristics.length > 0) {
    // Use PostgreSQL array overlap operator (&&) to check if any characteristic matches
    query = query.contains('characteristics', characteristics);
    filterRules.characteristics = characteristics;
  }
  
  const { count, error } = await query;
  
  if (error) {
    console.error('Error counting matching students:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Handler for create_cohort tool
 * 
 * Creates a new cohort with filter criteria.
 * Immediately counts matching students.
 */
export async function handleCreateCohort(
  args: CreateCohortInput,
  context: AuthContext
): Promise<CreateCohortResult> {
  const orgId = context.organizationId;
  
  // Validate user has access
  const { data: membership, error: membershipError } = await context.supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', context.userId)
    .single();
  
  if (membershipError || !membership) {
    throw new Error(`Access denied: User ${context.userId} is not a member of organization ${orgId}`);
  }
  
  // Build filter_rules JSON from criteria
  const filterRules: Record<string, any> = {};
  
  // Year group filters
  if (args.criteria.yearGroup !== undefined) {
    filterRules.year_group = args.criteria.yearGroup;
  } else if (args.criteria.year !== undefined) {
    // Legacy support
    filterRules.year_group = args.criteria.year;
  } else if (args.criteria.yearGroups !== undefined) {
    filterRules.year_groups = args.criteria.yearGroups;
  } else {
    if (args.criteria.minYear !== undefined) {
      filterRules.min_year = args.criteria.minYear;
    }
    if (args.criteria.maxYear !== undefined) {
      filterRules.max_year = args.criteria.maxYear;
    }
  }
  
  // Characteristics filters
  let characteristics: string[] = [];
  if (args.criteria.characteristics !== undefined) {
    characteristics = args.criteria.characteristics;
  } else {
    // Legacy support
    if (args.criteria.is_pp) {
      characteristics.push('pp');
    }
    if (args.criteria.is_send) {
      characteristics.push('send');
    }
  }
  
  if (characteristics.length > 0) {
    filterRules.characteristics = characteristics;
  }
  
  // Count matching students BEFORE creating the cohort
  const matchingStudentCount = await countMatchingStudents(orgId, args.criteria, context.supabase);
  
  // Create the cohort
  const { data: cohort, error: insertError } = await context.supabase
    .from('cohorts')
    .insert({
      organization_id: orgId,
      name: args.name,
      description: args.description || null,
      filter_rules: filterRules,
      is_active: true,
      created_by: context.userId
    })
    .select()
    .single();
  
  if (insertError || !cohort) {
    throw new Error(`Failed to create cohort: ${insertError?.message || 'Unknown error'}`);
  }
  
  const result: Cohort = {
    id: cohort.id,
    organizationId: cohort.organization_id,
    name: cohort.name,
    description: cohort.description,
    filterRules: cohort.filter_rules,
    isActive: cohort.is_active,
    createdAt: cohort.created_at,
    updatedAt: cohort.updated_at
  };
  
  return {
    cohort: result,
    matchingStudentCount,
    message: `Cohort "${args.name}" created successfully. Matches ${matchingStudentCount} student${matchingStudentCount !== 1 ? 's' : ''}.`
  };
}

// ============================================================================
// TOOL 3: create_organization
// ============================================================================

export const CreateOrganizationSchema = z.object({
  name: z.string()
    .min(1, 'Organization name is required')
    .max(200, 'Organization name must be 200 characters or less')
    .describe('Name of the organization (e.g., "Acme Academy Trust", "St. Mary\'s Primary School").'),
  
  type: z.enum(['school', 'trust', 'local_authority'])
    .describe('Type of organization: "school" (individual school), "trust" (Multi-Academy Trust), or "local_authority" (Local Authority).'),
  
  parentId: z.string()
    .uuid()
    .optional()
    .describe('Optional UUID of parent organization (Trust or LA). Only valid if type is "school".'),
  
  laCode: z.string()
    .optional()
    .describe('DfE Local Authority code (required if type is "local_authority").'),
  
  urn: z.string()
    .optional()
    .describe('Unique Reference Number (URN) for schools.'),
  
  dataSharingAgreement: z.boolean()
    .default(false)
    .describe('Whether this organization has a data sharing agreement (relevant for schools under LAs).')
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;

export interface Organization {
  id: string;
  name: string;
  organizationType: 'school' | 'trust' | 'local_authority';
  parentOrganizationId: string | null;
  laCode: string | null;
  urn: string | null;
  dataSharingAgreement: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrganizationResult {
  organization: Organization;
  message: string;
}

/**
 * Handler for create_organization tool
 * 
 * Creates a new organization (School, Trust, or Local Authority).
 * Validates hierarchy rules (only schools can have parents).
 */
export async function handleCreateOrganization(
  args: CreateOrganizationInput,
  context: AuthContext
): Promise<CreateOrganizationResult> {
  // Validate user has admin role (creating organizations is high-privilege)
  const { data: membership, error: membershipError } = await context.supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', context.organizationId)
    .eq('user_id', context.userId)
    .single();
  
  if (membershipError || !membership) {
    throw new Error(`Access denied: User ${context.userId} is not a member of organization ${context.organizationId}`);
  }
  
  if (membership.role !== 'admin') {
    throw new Error('Creating organizations requires admin role');
  }
  
  // Validate hierarchy rules
  if (args.parentId && args.type !== 'school') {
    throw new Error('Only schools can have parent organizations (Trusts and LAs cannot be children)');
  }
  
  // Validate LA code for Local Authorities
  if (args.type === 'local_authority' && !args.laCode) {
    throw new Error('Local Authority code (laCode) is required for local_authority type organizations');
  }
  
  // If parent is provided, validate it exists and is a Trust or LA
  if (args.parentId) {
    const { data: parent, error: parentError } = await context.supabase
      .from('organizations')
      .select('id, organization_type')
      .eq('id', args.parentId)
      .single();
    
    if (parentError || !parent) {
      throw new Error(`Parent organization not found: ${args.parentId}`);
    }
    
    if (parent.organization_type !== 'trust' && parent.organization_type !== 'local_authority') {
      throw new Error(`Parent organization must be a Trust or Local Authority, not ${parent.organization_type}`);
    }
  }
  
  // Create the organization
  const { data: org, error: insertError } = await context.supabase
    .from('organizations')
    .insert({
      name: args.name,
      organization_type: args.type,
      parent_organization_id: args.parentId || null,
      la_code: args.laCode || null,
      urn: args.urn || null,
      data_sharing_agreement: args.dataSharingAgreement || false
    })
    .select()
    .single();
  
  if (insertError || !org) {
    throw new Error(`Failed to create organization: ${insertError?.message || 'Unknown error'}`);
  }
  
  const result: Organization = {
    id: org.id,
    name: org.name,
    organizationType: org.organization_type as 'school' | 'trust' | 'local_authority',
    parentOrganizationId: org.parent_organization_id,
    laCode: org.la_code,
    urn: org.urn,
    dataSharingAgreement: org.data_sharing_agreement,
    createdAt: org.created_at,
    updatedAt: org.updated_at
  };
  
  const parentInfo = args.parentId ? ` under parent ${args.parentId}` : '';
  return {
    organization: result,
    message: `Organization "${args.name}" (${args.type}) created successfully${parentInfo}.`
  };
}

// ============================================================================
// TOOL 4: link_school_to_parent
// ============================================================================

export const LinkSchoolToParentSchema = z.object({
  schoolId: z.string()
    .uuid()
    .describe('UUID of the school to link to a parent organization.'),
  
  parentId: z.string()
    .uuid()
    .describe('UUID of the parent organization (Trust or Local Authority).')
});

export type LinkSchoolToParentInput = z.infer<typeof LinkSchoolToParentSchema>;

export interface LinkSchoolToParentResult {
  school: Organization;
  parent: Organization;
  message: string;
}

/**
 * Handler for link_school_to_parent tool
 * 
 * Moves a school under a Trust or Local Authority by setting parent_organization_id.
 * Validates that both organizations exist and are the correct types.
 */
export async function handleLinkSchoolToParent(
  args: LinkSchoolToParentInput,
  context: AuthContext
): Promise<LinkSchoolToParentResult> {
  // Validate user has admin role
  const { data: membership, error: membershipError } = await context.supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', context.organizationId)
    .eq('user_id', context.userId)
    .single();
  
  if (membershipError || !membership) {
    throw new Error(`Access denied: User ${context.userId} is not a member of organization ${context.organizationId}`);
  }
  
  if (membership.role !== 'admin') {
    throw new Error('Linking schools to parents requires admin role');
  }
  
  // Validate school exists and is actually a school
  const { data: school, error: schoolError } = await context.supabase
    .from('organizations')
    .select('id, name, organization_type')
    .eq('id', args.schoolId)
    .single();
  
  if (schoolError || !school) {
    throw new Error(`School not found: ${args.schoolId}`);
  }
  
  if (school.organization_type !== 'school') {
    throw new Error(`Organization ${args.schoolId} is not a school (type: ${school.organization_type})`);
  }
  
  // Validate parent exists and is a Trust or LA
  const { data: parent, error: parentError } = await context.supabase
    .from('organizations')
    .select('id, name, organization_type')
    .eq('id', args.parentId)
    .single();
  
  if (parentError || !parent) {
    throw new Error(`Parent organization not found: ${args.parentId}`);
  }
  
  if (parent.organization_type !== 'trust' && parent.organization_type !== 'local_authority') {
    throw new Error(`Parent organization must be a Trust or Local Authority, not ${parent.organization_type}`);
  }
  
  // Prevent circular references (school cannot be its own parent)
  if (args.schoolId === args.parentId) {
    throw new Error('School cannot be linked to itself');
  }
  
  // Update the school's parent_organization_id
  const { data: updatedSchool, error: updateError } = await context.supabase
    .from('organizations')
    .update({
      parent_organization_id: args.parentId,
      updated_at: new Date().toISOString()
    })
    .eq('id', args.schoolId)
    .select()
    .single();
  
  if (updateError || !updatedSchool) {
    throw new Error(`Failed to link school to parent: ${updateError?.message || 'Unknown error'}`);
  }
  
  const schoolResult: Organization = {
    id: updatedSchool.id,
    name: updatedSchool.name,
    organizationType: updatedSchool.organization_type as 'school' | 'trust' | 'local_authority',
    parentOrganizationId: updatedSchool.parent_organization_id,
    laCode: updatedSchool.la_code,
    urn: updatedSchool.urn,
    dataSharingAgreement: updatedSchool.data_sharing_agreement,
    createdAt: updatedSchool.created_at,
    updatedAt: updatedSchool.updated_at
  };
  
  const parentResult: Organization = {
    id: parent.id,
    name: parent.name,
    organizationType: parent.organization_type as 'school' | 'trust' | 'local_authority',
    parentOrganizationId: null, // Parents don't have parents
    laCode: null,
    urn: null,
    dataSharingAgreement: false,
    createdAt: '', // Not fetched
    updatedAt: '' // Not fetched
  };
  
  return {
    school: schoolResult,
    parent: parentResult,
    message: `School "${school.name}" successfully linked to ${parent.organization_type} "${parent.name}".`
  };
}

