import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type {
    Team,
    TeamForm,
    TeamWorkload,
    GetTeamWorkloadRequest,
    GetTeamWorkloadResponse,
} from '@/lib/tasks';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/teams
 * Get teams for an organization
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');
        const department = searchParams.get('department');
        const type = searchParams.get('type');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId parameter' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let query = supabase
            .from('teams')
            .select(`
                *,
                leader:users!teams_leader_id_fkey (
                    id,
                    email,
                    raw_user_meta_data->>'full_name' as full_name
                ),
                deputy:users!teams_deputy_leader_id_fkey (
                    id,
                    email,
                    raw_user_meta_data->>'full_name' as full_name
                )
            `)
            .eq('organization_id', organizationId)
            .order('name', { ascending: true });

        if (department) {
            query = query.eq('department', department);
        }
        if (type) {
            query = query.eq('type', type);
        }

        const { data: teams, error } = await query;

        if (error) {
            console.error('Error fetching teams:', error);
            return NextResponse.json(
                { error: 'Failed to fetch teams' },
                { status: 500 }
            );
        }

        // Enrich with member details
        const teamsWithMembers = await Promise.all(
            (teams || []).map(async (team: any) => {
                const memberIds = team.members?.map((m: any) => m.userId) || [];

                let members: any[] = [];
                if (memberIds.length > 0) {
                    const { data: users } = await supabase
                        .from('users')
                        .select('id, email, raw_user_meta_data->>\'full_name\' as full_name, avatar_url')
                        .in('id', memberIds.slice(0, 100));

                    members = (users || []).map((u: any) => {
                        const memberInfo = team.members.find((m: any) => m.userId === u.id);
                        return {
                            ...u,
                            role: memberInfo?.role || 'member',
                        };
                    });
                }

                // Get task count for this team
                const { count: taskCount } = await supabase
                    .from('actions')
                    .select('id', { count: 'exact', head: true })
                    .eq('organization_id', organizationId)
                    .eq('team_id', team.id)
                    .not('status', 'in', ['completed', 'cancelled']);

                return {
                    ...team,
                    leader_name: team.leader?.full_name || team.leader?.email || null,
                    deputy_leader_name: team.deputy?.full_name || team.deputy?.email || null,
                    members,
                    member_count: members.length,
                    active_tasks: taskCount || 0,
                };
            })
        );

        return NextResponse.json({ teams: teamsWithMembers });

    } catch (error: any) {
        console.error('Teams API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/teams
 * Create a new team
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            organizationId,
            name,
            description,
            color,
            icon,
            department,
            type,
            leader_id,
            deputy_leader_id,
            members,
            can_create_tasks,
            can_assign_tasks,
            can_approve_tasks,
        } = body as TeamForm & { organizationId: string };

        if (!organizationId || !name) {
            return NextResponse.json(
                { error: 'Missing required fields: organizationId, name' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Prepare members with joined_at timestamp
        const membersWithTimestamp = (members || []).map((m) => ({
            ...m,
            joined_at: new Date().toISOString(),
        }));

        const { data: team, error } = await supabase
            .from('teams')
            .insert({
                id: uuidv4(),
                organization_id: organizationId,
                name,
                description: description || null,
                color: color || '#3b82f6',
                icon: icon || 'users',
                department: department || null,
                type: type || 'department',
                leader_id: leader_id || null,
                deputy_leader_id: deputy_leader_id || null,
                members: membersWithTimestamp,
                can_create_tasks: can_create_tasks !== false,
                can_assign_tasks: can_assign_tasks !== false,
                can_approve_tasks: can_approve_tasks || false,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating team:', error);
            return NextResponse.json(
                { error: 'Failed to create team' },
                { status: 500 }
            );
        }

        return NextResponse.json({ team }, { status: 201 });

    } catch (error: any) {
        console.error('Team creation error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/teams
 * Bulk update teams
 */
export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json();
        const { organizationId, updates } = body as {
            organizationId: string;
            updates: Array<{
                id: string;
                changes: Partial<TeamForm>;
            }>;
        };

        if (!organizationId || !updates || !Array.isArray(updates)) {
            return NextResponse.json(
                { error: 'Missing required fields: organizationId, updates (array)' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const results = await Promise.all(
            updates.map(async ({ id, changes }) => {
                const { data, error } = await supabase
                    .from('teams')
                    .update({
                        ...changes,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', id)
                    .eq('organization_id', organizationId)
                    .select()
                    .maybeSingle();

                return { team: data, error };
            })
        );

        const successCount = results.filter((r) => !r.error && r.team).length;
        const errors = results.filter((r) => r.error).map((r) => r.error);

        return NextResponse.json({
            updated: successCount,
            failed: results.length - successCount,
            errors: errors.length > 0 ? errors : undefined,
        });

    } catch (error: any) {
        console.error('Bulk team update error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/teams
 * Delete teams
 */
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');
        const ids = searchParams.get('ids')?.split(',');

        if (!organizationId || !ids || ids.length === 0) {
            return NextResponse.json(
                { error: 'Missing required parameters: organizationId, ids' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { error } = await supabase
            .from('teams')
            .delete()
            .in('id', ids)
            .eq('organization_id', organizationId);

        if (error) {
            console.error('Error deleting teams:', error);
            return NextResponse.json(
                { error: 'Failed to delete teams' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, deleted: ids.length });

    } catch (error: any) {
        console.error('Team deletion error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/teams/workload
 * Get team workload data
 */
export async function workload(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const organizationId = searchParams.get('organizationId');
        const teamId = searchParams.get('teamId');
        const department = searchParams.get('department');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Missing organizationId parameter' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let workloadQuery: any;

        if (teamId) {
            // Get workload for specific team
            workloadQuery = supabase.rpc('get_team_workload', {
                team_id_param: teamId,
            });
        } else {
            // Get all teams workload
            const { data: teams } = await supabase
                .from('teams')
                .select('id, name')
                .eq('organization_id', organizationId);

            if (department) {
                // Would need to filter by department if specified
                // For now, get all teams
            }

            const workloadData = await Promise.all(
                (teams || []).map(async (team: any) => {
                    const result = await supabase.rpc('get_team_workload', {
                        team_id_param: team.id,
                    });
                    return {
                        team_id: team.id,
                        team_name: team.name,
                        workload: result || [],
                    };
                })
            );

            const summary = {
                total_users: 0,
                total_tasks: 0,
                total_hours_allocated: 0,
                total_hours_spent: 0,
            };

            // Calculate summary
            workloadData.forEach((wd: any) => {
                wd.workload.forEach((w: TeamWorkload) => {
                    summary.total_users++;
                    summary.total_tasks += w.total_tasks;
                    summary.total_hours_allocated += w.total_estimated_hours || 0;
                    summary.total_hours_spent += w.total_actual_hours || 0;
                });
            });

            const response: GetTeamWorkloadResponse = {
                workload: workloadData.flatMap((wd: any) =>
                    wd.workload.map((w: any) => ({
                        ...w,
                        team_id: wd.team_id,
                        team_name: wd.team_name,
                    }))
                ),
                summary,
            };

            return NextResponse.json(response);
        }

        if (workloadQuery.error) {
            throw workloadQuery.error;
        }

        return NextResponse.json({ workload: workloadQuery });

    } catch (error: any) {
        console.error('Team workload API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
