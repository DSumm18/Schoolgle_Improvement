import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Seed data API route
 * Call this endpoint to populate sample data for Aurora Primary School
 * GET /api/seed-data
 */
export async function GET() {
    const results: { table: string; count: number; error?: string }[] = [];

    // First, get the organization ID
    const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name')
        .ilike('name', '%Aurora%')
        .limit(1);

    const organizationId = orgs && orgs.length > 0 ? orgs[0].id : null;

    if (!organizationId) {
        return NextResponse.json({ error: 'No organization found matching "Aurora"' }, { status: 404 });
    }

    console.log('Seeding data for organization:', organizationId);

    // Get a user ID for created_by fields
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const userId = users && users.length > 0 ? users[0].id : null;

    // =====================================================
    // 1. SCHOOL CHURCH STATUS
    // =====================================================
    try {
        const { error } = await supabase
            .from('school_church_status')
            .upsert({
                organization_id: organizationId,
                urn: '123456',
                school_name: 'Aurora Primary School',
                la_code: '999',
                establishment_number: '1001',
                is_church_school: true,
                church_denomination: 'church_of_england',
                diocese: 'Canterbury',
                parish: 'St Mary\'s',
                last_siams_date: '2023-05-15',
                last_siams_rating: 'good',
                next_siams_date: '2026-05-01',
                dfe_data: {},
                updated_at: new Date().toISOString(),
            }, { onConflict: 'organization_id' });

        if (!error) {
            results.push({ table: 'school_church_status', count: 1 });
        } else {
            results.push({ table: 'school_church_status', count: 0, error: error.message });
        }
    } catch (e: any) {
        results.push({ table: 'school_church_status', count: 0, error: e.message });
    }

    // =====================================================
    // 2. GOVERNORS
    // =====================================================
    const governors = [
        { id: 'gov-1', full_name: 'Sarah Thompson', email: 'sarah.thompson@aurora.sch.uk', governor_type: 'parent', status: 'active', role: 'Chair of Governors', term_start: '2022-09-01', term_end: '2026-08-31', skills: ['finance', 'safeguarding'], meetings_attended: 12, meetings_total: 15 },
        { id: 'gov-2', full_name: 'Reverend David Wilson', email: 'david.wilson@church.co.uk', governor_type: 'foundation', status: 'active', role: 'Foundation Governor', term_start: '2021-09-01', term_end: '2025-08-31', skills: ['religious_education'], meetings_attended: 14, meetings_total: 15 },
        { id: 'gov-3', full_name: 'James Miller', email: 'james.miller@localbiz.co.uk', governor_type: 'co_opted', status: 'active', role: 'Vice Chair', term_start: '2023-01-15', term_end: '2026-01-14', skills: ['hr', 'health_and_safety'], meetings_attended: 10, meetings_total: 12 },
        { id: 'gov-4', full_name: 'Emma Davis', email: 'emma.davis@aurora.sch.uk', governor_type: 'staff', status: 'active', role: 'Staff Governor', term_start: '2022-09-01', term_end: '2025-08-31', skills: ['curriculum', 'send'], meetings_attended: 13, meetings_total: 15 },
        { id: 'gov-5', full_name: 'Michael Brown', email: 'michael.brown@aurora.sch.uk', governor_type: 'parent', status: 'active', role: 'Parent Governor', term_start: '2023-09-01', term_end: '2027-08-31', skills: ['finance'], meetings_attended: 8, meetings_total: 10 },
        { id: 'gov-6', full_name: 'Patricia Green', email: 'patricia.green@la.gov.uk', governor_type: 'la', status: 'active', role: 'LA Governor', term_start: '2022-01-01', term_end: '2026-12-31', skills: ['safeguarding', 'send'], meetings_attended: 11, meetings_total: 15 },
        { id: 'gov-7', full_name: 'Robert Taylor', email: 'robert.taylor@community.org', governor_type: 'co_opted', status: 'inactive', role: 'Co-opted Governor', term_start: '2020-09-01', term_end: '2024-08-31', skills: ['health_and_safety'], meetings_attended: 5, meetings_total: 15 },
    ];

    for (const gov of governors) {
        try {
            const { error } = await supabase
                .from('governors')
                .upsert({
                    id: gov.id,
                    organization_id: organizationId,
                    full_name: gov.full_name,
                    email: gov.email,
                    governor_type: gov.governor_type,
                    status: gov.status,
                    role: gov.role,
                    term_start: gov.term_start,
                    term_end: gov.term_end,
                    skills: gov.skills,
                    meetings_attended: gov.meetings_attended,
                    meetings_total: gov.meetings_total,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });

            if (!error) {
                results.push({ table: `governors (${gov.full_name})`, count: 1 });
            } else {
                results.push({ table: `governors (${gov.full_name})`, count: 0, error: error.message });
            }
        } catch (e: any) {
            results.push({ table: `governors (${gov.full_name})`, count: 0, error: e.message });
        }
    }

    // =====================================================
    // 3. GOVERNANCE MEETINGS
    // =====================================================
    const meetings = [
        { id: 'meet-1', meeting_type: 'full_governing_body', title: 'Autumn Term FGB', scheduled_date: '2024-09-18T18:00:00', status: 'completed', invited_governors: ['gov-1', 'gov-2', 'gov-3', 'gov-4', 'gov-5', 'gov-6', 'gov-7'], attended_governors: ['gov-1', 'gov-2', 'gov-3', 'gov-4', 'gov-5', 'gov-6'], minutes_summary: 'Approved school development plan' },
        { id: 'meet-2', meeting_type: 'full_governing_body', title: 'Spring Term FGB', scheduled_date: '2025-01-15T18:00:00', status: 'completed', invited_governors: ['gov-1', 'gov-2', 'gov-3', 'gov-4', 'gov-5', 'gov-6', 'gov-7'], attended_governors: ['gov-1', 'gov-2', 'gov-4', 'gov-5', 'gov-6'], minutes_summary: 'Discussed SIAMS preparation' },
        { id: 'meet-3', meeting_type: 'finance', title: 'Budget Review', scheduled_date: '2024-11-20T17:00:00', status: 'completed', invited_governors: ['gov-1', 'gov-5'], attended_governors: ['gov-1', 'gov-5'], minutes_summary: 'Approved 2024-25 budget' },
        { id: 'meet-4', meeting_type: 'full_governing_body', title: 'Summer Term FGB', scheduled_date: '2025-05-20T18:00:00', status: 'scheduled', invited_governors: ['gov-1', 'gov-2', 'gov-3', 'gov-4', 'gov-5', 'gov-6', 'gov-7'], attended_governors: [], minutes_summary: null },
        { id: 'meet-5', meeting_type: 'safeguarding', title: 'Safeguarding Review', scheduled_date: '2025-03-10T17:00:00', status: 'scheduled', invited_governors: ['gov-1', 'gov-6'], attended_governors: [], minutes_summary: null },
    ];

    for (const meeting of meetings) {
        try {
            const { error } = await supabase
                .from('governance_meetings')
                .upsert({
                    id: meeting.id,
                    organization_id: organizationId,
                    meeting_type: meeting.meeting_type,
                    title: meeting.title,
                    scheduled_date: meeting.scheduled_date,
                    status: meeting.status,
                    invited_governors: meeting.invited_governors,
                    attended_governors: meeting.attended_governors,
                    minutes_summary: meeting.minutes_summary,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });

            if (!error) {
                results.push({ table: `meetings (${meeting.title})`, count: 1 });
            } else {
                results.push({ table: `meetings (${meeting.title})`, count: 0, error: error.message });
            }
        } catch (e: any) {
            results.push({ table: `meetings (${meeting.title})`, count: 0, error: e.message });
        }
    }

    // =====================================================
    // 4. GOVERNOR TRAINING
    // =====================================================
    const training = [
        { id: 'train-1', governor_id: 'gov-1', training_name: 'Safeguarding Level 1', completed_date: '2024-09-01', expiry_date: '2025-09-01', provider: 'Local Authority', certificate_url: null },
        { id: 'train-2', governor_id: 'gov-1', training_name: 'Finance for Governors', completed_date: '2024-10-15', expiry_date: '2026-10-15', provider: 'National Governance Association', certificate_url: null },
        { id: 'train-3', governor_id: 'gov-2', training_name: 'SIAMS Framework Update', completed_date: '2024-11-01', expiry_date: '2026-11-01', provider: 'Diocese', certificate_url: null },
        { id: 'train-4', governor_id: 'gov-3', training_name: 'HR in Schools', completed_date: '2024-05-20', expiry_date: '2026-05-20', provider: 'Local Authority', certificate_url: null },
        { id: 'train-5', governor_id: 'gov-4', training_name: 'SEND Code of Practice', completed_date: '2024-09-10', expiry_date: '2025-09-10', provider: 'DfE', certificate_url: null },
        { id: 'train-6', governor_id: 'gov-6', training_name: 'Safeguarding Level 2', completed_date: '2024-08-15', expiry_date: '2025-08-15', provider: 'Local Authority', certificate_url: null },
        { id: 'train-7', governor_id: 'gov-6', training_name: 'PREVENT Duty', completed_date: '2023-11-01', expiry_date: '2025-11-01', provider: 'Home Office', certificate_url: null },
    ];

    for (const t of training) {
        try {
            const { error } = await supabase
                .from('governor_training')
                .upsert({
                    id: t.id,
                    organization_id: organizationId,
                    governor_id: t.governor_id,
                    training_name: t.training_name,
                    completed_date: t.completed_date,
                    expiry_date: t.expiry_date,
                    provider: t.provider,
                    certificate_url: t.certificate_url,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });

            if (!error) {
                results.push({ table: 'governor_training', count: 1 });
            } else {
                results.push({ table: 'governor_training', count: 0, error: error.message });
            }
        } catch (e: any) {
            results.push({ table: 'governor_training', count: 0, error: e.message });
        }
    }

    // =====================================================
    // 5. GOVERNOR VISITS
    // =====================================================
    const visits = [
        { id: 'visit-1', governor_id: 'gov-1', visit_type: 'learning_walk', purpose: 'To observe maths teaching', date: '2024-10-15', status: 'completed', findings: 'Good practice observed, children engaged', actions: null },
        { id: 'visit-2', governor_id: 'gov-6', visit_type: 'policy_review', purpose: 'Review SEND policy', date: '2024-11-05', status: 'completed', findings: 'Policy up to date, minor recommendations', actions: 'Share with SLT' },
        { id: 'visit-3', governor_id: 'gov-2', visit_type: 'worship_observation', purpose: 'SIAMS preparation - observe collective worship', date: '2024-12-10', status: 'completed', findings: 'Worship well planned, good pupil participation', actions: null },
        { id: 'visit-4', governor_id: 'gov-3', visit_type: 'health_and_safety', purpose: 'Termly H&S inspection', date: '2025-02-01', status: 'scheduled', findings: null, actions: null },
        { id: 'visit-5', governor_id: 'gov-4', visit_type: 'learning_walk', purpose: 'Early years observation', date: '2025-03-15', status: 'scheduled', findings: null, actions: null },
    ];

    for (const v of visits) {
        try {
            const { error } = await supabase
                .from('governor_visits')
                .upsert({
                    id: v.id,
                    organization_id: organizationId,
                    governor_id: v.governor_id,
                    visit_type: v.visit_type,
                    purpose: v.purpose,
                    date: v.date,
                    status: v.status,
                    findings: v.findings,
                    actions: v.actions,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });

            if (!error) {
                results.push({ table: 'governor_visits', count: 1 });
            } else {
                results.push({ table: 'governor_visits', count: 0, error: error.message });
            }
        } catch (e: any) {
            results.push({ table: 'governor_visits', count: 0, error: e.message });
        }
    }

    // =====================================================
    // 6. OFSTED ASSESSMENTS
    // =====================================================
    // Helper to create assessment
    const createOfstedAssessment = (subcategoryId: string, schoolRating: string, schoolRationale: string, evidenceCount: number) => ({
        organization_id: organizationId,
        subcategory_id: subcategoryId,
        school_rating: schoolRating,
        school_rationale: schoolRationale,
        ai_rating: 'good',
        ai_rationale: 'AI analysis based on evidence scan',
        evidence_count: evidenceCount,
        updated_at: new Date().toISOString(),
    });

    const ofstedAssessments = [
        createOfstedAssessment('inclusion-send', 'good', 'Strong provision for SEND pupils, good graduated approach in place', 8),
        createOfstedAssessment('inclusion-disadvantaged', 'good', 'PP funding used effectively, gaps closing', 6),
        createOfstedAssessment('inclusion-mental-health', 'strong_standard', 'Comprehensive mental health support, strong wellbeing culture', 7),
        createOfstedAssessment('curriculum-intent', 'good', 'Ambitious curriculum for all, well-sequenced', 9),
        createOfstedAssessment('curriculum-implementation', 'good', 'Teaching is strong, good subject knowledge', 10),
        createOfstedAssessment('curriculum-reading', 'good', 'Phics programme well implemented, good reading outcomes', 8),
        createOfstedAssessment('achievement-outcomes', 'expected_standard', 'Attainment in line with national, progress improving', 5),
        createOfstedAssessment('achievement-progress', 'good', 'Strong progress from starting points, especially for disadvantaged', 6),
        createOfstedAssessment('achievement-destinations', 'good', 'Pupils well-prepared for secondary transition', 4),
        createOfstedAssessment('attendance-overall', 'expected_standard', 'Overall attendance 95.2%, PA reducing', 7),
        createOfstedAssessment('behaviour-conduct', 'good', 'Behaviour is good, consistent expectations', 8),
        createOfstedAssessment('behaviour-attitudes', 'good', 'Positive attitudes to learning, pupils engaged', 9),
        createOfstedAssessment('pd-character', 'good', 'Character development well-promoted', 7),
        createOfstedAssessment('pd-citizenship', 'good', 'British Values embedded, pupils understand diversity', 6),
        createOfstedAssessment('pd-enrichment', 'strong_standard', 'Wide range of enrichment opportunities, good uptake', 8),
        createOfstedAssessment('pd-rse', 'good', 'RSE curriculum comprehensive, well-delivered', 7),
        createOfstedAssessment('leadership-vision', 'good', 'Clear vision, well-understood by all', 9),
        createOfstedAssessment('leadership-governance', 'expected_standard', 'Governors know school well, good support and challenge', 6),
    ];

    for (const assessment of ofstedAssessments) {
        try {
            const { error } = await supabase
                .from('ofsted_assessments')
                .upsert(assessment, { onConflict: 'organization_id,subcategory_id' });

            if (!error) {
                results.push({ table: 'ofsted_assessments', count: 1 });
            } else {
                results.push({ table: 'ofsted_assessments', count: 0, error: error.message });
            }
        } catch (e: any) {
            results.push({ table: 'ofsted_assessments', count: 0, error: e.message });
        }
    }

    // =====================================================
    // 7. SIAMS ASSESSMENTS
    // =====================================================
    const siamsQuestions = [
        'vision-1', 'vision-2', 'vision-3', 'vision-4',
        'wisdom-1', 'wisdom-2', 'wisdom-3', 'wisdom-4',
        'character-1', 'character-2', 'character-3', 'character-4',
        'community-1', 'community-2', 'community-3', 'community-4',
        'dignity-1', 'dignity-2', 'dignity-3', 'dignity-4',
        'worship-1', 'worship-2', 'worship-3', 'worship-4', 'worship-5',
        're-1', 're-2', 're-3', 're-4', 're-5',
    ];

    const siamsRatings: Array<'good' | 'excellent' | 'requires_improvement'> = ['good', 'excellent', 'good', 'good', 'excellent', 'good', 'good', 'good', 'good', 'excellent', 'good', 'good', 'excellent', 'good', 'requires_improvement', 'good', 'good', 'good', 'excellent', 'excellent', 'good', 'good', 'good', 'good', 'good', 'excellent'];

    for (let i = 0; i < siamsQuestions.length; i++) {
        try {
            const { error } = await supabase
                .from('siams_assessments')
                .upsert({
                    id: `siams-${organizationId}-${siamsQuestions[i]}`,
                    organization_id: organizationId,
                    strand_id: siamsQuestions[i].split('-')[0] as any,
                    question_id: siamsQuestions[i] as any,
                    school_rating: siamsRatings[i],
                    school_rationale: `Self-assessment for ${siamsQuestions[i]}`,
                    ai_rating: 'good',
                    ai_rationale: 'AI suggestion based on evidence',
                    evidence_count: Math.floor(Math.random() * 5),
                    evidence_items: [],
                    assessed_by: userId,
                    assessed_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });

            if (!error) {
                results.push({ table: 'siams_assessments', count: 1 });
            } else {
                results.push({ table: 'siams_assessments', count: 0, error: error.message });
            }
        } catch (e: any) {
            results.push({ table: 'siams_assessments', count: 0, error: e.message });
        }
    }

    // =====================================================
    // 8. ACTIONS (Strategic Action Plan)
    // =====================================================
    const actions = [
        { id: 'action-1', title: 'Improve phonics outcomes for Year 1 pupils', description: 'Implement additional daily phonics sessions for struggling readers', rationale: 'Phonics screening results below national average', category: 'curriculum-teaching', priority: 'high', status: 'in_progress', due_date: '2025-04-30', assignee: 'Emma Davis', progress: 60 },
        { id: 'action-2', title: 'Review and update SEND policy', description: 'Ensure policy reflects latest Code of Practice and is accessible to all parents', rationale: 'Annual policy review required', category: 'inclusion', priority: 'medium', status: 'not_started', due_date: '2025-03-31', assignee: 'Patricia Green', progress: 0 },
        { id: 'action-3', title: 'Conduct safeguarding audit', description: 'Full audit of all safeguarding procedures and records', rationale: 'Annual statutory requirement', category: 'leadership-governance', priority: 'high', status: 'open', due_date: '2025-02-28', assignee: 'Sarah Thompson', progress: 30 },
        { id: 'action-4', title: 'Develop mental health strategy', description: 'Create whole-school approach to mental health and wellbeing', rationale: 'Identified gap in provision', category: 'inclusion', priority: 'medium', status: 'in_progress', due_date: '2025-05-15', assignee: 'James Miller', progress: 45 },
        { id: 'action-5', title: 'Enhance collective worship', description: 'Introduce more pupil-led worship sessions', rationale: 'SIAMS recommendation for pupil voice', category: 'pd-character', priority: 'low', status: 'not_started', due_date: '2025-06-01', assignee: 'Reverend David Wilson', progress: 0 },
        { id: 'action-6', title: 'Improve attendance for PP pupils', description: 'Targeted support for families, breakfast club provision', rationale: 'Persistent absence gap for disadvantaged pupils', category: 'attendance-behaviour', priority: 'high', status: 'in_progress', due_date: '2025-04-15', assignee: 'Sarah Thompson', progress: 70 },
        { id: 'action-7', title: 'Review curriculum progression maps', description: 'Ensure clear progression across all subjects', rationale: 'Ofsted feedback on curriculum sequencing', category: 'curriculum-teaching', priority: 'medium', status: 'completed', due_date: '2024-12-31', assignee: 'Emma Davis', progress: 100 },
        { id: 'action-8', title: 'Governor safeguarding training', description: 'Ensure all governors have completed Level 2 safeguarding training', rationale: 'Statutory requirement', category: 'leadership-governance', priority: 'high', status: 'in_progress', due_date: '2025-03-15', assignee: 'Sarah Thompson', progress: 85 },
    ];

    for (const action of actions) {
        try {
            const { error } = await supabase
                .from('actions')
                .upsert({
                    id: action.id,
                    organization_id: organizationId,
                    user_id: userId,
                    framework_type: 'ofsted',
                    category_id: action.category,
                    subcategory_id: action.category,
                    title: action.title,
                    description: action.description,
                    rationale: action.rationale,
                    priority: action.priority,
                    status: action.status,
                    due_date: action.due_date,
                    start_date: new Date().toISOString().split('T')[0],
                    owner_name: action.assignee,
                    assignee_id: null,
                    progress: action.progress,
                    dependencies: [],
                    is_critical: action.priority === 'high',
                    linked_evidence: [],
                    notes: [],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });

            if (!error) {
                results.push({ table: 'actions', count: 1 });
            } else {
                results.push({ table: 'actions', count: 0, error: error.message });
            }
        } catch (e: any) {
            results.push({ table: 'actions', count: 0, error: e.message });
        }
    }

    // =====================================================
    // 9. UNIFIED TASKS
    // =====================================================
    const tasks = [
        { id: 'task-1', title: 'Complete safeguarding training', type: 'compliance', priority: 'high', status: 'in_progress', assignee_id: 'gov-1', due_date: '2025-03-15', description: 'Complete Level 2 safeguarding training' },
        { id: 'task-2', title: 'Review SEND policy', type: 'governance', priority: 'medium', status: 'pending', assignee_id: 'gov-6', due_date: '2025-03-31', description: 'Annual review and update' },
        { id: 'task-3', title: 'School visit - Early Years', type: 'monitoring', priority: 'low', status: 'pending', assignee_id: 'gov-4', due_date: '2025-03-15', description: 'Observe Early Years provision' },
        { id: 'task-4', title: 'Finance committee meeting prep', type: 'governance', priority: 'medium', status: 'pending', assignee_id: 'gov-1', due_date: '2025-02-28', description: 'Prepare budget for approval' },
        { id: 'task-5', title: 'SIAMS self-evaluation update', type: 'compliance', priority: 'high', status: 'pending', assignee_id: 'gov-2', due_date: '2025-04-30', description: 'Update SEF in preparation for inspection' },
        { id: 'task-6', title: 'Attend parents evening', type: 'community', priority: 'low', status: 'completed', assignee_id: 'gov-4', due_date: '2024-11-15', description: 'Represent governors at parents evening' },
        { id: 'task-7', title: 'Review attendance data', type: 'monitoring', priority: 'medium', status: 'in_progress', assignee_id: 'gov-1', due_date: '2025-02-28', description: 'Half-termly attendance review' },
        { id: 'task-8', title: 'Health and safety inspection', type: 'compliance', priority: 'high', status: 'pending', assignee_id: 'gov-3', due_date: '2025-03-31', description: 'Complete termly H&S check' },
    ];

    for (const task of tasks) {
        try {
            const { error } = await supabase
                .from('tasks')
                .upsert({
                    id: task.id,
                    organization_id: organizationId,
                    title: task.title,
                    type: task.type,
                    priority: task.priority,
                    status: task.status,
                    assignee_id: task.assignee_id,
                    due_date: task.due_date,
                    description: task.description,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: userId,
                }, { onConflict: 'id' });

            if (!error) {
                results.push({ table: 'tasks', count: 1 });
            } else {
                results.push({ table: 'tasks', count: 0, error: error.message });
            }
        } catch (e: any) {
            results.push({ table: 'tasks', count: 0, error: e.message });
        }
    }

    // =====================================================
    // 10. EVIDENCE (sample documents)
    // =====================================================
    const evidence = [
        { id: 'evi-1', title: 'SEND Policy 2024', type: 'policy', category: 'inclusion', file_size: 245000, upload_date: '2024-09-15' },
        { id: 'evi-2', title: 'Phonics Progress Data Autumn', type: 'data', category: 'curriculum-teaching', file_size: 125000, upload_date: '2024-12-01' },
        { id: 'evi-3', title: 'Safeguarding Policy 2024', type: 'policy', category: 'leadership-governance', file_size: 310000, upload_date: '2024-09-01' },
        { id: 'evi-4', title: 'Collective Worship Schedule', type: 'document', category: 'pd-character', file_size: 85000, upload_date: '2024-09-10' },
        { id: 'evi-5', title: 'Attendance Report Autumn 2024', type: 'data', category: 'attendance-behaviour', file_size: 156000, upload_date: '2024-12-15' },
    ];

    for (const evi of evidence) {
        try {
            const { error } = await supabase
                .from('evidence')
                .upsert({
                    id: evi.id,
                    organization_id: organizationId,
                    title: evi.title,
                    type: evi.type,
                    category: evi.category,
                    file_size: evi.file_size,
                    upload_date: evi.upload_date,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });

            if (!error) {
                results.push({ table: 'evidence', count: 1 });
            } else {
                results.push({ table: 'evidence', count: 0, error: error.message });
            }
        } catch (e: any) {
            results.push({ table: 'evidence', count: 0, error: e.message });
        }
    }

    // Summary
    const successCount = results.filter(r => !r.error).length;
    const errorCount = results.filter(r => r.error).length;
    const tablesWithErrors = results.filter(r => r.error).map(r => r.table);

    return NextResponse.json({
        success: true,
        organization: { id: organizationId, name: 'Aurora Primary School' },
        summary: {
            total_records: results.length,
            successful: successCount,
            errors: errorCount,
            tables_with_errors: tablesWithErrors.length > 0 ? tablesWithErrors : undefined,
        },
        details: results,
    });
}
