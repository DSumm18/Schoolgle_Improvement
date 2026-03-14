"use client";

import { useState, useCallback } from "react";
import {
  Plus,
  GripVertical,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Type,
  Image as ImageIcon,
  LayoutGrid,
  FileText,
  MessageSquare,
  BarChart3,
  Link2,
  Video,
  List,
  Columns,
  Quote,
  Heart,
  Save,
  ArrowLeft,
} from "lucide-react";
import type {
  ContentBlock,
  ContentBlockType,
  WebsitePage,
  TextBlock,
  HeadingBlock,
  ImageBlock,
  CardGridBlock,
  QuickLinksBlock,
  StatisticsBlock,
  AccordionBlock,
  CtaBannerBlock,
  HeroBlock,
  GalleryBlock,
} from "@/lib/website-builder/content-types";
import { createBlockId } from "@/lib/website-builder/content-types";

// ------------------------------------------------------------
// Block palette — what blocks can be added
// ------------------------------------------------------------

const BLOCK_PALETTE: Array<{
  type: ContentBlockType;
  label: string;
  icon: typeof Type;
  description: string;
}> = [
  { type: "hero", label: "Hero Banner", icon: ImageIcon, description: "Full-width hero with image and CTA" },
  { type: "text", label: "Text", icon: FileText, description: "Rich text content" },
  { type: "heading", label: "Heading", icon: Type, description: "Section heading" },
  { type: "image", label: "Image", icon: ImageIcon, description: "Single image with caption" },
  { type: "gallery", label: "Gallery", icon: LayoutGrid, description: "Image gallery grid" },
  { type: "video", label: "Video", icon: Video, description: "YouTube or uploaded video" },
  { type: "two_column", label: "Two Columns", icon: Columns, description: "Side-by-side content" },
  { type: "card_grid", label: "Card Grid", icon: LayoutGrid, description: "Grid of info cards" },
  { type: "quick_links", label: "Quick Links", icon: Link2, description: "Navigation tiles" },
  { type: "statistics", label: "Statistics", icon: BarChart3, description: "Key numbers with labels" },
  { type: "accordion", label: "Accordion", icon: List, description: "Collapsible FAQ sections" },
  { type: "testimonials", label: "Testimonials", icon: Quote, description: "Quotes from parents/staff" },
  { type: "cta_banner", label: "CTA Banner", icon: MessageSquare, description: "Call to action section" },
  { type: "contact_form", label: "Contact Form", icon: MessageSquare, description: "Enquiry form" },
  { type: "staff_list", label: "Staff List", icon: List, description: "Staff directory grid" },
  { type: "news_feed", label: "Latest News", icon: FileText, description: "Recent news articles" },
  { type: "policy_list", label: "Policy List", icon: FileText, description: "Downloadable policies" },
  { type: "document_list", label: "Documents", icon: FileText, description: "File download list" },
  { type: "values_grid", label: "Values Grid", icon: Heart, description: "School values display" },
  { type: "divider", label: "Divider", icon: List, description: "Visual separator" },
  { type: "spacer", label: "Spacer", icon: List, description: "Vertical space" },
];

// ------------------------------------------------------------
// Props
// ------------------------------------------------------------

interface PageEditorProps {
  page: WebsitePage;
  onSave: (blocks: ContentBlock[]) => void;
  onBack: () => void;
  isSaving?: boolean;
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function PageEditor({ page, onSave, onBack, isSaving }: PageEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(page.contentBlocks || []);
  const [showPalette, setShowPalette] = useState(false);
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);

  const addBlock = useCallback((type: ContentBlockType) => {
    const newBlock = createEmptyBlock(type);
    setBlocks((prev) => [...prev, newBlock]);
    setExpandedBlockId(newBlock.id);
    setShowPalette(false);
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<ContentBlock>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } as ContentBlock : b))
    );
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const moveBlock = useCallback((id: string, direction: "up" | "down") => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === id);
      if (index === -1) return prev;
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
    });
  }, []);

  const toggleVisibility = useCallback((id: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, visible: !b.visible } as ContentBlock : b))
    );
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{page.title}</h1>
            <p className="text-sm text-gray-500">/{page.slug}</p>
          </div>
        </div>
        <button
          onClick={() => onSave(blocks)}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-fuchsia-500 text-white rounded-lg hover:bg-fuchsia-600 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {isSaving ? "Saving..." : "Save Page"}
        </button>
      </div>

      {/* Blocks */}
      <div className="space-y-3">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className={`border rounded-xl transition-all ${
              block.visible ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"
            } ${expandedBlockId === block.id ? "ring-2 ring-fuchsia-200" : ""}`}
          >
            {/* Block header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
              <span className="text-sm font-medium text-gray-700 capitalize flex-1">
                {block.type.replace(/_/g, " ")}
                {block.label ? ` — ${block.label}` : ""}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveBlock(block.id, "up")}
                  disabled={index === 0}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveBlock(block.id, "down")}
                  disabled={index === blocks.length - 1}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleVisibility(block.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {block.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setExpandedBlockId(expandedBlockId === block.id ? null : block.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedBlockId === block.id ? "rotate-180" : ""}`} />
                </button>
                <button
                  onClick={() => removeBlock(block.id)}
                  className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Block editor (expanded) */}
            {expandedBlockId === block.id && (
              <div className="p-4">
                <BlockEditor block={block} onUpdate={(updates) => updateBlock(block.id, updates)} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add block button */}
      <div className="mt-4">
        <button
          onClick={() => setShowPalette(!showPalette)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-fuchsia-400 hover:text-fuchsia-600 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Content Block
        </button>

        {showPalette && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 p-4 bg-white border border-gray-200 rounded-xl shadow-lg">
            {BLOCK_PALETTE.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  onClick={() => addBlock(item.type)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-fuchsia-50 text-left transition-colors"
                >
                  <Icon className="w-5 h-5 text-fuchsia-500 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-gray-400">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Block Editor — renders the appropriate editor for each block type
// ============================================================

function BlockEditor({
  block,
  onUpdate,
}: {
  block: ContentBlock;
  onUpdate: (updates: Partial<ContentBlock>) => void;
}) {
  switch (block.type) {
    case "hero":
      return <HeroEditor block={block} onUpdate={onUpdate} />;
    case "text":
      return <TextEditor block={block as TextBlock} onUpdate={onUpdate} />;
    case "heading":
      return <HeadingEditor block={block as HeadingBlock} onUpdate={onUpdate} />;
    case "image":
      return <ImageEditor block={block as ImageBlock} onUpdate={onUpdate} />;
    case "card_grid":
      return <CardGridEditor block={block as CardGridBlock} onUpdate={onUpdate} />;
    case "statistics":
      return <StatisticsEditor block={block as StatisticsBlock} onUpdate={onUpdate} />;
    case "accordion":
      return <AccordionEditor block={block as AccordionBlock} onUpdate={onUpdate} />;
    case "cta_banner":
      return <CtaBannerEditor block={block as CtaBannerBlock} onUpdate={onUpdate} />;
    default:
      return (
        <div className="text-sm text-gray-500">
          Editor for &quot;{block.type.replace(/_/g, " ")}&quot; blocks. Configure in the JSON view or the visual editor.
        </div>
      );
  }
}

// --- Individual editors ---

function HeroEditor({ block, onUpdate }: { block: HeroBlock; onUpdate: (u: Partial<HeroBlock>) => void }) {
  return (
    <div className="space-y-4">
      <Field label="Title" value={block.title} onChange={(v) => onUpdate({ title: v })} />
      <Field label="Subtitle" value={block.subtitle || ""} onChange={(v) => onUpdate({ subtitle: v })} />
      <Field label="Image URL" value={block.imageUrl || ""} onChange={(v) => onUpdate({ imageUrl: v })} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="CTA Button Text" value={block.ctaText || ""} onChange={(v) => onUpdate({ ctaText: v })} />
        <Field label="CTA Button URL" value={block.ctaUrl || ""} onChange={(v) => onUpdate({ ctaUrl: v })} />
      </div>
    </div>
  );
}

function TextEditor({ block, onUpdate }: { block: TextBlock; onUpdate: (u: Partial<TextBlock>) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML)</label>
      <textarea
        value={block.html}
        onChange={(e) => onUpdate({ html: e.target.value })}
        rows={6}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400 outline-none"
      />
    </div>
  );
}

function HeadingEditor({ block, onUpdate }: { block: HeadingBlock; onUpdate: (u: Partial<HeadingBlock>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Heading text" value={block.text} onChange={(v) => onUpdate({ text: v })} />
      <div className="flex gap-2">
        {([1, 2, 3, 4] as const).map((lvl) => (
          <button
            key={lvl}
            onClick={() => onUpdate({ level: lvl })}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              block.level === lvl ? "bg-fuchsia-100 text-fuchsia-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            H{lvl}
          </button>
        ))}
      </div>
    </div>
  );
}

function ImageEditor({ block, onUpdate }: { block: ImageBlock; onUpdate: (u: Partial<ImageBlock>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Image URL" value={block.url} onChange={(v) => onUpdate({ url: v })} />
      <Field label="Alt text" value={block.alt} onChange={(v) => onUpdate({ alt: v })} />
      <Field label="Caption (optional)" value={block.caption || ""} onChange={(v) => onUpdate({ caption: v })} />
    </div>
  );
}

function CardGridEditor({ block, onUpdate }: { block: CardGridBlock; onUpdate: (u: Partial<CardGridBlock>) => void }) {
  const cards = block.cards || [];
  return (
    <div className="space-y-4">
      {cards.map((card, i) => (
        <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Card {i + 1}</span>
            <button
              onClick={() => onUpdate({ cards: cards.filter((_, j) => j !== i) })}
              className="text-red-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <Field label="Title" value={card.title} onChange={(v) => {
            const updated = [...cards];
            updated[i] = { ...card, title: v };
            onUpdate({ cards: updated });
          }} />
          <Field label="Description" value={card.description} onChange={(v) => {
            const updated = [...cards];
            updated[i] = { ...card, description: v };
            onUpdate({ cards: updated });
          }} />
        </div>
      ))}
      <button
        onClick={() => onUpdate({ cards: [...cards, { title: "", description: "" }] })}
        className="text-sm text-fuchsia-600 hover:text-fuchsia-700 font-medium"
      >
        + Add Card
      </button>
    </div>
  );
}

function StatisticsEditor({ block, onUpdate }: { block: StatisticsBlock; onUpdate: (u: Partial<StatisticsBlock>) => void }) {
  const stats = block.stats || [];
  return (
    <div className="space-y-3">
      {stats.map((stat, i) => (
        <div key={i} className="flex gap-2 items-end">
          <div className="flex-1">
            <Field label="Value" value={stat.value} onChange={(v) => {
              const updated = [...stats];
              updated[i] = { ...stat, value: v };
              onUpdate({ stats: updated });
            }} />
          </div>
          <div className="flex-1">
            <Field label="Label" value={stat.label} onChange={(v) => {
              const updated = [...stats];
              updated[i] = { ...stat, label: v };
              onUpdate({ stats: updated });
            }} />
          </div>
          <button onClick={() => onUpdate({ stats: stats.filter((_, j) => j !== i) })} className="text-red-400 mb-1">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button onClick={() => onUpdate({ stats: [...stats, { value: "", label: "" }] })} className="text-sm text-fuchsia-600 font-medium">
        + Add Statistic
      </button>
    </div>
  );
}

function AccordionEditor({ block, onUpdate }: { block: AccordionBlock; onUpdate: (u: Partial<AccordionBlock>) => void }) {
  const items = block.items || [];
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="p-3 bg-gray-50 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Item {i + 1}</span>
            <button onClick={() => onUpdate({ items: items.filter((_, j) => j !== i) })} className="text-red-400">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <Field label="Title" value={item.title} onChange={(v) => {
            const updated = [...items];
            updated[i] = { ...item, title: v };
            onUpdate({ items: updated });
          }} />
          <div>
            <label className="block text-sm text-gray-600 mb-1">Content</label>
            <textarea
              value={item.content}
              onChange={(e) => {
                const updated = [...items];
                updated[i] = { ...item, content: e.target.value };
                onUpdate({ items: updated });
              }}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fuchsia-200 outline-none"
            />
          </div>
        </div>
      ))}
      <button onClick={() => onUpdate({ items: [...items, { title: "", content: "" }] })} className="text-sm text-fuchsia-600 font-medium">
        + Add Item
      </button>
    </div>
  );
}

function CtaBannerEditor({ block, onUpdate }: { block: CtaBannerBlock; onUpdate: (u: Partial<CtaBannerBlock>) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Title" value={block.title} onChange={(v) => onUpdate({ title: v })} />
      <Field label="Description" value={block.description || ""} onChange={(v) => onUpdate({ description: v })} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Button Text" value={block.buttonText} onChange={(v) => onUpdate({ buttonText: v })} />
        <Field label="Button URL" value={block.buttonUrl} onChange={(v) => onUpdate({ buttonUrl: v })} />
      </div>
    </div>
  );
}

// --- Shared field component ---

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fuchsia-200 focus:border-fuchsia-400 outline-none"
      />
    </div>
  );
}

// --- Block factory ---

function createEmptyBlock(type: ContentBlockType): ContentBlock {
  const base = { id: createBlockId(), visible: true };

  switch (type) {
    case "hero":
      return { ...base, type: "hero", title: "Welcome to Our School" };
    case "text":
      return { ...base, type: "text", html: "<p>Enter your content here...</p>" };
    case "heading":
      return { ...base, type: "heading", text: "Section Heading", level: 2 };
    case "image":
      return { ...base, type: "image", url: "", alt: "" };
    case "gallery":
      return { ...base, type: "gallery", images: [] };
    case "video":
      return { ...base, type: "video", url: "" };
    case "two_column":
      return { ...base, type: "two_column", leftContent: [], rightContent: [] };
    case "three_column":
      return { ...base, type: "three_column", columns: [[], [], []] };
    case "card_grid":
      return { ...base, type: "card_grid", cards: [{ title: "Card 1", description: "Description" }] };
    case "quick_links":
      return { ...base, type: "quick_links", links: [{ label: "Link 1", url: "#" }] };
    case "contact_form":
      return {
        ...base,
        type: "contact_form",
        title: "Contact Us",
        fields: [
          { name: "name", label: "Name", type: "text", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "message", label: "Message", type: "textarea", required: true },
        ],
      };
    case "map":
      return { ...base, type: "map", address: "" };
    case "accordion":
      return { ...base, type: "accordion", items: [{ title: "Question", content: "Answer" }] };
    case "tabs":
      return { ...base, type: "tabs", tabs: [{ label: "Tab 1", content: "Content" }] };
    case "staff_list":
      return { ...base, type: "staff_list", source: "manual", showPhotos: true, showRoles: true, manualEntries: [] };
    case "governor_list":
      return { ...base, type: "governor_list", source: "manual", showCategory: true, manualEntries: [] };
    case "news_feed":
      return { ...base, type: "news_feed", count: 5, showExcerpt: true, showImage: true };
    case "events_list":
      return { ...base, type: "events_list", count: 5 };
    case "policy_list":
      return { ...base, type: "policy_list", source: "manual", manualPolicies: [] };
    case "statistics":
      return { ...base, type: "statistics", stats: [{ value: "100", label: "Stat" }], animate: true };
    case "testimonials":
      return { ...base, type: "testimonials", testimonials: [{ quote: "A great school!", author: "Parent" }] };
    case "cta_banner":
      return { ...base, type: "cta_banner", title: "Get in Touch", buttonText: "Contact Us", buttonUrl: "/contact" };
    case "divider":
      return { ...base, type: "divider", style: "line" };
    case "spacer":
      return { ...base, type: "spacer", height: "medium" };
    case "html":
      return { ...base, type: "html", code: "" };
    case "document_list":
      return { ...base, type: "document_list", documents: [] };
    case "calendar_embed":
      return { ...base, type: "calendar_embed" };
    case "values_grid":
      return { ...base, type: "values_grid", values: [{ title: "Respect", description: "We respect everyone" }] };
    default:
      return { ...base, type: "text", html: "" } as ContentBlock;
  }
}
