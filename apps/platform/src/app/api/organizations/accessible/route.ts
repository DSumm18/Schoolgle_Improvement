import { NextRequest } from "next/server";
import { apiError, apiSuccess, protectedRoute } from "@/lib/api-utils";
import { createServiceRoleClient } from "@/lib/supabase-server";
import {
  buildAccessibleOrganizationList,
  isParentOrganization,
  type AccessibleOrganization,
  type ChildOrganization,
} from "@/lib/organizations/accessible-organizations";
import { filterOrganizationsForRuntimeAccess } from "@/lib/environment-safety";

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
  organization_id: string;
  role: string | null;
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
      let query = supabase
        .from("organizations")
        .select("id, name, organization_type, parent_organization_id, urn, settings")
        .order("name", { ascending: true });

      if (targetOrganizationId) {
        query = query.eq("id", targetOrganizationId);
      }

      const { data: allOrganizations, error: allOrganizationsError } = await query;

      if (allOrganizationsError) return apiError(allOrganizationsError.message, 500);

      const organizations = filterOrganizationsForRuntimeAccess(
        (allOrganizations ?? []).map((organization) => ({
          ...(organization as OrganizationRow),
          role: "admin",
        })),
      );

      return apiSuccess({ organizations });
    }

    const { data: memberships, error: membershipError } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: true });

    if (membershipError) return apiError(membershipError.message, 500);

    const membershipRows = (memberships ?? []) as OrganizationMembershipRow[];
    const roleByOrganizationId = new Map(
      membershipRows.map((membership) => [
        membership.organization_id,
        membership.role || "viewer",
      ]),
    );
    const directOrganizationIds = membershipRows.map(
      (membership) => membership.organization_id,
    );

    let directMemberships: AccessibleOrganization[] = [];
    if (directOrganizationIds.length > 0) {
      const { data: directOrganizations, error: directOrganizationsError } =
        await supabase
          .from("organizations")
          .select("id, name, organization_type, parent_organization_id, urn, settings")
          .in("id", directOrganizationIds);

      if (directOrganizationsError) {
        return apiError(directOrganizationsError.message, 500);
      }

      directMemberships = (directOrganizations ?? []).map((organization) => ({
        ...(organization as OrganizationRow),
        role: roleByOrganizationId.get(organization.id) || "viewer",
      }));
    }

    const trustMemberships = directMemberships.filter(isParentOrganization);

    let childOrganizations: ChildOrganization[] = [];
    if (trustMemberships.length > 0) {
      const trustIds = trustMemberships.map((org) => org.id);

      const { data: children, error: childError } = await supabase
        .from("organizations")
        .select("id, name, organization_type, parent_organization_id, urn, settings")
        .in("parent_organization_id", trustIds)
        .order("name", { ascending: true });

      if (childError) return apiError(childError.message, 500);

      childOrganizations = (children ?? []) as ChildOrganization[];
    }

    const organizations = filterOrganizationsForRuntimeAccess(
      buildAccessibleOrganizationList({
        directOrganizations: directMemberships,
        childOrganizations,
        targetOrganizationId,
      }),
    );

    return apiSuccess({ organizations });
  },
  { orgOptional: true, rateLimit: false },
);
