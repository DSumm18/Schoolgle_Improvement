"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  LayoutDashboard,
  FileCheck,
  TrendingUp,
  Target,
  AlertTriangle,
  School,
  BarChart3,
  CreditCard,
  Settings,
  ShieldCheck,
  LogOut,
  Lock,
  Target as TargetIcon
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

interface NavigationItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  module?: string; // Module required for this feature
  description?: string;
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
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasModuleAccess, setHasModuleAccess] = useState<Record<string, boolean>>({});
  const [edChatbotOpen, setEdChatbotOpen] = useState(true);
  const [edChatbotMinimized, setEdChatbotMinimized] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean; moduleName: string; moduleDescription: string }>({
    isOpen: false,
    moduleName: '',
    moduleDescription: '',
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // Wait for auth to fully load, then redirect if no user
    // IMPORTANT: Don't redirect if user exists but has no organization - they should see onboarding
    if (!authLoading) {
      if (!user && !session) {
        console.log('[Dashboard Layout] No user or session, redirecting to login');
        router.push("/login");
      } else if (user || session) {
        const userId = user?.id || session?.user?.id;
        console.log('[Dashboard Layout] User authenticated:', userId);
        // If user has no organization, they should be on onboarding page, not dashboard
        // But don't redirect here - let the callback handle that
      }
    }
  }, [user, session, authLoading, router]);

  useEffect(() => {
    async function fetchCurrentOrg() {
      if (!currentOrgId || !session) return; // Wait for session

      try {
        // Use shared client - it has the session
        const { data, error } = await supabase
          .from('organizations')
          .select('id, name, organization_type')
          .eq('id', currentOrgId)
          .single();

        if (error) {
          console.error('Error fetching organization:', error);
          return;
        }

        setCurrentOrg(data);
      } catch (error) {
        console.error('Error in fetchCurrentOrg:', error);
      } finally {
        setLoading(false);
      }
    }

    if (currentOrgId && session) {
      fetchCurrentOrg();
    } else if (organization?.id) {
      setCurrentOrgId(organization.id);
    } else {
      setLoading(false);
    }
  }, [currentOrgId, organization, session]);

  useEffect(() => {
    async function checkModuleAccess() {
      if (!organizationId || !session) return; // Wait for session

      try {
        // Use shared client - it has the session
        // Check module access using RPC function
        const modules = ['ofsted_inspector', 'precision_suite', 'financial_analysis'];
        const access: Record<string, boolean> = {};

        for (const module of modules) {
          const { data, error } = await supabase.rpc('organization_has_module', {
            org_id: organizationId,
            module_id_param: module,
          });

          access[module] = !error && data === true;
        }

        setHasModuleAccess(access);
      } catch (error) {
        console.error('Error checking module access:', error);
      }
    }

    if (organizationId && session) {
      checkModuleAccess();
    }
  }, [organizationId, session]);

  // Check if user is super admin
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

  const handleNavClick = (item: NavigationItem, e: React.MouseEvent) => {
    if (item.module && !hasModuleAccess[item.module]) {
      e.preventDefault();
      setUpgradeModal({
        isOpen: true,
        moduleName: item.module.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        moduleDescription: item.description || `Access to ${item.label} features`,
      });
    } else {
      track('navigation_click', {
        key: item.key,
        label: item.label,
        href: item.href
      });
    }
  };

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

  const isTrust = currentOrg?.organization_type === 'trust';
  const isSchool = currentOrg?.organization_type === 'school';
  const isLA = currentOrg?.organization_type === 'local_authority';

  // Define navigation items with module requirements
  const schoolNavItems: NavigationItem[] = [
    {
      key: 'dashboard',
      label: 'Risk Dashboard',
      icon: <LayoutDashboard size={18} />,
      href: '/dashboard',
    },
    {
      key: 'evidence',
      label: 'My Evidence',
      icon: <FileCheck size={18} />,
      href: '/dashboard/evidence',
      module: 'ofsted_inspector',
      description: 'Evidence matching and Ofsted preparation tools',
    },
    {
      key: 'interventions',
      label: 'Interventions',
      icon: <TrendingUp size={18} />,
      href: '/dashboard/interventions',
      module: 'precision_suite',
      description: 'Precision teaching and intervention tracking',
    },
    {
      key: 'action-plan',
      label: 'Action Plan',
      icon: <Target size={18} />,
      href: '/dashboard/action-plan',
      description: 'Strategic school improvement planning',
    },
    {
      key: 'risk',
      label: 'Risk Profile',
      icon: <AlertTriangle size={18} />,
      href: '/dashboard/risk',
    },
  ];

  const trustNavItems: NavigationItem[] = [
    {
      key: 'dashboard',
      label: 'Trust Dashboard',
      icon: <LayoutDashboard size={18} />,
      href: '/dashboard',
    },
    {
      key: 'schools',
      label: 'My Schools',
      icon: <School size={18} />,
      href: '/dashboard/schools',
    },
    {
      key: 'reports',
      label: 'Trust Reports',
      icon: <BarChart3 size={18} />,
      href: '/dashboard/reports',
    },
  ];

  const navItems = isSchool ? schoolNavItems : trustNavItems;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar - Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Schoolgle</h1>
          <p className="text-xs text-gray-500 mt-1">Inspection Readiness</p>
        </div>

        {/* Org Switcher */}
        {user && (
          <div className="p-4 border-b border-gray-200">
            <OrgSwitcher
              currentOrgId={currentOrgId || organizationId || organization?.id || ''}
              onOrgChange={handleOrgChange}
            />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isLocked = item.module && !hasModuleAccess[item.module];
            return (
              <a
                key={item.key}
                href={isLocked ? '#' : item.href}
                onClick={(e) => handleNavClick(item, e)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isLocked
                  ? 'text-gray-400 cursor-not-allowed hover:bg-gray-50'
                  : 'text-gray-700 hover:bg-gray-100'
                  }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {isLocked && <Lock size={14} className="text-gray-400" />}
              </a>
            );
          })}

          {/* Common Navigation */}
          <div className="pt-4 mt-4 border-t border-gray-200 space-y-1">
            <a
              href="/dashboard/account"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <CreditCard size={18} />
              Account & Billing
            </a>
            <a
              href="/dashboard/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Settings size={18} />
              Settings
            </a>
            {isSuperAdmin && (
              <a
                href="/admin/super"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <ShieldCheck size={18} />
                Super Admin
              </a>
            )}
            {organization?.role === 'admin' && (
              <a
                href="https://control.schoolgle.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <ShieldCheck size={18} />
                Mission Control
              </a>
            )}
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Status</span>
            <NotificationBell />
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium text-sm">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {user.user_metadata?.full_name || user.email}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {currentOrg?.name || organization?.name}
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Center Stage - Main Content */}
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${edChatbotOpen && !edChatbotMinimized ? 'mr-96' : ''}`}>
        {children}
      </main>

      {/* Right Drawer - Ed Chatbot (Collapsible) */}
      <EdWidgetWrapper
        isOpen={edChatbotOpen}
        onToggle={() => setEdChatbotOpen(!edChatbotOpen)}
        isMinimized={edChatbotMinimized}
        onToggleMinimize={() => setEdChatbotMinimized(!edChatbotMinimized)}
      />

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        moduleName={upgradeModal.moduleName}
        moduleDescription={upgradeModal.moduleDescription}
        onClose={() => setUpgradeModal({ ...upgradeModal, isOpen: false })}
      />

      {/* Debug Environment Variables (hidden, logs to console) */}
      <DebugEnv />

      {/* Operations Support */}
      <SupportWidget />
    </div >
  );
}
