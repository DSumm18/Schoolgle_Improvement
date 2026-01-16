"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import SchoolgleAnimatedLogo from "@/components/SchoolgleAnimatedLogo";
import { ThemeToggle } from "@/components/effects/ThemeToggle";

export interface NavbarProps {
  variant?: "transparent" | "glass";
}

/**
 * Navbar - Unified navigation for all customer-facing pages
 *
 * Dark glassmorphism nav with orbit logo, navigation links, and CTA.
 *
 * @example
 * <Navbar />
 *
 * @example
 * <Navbar variant="transparent" />
 */
export function Navbar({ variant = "glass" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/insights", label: "Insights" },
    { href: "/toolbox", label: "Toolbox" },
  ];

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 h-20",
        variant === "glass" && "bg-brand-glass-bg backdrop-blur-xl border-b border-brand-border"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <SchoolgleAnimatedLogo size={180} showText={false} />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-brand-text-sec hover:text-brand-text transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right Side: Theme Toggle + CTA + Mobile Menu Button */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          {/* Desktop CTA */}
          <Link
            href="#early-access"
            className="hidden md:inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-brand-accent text-brand-text text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
          >
            Early Access
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-brand-bg-sec transition-colors text-brand-text"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-brand-bg border-b border-brand-border p-6">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-brand-text-sec hover:text-brand-text transition-colors py-2"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="#early-access"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center w-full px-6 py-3 rounded-xl bg-brand-accent text-brand-text text-xs font-black uppercase tracking-wider"
            >
              Early Access
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
