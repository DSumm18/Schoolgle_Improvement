# Schoolgle Website Audit Report

## Executive Summary

The Schoolgle customer-facing website currently has **two distinct design systems** operating in parallel, leading to brand inconsistency. The flagship "Insights" page demonstrates the desired dark-first premium aesthetic, while the homepage uses a generic light theme. Heavy particle effects (`AntigravityBackground`) compete with the orbit/planet brand identity rather than supporting it.

**Recommendation**: Unify to the dark-first "Insights" aesthetic with a controlled "OrbitBackground" motif replacing the heavy particle system.

---

## 1. Route/Page Map & Layout Patterns

### Public-Facing Routes

| Route | Page | Components Used | Theme | Notes |
|-------|------|-----------------|-------|-------|
| `/` | Homepage | `website/` components | Light (white) | Generic SaaS style |
| `/insights` | Insights listing | Custom dark theme | **Dark** | **Flagship design** |
| `/insights/[slug]` | Insight article | Custom dark theme | **Dark** | Matches listing |
| `/features/[slug]` | Generic feature | `website/Navbar` | Dark | Generic placeholder |
| `/hr`, `/finance`, `/send`, etc. | Module landings | `landing/ModuleLanding` | **Dark** | Premium aesthetic |
| `/toolbox` | Toolbox | TBD | TBD | Not yet implemented |
| `/compliance`, `/estates`, etc. | Module pages | `ModuleLanding` | **Dark** | Premium aesthetic |
| `/products/*` | Product pages | `website/` components | Light | Generic |
| `/signup` | Signup | Form | Mixed | Standard form |

### Layout Patterns

**Root Layout** (`apps/platform/src/app/layout.tsx`):
- Wraps all pages with `AntigravityBackground` (4000+ particles)
- Global `ThemeProvider` with `defaultTheme="dark"` (but not enforced)
- `SmoothScroll` wrapper
- `SupabaseAuthProvider`

**Dashboard Layout** (`apps/platform/(dashboard)/layout.tsx`):
- Separate layout for authenticated dashboard
- Not part of customer-facing website audit

**No shadcn/ui components currently installed.**

---

## 2. The Two Design Systems

### System A: `landing/` Components (Premium Dark)

**Location**: `apps/platform/src/components/landing/`

**Characteristics**:
- **Dark-first** with CSS variables (`--lp-bg`, `--lp-text`, etc.)
- **Editorial typography**: Massive headlines (130px), `outfit` font, uppercase tracking
- **Glassmorphism cards**: `glass-card`, `glass-panel` utilities
- **Tactile hovers**: Border brightening, gentle lifts
- **Orbit branding**: `SchoolgleAnimatedLogo` integration

**Components**:
1. `Hero.tsx` - Full-height hero with carousel, animated logo, module color system
2. `ModuleLanding.tsx` - Template for module pages with hero + feature grid
3. `FeatureGrid.tsx` - Scroll-linked stacking cards with rolodex effect
4. `Footer.tsx` - Dark theme with orbit watermark
5. `HowItWorks.tsx`, `ProblemSolution.tsx`, `CTASection.tsx` - Support sections

**Used by**: `/insights`, `/hr`, `/finance`, `/send`, `/teaching`, `/estates`, `/compliance`, `/governance`

**Visual Style**:
```
--lp-bg: #050510 (deep dark)
--lp-text: #F4F6F8
--lp-accent: #3b82f6
glass-card with blur(12px)
```

---

### System B: `website/` Components (Generic Light)

**Location**: `apps/platform/src/components/website/`

**Characteristics**:
- **Light/white default** with Tailwind gray palette
- **Generic SaaS aesthetics**: Standard spacing, Bootstrap-like feel
- **Simple components**: Basic motion, minimal styling
- **Template-like**: Reads like shadcn/ui default theme

**Components** (18 files):
1. `Hero.tsx` - Simple centered hero with generic messaging
2. `Navbar.tsx` - White nav with logo
3. `Footer.tsx` - Simple footer columns
4. `ProblemStatement.tsx` - Basic three-column grid
5. `Differentiation.tsx` - Icon + title + description cards
6. `HowItWorks.tsx` - Three-step process
7. `TrustSection.tsx`, `PreviewModules.tsx`, `InsightsSection.tsx`
8. `EarlyAccessForm.tsx`, `Testimonials.tsx`, `AudienceSection.tsx`
9. Plus: `CoreProducts.tsx`, `ImprovementFeatures.tsx`, `WhatSchoolgleDoes.tsx`, `WhySchoolgle.tsx`, `BlogSection.tsx`, `DownloadSection.tsx`

**Used by**: `/` (homepage), `/products/*`

**Visual Style**:
```
bg-white, text-gray-900, border-gray-200
Standard Tailwind gray palette
```

---

### Key Differences

| Aspect | `landing/` (Dark) | `website/` (Light) |
|--------|-------------------|-------------------|
| Background | `#050510` (deep dark) | `#ffffff` |
| Typography | 130px headlines, outfit, tracking | Standard sizes, inter |
| Cards | Glassmorphism, large radius (2.5rem) | Simple borders, 1xl radius |
| Motion | Scroll-linked, rolodex effects | Basic fade-in |
| Orbit brand | Prominent (`SchoolgleAnimatedLogo`) | Small in navbar |
| Overall vibe | Premium, editorial, distinctive | Generic, template-like |

---

## 3. Generic/Template-Like Components (Files to Refactor)

### High Priority - Reads Generic

| File | Issue | Replacement Strategy |
|------|-------|---------------------|
| `website/Hero.tsx` | Generic "Take the fear out of Ofsted" hero | Use `landing/Hero` pattern or create unified Hero |
| `website/Navbar.tsx` | White background, standard nav | Dark glassmorphism, orbit logo prominent |
| `website/Footer.tsx` | Basic columns | Use `landing/Footer` with orbit watermark |
| `website/Differentiation.tsx` | Icon grid, gray palette | Dark theme, larger cards, orbit accents |
| `website/HowItWorks.tsx` | Three-step standard layout | Scroll-linked narrative |
| `website/ProblemStatement.tsx` | Basic three-column | Editorial text treatment |
| `app/page.tsx` | Uses all `website/` components | Port to dark-first aesthetic |

### Medium Priority - Functional but Generic

| File | Issue | Notes |
|------|-------|-------|
| `website/EarlyAccessForm.tsx` | Standard form | Needs shadcn/ui Form component |
| `website/TrustSection.tsx` | Generic social proof | Rebuild with dark theme |
| `website/Testimonials.tsx` | Standard carousel | Consider cards with orbit motif |
| `website/PreviewModules.tsx` | Basic grid | Module cards need premium treatment |

### Low Priority - Niche Pages

- `website/AudienceSection.tsx`
- `website/BlogSection.tsx`
- `website/CoreProducts.tsx`
- `website/DownloadSection.tsx`
- `website/ImprovementFeatures.tsx`
- `website/WhatSchoolgleDoes.tsx`
- `website/WhySchoolgle.tsx`

---

## 4. Current Effects System (Issue)

### `AntigravityBackground.tsx`

**Location**: `apps/platform/src/components/effects/AntigravityBackground.tsx`

**Spec**:
- 4000+ particles with custom shaders
- Shape morphing (orb, document, shield, pencil)
- Mouse repulsion effects
- Spectral glow layers
- Module-specific color mapping

**Problem**:
- **Overpowers the brand** - Competes with orbit/planet identity
- **Performance heavy** - 4000 particles + shaders
- **"Tech demo" feel** - Not subtle, not controlled
- **Used globally** in root layout, on every page

**User Requirement**: "Particle-heavy effects... are NOT the default brand layer"

### `OrigamiParticles.tsx`

**Location**: `apps/platform/src/components/OrigamiParticles.tsx`

**Spec**:
- Canvas-based particle system forming text/shapes
- Mouse repulsion
- Shape variants (crane, shield, house, heart, hexagon, person)

**Status**: Used on homepage only (opacity 0.15), subtle enough but still heavy

---

## 5. Flagship Design: Insights Page Analysis

### `/insights` (The Gold Standard)

**File**: `apps/platform/src/app/insights/page.tsx`

**Design Characteristics**:
```typescript
// Background
bg-lp-bg (deep dark #050510)

// Typography
text-7xl md:text-[130px]  // Massive headlines
font-black                 // Maximum weight
outfit uppercase           // Display font
tracking-tighter           // Tight letter spacing

// Cards
glass-card
rounded-[2.5rem]           // Large radius
hover:border-lp-accent/50   // Border brightening
hover:-translate-y-2        // Tactile lift
transition-all duration-500 // Smooth motion

// Details
text-[10px] font-black uppercase tracking-widest  // Micro-labels
```

**Motion Patterns**:
- Rolodex scroll effect on cards
- Scroll-linked scale/opacity transforms
- Smooth, confident timing (500ms+)

**This is the target aesthetic for the entire website.**

---

## 6. Refactor Plan: Dark-First Unification

### Phase 1: Design Tokens Strategy

**File**: `apps/platform/src/app/globals.css`

**Current State**:
```css
:root {
  /* Landing Theme - LIGHT MODE DEFAULTS */
  --lp-bg: #F4F6F8;
  --lp-text: #050510;
}

.dark {
  /* Landing Theme - DARK MODE */
  --lp-bg: #050510;
  --lp-text: #F4F6F8;
}
```

**Proposed Change**:
```css
/* DARK-FIRST DEFAULT (for customer-facing website) */
:root {
  --brand-bg: #050510;
  --brand-bg-sec: #0A0A18;
  --brand-text: #F4F6F8;
  --brand-text-sec: #94a3b8;
  --brand-border: rgba(255, 255, 255, 0.1);
  --brand-accent: #3b82f6;
  --brand-glass-bg: rgba(10, 10, 30, 0.6);
  --brand-glass-blur: 12px;
}

/* LIGHT THEME (optional, for dashboard/forms) */
.theme-light {
  --brand-bg: #ffffff;
  --brand-bg-sec: #f8fafc;
  --brand-text: #0f172a;
  --brand-text-sec: #475569;
  --brand-border: rgba(0, 0, 0, 0.08);
  --brand-accent: #2563eb;
  --brand-glass-bg: rgba(255, 255, 255, 0.7);
}
```

**Naming Convention**: `--brand-*` instead of `--lp-*` for clarity

---

### Phase 2: Shared Component Wrappers

**New Directory Structure**:
```
apps/platform/src/components/
├── brand/                  # NEW: Shared brand components
│   ├── OrbitBackground.tsx     # Controlled orbit motif
│   ├── OrbitCard.tsx           # Tactile card with border brightening
│   ├── Section.tsx             # Standard section wrapper
│   ├── MicroLabel.tsx          # [10px] uppercase tracking labels
│   └── DisplayHeading.tsx      # Large editorial headlines
├── ui/                     # NEW: shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── form.tsx
│   ├── dialog.tsx
│   └── ...
├── landing/                # KEEP: For migration reference
└── website/                # DEPRECATED: Migrate or delete
```

**Component Specs**:

```typescript
// OrbitBackground.tsx
// Controlled, sparse, slow orbit dots
// Usage: Hero, Footer, Empty states only
// NOT as global background

interface OrbitBackgroundProps {
  density?: 'sparse' | 'medium';
  speed?: 'slow' | 'medium';
  variant?: 'hero' | 'footer' | 'empty';
}
```

```typescript
// OrbitCard.tsx
// Tactile card with hover effects

<motion.div className="group">
  <div className="
    glass-card
    rounded-[2rem]
    hover:border-brand-accent/50
    hover:-translate-y-1
    transition-all duration-500
  ">
    {children}
  </div>
</motion.div>
```

```typescript
// Section.tsx
// Standard section wrapper with spacing

<section className="
  py-24 md:py-32 px-6
  bg-brand-bg
">
  <div className="max-w-7xl mx-auto">
    {children}
  </div>
</section>
```

---

### Phase 3: Header/Nav Standard

**File**: `apps/platform/src/components/brand/Navbar.tsx` (NEW)

**Specs**:
```typescript
// Dark glassmorphism nav
className="
  sticky top-0 z-50
  bg-brand-glass-bg backdrop-blur-xl
  border-b border-brand-border
"

// Logo: SchoolgleAnimatedLogo (small size)
<SchoolgleAnimatedLogo size={180} showText={false} />

// Nav items: shadcn/ui NavigationMenu
<NavigationMenu>
  <NavigationMenuItem>
    <Link href="/insights">Insights</Link>
  </NavigationMenuItem>
  {/* ... */}
</NavigationMenu>

// CTA: shadcn/ui Button
<Button variant="default">Early Access</Button>
```

---

### Phase 4: Insights Search Standard

**Requirement**: "Not chat-like"

**Approach**: Editorial filter/search bar

```typescript
// components/brand/InsightFilters.tsx
<div className="
  flex items-center gap-4
  p-2 rounded-2xl
  bg-brand-bg-sec border border-brand-border
">
  {/* Category pills, not chat input */}
  <FilterPill>All</FilterPill>
  <FilterPill>Ofsted</FilterPill>
  <FilterPill>SIAMS</FilterPill>

  {/* Search icon + subtle input */}
  <div className="relative">
    <SearchIcon />
    <input
      type="search"
      placeholder="Filter insights..."
      className="bg-transparent border-none focus:ring-0"
    />
  </div>
</div>
```

---

## 7. Component Portfolio (Existing)

### Brand Identity Components

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Animated Orbit Logo | `SchoolgleAnimatedLogo.tsx` | ✅ Keep | 7 planets, solar system physics, perfect |
| Theme Toggle | `effects/ThemeToggle.tsx` | ✅ Keep | Framer motion icon switch |

### Background Effects

| Component | File | Status | Action Required |
|-----------|------|--------|-----------------|
| Antigravity BG | `effects/AntigravityBackground.tsx` | ⚠️ Replace | Too heavy, replace with OrbitBackground |
| Origami Particles | `OrigamiParticles.tsx` | ⚠️ Evaluate | Keep for specific use cases only |

### Landing Components (Dark Theme - Good)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Hero | `landing/Hero.tsx` | ✅ Keep as template | Carousel, animated logo |
| Module Landing | `landing/ModuleLanding.tsx` | ✅ Keep | Reusable module page template |
| Feature Grid | `landing/FeatureGrid.tsx` | ✅ Keep | Scroll-linked stacking cards |
| Footer | `landing/Footer.tsx` | ✅ Keep | Orbit watermark, dark theme |
| How It Works | `landing/HowItWorks.tsx` | ✅ Refactor | Dark theme version |
| Problem Solution | `landing/ProblemSolution.tsx` | ✅ Refactor | Dark theme version |
| CTA Section | `landing/CTASection.tsx` | ✅ Refactor | Dark theme version |

### Website Components (Light Theme - Replace)

| Component | File | Status | Replacement |
|-----------|------|--------|-------------|
| Navbar | `website/Navbar.tsx` | ❌ Replace | Brand/Navbar (dark glass) |
| Footer | `website/Footer.tsx` | ❌ Replace | Use landing/Footer |
| Hero | `website/Hero.tsx` | ❌ Replace | Use landing/Hero or unified Hero |
| Differentiation | `website/Differentiation.tsx` | ❌ Replace | Dark theme, orbit cards |
| How It Works | `website/HowItWorks.tsx` | ❌ Replace | Scroll-linked narrative |
| Problem Statement | `website/ProblemStatement.tsx` | ❌ Replace | Editorial text treatment |
| Trust Section | `website/TrustSection.tsx` | ❌ Replace | Dark theme version |
| Early Access Form | `website/EarlyAccessForm.tsx` | ⚠️ Refactor | shadcn/ui Form |
| Preview Modules | `website/PreviewModules.tsx` | ⚠️ Refactor | OrbitCard based |
| Insights Section | `website/InsightsSection.tsx` | ⚠️ Refactor | Match insights page aesthetic |
| Testimonials | `website/Testimonials.tsx` | ⚠️ Refactor | Dark theme cards |
| Audience Section | `website/AudienceSection.tsx` | ❌ Delete | Not currently used |
| Blog Section | `website/BlogSection.tsx` | ❌ Delete | Not currently used |
| Core Products | `website/CoreProducts.tsx` | ❌ Delete | Duplicate functionality |
| Improvement Features | `website/ImprovementFeatures.tsx` | ❌ Delete | Duplicate functionality |
| What Schoolgle Does | `website/WhatSchoolgleDoes.tsx` | ❌ Delete | Duplicate functionality |
| Why Schoolgle | `website/WhySchoolgle.tsx` | ❌ Delete | Duplicate functionality |
| Download Section | `website/DownloadSection.tsx` | ❌ Delete | Not currently used |

### Dashboard Components (Out of Scope)

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| Evidence components | `components/evidence/*` | ⚸ Separate | Dashboard UI, different context |

---

## 8. shadcn/ui Installation Plan

**Required Components**:
- Button
- Input
- Form
- Label
- Select
- Dialog
- Sheet (mobile menu)
- Tabs
- Accordion
- NavigationMenu
- DropdownMenu

**Installation Command**:
```bash
npx shadcn@latest init
npx shadcn@latest add button input form label dialog sheet tabs accordion navigation-menu dropdown-menu
```

**Config Location**: `components.json`

---

## 9. File Creation/Modification List

### New Files to Create

```
apps/platform/src/components/
├── brand/
│   ├── OrbitBackground.tsx          # Controlled orbit motif
│   ├── OrbitCard.tsx                # Tactile card component
│   ├── Section.tsx                  # Standard section wrapper
│   ├── MicroLabel.tsx               # Small uppercase labels
│   ├── DisplayHeading.tsx           # Large editorial headings
│   ├── Navbar.tsx                   # Dark glassmorphism nav
│   ├── InsightFilters.tsx           # Search/filter for insights
│   └── index.ts                     # Barrel export
├── ui/                              # shadcn/ui (auto-generated)
│   ├── button.tsx
│   ├── input.tsx
│   ├── form.tsx
│   ├── label.tsx
│   ├── dialog.tsx
│   ├── sheet.tsx
│   ├── tabs.tsx
│   ├── accordion.tsx
│   ├── navigation-menu.tsx
│   ├── dropdown-menu.tsx
│   └── index.ts
└── effects/
    └── OrbitBackground.tsx          # NEW: Controlled orbit dots
```

### Files to Modify

```
# Theme tokens
apps/platform/src/app/globals.css                    # Dark-first default
apps/platform/src/app/globals.css                    # Rename --lp-* to --brand-*

# Root layout
apps/platform/src/app/layout.tsx                     # Remove AntigravityBackground
apps/platform/src/app/layout.tsx                     # Add OrbitBackground to specific pages

# Homepage (critical)
apps/platform/src/app/page.tsx                       # Port to dark theme
apps/platform/src/app/page.tsx                       # Replace website/ components

# Module pages
apps/platform/src/app/hr/page.tsx                    # Already using ModuleLanding ✅
apps/platform/src/app/finance/page.tsx               # Already using ModuleLanding ✅
# ... (other module pages are fine)

# Insights (flagship, minor tweaks)
apps/platform/src/app/insights/page.tsx              # Add OrbitBackground
apps/platform/src/app/insights/page.tsx              # Refine search UI

# Generic feature page
apps/platform/src/app/features/[slug]/page.tsx       # Use OrbitBackground, dark theme
```

### Files to Delete (After Migration)

```
apps/platform/src/components/website/
├── Navbar.tsx                   # Replaced by brand/Navbar
├── Footer.tsx                   # Use landing/Footer
├── Hero.tsx                     # Use landing/Hero or brand/Hero
├── Differentiation.tsx          # Replaced
├── HowItWorks.tsx               # Replaced
├── ProblemStatement.tsx         # Replaced
├── TrustSection.tsx             # Replaced
├── AudienceSection.tsx          # Not used
├── BlogSection.tsx              # Not used
├── CoreProducts.tsx             # Duplicate
├── ImprovementFeatures.tsx      # Duplicate
├── WhatSchoolgleDoes.tsx        # Duplicate
├── WhySchoolgle.tsx             # Duplicate
└── DownloadSection.tsx          # Not used

# Keep temporarily for reference:
apps/platform/src/components/website/
├── EarlyAccessForm.tsx          # Refactor to shadcn/ui
├── PreviewModules.tsx           # Refactor to OrbitCard
├── InsightsSection.tsx          # Refactor
└── Testimonials.tsx             # Refactor
```

### Files to Archive (Not Delete)

```
# Keep for possible dashboard use
apps/platform/src/components/effects/
├── AntigravityBackground.tsx    # Move to effects/legacy/
└── OrigamiParticles.tsx         # Keep for special use cases
```

---

## Summary Statistics

| Category | Count |
|----------|-------|
| New components to create | 8 brand + 10 shadcn/ui = 18 |
| Existing components to keep | 8 (landing/) |
| Existing components to refactor | 5 (website/) |
| Existing components to delete | 10 (website/) |
| CSS files to modify | 1 (globals.css) |
| Layout files to modify | 1 (layout.tsx) |
| Page files to modify | 4 (/, insights, features/[slug], + module redirects) |

---

## Next Steps

See **WEBSITE_UNIFICATION_PLAN.md** for the step-by-step implementation sequence (PR-sized steps).
