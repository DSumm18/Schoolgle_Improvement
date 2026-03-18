# School Website Builder — Style Suite

## Overview

The Schoolgle Website Builder gives every school a stunning, compliant website in under 10 minutes. The secret: **fixed structure, variable visuals, auto-imported content**.

Every school website has the same underlying skeleton (nav, hero, pages, footer). What changes is purely visual — a stack of design layers that combine into a unique look without ever breaking compliance or structure.

---

## The Layer System

School websites are built from 6 visual layers stacked on top of the fixed content structure. Each preset defines all 6 layers. Schools can then override individual settings on top.

```
┌─────────────────────────────────────────┐
│  Layer 6: IMAGERY    (photo treatment)  │
├─────────────────────────────────────────┤
│  Layer 5: MOTION     (animations)       │
├─────────────────────────────────────────┤
│  Layer 4: TYPOGRAPHY (fonts, sizing)    │
├─────────────────────────────────────────┤
│  Layer 3: COLOUR     (palette applied)  │
├─────────────────────────────────────────┤
│  Layer 2: SHAPE      (corners, dividers)│
├─────────────────────────────────────────┤
│  Layer 1: LAYOUT     (nav, hero, grid)  │
├═════════════════════════════════════════┤
│  STRUCTURE (fixed — same for all sites) │
│  Nav → Hero → Quick Links → Content     │
│  → News → Footer                        │
└─────────────────────────────────────────┘
```

### Layer Variables

```typescript
interface WebsiteStylePreset {
  id: string;
  name: string;
  description: string;
  bestFor: string[];        // e.g. ["primary", "village", "church"]
  phase: "primary" | "secondary" | "all-through" | "any";

  // Layer 1: Layout
  layout: {
    navStyle: "top_bar" | "mega_menu" | "hamburger" | "sticky_transparent";
    navPosition: "top" | "left_sidebar";
    heroStyle: "carousel" | "static_image" | "video" | "split" | "collage" | "gradient";
    heroHeight: "full_viewport" | "large" | "medium" | "compact";
    contentWidth: "contained" | "full_bleed" | "mixed";
    gridStyle: "cards" | "list" | "magazine" | "mosaic";
    quickLinksStyle: "tiles" | "icons" | "buttons" | "cards";
    quickLinksCount: 4 | 6 | 8;
    footerStyle: "simple" | "detailed" | "mega_footer";
  };

  // Layer 2: Shape Language
  shape: {
    borderRadius: 0 | 4 | 8 | 12 | 16 | 24 | 9999;  // 9999 = pill
    sectionDivider: "straight" | "wave" | "curve" | "angle" | "organic" | "none";
    cardStyle: "elevated" | "bordered" | "flat" | "outlined" | "glass";
    buttonStyle: "square" | "rounded" | "pill";
    imageShape: "square" | "rounded" | "circle" | "blob";
  };

  // Layer 3: Colour Application
  colour: {
    mode: "bold_headers" | "subtle_tints" | "monochrome" | "colourful_sections" | "dark_accent";
    headerBackground: "solid_brand" | "white" | "transparent" | "gradient";
    heroOverlay: "dark_gradient" | "brand_colour" | "light_gradient" | "none";
    heroOverlayOpacity: number; // 0.0 - 0.7
    sectionAlternation: "white_grey" | "white_brand" | "all_white" | "colour_blocks";
    footerBackground: "dark" | "brand" | "grey" | "white";
    // Actual colours (primary, secondary, accent) are set by the school, not the preset
  };

  // Layer 4: Typography
  typography: {
    headingFont: "geometric_sans" | "humanist_sans" | "serif" | "display" | "rounded_sans" | "slab_serif";
    bodyFont: "clean_sans" | "readable_serif" | "system_default";
    headingWeight: "medium" | "semibold" | "bold" | "extrabold" | "black";
    textScale: "compact" | "standard" | "spacious";
    headingCase: "normal" | "uppercase" | "small_caps";
    lineHeight: "tight" | "normal" | "relaxed";
  };

  // Layer 5: Motion
  motion: {
    level: "none" | "subtle" | "moderate" | "playful";
    scrollEffect: "none" | "fade_up" | "slide_in" | "parallax" | "reveal";
    hoverStyle: "lift" | "glow" | "scale" | "colour_shift" | "underline";
    pageTransition: "none" | "fade" | "slide";
    heroAnimation: "none" | "ken_burns" | "fade_cycle" | "parallax_scroll";
    counterAnimation: boolean;   // animated number counts
  };

  // Layer 6: Imagery
  imagery: {
    photoTreatment: "natural" | "rounded_corners" | "circular_crop" | "masked_blob" | "duotone";
    photoSpacing: "tight" | "standard" | "generous";
    galleryStyle: "grid" | "masonry" | "carousel" | "lightbox";
    iconStyle: "outline" | "filled" | "duotone" | "hand_drawn";
    illustrationStyle: "none" | "geometric" | "organic" | "hand_drawn";
  };
}
```

---

## The 10 Style Presets

### 1. Friendly

> Warm, welcoming, approachable — the go-to for primary schools

| Layer | Setting |
|-------|---------|
| **Layout** | Simple top bar nav, image carousel hero (large), card grid for quick links (6 tiles), contained content |
| **Shape** | Rounded corners (16px), wave section dividers, elevated cards, rounded buttons, rounded images |
| **Colour** | Colourful sections, white header, light gradient hero overlay (0.2), alternating white/brand tint sections |
| **Typography** | Rounded sans heading (e.g. Nunito/Quicksand), clean sans body, bold weight, standard scale |
| **Motion** | Moderate — fade-up on scroll, scale on hover, ken burns hero animation, counter animations on |
| **Imagery** | Rounded corner photos, standard spacing, masonry gallery, filled icons, no illustrations |

**Best for**: Primary schools, infant schools, nurseries, community schools
**Default palette direction**: Warm — soft blues, greens, yellows, purples
**Comparable to**: Greenhouse "Friendly" template, Realsmart primary designs

---

### 2. Classic

> Trusted, established, timeless — heritage without being stuffy

| Layer | Setting |
|-------|---------|
| **Layout** | Clean top bar nav, static hero image (medium), button quick links (4), contained content |
| **Shape** | Slight rounding (4px), straight section dividers, bordered cards, rounded buttons, square images |
| **Colour** | Subtle tints, solid brand header, dark gradient hero overlay (0.4), alternating white/grey sections |
| **Typography** | Serif headings (e.g. Merriweather/Playfair Display), clean sans body, semibold, standard scale |
| **Motion** | Subtle — fade-up only, underline on hover, no hero animation, counters off |
| **Imagery** | Natural photos, standard spacing, grid gallery, outline icons, no illustrations |

**Best for**: Traditional primaries, village schools, established schools with history
**Default palette direction**: Traditional — navy, burgundy, forest green, cream
**Comparable to**: Greenhouse "Simple" template, Cleverbox traditional builds

---

### 3. Nature

> Organic, earthy, calm — for schools connected to their environment

| Layer | Setting |
|-------|---------|
| **Layout** | Top bar nav with organic accent, static hero image (large), icon quick links (6), mixed width content |
| **Shape** | Rounded (12px), organic/curve section dividers, flat cards, rounded buttons, blob-masked images |
| **Colour** | Subtle tints, transparent header, brand colour hero overlay (0.3), alternating white/brand sections |
| **Typography** | Humanist sans headings (e.g. Lato/Source Sans), clean sans body, medium weight, spacious scale |
| **Motion** | Subtle — slow parallax scroll, glow on hover, ken burns hero, counters off |
| **Imagery** | Masked blob photos, generous spacing, masonry gallery, hand-drawn icons, organic illustrations |

**Best for**: Rural schools, forest schools, eco-schools, outdoor learning focused
**Default palette direction**: Earth tones — sage green, warm brown, sky blue, moss
**Comparable to**: Greenhouse "Nature" template

---

### 4. Bold

> Confident, ambitious, modern — for schools making a statement

| Layer | Setting |
|-------|---------|
| **Layout** | Sticky transparent header with mega menu, full-viewport hero (static or video), card quick links (6), full-bleed content |
| **Shape** | Sharp (0px), angle section dividers, flat cards, square buttons, square images |
| **Colour** | Bold headers, transparent header, dark gradient hero overlay (0.5), colour block sections |
| **Typography** | Geometric sans headings (e.g. Montserrat/Poppins), clean sans body, extrabold weight, spacious, uppercase headings |
| **Motion** | Moderate — slide-in on scroll, lift on hover, parallax hero, counter animations on |
| **Imagery** | Natural photos, tight spacing, grid gallery, filled icons, geometric illustrations |

**Best for**: Ambitious academies, secondary schools, schools with strong identity
**Default palette direction**: Strong — deep navy, electric blue, crimson, charcoal
**Comparable to**: e4education bespoke designs, Michaela-style directness

---

### 5. Professional

> Clean, structured, corporate-adjacent — for larger schools and trusts

| Layer | Setting |
|-------|---------|
| **Layout** | Mega menu with audience tabs, video or large static hero, tile quick links (8), contained content |
| **Shape** | Slight rounding (8px), straight section dividers, elevated cards, rounded buttons, rounded images |
| **Colour** | Monochrome, white header, dark gradient hero overlay (0.4), alternating white/grey sections, dark footer |
| **Typography** | Geometric sans headings (e.g. Inter/DM Sans), system default body, semibold, standard scale |
| **Motion** | Subtle — fade-up on scroll, colour shift on hover, fade page transitions, counters on |
| **Imagery** | Natural photos, standard spacing, lightbox gallery, outline icons, no illustrations |

**Best for**: Secondary schools, sixth forms, MATs, multi-site schools
**Default palette direction**: Corporate — navy, slate grey, white, single accent
**Comparable to**: Ark Schools design (Bureau London), Juniper/e4education professional tier

---

### 6. Vibrant

> Energetic, colourful, dynamic — for diverse, creative communities

| Layer | Setting |
|-------|---------|
| **Layout** | Colourful top bar nav, carousel hero (large), card quick links with icons (6), mixed width content |
| **Shape** | Rounded (16px), wave section dividers, elevated cards, pill buttons, rounded images |
| **Colour** | Colourful sections, solid brand header, brand colour hero overlay (0.3), colour block sections |
| **Typography** | Display headings (e.g. Rubik/Outfit), clean sans body, bold, standard scale |
| **Motion** | Playful — slide-in on scroll, scale on hover, fade-cycle hero, counter animations on |
| **Imagery** | Rounded corner photos, standard spacing, masonry gallery, duotone icons, geometric illustrations |

**Best for**: Creative schools, arts-focused, diverse communities, primary schools wanting energy
**Default palette direction**: Multi-colour — uses brand primary but adds complementary pops
**Comparable to**: School 21 brand energy, Schoolzine colourful templates

---

### 7. Minimal

> Spacious, typographic, refined — letting content breathe

| Layer | Setting |
|-------|---------|
| **Layout** | Thin top bar / hamburger nav, static hero (medium), button quick links (4), contained content |
| **Shape** | None (0px), no section dividers, flat cards, square buttons, square images |
| **Colour** | Monochrome, white header, light gradient hero overlay (0.1), all white sections |
| **Typography** | Humanist sans headings (e.g. Raleway/Jost), readable serif body, medium weight, spacious scale, normal case |
| **Motion** | None — fade only on page transition, underline hover, no hero animation, counters off |
| **Imagery** | Natural photos, generous spacing, grid gallery, outline icons, no illustrations |

**Best for**: Design-conscious heads, modern primaries, schools that want photography to do the talking
**Default palette direction**: Minimal — near-black, white, single accent colour
**Comparable to**: Cheam School aesthetic ("lovely typefaces and white space")

---

### 8. Heritage

> Prestigious, elegant, authoritative — tradition meets quality

| Layer | Setting |
|-------|---------|
| **Layout** | Slim nav with crest placement, full-viewport static hero, tile quick links (4), contained content |
| **Shape** | Minimal (4px), straight section dividers, bordered cards, rounded buttons, square images |
| **Colour** | Dark accent mode, solid brand header (dark), dark gradient hero overlay (0.5), white/grey alternation, dark footer |
| **Typography** | Serif headings (e.g. EB Garamond/Cormorant Garant), readable serif body, semibold, spacious, small caps headings |
| **Motion** | Subtle — fade-up only, colour shift hover, fade page transition, no hero animation, counters off |
| **Imagery** | Natural photos, generous spacing, lightbox gallery, outline icons, no illustrations |

**Best for**: Independent schools, grammar schools, historic schools, schools with heritage
**Default palette direction**: Prestigious — navy, burgundy, gold/cream, deep green
**Comparable to**: Fettes College, Felsted, Canford, Royal Hospital School designs

---

### 9. Community

> Inclusive, welcoming, local — the heart of the neighbourhood

| Layer | Setting |
|-------|---------|
| **Layout** | Simple top bar nav, collage hero (medium), icon quick links (6), contained content |
| **Shape** | Rounded (12px), curve section dividers, elevated cards, rounded buttons, circle-cropped images |
| **Colour** | Subtle tints, solid brand header, light gradient hero overlay (0.2), alternating white/brand tint sections |
| **Typography** | Humanist sans headings (e.g. Open Sans/Cabin), clean sans body, bold weight, standard scale |
| **Motion** | Moderate — fade-up on scroll, scale on hover, fade-cycle hero, counters on |
| **Imagery** | Circular crop photos (people), rounded corners (places), standard spacing, carousel gallery, filled icons, no illustrations |

**Best for**: Faith schools, community schools, village schools, church schools, schools with SIAMS
**Default palette direction**: Warm community — deep blue, warm red, soft gold, cream
**Comparable to**: Greenhouse "Village" template, faith school designs

---

### 10. Future

> Cutting-edge, tech-forward, innovative — for schools pushing boundaries

| Layer | Setting |
|-------|---------|
| **Layout** | Sticky transparent header, video or gradient hero (full viewport), card quick links (6), full-bleed content |
| **Shape** | Sharp (0px), angle section dividers, glass cards, pill buttons, square images |
| **Colour** | Dark accent mode, transparent header, brand colour hero overlay (0.4), colour block sections, dark footer |
| **Typography** | Geometric sans headings (e.g. Space Grotesk/Syne), clean sans body, black weight, spacious, uppercase headings |
| **Motion** | Playful — reveal on scroll, lift on hover, parallax hero, slide page transitions, counter animations on |
| **Imagery** | Duotone photos, tight spacing, masonry gallery, duotone icons, geometric illustrations |

**Best for**: STEM academies, UTCs, innovative/progressive schools, technology colleges
**Default palette direction**: Tech — deep purple, electric blue, neon accent, dark backgrounds
**Comparable to**: Kent College AI-forward design, modern academy branding

---

## The Setup Flow: Logo → Everything

The entire visual identity derives from one input: **the school logo**.

```
Step 1: Upload Logo
         │
Step 2: Auto-Extract Colours (k-means clustering on canvas)
         │  "We found Navy Blue (42%), Gold (28%), White (30%)"
         │
Step 3: Present 3-4 Palette Options
         │  "Brand Faithful" — navy primary, gold secondary
         │  "Bold & Vibrant" — gold primary, navy secondary
         │  "Deep & Professional" — dark navy, light gold accent
         │  "Fresh Take" — shifted hue for modern twist
         │
Step 4: Pick a Preset (cards with live preview)
         │  Each card shows the school's chosen palette applied
         │
Step 5: Choose Font Pairing (live swap on preview)
         │  Click through 10 pairings, see text change in real-time
         │
Step 6: Choose Hero Mask (20 shapes, live on preview)
         │  The shape of the hero image — biggest visual differentiator
         │
Step 7: Done. Publish.
```

Schools configure **nothing manually** — no hex codes, no colour pickers, no font names. Upload logo, make 4 visual choices (palette, preset, font, mask), done.

### Hero Mask System (Why No Two Sites Look Alike)

The hero mask is the single biggest visual differentiator. It clips the hero image into a distinctive shape using CSS `clip-path`. 20 mask options:

| Category | Masks | Effect |
|----------|-------|--------|
| **Full** | Full Width | Classic banner |
| **Diagonal** | Diagonal Right, Diagonal Left | Angled bottom edge |
| **Slant** | Slant Right, Slant Left | Image fills one side, text fills the other |
| **Wave** | Wave Bottom | Organic flowing edge |
| **Arch** | Arch, Scoop | Rounded/concave bottom |
| **Corner** | Corner Reveal BR, Corner Reveal BL | Triangle cut from corner |
| **Stepped** | Stepped Right, Stepped Left | Staircase edge |
| **Shape** | Circle, Rounded Rectangle, Organic Blob | Image contained in shape |
| **Split** | Split Left, Split Right | Half-and-half with text |
| **Point** | Pointed, Peak | V-shape or mountain |
| **Texture** | Torn Paper | Rough organic edge |

Same photo + different mask = completely different website. Two schools on the same preset with different masks and colours won't look alike.

### For Schools Without Photos

| Tier | Source | What It Does |
|------|--------|-------------|
| **Auto-import** | Crawler pulls images from existing website | Free, authentic, already theirs |
| **Curated stock** | Pre-tagged school photo library (classroom, playground, sports) | Free, professional but generic |
| **AI backgrounds** | Abstract patterns/textures in school brand colours | ~£0.01/image, unique per school |
| **AI illustrations** | Watercolour/line-art school scenes (not photorealistic children) | ~£0.02/image, distinctive |

We **never** generate AI photos of children — safeguarding optics. AI generates abstract backgrounds and illustrated scenes only.

---

## Colour Palette Generation

From a single primary colour, the system auto-generates a full palette:

```
Primary Colour (school picks)
    │
    ├── Primary 50-950 (Tailwind-style shade scale)
    ├── Secondary (complementary, auto-suggested)
    │   └── Secondary 50-950
    ├── Accent (triadic or split-complementary)
    ├── Neutral (desaturated primary for greys)
    │   └── Neutral 50-950
    ├── Success (green)
    ├── Warning (amber)
    ├── Error (red)
    └── Background shades (white, off-white, light tint of primary)
```

### Preset Colour Modes Explained

| Mode | How Colour Is Applied |
|------|----------------------|
| **bold_headers** | Strong brand colour on header/nav and hero. Rest is neutral with colour accents on buttons/links |
| **subtle_tints** | Mostly white/grey with very light tints of brand colour on alternating sections. Colour on buttons/links only |
| **monochrome** | Single colour + neutrals. Very restrained. Photography provides the colour |
| **colourful_sections** | Different brand shades on different page sections. More visual variety. Works well with warm/bright palettes |
| **dark_accent** | Dark header and footer sandwich light content. Creates a premium, weighty feel |

---

## Font Pairings Per Preset

| Preset | Heading Font | Body Font | Fallback |
|--------|-------------|-----------|----------|
| Friendly | Nunito / Quicksand | Nunito Sans | system-ui |
| Classic | Playfair Display / Merriweather | Source Sans 3 | Georgia, serif |
| Nature | Lato / Source Sans 3 | Source Sans 3 | system-ui |
| Bold | Montserrat / Poppins | Inter | system-ui |
| Professional | Inter / DM Sans | system-ui | -apple-system |
| Vibrant | Rubik / Outfit | Rubik | system-ui |
| Minimal | Raleway / Jost | Libre Baskerville | Georgia, serif |
| Heritage | EB Garamond / Cormorant Garamond | Crimson Text | Georgia, serif |
| Community | Open Sans / Cabin | Open Sans | system-ui |
| Future | Space Grotesk / Syne | Inter | system-ui |

All fonts are Google Fonts (free, no licensing issues, fast CDN delivery).

---

## Fixed Structure (Never Changes)

Every school website, regardless of preset, has this structure:

### Navigation (always present, style varies)

```
├── Home
├── About Us
│   ├── Welcome / Vision & Values
│   ├── Headteacher's Welcome
│   ├── Staff Directory
│   ├── Governors / Trustees
│   └── School History (optional)
├── Admissions
│   ├── How to Apply
│   ├── Open Days
│   └── In-Year Admissions
├── Curriculum
│   ├── Overview
│   ├── EYFS (if primary)
│   ├── Key Stage 1 / 2 / 3 / 4 / 5
│   └── Subject Pages (optional)
├── Parents & Carers
│   ├── Letters Home
│   ├── Term Dates & Calendar
│   ├── Uniform
│   ├── School Meals
│   ├── Before & After School
│   └── Parent Pay / Gateway
├── SEND
│   ├── SEND Information Report
│   ├── SENCO Details
│   └── Local Offer Link
├── Pupil Premium
│   ├── Strategy Statement
│   └── Impact Report
├── PE & Sport Premium (primary)
├── Policies
│   ├── Statutory Policies (auto-listed)
│   └── Other Policies
├── Governance
│   ├── Board / Governors
│   ├── Meeting Minutes
│   └── Financial Information
├── Ofsted
│   ├── Latest Report
│   └── Performance Data Link
├── News & Events
├── Gallery
├── Vacancies (optional)
└── Contact Us
    ├── Address & Map
    ├── Phone & Email
    └── Contact Form
```

### Statutory Pages (auto-created, compliance-checked)

The 35+ statutory requirements from `website-compliance/requirements.ts` map directly to this nav structure. Pages are pre-created. Compliance is checked continuously. Missing content is flagged.

### Homepage Sections (order fixed, visibility toggleable)

```
1. Hero Banner          — Always visible
2. Welcome Message      — Headteacher photo + text (auto-imported)
3. Quick Links          — 4-6 tiles to key areas
4. Latest News          — 3-4 most recent posts
5. Key Information      — Term dates, calendar, upcoming events
6. School Values        — Vision/values display (auto-imported)
7. Gallery Highlight    — Photo grid or carousel
8. Statistics           — Ofsted rating, pupil count, etc. (auto from DfE)
9. Testimonials         — Optional quotes
10. Social Feed         — Twitter/X embed (optional)
11. Footer              — Contact, address, Ofsted badge, quick links, policies
```

Schools toggle sections on/off but cannot reorder or restructure.

---

## Content Auto-Import Pipeline

```
Step 1: School enters current website URL
            │
Step 2: Crawler extracts all pages, PDFs, images
            │  (website-crawler.ts — already built)
            │
Step 3: AI classifies each page against nav structure
            │  "This page = Admissions"
            │  "This PDF = Behaviour Policy"
            │  "This image = School Logo"
            │
Step 4: Content mapped to content slots
            │  admissions_text → Admissions page
            │  behaviour_policy.pdf → Policies page
            │  headteacher_photo.jpg → Welcome section
            │
Step 5: Compliance gap report generated
            │  (website-compliance/assessor.ts — already built)
            │  "28/35 statutory items found"
            │  "Missing: Pupil Premium statement, PE Sport report"
            │
Step 6: School reviews pre-filled website
            │  Everything already in place
            │  Gaps highlighted for action
            │
Step 7: Choose preset → customise colours → publish
```

---

## Comparison to Competitors

| Feature | Greenhouse (£900-4500) | Juniper (£499-3000) | Cleverbox (£2000+) | **Schoolgle (included)** |
|---------|----------------------|--------------------|--------------------|------------------------|
| Setup time | 1-12 weeks | 2-10 weeks | 6-12 weeks | **10 minutes** |
| Content migration | Manual (school does it) | Manual | Manual | **Auto-imported** |
| Templates | 8 themes | Essential + bespoke | Bespoke only | **10 presets + deep theming** |
| Compliance checking | Manual checklist | Basic | Manual | **Continuous AI scanning** |
| Video hero | Premium only (£3500+) | Premium only | Bespoke | **All presets** |
| Animated stats | Premium only | No | Bespoke | **All presets** |
| Content editing | CMS | CMS | ReactCMS | **Simple slot editor** |
| Annual cost | £295-500 | £295-395 | £395+ | **Included in platform** |
| Staff auto-sync | No | No | No | **From HR module** |
| Policy auto-sync | No | No | No | **From Drive/compliance** |
| Governor auto-sync | No | No | No | **From governance module** |

### Key Differentiators

1. **Auto-import** — No manual content migration. Ever.
2. **Continuous compliance** — Not a one-off checklist. AI scans constantly.
3. **Module integration** — Staff, governors, policies sync automatically from Schoolgle modules
4. **10-minute setup** — Not 10 weeks. 10 minutes.
5. **Included in platform** — Not a £900+ add-on. Part of the subscription.
6. **Premium features for all** — Video, animations, counters available in every preset

---

## Research Sources

### UK School Website Providers Analysed
- Greenhouse School Websites (3,500+ schools, 300+ MATs)
- School Jotter (3,000+ schools)
- Juniper / Primarysite / e4education (7,500+ schools)
- Cleverbox (1,000+ schools)
- Finalsite (450+ independent schools)
- Schudio, FSE Design, Concept4, Realsmart, Fat Cow Media

### Real School Websites Studied
- Ark Schools (arkschools.org) — Bureau London agency design, MAT
- Thomas Tallis School — Secondary, open-source ethos
- King Solomon Academy — Ark academy, all-through
- School 21 — Innovative, green/yellow brand
- Michaela Community School — Results-focused, direct
- Felsted School — Heritage + modernity, vine animations
- Fettes College — Purple, horizontal scrolling, premium
- Canford School — Dynamic dropdowns, video-forward
- Royal Hospital School — Nautical theme, blue palette
- Cheam School — Typography + white space excellence
- Kent College — AI chatbot, parallax, bold graphics
- St Joseph's Greenwich — Greenhouse template, primary

### Key Statistics
- 67% of parents browse school websites on mobile
- Parents form first impressions in 0.05 seconds
- Only 36% of parents find their school website easy to use
- Video increases time on site by 88%
- 14 mandatory Ofsted publication areas checked before site visit
- 90% of schools choose bespoke over template (at Greenhouse pricing)
- Website is "often the first and longest inspection task" for Ofsted
