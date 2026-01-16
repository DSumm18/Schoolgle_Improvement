import { useState, useEffect } from 'react';
import type { SchoolData, KpiCategory, Assessment } from '@/types/estates-audit';
import { config } from '@/lib/estates-audit/config';
import { DEMO_SCHOOLS } from '@/lib/estates-audit/demo-data';

const IGNORED_SHEET_NAMES = ['LOGOS', 'PIVOT', 'OVERVIEW', 'RATINGS', 'SUMMARY', 'REPORT', 'ANALYSIS', 'CHART', 'DASHBOARD'];

const RATING_TO_SCORE: Record<string, number> = {
    'ADVANCED': 100,
    'FULLY EFFECTIVE': 75,
    'TRANSITIONING': 50,
    'BASELINE': 25,
};

const parseSheetData = (sheetTitle: string, rows: any[][]): SchoolData | null => {
    // Check for header and at least one data row
    if (!rows || rows.length < 2) {
        return null;
    }

    const schoolName = sheetTitle;
    const categories: { [key: string]: Assessment[] } = {};
    let currentCategory = '';

    // Slice the array at index 1 to skip the header row
    const dataRows = rows.slice(1);

    dataRows.forEach(row => {
        const categoryName = row[0]?.trim();
        const activityName = row[1]?.trim();

        // Update the current category if a new one is found
        if (categoryName) {
            currentCategory = categoryName;
        }

        // Process any row that has an activity name, regardless of whether it has a score
        if (activityName) {
            if (!categories[currentCategory]) {
                categories[currentCategory] = [];
            }

            const ratingText = row[2]?.trim().toUpperCase();
            // Assign the score if a valid rating exists, otherwise assign 0
            const score = RATING_TO_SCORE[ratingText] ?? 0;

            categories[currentCategory].push({
                name: activityName,
                score: score
            });
        }
    });

    // Convert categories to KpiCategory format
    const kpiCategories: KpiCategory[] = Object.entries(categories).map(([categoryName, assessments]) => {
        const average = assessments.length > 0
            ? Math.round(assessments.reduce((sum, assessment) => sum + assessment.score, 0) / assessments.length)
            : 0;

        return {
            categoryName,
            average,
            assessments
        };
    });

    // Calculate overall score
    const overallScore = kpiCategories.length > 0
        ? Math.round(kpiCategories.reduce((sum, category) => sum + category.average, 0) / kpiCategories.length)
        : 0;

    return {
        id: schoolName.toLowerCase().replace(/\s+/g, '-'),
        name: schoolName,
        overallScore,
        categories: kpiCategories,
        logoUrl: null
    };
};

export const useGoogleSheetData = () => {
    const [schoolData, setSchoolData] = useState<SchoolData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Use demo data if in demo mode
                if (config.IS_DEMO_MODE) {
                    setSchoolData(DEMO_SCHOOLS);
                    setLoading(false);
                    return;
                }

                const response = await fetch(
                    `https://sheets.googleapis.com/v4/spreadsheets/${config.SHEET_ID}?key=${config.API_KEY}`
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch spreadsheet: ${response.statusText}`);
                }

                const spreadsheet = await response.json();
                const sheets = spreadsheet.sheets || [];

                const schools: SchoolData[] = [];

                for (const sheet of sheets) {
                    const sheetTitle = sheet.properties.title;

                    // Skip ignored sheet names
                    if (IGNORED_SHEET_NAMES.some(ignored =>
                        sheetTitle.toUpperCase().includes(ignored.toUpperCase())
                    )) {
                        continue;
                    }

                    try {
                        const sheetResponse = await fetch(
                            `https://sheets.googleapis.com/v4/spreadsheets/${config.SHEET_ID}/values/${encodeURIComponent(sheetTitle)}?key=${config.API_KEY}`
                        );

                        if (!sheetResponse.ok) {
                            console.warn(`Failed to fetch sheet ${sheetTitle}: ${sheetResponse.statusText}`);
                            continue;
                        }

                        const sheetData = await sheetResponse.json();
                        const rows = sheetData.values || [];

                        const school = parseSheetData(sheetTitle, rows);
                        if (school) {
                            schools.push(school);
                        }
                    } catch (sheetError) {
                        console.warn(`Error processing sheet ${sheetTitle}:`, sheetError);
                        continue;
                    }
                }

                setSchoolData(schools);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch data');
                // Fallback to demo data on error
                setSchoolData(DEMO_SCHOOLS);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return { schoolData, loading, error };
};
