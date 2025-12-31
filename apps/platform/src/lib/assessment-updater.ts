import { calculateAIRating, OFSTED_FRAMEWORK, type Category } from './ofsted-framework';
import type { EvidenceMatch } from './ai-evidence-matcher';

// --- Types ---

export interface AssessmentUpdate {
    subcategoryId: string;
    aiRating: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_assessed';
    aiRatingRaw: 'exceptional' | 'strong_standard' | 'expected_standard' | 'needs_attention' | 'urgent_improvement' | 'not_assessed';
    aiRationale: string;
    evidenceCount: number;
    requiredCount: number;
    evidencePercentage: number;
}

export interface AssessmentUpdates {
    [subcategoryId: string]: AssessmentUpdate;
}

export interface CategorySummary {
    categoryId: string;
    categoryName: string;
    subcategoriesUpdated: number;
    averageRating: string;
    totalEvidenceFound: number;
    readinessPercentage: number;
}

// --- Helper Functions ---

/**
 * Group evidence matches by subcategory
 */
function groupBySubcategory(matches: EvidenceMatch[]): Map<string, EvidenceMatch[]> {
    const grouped = new Map<string, EvidenceMatch[]>();

    matches.forEach(match => {
        const key = match.subcategoryId;
        if (!grouped.has(key)) {
            grouped.set(key, []);
        }
        grouped.get(key)!.push(match);
    });

    return grouped;
}

/**
 * Count unique evidence items found for a subcategory
 */
function countUniqueEvidence(matches: EvidenceMatch[]): Map<string, number> {
    const evidenceCounts = new Map<string, number>();

    matches.forEach(match => {
        const item = match.evidenceItem;
        evidenceCounts.set(item, (evidenceCounts.get(item) || 0) + 1);
    });

    return evidenceCounts;
}

/**
 * Generate AI rationale based on evidence found
 */
function generateRationale(
    subcategoryName: string,
    evidenceRequired: string[],
    matchesForSubcategory: EvidenceMatch[]
): string {
    const evidenceCounts = countUniqueEvidence(matchesForSubcategory);
    const foundItems: string[] = [];
    const missingItems: string[] = [];

    evidenceRequired.forEach(item => {
        if (evidenceCounts.has(item)) {
            const count = evidenceCounts.get(item)!;
            foundItems.push(`${item} (${count} document${count > 1 ? 's' : ''})`);
        } else {
            missingItems.push(item);
        }
    });

    let rationale = `**Evidence Analysis for ${subcategoryName}:**\n\n`;

    if (foundItems.length > 0) {
        rationale += `✅ **Found Evidence:**\n`;
        foundItems.forEach(item => {
            rationale += `- ${item}\n`;
        });
    }

    if (missingItems.length > 0) {
        rationale += `\n❌ **Missing Evidence:**\n`;
        missingItems.forEach(item => {
            rationale += `- ${item}\n`;
        });
    }

    const percentage = (foundItems.length / evidenceRequired.length) * 100;
    rationale += `\n**Coverage:** ${foundItems.length}/${evidenceRequired.length} items (${Math.round(percentage)}%)`;

    // Add high-confidence matches with quotes
    const highConfidenceMatches = matchesForSubcategory
        .filter(m => m.confidence >= 0.8)
        .slice(0, 3);

    if (highConfidenceMatches.length > 0) {
        rationale += `\n\n**Key Documents:**\n`;
        highConfidenceMatches.forEach(match => {
            rationale += `- ${match.documentName}: ${match.relevanceExplanation}\n`;
        });
    }

    return rationale;
}

/**
 * Get grade text from rating
 */
function getGradeText(rating: string): string {
    switch (rating) {
        case 'outstanding': return 'Outstanding';
        case 'good': return 'Good';
        case 'requires_improvement': return 'Requires Improvement';
        case 'inadequate': return 'Inadequate';
        default: return 'Not Assessed';
    }
}

// --- Main Functions ---

/**
 * Update assessments based on evidence found
 * @param evidenceMatches - All evidence matches from scanning
 * @returns Assessment updates keyed by subcategory ID
 */
export function updateAssessmentsFromEvidence(
    evidenceMatches: EvidenceMatch[]
): AssessmentUpdates {
    const updates: AssessmentUpdates = {};

    // Group matches by subcategory
    const groupedMatches = groupBySubcategory(evidenceMatches);

    // Process each subcategory that has evidence  
    OFSTED_FRAMEWORK.forEach(category => {
        category.subcategories.forEach(subcategory => {
            const matchesForSubcategory = groupedMatches.get(subcategory.id) || [];

            // Only update if we found evidence
            if (matchesForSubcategory.length > 0) {
                // Count unique evidence items found
                const evidenceCounts = countUniqueEvidence(matchesForSubcategory);
                const evidenceCount = evidenceCounts.size;
                const requiredCount = subcategory.evidenceRequired.length;

                // Calculate AI rating based on evidence percentage
                const aiRating = calculateAIRating(evidenceCount, requiredCount);

                // Generate rationale
                const aiRationale = generateRationale(
                    subcategory.name,
                    subcategory.evidenceRequired.map(e => e.name), // Convert EvidenceItem[] to string[]
                    matchesForSubcategory
                );

                // Store update
                // Map new 5-point scale to old 4-point scale for compatibility
                const mappedRating = aiRating === 'exceptional' || aiRating === 'strong_standard' ? 'outstanding' :
                    aiRating === 'expected_standard' ? 'good' :
                        aiRating === 'needs_attention' ? 'requires_improvement' :
                            aiRating === 'urgent_improvement' ? 'inadequate' : 'not_assessed';

                updates[subcategory.id] = {
                    subcategoryId: subcategory.id,
                    aiRating: mappedRating as 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_assessed',
                    aiRatingRaw: aiRating as 'exceptional' | 'strong_standard' | 'expected_standard' | 'needs_attention' | 'urgent_improvement' | 'not_assessed',
                    aiRationale,
                    evidenceCount,
                    requiredCount,
                    evidencePercentage: (evidenceCount / requiredCount) * 100
                };
            }
        });
    });

    return updates;
}

/**
 * Generate category-level summaries
 */
export function generateCategorySummaries(
    assessmentUpdates: AssessmentUpdates
): CategorySummary[] {
    const summaries: CategorySummary[] = [];

    OFSTED_FRAMEWORK.forEach(category => {
        const subcategoryIds = category.subcategories.map(s => s.id);
        const updatedSubcategories = subcategoryIds.filter(id => assessmentUpdates[id]);

        if (updatedSubcategories.length === 0) {
            return; // Skip categories with no updates
        }

        // Calculate average rating (numerical)
        const ratingValues = updatedSubcategories.map(id => {
            const rating = assessmentUpdates[id].aiRating;
            switch (rating) {
                case 'outstanding': return 4;
                case 'good': return 3;
                case 'requires_improvement': return 2;
                case 'inadequate': return 1;
                default: return 0;
            }
        });

        const avgValue = ratingValues.reduce((a: number, b: number) => a + b, 0) / ratingValues.length;
        let averageRating = 'Not Assessed';
        if (avgValue >= 3.5) averageRating = 'Outstanding';
        else if (avgValue >= 2.5) averageRating = 'Good';
        else if (avgValue >= 1.5) averageRating = 'Requires Improvement';
        else if (avgValue >= 0.5) averageRating = 'Inadequate';

        // Count total evidence
        const totalEvidenceFound = updatedSubcategories.reduce((sum, id) => {
            return sum + assessmentUpdates[id].evidenceCount;
        }, 0);

        // Calculate readiness percentage
        const totalRequired = updatedSubcategories.reduce((sum, id) => {
            return sum + assessmentUpdates[id].requiredCount;
        }, 0);

        const readinessPercentage = totalRequired > 0
            ? (totalEvidenceFound / totalRequired) * 100
            : 0;

        summaries.push({
            categoryId: category.id,
            categoryName: category.name,
            subcategoriesUpdated: updatedSubcategories.length,
            averageRating,
            totalEvidenceFound,
            readinessPercentage: Math.round(readinessPercentage)
        });
    });

    return summaries;
}

export interface FormattedAssessment {
    aiRating: 'outstanding' | 'good' | 'requires_improvement' | 'inadequate' | 'not_assessed';
    aiRationale: string;
    evidenceCount: number;
    requiredCount: number;
    evidencePercentage: number;
    schoolRating?: string;
    schoolRationale?: string;
}

/**
 * Format assessment updates for frontend consumption
 */
export function formatAssessmentUpdatesForFrontend(
    assessmentUpdates: AssessmentUpdates
): Record<string, FormattedAssessment> {
    const formatted: Record<string, FormattedAssessment> = {};

    Object.entries(assessmentUpdates).forEach(([subcategoryId, update]) => {
        formatted[subcategoryId] = {
            aiRating: update.aiRating,
            aiRationale: update.aiRationale,
            evidenceCount: update.evidenceCount,
            requiredCount: update.requiredCount,
            evidencePercentage: Math.round(update.evidencePercentage),
            // Preserve existing school rating if any
            schoolRating: undefined, // Will be merged with existing data
            schoolRationale: undefined
        };
    });

    return formatted;
}

/**
 * Generate markdown summary report
 */
export function generateSummaryReport(
    assessmentUpdates: AssessmentUpdates,
    categorySummaries: CategorySummary[]
): string {
    let report = '# Ofsted Evidence Scan Summary\n\n';
    report += `**Scan Date:** ${new Date().toLocaleDateString()}\n\n`;

    // Overall stats
    const totalSubcategories = Object.keys(assessmentUpdates).length;
    const totalEvidence = Object.values(assessmentUpdates).reduce((sum, u) => sum + u.evidenceCount, 0);

    report += `## Overview\n\n`;
    report += `- **Subcategories Updated:** ${totalSubcategories}\n`;
    report += `- **Total Evidence Found:** ${totalEvidence} documents\n\n`;

    // Category breakdowns
    report += `## Category Summaries\n\n`;

    categorySummaries.forEach(summary => {
        report += `### ${summary.categoryName}\n\n`;
        report += `- **Readiness:** ${summary.readinessPercentage}%\n`;
        report += `- **Average Rating:** ${summary.averageRating}\n`;
        report += `- **Evidence Found:** ${summary.totalEvidenceFound} documents\n`;
        report += `- **Subcategories Updated:** ${summary.subcategoriesUpdated}\n\n`;
    });

    // Detailed breakdowns
    report += `## Detailed Evidence Analysis\n\n`;

    OFSTED_FRAMEWORK.forEach(category => {
        const hasUpdates = category.subcategories.some(s => assessmentUpdates[s.id]);

        if (hasUpdates) {
            report += `### ${category.name}\n\n`;

            category.subcategories.forEach(subcategory => {
                const update = assessmentUpdates[subcategory.id];

                if (update) {
                    report += `#### ${subcategory.name} - ${getGradeText(update.aiRating)}\n\n`;
                    report += update.aiRationale + '\n\n';
                }
            });
        }
    });

    return report;
}
