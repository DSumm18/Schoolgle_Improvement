import { NextRequest } from "next/server";
import { protectedRoute, apiSuccess, apiError } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

interface ImportUser {
  email: string;
  displayName: string;
  role: "admin" | "teacher" | "slt";
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

function validateRole(role: string): role is "admin" | "teacher" | "slt" {
  return ["admin", "teacher", "slt"].includes(role.toLowerCase());
}

function parseCSV(csvContent: string): {
  users: ImportUser[];
  errors: ValidationError[];
} {
  const lines = csvContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line);
  const users: ImportUser[] = [];
  const errors: ValidationError[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Handle CSV with commas inside quotes
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));

    if (values.length < 3) {
      errors.push({
        row: i + 1,
        field: "format",
        message: "Row must have email, name, and role",
      });
      continue;
    }

    const [email, displayName, role] = values;

    if (!email) {
      errors.push({ row: i + 1, field: "email", message: "Email is required" });
      continue;
    }

    if (!validateEmail(email)) {
      errors.push({
        row: i + 1,
        field: "email",
        message: `Invalid email format: ${email}`,
      });
      continue;
    }

    if (!displayName) {
      errors.push({ row: i + 1, field: "name", message: "Name is required" });
      continue;
    }

    if (!role) {
      errors.push({ row: i + 1, field: "role", message: "Role is required" });
      continue;
    }

    const normalizedRole = role.toLowerCase();
    if (!validateRole(normalizedRole)) {
      errors.push({
        row: i + 1,
        field: "role",
        message: `Invalid role: ${role}. Must be admin, teacher, or slt`,
      });
      continue;
    }

    users.push({
      email: email.toLowerCase(),
      displayName,
      role: normalizedRole as "admin" | "teacher" | "slt",
    });
  }

  return { users, errors };
}

export const POST = protectedRoute(async (auth, req: NextRequest) => {
  const supabase = createServiceRoleClient();

  const { csvContent, organizationId, invitedBy, previewOnly } =
    await req.json();
  const orgId = organizationId || auth.organizationId;

  if (!csvContent || !orgId || !invitedBy) {
    return apiError("Missing required fields", 400);
  }

  // Parse and validate CSV
  const { users, errors } = parseCSV(csvContent);

  // Check for duplicate emails in CSV
  const emailSet = new Set<string>();
  const duplicateErrors: ValidationError[] = [];
  users.forEach((user, index) => {
    if (emailSet.has(user.email)) {
      duplicateErrors.push({
        row: index + 2,
        field: "email",
        message: `Duplicate email: ${user.email}`,
      });
    }
    emailSet.add(user.email);
  });

  const allErrors = [...errors, ...duplicateErrors];

  // If preview only, return parsed data with validation results
  if (previewOnly) {
    // Check existing invitations/members
    const { data: existingInvites } = await supabase
      .from("invitations")
      .select("email")
      .eq("organization_id", orgId)
      .eq("status", "pending");

    const { data: existingMembers } = await supabase
      .from("organization_members")
      .select("user_id, users!inner(email)")
      .eq("organization_id", orgId);

    const existingEmails = new Set([
      ...(existingInvites || []).map((i: any) => i.email.toLowerCase()),
      ...(existingMembers || [])
        .map((m: any) => m.users?.email?.toLowerCase())
        .filter(Boolean),
    ]);

    const usersWithStatus = users.map((user) => ({
      ...user,
      status: existingEmails.has(user.email) ? "exists" : "new",
    }));

    return apiSuccess({
      preview: true,
      users: usersWithStatus,
      errors: allErrors,
      summary: {
        total: users.length,
        new: usersWithStatus.filter((u) => u.status === "new").length,
        existing: usersWithStatus.filter((u) => u.status === "exists").length,
        errors: allErrors.length,
      },
    });
  }

  // If there are validation errors, don't proceed
  if (allErrors.length > 0) {
    return apiError("Validation errors found", 400, undefined, allErrors);
  }

  // Create invitations for each user
  const results = {
    created: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const user of users) {
    // Check if already a member or has pending invite
    const { data: existingMember } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", orgId)
      .eq("user_id", user.email)
      .single();

    if (existingMember) {
      results.skipped++;
      continue;
    }

    const { data: existingInvite } = await supabase
      .from("invitations")
      .select("id")
      .eq("organization_id", orgId)
      .eq("email", user.email)
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      results.skipped++;
      continue;
    }

    // Create invitation
    const { error: inviteError } = await supabase.from("invitations").insert({
      email: user.email,
      organization_id: orgId,
      role: user.role,
      invited_by: invitedBy,
      status: "pending",
    });

    if (inviteError) {
      results.errors.push(
        `Failed to invite ${user.email}: ${inviteError.message}`,
      );
    } else {
      results.created++;
    }
  }

  return apiSuccess({
    success: true,
    results,
  });
});
