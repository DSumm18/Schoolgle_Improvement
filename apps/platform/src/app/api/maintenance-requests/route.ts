import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { CreateTaskRequest, Module } from '@/types/universal-task';

export async function POST(request: Request) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body: CreateTaskRequest = await request.json();

        // Basic validation
        const requiredFields = ['title', 'module', 'task_type'];
        for (const field of requiredFields) {
            if (!body[field as keyof CreateTaskRequest]) {
                return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
            }
        }

        // Validate module
        const validModules: Module[] = ['estates', 'teaching', 'finance', 'hr', 'compliance'];
        if (!validModules.includes(body.module)) {
            return NextResponse.json({ error: 'Invalid module' }, { status: 400 });
        }

        // Build task data
        const taskData = {
            request_title: body.title,
            description: body.description,
            module: body.module,
            task_type: body.task_type,
            priority: body.priority || 'normal',
            visibility: body.visibility || 'team',
            due_date: body.due_date,
            estimated_duration_minutes: body.estimated_duration_minutes,
            context_data: body.context_data || {},

            school_id: body.school_id,
            requested_by_user_id: user.id, // Use authenticated user ID

            location_details: body.context_data?.location,
            category: body.task_type,
            status: 'open',

            risk_likelihood: body.context_data?.risk_likelihood,
            risk_impact: body.context_data?.risk_impact,

            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('maintenance_requests')
            .insert([taskData])
            .select()
            .single();

        if (error) {
            console.error('Supabase error creating task:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            message: 'Task created successfully',
            data
        }, { status: 201 });

    } catch (e: any) {
        console.error('Error processing POST request:', e);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const module = searchParams.get('module');

        let query = supabase
            .from('maintenance_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (module) {
            query = query.eq('module', module);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase error fetching tasks:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || [], { status: 200 });

    } catch (e: any) {
        console.error('Error processing GET request:', e);
        return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
    }
}
