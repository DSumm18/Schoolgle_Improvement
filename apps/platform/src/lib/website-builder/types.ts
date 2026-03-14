// ============================================================
// School Website Builder — Core Types
// ============================================================
// The layer system: 6 visual layers stacked on a fixed content
// structure. Each preset defines all 6 layers. Schools override
// individual settings on top.
// ============================================================

// ------------------------------------------------------------
// Layer 1: Layout
// ------------------------------------------------------------

export type NavStyle = "top_bar" | "mega_menu" | "hamburger" | "sticky_transparent";
export type NavPosition = "top" | "left_sidebar";
export type HeroStyle = "carousel" | "static_image" | "video" | "split" | "collage" | "gradient";
export type HeroHeight = "full_viewport" | "large" | "medium" | "compact";
export type ContentWidth = "contained" | "full_bleed" | "mixed";
export type GridStyle = "cards" | "list" | "magazine" | "mosaic";
export type QuickLinksStyle = "tiles" | "icons" | "buttons" | "cards";
export type FooterStyle = "simple" | "detailed" | "mega_footer";

export interface LayoutLayer {
  navStyle: NavStyle;
  navPosition: NavPosition;
  heroStyle: HeroStyle;
  heroHeight: HeroHeight;
  contentWidth: ContentWidth;
  gridStyle: GridStyle;
  quickLinksStyle: QuickLinksStyle;
  quickLinksCount: 4 | 6 | 8;
  footerStyle: FooterStyle;
}

// ------------------------------------------------------------
// Layer 2: Shape Language
// ------------------------------------------------------------

export type BorderRadius = 0 | 4 | 8 | 12 | 16 | 24 | 9999;
export type SectionDivider = "straight" | "wave" | "curve" | "angle" | "organic" | "none";
export type CardStyle = "elevated" | "bordered" | "flat" | "outlined" | "glass";
export type ButtonStyle = "square" | "rounded" | "pill";
export type ImageShape = "square" | "rounded" | "circle" | "blob";

export interface ShapeLayer {
  borderRadius: BorderRadius;
  sectionDivider: SectionDivider;
  cardStyle: CardStyle;
  buttonStyle: ButtonStyle;
  imageShape: ImageShape;
}

// ------------------------------------------------------------
// Layer 3: Colour Application
// ------------------------------------------------------------

export type ColourMode = "bold_headers" | "subtle_tints" | "monochrome" | "colourful_sections" | "dark_accent";
export type HeaderBackground = "solid_brand" | "white" | "transparent" | "gradient";
export type HeroOverlay = "dark_gradient" | "brand_colour" | "light_gradient" | "none";
export type SectionAlternation = "white_grey" | "white_brand" | "all_white" | "colour_blocks";
export type FooterBackground = "dark" | "brand" | "grey" | "white";

export interface ColourLayer {
  mode: ColourMode;
  headerBackground: HeaderBackground;
  heroOverlay: HeroOverlay;
  heroOverlayOpacity: number; // 0.0 - 0.7
  sectionAlternation: SectionAlternation;
  footerBackground: FooterBackground;
}

// ------------------------------------------------------------
// Layer 4: Typography
// ------------------------------------------------------------

export type HeadingFontCategory = "geometric_sans" | "humanist_sans" | "serif" | "display" | "rounded_sans" | "slab_serif";
export type BodyFontCategory = "clean_sans" | "readable_serif" | "system_default";
export type HeadingWeight = "medium" | "semibold" | "bold" | "extrabold" | "black";
export type TextScale = "compact" | "standard" | "spacious";
export type HeadingCase = "normal" | "uppercase" | "small_caps";
export type LineHeight = "tight" | "normal" | "relaxed";

export interface TypographyLayer {
  headingFont: HeadingFontCategory;
  bodyFont: BodyFontCategory;
  headingWeight: HeadingWeight;
  textScale: TextScale;
  headingCase: HeadingCase;
  lineHeight: LineHeight;
}

// ------------------------------------------------------------
// Layer 5: Motion
// ------------------------------------------------------------

export type MotionLevel = "none" | "subtle" | "moderate" | "playful";
export type ScrollEffect = "none" | "fade_up" | "slide_in" | "parallax" | "reveal";
export type HoverStyle = "lift" | "glow" | "scale" | "colour_shift" | "underline";
export type PageTransition = "none" | "fade" | "slide";
export type HeroAnimation = "none" | "ken_burns" | "fade_cycle" | "parallax_scroll";

export interface MotionLayer {
  level: MotionLevel;
  scrollEffect: ScrollEffect;
  hoverStyle: HoverStyle;
  pageTransition: PageTransition;
  heroAnimation: HeroAnimation;
  counterAnimation: boolean;
}

// ------------------------------------------------------------
// Layer 6: Imagery
// ------------------------------------------------------------

export type PhotoTreatment = "natural" | "rounded_corners" | "circular_crop" | "masked_blob" | "duotone";
export type PhotoSpacing = "tight" | "standard" | "generous";
export type GalleryStyle = "grid" | "masonry" | "carousel" | "lightbox";
export type IconStyle = "outline" | "filled" | "duotone" | "hand_drawn";
export type IllustrationStyle = "none" | "geometric" | "organic" | "hand_drawn";

export interface ImageryLayer {
  photoTreatment: PhotoTreatment;
  photoSpacing: PhotoSpacing;
  galleryStyle: GalleryStyle;
  iconStyle: IconStyle;
  illustrationStyle: IllustrationStyle;
}

// ------------------------------------------------------------
// Hero Mask System
// ------------------------------------------------------------

export type HeroMaskId =
  | "full_width"
  | "diagonal_right"
  | "diagonal_left"
  | "wave_bottom"
  | "arch"
  | "corner_reveal_br"
  | "corner_reveal_bl"
  | "stepped_right"
  | "stepped_left"
  | "circle_crop"
  | "rounded_rectangle"
  | "slant_right"
  | "slant_left"
  | "peak"
  | "scoop"
  | "blob_organic"
  | "half_split_left"
  | "half_split_right"
  | "pointed_bottom"
  | "torn_paper";

export interface HeroMask {
  id: HeroMaskId;
  name: string;
  description: string;
  /** SVG clip-path definition */
  clipPath: string;
  /** Where text content sits relative to the masked image */
  textPosition: "overlay" | "left" | "right" | "below";
  /** Best with these hero styles */
  compatibleHeroStyles: HeroStyle[];
}

// ------------------------------------------------------------
// Colour Palette (generated from logo)
// ------------------------------------------------------------

export interface ExtractedColour {
  hex: string;
  rgb: { r: number; g: number; b: number };
  hsl: { h: number; s: number; l: number };
  percentage: number; // area percentage in logo
  name: string;       // human-friendly name e.g. "Navy Blue"
}

export interface ColourShade {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // base
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface GeneratedPalette {
  id: string;
  name: string;          // e.g. "Classic Navy", "Vibrant Mix", "Earth Tones"
  description: string;
  primary: ColourShade;
  secondary: ColourShade;
  accent: string;        // single highlight colour
  neutral: ColourShade;  // desaturated greys based on primary
  // Semantic colours (fixed, not derived from logo)
  success: string;
  warning: string;
  error: string;
  info: string;
  // Backgrounds
  background: string;
  backgroundAlt: string;
  surface: string;
  // Text
  textPrimary: string;
  textSecondary: string;
  textOnBrand: string;   // white or dark based on primary contrast
}

export interface PaletteOption {
  palette: GeneratedPalette;
  /** Preview: which extracted colours map to primary/secondary */
  sourceColours: {
    primary: ExtractedColour;
    secondary: ExtractedColour;
  };
}

// ------------------------------------------------------------
// Font System
// ------------------------------------------------------------

export interface FontOption {
  id: string;
  name: string;           // Display name e.g. "Nunito"
  googleFontsFamily: string; // Google Fonts family name
  category: HeadingFontCategory | BodyFontCategory;
  weights: number[];      // Available weights e.g. [400, 500, 600, 700]
  fallback: string;       // CSS fallback stack
  /** Preview text for the font picker */
  sampleText?: string;
}

export interface FontPairing {
  id: string;
  name: string;           // e.g. "Modern & Clean"
  description: string;
  heading: FontOption;
  body: FontOption;
  /** Which presets use this pairing by default */
  defaultForPresets: string[];
}

// ------------------------------------------------------------
// Style Preset (combines all layers)
// ------------------------------------------------------------

export type SchoolPhase = "primary" | "secondary" | "all_through" | "any";

export interface StylePreset {
  id: string;
  name: string;
  description: string;
  bestFor: string[];
  phase: SchoolPhase;

  layout: LayoutLayer;
  shape: ShapeLayer;
  colour: ColourLayer;
  typography: TypographyLayer;
  motion: MotionLayer;
  imagery: ImageryLayer;

  /** Default hero mask for this preset */
  defaultHeroMask: HeroMaskId;
  /** Default font pairing ID */
  defaultFontPairing: string;
  /** Suggested palette style - guides palette generation */
  paletteDirection: string;
}

// ------------------------------------------------------------
// School Website Configuration (what gets saved)
// ------------------------------------------------------------

export interface SchoolWebsiteConfig {
  id: string;
  organizationId: string;
  schoolName: string;
  schoolPhase: SchoolPhase;

  // Setup inputs
  logoUrl: string | null;
  heroImageUrl: string | null;
  heroVideoUrl: string | null;
  motto: string | null;

  // Selected preset (base)
  presetId: string;

  // Selected palette
  palette: GeneratedPalette;

  // Selected font pairing
  fontPairingId: string;

  // Selected hero mask
  heroMaskId: HeroMaskId;

  // Layer overrides (sparse — only what the school changed from the preset)
  overrides: Partial<{
    layout: Partial<LayoutLayer>;
    shape: Partial<ShapeLayer>;
    colour: Partial<ColourLayer>;
    typography: Partial<TypographyLayer>;
    motion: Partial<MotionLayer>;
    imagery: Partial<ImageryLayer>;
  }>;

  // Homepage section visibility
  homepageSections: {
    hero: boolean;
    welcome: boolean;
    quickLinks: boolean;
    latestNews: boolean;
    keyInformation: boolean;
    schoolValues: boolean;
    galleryHighlight: boolean;
    statistics: boolean;
    testimonials: boolean;
    socialFeed: boolean;
  };

  // Content sources
  importedFromUrl: string | null;
  importedAt: string | null;

  // Publishing
  isPublished: boolean;
  publishedAt: string | null;
  customDomain: string | null;
  subdomain: string | null; // {subdomain}.schoolgle.co.uk

  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// Setup Wizard State
// ------------------------------------------------------------

export type SetupStep =
  | "upload_logo"
  | "choose_palette"
  | "choose_preset"
  | "choose_font"
  | "choose_hero"
  | "preview";

export interface SetupWizardState {
  currentStep: SetupStep;
  logoFile: File | null;
  logoPreviewUrl: string | null;
  extractedColours: ExtractedColour[];
  paletteOptions: PaletteOption[];
  selectedPaletteIndex: number | null;
  selectedPresetId: string | null;
  selectedFontPairingId: string | null;
  selectedHeroMaskId: HeroMaskId | null;
  heroFile: File | null;
  heroPreviewUrl: string | null;
  motto: string;
  /** Live preview updates as user changes each option */
  isPreviewLive: boolean;
}
