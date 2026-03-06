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

          <div className="flex gap-8 text-sm">
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
                Contact
              </p>
              <p className="text-muted-foreground">admin@schoolgle.co.uk</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border text-xs text-muted-foreground/60">
          <p>Schoolgle Limited 2025. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
