import type { SupabaseClient } from '@supabase/supabase-js';
export interface SchoolgleContextData {
    assessments: Assessment[];
    gaps: EvidenceGap[];
    recentActivity: Activity[];
    healthScore?: number;
    evidenceSummary?: EvidenceSummary;
}
export interface Assessment {
    id: string;
    subcategoryId: string;
    subcategoryName: string;
    categoryId: string;
    categoryName: string;
    schoolRating?: string;
    schoolRationale?: string;
    aiRating?: string;
    aiRationale?: string;
    evidenceCount: number;
    evidenceQualityScore?: number;
}
export interface EvidenceGap {
    subcategoryId: string;
    subcategoryName: string;
    categoryId: string;
    categoryName: string;
    gapType: 'no_evidence' | 'low_quality' | 'insufficient';
    suggestions: string[];
}
export interface Activity {
    id: string;
    actionType: string;
    entityType: string;
    entityName: string;
    description: string;
    userName: string;
    createdAt: string;
}
export interface EvidenceSummary {
    totalDocuments: number;
    totalMatches: number;
    categoryCoverage: {
        [categoryId: string]: number;
    };
    lastScanned?: string;
}
/**
 * Retrieves Schoolgle context data for Ed AI assistant
 * This includes assessments, evidence gaps, recent activity, and health metrics
 */
export declare function getSchoolgleContext(supabase: SupabaseClient, organizationId: string): Promise<SchoolgleContextData>;
//# sourceMappingURL=schoolgle-context.d.ts.map