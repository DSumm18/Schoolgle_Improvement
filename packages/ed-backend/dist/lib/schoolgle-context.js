/**
 * Retrieves Schoolgle context data for Ed AI assistant
 * This includes assessments, evidence gaps, recent activity, and health metrics
 */
export async function getSchoolgleContext(supabase, organizationId) {
    try {
        // Fetch assessments with joined subcategory/category data
        const { data: assessmentsData, error: assessmentsError } = await supabase
            .from('ofsted_assessments')
            .select(`
        id,
        subcategory_id,
        school_rating,
        school_rationale,
        ai_rating,
        ai_rationale,
        evidence_count,
        evidence_quality_score,
        ofsted_subcategories!inner (
          id,
          name,
          category_id,
          ofsted_categories!inner (
            id,
            name
          )
        )
      `)
            .eq('organization_id', organizationId)
            .not('school_rating', 'is', null);
        if (assessmentsError) {
            console.error('[Schoolgle Context] Error fetching assessments:', assessmentsError);
        }
        // Transform assessments data
        const assessments = (assessmentsData || []).map((a) => ({
            id: a.id,
            subcategoryId: a.subcategory_id,
            subcategoryName: a.ofsted_subcategories.name,
            categoryId: a.ofsted_subcategories.category_id,
            categoryName: a.ofsted_subcategories.ofsted_categories.name,
            schoolRating: a.school_rating,
            schoolRationale: a.school_rationale,
            aiRating: a.ai_rating,
            aiRationale: a.ai_rationale,
            evidenceCount: a.evidence_count || 0,
            evidenceQualityScore: a.evidence_quality_score
        }));
        // Identify evidence gaps (subcategories with no/low evidence)
        const { data: subcategoriesData } = await supabase
            .from('ofsted_subcategories')
            .select(`
        id,
        name,
        category_id,
        ofsted_categories!inner (
          id,
          name
        )
      `)
            .eq('ofsted_categories.is_active', true);
        const gaps = [];
        for (const subcat of subcategoriesData || []) {
            const subcatAny = subcat;
            const assessment = assessments.find(a => a.subcategoryId === subcatAny.id);
            if (!assessment) {
                gaps.push({
                    subcategoryId: subcatAny.id,
                    subcategoryName: subcatAny.name,
                    categoryId: subcatAny.category_id,
                    categoryName: subcatAny.ofsted_categories.name,
                    gapType: 'no_evidence',
                    suggestions: [`No assessment recorded for ${subcatAny.name}`]
                });
            }
            else if (assessment.evidenceCount < 3) {
                gaps.push({
                    subcategoryId: subcatAny.id,
                    subcategoryName: subcatAny.name,
                    categoryId: subcatAny.category_id,
                    categoryName: subcatAny.ofsted_categories.name,
                    gapType: 'insufficient',
                    suggestions: [`Only ${assessment.evidenceCount} pieces of evidence for ${subcatAny.name}`]
                });
            }
            else if (assessment.evidenceQualityScore && assessment.evidenceQualityScore < 0.6) {
                gaps.push({
                    subcategoryId: subcatAny.id,
                    subcategoryName: subcatAny.name,
                    categoryId: subcatAny.category_id,
                    categoryName: subcatAny.ofsted_categories.name,
                    gapType: 'low_quality',
                    suggestions: [`Evidence quality score is ${assessment.evidenceQualityScore.toFixed(2)} for ${subcatAny.name}`]
                });
            }
        }
        // Fetch recent activity (last 20 items)
        const { data: activityData, error: activityError } = await supabase
            .from('activity_log')
            .select('id, action_type, entity_type, entity_name, description, user_name, created_at')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .limit(20);
        if (activityError) {
            console.error('[Schoolgle Context] Error fetching activity:', activityError);
        }
        const recentActivity = (activityData || []).map((a) => ({
            id: a.id,
            actionType: a.action_type,
            entityType: a.entity_type,
            entityName: a.entity_name || '',
            description: a.description || '',
            userName: a.user_name || 'Unknown',
            createdAt: a.created_at
        }));
        // Fetch evidence summary
        const { count: documentsCount } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId);
        const { count: matchesCount } = await supabase
            .from('evidence_matches')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', organizationId);
        const { data: lastScan } = await supabase
            .from('scan_jobs')
            .select('completed_at')
            .eq('organization_id', organizationId)
            .eq('status', 'complete')
            .order('completed_at', { ascending: false })
            .limit(1)
            .single();
        // Calculate category coverage
        const { data: categoryMatchCounts } = await supabase
            .from('evidence_matches')
            .select('category_id')
            .eq('organization_id', organizationId);
        const categoryCoverage = {};
        for (const match of categoryMatchCounts || []) {
            const matchAny = match;
            categoryCoverage[matchAny.category_id] = (categoryCoverage[matchAny.category_id] || 0) + 1;
        }
        const evidenceSummary = {
            totalDocuments: documentsCount || 0,
            totalMatches: matchesCount || 0,
            categoryCoverage,
            lastScanned: lastScan?.completed_at
        };
        // Calculate health score (simple average of assessment ratings)
        let healthScore;
        if (assessments.length > 0) {
            const ratingValues = {
                'exceptional': 4,
                'strong_standard': 3,
                'expected_standard': 2,
                'needs_attention': 1,
                'urgent_improvement': 0
            };
            const totalScore = assessments.reduce((sum, a) => {
                const rating = a.schoolRating || a.aiRating;
                return sum + (rating ? ratingValues[rating] || 2 : 2);
            }, 0);
            healthScore = (totalScore / assessments.length) / 4 * 100; // Convert to 0-100 scale
        }
        return {
            assessments,
            gaps,
            recentActivity,
            healthScore,
            evidenceSummary
        };
    }
    catch (error) {
        console.error('[Schoolgle Context] Unexpected error:', error);
        // Return empty context on error
        return {
            assessments: [],
            gaps: [],
            recentActivity: [],
            healthScore: undefined,
            evidenceSummary: undefined
        };
    }
}
