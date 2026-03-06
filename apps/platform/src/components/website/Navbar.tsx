"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronDown,
  Users,
  PoundSterling,
  Building2,
  Shield,
  BookOpen,
  Heart,
  Gavel,
  TrendingUp,
  FlaskConical,
  Mail,
  Wrench,
} from "lucide-react";
import ThemeToggle from "@/components/effects/ThemeToggle";
import SchoolgleAnimatedLogo from "@/components/SchoolgleAnimatedLogo";

const modules = [
  {
    name: "HR & People",
    desc: "Staff reviews, objectives, absence tracking",
    href: "/modules/hr",
    icon: Users,
    color: "#ADD8E6",
  },
  {
    name: "Finance & Business",
    desc: "Budgets, invoices, forecasting",
    href: "/modules/finance",
    icon: PoundSterling,
    color: "#FFAA4C",
  },
  {
    name: "Estates & Facilities",
    desc: "Compliance checks, maintenance logs",
    href: "/modules/estates",
    icon: Building2,
    color: "#00D4D4",
  },
  {
    name: "Compliance & Safety",
    desc: "Statutory checks, risk assessments",
    href: "/modules/compliance",
    icon: Shield,
    color: "#E6C3FF",
  },
  {
    name: "Teaching & Learning",
    desc: "Lesson planning, curriculum, CPD",
    href: "/modules/teaching",
    icon: BookOpen,
    color: "#FFB6C1",
  },
  {
    name: "SEND & Inclusion",
    desc: "IEPs, scaffolds, evidence tracking",
    href: "/modules/send",
    icon: Heart,
    color: "#98FF98",
  },
  {
    name: "Governance & Trust",
    desc: "Board reports, MAT oversight, minutes",
    href: "/modules/governance",
    icon: Gavel,
    color: "#FFD700",
  },
  {
    name: "School Improvement",
    desc: "SEF, action plans, evidence mapping",
    href: "/modules/improvement",
    icon: TrendingUp,
    color: "#0ea5e9",
  },
];

const insightsLinks = [
  {
    name: "Research",
    desc: "Evidence-backed articles on school operations",
    href: "/insights",
    icon: FlaskConical,
    color: "#0ea5e9",
  },
  {
    name: "The Schoolgle Signal",
    desc: "Weekly intelligence — what the research means for your school",
    href: "/insights/newsletter",
    icon: Mail,
    color: "#FFAA4C",
  },
];

// A reusable dropdown component
function NavDropdown({
  label,
  items,
  footer,
  width = "w-[340px]",
  columns = 1,
}: {
  label: string;
  items: {
    name: string;
    desc: string;
    href: string;
    icon: React.ElementType;
    color: string;
  }[];
  footer?: { label: string; href: string };
  width?: string;
  columns?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
      }}
      onMouseLeave={() => {
        timeoutRef.current = setTimeout(() => setIsOpen(false), 200);
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
          isOpen
            ? "text-foreground bg-muted/50"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
      >
        {label}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 ${width} p-3 rounded-2xl bg-card border border-border shadow-2xl shadow-black/10 backdrop-blur-xl`}
          >
            <div
              className={`grid gap-1 ${columns === 2 ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="group flex items-start gap-3 p-3 rounded-xl hover:bg-foreground/[0.04] transition-colors"
                >
                  <div
                    className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <item.icon size={16} style={{ color: item.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {item.name}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {footer && (
              <div className="mt-2 pt-2 border-t border-border">
                <Link
                  href={footer.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-center text-xs font-bold text-primary hover:text-primary/80 py-2 transition-colors"
                >
                  {footer.label}
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Mobile accordion
function MobileAccordion({
  label,
  items,
  onClose,
}: {
  label: string;
  items: {
    name: string;
    href: string;
    color: string;
  }[];
  onClose: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-base font-bold text-muted-foreground hover:text-foreground transition-colors py-2"
      >
        {label}
        <ChevronDown
          size={16}
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-2 pb-2 space-y-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    setIsOpen(false);
                    onClose();
                  }}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-foreground/[0.04] transition-colors"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-semibold text-foreground/80">
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group transition-transform hover:scale-105 active:scale-95"
        >
          <SchoolgleAnimatedLogo
            size={48}
            showText={false}
            className="flex-shrink-0"
          />
          <span className="text-xl font-black tracking-tight text-foreground hidden sm:block">
            Schoolgle
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1 mx-8 flex-1 justify-center">
          {/* Modules dropdown */}
          <NavDropdown
            label="Modules"
            items={modules}
            columns={2}
            width="w-[540px]"
            footer={{
              label: "See the full platform overview",
              href: "/#preview",
            }}
          />

          {/* Insights dropdown */}
          <NavDropdown
            label="Insights"
            items={insightsLinks}
            width="w-[360px]"
          />

          {/* Standalone links */}
          <Link
            href="/#meet-ed"
            className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all rounded-lg hover:bg-muted/50"
          >
            Meet Ed
          </Link>
          <Link
            href="/toolbox"
            className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-all rounded-lg hover:bg-muted/50"
          >
            Toolbox
          </Link>
        </div>

        {/* Right-side Actions (Desktop) */}
        <div className="hidden lg:flex items-center gap-4">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="#early-access"
            className="px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-primary-foreground bg-primary rounded-full hover:brightness-110 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            Request Access
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="flex lg:hidden items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-foreground hover:bg-muted/50 rounded-xl transition-colors"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden border-t border-border bg-background overflow-hidden"
          >
            <div className="px-6 py-6 space-y-2">
              {/* Mobile Modules accordion */}
              <MobileAccordion
                label="Modules"
                items={modules}
                onClose={() => setIsMobileMenuOpen(false)}
              />

              {/* Mobile Insights accordion */}
              <MobileAccordion
                label="Insights"
                items={insightsLinks}
                onClose={() => setIsMobileMenuOpen(false)}
              />

              {/* Standalone links */}
              <Link
                href="/#meet-ed"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-base font-bold text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Meet Ed
              </Link>
              <Link
                href="/toolbox"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-base font-bold text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Toolbox
              </Link>

              <div className="pt-4 border-t border-border space-y-3">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-center text-base font-bold text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Link>
                <Link
                  href="#early-access"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold uppercase tracking-widest text-sm shadow-lg shadow-primary/20"
                >
                  Request Access
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
