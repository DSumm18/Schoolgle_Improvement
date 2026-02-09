// =====================================================
// Ofsted Framework - Main Export File
// EIF 2025 - 4 Key Judgements
// =====================================================

// Export the new types (4-category EIF 2025)
export type {
    OfstedCategoryId,
    OfstedSubCategoryId,
    OfstedRating,
    OfstedRatingWithNotAssessed,
    ConfidenceLevel,
    // Database types
    OfstedAssessment,
    OfstedEvidenceItem,
    OfstedEvidenceMatch,
    OfstedReadinessSnapshot,
    OfstedGapDetail,
    // Aggregated types
    OfstedAssessmentWithSubcategory,
    OfstedCategorySummary,
    OfstedGapsAnalysis,
    OfstedOverallReadiness,
    // API types
    GetOfstedAssessmentsRequest,
    GetOfstedAssessmentsResponse,
    UpsertOfstedAssessmentRequest,
    UpsertOfstedAssessmentResponse,
    GetOfstedEvidenceRequest,
    GetOfstedEvidenceResponse,
    GetOfstedReadinessRequest,
    GetOfstedReadinessResponse,
    MatchOfstedDocumentRequest,
    MatchOfstedDocumentResponse,
    // UI helper types
    OfstedCategoryDisplay,
    OfstedSubcategoryDisplay,
    OfstedFilterOptions,
} from './ofsted/types';

// Export framework constants
export {
    OFSTED_JUDGEMENTS,
    OFSTED_SUBCATEGORIES,
} from './ofsted/types';

// Import and re-export framework data (with evidence requirements)
export {
    OFSTED_FRAMEWORK_DATA,
    SAFEGUARDING_REQUIREMENTS,
    getCategory,
    getSubcategory,
    getCategoryEvidenceRequirements,
    getSubcategories,
} from './ofsted/framework-data';

// Export old framework for backwards compatibility (deprecated)
export {
    OFSTED_FRAMEWORK,
    OFSTED_RATINGS,
    SAFEGUARDING_STATUS,
    SAFEGUARDING_FRAMEWORK,
    calculateAIRating,
    calculateCategoryReadiness,
    calculateOverallReadiness,
} from './ofsted-framework';

export type { Category, SubCategory, EvidenceItem, ActionItem, OfstedAssessment as OldOfstedAssessment } from './ofsted-framework';

// =====================================================
// HELPER EXPORTS
// =====================================================

// Import for default export
import { OFSTED_FRAMEWORK_DATA, type Category as FrameworkCategory, type SubCategory as FrameworkSubCategory } from './ofsted/framework-data';
export default OFSTED_FRAMEWORK_DATA;

// Import the 6-category framework for CATEGORY_SUBCATEGORIES
import { OFSTED_FRAMEWORK } from './ofsted-framework';

// Re-export as CATEGORY_SUBCATEGORIES for compatibility with existing components
// Built from the 6-category framework (OFSTED_FRAMEWORK) which is what the UI uses
export const CATEGORY_SUBCATEGORIES: Record<string, {
    id: string;
    categoryId: string;
    name: string;
    description: string;
    evidenceRequired: any[];
    keyIndicators: string[];
    inspectionFocus: string[];
}[]> = {};

OFSTED_FRAMEWORK.forEach(category => {
    CATEGORY_SUBCATEGORIES[category.id] = category.subcategories.map(sub => ({
        id: sub.id,
        categoryId: category.id,
        name: sub.name,
        description: sub.description,
        evidenceRequired: sub.evidenceRequired,
        keyIndicators: sub.keyIndicators,
        inspectionFocus: sub.inspectionFocus,
    }));
});

// Category info for UI - built from the 6-category framework
export const CATEGORY_INFO: Record<string, { name: string; description: string; color: string; icon: string; shortName: string }> = {};

OFSTED_FRAMEWORK.forEach(category => {
    CATEGORY_INFO[category.id] = {
        name: category.name,
        shortName: category.name.split(' ')[0], // First word as short name
        description: category.description,
        color: category.color,
        icon: getCategoryIcon(category.id),
    };
});

function getCategoryIcon(categoryId: string): string {
    const icons: Record<string, string> = {
        'inclusion': '🤝',
        'curriculum-teaching': '📚',
        'achievement': '📈',
        'attendance-behaviour': '📋',
        'personal-development': '🌱',
        'leadership-governance': '🏛️',
        'safeguarding': '🛡️',
    };
    return icons[categoryId] || '📄';
}

// Rating info
export const OFSTED_RATING_INFO: Record<'exceptional' | 'strong_standard' | 'expected_standard' | 'needs_attention' | 'urgent_improvement', { label: string; color: string; textColor: string; description: string; score: number }> = {
    exceptional: {
        label: 'Exceptional',
        color: 'bg-purple-500',
        textColor: 'text-purple-700',
        description: 'Highest quality provision',
        score: 5
    },
    strong_standard: {
        label: 'Strong Standard',
        color: 'bg-green-500',
        textColor: 'text-green-700',
        description: 'Above expected standards',
        score: 4
    },
    expected_standard: {
        label: 'Expected Standard',
        color: 'bg-blue-500',
        textColor: 'text-blue-700',
        description: 'Meets all required standards',
        score: 3
    },
    needs_attention: {
        label: 'Needs Attention',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700',
        description: 'Some aspects inconsistent or limited',
        score: 2
    },
    urgent_improvement: {
        label: 'Urgent Improvement',
        color: 'bg-red-500',
        textColor: 'text-red-700',
        description: 'Requires immediate action',
        score: 1
    }
};
