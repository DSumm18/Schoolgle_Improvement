export type AccessibleOrganizationType = "school" | "trust" | "local_authority";

export type AccessibleOrganization = {
  id: string;
  name: string;
  organization_type: AccessibleOrganizationType;
  parent_organization_id: string | null;
  urn?: string | null;
  settings?: {
    logo_url?: string | null;
    trust_logo_url?: string | null;
  } | null;
  role: string;
};

export type ChildOrganization = Omit<AccessibleOrganization, "role">;

type BuildAccessibleOrganizationListInput = {
  directOrganizations: AccessibleOrganization[];
  childOrganizations?: ChildOrganization[];
  targetOrganizationId?: string | null;
};

export function isParentOrganization(organization: {
  organization_type: string;
}) {
  return (
    organization.organization_type === "trust" ||
    organization.organization_type === "local_authority"
  );
}

export function buildAccessibleOrganizationList({
  directOrganizations,
  childOrganizations = [],
  targetOrganizationId,
}: BuildAccessibleOrganizationListInput) {
  const roleByParentId = new Map(
    directOrganizations
      .filter(isParentOrganization)
      .map((organization) => [organization.id, organization.role]),
  );

  const byId = new Map<string, AccessibleOrganization>();

  for (const organization of directOrganizations) {
    byId.set(organization.id, organization);
  }

  for (const child of childOrganizations) {
    byId.set(child.id, {
      ...child,
      role: roleByParentId.get(child.parent_organization_id ?? "") || "viewer",
    });
  }

  let organizations = Array.from(byId.values()).sort((a, b) => {
    if (a.parent_organization_id === b.id) return 1;
    if (b.parent_organization_id === a.id) return -1;
    return a.name.localeCompare(b.name);
  });

  if (targetOrganizationId) {
    organizations = organizations.filter((org) => org.id === targetOrganizationId);
  }

  return organizations;
}
