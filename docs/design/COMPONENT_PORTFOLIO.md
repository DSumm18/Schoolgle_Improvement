# Schoolgle Component Portfolio & Design Rules

## Brand Anchors (Non-Negotiable)

- The **orbit/planets logo** and orbit colour theme is the brand anchor. Do not change it.
- Primary website theme is **DARK** (premium, editorial, distinctive).
- A LIGHT theme may exist as an optional toggle and for the app/dashboard later, but the website brand is dark-first.

---

## 1. Design Tokens (Dark-First)

### CSS Variable Naming Convention

All brand tokens use `--brand-*` prefix for clarity.

### Dark Theme (Default - Customer-Facing Website)

```css
:root {
  /* Backgrounds */
  --brand-bg: #050510;              /* Deep dark primary background */
  --brand-bg-sec: #0A0A18;          /* Secondary background (cards, sections) */
  --brand-bg-tert: #0f0f25;         /* Tertiary background (nested elements) */

  /* Text */
  --brand-text: #F4F6F8;            /* Primary text (headings, body) */
  --brand-text-sec: #94a3b8;        /* Secondary text (descriptions, muted) */
  --brand-text-muted: #64748b;      /* Muted text (captions, hints) */

  /* Borders */
  --brand-border: rgba(255, 255, 255, 0.08);           /* Subtle borders */
  --brand-border-hover: rgba(255, 255, 255, 0.15);     /* Hover state borders */

  /* Accents */
  --brand-accent: #3b82f6;          /* Primary accent (blue) */
  --brand-accent-hover: #2563eb;    /* Accent hover state */
  --brand-amber: #f59e0b;           /* Secondary accent (warm) */

  /* Glassmorphism */
  --brand-glass-bg: rgba(10, 10, 30, 0.6);
  --brand-glass-border: rgba(255, 255, 255, 0.1);
  --brand-glass-blur: 12px;

  /* Spacing */
  --brand-section-padding: 6rem;    /* py-24 */
  --brand-section-padding-lg: 8rem; /* py-32 */

  /* Border Radius */
  --brand-radius-lg: 1rem;          /* rounded-2xl */
  --brand-radius-xl: 1.5rem;        /* rounded-[2rem] */
  --brand-radius-2xl: 2rem;         /* rounded-[2.5rem] */
}
```

### Light Theme (Optional - Dashboard/Forms)

```css
.theme-light {
  /* Backgrounds */
  --brand-bg: #ffffff;
  --brand-bg-sec: #f8fafc;
  --brand-bg-tert: #f1f5f9;

  /* Text */
  --brand-text: #0f172a;
  --brand-text-sec: #475569;
  --brand-text-muted: #64748b;

  /* Borders */
  --brand-border: rgba(0, 0, 0, 0.08);
  --brand-border-hover: rgba(0, 0, 0, 0.12);

  /* Accents */
  --brand-accent: #2563eb;
  --brand-accent-hover: #1d4ed8;
  --brand-amber: #d97706;

  /* Glassmorphism */
  --brand-glass-bg: rgba(255, 255, 255, 0.7);
  --brand-glass-border: rgba(0, 0, 0, 0.05);
}
```

### Module Color Palette

For module-specific theming (used sparingly):

```css
--module-hr: #ADD8E6;        /* HR - Light Blue */
--module-finance: #FFAA4C;   /* Finance - Orange */
--module-estates: #00D4D4;   /* Estates - Cyan */
--module-compliance: #E6C3FF; /* Compliance - Purple */
--module-teaching: #FFB6C1;  /* Teaching - Pink */
--module-send: #98FF98;      /* SEND - Green */
--module-governance: #FFD700; /* Governance - Gold */
```

---

## 2. Magic UI Usage Policy

### Allowed Magic UI Patterns

| Pattern | Usage | Notes |
|---------|-------|-------|
| **Subtle card hover** | All interactive cards | `hover:-translate-y-1`, border brightening |
| **Gentle fade/blur reveal** | Section transitions | Consistent 500ms+ timing, ease-out |
| **Orbit motif backgrounds** | Hero, Footer, Empty states | Controlled, sparse, slow (see below) |

### Prohibited Magic UI Patterns

| Pattern | Reason |
|---------|--------|
| **Particles/confetti as default** | Competes with orbit brand, "tech demo" feel |
| **Parallax scrolling** | Distracting, performance-heavy |
| **Heavy glow effects** | Overpowers content, reads "generative AI" |
| **Complex 3D scenes** | Not aligned with editorial aesthetic |
| **Shape morphing animations** | Too complex, not subtle |

### Motion Timing Standards

```css
/* Standard transitions */
transition: all 500ms cubic-bezier(0.16, 1, 0.3, 1);  /* Premium feel */
transition: opacity 300ms ease-out;                   /* Fades */
transition: transform 500ms cubic-bezier(0.16, 1, 0.3, 1); /* Hover lifts */
```

---

## 3. Orbit Motif Usage Rules

### OrbitBackground Component

**Purpose**: Controlled, subtle orbit dots that support (not compete with) the brand.

**Allowed Usage**:
- Hero sections (medium density, positioned behind content)
- Footer (sparse density, corner accent)
- Empty states (sparse, centered)

**Prohibited Usage**:
- As global background on every page
- In dashboard/app contexts
- Overpowering content or text

### OrbitBackground API

```tsx
interface OrbitBackgroundProps {
  density?: 'sparse' | 'medium';       // sparse: 20-30 dots, medium: 40-50 dots
  speed?: 'slow' | 'medium';           // slow: 60s orbit, medium: 30s orbit
  variant?: 'hero' | 'footer' | 'empty';  // Positioning presets
  className?: string;
}
```

### Usage Examples

```tsx
{/* Hero - Medium density, positioned */}
<OrbitBackground variant="hero" density="medium" speed="slow" />

{/* Footer - Sparse, bottom corner */}
<OrbitBackground variant="footer" density="sparse" speed="slow" />

{/* Empty state - Sparse, centered */}
<OrbitBackground variant="empty" density="sparse" speed="slow" />
```

### Implementation Notes

- **Technology**: Canvas or SVG (lighter than Three.js)
- **Dot count**: 20-50 max (NOT 4000+)
- **Animation**: Slow, gentle orbits (30-60s period)
- **Interaction**: Subtle parallax on mouse move only
- **Color**: `--brand-accent` with low opacity (0.3-0.5)

---

## 4. Component Specifications

### Navbar (`brand/Navbar`)

**Purpose**: Unified navigation for all customer-facing pages.

**Spec**:
```tsx
interface NavbarProps {
  variant?: 'transparent' | 'glass';  // Default: glass
}
```

**Styling**:
```css
/* Container */
.sticky.top-0.z-50
.bg-brand-glass-bg.backdrop-blur-xl
.border-b.border-brand-border
.h-20

/* Logo */
<SchoolgleAnimatedLogo size={180} showText={false} />

/* Nav items (desktop) */
<NavigationMenu className="hidden md:flex">
  <NavigationMenuItem>
    <Link href="/insights">Insights</Link>
  </NavigationMenuItem>
  <NavigationMenuItem>
    <Link href="/toolbox">Toolbox</Link>
  </NavigationMenuItem>
</NavigationMenu>

/* CTA */
<Button variant="default" asChild>
  <Link href="#early-access">Early Access</Link>
</Button>

/* Mobile menu */
<Sheet>
  {/* Mobile nav items */}
</Sheet>
```

**Responsive**:
- Desktop: Full nav with links
- Tablet: Reduced links
- Mobile: Hamburger menu with Sheet

---

### OrbitCard (`brand/OrbitCard`)

**Purpose**: Standard tactile card component with hover effects.

**Spec**:
```tsx
interface OrbitCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;    // Default: true
  variant?: 'glass' | 'solid';
}
```

**Styling**:
```css
/* Base */
.glass-card
.rounded-[2rem]
.p-8

/* Hover (when interactive) */
.hover:border-brand-accent/50
.hover:-translate-y-1
.transition-all.duration-500

/* Inner glow */
.group-hover:shadow-[0_0_30px_var(--brand-accent)]/10
```

**Usage**:
```tsx
<OrbitCard interactive>
  <h3>Card Title</h3>
  <p>Card content...</p>
</OrbitCard>
```

---

### Button (`ui/Button` - shadcn/ui)

**Purpose**: Standard interactive button.

**Variants**:
- `default`: Primary action, filled with `--brand-accent`
- `outline`: Secondary action, outlined with `--brand-border`
- `ghost`: Tertiary action, transparent with hover

**Spec**:
```tsx
interface ButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  asChild?: boolean;  // For composing with Link
}
```

**Usage**:
```tsx
<Button variant="default" asChild>
  <Link href="/signup">Get Started</Link>
</Button>
```

---

### Section (`brand/Section`)

**Purpose**: Standard section wrapper with consistent spacing.

**Spec**:
```tsx
interface SectionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'tight' | 'full';
  container?: boolean;  // Default: true (adds max-w-7xl)
}
```

**Styling**:
```css
/* Default variant */
.py-32.px-6.bg-brand-bg.max-w-7xl.mx-auto

/* Tight variant */
.py-24.px-6.bg-brand-bg.max-w-7xl.mx-auto

/* Full variant */
.py-32.px-6.bg-brand-bg.w-full
```

---

### MicroLabel (`brand/MicroLabel`)

**Purpose**: Small uppercase labels for badges, tags, status indicators.

**Spec**:
```tsx
interface MicroLabelProps {
  children: React.ReactNode;
  color?: 'accent' | 'amber' | 'muted';
  size?: 'xs' | 'sm';
}
```

**Styling**:
```css
/* Base */
.text-[10px].font-black.uppercase.tracking-[0.2em]

/* Colors */
.text-brand-accent     /* accent */
.text-brand-amber      /* amber */
.text-brand-text-muted /* muted */
```

**Usage**:
```tsx
<MicroLabel color="accent">New Feature</MicroLabel>
<MicroLabel color="amber">Coming Soon</MicroLabel>
```

---

### DisplayHeading (`brand/DisplayHeading`)

**Purpose**: Large editorial headings for hero sections and major titles.

**Spec**:
```tsx
interface DisplayHeadingProps {
  children: React.ReactNode;
  size?: 'h1' | 'h2' | 'h3';
  accent?: boolean;  // Apply accent color and italic
}
```

**Styling**:
```css
/* Base */
.font-black.outfit.uppercase.tracking-tighter

/* Sizes */
--h1: text-6xl.md:text-[110px].lg:text-[130px]
--h2: text-4xl.md:text-6xl
--h3: text-2xl.md:text-4xl

/* Accent variant */
.text-brand-accent.italic
```

**Usage**:
```tsx
<DisplayHeading size="h1">
  Inspection<br />
  <DisplayHeading accent>Ready.</DisplayHeading>
</DisplayHeading>
```

---

## 5. Typography System

### Font Families

```css
--font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
--font-display: var(--font-outfit), var(--font-inter), ui-sans-serif, system-ui, sans-serif;
```

### Type Scale

| Element | Size | Weight | Font | Usage |
|---------|------|--------|------|-------|
| H1 (Hero) | 130px max | Black | Outfit | Main page titles |
| H2 (Section) | 64px | Black | Outfit | Section titles |
| H3 (Card) | 32px | Black | Outfit | Card titles |
| Body Large | 20px | Medium | Inter | Lead text |
| Body | 16px | Regular | Inter | Paragraphs |
| Small | 14px | Medium | Inter | Secondary text |
| Micro | 10px | Black | Inter | Labels, tags |

### Tracking

- Headings: `tracking-tighter` for large, `tracking-widest` for micro labels
- Body: `tracking-normal`

---

## 6. Color Usage Guidelines

### When to Use Module Colors

Module colors should be used **sparingly** for:

1. **Module landing pages**: Hero accent, CTA buttons
2. **Feature highlights**: Icon backgrounds, subtle accents
3. **Status indicators**: Module-specific badges

### When to Use Brand Accent

Use `--brand-accent` (blue) for:

1. **Primary CTAs**: Main action buttons
2. **Interactive elements**: Links, focus states
3. **Accents**: Subtle highlights, borders on hover
4. **Icons**: When module-specific color isn't relevant

### Text Color Hierarchy

```
Primary:   --brand-text      #F4F6F8  (headings, body)
Secondary: --brand-text-sec  #94a3b8  (descriptions)
Muted:     --brand-text-muted #64748b  (captions, hints)
```

---

## 7. Responsive Breakpoints

```css
/* Tailwind defaults */
sm: 640px   /* Small tablets, large phones */
md: 768px   /* Tablets */
lg: 1024px  /* Small laptops, tablets landscape */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large desktops */
```

### Mobile-First Approach

All components should be designed mobile-first, with `md:` and `lg:` breakpoints for larger screens.

---

## 8. Animation Standards

### Scroll-Linked Animations

Use Framer Motion for scroll-linked effects:

```tsx
const { scrollYProgress } = useScroll({
  target: ref,
  offset: ["start end", "end start"]
});

const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
const opacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
```

### Hover Animations

```tsx
<motion.div
  whileHover={{ y: -4 }}
  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
>
```

### Reveal on Scroll

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
```

---

## 9. Accessibility Standards

### Focus States

```css
*:focus-visible {
  outline: 2px solid var(--brand-accent);
  outline-offset: 2px;
}
```

### ARIA Labels

All interactive elements must have appropriate labels:
- Buttons: Clear text or `aria-label`
- Links: Descriptive destination
- Icons: `aria-label` or `aria-hidden` if decorative

### Color Contrast

All text must meet WCAG AA contrast ratios:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Interactive elements: 3:1 minimum

---

## 10. Component Library Structure

```
apps/platform/src/components/
├── brand/              # Shared brand components (this doc)
│   ├── OrbitBackground.tsx
│   ├── OrbitCard.tsx
│   ├── Section.tsx
│   ├── MicroLabel.tsx
│   ├── DisplayHeading.tsx
│   ├── Navbar.tsx
│   └── index.ts
├── ui/                 # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── form.tsx
│   ├── label.tsx
│   ├── dialog.tsx
│   ├── sheet.tsx
│   ├── navigation-menu.tsx
│   └── index.ts
├── effects/            # Visual effects
│   ├── OrbitBackground.tsx
│   └── legacy/         # Archived effects
│       └── AntigravityBackground.tsx
├── landing/            # Legacy dark components (reference)
└── website/            # Legacy light components (to be removed)
```

---

## 11. Copy Voice Guidelines

### UK English

All copy must use UK English spelling and terminology:
- "colour" not "color"
- "centre" not "center"
- "organisation" not "organization"
- "recognise" not "recognize"

### Tone

- **Calm**: No hype, no urgency
- **Direct**: Say what you mean, avoid fluff
- **Lightly witty**: Occasional dry humour when appropriate
- **No "AI buzzword soup"**: Avoid overusing AI, ML, LLM, etc.

### Example Do's and Don'ts

| Don't | Do |
|-------|-----|
| "Revolutionary AI-powered platform that leverages cutting-edge LLMs" | "Scan your documents and map evidence automatically" |
| "Unlock unprecedented insights with our proprietary neural networks" | "See what's missing before inspection arrives" |
| "Experience the future of education technology" | "Always be ready for inspection" |

---

## 12. Usage Checklist

Before using any component, verify:

- [ ] Am I using the correct CSS variables (`--brand-*`)?
- [ ] Is the dark theme the default for this customer-facing page?
- [ ] Am I using `OrbitBackground` only in allowed contexts?
- [ ] Are my animations subtle (no particles, no parallax)?
- [ ] Is my copy in UK English with the correct tone?
- [ ] Are my interactive elements using shadcn/ui components?
- [ ] Does this component meet accessibility standards?

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-13 | Initial Component Portfolio with dark-first tokens |
