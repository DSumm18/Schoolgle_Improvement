"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Zap,
  Activity,
  ChevronLeft,
  ChevronRight,
  Shield,
  Rocket,
  Users,
  CreditCard,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/mission-control", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mission-control/clients", label: "CRM Pipeline", icon: Users },
  { href: "/mission-control/finance", label: "Finance Hub", icon: CreditCard },
  { href: "/mission-control/approvals", label: "Approvals", icon: CheckSquare },
  { href: "/mission-control/skills", label: "Skill Registry", icon: Zap },
  { href: "/mission-control/activity", label: "Activity Log", icon: Activity },
];

export default function MCSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Don't show sidebar on not-authorized page
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar */}
      <aside
        className={`flex flex-col border-r border-zinc-800 bg-zinc-900 transition-all duration-200 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600">
            <Rocket className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="truncate text-sm font-bold text-zinc-100">
                Mission Control
              </h1>
              <p className="truncate text-xs text-zinc-500">Schoolgle Ops</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-3">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/mission-control" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-violet-600/20 text-violet-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Security badge */}
        <div className="border-t border-zinc-800 px-3 py-3">
          {!collapsed && (
            <div className="flex items-center gap-2 text-xs text-zinc-600">
              <Shield className="h-3 w-3" />
              <span>Admin Access Only</span>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center border-t border-zinc-800 py-2 text-zinc-500 hover:text-zinc-300"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
