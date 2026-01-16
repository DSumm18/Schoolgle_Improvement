/**
 * Represents a single assessment or activity within a KPI category.
 */
export interface Assessment {
    name: string;
    score: number;
}

/**
 * Represents a category of Key Performance Indicators (KPIs) for a school,
 * containing multiple assessments.
 */
export interface KpiCategory {
    categoryName: string;
    average: number;
    assessments: Assessment[];
}

/**
 * Represents all the performance data for a single school.
 */
export interface SchoolData {
    id: string; // Using school name as the unique ID
    name: string;
    overallScore: number;
    categories: KpiCategory[];
    logoUrl: string | null;
}
