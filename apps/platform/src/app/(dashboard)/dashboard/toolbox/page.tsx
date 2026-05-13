"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Building2,
  CheckCircle2,
  Database,
  Filter,
  Globe,
  LayoutGrid,
  PoundSterling,
  Search,
  Shield,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  TOOLBOX_CATEGORIES,
  TOOLBOX_ITEMS,
  filterToolboxItems,
  getToolboxStats,
  type ToolboxCategory,
  type ToolboxIconKey,
  type ToolboxItem,
} from "@/lib/toolbox/catalog";

const ICONS: Record<ToolboxIconKey, LucideIcon> = {
  book: BookOpen,
  boxes: Boxes,
  building: Building2,
  database: Database,
  globe: Globe,
  pound: PoundSterling,
  shield: Shield,
  sparkles: Sparkles,
  users: Users,
};

export default function DashboardToolboxPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ToolboxCategory>("All");
  const stats = getToolboxStats(TOOLBOX_ITEMS);

  const filteredApps = useMemo(() => {
    return filterToolboxItems({ category, query });
  }, [query, category]);

  return (
    <div className="min-h-screen p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary mb-2">
            <Boxes className="w-4 h-4" />
            Toolbox
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground">
            Schoolgle Toolbox
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-2">
            A practical app-store style library for mini apps, customer-inspired
            ideas and curated school resources that solve one job well.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 min-w-full lg:min-w-[420px]">
          <MiniStat label="Mini apps" value={stats.miniApps} />
          <MiniStat label="Resources" value={stats.resources} />
          <MiniStat label="Ideas" value={stats.ideas} />
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search mini apps..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            {TOOLBOX_CATEGORIES.map((item) => (
              <Button
                key={item}
                type="button"
                variant={category === item ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(item)}
                className="shrink-0"
              >
                {item}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredApps.map((app) => (
          <ToolboxAppCard key={app.id} app={app} />
        ))}
      </div>

      {filteredApps.length === 0 && (
        <Card>
          <CardContent className="p-10 text-center">
            <Search className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <h2 className="font-bold text-lg">No tools found</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Try another search or clear the type filter.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ToolboxAppCard({ app }: { app: ToolboxItem }) {
  const Icon = ICONS[app.icon];
  const isLive = app.status === "Live";
  const isExternal = app.source === "external";

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="p-5 space-y-5">
          <div className="flex items-start gap-4">
            <div
              className={`h-14 w-14 rounded-xl bg-gradient-to-br ${app.accent} flex items-center justify-center shadow-sm`}
            >
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-lg text-foreground">{app.name}</h2>
                <Badge variant={isLive ? "default" : "secondary"}>
                  {app.status}
                </Badge>
              </div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mt-1">
                {app.category} · {app.source.replace("-", " ")}
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed min-h-16">
            {app.description}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {app.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t p-4 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isLive ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <LayoutGrid className="w-4 h-4 text-amber-600" />
            )}
            {isLive ? "Subscriber mini app" : app.status}
          </div>
          <Button asChild size="sm" variant={isLive ? "default" : "outline"}>
            {isExternal ? (
              <a href={app.href} target="_blank" rel="noreferrer">
                {app.cta}
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            ) : (
              <Link href={app.href}>
                {app.cta}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-2xl font-black">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
