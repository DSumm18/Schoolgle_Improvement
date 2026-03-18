// ============================================================
// Static HTML/CSS Generator
// ============================================================
// Converts a SchoolWebsite config + pages + posts into a
// self-contained static site. Each page becomes a standalone
// HTML file with inlined CSS. No JavaScript required for the
// published site (except optional analytics + contact form).
// ============================================================

import type { StylePreset, GeneratedPalette, FontPairing, HeroMask } from "./types";
import type {
  SchoolWebsite,
  WebsitePage,
  WebsitePost,
  NavigationItem,
  ContentBlock,
  HeroBlock,
  TextBlock,
  HeadingBlock,
  ImageBlock,
  GalleryBlock,
  CardGridBlock,
  QuickLinksBlock,
  ContactFormBlock,
  AccordionBlock,
  StatisticsBlock,
  TestimonialsBlock,
  CtaBannerBlock,
  DividerBlock,
  SpacerBlock,
  StaffListBlock,
  GovernorListBlock,
  NewsFeedBlock,
  PolicyListBlock,
  DocumentListBlock,
  ValuesGridBlock,
  MapBlock,
  VideoBlock,
  HtmlBlock,
  TwoColumnBlock,
  ThreeColumnBlock,
  TabsBlock,
} from "./content-types";
import { getPreset, PRESETS } from "./presets";
import { getFontPairing, getGoogleFontsUrl, getFontCssVariables } from "./font-pairings";
import { paletteToCssVariables } from "./palette-generator";
import { HERO_MASKS } from "./hero-masks";

// ------------------------------------------------------------
// Public API
// ------------------------------------------------------------

export interface StaticSiteOutput {
  /** Map of path → HTML string: { "/": "<html>...", "/about": "<html>..." } */
  pages: Record<string, string>;
  /** Global CSS for the entire site */
  css: string;
  /** Snapshot hash for cache-busting */
  hash: string;
  /** Total size in bytes */
  totalSize: number;
  /** Page count */
  pageCount: number;
}

export interface GeneratorInput {
  website: SchoolWebsite;
  pages: WebsitePage[];
  posts: WebsitePost[];
  navigation: NavigationItem[];
}

/**
 * Generate a complete static site from the website config.
 */
export function generateStaticSite(input: GeneratorInput): StaticSiteOutput {
  const { website, pages, posts, navigation } = input;

  const preset = getPreset(website.presetId) || PRESETS.friendly;
  const fontPairing = getFontPairing(website.fontPairingId);
  const palette = website.palette as unknown as GeneratedPalette;
  const heroMask = HERO_MASKS[website.heroMaskId as keyof typeof HERO_MASKS];

  // Resolve layers (preset + overrides)
  const resolvedPreset = resolvePreset(preset, website);

  // Generate CSS
  const css = generateCss(resolvedPreset, palette, fontPairing, heroMask);

  // Build navigation HTML
  const mainNav = navigation.filter((n) => n.menuLocation === "main");
  const footerNav = navigation.filter((n) => n.menuLocation === "footer");

  // Generate each page
  const outputPages: Record<string, string> = {};
  let totalSize = 0;

  for (const page of pages.filter((p) => p.status === "published")) {
    const path = page.slug === "/" ? "/" : `/${page.slug}`;
    const html = generatePageHtml({
      page,
      website,
      preset: resolvedPreset,
      palette,
      fontPairing,
      heroMask,
      mainNav,
      footerNav,
      posts,
      allPages: pages,
      css,
    });
    outputPages[path] = html;
    totalSize += new TextEncoder().encode(html).length;
  }

  // Generate news article pages
  for (const post of posts.filter((p) => p.status === "published")) {
    const path = `/news/${post.slug}`;
    const html = generatePostHtml({
      post,
      website,
      preset: resolvedPreset,
      palette,
      fontPairing,
      heroMask,
      mainNav,
      footerNav,
      css,
    });
    outputPages[path] = html;
    totalSize += new TextEncoder().encode(html).length;
  }

  totalSize += new TextEncoder().encode(css).length;

  const hash = simpleHash(JSON.stringify(outputPages) + css);

  return {
    pages: outputPages,
    css,
    hash,
    totalSize,
    pageCount: Object.keys(outputPages).length,
  };
}

// ------------------------------------------------------------
// CSS Generation
// ------------------------------------------------------------

function generateCss(
  preset: StylePreset,
  palette: GeneratedPalette | null,
  fontPairing: FontPairing | undefined,
  heroMask: HeroMask | undefined
): string {
  const cssVars: string[] = [];

  // Palette variables
  if (palette) {
    const paletteVars = paletteToCssVariables(palette);
    for (const [key, value] of Object.entries(paletteVars)) {
      cssVars.push(`  ${key}: ${value};`);
    }
  }

  // Font variables
  if (fontPairing) {
    const fontVars = getFontCssVariables(fontPairing);
    for (const [key, value] of Object.entries(fontVars)) {
      cssVars.push(`  ${key}: ${value};`);
    }
  }

  // Shape variables
  cssVars.push(`  --radius: ${preset.shape.borderRadius}px;`);
  cssVars.push(`  --btn-radius: ${getBtnRadius(preset.shape.buttonStyle)};`);

  // Motion variables
  cssVars.push(`  --transition-speed: ${getTransitionSpeed(preset.motion.level)};`);

  // Typography scale
  const scale = getTextScale(preset.typography.textScale);
  cssVars.push(`  --text-base: ${scale.base};`);
  cssVars.push(`  --text-lg: ${scale.lg};`);
  cssVars.push(`  --text-xl: ${scale.xl};`);
  cssVars.push(`  --text-2xl: ${scale.xxl};`);
  cssVars.push(`  --text-3xl: ${scale.xxxl};`);
  cssVars.push(`  --text-4xl: ${scale.xxxxl};`);

  // Line height
  const lh = preset.typography.lineHeight === "tight" ? "1.4" : preset.typography.lineHeight === "relaxed" ? "1.8" : "1.6";
  cssVars.push(`  --line-height: ${lh};`);

  // Heading weight
  const hw = getHeadingWeight(preset.typography.headingWeight);
  cssVars.push(`  --heading-weight: ${hw};`);

  // Content width
  const cw = preset.layout.contentWidth === "full_bleed" ? "100%" : preset.layout.contentWidth === "mixed" ? "1200px" : "1100px";
  cssVars.push(`  --content-width: ${cw};`);

  return `/* School Website — Generated CSS */
:root {
${cssVars.join("\n")}
}

/* Reset */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body, system-ui, sans-serif);
  font-size: var(--text-base);
  line-height: var(--line-height);
  color: var(--color-text-primary, #1a1a1a);
  background: var(--color-background, #ffffff);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading, var(--font-body, system-ui, sans-serif));
  font-weight: var(--heading-weight, 700);
  line-height: 1.2;
  ${preset.typography.headingCase === "uppercase" ? "text-transform: uppercase; letter-spacing: 0.05em;" : ""}
  ${preset.typography.headingCase === "small_caps" ? "font-variant: small-caps;" : ""}
}

h1 { font-size: var(--text-4xl); margin-bottom: 0.5em; }
h2 { font-size: var(--text-3xl); margin-bottom: 0.5em; }
h3 { font-size: var(--text-2xl); margin-bottom: 0.4em; }
h4 { font-size: var(--text-xl); margin-bottom: 0.4em; }

p { margin-bottom: 1em; }
a { color: var(--color-primary-600, #2563eb); text-decoration: none; }
a:hover { text-decoration: underline; }
img { max-width: 100%; height: auto; display: block; }

.container { max-width: var(--content-width); margin: 0 auto; padding: 0 1.5rem; }

/* Navigation */
.site-header {
  background: ${getHeaderBg(preset.colour.headerBackground)};
  ${preset.colour.headerBackground === "transparent" ? "position: absolute; top: 0; left: 0; right: 0; z-index: 50;" : "position: sticky; top: 0; z-index: 50;"}
  ${preset.colour.headerBackground !== "transparent" ? "box-shadow: 0 1px 3px rgba(0,0,0,0.1);" : ""}
}
.site-header .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}
.site-logo { display: flex; align-items: center; gap: 0.75rem; text-decoration: none; }
.site-logo img { height: 48px; width: auto; }
.site-logo span {
  font-family: var(--font-heading);
  font-weight: var(--heading-weight);
  font-size: var(--text-xl);
  color: ${preset.colour.headerBackground === "solid_brand" ? "var(--color-text-on-brand, #fff)" : "var(--color-text-primary)"};
}
.nav-links { display: flex; gap: 0.25rem; list-style: none; }
.nav-links a {
  display: block;
  padding: 0.5rem 1rem;
  border-radius: var(--btn-radius);
  color: ${preset.colour.headerBackground === "solid_brand" ? "var(--color-text-on-brand, #fff)" : "var(--color-text-primary)"};
  font-weight: 500;
  font-size: 0.9rem;
  transition: background var(--transition-speed), color var(--transition-speed);
}
.nav-links a:hover { background: rgba(0,0,0,0.06); text-decoration: none; }
.nav-links a.active { background: var(--color-primary-100); color: var(--color-primary-700); }

/* Mobile nav toggle */
.nav-toggle { display: none; background: none; border: none; cursor: pointer; padding: 0.5rem; }
.nav-toggle svg { width: 24px; height: 24px; }
@media (max-width: 768px) {
  .nav-toggle { display: block; }
  .nav-links {
    display: none;
    position: absolute;
    top: 70px;
    left: 0;
    right: 0;
    background: var(--color-background);
    flex-direction: column;
    padding: 1rem;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  .nav-links.open { display: flex; }
  .nav-links a { color: var(--color-text-primary); }
}

/* Hero Section */
.hero {
  position: relative;
  overflow: hidden;
  ${getHeroHeight(preset.layout.heroHeight)}
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-800, #1e3a5f);
}
.hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  ${heroMask ? `clip-path: ${heroMask.clipPath};` : ""}
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: ${getHeroOverlay(preset.colour.heroOverlay)};
  opacity: ${preset.colour.heroOverlayOpacity};
}
.hero-content {
  position: relative;
  z-index: 10;
  text-align: center;
  color: #fff;
  padding: 2rem;
  max-width: 800px;
}
.hero-content h1 {
  font-size: clamp(2rem, 5vw, 4rem);
  margin-bottom: 0.5em;
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.hero-content p {
  font-size: var(--text-xl);
  opacity: 0.9;
  text-shadow: 0 1px 4px rgba(0,0,0,0.2);
}
.hero-cta { display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem; flex-wrap: wrap; }

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--btn-radius);
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  transition: all var(--transition-speed);
  cursor: pointer;
  border: 2px solid transparent;
}
.btn-primary {
  background: var(--color-primary-500);
  color: var(--color-text-on-brand, #fff);
}
.btn-primary:hover { background: var(--color-primary-600); text-decoration: none; }
.btn-secondary {
  background: transparent;
  border-color: #fff;
  color: #fff;
}
.btn-secondary:hover { background: rgba(255,255,255,0.15); text-decoration: none; }
.btn-outline {
  background: transparent;
  border-color: var(--color-primary-500);
  color: var(--color-primary-600);
}
.btn-outline:hover { background: var(--color-primary-50); text-decoration: none; }

/* Sections */
.section { padding: 4rem 0; }
.section-alt { background: var(--color-background-alt, #f8fafc); }
.section-brand { background: var(--color-primary-50); }
.section-dark { background: var(--color-neutral-900, #111); color: #fff; }
.section-dark a { color: var(--color-primary-300); }

/* Cards */
.card {
  border-radius: var(--radius);
  overflow: hidden;
  transition: transform var(--transition-speed), box-shadow var(--transition-speed);
  ${getCardStyle(preset.shape.cardStyle)}
}
.card:hover {
  ${getCardHover(preset.motion.hoverStyle)}
}
.card-image { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
.card-body { padding: 1.25rem; }
.card-body h3 { font-size: var(--text-lg); margin-bottom: 0.5rem; }
.card-body p { color: var(--color-text-secondary); font-size: 0.9rem; }

/* Grid layouts */
.grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
.grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
@media (max-width: 768px) {
  .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .grid-3, .grid-4 { grid-template-columns: repeat(2, 1fr); }
}

/* Two column layout */
.two-col { display: grid; gap: 2rem; }
.two-col-50-50 { grid-template-columns: 1fr 1fr; }
.two-col-33-67 { grid-template-columns: 1fr 2fr; }
.two-col-67-33 { grid-template-columns: 2fr 1fr; }
.two-col-40-60 { grid-template-columns: 2fr 3fr; }
.two-col-60-40 { grid-template-columns: 3fr 2fr; }
@media (max-width: 768px) {
  .two-col { grid-template-columns: 1fr !important; }
}

/* Quick links */
.quick-links { display: grid; gap: 1rem; }
.quick-links.tiles { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.quick-links.icons { grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); text-align: center; }
.quick-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  border-radius: var(--radius);
  background: var(--color-background);
  text-decoration: none;
  color: var(--color-text-primary);
  transition: all var(--transition-speed);
  ${getCardStyle(preset.shape.cardStyle)}
}
.quick-link:hover {
  ${getCardHover(preset.motion.hoverStyle)}
  text-decoration: none;
}
.quick-link-icon { font-size: 2rem; margin-bottom: 0.75rem; }
.quick-link-label { font-weight: 600; font-size: 0.95rem; }

/* Statistics */
.stats-row { display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap; }
.stat-item { text-align: center; padding: 1.5rem; }
.stat-value {
  font-family: var(--font-heading);
  font-size: var(--text-4xl);
  font-weight: var(--heading-weight);
  color: var(--color-primary-600);
  line-height: 1;
}
.stat-label { color: var(--color-text-secondary); margin-top: 0.5rem; font-size: 0.9rem; }

/* Accordion */
.accordion-item { border-bottom: 1px solid var(--color-neutral-200, #e5e7eb); }
.accordion-header {
  width: 100%;
  padding: 1rem 0;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-lg);
  font-weight: 600;
  cursor: pointer;
  text-align: left;
}
.accordion-content { padding: 0 0 1rem; display: none; }
.accordion-item.open .accordion-content { display: block; }
.accordion-chevron { transition: transform 0.2s; }
.accordion-item.open .accordion-chevron { transform: rotate(180deg); }

/* Testimonials */
.testimonial { padding: 2rem; border-radius: var(--radius); ${getCardStyle(preset.shape.cardStyle)} }
.testimonial-quote { font-size: var(--text-lg); font-style: italic; margin-bottom: 1rem; }
.testimonial-author { font-weight: 600; }
.testimonial-role { color: var(--color-text-secondary); font-size: 0.85rem; }

/* CTA Banner */
.cta-banner {
  padding: 3rem 2rem;
  border-radius: var(--radius);
  text-align: center;
  background: var(--color-primary-600);
  color: #fff;
}
.cta-banner h2 { color: #fff; }
.cta-banner p { opacity: 0.9; margin-bottom: 1.5rem; }

/* Footer */
.site-footer {
  background: ${getFooterBg(preset.colour.footerBackground)};
  color: ${preset.colour.footerBackground === "white" ? "var(--color-text-primary)" : "#e5e7eb"};
  padding: 3rem 0 1.5rem;
}
.site-footer a { color: ${preset.colour.footerBackground === "white" ? "var(--color-primary-600)" : "#93c5fd"}; }
.footer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin-bottom: 2rem; }
.footer-col h4 {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
  opacity: 0.8;
}
.footer-col ul { list-style: none; }
.footer-col li { margin-bottom: 0.5rem; }
.footer-col a { font-size: 0.9rem; opacity: 0.85; }
.footer-col a:hover { opacity: 1; }
.footer-bottom {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 1.5rem;
  text-align: center;
  font-size: 0.8rem;
  opacity: 0.6;
}

/* Breadcrumbs */
.breadcrumbs { padding: 0.75rem 0; font-size: 0.85rem; color: var(--color-text-secondary); }
.breadcrumbs a { color: var(--color-primary-600); }
.breadcrumbs span { margin: 0 0.5rem; }

/* Contact form */
.contact-form { max-width: 600px; }
.form-group { margin-bottom: 1.25rem; }
.form-label { display: block; font-weight: 500; margin-bottom: 0.4rem; font-size: 0.9rem; }
.form-input {
  width: 100%;
  padding: 0.65rem 0.9rem;
  border: 1px solid var(--color-neutral-300, #d1d5db);
  border-radius: calc(var(--radius) / 2);
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.2s;
}
.form-input:focus { outline: none; border-color: var(--color-primary-500); box-shadow: 0 0 0 3px var(--color-primary-100); }
textarea.form-input { min-height: 120px; resize: vertical; }

/* Document list */
.doc-list { list-style: none; }
.doc-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--color-neutral-200, #e5e7eb);
}
.doc-icon { color: var(--color-primary-500); flex-shrink: 0; }
.doc-name { font-weight: 500; }
.doc-meta { font-size: 0.8rem; color: var(--color-text-secondary); }

/* Values grid */
.values-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
.value-card { text-align: center; padding: 2rem 1.5rem; border-radius: var(--radius); ${getCardStyle(preset.shape.cardStyle)} }
.value-icon { font-size: 2.5rem; margin-bottom: 1rem; }
.value-title { font-weight: 700; margin-bottom: 0.5rem; }

/* Image shapes */
.img-rounded { border-radius: var(--radius); }
.img-circle { border-radius: 50%; aspect-ratio: 1; object-fit: cover; }

/* News list */
.news-list { display: grid; gap: 1.5rem; }
.news-card { display: flex; gap: 1rem; }
.news-card-image { width: 200px; height: 130px; object-fit: cover; border-radius: var(--radius); flex-shrink: 0; }
.news-card-body h3 { font-size: var(--text-lg); margin-bottom: 0.25rem; }
.news-card-date { font-size: 0.8rem; color: var(--color-text-secondary); margin-bottom: 0.5rem; }
@media (max-width: 640px) {
  .news-card { flex-direction: column; }
  .news-card-image { width: 100%; height: 200px; }
}

/* Staff grid */
.staff-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
.staff-card { text-align: center; padding: 1.5rem; border-radius: var(--radius); }
.staff-photo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 1rem;
}
.staff-name { font-weight: 600; }
.staff-role { font-size: 0.85rem; color: var(--color-text-secondary); }

/* Map */
.map-container { width: 100%; border-radius: var(--radius); overflow: hidden; }
.map-container iframe { width: 100%; height: 400px; border: 0; }

/* Tabs */
.tabs-nav { display: flex; gap: 0; border-bottom: 2px solid var(--color-neutral-200); }
.tab-btn {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}
.tab-btn.active { border-bottom-color: var(--color-primary-500); color: var(--color-primary-600); }
.tab-panel { padding: 1.5rem 0; display: none; }
.tab-panel.active { display: block; }

/* Dividers */
.divider-line { border-top: 1px solid var(--color-neutral-200); }
.divider-wave { height: 40px; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 40'%3E%3Cpath d='M0 20 C300 0, 600 40, 1200 20 L1200 40 L0 40 Z' fill='%23f1f5f9'/%3E%3C/svg%3E") repeat-x; }

/* Utilities */
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.mt-4 { margin-top: 1rem; }
.mb-4 { margin-bottom: 1rem; }
.py-sm { padding-top: 1rem; padding-bottom: 1rem; }
.py-md { padding-top: 2rem; padding-bottom: 2rem; }
.py-lg { padding-top: 4rem; padding-bottom: 4rem; }

/* Cookie banner */
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-neutral-900);
  color: #fff;
  padding: 1rem;
  z-index: 1000;
  display: none;
}
.cookie-banner.show { display: flex; justify-content: center; align-items: center; gap: 1rem; flex-wrap: wrap; }
.cookie-banner p { margin: 0; font-size: 0.85rem; }

/* Print styles */
@media print {
  .site-header, .site-footer, .cookie-banner { display: none; }
  .hero { min-height: auto; padding: 2rem 0; }
  body { font-size: 12pt; }
}
`;
}

// ------------------------------------------------------------
// Page HTML Generation
// ------------------------------------------------------------

interface PageContext {
  page: WebsitePage;
  website: SchoolWebsite;
  preset: StylePreset;
  palette: GeneratedPalette | null;
  fontPairing: FontPairing | undefined;
  heroMask: HeroMask | undefined;
  mainNav: NavigationItem[];
  footerNav: NavigationItem[];
  posts: WebsitePost[];
  allPages: WebsitePage[];
  css: string;
}

function generatePageHtml(ctx: PageContext): string {
  const { page, website, fontPairing, css } = ctx;
  const googleFontsUrl = fontPairing ? getGoogleFontsUrl(fontPairing) : "";
  const title = page.seoTitle || page.title;
  const description = page.seoDescription || website.seoDescription || `${website.schoolName} - ${page.title}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} — ${escapeHtml(website.schoolName)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  ${website.seoImageUrl ? `<meta property="og:image" content="${escapeHtml(website.seoImageUrl)}">` : ""}
  <meta property="og:title" content="${escapeHtml(title)} — ${escapeHtml(website.schoolName)}">
  <meta property="og:type" content="website">
  ${page.noIndex ? '<meta name="robots" content="noindex, nofollow">' : ""}
  ${website.faviconUrl ? `<link rel="icon" href="${escapeHtml(website.faviconUrl)}">` : ""}
  ${googleFontsUrl ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${googleFontsUrl}">` : ""}
  <style>${css}</style>
</head>
<body>
  ${renderHeader(ctx)}
  <main>
    ${page.showBreadcrumbs && page.slug !== "/" ? renderBreadcrumbs(ctx) : ""}
    ${renderContentBlocks(page.contentBlocks, ctx)}
  </main>
  ${renderFooter(ctx)}
  ${website.cookieConsentEnabled ? renderCookieBanner() : ""}
  ${renderMinimalJs()}
</body>
</html>`;
}

interface PostContext {
  post: WebsitePost;
  website: SchoolWebsite;
  preset: StylePreset;
  palette: GeneratedPalette | null;
  fontPairing: FontPairing | undefined;
  heroMask: HeroMask | undefined;
  mainNav: NavigationItem[];
  footerNav: NavigationItem[];
  css: string;
}

function generatePostHtml(ctx: PostContext): string {
  const { post, website, fontPairing, css } = ctx;
  const googleFontsUrl = fontPairing ? getGoogleFontsUrl(fontPairing) : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} — ${escapeHtml(website.schoolName)}</title>
  <meta name="description" content="${escapeHtml(post.excerpt || post.title)}">
  ${post.featuredImageUrl ? `<meta property="og:image" content="${escapeHtml(post.featuredImageUrl)}">` : ""}
  <meta property="og:title" content="${escapeHtml(post.title)}">
  <meta property="og:type" content="article">
  ${website.faviconUrl ? `<link rel="icon" href="${escapeHtml(website.faviconUrl)}">` : ""}
  ${googleFontsUrl ? `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${googleFontsUrl}">` : ""}
  <style>${css}</style>
</head>
<body>
  ${renderHeader({ ...ctx, page: null as unknown as WebsitePage, mainNav: ctx.mainNav, footerNav: ctx.footerNav, posts: [], allPages: [] })}
  <main>
    <div class="section">
      <div class="container">
        <div class="breadcrumbs">
          <a href="/">Home</a><span>›</span><a href="/news">News</a><span>›</span>${escapeHtml(post.title)}
        </div>
        ${post.featuredImageUrl ? `<img src="${escapeHtml(post.featuredImageUrl)}" alt="${escapeHtml(post.title)}" class="img-rounded" style="width:100%;max-height:400px;object-fit:cover;margin:1.5rem 0;">` : ""}
        <h1>${escapeHtml(post.title)}</h1>
        <p class="news-card-date">${post.publishedAt ? formatDate(post.publishedAt) : ""} ${post.authorName ? `· ${escapeHtml(post.authorName)}` : ""}</p>
        ${renderContentBlocks(post.contentBlocks, { ...ctx, page: null as unknown as WebsitePage, mainNav: ctx.mainNav, footerNav: ctx.footerNav, posts: [], allPages: [] })}
      </div>
    </div>
  </main>
  ${renderFooter({ ...ctx, page: null as unknown as WebsitePage, mainNav: ctx.mainNav, footerNav: ctx.footerNav, posts: [], allPages: [] })}
  ${renderMinimalJs()}
</body>
</html>`;
}

// ------------------------------------------------------------
// Component renderers
// ------------------------------------------------------------

function renderHeader(ctx: PageContext): string {
  const { website, mainNav } = ctx;
  const navItems = mainNav
    .filter((n) => !n.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => {
      const href = item.pageId
        ? `/${ctx.allPages.find((p) => p.id === item.pageId)?.slug || "#"}`
        : item.url || "#";
      return `<li><a href="${escapeHtml(href)}"${item.openInNewTab ? ' target="_blank" rel="noopener"' : ""}>${escapeHtml(item.label)}</a></li>`;
    })
    .join("\n          ");

  return `<header class="site-header">
    <div class="container">
      <a href="/" class="site-logo">
        ${website.logoUrl ? `<img src="${escapeHtml(website.logoUrl)}" alt="${escapeHtml(website.schoolName)} logo">` : ""}
        <span>${escapeHtml(website.schoolName)}</span>
      </a>
      <button class="nav-toggle" aria-label="Menu" onclick="document.querySelector('.nav-links').classList.toggle('open')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
      <ul class="nav-links">
        ${navItems}
      </ul>
    </div>
  </header>`;
}

function renderFooter(ctx: PageContext): string {
  const { website } = ctx;
  const year = new Date().getFullYear();

  return `<footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <h4>${escapeHtml(website.schoolName)}</h4>
          ${website.motto ? `<p style="opacity:0.8;font-style:italic;font-size:0.9rem;">"${escapeHtml(website.motto)}"</p>` : ""}
          ${website.address?.line1 ? `<p style="font-size:0.85rem;opacity:0.7;margin-top:0.75rem;">${escapeHtml(website.address.line1)}<br>${escapeHtml(website.address.city || "")} ${escapeHtml(website.address.postcode || "")}</p>` : ""}
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <ul>
            ${website.contactEmail ? `<li><a href="mailto:${escapeHtml(website.contactEmail)}">${escapeHtml(website.contactEmail)}</a></li>` : ""}
            ${website.contactPhone ? `<li><a href="tel:${escapeHtml(website.contactPhone)}">${escapeHtml(website.contactPhone)}</a></li>` : ""}
          </ul>
        </div>
        <div class="footer-col">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/about">About Us</a></li>
            <li><a href="/admissions">Admissions</a></li>
            <li><a href="/contact">Contact</a></li>
            <li><a href="/parents/policies">Policies</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; ${year} ${escapeHtml(website.schoolName)}. All rights reserved.
        ${website.subdomain ? `<br>Powered by <a href="https://schoolgle.co.uk" style="color:inherit;text-decoration:underline;">Schoolgle</a>` : ""}
      </div>
    </div>
  </footer>`;
}

function renderBreadcrumbs(ctx: PageContext): string {
  const { page, allPages } = ctx;
  const parts: Array<{ label: string; slug: string }> = [{ label: "Home", slug: "/" }];

  // Walk up the parent chain
  let current = page;
  const chain: WebsitePage[] = [current];
  while (current.parentId) {
    const parent = allPages.find((p) => p.id === current.parentId);
    if (parent) {
      chain.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }

  for (const p of chain.slice(0, -1)) {
    parts.push({ label: p.title, slug: p.slug });
  }

  return `<div class="section" style="padding:0.5rem 0;">
    <div class="container">
      <div class="breadcrumbs">
        ${parts.map((p) => `<a href="/${p.slug === "/" ? "" : p.slug}">${escapeHtml(p.label)}</a>`).join('<span>›</span>')}
        <span>›</span>${escapeHtml(page.title)}
      </div>
    </div>
  </div>`;
}

function renderContentBlocks(blocks: ContentBlock[], ctx: PageContext): string {
  return blocks
    .filter((b) => b.visible !== false)
    .map((block, i) => renderBlock(block, ctx, i))
    .join("\n");
}

function renderBlock(block: ContentBlock, ctx: PageContext, index: number): string {
  const bgClass = block.background === "alt" ? " section-alt" : block.background === "brand" ? " section-brand" : block.background === "dark" ? " section-dark" : "";
  const padClass = block.padding === "none" ? "" : block.padding === "small" ? " py-sm" : block.padding === "large" ? " py-lg" : " py-md";

  const wrap = (inner: string, useContainer = true) =>
    `<section class="section${bgClass}${padClass}">
      ${useContainer ? '<div class="container">' : ""}${inner}${useContainer ? "</div>" : ""}
    </section>`;

  switch (block.type) {
    case "hero":
      return renderHero(block, ctx);
    case "text":
      return wrap(block.html);
    case "heading":
      return wrap(`<h${block.level} class="text-${block.alignment || "left"}">${escapeHtml(block.text)}</h${block.level}>`);
    case "image":
      return wrap(`<figure class="text-${block.alignment || "center"}">
        <img src="${escapeHtml(block.url)}" alt="${escapeHtml(block.alt)}" class="img-rounded" style="${block.width === "small" ? "max-width:400px;" : block.width === "full" ? "width:100%;" : "max-width:800px;"}margin:0 auto;">
        ${block.caption ? `<figcaption style="margin-top:0.5rem;font-size:0.85rem;color:var(--color-text-secondary);">${escapeHtml(block.caption)}</figcaption>` : ""}
      </figure>`);
    case "gallery":
      return wrap(renderGallery(block));
    case "video":
      return wrap(renderVideo(block));
    case "two_column":
      return wrap(renderTwoColumn(block, ctx));
    case "three_column":
      return wrap(renderThreeColumn(block, ctx));
    case "card_grid":
      return wrap(renderCardGrid(block));
    case "quick_links":
      return wrap(renderQuickLinks(block));
    case "contact_form":
      return wrap(renderContactForm(block));
    case "map":
      return wrap(renderMap(block));
    case "accordion":
      return wrap(renderAccordion(block));
    case "tabs":
      return wrap(renderTabs(block));
    case "staff_list":
      return wrap(renderStaffList(block));
    case "governor_list":
      return wrap(renderGovernorList(block));
    case "news_feed":
      return wrap(renderNewsFeed(block, ctx));
    case "policy_list":
      return wrap(renderPolicyList(block));
    case "statistics":
      return wrap(renderStatistics(block));
    case "testimonials":
      return wrap(renderTestimonials(block));
    case "cta_banner":
      return wrap(renderCtaBanner(block));
    case "divider":
      return `<div class="divider-${block.style || "line"}"></div>`;
    case "spacer":
      return `<div style="height:${block.height === "small" ? "1rem" : block.height === "large" ? "4rem" : "2rem"};"></div>`;
    case "html":
      return wrap(block.code, false);
    case "document_list":
      return wrap(renderDocumentList(block));
    case "values_grid":
      return wrap(renderValuesGrid(block));
    default:
      return "";
  }
}

function renderHero(block: HeroBlock, ctx: PageContext): string {
  return `<section class="hero">
    ${block.imageUrl ? `<img src="${escapeHtml(block.imageUrl)}" alt="" class="hero-image">` : ""}
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <h1>${escapeHtml(block.title)}</h1>
      ${block.subtitle ? `<p>${escapeHtml(block.subtitle)}</p>` : ""}
      ${block.ctaText ? `<div class="hero-cta">
        <a href="${escapeHtml(block.ctaUrl || "#")}" class="btn btn-primary">${escapeHtml(block.ctaText)}</a>
        ${block.ctaSecondaryText ? `<a href="${escapeHtml(block.ctaSecondaryUrl || "#")}" class="btn btn-secondary">${escapeHtml(block.ctaSecondaryText)}</a>` : ""}
      </div>` : ""}
    </div>
  </section>`;
}

function renderGallery(block: GalleryBlock): string {
  const cols = block.columns || 3;
  return `<div class="grid-${cols}">
    ${block.images.map((img) => `<div>
      <img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt)}" class="img-rounded" style="width:100%;aspect-ratio:4/3;object-fit:cover;">
      ${img.caption ? `<p style="font-size:0.85rem;color:var(--color-text-secondary);margin-top:0.5rem;">${escapeHtml(img.caption)}</p>` : ""}
    </div>`).join("\n")}
  </div>`;
}

function renderVideo(block: VideoBlock): string {
  if (block.provider === "youtube" || block.url.includes("youtube") || block.url.includes("youtu.be")) {
    const videoId = extractYouTubeId(block.url);
    return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:var(--radius);">
      <iframe src="https://www.youtube-nocookie.com/embed/${videoId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;" allowfullscreen loading="lazy"></iframe>
    </div>`;
  }
  return `<video ${block.autoplay ? 'autoplay muted loop playsinline' : 'controls'} style="width:100%;border-radius:var(--radius);">
    <source src="${escapeHtml(block.url)}" type="video/mp4">
  </video>`;
}

function renderTwoColumn(block: TwoColumnBlock, ctx: PageContext): string {
  const split = block.split || "50_50";
  return `<div class="two-col two-col-${split}">
    <div>${renderContentBlocks(block.leftContent, ctx)}</div>
    <div>${renderContentBlocks(block.rightContent, ctx)}</div>
  </div>`;
}

function renderThreeColumn(block: ThreeColumnBlock, ctx: PageContext): string {
  return `<div class="grid-3">
    ${block.columns.map((col) => `<div>${renderContentBlocks(col, ctx)}</div>`).join("\n")}
  </div>`;
}

function renderCardGrid(block: CardGridBlock): string {
  const cols = block.columns || 3;
  return `<div class="grid-${cols}">
    ${block.cards.map((card) => `<div class="card">
      ${card.imageUrl ? `<img src="${escapeHtml(card.imageUrl)}" alt="${escapeHtml(card.title)}" class="card-image">` : ""}
      <div class="card-body">
        <h3>${escapeHtml(card.title)}</h3>
        <p>${escapeHtml(card.description)}</p>
        ${card.linkUrl ? `<a href="${escapeHtml(card.linkUrl)}" class="btn btn-outline" style="margin-top:0.75rem;">${escapeHtml(card.linkText || "Learn more")}</a>` : ""}
      </div>
    </div>`).join("\n")}
  </div>`;
}

function renderQuickLinks(block: QuickLinksBlock): string {
  const style = block.style || "tiles";
  return `<div class="quick-links ${style}">
    ${block.links.map((link) => `<a href="${escapeHtml(link.url)}" class="quick-link">
      ${link.icon ? `<span class="quick-link-icon">${escapeHtml(link.icon)}</span>` : ""}
      <span class="quick-link-label">${escapeHtml(link.label)}</span>
      ${link.description ? `<span style="font-size:0.8rem;color:var(--color-text-secondary);margin-top:0.25rem;">${escapeHtml(link.description)}</span>` : ""}
    </a>`).join("\n")}
  </div>`;
}

function renderContactForm(block: ContactFormBlock): string {
  return `<div class="contact-form">
    ${block.title ? `<h2>${escapeHtml(block.title)}</h2>` : ""}
    ${block.description ? `<p>${escapeHtml(block.description)}</p>` : ""}
    <form method="POST" action="/api/contact" class="mt-4">
      ${block.fields.map((field) => `<div class="form-group">
        <label class="form-label" for="field-${field.name}">${escapeHtml(field.label)}${field.required ? " *" : ""}</label>
        ${field.type === "textarea"
          ? `<textarea id="field-${field.name}" name="${escapeHtml(field.name)}" class="form-input" ${field.required ? "required" : ""}></textarea>`
          : field.type === "select"
            ? `<select id="field-${field.name}" name="${escapeHtml(field.name)}" class="form-input" ${field.required ? "required" : ""}>
                <option value="">Please select...</option>
                ${(field.options || []).map((opt) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join("")}
              </select>`
            : `<input id="field-${field.name}" name="${escapeHtml(field.name)}" type="${field.type}" class="form-input" ${field.required ? "required" : ""}>`
        }
      </div>`).join("\n")}
      <button type="submit" class="btn btn-primary">${escapeHtml(block.submitText || "Send Message")}</button>
    </form>
  </div>`;
}

function renderMap(block: MapBlock): string {
  const query = encodeURIComponent(block.address);
  return `<div class="map-container">
    <iframe src="https://maps.google.com/maps?q=${query}&output=embed" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
  </div>`;
}

function renderAccordion(block: AccordionBlock): string {
  return `<div class="accordion">
    ${block.items.map((item, i) => `<div class="accordion-item">
      <button class="accordion-header" onclick="this.parentElement.classList.toggle('open')">
        ${escapeHtml(item.title)}
        <svg class="accordion-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="accordion-content">${item.content}</div>
    </div>`).join("\n")}
  </div>`;
}

function renderTabs(block: TabsBlock): string {
  return `<div class="tabs">
    <div class="tabs-nav">
      ${block.tabs.map((tab, i) => `<button class="tab-btn${i === 0 ? " active" : ""}" onclick="switchTab(this, ${i})">${escapeHtml(tab.label)}</button>`).join("")}
    </div>
    ${block.tabs.map((tab, i) => `<div class="tab-panel${i === 0 ? " active" : ""}" data-tab="${i}">${tab.content}</div>`).join("")}
  </div>`;
}

function renderStaffList(block: StaffListBlock): string {
  const entries = block.manualEntries || [];
  return `<div class="staff-grid">
    ${entries.map((person) => `<div class="staff-card">
      ${block.showPhotos && person.photoUrl ? `<img src="${escapeHtml(person.photoUrl)}" alt="${escapeHtml(person.name)}" class="staff-photo">` : `<div class="staff-photo" style="background:var(--color-primary-100);display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--color-primary-500);">${person.name.charAt(0)}</div>`}
      <div class="staff-name">${escapeHtml(person.name)}</div>
      ${block.showRoles ? `<div class="staff-role">${escapeHtml(person.role)}</div>` : ""}
      ${person.bio ? `<p style="font-size:0.85rem;margin-top:0.5rem;color:var(--color-text-secondary);">${escapeHtml(person.bio)}</p>` : ""}
    </div>`).join("\n")}
  </div>`;
}

function renderGovernorList(block: GovernorListBlock): string {
  const entries = block.manualEntries || [];
  return `<div class="grid-3">
    ${entries.map((gov) => `<div class="card">
      <div class="card-body">
        <h3 style="font-size:1rem;">${escapeHtml(gov.name)}</h3>
        ${block.showCategory ? `<p style="color:var(--color-primary-600);font-size:0.85rem;font-weight:500;">${escapeHtml(gov.category)}</p>` : ""}
        ${gov.role ? `<p style="font-size:0.85rem;">${escapeHtml(gov.role)}</p>` : ""}
        ${block.showTermDates && gov.termEnd ? `<p style="font-size:0.8rem;color:var(--color-text-secondary);">Term ends: ${escapeHtml(gov.termEnd)}</p>` : ""}
      </div>
    </div>`).join("\n")}
  </div>`;
}

function renderNewsFeed(block: NewsFeedBlock, ctx: PageContext): string {
  const count = block.count || 5;
  const recentPosts = ctx.posts
    .filter((p) => p.status === "published")
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""))
    .slice(0, count);

  if (recentPosts.length === 0) {
    return `<p style="color:var(--color-text-secondary);">No news articles yet.</p>`;
  }

  return `<div class="news-list">
    ${recentPosts.map((post) => `<a href="/news/${escapeHtml(post.slug)}" class="news-card" style="text-decoration:none;color:inherit;">
      ${block.showImage && post.featuredImageUrl ? `<img src="${escapeHtml(post.featuredImageUrl)}" alt="${escapeHtml(post.title)}" class="news-card-image">` : ""}
      <div class="news-card-body">
        <h3>${escapeHtml(post.title)}</h3>
        <div class="news-card-date">${post.publishedAt ? formatDate(post.publishedAt) : ""}</div>
        ${block.showExcerpt && post.excerpt ? `<p style="font-size:0.9rem;color:var(--color-text-secondary);">${escapeHtml(post.excerpt)}</p>` : ""}
      </div>
    </a>`).join("\n")}
  </div>`;
}

function renderPolicyList(block: PolicyListBlock): string {
  const policies = block.manualPolicies || [];
  return `<ul class="doc-list">
    ${policies.map((p) => `<li class="doc-item">
      <span class="doc-icon">📄</span>
      <div>
        <a href="${escapeHtml(p.documentUrl)}" class="doc-name" target="_blank" rel="noopener">${escapeHtml(p.name)}</a>
        <div class="doc-meta">${escapeHtml(p.category)}${p.reviewDate ? ` · Review: ${escapeHtml(p.reviewDate)}` : ""}</div>
      </div>
    </li>`).join("\n")}
  </ul>`;
}

function renderStatistics(block: StatisticsBlock): string {
  return `<div class="stats-row">
    ${block.stats.map((s) => `<div class="stat-item">
      <div class="stat-value">${escapeHtml(s.value)}${s.suffix ? escapeHtml(s.suffix) : ""}</div>
      <div class="stat-label">${escapeHtml(s.label)}</div>
    </div>`).join("\n")}
  </div>`;
}

function renderTestimonials(block: TestimonialsBlock): string {
  return `<div class="grid-${Math.min(block.testimonials.length, 3)}">
    ${block.testimonials.map((t) => `<div class="testimonial">
      <div class="testimonial-quote">"${escapeHtml(t.quote)}"</div>
      <div class="testimonial-author">${escapeHtml(t.author)}</div>
      ${t.role ? `<div class="testimonial-role">${escapeHtml(t.role)}</div>` : ""}
    </div>`).join("\n")}
  </div>`;
}

function renderCtaBanner(block: CtaBannerBlock): string {
  return `<div class="cta-banner">
    <h2>${escapeHtml(block.title)}</h2>
    ${block.description ? `<p>${escapeHtml(block.description)}</p>` : ""}
    <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
      <a href="${escapeHtml(block.buttonUrl)}" class="btn btn-primary" style="background:#fff;color:var(--color-primary-600);">${escapeHtml(block.buttonText)}</a>
      ${block.secondaryButtonText ? `<a href="${escapeHtml(block.secondaryButtonUrl || "#")}" class="btn btn-secondary">${escapeHtml(block.secondaryButtonText)}</a>` : ""}
    </div>
  </div>`;
}

function renderDocumentList(block: DocumentListBlock): string {
  return `<ul class="doc-list">
    ${block.documents.map((d) => `<li class="doc-item">
      <span class="doc-icon">📎</span>
      <div>
        <a href="${escapeHtml(d.url)}" class="doc-name" target="_blank" rel="noopener">${escapeHtml(d.name)}</a>
        <div class="doc-meta">${d.fileType ? escapeHtml(d.fileType) : ""}${d.fileSize ? ` · ${escapeHtml(d.fileSize)}` : ""}</div>
      </div>
    </li>`).join("\n")}
  </ul>`;
}

function renderValuesGrid(block: ValuesGridBlock): string {
  return `<div class="values-grid">
    ${block.values.map((v) => `<div class="value-card">
      ${v.icon ? `<div class="value-icon">${escapeHtml(v.icon)}</div>` : ""}
      ${v.imageUrl ? `<img src="${escapeHtml(v.imageUrl)}" alt="${escapeHtml(v.title)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;margin:0 auto 1rem;">` : ""}
      <div class="value-title">${escapeHtml(v.title)}</div>
      <p style="font-size:0.9rem;color:var(--color-text-secondary);">${escapeHtml(v.description)}</p>
    </div>`).join("\n")}
  </div>`;
}

function renderCookieBanner(): string {
  return `<div class="cookie-banner" id="cookieBanner">
    <p>This website uses cookies to ensure you get the best experience.</p>
    <button class="btn btn-primary" onclick="document.getElementById('cookieBanner').style.display='none';localStorage.setItem('cookies_accepted','1');" style="font-size:0.85rem;padding:0.4rem 1rem;">Accept</button>
  </div>`;
}

function renderMinimalJs(): string {
  return `<script>
// Cookie banner
if(!localStorage.getItem('cookies_accepted')){
  var cb=document.getElementById('cookieBanner');
  if(cb)cb.classList.add('show');
}
// Tabs
function switchTab(btn,idx){
  var p=btn.parentElement.parentElement;
  p.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active')});
  p.querySelectorAll('.tab-panel').forEach(function(t){t.classList.remove('active')});
  btn.classList.add('active');
  p.querySelector('[data-tab="'+idx+'"]').classList.add('active');
}
</script>`;
}

// ------------------------------------------------------------
// Helper utilities
// ------------------------------------------------------------

function resolvePreset(
  preset: StylePreset,
  website: SchoolWebsite
): StylePreset {
  return {
    ...preset,
    layout: { ...preset.layout, ...(website.layoutOverrides as Record<string, unknown>) } as StylePreset["layout"],
    shape: { ...preset.shape, ...(website.shapeOverrides as Record<string, unknown>) } as StylePreset["shape"],
    colour: { ...preset.colour, ...(website.colourOverrides as Record<string, unknown>) } as StylePreset["colour"],
    typography: { ...preset.typography, ...(website.typographyOverrides as Record<string, unknown>) } as StylePreset["typography"],
    motion: { ...preset.motion, ...(website.motionOverrides as Record<string, unknown>) } as StylePreset["motion"],
    imagery: { ...preset.imagery, ...(website.imageryOverrides as Record<string, unknown>) } as StylePreset["imagery"],
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : "";
}

function getHeaderBg(style: string): string {
  switch (style) {
    case "solid_brand": return "var(--color-primary-700)";
    case "gradient": return "linear-gradient(135deg, var(--color-primary-700), var(--color-primary-500))";
    case "transparent": return "transparent";
    default: return "var(--color-background)";
  }
}

function getFooterBg(style: string): string {
  switch (style) {
    case "dark": return "var(--color-neutral-900, #111827)";
    case "brand": return "var(--color-primary-800)";
    case "grey": return "var(--color-neutral-100, #f3f4f6)";
    default: return "var(--color-background)";
  }
}

function getHeroOverlay(style: string): string {
  switch (style) {
    case "dark_gradient": return "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)";
    case "brand_colour": return "var(--color-primary-800)";
    case "light_gradient": return "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.3) 100%)";
    default: return "transparent";
  }
}

function getHeroHeight(height: string): string {
  switch (height) {
    case "full_viewport": return "min-height: 100vh;";
    case "large": return "min-height: 70vh;";
    case "medium": return "min-height: 50vh;";
    case "compact": return "min-height: 35vh;";
    default: return "min-height: 50vh;";
  }
}

function getBtnRadius(style: string): string {
  switch (style) {
    case "square": return "2px";
    case "pill": return "9999px";
    default: return "6px";
  }
}

function getTransitionSpeed(level: string): string {
  switch (level) {
    case "none": return "0ms";
    case "subtle": return "200ms";
    case "moderate": return "300ms";
    case "playful": return "400ms";
    default: return "200ms";
  }
}

function getTextScale(scale: string): Record<string, string> {
  switch (scale) {
    case "compact":
      return { base: "0.875rem", lg: "1rem", xl: "1.125rem", xxl: "1.375rem", xxxl: "1.75rem", xxxxl: "2.25rem" };
    case "spacious":
      return { base: "1.0625rem", lg: "1.25rem", xl: "1.5rem", xxl: "1.875rem", xxxl: "2.5rem", xxxxl: "3.5rem" };
    default:
      return { base: "1rem", lg: "1.125rem", xl: "1.25rem", xxl: "1.5rem", xxxl: "2rem", xxxxl: "2.75rem" };
  }
}

function getHeadingWeight(weight: string): string {
  switch (weight) {
    case "medium": return "500";
    case "semibold": return "600";
    case "bold": return "700";
    case "extrabold": return "800";
    case "black": return "900";
    default: return "700";
  }
}

function getCardStyle(style: string): string {
  switch (style) {
    case "elevated": return "background: var(--color-background); box-shadow: 0 2px 8px rgba(0,0,0,0.08);";
    case "bordered": return "background: var(--color-background); border: 1px solid var(--color-neutral-200, #e5e7eb);";
    case "outlined": return "background: transparent; border: 2px solid var(--color-neutral-300, #d1d5db);";
    case "glass": return "background: rgba(255,255,255,0.1); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2);";
    default: return "background: var(--color-background);";
  }
}

function getCardHover(style: string): string {
  switch (style) {
    case "lift": return "transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12);";
    case "glow": return "box-shadow: 0 0 20px var(--color-primary-200);";
    case "scale": return "transform: scale(1.02);";
    case "colour_shift": return "border-color: var(--color-primary-400);";
    default: return "";
  }
}
