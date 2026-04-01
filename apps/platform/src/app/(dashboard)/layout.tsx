"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  MODULES,
  APPS,
  NAVBAR_CONFIG,
  canUserAccess,
  getModuleByPath,
  Role,
} from "@/lib/modules/registry";
import AppLauncher from "@/components/AppLauncher";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  LayoutDashboard,
  Target,
  CreditCard,
  Settings,
  ShieldCheck,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
  Menu,
  TrendingUp,
  Building2,
  Shield,
  Radio,
  Brain,
  GraduationCap,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import OrgSwitcher from "@/components/OrgSwitcher";
import UpgradeModal from "@/components/UpgradeModal";
import { supabase } from "@/lib/supabase";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Toaster } from "@/components/ui/toaster";
import useSWR from "swr";
import { fetcher } from "@/lib/fetchers";
import { EdChatbotProvider } from "@/components/EdChatbotProvider";
import { getContrastColor } from "@/lib/color-extractor";
import AccessibilityToolbar from "@/components/AccessibilityToolbar";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";

// 7-Planet module structure — defines how modules are grouped in the sidebar
const PLANET_GROUPS = [
  { id: "mercury", name: "School Improvement", color: "#6B7280", icon: TrendingUp, moduleIds: ["improvement"] },
  { id: "venus", name: "Governance", color: "#F59E0B", icon: ShieldCheck, moduleIds: ["governance"] },
  { id: "earth", name: "Business Operations", color: "#3B82F6", icon: Building2, moduleIds: ["finance", "hr", "estates"] },
  { id: "mars", name: "Compliance & Safeguarding", color: "#9F1239", icon: Shield, moduleIds: ["compliance", "safeguarding", "risk"] },
  { id: "jupiter", name: "Communications", color: "#F97316", icon: Radio, moduleIds: ["communications", "calendar", "surveys"] },
  { id: "saturn", name: "Intelligence", color: "#A78BFA", icon: Brain, moduleIds: ["attendance", "send", "behaviour", "canvas"] },
  { id: "uranus", name: "Teaching & Learning", color: "#06B6D4", icon: GraduationCap, moduleIds: ["teaching-learning"] },
];

// Map a pathname to its parent planet for auto-expand
function getPlanetByPath(path: string): (typeof PLANET_GROUPS)[number] | undefined {
  const module = getModuleByPath(path);
  if (!module) return undefined;
  return PLANET_GROUPS.find((p) => p.moduleIds.includes(module.id));
}

// Module IDs that are hidden from pilot
const HIDDEN_MODULE_IDS = new Set(MODULES.filter((m) => m.pilotHidden).map((m) => m.id));

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    user,
    session,
    loading: authLoading,
    signOut,
    organization,
    organizationId,
    displayName,
    switchOrganization,
  } = useAuth();
  const { track } = useAnalytics();
  const router = useRouter();
  const pathname = usePathname();
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean;
    moduleName: string;
    moduleDescription: string;
  }>({
    isOpen: false,
    moduleName: "",
    moduleDescription: "",
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const moduleRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fetch school branding (logo, colors) — re-fetches when org changes
  const brandingUrl = organizationId
    ? `/api/settings/branding?organizationId=${organizationId}`
    : null;
  const { data: brandingData, mutate: mutateBranding } = useSWR(
    user && brandingUrl ? brandingUrl : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );
  const schoolLogo = brandingData?.settings?.logo_url;

  const userRole = organization?.role as Role;

  // Color name → hex lookup
  const colorMap: Record<string, string> = {
    rose: "#f43f5e",
    blue: "#3b82f6",
    teal: "#14b8a6",
    purple: "#a855f7",
    amber: "#f59e0b",
    indigo: "#6366f1",
    gray: "#64748b",
    sky: "#0ea5e9",
    pink: "#ec4899",
    emerald: "#10b981",
    cyan: "#06b6d4",
    red: "#ef4444",
    orange: "#f97316",
    violet: "#8b5cf6",
  };

  // Scroll active module into view
  const scrollToModule = useCallback((moduleId: string) => {
    requestAnimationFrame(() => {
      const el = moduleRefs.current[moduleId];
      if (el && navRef.current) {
        const navRect = navRef.current.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        // Only scroll if element is not fully visible
        if (elRect.top < navRect.top || elRect.bottom > navRect.bottom) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });
  }, []);

  // Auto-expand planet group based on path and scroll to it
  useEffect(() => {
    const planet = getPlanetByPath(pathname);
    if (planet) {
      setExpandedModuleId(planet.id);
      scrollToModule(planet.id);
    }
    // Close mobile menu on navigation
    setIsMobileMenuOpen(false);
  }, [pathname, scrollToModule]);

  // Route Protection Check — only enforce if role is set
  useEffect(() => {
    if (
      !authLoading &&
      !loading &&
      userRole &&
      pathname !== "/dashboard/no-access"
    ) {
      const currentModule = getModuleByPath(pathname);
      const currentApp = APPS.find(
        (a) => pathname === a.route || pathname.startsWith(a.route + "/"),
      );

      if (
        currentApp &&
        !canUserAccess(currentApp.requiredPermissions, userRole)
      ) {
        router.push("/dashboard/no-access");
      } else if (
        currentModule &&
        !canUserAccess(currentModule.requiredPermissions, userRole)
      ) {
        router.push("/dashboard/no-access");
      }
    }
  }, [pathname, userRole, authLoading, loading, router]);

  useEffect(() => {
    // Only redirect when auth has fully resolved and there's genuinely no user
    // Use a delay to allow onAuthStateChange to deliver SIGNED_IN after INITIAL_SESSION
    if (!authLoading && !user && !session) {
      const timeout = setTimeout(() => {
        router.push("/login");
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [user, session, authLoading, router]);

  useEffect(() => {
    if (organization?.id) {
      setCurrentOrgId(organization.id);
      setLoading(false);
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [organization, authLoading]);

  useEffect(() => {
    async function checkSuperAdmin() {
      if (!user?.id || !session) return;

      try {
        // Try by user_id first
        let { data } = await supabase
          .from("super_admins")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        // Fallback to email check
        if (!data) {
          const { data: dataByEmail } = await supabase
            .from("super_admins")
            .select("user_id")
            .eq("email", user.email)
            .maybeSingle();
          data = dataByEmail;
        }

        setIsSuperAdmin(!!data);
      } catch (error) {
        console.error("Error checking super admin:", error);
      }
    }

    if (user?.id && session) {
      checkSuperAdmin();
    }
  }, [user?.id, session]);

  const handleOrgChange = async (orgId: string) => {
    setCurrentOrgId(orgId);
    await switchOrganization(orgId);
    // Re-fetch branding for new org
    mutateBranding();
    router.refresh();
  };

  // Build navigation from registry — show all if no role set (new user)
  const hasRole = !!userRole;
  const navigationItems = [
    ...NAVBAR_CONFIG.map((section) => ({
      section: section.name.toUpperCase(),
      type: "workspace" as const,
      items: section.items
        .filter(
          (item) =>
            !hasRole || canUserAccess(item.permissions as Role[], userRole),
        )
        .map((item) => ({
          id: item.id,
          name: item.name,
          href: item.route,
          icon: item.icon,
          color: undefined as string | undefined,
        })),
    })),
    {
      section: "MY MODULES",
      type: "modules" as const,
      items: PLANET_GROUPS
        .map((planet) => {
          // Only show planet if it has at least one visible (non-pilotHidden) module
          const visibleModuleIds = planet.moduleIds.filter((mid) => !HIDDEN_MODULE_IDS.has(mid));
          if (visibleModuleIds.length === 0) return null;
          // Check user has access to at least one module in this planet
          const accessibleModules = MODULES.filter(
            (m) => visibleModuleIds.includes(m.id) && (!hasRole || canUserAccess(m.requiredPermissions, userRole)),
          );
          if (accessibleModules.length === 0) return null;
          return {
            id: planet.id,
            name: planet.name,
            href: `/dashboard/${accessibleModules[0].id}`,
            icon: planet.icon,
            color: planet.color,
            moduleIds: planet.moduleIds,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null),
    },
    {
      section: "SETTINGS",
      type: "settings" as const,
      items: [
        {
          id: "skills",
          name: "Skill Library",
          href: "/dashboard/settings/skills",
          icon: Zap,
          color: undefined as string | undefined,
        },
        {
          id: "approvals",
          name: "Approval Hub",
          href: "/dashboard/settings/approvals",
          icon: ShieldCheck,
          color: undefined as string | undefined,
        },
        {
          id: "settings",
          name: "Settings",
          href: "/dashboard/settings",
          icon: Settings,
          color: undefined as string | undefined,
        },
        {
          id: "account",
          name: "Billing",
          href: "/dashboard/account",
          icon: CreditCard,
          color: undefined as string | undefined,
        },
      ],
    },
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Apply school's brand colors + font as CSS custom properties for theming
  const schoolColor = brandingData?.settings?.primary_color;
  const schoolSecondary = brandingData?.settings?.secondary_color;
  const schoolAccent = brandingData?.settings?.accent_color;
  const schoolFont: string | undefined = brandingData?.settings?.font_family;
  const themeStyle: React.CSSProperties = {
    ...(schoolColor
      ? {
          "--primary": schoolColor,
          "--primary-foreground": getContrastColor(schoolColor),
          "--ring": schoolColor,
        }
      : {}),
    ...(schoolSecondary ? { "--secondary": schoolSecondary } : {}),
    ...(schoolAccent ? { "--accent": schoolAccent } : {}),
    ...(schoolFont
      ? { fontFamily: `'${schoolFont}', ui-sans-serif, system-ui, sans-serif` }
      : {}),
  } as React.CSSProperties;

  return (
    <>
      {/* Impersonation Banner - shows when viewing as another organization */}
      <ImpersonationBanner />

      {/* Load school's Google Font if set */}
      {schoolFont && (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(schoolFont)}:wght@400;500;600;700&display=swap`}
        />
      )}
      <div
        className="min-h-screen bg-background text-foreground flex overflow-hidden pt-14"
        style={themeStyle}
      >
        {/* Mobile header bar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center justify-between px-4">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-sm truncate">
            {organization?.name || "Dashboard"}
          </span>
          <div className="flex items-center gap-1">
            <AccessibilityToolbar />
            <NotificationBell />
          </div>
        </div>

        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`bg-card border-r border-border flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out
            ${isSidebarExpanded ? "w-64" : "w-20"}
            max-lg:w-64 max-lg:top-14 ${isMobileMenuOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}
          `}
        >
          {/* Header with school logo + name */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              {isSidebarExpanded ? (
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {schoolLogo ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white border border-border flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={schoolLogo}
                        alt={organization?.name || "School logo"}
                        className="w-full h-full object-contain p-0.5"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <LayoutDashboard size={20} className="text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">
                      {organization?.name || "Dashboard"}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                      {organization?.organization_type === "trust"
                        ? "Multi-Academy Trust"
                        : "School Platform"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mx-auto">
                  {schoolLogo ? (
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-border flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={schoolLogo}
                        alt="Logo"
                        className="w-full h-full object-contain p-0.5"
                      />
                    </div>
                  ) : (
                    <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black text-xs">
                      {organization?.name?.[0] || "S"}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                className={`p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors shrink-0 ${!isSidebarExpanded ? "mx-auto mt-2" : "ml-2"}`}
              >
                {isSidebarExpanded ? (
                  <PanelLeftClose size={18} />
                ) : (
                  <PanelLeftOpen size={18} />
                )}
              </button>
            </div>
          </div>

          {/* App Launcher (4-squares) */}
          <div
            className={`px-6 py-4 flex items-center gap-4 ${!isSidebarExpanded ? "justify-center px-0" : ""}`}
          >
            <AppLauncher />
            {isSidebarExpanded && (
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  Active App
                </p>
                <p className="text-sm font-black truncate">
                  {APPS.find(
                    (a) =>
                      pathname === a.route ||
                      pathname.startsWith(a.route + "/"),
                  )?.name || "Dashboard"}
                </p>
              </div>
            )}
          </div>

          {user && isSidebarExpanded && (
            <div className="p-4 border-b border-border">
              <OrgSwitcher
                currentOrgId={
                  currentOrgId || organizationId || organization?.id || ""
                }
                onOrgChange={handleOrgChange}
              />
            </div>
          )}

          {/* Navigation with smooth hover-to-scroll */}
          <nav
            ref={navRef}
            className="flex-1 overflow-y-auto p-4 sidebar-scroll-container scroll-smooth"
            data-lenis-prevent
          >
            {navigationItems.map((section) => (
              <div key={section.section} className="mb-6 last:mb-0">
                {isSidebarExpanded && (
                  <h3 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    {section.section}
                  </h3>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item, itemIdx) => {
                    const itemModuleIds = (item as any).moduleIds as string[] | undefined;
                    const isModuleActive = itemModuleIds
                      ? itemModuleIds.some(
                          (mid) =>
                            pathname === `/dashboard/${mid}` ||
                            pathname.startsWith(`/dashboard/${mid}/`),
                        )
                      : pathname === item.href ||
                        (item.id && pathname.startsWith(item.href));
                    const isExpanded = expandedModuleId === item.id;
                    const subApps =
                      section.type === "modules" && itemModuleIds
                        ? APPS.filter(
                            (a) =>
                              itemModuleIds.includes(a.moduleId) &&
                              !HIDDEN_MODULE_IDS.has(a.moduleId) &&
                              !a.pilotHidden &&
                              (!hasRole ||
                                canUserAccess(a.requiredPermissions, userRole)),
                          )
                        : [];
                    const hasActiveSubApp = subApps.some(
                      (a) =>
                        pathname === a.route ||
                        pathname.startsWith(a.route + "/"),
                    );
                    const isActive = isModuleActive || hasActiveSubApp;
                    const moduleColor = item.color
                      ? colorMap[item.color] || item.color
                      : undefined;

                    return (
                      <motion.div
                        key={item.href}
                        ref={(el) => {
                          moduleRefs.current[item.id] = el;
                        }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIdx * 0.03 + 0.05 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => {
                            if (section.type === "modules") {
                              setExpandedModuleId(isExpanded ? null : item.id);
                            }
                          }}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${!isSidebarExpanded ? "justify-center" : ""} ${
                            isActive
                              ? "bg-primary/10 text-primary shadow-sm border border-primary/10"
                              : "text-foreground/70 hover:bg-accent hover:text-primary border border-transparent"
                          }`}
                          title={!isSidebarExpanded ? item.name : undefined}
                        >
                          <div className="relative">
                            <item.icon
                              size={18}
                              className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`}
                            />
                            {moduleColor && (
                              <div
                                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-card dark:border-background"
                                style={{ backgroundColor: moduleColor }}
                              />
                            )}
                          </div>
                          {isSidebarExpanded && (
                            <span className="flex-1">{item.name}</span>
                          )}
                          {isSidebarExpanded && subApps.length > 0 && (
                            <motion.div
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="text-muted-foreground"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                              >
                                <path
                                  d="M4.5 2.5L8 6L4.5 9.5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </motion.div>
                          )}
                          {isActive &&
                            isSidebarExpanded &&
                            subApps.length === 0 && (
                              <motion.div
                                layoutId="active-nav"
                                className="w-1.5 h-4 bg-primary rounded-full"
                                transition={{
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 30,
                                }}
                              />
                            )}
                        </Link>

                        {/* Sub-apps with animated expand/collapse */}
                        <AnimatePresence initial={false}>
                          {isExpanded &&
                            isSidebarExpanded &&
                            subApps.length > 0 && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  duration: 0.25,
                                  ease: "easeInOut",
                                }}
                                className="overflow-hidden"
                              >
                                <div
                                  className="ml-7 mt-1 mb-1 pl-3 border-l-2 space-y-0.5"
                                  style={{
                                    borderColor: moduleColor
                                      ? `${moduleColor}40`
                                      : "var(--border)",
                                  }}
                                >
                                  {subApps.map((app) => {
                                    const isSubActive =
                                      pathname === app.route ||
                                      pathname.startsWith(app.route + "/");
                                    return (
                                      <Link
                                        key={app.id}
                                        href={app.route}
                                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 ${
                                          isSubActive
                                            ? "text-primary bg-primary/10"
                                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                        }`}
                                      >
                                        <app.icon
                                          size={14}
                                          className={
                                            isSubActive
                                              ? "text-primary"
                                              : "text-muted-foreground"
                                          }
                                        />
                                        <span className="truncate">
                                          {app.name}
                                        </span>
                                        {isSubActive && (
                                          <motion.div
                                            layoutId="active-sub"
                                            className="ml-auto w-1.5 h-3 rounded-full shrink-0"
                                            style={{
                                              backgroundColor:
                                                moduleColor || "var(--primary)",
                                            }}
                                            transition={{
                                              type: "spring",
                                              stiffness: 300,
                                              damping: 30,
                                            }}
                                          />
                                        )}
                                      </Link>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}

            {isSuperAdmin && (
              <div className="mt-4 pt-4 border-t border-border">
                <Link
                  href="/admin/super"
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${pathname === "/admin/super" ? "bg-emerald-500/10 text-emerald-500" : "text-emerald-500 hover:bg-emerald-500/10"} transition-colors ${!isSidebarExpanded ? "justify-center" : ""}`}
                  title={!isSidebarExpanded ? "Super Admin" : undefined}
                >
                  <ShieldCheck size={18} />
                  {isSidebarExpanded && <span>Super Admin</span>}
                </Link>
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-border bg-accent/30">
            {/* User info row */}
            <div
              className={`flex items-center gap-3 ${!isSidebarExpanded ? "justify-center" : ""}`}
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                {(displayName ||
                  user.user_metadata?.full_name ||
                  user.email)?.[0]?.toUpperCase() || "U"}
              </div>
              {isSidebarExpanded && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">
                    {displayName ||
                      user.user_metadata?.full_name ||
                      user.email?.split("@")[0]}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate uppercase font-bold">
                    {organization?.role || "Staff"}
                  </div>
                </div>
              )}
            </div>

            {/* Actions row: Sign Out, Accessibility, Notifications */}
            <div
              className={`flex items-center gap-1 mt-3 ${!isSidebarExpanded ? "justify-center" : ""}`}
            >
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:bg-background hover:text-destructive border border-transparent hover:border-destructive/20 transition-all cursor-pointer"
                title="Sign Out"
              >
                <LogOut size={16} />
                {isSidebarExpanded && <span>Sign Out</span>}
              </button>
              {isSidebarExpanded && (
                <div className="flex items-center gap-1 ml-auto">
                  <AccessibilityToolbar />
                  <NotificationBell />
                </div>
              )}
            </div>

            {/* Ed AI button slot — right-aligned */}
            <div
              id="ed-sidebar-slot"
              className={`mt-3 flex ${isSidebarExpanded ? "justify-end" : "justify-center"}`}
            />
          </div>
        </aside>

        {/* Ed AI Assistant — provides context + renders widget */}
        <EdChatbotProvider>

        {/* Offset Ed widget to clear the sidebar */}
        <style>{`
          .ed-widget-container.ed-position-bottom-left {
            left: ${isSidebarExpanded ? "272px" : "88px"} !important;
            transition: left 300ms ease !important;
          }
          @media (max-width: 1024px) {
            .ed-widget-container.ed-position-bottom-left {
              left: 20px !important;
            }
          }
        `}</style>

        <main
          className={`flex-1 overflow-y-auto transition-all duration-500 ease-in-out bg-background text-foreground max-lg:ml-0 max-lg:pt-14 ${isSidebarExpanded ? "lg:ml-64" : "lg:ml-20"}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="min-h-screen"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <UpgradeModal
          isOpen={upgradeModal.isOpen}
          moduleName={upgradeModal.moduleName}
          moduleDescription={upgradeModal.moduleDescription}
          onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
        />

        <Toaster />
        </EdChatbotProvider>
      </div>
    </>
  );
}
