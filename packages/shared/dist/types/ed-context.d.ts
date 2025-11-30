/**
 * Core context interface for Ed across all products
 */
export interface EdContext {
    organizationId: string;
    schoolName: string;
    schoolType?: 'primary' | 'secondary' | 'special' | 'nursery' | 'all-through';
    isChurchSchool?: boolean;
    product: 'parent-chat' | 'staff-tools' | 'schoolgle-platform';
    page?: string;
    category?: string;
    userId?: string;
    userRole?: 'admin' | 'slt' | 'teacher' | 'governor' | 'parent' | 'viewer';
    knowledge?: Record<string, {
        value: string;
        source: 'manual' | 'website_scan' | 'dfe_api';
        lastVerified?: Date;
        confidence?: number;
    }>;
    schoolgleContext?: {
        assessments?: any[];
        gaps?: Gap[];
        recentActivity?: Activity[];
        healthScore?: number;
        evidenceSummary?: EvidenceSummary;
    };
    screenshot?: {
        dataUrl: string;
        timestamp: Date;
        detectedSystem?: 'arbor' | 'bromcom' | 'sims' | 'scholarpack' | 'unknown';
        pageUrl?: string;
    };
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
//# sourceMappingURL=ed-context.d.ts.map