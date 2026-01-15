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
    Role
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
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import OrgSwitcher from "@/components/OrgSwitcher";
import UpgradeModal from "@/components/UpgradeModal";
import { supabase } from "@/lib/supabase";
import { useAnalytics } from "@/hooks/useAnalytics";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, session, loading: authLoading, signOut, organization, organizationId } = useAuth();
    const { track } = useAnalytics();
    const router = useRouter();
    const pathname = usePathname();
    const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean; moduleName: string; moduleDescription: string }>({
        isOpen: false,
        moduleName: '',
        moduleDescription: '',
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

    // Route Protection Check
    useEffect(() => {
        if (!authLoading && !loading && userRole && pathname !== '/dashboard/no-access') {
            const currentModule = getModuleByPath(pathname);
            const currentApp = APPS.find(a => pathname === a.route || pathname.startsWith(a.route + '/'));

            if (currentApp && !canUserAccess(currentApp.requiredPermissions, userRole)) {
                router.push('/dashboard/no-access');
            } else if (currentModule && !canUserAccess(currentModule.requiredPermissions, userRole)) {
                router.push('/dashboard/no-access');
            }
        }
    }, [pathname, userRole, authLoading, loading, router]);

    useEffect(() => {
        if (!authLoading) {
            if (!user && !session) {
                router.push("/login");
            }
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
                    .from('super_admins')
                    .select('user_id')
                    .eq('user_id', user.id)
                    .maybeSingle();

                setIsSuperAdmin(!!data);
            } catch (error) {
                console.error('Error checking super admin:', error);
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

    // Build navigation from registry
    const navigationItems = [
        ...NAVBAR_CONFIG.map(section => ({
            section: section.name.toUpperCase(),
            type: 'workspace' as const,
            items: section.items
                .filter(item => canUserAccess(item.permissions as Role[], userRole))
                .map(item => ({
                    id: item.id,
                    name: item.name,
                    href: item.route,
                    icon: item.icon
                }))
        })),
        {
            section: 'MY MODULES',
            type: 'modules' as const,
            items: MODULES
                .filter(module => canUserAccess(module.requiredPermissions, userRole))
                .map(module => ({
                    id: module.id,
                    name: module.name,
                    href: `/dashboard/${module.id}`,
                    icon: module.icon,
                    color: module.color
                }))
        },
        {
            section: 'SETTINGS',
            type: 'settings' as const,
            items: [
                { id: 'settings', name: 'Settings', href: '/dashboard/settings', icon: Settings },
                { id: 'account', name: 'Billing', href: '/dashboard/account', icon: CreditCard },
            ]
        }
    ];

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex overflow-hidden">
            <aside className={`bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'w-64' : 'w-20'}`}>
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    {isSidebarExpanded && (
                        <div>
                            <h1 className="text-xl font-black text-gray-900 tracking-tight">SCHOOLGLE</h1>
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Inspection Ready</p>
                        </div>
                    )}
                    {!isSidebarExpanded && (
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">
                            S
                        </div>
                    )}
                    <button
                        onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
                        className={`p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors ${!isSidebarExpanded ? 'mx-auto' : ''}`}
                    >
                        {isSidebarExpanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
                    </button>
                </div>

                {/* App Launcher (4-squares) */}
                <div className={`px-6 py-4 flex items-center gap-4 ${!isSidebarExpanded ? 'justify-center px-0' : ''}`}>
                    <AppLauncher />
                    {isSidebarExpanded && (
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active App</p>
                            <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                                {APPS.find(a => pathname === a.route)?.name || 'Dashboard'}
                            </p>
                        </div>
                    )}
                </div>

                {user && isSidebarExpanded && (
                    <div className="p-4 border-b border-gray-200">
                        <OrgSwitcher
                            currentOrgId={currentOrgId || organizationId || organization?.id || ''}
                            onOrgChange={handleOrgChange}
                        />
                    </div>
                )}

                <nav className="flex-1 overflow-y-auto p-4">
                    {navigationItems.map((section) => (
                        <div key={section.section} className="mb-6 last:mb-0">
                            {isSidebarExpanded && (
                                <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    {section.section}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {section.items
                                    .map((item, itemIdx) => {
                                        const isActive = pathname === item.href || (item.id && pathname.startsWith(item.href));
                                        const isExpanded = expandedModuleId === item.id;
                                        const subApps = section.type === 'modules' ? APPS.filter(a => a.moduleId === item.id && canUserAccess(a.requiredPermissions, userRole)) : [];

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
                                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${!isSidebarExpanded ? 'justify-center' : ''} ${isActive
                                                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                                                        : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                                                        }`}
                                                    title={!isSidebarExpanded ? item.name : undefined}
                                                >
                                                    <div className="relative">
                                                        <item.icon
                                                            size={18}
                                                            className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`}
                                                        />
                                                        {item.color && (
                                                            <div
                                                                className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white dark:border-slate-900"
                                                                style={{
                                                                    backgroundColor: item.color === 'rose' ? '#f43f5e' :
                                                                        item.color === 'blue' ? '#3b82f6' :
                                                                            item.color === 'teal' ? '#14b8a6' :
                                                                                item.color === 'purple' ? '#a855f7' :
                                                                                    item.color === 'amber' ? '#f59e0b' :
                                                                                        item.color === 'indigo' ? '#6366f1' :
                                                                                            item.color === 'gray' ? '#64748b' : '#3b82f6'
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    {isSidebarExpanded && <span className="flex-1">{item.name}</span>}
                                                    {isActive && isSidebarExpanded && (
                                                        <motion.div
                                                            layoutId="active-nav"
                                                            className="w-1.5 h-4 bg-blue-600 rounded-full"
                                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                        />
                                                    )}
                                                </Link>

                                                {/* Sub-apps */}
                                                {isExpanded && isSidebarExpanded && subApps.length > 0 && (
                                                    <div className="ml-9 space-y-1">
                                                        {subApps.map((app) => (
                                                            <Link
                                                                key={app.id}
                                                                href={app.route}
                                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${pathname === app.route
                                                                    ? 'text-blue-600 bg-blue-50/50'
                                                                    : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'
                                                                    }`}
                                                            >
                                                                <app.icon size={12} className={pathname === app.route ? 'text-blue-600' : 'text-gray-400'} />
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
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <Link
                                href="/admin/super"
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${pathname === '/admin/super' ? 'bg-emerald-50 text-emerald-600' : 'text-emerald-600 hover:bg-emerald-50'} transition-colors ${!isSidebarExpanded ? 'justify-center' : ''}`}
                                title={!isSidebarExpanded ? 'Super Admin' : undefined}
                            >
                                <ShieldCheck size={18} />
                                {isSidebarExpanded && <span>Super Admin</span>}
                            </Link>
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                    <div className={`flex items-center gap-3 mb-4 ${!isSidebarExpanded ? 'justify-center' : ''}`}>
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        {isSidebarExpanded && (
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-gray-900 truncate">
                                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                </div>
                                <div className="text-[10px] text-gray-500 truncate uppercase font-bold">
                                    {organization?.role || 'Staff'}
                                </div>
                            </div>
                        )}
                        {isSidebarExpanded && <NotificationBell />}
                    </div>
                    <button
                        onClick={signOut}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-white hover:text-red-600 border border-transparent hover:border-red-100 transition-all shadow-sm ${!isSidebarExpanded ? 'justify-center' : 'justify-center'}`}
                        title={!isSidebarExpanded ? 'Sign Out' : undefined}
                    >
                        <LogOut size={16} />
                        {isSidebarExpanded && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            <main className={`flex-1 overflow-y-auto transition-all duration-500 ease-in-out ${isSidebarExpanded ? 'ml-64' : 'ml-20'}`}>
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
        </div >
    );
}
