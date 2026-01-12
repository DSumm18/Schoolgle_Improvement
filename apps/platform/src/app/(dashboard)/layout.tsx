"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
    LayoutDashboard,
    TrendingUp,
    Target,
    AlertTriangle,
    CreditCard,
    Settings,
    ShieldCheck,
    LogOut,
    History,
    FileText,
    Briefcase,
    Clock,
    Users
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import OrgSwitcher from "@/components/OrgSwitcher";
import EdWidgetWrapper from "@/components/EdWidgetWrapper";
import UpgradeModal from "@/components/UpgradeModal";
import DebugEnv from "@/components/DebugEnv";
import SupportWidget from "@/components/support/SupportWidget";
import { supabase } from "@/lib/supabase";
import { useAnalytics } from "@/hooks/useAnalytics";

interface Organization {
    id: string;
    name: string;
    organization_type: 'school' | 'trust' | 'local_authority';
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, session, loading: authLoading, signOut, organization, organizationId } = useAuth();
    const { track } = useAnalytics();
    const router = useRouter();
    const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [edChatbotOpen, setEdChatbotOpen] = useState(true);
    const [edChatbotMinimized, setEdChatbotMinimized] = useState(false);
    const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean; moduleName: string; moduleDescription: string }>({
        isOpen: false,
        moduleName: '',
        moduleDescription: '',
    });
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

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

    const navigationItems = [
        {
            section: 'STRATEGIC INTELLIGENCE',
            items: [
                { name: 'Risk Dashboard', href: '/dashboard', icon: LayoutDashboard },
                { name: 'Action Plan', href: '/dashboard/action-plan', icon: Target },
                { name: 'Risk Profile', href: '/dashboard/risk', icon: AlertTriangle },
            ]
        },
        {
            section: 'NAVIGATOR',
            items: [
                { name: 'My Evidence', href: '/evidence', icon: FileText },
                { name: 'Governor Packs', href: '/packs', icon: Briefcase },
                { name: 'Audit Timeline', href: '/timeline', icon: Clock },
            ]
        },
        {
            section: 'OPERATIONS',
            items: [
                { name: 'Interventions', href: '/dashboard/interventions', icon: Users },
            ]
        },
        {
            section: 'SETTINGS',
            items: [
                { name: 'Settings', href: '/dashboard/settings', icon: Settings },
                { name: 'Billing', href: '/dashboard/account', icon: CreditCard },
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
        <div className="min-h-screen bg-gray-50 flex">
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed inset-y-0 left-0">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-xl font-black text-gray-900 tracking-tight">SCHOOLGLE</h1>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Inspection Ready</p>
                </div>

                {user && (
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
                            <h3 className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                                {section.section}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item) => (
                                    <a
                                        key={item.href}
                                        href={item.href}
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                                    >
                                        <item.icon size={18} />
                                        <span className="flex-1">{item.name}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}

                    {isSuperAdmin && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <a
                                href="/admin/super"
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                                <ShieldCheck size={18} />
                                Super Admin
                            </a>
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                            {user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-gray-900 truncate">
                                {user.user_metadata?.full_name || user.email?.split('@')[0]}
                            </div>
                            <div className="text-[10px] text-gray-500 truncate uppercase font-bold">
                                {organization?.role || 'Staff'}
                            </div>
                        </div>
                        <NotificationBell />
                    </div>
                    <button
                        onClick={signOut}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-white hover:text-red-600 border border-transparent hover:border-red-100 transition-all shadow-sm"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            <main className={`flex-1 overflow-y-auto transition-all duration-300 ml-64 ${edChatbotOpen && !edChatbotMinimized ? 'mr-96' : ''}`}>
                <div className="min-h-screen">
                    {children}
                </div>
            </main>

            <EdWidgetWrapper
                isOpen={edChatbotOpen}
                onToggle={() => setEdChatbotOpen(!edChatbotOpen)}
                isMinimized={edChatbotMinimized}
                onToggleMinimize={() => setEdChatbotMinimized(!edChatbotMinimized)}
            />

            <UpgradeModal
                isOpen={upgradeModal.isOpen}
                moduleName={upgradeModal.moduleName}
                moduleDescription={upgradeModal.moduleDescription}
                onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
            />

            <SupportWidget />
        </div >
    );
}
