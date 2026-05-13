import { protectedRoute, apiError } from "@/lib/api-utils";

/**
 * Public shared-folder connections are intentionally disabled for Ofsted.
 * Evidence should be connected through the Schoolgle Connector so scans stay
 * inside the approved Schoolgle folder/vault boundary.
 */
export const POST = protectedRoute(async () => {
  return apiError(
    "Ofsted evidence must be connected through the secure Schoolgle Connector in Data Connections. Public shared-link folders are not accepted.",
    400,
  );
});
