// ============================================================
// School Website Builder — Content Block Types
// ============================================================
// Content blocks are the building units of website pages.
// Each page has an ordered array of blocks. The page editor
// renders them in order; the static generator converts them
// to HTML.
// ============================================================

// ------------------------------------------------------------
// Content Block Types
// ------------------------------------------------------------

export type ContentBlockType =
  | "hero"
  | "text"
  | "heading"
  | "image"
  | "gallery"
  | "video"
  | "two_column"
  | "three_column"
  | "card_grid"
  | "quick_links"
  | "contact_form"
  | "map"
  | "accordion"
  | "tabs"
  | "staff_list"
  | "governor_list"
  | "news_feed"
  | "events_list"
  | "policy_list"
  | "statistics"
  | "testimonials"
  | "cta_banner"
  | "divider"
  | "spacer"
  | "html"
  | "document_list"
  | "calendar_embed"
  | "values_grid";

// ------------------------------------------------------------
// Base block interface
// ------------------------------------------------------------

export interface ContentBlockBase {
  id: string;
  type: ContentBlockType;
  /** Optional label for the editor sidebar */
  label?: string;
  /** Visibility toggle */
  visible: boolean;
  /** Background variant */
  background?: "default" | "alt" | "brand" | "dark";
  /** Top/bottom padding size */
  padding?: "none" | "small" | "medium" | "large";
}

// ------------------------------------------------------------
// Individual block types
// ------------------------------------------------------------

export interface HeroBlock extends ContentBlockBase {
  type: "hero";
  title: string;
  subtitle?: string;
  imageUrl?: string;
  videoUrl?: string;
  overlayOpacity?: number;
  ctaText?: string;
  ctaUrl?: string;
  ctaSecondaryText?: string;
  ctaSecondaryUrl?: string;
}

export interface TextBlock extends ContentBlockBase {
  type: "text";
  /** Rich text as HTML string */
  html: string;
}

export interface HeadingBlock extends ContentBlockBase {
  type: "heading";
  text: string;
  level: 1 | 2 | 3 | 4;
  alignment?: "left" | "center" | "right";
}

export interface ImageBlock extends ContentBlockBase {
  type: "image";
  url: string;
  alt: string;
  caption?: string;
  width?: "contained" | "full" | "small";
  alignment?: "left" | "center" | "right";
}

export interface GalleryBlock extends ContentBlockBase {
  type: "gallery";
  images: Array<{
    url: string;
    alt: string;
    caption?: string;
  }>;
  columns?: 2 | 3 | 4;
  style?: "grid" | "masonry" | "carousel";
}

export interface VideoBlock extends ContentBlockBase {
  type: "video";
  url: string;
  title?: string;
  autoplay?: boolean;
  /** YouTube/Vimeo embed or hosted */
  provider?: "youtube" | "vimeo" | "hosted";
}

export interface TwoColumnBlock extends ContentBlockBase {
  type: "two_column";
  leftContent: ContentBlock[];
  rightContent: ContentBlock[];
  split?: "50_50" | "33_67" | "67_33" | "40_60" | "60_40";
}

export interface ThreeColumnBlock extends ContentBlockBase {
  type: "three_column";
  columns: [ContentBlock[], ContentBlock[], ContentBlock[]];
}

export interface CardGridBlock extends ContentBlockBase {
  type: "card_grid";
  cards: Array<{
    title: string;
    description: string;
    imageUrl?: string;
    linkUrl?: string;
    linkText?: string;
    icon?: string;
  }>;
  columns?: 2 | 3 | 4;
}

export interface QuickLinksBlock extends ContentBlockBase {
  type: "quick_links";
  links: Array<{
    label: string;
    url: string;
    icon?: string;
    description?: string;
    imageUrl?: string;
  }>;
  style?: "tiles" | "icons" | "buttons" | "cards";
}

export interface ContactFormBlock extends ContentBlockBase {
  type: "contact_form";
  title?: string;
  description?: string;
  fields: Array<{
    name: string;
    label: string;
    type: "text" | "email" | "tel" | "textarea" | "select";
    required: boolean;
    options?: string[]; // for select type
  }>;
  submitText?: string;
  recipientEmail?: string;
}

export interface MapBlock extends ContentBlockBase {
  type: "map";
  address: string;
  latitude?: number;
  longitude?: number;
  zoom?: number;
}

export interface AccordionBlock extends ContentBlockBase {
  type: "accordion";
  items: Array<{
    title: string;
    content: string; // HTML
  }>;
  allowMultiple?: boolean;
}

export interface TabsBlock extends ContentBlockBase {
  type: "tabs";
  tabs: Array<{
    label: string;
    content: string; // HTML
  }>;
}

export interface StaffListBlock extends ContentBlockBase {
  type: "staff_list";
  /** Auto-populated from staff directory, or manual entries */
  source: "auto" | "manual";
  showPhotos?: boolean;
  showRoles?: boolean;
  showEmail?: boolean;
  manualEntries?: Array<{
    name: string;
    role: string;
    photoUrl?: string;
    email?: string;
    bio?: string;
  }>;
  filterByRole?: string[];
}

export interface GovernorListBlock extends ContentBlockBase {
  type: "governor_list";
  source: "auto" | "manual";
  showCategory?: boolean;
  showTermDates?: boolean;
  manualEntries?: Array<{
    name: string;
    category: string;
    role?: string;
    appointedDate?: string;
    termEnd?: string;
  }>;
}

export interface NewsFeedBlock extends ContentBlockBase {
  type: "news_feed";
  count?: number;
  showExcerpt?: boolean;
  showImage?: boolean;
  category?: string;
}

export interface EventsListBlock extends ContentBlockBase {
  type: "events_list";
  count?: number;
  showPast?: boolean;
}

export interface PolicyListBlock extends ContentBlockBase {
  type: "policy_list";
  /** Auto-populated from compliance module */
  source: "auto" | "manual";
  categories?: string[];
  manualPolicies?: Array<{
    name: string;
    documentUrl: string;
    category: string;
    reviewDate?: string;
  }>;
}

export interface StatisticsBlock extends ContentBlockBase {
  type: "statistics";
  stats: Array<{
    value: string;
    label: string;
    icon?: string;
    suffix?: string;
  }>;
  animate?: boolean;
}

export interface TestimonialsBlock extends ContentBlockBase {
  type: "testimonials";
  testimonials: Array<{
    quote: string;
    author: string;
    role?: string;
    photoUrl?: string;
  }>;
  style?: "cards" | "carousel" | "simple";
}

export interface CtaBannerBlock extends ContentBlockBase {
  type: "cta_banner";
  title: string;
  description?: string;
  buttonText: string;
  buttonUrl: string;
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
  backgroundColour?: "brand" | "dark" | "gradient";
}

export interface DividerBlock extends ContentBlockBase {
  type: "divider";
  style?: "line" | "dots" | "wave" | "none";
}

export interface SpacerBlock extends ContentBlockBase {
  type: "spacer";
  height?: "small" | "medium" | "large";
}

export interface HtmlBlock extends ContentBlockBase {
  type: "html";
  code: string;
}

export interface DocumentListBlock extends ContentBlockBase {
  type: "document_list";
  documents: Array<{
    name: string;
    url: string;
    fileType?: string;
    fileSize?: string;
    category?: string;
  }>;
  groupByCategory?: boolean;
}

export interface CalendarEmbedBlock extends ContentBlockBase {
  type: "calendar_embed";
  calendarUrl?: string;
  source?: "google" | "outlook" | "platform";
}

export interface ValuesGridBlock extends ContentBlockBase {
  type: "values_grid";
  values: Array<{
    title: string;
    description: string;
    icon?: string;
    imageUrl?: string;
  }>;
  style?: "cards" | "icons" | "images";
}

// ------------------------------------------------------------
// Union type
// ------------------------------------------------------------

export type ContentBlock =
  | HeroBlock
  | TextBlock
  | HeadingBlock
  | ImageBlock
  | GalleryBlock
  | VideoBlock
  | TwoColumnBlock
  | ThreeColumnBlock
  | CardGridBlock
  | QuickLinksBlock
  | ContactFormBlock
  | MapBlock
  | AccordionBlock
  | TabsBlock
  | StaffListBlock
  | GovernorListBlock
  | NewsFeedBlock
  | EventsListBlock
  | PolicyListBlock
  | StatisticsBlock
  | TestimonialsBlock
  | CtaBannerBlock
  | DividerBlock
  | SpacerBlock
  | HtmlBlock
  | DocumentListBlock
  | CalendarEmbedBlock
  | ValuesGridBlock;

// ------------------------------------------------------------
// Page types
// ------------------------------------------------------------

export type PageType =
  | "home"
  | "content"
  | "news_index"
  | "news_article"
  | "events"
  | "gallery"
  | "contact"
  | "policies"
  | "staff"
  | "governors"
  | "curriculum"
  | "admissions"
  | "send"
  | "pupil_premium"
  | "sports_premium"
  | "values"
  | "custom";

export type PageStatus = "draft" | "published" | "archived";
export type WebsiteStatus = "draft" | "setup" | "building" | "published" | "archived";

export interface WebsitePage {
  id: string;
  websiteId: string;
  organizationId: string;
  title: string;
  slug: string;
  pageType: PageType;
  parentId: string | null;
  sortOrder: number;
  contentBlocks: ContentBlock[];
  heroImageUrl: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  showBreadcrumbs: boolean;
  showSidebar: boolean;
  sidebarContent: ContentBlock[];
  seoTitle: string | null;
  seoDescription: string | null;
  seoImageUrl: string | null;
  noIndex: boolean;
  status: PageStatus;
  publishedAt: string | null;
  template: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebsitePost {
  id: string;
  websiteId: string;
  organizationId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentBlocks: ContentBlock[];
  featuredImageUrl: string | null;
  category: string;
  tags: string[];
  authorName: string | null;
  status: PageStatus;
  publishedAt: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NavigationItem {
  id: string;
  websiteId: string;
  menuLocation: "main" | "footer" | "quick_links" | "utility";
  label: string;
  url: string | null;
  pageId: string | null;
  parentId: string | null;
  sortOrder: number;
  openInNewTab: boolean;
  icon: string | null;
  children?: NavigationItem[];
}

export interface MediaItem {
  id: string;
  websiteId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number | null;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  folder: string;
  createdAt: string;
}

// ------------------------------------------------------------
// Website config (extends base types)
// ------------------------------------------------------------

export interface SchoolWebsite {
  id: string;
  organizationId: string;
  schoolName: string;
  schoolPhase: "primary" | "secondary" | "all_through" | "any";
  logoUrl: string | null;
  faviconUrl: string | null;
  heroImageUrl: string | null;
  heroVideoUrl: string | null;
  motto: string | null;
  presetId: string;
  palette: Record<string, unknown>;
  fontPairingId: string;
  heroMaskId: string;
  layoutOverrides: Record<string, unknown>;
  shapeOverrides: Record<string, unknown>;
  colourOverrides: Record<string, unknown>;
  typographyOverrides: Record<string, unknown>;
  motionOverrides: Record<string, unknown>;
  imageryOverrides: Record<string, unknown>;
  homepageSections: Record<string, boolean>;
  importedFromUrl: string | null;
  importedAt: string | null;
  status: WebsiteStatus;
  subdomain: string | null;
  customDomain: string | null;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoImageUrl: string | null;
  googleAnalyticsId: string | null;
  cookieConsentEnabled: boolean;
  socialLinks: Record<string, string>;
  contactEmail: string | null;
  contactPhone: string | null;
  address: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------
// Default page templates
// ------------------------------------------------------------

export const DEFAULT_PAGES: Array<{
  title: string;
  slug: string;
  pageType: PageType;
  sortOrder: number;
  children?: Array<{ title: string; slug: string; pageType: PageType; sortOrder: number }>;
}> = [
  { title: "Home", slug: "/", pageType: "home", sortOrder: 0 },
  {
    title: "About Us",
    slug: "about",
    pageType: "content",
    sortOrder: 1,
    children: [
      { title: "Our Values", slug: "about/values", pageType: "values", sortOrder: 0 },
      { title: "Staff", slug: "about/staff", pageType: "staff", sortOrder: 1 },
      { title: "Governors", slug: "about/governors", pageType: "governors", sortOrder: 2 },
    ],
  },
  {
    title: "Curriculum",
    slug: "curriculum",
    pageType: "curriculum",
    sortOrder: 2,
    children: [
      { title: "SEND", slug: "curriculum/send", pageType: "send", sortOrder: 0 },
      { title: "Pupil Premium", slug: "curriculum/pupil-premium", pageType: "pupil_premium", sortOrder: 1 },
      { title: "Sports Premium", slug: "curriculum/sports-premium", pageType: "sports_premium", sortOrder: 2 },
    ],
  },
  { title: "Admissions", slug: "admissions", pageType: "admissions", sortOrder: 3 },
  { title: "News", slug: "news", pageType: "news_index", sortOrder: 4 },
  {
    title: "Parents",
    slug: "parents",
    pageType: "content",
    sortOrder: 5,
    children: [
      { title: "Policies", slug: "parents/policies", pageType: "policies", sortOrder: 0 },
      { title: "Calendar", slug: "parents/calendar", pageType: "content", sortOrder: 1 },
    ],
  },
  { title: "Gallery", slug: "gallery", pageType: "gallery", sortOrder: 6 },
  { title: "Contact", slug: "contact", pageType: "contact", sortOrder: 7 },
];

// ------------------------------------------------------------
// Helper: create a blank content block
// ------------------------------------------------------------

let blockIdCounter = 0;

export function createBlockId(): string {
  return `block-${Date.now()}-${++blockIdCounter}`;
}

export function createTextBlock(html: string = ""): TextBlock {
  return { id: createBlockId(), type: "text", visible: true, html };
}

export function createHeadingBlock(text: string, level: 1 | 2 | 3 | 4 = 2): HeadingBlock {
  return { id: createBlockId(), type: "heading", visible: true, text, level };
}

export function createImageBlock(url: string = "", alt: string = ""): ImageBlock {
  return { id: createBlockId(), type: "image", visible: true, url, alt };
}

export function createHeroBlock(title: string = ""): HeroBlock {
  return { id: createBlockId(), type: "hero", visible: true, title };
}
