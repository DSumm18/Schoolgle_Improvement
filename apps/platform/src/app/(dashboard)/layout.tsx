"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import OrgSwitcher from "@/components/OrgSwitcher";
import UpgradeModal from "@/components/UpgradeModal";
import { supabase } from "@/lib/supabase";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Toaster } from "@/components/ui/toaster";

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
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  const userRole = organization?.role as Role;

  // Auto-expand module based on path
  useEffect(() => {
    const module = getModuleByPath(pathname);
    if (module) {
      setExpandedModuleId(module.id);
    }
  }, [pathname]);

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
        const { data } = await supabase
          .from("super_admins")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        setIsSuperAdmin(!!data);
      } catch (error) {
        console.error("Error checking super admin:", error);
      }
    }

    if (user?.id && session) {
      checkSuperAdmin();
    }
  }, [user?.id, session]);

  const handleOrgChange = (orgId: string) => {
    setCurrentOrgId(orgId);
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
        })),
    })),
    {
      section: "MY MODULES",
      type: "modules" as const,
      items: MODULES.filter(
        (module) =>
          !hasRole || canUserAccess(module.requiredPermissions, userRole),
      ).map((module) => ({
        id: module.id,
        name: module.name,
        href: `/dashboard/${module.id}`,
        icon: module.icon,
        color: module.color,
      })),
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
        },
        {
          id: "approvals",
          name: "Approval Hub",
          href: "/dashboard/settings/approvals",
          icon: ShieldCheck,
        },
        {
          id: "settings",
          name: "Settings",
          href: "/dashboard/settings",
          icon: Settings,
        },
        {
          id: "account",
          name: "Billing",
          href: "/dashboard/account",
          icon: CreditCard,
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

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      <aside
        className={`bg-card border-r border-border flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out ${isSidebarExpanded ? "w-64" : "w-20"}`}
      >
        {/* Header with school name */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            {isSidebarExpanded && (
              <div>
                <h1 className="text-lg font-black tracking-tight">SCHOOLGLE</h1>
                <p className="text-[9px] font-bold text-primary uppercase tracking-widest">
                  Inspection Ready
                </p>
              </div>
            )}
            {!isSidebarExpanded && (
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black text-xs">
                S
              </div>
            )}
            <button
              onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
              className={`p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors ${!isSidebarExpanded ? "mx-auto" : ""}`}
            >
              {isSidebarExpanded ? (
                <PanelLeftClose size={18} />
              ) : (
                <PanelLeftOpen size={18} />
              )}
            </button>
          </div>
          {/* School/Organization Name */}
          {isSidebarExpanded && organization?.name && (
            <div className="mt-2 px-2 py-1.5 bg-accent/50 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <LayoutDashboard size={14} className="text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                    Current School
                  </p>
                  <p className="text-sm font-bold truncate">
                    {organization.name}
                  </p>
                </div>
              </div>
            </div>
          )}
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
                {APPS.find((a) => pathname === a.route)?.name || "Dashboard"}
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
          className="flex-1 overflow-y-scroll p-4 sidebar-scroll-container"
          data-lenis-prevent
        >
          {navigationItems.map((section) => (
            <div key={section.section} className="mb-6 last:mb-0">
              {isSidebarExpanded && (
                <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                  {section.section}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => {
                  const isActive =
                    pathname === item.href ||
                    (item.id && pathname.startsWith(item.href));
                  const isExpanded = expandedModuleId === item.id;
                  const subApps =
                    section.type === "modules"
                      ? APPS.filter(
                          (a) =>
                            a.moduleId === item.id &&
                            (!hasRole ||
                              canUserAccess(a.requiredPermissions, userRole)),
                        )
                      : [];

                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: itemIdx * 0.05 + 0.1 }}
                      className="space-y-1"
                    >
                      <Link
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${!isSidebarExpanded ? "justify-center" : ""} ${
                          isActive
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "text-foreground/80 hover:bg-accent hover:text-primary"
                        }`}
                        title={!isSidebarExpanded ? item.name : undefined}
                      >
                        <div className="relative">
                          <item.icon
                            size={18}
                            className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"}`}
                          />
                          {item.color && (
                            <div
                              className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-card dark:border-background"
                              style={{
                                backgroundColor:
                                  item.color === "rose"
                                    ? "#f43f5e"
                                    : item.color === "blue"
                                      ? "#3b82f6"
                                      : item.color === "teal"
                                        ? "#14b8a6"
                                        : item.color === "purple"
                                          ? "#a855f7"
                                          : item.color === "amber"
                                            ? "#f59e0b"
                                            : item.color === "indigo"
                                              ? "#6366f1"
                                              : item.color === "gray"
                                                ? "#64748b"
                                                : item.color === "sky"
                                                  ? "#0ea5e9"
                                                  : item.color === "pink"
                                                    ? "#ec4899"
                                                    : item.color === "emerald"
                                                      ? "#10b981"
                                                      : item.color === "cyan"
                                                        ? "#06b6d4"
                                                        : item.color === "red"
                                                          ? "#ef4444"
                                                          : item.color ===
                                                              "orange"
                                                            ? "#f97316"
                                                            : item.color ===
                                                                "violet"
                                                              ? "#8b5cf6"
                                                              : "#3b82f6",
                              }}
                            />
                          )}
                        </div>
                        {isSidebarExpanded && (
                          <span className="flex-1">{item.name}</span>
                        )}
                        {isActive && isSidebarExpanded && (
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

                      {/* Sub-apps */}
                      {isExpanded &&
                        isSidebarExpanded &&
                        subApps.length > 0 && (
                          <div className="ml-9 space-y-1">
                            {subApps.map((app) => (
                              <Link
                                key={app.id}
                                href={app.route}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                  pathname === app.route
                                    ? "text-primary bg-primary/10"
                                    : "text-muted-foreground hover:text-primary hover:bg-accent"
                                }`}
                              >
                                <app.icon
                                  size={12}
                                  className={
                                    pathname === app.route
                                      ? "text-primary"
                                      : "text-muted-foreground"
                                  }
                                />
                                {app.name}
                              </Link>
                            ))}
                          </div>
                        )}
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
          <div
            className={`flex items-center gap-3 mb-4 ${!isSidebarExpanded ? "justify-center" : ""}`}
          >
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
              {user.email?.[0]?.toUpperCase() || "U"}
            </div>
            {isSidebarExpanded && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </div>
                <div className="text-[10px] text-muted-foreground truncate uppercase font-bold">
                  {organization?.role || "Staff"}
                </div>
              </div>
            )}
            {isSidebarExpanded && <NotificationBell />}
          </div>
          <button
            onClick={signOut}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-muted-foreground hover:bg-background hover:text-destructive border border-transparent hover:border-destructive/20 transition-all shadow-sm cursor-pointer ${!isSidebarExpanded ? "justify-center" : "justify-center"}`}
            title={!isSidebarExpanded ? "Sign Out" : undefined}
          >
            <LogOut size={16} />
            {isSidebarExpanded && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main
        className={`flex-1 overflow-y-auto transition-all duration-500 ease-in-out bg-background text-foreground ${isSidebarExpanded ? "ml-64" : "ml-20"}`}
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
    </div>
  );
}
