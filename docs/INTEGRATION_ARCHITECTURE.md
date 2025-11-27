# Schoolgle Platform Integration Architecture

## 🎯 Recommended Approach: Federated Monorepo

**Keep apps as independent modules but share core infrastructure.**

```
schoolgle/
├── apps/
│   ├── web/                    # Main Schoolgle platform (this repo)
│   ├── compliance/             # Compliance suite (from Vercel repo)
│   ├── estates/                # Estates management
│   ├── hr/                     # HR hub
│   └── finance/                # Finance module
├── packages/
│   ├── ui/                     # Shared component library
│   ├── auth/                   # Unified Supabase auth
│   ├── database/               # Shared Supabase client & types
│   ├── ai/                     # Shared AI/LLM utilities
│   └── billing/                # Stripe/subscription logic
└── tooling/
    ├── eslint-config/
    └── typescript-config/
```

---

## 🏗️ Integration Options Compared

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Merge into single repo** | Single deployment, shared code | Large codebase, complex merges | ❌ Too risky |
| **Keep separate repos** | Independent deployments | Auth/billing complexity | ❌ Fragmented |
| **Monorepo with Turborepo** | Best of both, shared packages | Initial setup effort | ✅ **Recommended** |
| **Micro-frontends** | Ultimate flexibility | Over-engineered for our scale | ❌ Overkill |

---

## 📦 What to Share vs. Keep Separate

### Shared (packages/)

```typescript
// @schoolgle/ui - Shared components
export { Button, Card, Modal, Table, Form } from './components';
export { useToast, useDialog } from './hooks';

// @schoolgle/auth - Unified authentication
export { AuthProvider, useAuth, withAuth } from './auth';
export { ProtectedRoute, RoleGuard } from './guards';

// @schoolgle/database - Supabase client
export { supabase, createServerClient } from './client';
export type { Database, Tables } from './types';

// @schoolgle/ai - AI utilities
export { useAI, trackAICost, calculateCost } from './ai';
export { EdChat, AIAssistant } from './components';

// @schoolgle/billing - Subscription management
export { useSubscription, checkAccess, hasApp } from './billing';
```

### App-Specific (apps/)

Each app maintains its own:
- Routes & pages
- Domain-specific components
- Business logic
- API routes

---

## 🔐 Unified Authentication

```typescript
// Single Supabase project for all apps
// packages/auth/provider.tsx

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const supabase = createClient();
    
    // Single session across all apps
    const session = useSession(supabase);
    
    // Organization & subscription context
    const organization = useOrganization(session?.user?.id);
    const subscription = useSubscription(organization?.id);
    const enabledApps = useEnabledApps(subscription);
    
    return (
        <AuthContext.Provider value={{ 
            session, 
            organization, 
            subscription,
            enabledApps,
            hasAccess: (appId: string) => enabledApps.includes(appId)
        }}>
            {children}
        </AuthContext.Provider>
    );
}
```

---

## 💳 App Access Control

```typescript
// packages/billing/access.ts

export interface AppAccess {
    appId: string;
    included: boolean;      // In base subscription
    purchased: boolean;     // Bought as add-on
    bundleId?: string;      // Part of bundle
    expiresAt?: Date;
}

export function checkAppAccess(
    subscription: Subscription,
    appId: string
): AppAccess {
    // Core apps always included
    const coreApps = ['ofsted-framework', 'siams-framework', 'ed-ai-coach'];
    if (coreApps.includes(appId)) {
        return { appId, included: true, purchased: false };
    }
    
    // Check subscription add-ons
    const addon = subscription.addons?.find(a => a.appId === appId);
    if (addon) {
        return { appId, included: false, purchased: true, expiresAt: addon.expiresAt };
    }
    
    // Check bundles
    const bundle = subscription.bundles?.find(b => b.apps.includes(appId));
    if (bundle) {
        return { appId, included: false, purchased: true, bundleId: bundle.id };
    }
    
    return { appId, included: false, purchased: false };
}
```

---

## 🎨 Unified UI Theme

```typescript
// packages/ui/theme.ts

export const schoolgleTheme = {
    colors: {
        // Core palette - clean grayscale
        background: '#FAFAFA',
        foreground: '#111111',
        muted: '#F5F5F5',
        border: '#E5E5E5',
        
        // Accent by module
        modules: {
            'school-improvement': { primary: '#3B82F6', gradient: 'from-blue-500 to-indigo-600' },
            'compliance': { primary: '#EF4444', gradient: 'from-red-500 to-rose-600' },
            'estates': { primary: '#14B8A6', gradient: 'from-cyan-500 to-teal-600' },
            'finance': { primary: '#22C55E', gradient: 'from-green-500 to-emerald-600' },
            'hr': { primary: '#8B5CF6', gradient: 'from-purple-500 to-violet-600' },
            'teaching': { primary: '#F59E0B', gradient: 'from-amber-500 to-orange-600' },
            'send': { primary: '#EC4899', gradient: 'from-pink-500 to-rose-600' },
        }
    },
    
    // Consistent spacing, typography, etc.
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
    radius: { sm: 8, md: 12, lg: 16, xl: 24 },
    fonts: { sans: 'Inter, system-ui, sans-serif' }
};
```

---

## 📊 Unified Dashboard

The main dashboard shows all accessible apps:

```typescript
// apps/web/app/dashboard/page.tsx

export default function Dashboard() {
    const { enabledApps, organization } = useAuth();
    const { pendingActions } = useActions(organization.id);
    const { healthScore } = useHealth(organization.id);
    
    return (
        <div>
            {/* Monday Dashboard - always visible */}
            <MondayDashboard 
                actions={pendingActions}
                healthScore={healthScore}
            />
            
            {/* App Grid - shows enabled apps */}
            <AppGrid apps={enabledApps} />
            
            {/* Cross-app notifications */}
            <NotificationCenter />
        </div>
    );
}
```

---

## 🔄 Migration Strategy

### Phase 1: Core Platform (NOW)
- ✅ Ofsted Framework
- ✅ SIAMS Framework  
- ✅ Ed AI Coach
- ✅ Action Planning
- ✅ Admin Dashboard

### Phase 2: Revenue Generators (Week 1-2)
- [ ] One-Click Reports
- [ ] Mock Inspector
- [ ] Voice Observation
- [ ] Marketplace/App Store

### Phase 3: Compliance Suite (Week 3-4)
- [ ] Policy Hub (from Vercel repo)
- [ ] Risk Register
- [ ] Incident Logger
- [ ] Website Monitor

### Phase 4: Estates & Energy (Week 5-6)
- [ ] Energy Dashboard (from Vercel repo)
- [ ] Estates Audit
- [ ] Carbon Reporting

### Phase 5: HR & Finance (Week 7-8)
- [ ] HR Hub
- [ ] Minute Taker AI
- [ ] Budget Planner

---

## 🛠️ Migration Checklist per App

For each app migrated from Vercel repo:

```markdown
- [ ] Review existing code quality
- [ ] Check for hardcoded values/credentials
- [ ] Identify shared vs app-specific components
- [ ] Update auth to use @schoolgle/auth
- [ ] Update database to use @schoolgle/database
- [ ] Apply @schoolgle/ui theme
- [ ] Add usage tracking hooks
- [ ] Test with subscription access control
- [ ] Add to marketplace
- [ ] Update documentation
```

---

## 💰 Revenue Priority

**Focus on apps that can generate revenue immediately:**

| Priority | App | Price | Effort | Revenue Potential |
|----------|-----|-------|--------|-------------------|
| 🔴 HIGH | One-Click Reports | £149 | Low | High - instant value |
| 🔴 HIGH | Mock Inspector | £199 | Low | High - unique feature |
| 🔴 HIGH | Compliance Suite Bundle | £799 | Medium | High - SBM need |
| 🟡 MED | Voice Observation | £199 | Medium | Medium - niche |
| 🟡 MED | Energy Dashboard | £199 | Medium | Medium - estates |
| 🟢 LOW | Lesson Planner | £99 | High | Low - competitive |

---

## 🚀 Quick Wins from Vercel Repo

Apps that are mostly ready to port:

1. **Policy Hub** - Well structured, needs auth swap
2. **Risk Register** - Similar to actions, easy port
3. **Energy Dashboard** - Standalone, minimal changes
4. **Website Monitor** - Independent, easy to integrate
5. **Minute Taker** - Popular feature, good revenue

---

## 📁 Recommended Git Strategy

```bash
# Keep main platform in current repo
git@github.com:DSumm18/Schoolgle_Improvement.git

# Create packages repo for shared code
git@github.com:DSumm18/schoolgle-packages.git

# Keep Vercel repo as reference/archive
git@github.com:DSumm18/Vercel--schoolgle.git (read-only)

# Or convert to Turborepo monorepo
git@github.com:DSumm18/schoolgle-platform.git (monorepo)
```

**Recommendation: Start with simple approach**
1. Keep Schoolgle_Improvement as main repo
2. Copy specific apps/components as needed
3. Migrate to monorepo later when it makes sense

---

## ✅ Next Steps

1. **This week**: Ship marketplace UI + checkout flow
2. **Next week**: Port 2-3 revenue-generating apps
3. **Ongoing**: Review old code before porting
4. **Future**: Consider Turborepo if complexity grows

