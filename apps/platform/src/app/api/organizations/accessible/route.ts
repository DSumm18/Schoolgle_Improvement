import { NextRequest } from "next/server";
import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";

type OrganizationRow = {
  id: string;
  name: string;
  organization_type: "school" | "trust" | "local_authority";
  parent_organization_id: string | null;
  urn?: string | null;
  settings?: {
    logo_url?: string | null;
    trust_logo_url?: string | null;
  } | null;
};

type OrganizationMembershipRow = {
  role: string | null;
  organization: OrganizationRow | OrganizationRow[] | null;
};

export const GET = protectedRoute(
  async (auth, req: NextRequest) => {
    const targetOrganizationId =
      req.nextUrl.searchParams.get("targetOrganizationId") ??
      req.nextUrl.searchParams.get("organizationId");
    const supabase = createServiceRoleClient();

    let { data: superAdmin } = await supabase
      .from("super_admins")
      .select("user_id")
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (!superAdmin && auth.email) {
      const { data: superAdminByEmail } = await supabase
        .from("super_admins")
        .select("user_id")
        .eq("email", auth.email)
        .maybeSingle();
      superAdmin = superAdminByEmail;
    }

    if (superAdmin) {
      const { data: allOrganizations, error: allOrganizationsError } = await supabase
        .from("organizations")
        .select("id, name, organization_type, parent_organization_id, urn, settings")
        .order("name", { ascending: true });

      if (allOrganizationsError) return apiError(allOrganizationsError.message, 500);

      let organizations = (allOrganizations ?? []).map((organization) => ({
        ...(organization as OrganizationRow),
        role: "admin",
      }));

      if (targetOrganizationId) {
        organizations = organizations.filter((org) => org.id === targetOrganizationId);
      }

      return apiSuccess({ organizations });
    }

    const { data, error } = await supabase
      .from("organization_members")
      .select(
        `
        role,
        organization_id,
        organization:organizations (
          id,
          name,
          organization_type,
          parent_organization_id,
          urn,
          settings
        )
      `,
      )
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: true });

    if (error) return apiError(error.message, 500);

    const directMemberships = ((data ?? []) as OrganizationMembershipRow[])
      .map((membership) => {
        const organization = Array.isArray(membership.organization)
          ? membership.organization[0]
          : membership.organization;

        if (!organization) return null;

        return {
          ...(organization as OrganizationRow),
          role: membership.role || "viewer",
        };
      })
      .filter(Boolean) as Array<OrganizationRow & { role: string }>;

    const trustMemberships = directMemberships.filter(
      (org) => org.organization_type === "trust" || org.organization_type === "local_authority",
    );

    let childOrganizations: Array<OrganizationRow & { role: string }> = [];
    if (trustMemberships.length > 0) {
      const trustIds = trustMemberships.map((org) => org.id);
      const roleByTrustId = new Map(trustMemberships.map((org) => [org.id, org.role]));

      const { data: children, error: childError } = await supabase
        .from("organizations")
        .select("id, name, organization_type, parent_organization_id, urn, settings")
        .in("parent_organization_id", trustIds)
        .order("name", { ascending: true });

      if (childError) return apiError(childError.message, 500);

      childOrganizations = (children ?? []).map((child) => ({
        ...(child as OrganizationRow),
        role: roleByTrustId.get(child.parent_organization_id ?? "") || "viewer",
      }));
    }

    const byId = new Map<string, OrganizationRow & { role: string }>();
    for (const org of [...directMemberships, ...childOrganizations]) {
      byId.set(org.id, org);
    }

    let organizations = Array.from(byId.values()).sort((a, b) => {
      if (a.parent_organization_id === b.id) return 1;
      if (b.parent_organization_id === a.id) return -1;
      return a.name.localeCompare(b.name);
    });

    if (targetOrganizationId) {
      organizations = organizations.filter((org) => org.id === targetOrganizationId);
    }

    return apiSuccess({ organizations });
  },
  { orgOptional: true, rateLimit: false },
);
