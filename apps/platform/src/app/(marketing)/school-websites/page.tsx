"use client";

import Link from "next/link";
import {
  Globe,
  Palette,
  ShieldCheck,
  Rocket,
  Smartphone,
  Zap,
  Upload,
  Eye,
  Check,
  Star,
  ArrowRight,
  Sparkles,
  Layout,
  Type,
  Image as ImageIcon,
  Search,
  Lock,
  Clock,
  PoundSterling,
} from "lucide-react";

export default function SchoolWebsitesLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered School Website Builder
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              A beautiful school website, built from your{" "}
              <span className="text-fuchsia-200">logo</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl">
              Upload your school logo. We extract your brand colours, generate a design system, and
              build a fully compliant website — all in under 5 minutes. No design skills needed.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/auth/register?plan=website"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-fuchsia-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-colors"
              >
                <Rocket className="w-5 h-5" />
                Start Building Free
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white rounded-xl font-medium text-lg hover:bg-white/10 transition-colors"
              >
                See How It Works
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-b border-gray-100 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-gray-400 text-sm">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />
            ))}
            <span className="ml-2 text-gray-600 font-medium">Trusted by UK schools</span>
          </div>
          <span>DfE Compliant</span>
          <span>WCAG 2.1 AA Accessible</span>
          <span>Mobile Responsive</span>
          <span>No Coding Required</span>
        </div>
      </section>

      {/* How it works */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              From logo to live website in 5 steps
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Our AI analyses your school logo, extracts your brand colours, and generates a complete
              design system tailored to your school.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {[
              { step: 1, icon: Upload, title: "Upload Logo", desc: "Drop your school logo — we extract brand colours automatically" },
              { step: 2, icon: Palette, title: "Pick Palette", desc: "Choose from AI-generated colour palettes based on your logo" },
              { step: 3, icon: Layout, title: "Choose Style", desc: "10 presets from Friendly to Professional — designed for schools" },
              { step: 4, icon: Type, title: "Select Fonts", desc: "Curated Google Font pairings that match your chosen style" },
              { step: 5, icon: Rocket, title: "Go Live", desc: "One click publish — instant deployment with free SSL" },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-fuchsia-50 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-fuchsia-600" />
                </div>
                <div className="text-xs font-bold text-fuchsia-500 mb-1">STEP {step}</div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything a school website needs
            </h2>
            <p className="text-gray-500 text-lg">Built specifically for UK schools — not a generic website builder.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: "DfE Compliance Built-In",
                desc: "Automatically checks all 35+ statutory requirements. Know exactly what's missing.",
                color: "green",
              },
              {
                icon: Smartphone,
                title: "Mobile-First Design",
                desc: "Every template is fully responsive. Perfect on phones, tablets, and desktops.",
                color: "blue",
              },
              {
                icon: Zap,
                title: "Blazing Fast",
                desc: "Static HTML — no server-side rendering. Pages load instantly from CDN edge nodes.",
                color: "amber",
              },
              {
                icon: Search,
                title: "SEO Optimised",
                desc: "Semantic HTML, meta tags, Open Graph — your school ranks higher on Google.",
                color: "purple",
              },
              {
                icon: Lock,
                title: "Secure & Accessible",
                desc: "Free SSL, WCAG 2.1 AA compliant. Safe for all visitors.",
                color: "red",
              },
              {
                icon: Eye,
                title: "Live Preview",
                desc: "See changes in real-time as you edit. No waiting for deploys.",
                color: "fuchsia",
              },
              {
                icon: Globe,
                title: "Custom Domain",
                desc: "Use your own domain or get a free schoolgle.co.uk subdomain.",
                color: "teal",
              },
              {
                icon: Clock,
                title: "Version History",
                desc: "Every publish is saved. Roll back to any previous version instantly.",
                color: "indigo",
              },
              {
                icon: ImageIcon,
                title: "Media Library",
                desc: "Upload, organise, and reuse images across your site. Alt text reminders included.",
                color: "pink",
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 text-${color}-600`} />
                </div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Design presets showcase */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              10 beautiful presets, designed for schools
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Each preset is a complete design system — layout, typography, shapes, motion, and more.
              Pick one and customise with your brand colours.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { name: "Friendly", desc: "Warm & welcoming", phase: "Primary", color: "#f97316" },
              { name: "Classic", desc: "Timeless & trusted", phase: "Any", color: "#1e3a5f" },
              { name: "Nature", desc: "Organic & calm", phase: "Primary", color: "#2d6a4f" },
              { name: "Bold", desc: "Confident & modern", phase: "Secondary", color: "#be123c" },
              { name: "Professional", desc: "Clean & structured", phase: "Secondary", color: "#334155" },
              { name: "Vibrant", desc: "Energetic & colourful", phase: "Any", color: "#7c3aed" },
              { name: "Minimal", desc: "Spacious & refined", phase: "Any", color: "#111827" },
              { name: "Heritage", desc: "Prestigious & elegant", phase: "Secondary", color: "#78350f" },
              { name: "Community", desc: "Inclusive & local", phase: "Primary", color: "#1d4ed8" },
              { name: "Future", desc: "Tech-forward", phase: "Secondary", color: "#4f46e5" },
            ].map(({ name, desc, phase, color }) => (
              <div key={name} className="rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all cursor-pointer group">
                <div
                  className="h-24 flex items-end p-3"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
                >
                  <span className="text-white font-bold text-sm">{name}</span>
                </div>
                <div className="p-3">
                  <div className="text-xs text-gray-500">{desc}</div>
                  <div className="text-xs text-gray-400 mt-1">{phase}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, school-friendly pricing</h2>
            <p className="text-gray-500 text-lg">
              Start free. Upgrade when you&apos;re ready to go live with a custom domain.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free tier */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <div className="text-3xl font-bold mb-4">
                <PoundSterling className="w-6 h-6 inline" />0
                <span className="text-lg text-gray-400 font-normal">/month</span>
              </div>
              <p className="text-gray-500 mb-6">Perfect for trying it out</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Full website builder",
                  "5 pages included",
                  "Free schoolgle.co.uk subdomain",
                  "Mobile responsive",
                  "SSL included",
                  "Basic compliance checker",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register?plan=website-free"
                className="block text-center py-3 border-2 border-fuchsia-500 text-fuchsia-600 rounded-xl font-medium hover:bg-fuchsia-50 transition-colors"
              >
                Start Free
              </Link>
            </div>

            {/* Pro tier */}
            <div className="bg-fuchsia-600 rounded-2xl p-8 text-white relative">
              <div className="absolute -top-3 right-6 px-3 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-xl font-bold mb-2">School Pro</h3>
              <div className="text-3xl font-bold mb-4">
                <PoundSterling className="w-6 h-6 inline" />15
                <span className="text-lg text-white/60 font-normal">/month</span>
              </div>
              <p className="text-white/80 mb-6">Everything you need for a professional school website</p>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited pages",
                  "Custom domain support",
                  "Full DfE compliance dashboard",
                  "News & blog module",
                  "Media library",
                  "Contact form submissions",
                  "Google Analytics integration",
                  "Priority support",
                  "Version history & rollback",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-fuchsia-200 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register?plan=website-pro"
                className="block text-center py-3 bg-white text-fuchsia-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
              >
                Start 14-Day Free Trial
              </Link>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            Already using Schoolgle? The website builder is included in your Schools or Trusts plan at no extra cost.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to build your school website?
          </h2>
          <p className="text-gray-500 text-lg mb-8">
            Join hundreds of UK schools who&apos;ve ditched expensive agencies and built
            their own beautiful, compliant websites with Schoolgle.
          </p>
          <Link
            href="/auth/register?plan=website"
            className="inline-flex items-center gap-2 px-8 py-4 bg-fuchsia-500 text-white rounded-xl font-bold text-lg hover:bg-fuchsia-600 transition-colors"
          >
            <Rocket className="w-5 h-5" />
            Start Building Free
          </Link>
        </div>
      </section>

      {/* Simple footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>&copy; {new Date().getFullYear()} Schoolgle. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-600">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
