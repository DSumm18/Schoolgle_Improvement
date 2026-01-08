import { OFSTED_FRAMEWORK, type ActionItem } from './ofsted-framework';
import type { EvidenceMatch } from './ai-evidence-matcher';
import type { AssessmentUpdates } from './assessment-updater';
import { v4 as uuidv4 } from 'uuid';

export interface SmartTaskOptions {
    organizationId: string;
    userId: string;
    authId?: string;
}

/**
 * Auto-generates tasks based on evidence gaps, outdated documents, and critical AI ratings
 */
export function generateSmartTasks(
    assessmentUpdates: AssessmentUpdates,
    allMatches: EvidenceMatch[],
    options: SmartTaskOptions
): any[] {
    const tasks: any[] = [];
    const { organizationId, userId, authId } = options;
    const now = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(now.getMonth() - 12);

    // Track which items we've already generated tasks for to avoid duplicates
    const generatedKeys = new Set<string>();

    // 1. Identify missing evidence items (Coverage gap)
    OFSTED_FRAMEWORK.forEach(category => {
        category.subcategories.forEach(sub => {
            const update = assessmentUpdates[sub.id];

            // Focus on subcategories with low coverage OR no assessment yet
            const coverage = update?.evidencePercentage ?? 0;

            if (coverage < 70) {
                // Determine missing items
                sub.evidenceRequired.forEach(requiredItem => {
                    const hasMatch = allMatches.some(m =>
                        m.subcategoryId === sub.id &&
                        m.evidenceItem === requiredItem.name
                    );

                    if (!hasMatch) {
                        const isPolicy = requiredItem.name.toLowerCase().includes('policy') ||
                            requiredItem.name.toLowerCase().includes('strategy') ||
                            requiredItem.name.toLowerCase().includes('statutory');

                        const taskKey = `${sub.id}_${requiredItem.id}`;
                        if (generatedKeys.has(taskKey)) return;

                        tasks.push({
                            organization_id: organizationId,
                            user_id: userId,
                            auth_id: authId,
                            framework_type: 'ofsted',
                            category_id: category.id,
                            subcategory_id: sub.id,
                            title: isPolicy ? `Critical: Policy Missing - ${requiredItem.name}` : `Upload Evidence: ${requiredItem.name}`,
                            description: isPolicy
                                ? `The statutory policy "${requiredItem.name}" for ${sub.name} appears to be missing. This is a critical compliance requirement.`
                                : `Evidence gap identified for ${sub.name}: ${requiredItem.description}. This document is recommended for Ofsted inspections.`,
                            priority: isPolicy ? 'critical' : 'high',
                            status: 'draft',
                            due_date: new Date(Date.now() + (isPolicy ? 7 : 14) * 24 * 60 * 60 * 1000).toISOString(),
                            source: 'scan_gap',
                            created_at: new Date().toISOString()
                        });
                        generatedKeys.add(taskKey);
                    }
                });
            }
        });
    });

    // 2. Identify outdated documents (> 12 months)
    const processedDocs = new Set<string>();
    allMatches.forEach(match => {
        if (match.documentModifiedTime && !processedDocs.has(match.documentId)) {
            const modDate = new Date(match.documentModifiedTime);
            if (modDate < twelveMonthsAgo) {
                const docAgeMonths = Math.floor((now.getTime() - modDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

                tasks.push({
                    organization_id: organizationId,
                    user_id: userId,
                    auth_id: authId,
                    framework_type: 'ofsted',
                    category_id: match.categoryId,
                    subcategory_id: match.subcategoryId,
                    title: `Review Outdated Document: ${match.documentName}`,
                    description: `The document "${match.documentName}" is ${docAgeMonths} months old (Last modified: ${modDate.toLocaleDateString()}). Ofsted evidence guidelines suggest reviewing documents every 12 months to ensure accuracy and relevance.`,
                    priority: 'medium',
                    status: 'draft',
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    source: 'scan_gap',
                    linked_evidence: [
                        { documentId: match.documentId, documentName: match.documentName, matchedAt: match.matchedAt }
                    ],
                    created_at: new Date().toISOString()
                });
                processedDocs.add(match.documentId);
            }
        }
    });

    // 3. Subcategories with CRITICAL low rating
    Object.values(assessmentUpdates).forEach(update => {
        if (update.aiRating === 'requires_improvement' || update.aiRating === 'inadequate' || update.aiRating === 'urgent_improvement') {
            // Find category for this subcategory
            let categoryId = '';
            for (const cat of OFSTED_FRAMEWORK) {
                if (cat.subcategories.some(s => s.id === update.subcategoryId)) {
                    categoryId = cat.id;
                    break;
                }
            }

            const taskKey = `crit_${update.subcategoryId}`;
            if (generatedKeys.has(taskKey)) return;

            tasks.push({
                organization_id: organizationId,
                user_id: userId,
                auth_id: authId,
                framework_type: 'ofsted',
                category_id: categoryId,
                subcategory_id: update.subcategoryId,
                title: `Strategic Intervention: ${update.subcategoryId}`,
                description: `AI assessment has flagged "${update.subcategoryId}" as ${update.aiRating.replace('_', ' ').toUpperCase()}. Rationale: ${update.aiRationale || 'Insufficient evidence to meet standard.'}. A leadership review and remediation plan are required.`,
                priority: 'critical',
                status: 'draft',
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                source: 'scan_gap',
                created_at: new Date().toISOString()
            });
            generatedKeys.add(taskKey);
        }
    });

    // Deduplicate and cap the number of suggested tasks to avoid overwhelming the user
    // We prioritize critical then high
    const sortedTasks = tasks.sort((a, b) => {
        const pMap: any = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
        return pMap[a.priority] - pMap[b.priority];
    });

    // Cap at 15 smartest tasks per scan
    return sortedTasks.slice(0, 15);
}
