// Test API endpoint to verify database connection and data
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: NextRequest) {
    const results: Record<string, any> = {
        timestamp: new Date().toISOString(),
        connection: 'unknown',
        tables: {},
        errors: []
    };

    try {
        // Test connection
        if (!supabaseUrl || !supabaseServiceKey) {
            results.connection = 'failed';
            results.errors.push('Missing Supabase credentials');
            return NextResponse.json(results, { status: 500 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        results.connection = 'success';
        results.supabaseUrl = supabaseUrl.substring(0, 40) + '...';

        // Test 1: Check Ofsted Categories
        const { data: ofstedCategories, error: catError } = await supabase
            .from('ofsted_categories')
            .select('id, name, display_order')
            .order('display_order');
        
        if (catError) {
            results.tables.ofsted_categories = { error: catError.message };
        } else {
            results.tables.ofsted_categories = {
                count: ofstedCategories?.length || 0,
                data: ofstedCategories
            };
        }

        // Test 2: Check Ofsted Subcategories
        const { data: subcategories, error: subError } = await supabase
            .from('ofsted_subcategories')
            .select('id, category_id, name')
            .limit(10);
        
        if (subError) {
            results.tables.ofsted_subcategories = { error: subError.message };
        } else {
            results.tables.ofsted_subcategories = {
                count: subcategories?.length || 0,
                sample: subcategories?.slice(0, 5)
            };
        }

        // Test 3: Check SIAMS Strands
        const { data: siamsStrands, error: siamsError } = await supabase
            .from('siams_strands')
            .select('id, name, display_order')
            .order('display_order');
        
        if (siamsError) {
            results.tables.siams_strands = { error: siamsError.message };
        } else {
            results.tables.siams_strands = {
                count: siamsStrands?.length || 0,
                data: siamsStrands
            };
        }

        // Test 4: Check Framework Updates
        const { data: updates, error: updatesError } = await supabase
            .from('framework_updates')
            .select('id, framework, title, effective_date');
        
        if (updatesError) {
            results.tables.framework_updates = { error: updatesError.message };
        } else {
            results.tables.framework_updates = {
                count: updates?.length || 0,
                data: updates
            };
        }

        // Test 5: Check all table existence
        const tableNames = [
            'users',
            'organizations',
            'organization_members',
            'invitations',
            'ofsted_categories',
            'ofsted_subcategories',
            'siams_strands',
            'siams_questions',
            'ofsted_assessments',
            'safeguarding_assessments',
            'siams_assessments',
            'actions',
            'documents',
            'evidence_matches',
            'lesson_observations',
            'statutory_documents',
            'pupil_premium_data',
            'pp_spending',
            'sports_premium_data',
            'sports_premium_spending',
            'sdp_priorities',
            'sdp_milestones',
            'framework_updates',
            'scan_jobs'
        ];

        const tableStatus: Record<string, string> = {};
        for (const table of tableNames) {
            const { error } = await supabase.from(table).select('*').limit(1);
            tableStatus[table] = error ? `❌ ${error.message}` : '✅ exists';
        }
        results.tableStatus = tableStatus;

        // Summary
        const existingTables = Object.values(tableStatus).filter(s => s.includes('✅')).length;
        results.summary = {
            totalTables: tableNames.length,
            existingTables,
            missingTables: tableNames.length - existingTables,
            status: existingTables === tableNames.length ? 'ALL TABLES EXIST' : 'SOME TABLES MISSING'
        };

        return NextResponse.json(results);

    } catch (error: any) {
        results.connection = 'error';
        results.errors.push(error.message);
        return NextResponse.json(results, { status: 500 });
    }
}

