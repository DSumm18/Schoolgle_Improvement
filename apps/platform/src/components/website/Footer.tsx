"use client";

import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="space-y-3">
            <h2 className="text-xl font-black tracking-tight text-foreground">
              Schoolgle
            </h2>
            <p className="text-sm text-muted-foreground">
              Built for UK schools
            </p>
          </div>

          <div className="grid gap-8 text-sm sm:grid-cols-3">
            <div className="space-y-2">
              <p className="font-bold text-foreground text-xs uppercase tracking-wider">
                Product
              </p>
              <Link
                href="/#meet-ed"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Meet Ed
              </Link>
              <Link
                href="/#preview"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Modules
              </Link>
              <Link
                href="/insights"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Insights
              </Link>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-foreground text-xs uppercase tracking-wider">
                Trust
              </p>
              <Link
                href="/legal"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Legal Hub
              </Link>
              <Link
                href="/trust"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Trust Centre
              </Link>
              <Link
                href="/ai-governance"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                AI Governance
              </Link>
              <Link
                href="/security"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Security
              </Link>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-foreground text-xs uppercase tracking-wider">
                Legal
              </p>
              <Link
                href="/privacy"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/cookies"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Cookie Policy
              </Link>
              <Link
                href="/terms"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Website Terms
              </Link>
              <Link
                href="/dpa"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                DPA
              </Link>
              <Link
                href="/sub-processors"
                className="block text-muted-foreground hover:text-foreground transition-colors"
              >
                Sub-processors
              </Link>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-foreground text-xs uppercase tracking-wider">
                Contact
              </p>
              <p className="text-muted-foreground">admin@schoolgle.co.uk</p>
              <p className="text-muted-foreground">privacy@schoolgle.co.uk</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground/60">
          <p>
            Schoolgle Limited 2025. All rights reserved. Registered in England
            &amp; Wales. Company No. 16776489. ICO Registration ZC103199.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
