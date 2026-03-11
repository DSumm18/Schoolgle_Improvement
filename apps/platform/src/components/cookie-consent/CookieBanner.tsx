"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface CookieConsent {
  essential: true;
  analytics: boolean;
  timestamp: number;
}

const COOKIE_NAME = "schoolgle_cookie_consent";
const COOKIE_EXPIRY_DAYS = 365;

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(
      "(?:^|; )" + name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)",
    ),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    const existing = getCookie(COOKIE_NAME);
    if (!existing) {
      setVisible(true);
    }
  }, []);

  const saveConsent = useCallback((analytics: boolean) => {
    const consent: CookieConsent = {
      essential: true,
      analytics,
      timestamp: Date.now(),
    };
    setCookie(COOKIE_NAME, JSON.stringify(consent), COOKIE_EXPIRY_DAYS);
    setVisible(false);
  }, []);

  const handleAcceptAll = () => saveConsent(true);
  const handleEssentialOnly = () => saveConsent(false);
  const handleSavePreferences = () => saveConsent(analyticsEnabled);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-950 sm:p-6"
        >
          <div className="mx-auto max-w-5xl">
            {!showPreferences ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    We use essential cookies to keep you signed in. We&apos;d
                    also like to use analytics cookies to improve our service.{" "}
                    <Link
                      href="/privacy"
                      className="underline hover:text-gray-900 dark:hover:text-gray-200"
                    >
                      Privacy Policy
                    </Link>{" "}
                    &middot;{" "}
                    <Link
                      href="/cookies"
                      className="underline hover:text-gray-900 dark:hover:text-gray-200"
                    >
                      Cookie Policy
                    </Link>
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  <button
                    onClick={() => setShowPreferences(true)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Manage Preferences
                  </button>
                  <button
                    onClick={handleEssentialOnly}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Essential Only
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Cookie Preferences
                  </h3>
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Back
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-md border border-gray-200 p-3 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Essential Cookies
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Required for authentication and core functionality.
                      </p>
                    </div>
                    <span className="text-xs font-medium text-gray-400">
                      Always on
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-md border border-gray-200 p-3 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Analytics Cookies
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Help us understand how you use the platform so we can
                        improve it.
                      </p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={analyticsEnabled}
                      onClick={() => setAnalyticsEnabled(!analyticsEnabled)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        analyticsEnabled
                          ? "bg-gray-900 dark:bg-white"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform dark:bg-gray-900 ${
                          analyticsEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSavePreferences}
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
