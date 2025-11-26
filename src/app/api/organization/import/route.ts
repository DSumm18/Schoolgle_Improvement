import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ImportUser {
    email: string;
    displayName: string;
    role: 'admin' | 'teacher' | 'slt';
}

interface ValidationError {
    row: number;
    field: string;
    message: string;
}

function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateRole(role: string): role is 'admin' | 'teacher' | 'slt' {
    return ['admin', 'teacher', 'slt'].includes(role.toLowerCase());
}

function parseCSV(csvContent: string): { users: ImportUser[]; errors: ValidationError[] } {
    const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line);
    const users: ImportUser[] = [];
    const errors: ValidationError[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Handle CSV with commas inside quotes
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        
        if (values.length < 3) {
            errors.push({ row: i + 1, field: 'format', message: 'Row must have email, name, and role' });
            continue;
        }

        const [email, displayName, role] = values;

        if (!email) {
            errors.push({ row: i + 1, field: 'email', message: 'Email is required' });
            continue;
        }

        if (!validateEmail(email)) {
            errors.push({ row: i + 1, field: 'email', message: `Invalid email format: ${email}` });
            continue;
        }

        if (!displayName) {
            errors.push({ row: i + 1, field: 'name', message: 'Name is required' });
            continue;
        }

        if (!role) {
            errors.push({ row: i + 1, field: 'role', message: 'Role is required' });
            continue;
        }

        const normalizedRole = role.toLowerCase();
        if (!validateRole(normalizedRole)) {
            errors.push({ row: i + 1, field: 'role', message: `Invalid role: ${role}. Must be admin, teacher, or slt` });
            continue;
        }

        users.push({
            email: email.toLowerCase(),
            displayName,
            role: normalizedRole as 'admin' | 'teacher' | 'slt'
        });
    }

    return { users, errors };
}

export async function POST(req: NextRequest) {
    try {
        const { csvContent, organizationId, invitedBy, previewOnly } = await req.json();

        if (!csvContent || !organizationId || !invitedBy) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Parse and validate CSV
        const { users, errors } = parseCSV(csvContent);

        // Check for duplicate emails in CSV
        const emailSet = new Set<string>();
        const duplicateErrors: ValidationError[] = [];
        users.forEach((user, index) => {
            if (emailSet.has(user.email)) {
                duplicateErrors.push({ row: index + 2, field: 'email', message: `Duplicate email: ${user.email}` });
            }
            emailSet.add(user.email);
        });

        const allErrors = [...errors, ...duplicateErrors];

        // If preview only, return parsed data with validation results
        if (previewOnly) {
            // Check existing invitations/members
            const { data: existingInvites } = await supabase
                .from('invitations')
                .select('email')
                .eq('organization_id', organizationId)
                .eq('status', 'pending');

            const { data: existingMembers } = await supabase
                .from('organization_members')
                .select('user_id, users!inner(email)')
                .eq('organization_id', organizationId);

            const existingEmails = new Set([
                ...(existingInvites || []).map((i: any) => i.email.toLowerCase()),
                ...(existingMembers || []).map((m: any) => m.users?.email?.toLowerCase()).filter(Boolean)
            ]);

            const usersWithStatus = users.map(user => ({
                ...user,
                status: existingEmails.has(user.email) ? 'exists' : 'new'
            }));

            return NextResponse.json({
                preview: true,
                users: usersWithStatus,
                errors: allErrors,
                summary: {
                    total: users.length,
                    new: usersWithStatus.filter(u => u.status === 'new').length,
                    existing: usersWithStatus.filter(u => u.status === 'exists').length,
                    errors: allErrors.length
                }
            });
        }

        // If there are validation errors, don't proceed
        if (allErrors.length > 0) {
            return NextResponse.json({
                error: 'Validation errors found',
                errors: allErrors
            }, { status: 400 });
        }

        // Create invitations for each user
        const results = {
            created: 0,
            skipped: 0,
            errors: [] as string[]
        };

        for (const user of users) {
            // Check if already a member or has pending invite
            const { data: existingMember } = await supabase
                .from('organization_members')
                .select('user_id')
                .eq('organization_id', organizationId)
                .eq('user_id', user.email)
                .single();

            if (existingMember) {
                results.skipped++;
                continue;
            }

            const { data: existingInvite } = await supabase
                .from('invitations')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('email', user.email)
                .eq('status', 'pending')
                .single();

            if (existingInvite) {
                results.skipped++;
                continue;
            }

            // Create invitation
            const { error: inviteError } = await supabase
                .from('invitations')
                .insert({
                    email: user.email,
                    organization_id: organizationId,
                    role: user.role,
                    invited_by: invitedBy,
                    status: 'pending'
                });

            if (inviteError) {
                results.errors.push(`Failed to invite ${user.email}: ${inviteError.message}`);
            } else {
                results.created++;
            }
        }

        return NextResponse.json({
            success: true,
            results
        });

    } catch (error: any) {
        console.error('Import API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

