type RuntimeEnv = Record<string, string | undefined>;

type OrganizationLike = {
  id: string;
};

export type OrganizationRuntimeAccessBlock = {
  code: "PROTECTED_LIVE_ORG_BLOCKED" | "LOCAL_ORG_NOT_ALLOWED";
  message: string;
};

const NON_PRODUCTION_DB_ENVIRONMENTS = new Set([
  "test",
  "uat",
  "staging",
  "preview",
]);

function normalizeList(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export function isLocalOrUatRuntime(env: RuntimeEnv = process.env): boolean {
  const nodeEnvironment = env.NODE_ENV;
  const vercelEnvironment = env.VERCEL_ENV;
  const databaseEnvironment =
    env.SCHOOLGLE_DB_ENV ?? env.NEXT_PUBLIC_SCHOOLGLE_DB_ENV ?? "";

  return (
    nodeEnvironment === "development" ||
    NON_PRODUCTION_DB_ENVIRONMENTS.has(databaseEnvironment.toLowerCase()) ||
    (!!vercelEnvironment && vercelEnvironment !== "production")
  );
}

export function getOrganizationRuntimeAccessBlock({
  organizationId,
  env = process.env,
}: {
  organizationId: string | null | undefined;
  method?: string;
  env?: RuntimeEnv;
}): OrganizationRuntimeAccessBlock | null {
  if (!organizationId || !isLocalOrUatRuntime(env)) {
    return null;
  }

  const protectedOrganizationIds = normalizeList(
    env.SCHOOLGLE_PROTECTED_LIVE_ORG_IDS,
  );

  if (protectedOrganizationIds.has(organizationId)) {
    return {
      code: "PROTECTED_LIVE_ORG_BLOCKED",
      message:
        "This organization is protected from local/UAT access. Switch to a test organization or use the production app.",
    };
  }

  const allowedOrganizationIds = normalizeList(
    env.SCHOOLGLE_LOCAL_ALLOWED_ORG_IDS,
  );

  if (allowedOrganizationIds.size > 0 && !allowedOrganizationIds.has(organizationId)) {
    return {
      code: "LOCAL_ORG_NOT_ALLOWED",
      message:
        "This organization is not in the local/UAT allow-list. Switch to an approved test organization before continuing.",
    };
  }

  return null;
}

export function filterOrganizationsForRuntimeAccess<TOrganization extends OrganizationLike>(
  organizations: TOrganization[],
  env: RuntimeEnv = process.env,
): TOrganization[] {
  return organizations.filter(
    (organization) =>
      !getOrganizationRuntimeAccessBlock({
        organizationId: organization.id,
        method: "GET",
        env,
      }),
  );
}
