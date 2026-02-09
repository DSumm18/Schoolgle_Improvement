import { NextRequest, NextResponse } from 'next/server';
import type {
    DfeSchoolLookupRequest,
    DfeSchoolLookupResponse,
    DfeSchoolData,
    ChurchDenomination,
} from '@/lib/siams';

const GIAS_API_BASE = 'https://get-information-schools.service.gov.uk';

/**
 * GET /api/siams/school-lookup
 * Look up a school in the DFE database (GIAS) to check if it's a church school
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const urn = searchParams.get('urn');
        const schoolName = searchParams.get('school_name');
        const laCode = searchParams.get('la_code');

        if (!urn && !schoolName) {
            return NextResponse.json(
                { error: 'Missing required parameters: urn or school_name' },
                { status: 400 }
            );
        }

        let schoolData: DfeSchoolLookupResponse = {
            found: false,
            urn: null,
            school_name: null,
            is_church_school: false,
            church_denomination: null,
            diocese: null,
            dfe_data: null,
        };

        if (urn) {
            // Lookup by URN
            const result = await lookupSchoolByURN(urn);
            if (result) {
                schoolData = result;
            }
        } else if (schoolName && laCode) {
            // Search by name and LA
            const result = await lookupSchoolByNameAndLA(schoolName, laCode);
            if (result) {
                schoolData = result;
            }
        }

        return NextResponse.json(schoolData);

    } catch (error: any) {
        console.error('DFE School Lookup API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/siams/school-lookup
 * Enhanced school lookup with DFE database search
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { urn, school_name, la_code } = body as DfeSchoolLookupRequest;

        if (!urn && !school_name) {
            return NextResponse.json(
                { error: 'Missing required parameters: urn or school_name' },
                { status: 400 }
            );
        }

        let result: DfeSchoolLookupResponse = {
            found: false,
            urn: null,
            school_name: null,
            is_church_school: false,
            church_denomination: null,
            diocese: null,
            dfe_data: null,
        };

        if (urn) {
            result = await lookupSchoolByURN(urn);
        } else if (school_name) {
            const la = la_code || await findLABySchoolName(school_name);
            result = await lookupSchoolByNameAndLA(school_name, la || '');
        }

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('DFE School Lookup POST error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Look up school by URN in GIAS API
 */
async function lookupSchoolByURN(urn: string): Promise<DfeSchoolLookupResponse | null> {
    try {
        const response = await fetch(`${GIAS_API_BASE}/establishments/${urn}.json`, {
            headers: {
                'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (!data || !data.establishment) {
            return null;
        }

        const establishment = data.establishment;

        // Determine church school status
        const religiousCharacter = establishment?.religiousCharacter?.name || '';
        const isChurchSchool = detectChurchSchool(religiousCharacter);
        const churchDenomination = mapDenomination(religiousCharacter);

        return {
            found: true,
            urn: establishment.urn,
            school_name: establishment.name,
            is_church_school: isChurchSchool,
            church_denomination: churchDenomination || null,
            diocese: extractDiocese(establishment),
            dfe_data: {
                name: establishment.name,
                laCode: establishment.localAuthority?.code,
                establishmentNumber: establishment.estab,
                type: establishment?.establishmentType?.name,
                religiousCharacter: religiousCharacter,
                phase: establishment?.phaseOfEducation?.join(', '),
            },
        };

    } catch (error) {
        console.error('Error looking up school by URN:', error);
        return null;
    }
}

/**
 * Look up school by name and LA code
 */
async function lookupSchoolByNameAndLA(
    schoolName: string,
    laCode: string
): Promise<DfeSchoolLookupResponse | null> {
    try {
        // First, search for the school
        const searchResponse = await fetch(
            `${GIAS_API_BASE}/establishments/search?q=${encodeURIComponent(schoolName)}`,
            {
                headers: {
                    'Accept': 'application/json',
                },
                signal: AbortSignal.timeout(10000),
            }
        );

        if (!searchResponse.ok) {
            return null;
        }

        const searchData = await searchResponse.json();

        if (!searchData || !Array.isArray(searchData)) {
            return null;
        }

        // Find matching school by LA code
        const school = searchData.find((s: any) =>
            s.name.toLowerCase().includes(schoolName.toLowerCase()) &&
            (!laCode || s.localAuthority?.code === laCode)
        );

        if (!school) {
            return null;
        }

        // Get full details by URN
        return await lookupSchoolByURN(school.urn);

    } catch (error) {
        console.error('Error searching for school:', error);
        return null;
    }
}

/**
 * Detect if a school is a church school based on religious character
 */
function detectChurchSchool(religiousCharacter: string): boolean {
    const churchIndicators = [
        'church',
        'church of england',
        'c of e',
        'anglican',
        'roman catholic',
        'catholic',
        'methodist',
    ];

    const rc = religiousCharacter.toLowerCase();
    return churchIndicators.some(indicator => rc.includes(indicator));
}

/**
 * Map religious character string to our denomination enum
 */
function mapDenomination(religiousCharacter: string): ChurchDenomination | null {
    const rc = religiousCharacter.toLowerCase();

    if (rc.includes('church of england') || rc.includes('c of e') || rc.includes('anglican')) {
        return 'church_of_england';
    }
    if (rc.includes('roman catholic') || rc.includes('catholic')) {
        return 'roman_catholic';
    }
    if (rc.includes('methodist')) {
        return 'methodist';
    }
    if (rc.includes('church') || rc.includes('christian')) {
        return 'other_christian';
    }

    return null;
}

/**
 * Extract diocese from establishment data
 */
function extractDiocese(establishment: any): string | null {
    // This would need actual data from GIAS - currently placeholder
    // Diocese info may be in a different field or require additional lookup
    return establishment?.diocese?.name || null;
}

/**
 * Find LA code by school name (for fallback)
 */
async function findLABySchoolName(schoolName: string): Promise<string> {
    // This would require a separate LA lookup or database
    // For now, return empty string
    return '';
}
