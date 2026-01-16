# Schoolgle Website Unification - Implementation Plan

## Overview

This document provides a **step-by-step implementation sequence** to unify the Schoolgle customer-facing website to a dark-first brand with controlled orbit motif, replacing the heavy particle effects and consolidating duplicate components.

**Total estimated steps**: 12 PR-sized steps
**Target completion**: All customer-facing pages using unified dark-first aesthetic

---

## Step 1: Install & Configure shadcn/ui

**PR Title**: `feat: install shadcn/ui component library`

**Objective**: Set up the foundation for all interactive UI components

**Actions**:

1. **Install shadcn/ui**:
   ```bash
   npx shadcn@latest init
   # Configuration:
   # - Style: default
   # - Base color: slate
   # - CSS variables: true
   # - Tailwind config: existing
   # - Components path: @/components/ui
   ```

2. **Install initial components**:
   ```bash
   npx shadcn@latest add button input label form dialog sheet navigation-menu dropdown-menu
   ```

3. **Verify structure**:
   - `apps/platform/src/components/ui/` created
   - `components.json` created at root
   - Tailwind config updated with `ui` alias

**Files Created**:
- `apps/platform/src/components/ui/button.tsx`
- `apps/platform/src/components/ui/input.tsx`
- `apps/platform/src/components/ui/label.tsx`
- `apps/platform/src/components/ui/form.tsx`
- `apps/platform/src/components/ui/dialog.tsx`
- `apps/platform/src/components/ui/sheet.tsx`
- `apps/platform/src/components/ui/navigation-menu.tsx`
- `apps/platform/src/components/ui/dropdown-menu.tsx`

**Files Modified**:
- `apps/platform/tailwind.config.ts` (if needed)
- `components.json` (created)

**Testing**:
- Import Button component and verify rendering
- Test dark mode compatibility

---

## Step 2: Update Design Tokens (Dark-First Default)

**PR Title**: `feat: update design tokens to dark-first for customer website`

**Objective**: Change CSS variables so dark mode is the default for the customer-facing website

**Actions**:

1. **Rename and reorganize tokens** in `apps/platform/src/app/globals.css`:
   ```css
   /* Before */
   :root {
     --lp-bg: #F4F6F8;  /* Light default */
   }
   .dark {
     --lp-bg: #050510;  /* Dark mode */
   }

   /* After */
   :root {
     /* Brand tokens - DARK FIRST (customer-facing default) */
     --brand-bg: #050510;
     --brand-bg-sec: #0A0A18;
     --brand-text: #F4F6F8;
     --brand-text-sec: #94a3b8;
     --brand-text-muted: #64748b;
     --brand-border: rgba(255, 255, 255, 0.1);
     --brand-border-hover: rgba(255, 255, 255, 0.2);
     --brand-accent: #3b82f6;
     --brand-amber: #f59e0b;
     --brand-glass-bg: rgba(10, 10, 30, 0.6);
     --brand-glass-border: rgba(255, 255, 255, 0.1);
     --brand-glass-blur: 12px;
   }

   /* Optional light theme for dashboard/forms */
   .theme-light {
     --brand-bg: #ffffff;
     --brand-bg-sec: #f8fafc;
     --brand-text: #0f172a;
     --brand-text-sec: #475569;
     --brand-text-muted: #64748b;
     --brand-border: rgba(0, 0, 0, 0.08);
     --brand-border-hover: rgba(0, 0, 0, 0.15);
     --brand-accent: #2563eb;
     --brand-amber: #d97706;
     --brand-glass-bg: rgba(255, 255, 255, 0.7);
     --brand-glass-border: rgba(0, 0, 0, 0.05);
   }

   /* Legacy alias for gradual migration */
   --lp-bg: var(--brand-bg);
   --lp-text: var(--brand-text);
   /* etc... */
   ```

2. **Update root layout** to use dark theme by default:
   ```tsx
   // apps/platform/src/app/layout.tsx
   <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
   ```

**Files Modified**:
- `apps/platform/src/app/globals.css`

**Testing**:
- Verify homepage renders in dark mode by default
- Verify light theme toggle still works
- Check all `--lp-*` variables still resolve

---

## Step 3: Create Brand Component Library

**PR Title**: `feat: create shared brand component library`

**Objective**: Create the foundational components that will be used across the customer-facing website

**Actions**:

1. **Create directory**:
   ```bash
   mkdir -p apps/platform/src/components/brand
   ```

2. **Create components**:

   **`OrbitCard.tsx`** - Tactile card with hover effects:
   ```tsx
   interface OrbitCardProps {
     children: React.ReactNode;
     className?: string;
     interactive?: boolean;
   }
   // Usage: glass-card with hover:border-brand-accent/50, hover:-translate-y-1
   ```

   **`Section.tsx`** - Standard section wrapper:
   ```tsx
   interface SectionProps {
     children: React.ReactNode;
     className?: string;
     variant?: 'default' | 'tight' | 'full';
   }
   ```

   **`MicroLabel.tsx`** - Small uppercase labels:
   ```tsx
   interface MicroLabelProps {
     children: React.ReactNode;
     color?: 'accent' | 'amber' | 'muted';
   }
   // Usage: text-[10px] font-black uppercase tracking-widest
   ```

   **`DisplayHeading.tsx`** - Large editorial headings:
   ```tsx
   interface DisplayHeadingProps {
     children: React.ReactNode;
     size?: 'h1' | 'h2' | 'h3';
     accent?: boolean;
   }
   // Usage: 130px max, outfit font, tracking-tighter
   ```

   **`index.ts`** - Barrel export

3. **Create tests** (optional but recommended):
   - Verify hover states work
   - Check responsive spacing

**Files Created**:
- `apps/platform/src/components/brand/OrbitCard.tsx`
- `apps/platform/src/components/brand/Section.tsx`
- `apps/platform/src/components/brand/MicroLabel.tsx`
- `apps/platform/src/components/brand/DisplayHeading.tsx`
- `apps/platform/src/components/brand/index.ts`

**Testing**:
- Import and render each component
- Verify dark mode styling
- Test responsive behavior

---

## Step 4: Create Controlled OrbitBackground

**PR Title**: `feat: create controlled OrbitBackground component`

**Objective**: Replace the heavy `AntigravityBackground` with a subtle, controlled orbit motif

**Actions**:

1. **Create `OrbitBackground.tsx`**:
   ```tsx
   interface OrbitBackgroundProps {
     density?: 'sparse' | 'medium' | 'dense';
     speed?: 'slow' | 'medium' | 'fast';
     variant?: 'hero' | 'footer' | 'empty';
     className?: string;
   }
   ```

2. **Implementation approach**:
   - Use Canvas or SVG (lighter than Three.js)
   - 20-50 orbit dots max (sparse)
   - Slow, gentle animation
   - Mouse interaction: subtle parallax only
   - Color: `--brand-accent` with low opacity

3. **Usage patterns**:
   - **Hero**: Medium density, positioned behind text
   - **Footer**: Sparse density, bottom corner
   - **Empty states**: Sparse, centered

**Files Created**:
- `apps/platform/src/components/effects/OrbitBackground.tsx`

**Files Modified**:
- `apps/platform/src/components/effects/index.ts` (export)

**Testing**:
- Performance: < 16ms per frame
- Visual: Subtle, doesn't compete with content
- Responsive: Works on mobile

---

## Step 5: Create Unified Navbar Component

**PR Title**: `feat: create unified dark glassmorphism Navbar`

**Objective**: Replace both `website/Navbar.tsx` and the landing hero navbar with a single component

**Actions**:

1. **Create `brand/Navbar.tsx`**:
   ```tsx
   interface NavbarProps {
     variant?: 'transparent' | 'glass';
   }
   ```

2. **Spec**:
   - Dark glassmorphism: `bg-brand-glass-bg backdrop-blur-xl`
   - Border: `border-b border-brand-border`
   - Logo: `SchoolgleAnimatedLogo` (size 180px, showText: false)
   - Nav items: shadcn/ui `NavigationMenu`
   - CTA: shadcn/ui `Button`
   - Mobile menu: shadcn/ui `Sheet`

3. **Navigation structure**:
   ```tsx
   <nav className="sticky top-0 z-50 bg-brand-glass-bg backdrop-blur-xl border-b border-brand-border">
     <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
       {/* Logo */}
       <Link href="/">
         <SchoolgleAnimatedLogo size={180} showText={false} />
       </Link>

       {/* Desktop nav */}
       <NavigationMenu className="hidden md:flex">
         <NavigationMenuItem>
           <Link href="/insights">Insights</Link>
         </NavigationMenuItem>
         <NavigationMenuItem>
           <Link href="/toolbox">Toolbox</Link>
         </NavigationMenuItem>
       </NavigationMenu>

       {/* CTA + Theme Toggle */}
       <div className="flex items-center gap-4">
         <ThemeToggle />
         <Button variant="default" asChild>
           <Link href="#early-access">Early Access</Link>
         </Button>
       </div>
     </div>
   </nav>
   ```

**Files Created**:
- `apps/platform/src/components/brand/Navbar.tsx`

**Testing**:
- Responsive: Mobile menu works
- Sticky positioning: Stays on scroll
- Dark mode: All elements visible

---

## Step 6: Create Insight Filters (Search UI)

**PR Title**: `feat: create editorial Insight filters component`

**Objective**: Build a non-chat-like search/filter interface for the Insights page

**Actions**:

1. **Create `brand/InsightFilters.tsx`**:
   ```tsx
   interface InsightFiltersProps {
     categories: string[];
     selectedCategory: string;
     onCategoryChange: (category: string) => void;
     searchQuery: string;
     onSearchChange: (query: string) => void;
   }
   ```

2. **Design**:
   - **NOT** a chat input
   - Horizontal category pills
   - Subtle search input with icon
   - Dark glassmorphism container

3. **Implementation**:
   ```tsx
   <div className="
     flex items-center gap-4 flex-wrap
     p-3 rounded-2xl
     bg-brand-bg-sec border border-brand-border
     backdrop-blur-md
   ">
     {/* Category pills */}
     {categories.map(cat => (
       <button
         key={cat}
         className={`
           px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider
           transition-all duration-300
           ${selectedCategory === cat
             ? 'bg-brand-accent text-white'
             : 'bg-brand-border hover:bg-brand-border-hover'
           }
         `}
       >
         {cat}
       </button>
     ))}

     {/* Search input */}
     <div className="relative ml-auto">
       <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-sec" size={16} />
       <input
         type="search"
         placeholder="Filter insights..."
         value={searchQuery}
         onChange={(e) => onSearchChange(e.target.value)}
         className="
           pl-10 pr-4 py-2 rounded-xl
           bg-brand-bg border border-brand-border
           text-sm text-brand-text
           focus:border-brand-accent focus:ring-0
         "
       />
     </div>
   </div>
   ```

**Files Created**:
- `apps/platform/src/components/brand/InsightFilters.tsx`

**Files Modified**:
- `apps/platform/src/app/insights/page.tsx` (use new component)

**Testing**:
- Filter clicking updates display
- Search input filters results
- Responsive on mobile

---

## Step 7: Refactor Homepage (Critical)

**PR Title**: `feat: refactor homepage to dark-first unified aesthetic`

**Objective**: Convert the homepage from generic light theme to flagship dark aesthetic

**Actions**:

1. **Update `app/page.tsx`**:
   - Remove `OrigamiParticles`
   - Add `OrbitBackground` (variant: hero)
   - Replace all `website/` component imports with `brand/` equivalents

2. **Component migrations**:
   - `website/Navbar` → `brand/Navbar`
   - `website/Hero` → Use `landing/Hero` pattern or create new
   - `website/ProblemStatement` → Dark theme version
   - `website/Differentiation` → Use `OrbitCard` components
   - `website/HowItWorks` → Dark theme, editorial treatment
   - `website/TrustSection` → Dark theme
   - `website/PreviewModules` → `OrbitCard` based
   - `website/InsightsSection` → Match `/insights` aesthetic
   - `website/EarlyAccessForm` → shadcn/ui Form
   - `website/Footer` → Use `landing/Footer`

3. **Content review**:
   - Ensure all copy uses UK English
   - Check for generic "AI buzzword soup"
   - Verify calm, direct, lightly witty tone

**Files Modified**:
- `apps/platform/src/app/page.tsx`

**Testing**:
- Homepage displays in dark mode
- All sections render correctly
- Animations are smooth
- Orbit motif visible but subtle

---

## Step 8: Update Insights Page (Flagship Polish)

**PR Title**: `feat: polish Insights page with OrbitBackground and filters`

**Objective**: Apply final touches to the flagship Insights page

**Actions**:

1. **Add `OrbitBackground`**:
   ```tsx
   // app/insights/page.tsx
   <OrbitBackground variant="hero" density="sparse" />
   ```

2. **Integrate `InsightFilters`**:
   - Add filter state management
   - Filter insights by category
   - Search functionality

3. **Refine card interactions**:
   - Ensure `OrbitCard` hover states work
   - Verify rolodex scroll effect
   - Check mobile responsiveness

4. **Verify dark theme**:
   - All text uses `--brand-text` variables
   - Cards use `glass-card` utility
   - Accents use `--brand-accent`

**Files Modified**:
- `apps/platform/src/app/insights/page.tsx`

**Testing**:
- Filters work correctly
- Search filters results
- Cards animate smoothly
- Dark mode consistent

---

## Step 9: Refactor Generic Feature Page

**PR Title**: `feat: refactor generic feature page to use brand components`

**Objective**: Update `app/features/[slug]/page.tsx` to use unified aesthetic

**Actions**:

1. **Add `OrbitBackground`**:
   ```tsx
   <OrbitBackground variant="empty" density="sparse" />
   ```

2. **Use brand components**:
   - Replace `website/Navbar` with `brand/Navbar`
   - Replace `website/Footer` with `landing/Footer`
   - Use `DisplayHeading` for title
   - Use `MicroLabel` for badges
   - Use shadcn/ui `Button` for CTA

3. **Improve content**:
   - Better placeholder copy
   - Module-specific color integration
   - Consider showing relevant features

**Files Modified**:
- `apps/platform/src/app/features/[slug]/page.tsx`

**Testing**:
- Dynamic slug works
- Dark theme applies
- Brand components render

---

## Step 10: Archive Legacy Background Effects

**PR Title**: `chore: archive AntigravityBackground, move to legacy`

**Objective**: Remove heavy particle effects from production while preserving for potential future use

**Actions**:

1. **Create `effects/legacy/` directory**:
   ```bash
   mkdir -p apps/platform/src/components/effects/legacy
   ```

2. **Move files**:
   - Move `AntigravityBackground.tsx` → `effects/legacy/`

3. **Update root layout**:
   ```tsx
   // app/layout.tsx
   // BEFORE:
   import AntigravityBackground from "@/components/effects/AntigravityBackground";
   <AntigravityBackground />

   // AFTER:
   // Removed - pages use OrbitBackground selectively
   ```

4. **Update `OrigamiParticles.tsx`**:
   - Keep in main `effects/` for now
   - Document as "for special use cases only"
   - Add JSDoc comment explaining intended usage

**Files Created**:
- `apps/platform/src/components/effects/legacy/.gitkeep`

**Files Moved**:
- `apps/platform/src/components/effects/AntigravityBackground.tsx` → `effects/legacy/AntigravityBackground.tsx`

**Files Modified**:
- `apps/platform/src/app/layout.tsx`

**Testing**:
- No AntigravityBackground renders
- Site performance improves
- No console errors

---

## Step 11: Cleanup Deprecated website/ Components

**PR Title**: `chore: remove deprecated website/ components after migration`

**Objective**: Clean up the duplicate component set

**Actions**:

1. **Delete unused components**:
   - `website/AudienceSection.tsx`
   - `website/BlogSection.tsx`
   - `website/CoreProducts.tsx`
   - `website/ImprovementFeatures.tsx`
   - `website/WhatSchoolgleDoes.tsx`
   - `website/WhySchoolgle.tsx`
   - `website/DownloadSection.tsx`

2. **Delete replaced components**:
   - `website/Navbar.tsx` (replaced by `brand/Navbar`)
   - `website/Footer.tsx` (using `landing/Footer`)
   - `website/Hero.tsx` (replaced)
   - `website/Differentiation.tsx` (replaced)
   - `website/HowItWorks.tsx` (replaced)
   - `website/ProblemStatement.tsx` (replaced)
   - `website/TrustSection.tsx` (replaced)

3. **Refactor remaining (if still needed)**:
   - `website/EarlyAccessForm.tsx` → convert to shadcn/ui Form
   - `website/PreviewModules.tsx` → convert to use OrbitCard
   - `website/InsightsSection.tsx` → convert
   - `website/Testimonials.tsx` → convert

4. **Optionally delete entire `website/` directory** once all migrations complete:
   ```bash
   rm -rf apps/platform/src/components/website/
   ```

**Files Deleted**:
- All deprecated `website/` components

**Testing**:
- No broken imports
- Site still functions
- All pages use new components

---

## Step 12: Final Polish & Documentation

**PR Title**: `docs: complete website unification, update documentation`

**Objective**: Final polish, documentation updates, and verification

**Actions**:

1. **Update design documentation**:
   - Update `docs/DESIGN_SYSTEM.md` with new tokens
   - Document `brand/` component usage
   - Add OrbitBackground usage guidelines

2. **Create component documentation**:
   - Storybook or inline documentation for brand components
   - Usage examples for each component

3. **Performance audit**:
   - Lighthouse scores
   - Animation performance (60fps)
   - Bundle size check

4. **Accessibility audit**:
   - ARIA labels
   - Keyboard navigation
   - Screen reader testing
   - Focus states

5. **Cross-browser testing**:
   - Chrome, Firefox, Safari, Edge
   - Mobile Safari (iOS)
   - Chrome Mobile (Android)

6. **Update CLAUDE.md**:
   - Document new component structure
   - Update build/dev commands if needed
   - Note dark-first default

**Files Modified**:
- `docs/DESIGN_SYSTEM.md`
- `CLAUDE.md`
- `README.md` (if applicable)

**Testing**:
- All audit checks pass
- Documentation is accurate
- Team can onboard successfully

---

## Rollout Strategy

### Recommended Order

1. **Foundation** (Steps 1-3): shadcn/ui, tokens, brand components
2. **Core Components** (Steps 4-6): OrbitBackground, Navbar, Filters
3. **Pages** (Steps 7-9): Homepage, Insights, Features
4. **Cleanup** (Steps 10-11): Legacy effects, deprecated components
5. **Final** (Step 12): Documentation and polish

### Branch Strategy

- Create `feature/website-unification` branch
- Each step is a separate commit
- Merge to `main` after each step (or batch 2-3 steps together)

### Testing Between Steps

After each step:
1. Run `npm run dev` locally
2. Test on mobile viewport
3. Test dark/light mode toggle
4. Check console for errors
5. Verify no visual regressions

---

## Component Gaps Tracking

### Phase 1 (This Plan)
- [x] shadcn/ui components
- [x] Design tokens
- [x] Brand component library
- [x] OrbitBackground
- [x] Navbar
- [x] InsightFilters

### Phase 2 (Future Work)
- [ ] Early access form (shadcn/ui Form)
- [ ] Module preview cards (OrbitCard)
- [ ] Testimonials carousel
- [ ] Pricing/CTA sections
- [ ] Blog listing page
- [ ] Toolbox page

---

## Success Criteria

After completing all 12 steps:

✅ **Visual**: All customer-facing pages use unified dark-first aesthetic
✅ **Brand**: Orbit/planet identity is prominent, not competing
✅ **Performance**: No heavy particle effects, < 2s initial load
✅ **Maintainability**: Single source of truth for components
✅ **Documentation**: Clear usage guidelines for all components
✅ **Accessibility**: WCAG AA compliance across all pages

---

## File Creation Summary

| Step | Files Created | Files Modified | Files Deleted/Moved |
|------|---------------|----------------|---------------------|
| 1 | 8 (shadcn/ui) | tailwind.config.ts | - |
| 2 | - | globals.css | - |
| 3 | 5 (brand/) | - | - |
| 4 | 1 (OrbitBackground) | effects/index.ts | - |
| 5 | 1 (Navbar) | - | - |
| 6 | 1 (InsightFilters) | insights/page.tsx | - |
| 7 | - | page.tsx | - |
| 8 | - | insights/page.tsx | - |
| 9 | - | features/[slug]/page.tsx | - |
| 10 | 1 (legacy/) | layout.tsx | 1 moved |
| 11 | - | - | ~15 deleted |
| 12 | docs updates | Various docs | - |

**Total**: ~17 files created, ~8 files modified, ~16 files deleted/moved
