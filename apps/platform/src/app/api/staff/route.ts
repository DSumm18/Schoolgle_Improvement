import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET /api/staff - List all staff for an organization
export async function GET(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
        }

        // Get staff with their module access
        const { data: staff, error } = await supabase
            .from('staff_directory')
            .select(`
                id,
                salutation,
                first_name,
                last_name,
                display_name,
                email,
                phone,
                avatar_url,
                employee_id,
                job_title,
                role_category,
                is_super_user,
                is_active,
                import_source,
                imported_at,
                created_at,
                updated_at,
                staff_module_access (
                    module
                )
            `)
            .eq('organization_id', organizationId)
            .order('last_name', { ascending: true });

        if (error) {
            console.error('Error fetching staff:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Transform data to include accessible_modules array
        const transformedStaff = staff?.map((s: any) => ({
            ...s,
            accessible_modules: s.staff_module_access?.map((ma: any) => ma.module) || [],
            staff_module_access: undefined,
        })) || [];

        return NextResponse.json(transformedStaff);
    } catch (error) {
        console.error('Error in GET /api/staff:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/staff - Create a new staff member
export async function POST(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const body = await request.json();

        const {
            organizationId,
            salutation,
            first_name,
            last_name,
            email,
            phone,
            avatar_url,
            employee_id,
            job_title,
            role_category,
            is_super_user,
            is_active,
            accessible_modules,
        } = body;

        if (!organizationId || !first_name || !last_name || !job_title || !role_category) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create staff member
        const { data: staff, error: staffError } = await supabase
            .from('staff_directory')
            .insert({
                organization_id: organizationId,
                salutation: salutation || null,
                first_name,
                last_name,
                email: email || null,
                phone: phone || null,
                avatar_url: avatar_url || null,
                employee_id: employee_id || null,
                job_title,
                role_category,
                is_super_user: is_super_user || false,
                is_active: is_active !== undefined ? is_active : true,
                import_source: 'manual',
            })
            .select()
            .single();

        if (staffError) {
            console.error('Error creating staff:', staffError);
            return NextResponse.json({ error: staffError.message }, { status: 500 });
        }

        // Add module access if provided
        if (accessible_modules && accessible_modules.length > 0) {
            const moduleAccess = accessible_modules.map((module: string) => ({
                staff_id: staff.id,
                module,
                granted_by: body.created_by,
            }));

            const { error: moduleError } = await supabase
                .from('staff_module_access')
                .insert(moduleAccess);

            if (moduleError) {
                console.error('Error adding module access:', moduleError);
            }
        }

        return NextResponse.json(staff, { status: 201 });
    } catch (error) {
        console.error('Error in POST /api/staff:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/staff - Update a staff member
export async function PUT(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const body = await request.json();

        const {
            id,
            salutation,
            first_name,
            last_name,
            email,
            phone,
            avatar_url,
            employee_id,
            job_title,
            role_category,
            is_super_user,
            is_active,
            accessible_modules,
        } = body;

        if (!id) {
            return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
        }

        // Update staff member
        const { data: staff, error: staffError } = await supabase
            .from('staff_directory')
            .update({
                salutation: salutation || null,
                first_name,
                last_name,
                email: email || null,
                phone: phone || null,
                avatar_url: avatar_url || null,
                employee_id: employee_id || null,
                job_title,
                role_category,
                is_super_user,
                is_active,
            })
            .eq('id', id)
            .select()
            .single();

        if (staffError) {
            console.error('Error updating staff:', staffError);
            return NextResponse.json({ error: staffError.message }, { status: 500 });
        }

        // Update module access if provided
        if (accessible_modules !== undefined) {
            // Delete existing module access
            await supabase
                .from('staff_module_access')
                .delete()
                .eq('staff_id', id);

            // Add new module access
            if (accessible_modules.length > 0) {
                const moduleAccess = accessible_modules.map((module: string) => ({
                    staff_id: id,
                    module,
                }));

                await supabase
                    .from('staff_module_access')
                    .insert(moduleAccess);
            }
        }

        return NextResponse.json(staff);
    } catch (error) {
        console.error('Error in PUT /api/staff:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/staff - Delete a staff member
export async function DELETE(request: NextRequest) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('staff_directory')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting staff:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in DELETE /api/staff:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
