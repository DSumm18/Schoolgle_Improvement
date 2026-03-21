"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Shield, ExternalLink } from "lucide-react";

export function ImpersonationBanner() {
  const router = useRouter();
  const [impersonatedOrg, setImpersonatedOrg] = useState<{
    id: string;
    name: string;
    by: string;
  } | null>(null);

  useEffect(() => {
    // Check for impersonation state
    const orgId = sessionStorage.getItem("impersonateOrgId");
    const orgName = sessionStorage.getItem("impersonateOrgName");
    const by = sessionStorage.getItem("impersonateBy");

    if (orgId && orgName) {
      setImpersonatedOrg({ id: orgId, name: orgName, by: by || "admin" });
    }
  }, []);

  const exitImpersonation = () => {
    sessionStorage.removeItem("impersonateOrgId");
    sessionStorage.removeItem("impersonateOrgName");
    sessionStorage.removeItem("impersonateBy");
    setImpersonatedOrg(null);
    router.push("/admin/super");
  };

  if (!impersonatedOrg) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <Shield size={16} className="animate-pulse" />
        <span className="text-sm font-medium">
          Viewing as <strong>{impersonatedOrg.name}</strong>
        </span>
        <span className="text-xs opacity-75">
          (Impersonated by {impersonatedOrg.by})
        </span>
      </div>
      <button
        onClick={exitImpersonation}
        className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm transition-colors"
      >
        <ExternalLink size={14} />
        Exit
        <X size={14} />
      </button>
    </div>
  );
}
