/**
 * Centralized Validation Schemas using Zod
 * Security & Validation Specialist - Agent 6
 */

import { z } from 'zod';

// ============================================================================
// Common Validators
// ============================================================================

/**
 * UUID validation
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Email validation
 */
export const emailSchema = z.string().email('Invalid email address').max(255);

/**
 * Non-empty string validation with max length
 */
export const nonEmptyString = (maxLength = 255) =>
  z.string().min(1, 'Field cannot be empty').max(maxLength, `Maximum ${maxLength} characters allowed`);

/**
 * Sanitize string to prevent XSS
 */
export const sanitizedString = (maxLength = 255) =>
  nonEmptyString(maxLength).transform(val => {
    // Basic XSS prevention - strip potentially dangerous characters
    return val.replace(/[<>]/g, '');
  });

/**
 * URL validation
 */
export const urlSchema = z.string().url('Invalid URL format').max(2048);

/**
 * Provider validation
 */
export const cloudProviderSchema = z.enum(['google.com', 'microsoft.com'] as [string, ...string[]]);

/**
 * Role validation
 */
export const roleSchema = z.enum(['admin', 'member', 'viewer'] as [string, ...string[]]);

/**
 * Confidence score validation (0-1)
 */
export const confidenceSchema = z.number().min(0).max(1);

// ============================================================================
// API Route Schemas
// ============================================================================

/**
 * /api/scan - Evidence scanning request
 */
export const scanRequestSchema = z.object({
  provider: cloudProviderSchema,
  accessToken: nonEmptyString(2048),
  folderId: nonEmptyString(512),
  organizationId: uuidSchema, // Mandatory for tenant isolation
  userId: z.string().optional(), // Legacy text ID
  authId: uuidSchema.optional(), // Canonical UUID
  recursive: z.boolean().default(true),
  maxFiles: z.number().int().min(1).max(500).default(50),
  useAI: z.boolean().default(true)
});

export type ScanRequest = z.infer<typeof scanRequestSchema>;

/**
 * /api/evidence - Evidence retrieval request
 */
export const evidenceRequestSchema = z.object({
  userId: uuidSchema,
  subcategoryId: sanitizedString(100),
  evidenceItem: sanitizedString(500).optional()
});

export type EvidenceRequest = z.infer<typeof evidenceRequestSchema>;

/**
 * /api/search - Semantic search request
 */
export const searchRequestSchema = z.object({
  query: sanitizedString(500),
  userId: uuidSchema.optional(),
  matchThreshold: z.number().min(0).max(1).default(0.5),
  matchCount: z.number().int().min(1).max(50).default(5)
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

/**
 * /api/organization/create - Organization creation request
 */
export const createOrganizationSchema = z.object({
  name: sanitizedString(255),
  userId: z.string(), // Legacy text ID
  authId: uuidSchema.optional(), // Canonical UUID
  urn: z.string().min(6).max(10).optional()
});

export type CreateOrganizationRequest = z.infer<typeof createOrganizationSchema>;

/**
 * /api/organization/invite - Organization invitation request
 */
export const inviteUserSchema = z.object({
  email: emailSchema,
  role: roleSchema,
  organizationId: uuidSchema,
  invitedBy: uuidSchema
});

export type InviteUserRequest = z.infer<typeof inviteUserSchema>;

/**
 * /api/voice/transcribe - Voice transcription request
 * File is handled separately via FormData
 */
export const transcribeRequestSchema = z.object({
  audioFile: z.instanceof(File, { message: 'Audio file is required' })
    .refine(file => file.size <= 25 * 1024 * 1024, 'File size must be less than 25MB')
    .refine(
      file => ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/m4a'].includes(file.type),
      'Invalid audio format. Supported: WAV, MP3, WEBM, M4A'
    )
});

export type TranscribeRequest = z.infer<typeof transcribeRequestSchema>;

/**
 * /api/voice/process-observation - Process observation transcript
 */
export const processObservationSchema = z.object({
  transcript: nonEmptyString(50000),
  teacherName: sanitizedString(255).optional(),
  subject: sanitizedString(100).optional(),
  yearGroup: sanitizedString(50).optional()
});

export type ProcessObservationRequest = z.infer<typeof processObservationSchema>;

/**
 * /api/usage/track - Usage tracking event
 */
export const trackUsageSchema = z.object({
  organizationId: uuidSchema,
  userId: uuidSchema.optional(),
  eventType: z.enum([
    'page_view',
    'ai_chat',
    'ed_chat',
    'report_generated',
    'action_created',
    'action_completed',
    'assessment_updated',
    'document_uploaded',
    'voice_observation',
    'mock_inspection'
  ]),
  eventCategory: sanitizedString(100).optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  sessionId: sanitizedString(100).optional(),
  aiModel: sanitizedString(100).optional(),
  aiTokensInput: z.number().int().min(0).optional(),
  aiTokensOutput: z.number().int().min(0).optional(),
  aiCostUsd: z.number().min(0).optional()
});

export type TrackUsageRequest = z.infer<typeof trackUsageSchema>;

/**
 * /api/ed/chat - Ed AI chat request
 */
export const edChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: sanitizedString(10000)
    })
  ).min(1, 'At least one message is required').max(50, 'Maximum 50 messages allowed'),
  context: z.record(z.string(), z.any()).optional()
});

export type EdChatRequest = z.infer<typeof edChatRequestSchema>;

/**
 * /api/gdpr/delete - GDPR data deletion request
 */
export const gdprDeleteSchema = z.object({
  userId: uuidSchema,
  confirmDeletion: z.literal(true).refine(val => val === true, {
    message: 'You must confirm deletion by setting confirmDeletion to true'
  })
});

export type GdprDeleteRequest = z.infer<typeof gdprDeleteSchema>;

/**
 * /api/gdpr/delete (DELETE) - Organization deletion request
 */
export const gdprDeleteOrgSchema = z.object({
  organizationId: uuidSchema,
  adminUserId: uuidSchema,
  confirmDeletion: z.literal(true).refine(val => val === true, {
    message: 'You must confirm deletion by setting confirmDeletion to true'
  })
});

export type GdprDeleteOrgRequest = z.infer<typeof gdprDeleteOrgSchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate request body and return typed data or error response
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details?: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Format validation errors
  const errorMessages = result.error.issues.map((err: any) =>
    `${err.path.join('.')}: ${err.message}`
  ).join(', ');

  return {
    success: false,
    error: `Validation failed: ${errorMessages}`,
    details: result.error
  };
}

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize object with unknown keys
 */
export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
