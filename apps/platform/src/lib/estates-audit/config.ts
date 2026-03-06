/**
 * Configuration for the Estates Audit feature.
 * API keys should be set via environment variables, NOT hardcoded.
 */

export const getEstatesAuditConfig = () => {
  const getGoogleMapsApiKey = (): string => {
    // Check environment variable first
    if (
      typeof process !== "undefined" &&
      process.env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    ) {
      return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    }
    // Check localStorage for user-provided key (set via settings)
    if (typeof window !== "undefined") {
      const storedKey = localStorage.getItem("estates_audit_api_key");
      if (storedKey) return storedKey;
    }
    // Return empty string - user must configure
    console.warn(
      "Google Maps API key not configured. Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY or configure in settings.",
    );
    return "";
  };

  return {
    googleMapsApiKey: getGoogleMapsApiKey(),
  };
};

export const config = getEstatesAuditConfig();

export default getEstatesAuditConfig;
