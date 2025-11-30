/**
 * Core context interface for Ed across all products
 */
export interface EdContext {
  // Organization
  organizationId: string;
  schoolName: string;
  schoolType?: 'primary' | 'secondary' | 'special' | 'nursery' | 'all-through';
  isChurchSchool?: boolean;
  
  // Product identification
  product: 'parent-chat' | 'staff-tools' | 'schoolgle-platform';
  page?: string;
  category?: string;
  
  // User context
  userId?: string;
  userRole?: 'admin' | 'slt' | 'teacher' | 'governor' | 'parent' | 'viewer';
  
  // School Knowledge (Products 1 & 3)
  knowledge?: Record<string, {
    value: string;
    source: 'manual' | 'website_scan' | 'dfe_api';
    lastVerified?: Date;
    confidence?: number;
  }>;
  
  // Schoolgle Data (Product 3 only)
  schoolgleContext?: {
    assessments?: any[]; // Will type properly later
    gaps?: Gap[];
    recentActivity?: Activity[];
    healthScore?: number;
    evidenceSummary?: EvidenceSummary;
  };
  
  // Screen Capture (Product 2 only)
  screenshot?: {
    dataUrl: string;
    timestamp: Date;
    detectedSystem?: 'arbor' | 'bromcom' | 'sims' | 'scholarpack' | 'unknown';
    pageUrl?: string;
  };
  
  // Conversation
  conversationId?: string;
  previousMessages?: Message[];
}

export interface Gap {
  area: string;
  subcategory: string;
  severity: 'critical' | 'important' | 'recommended';
  evidenceNeeded: string[];
  description?: string;
}

export interface Activity {
  type: 'scan' | 'observation' | 'action_created' | 'report_generated';
  timestamp: Date;
  summary: string;
  metadata?: Record<string, any>;
}

export interface EvidenceSummary {
  totalDocuments: number;
  evidenceMatches: number;
  byCategory: Record<string, {
    evidenceCount: number;
    avgConfidence: number;
    topDocuments: Array<{
      name: string;
      link: string;
      matchCount: number;
    }>;
  }>;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}
