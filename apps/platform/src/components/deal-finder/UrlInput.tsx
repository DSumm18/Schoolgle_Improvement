"use client";

import { useState, useCallback } from "react";
import { Link2, Search, ClipboardPaste } from "lucide-react";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  size?: "default" | "large";
  className?: string;
}

export function UrlInput({
  onSubmit,
  isLoading,
  size = "default",
  className = "",
}: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");

  const validate = (value: string): boolean => {
    try {
      new URL(value);
      setError("");
      return true;
    } catch {
      setError("Please enter a valid URL");
      return false;
    }
  };

  const handleSubmit = useCallback(() => {
    if (!url.trim()) {
      setError("Please paste a product URL");
      return;
    }
    if (validate(url.trim())) {
      onSubmit(url.trim());
    }
  }, [url, onSubmit]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        setError("");
        try {
          new URL(text);
          onSubmit(text);
        } catch {
          // Not a valid URL, just paste it
        }
      }
    } catch {
      // Clipboard API not available
    }
  }, [onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  const isLarge = size === "large";

  return (
    <div className={className}>
      <div className="relative flex items-center">
        <Link2
          className={`absolute left-4 text-gray-400 ${isLarge ? "w-5 h-5" : "w-4 h-4"}`}
        />
        <input
          type="url"
          placeholder="Paste a product URL from any supplier..."
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className={`w-full ${
            isLarge ? "pl-12 pr-36 py-5 text-lg" : "pl-10 pr-28 py-3"
          } rounded-full border-2 border-gray-200 focus:border-cyan-500 focus:ring-cyan-500 focus:outline-none shadow-lg`}
        />
        <div className="absolute right-2 flex gap-1">
          <button
            onClick={handlePaste}
            disabled={isLoading}
            className="rounded-full p-2 text-gray-400 hover:text-cyan-500"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="w-4 h-4" />
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !url.trim()}
            className={`rounded-full bg-cyan-500 hover:bg-cyan-600 text-white disabled:opacity-50 flex items-center gap-1 ${
              isLarge ? "px-6 py-2" : "px-4 py-1.5"
            }`}
          >
            <Search className="w-4 h-4" />
            {isLoading ? "Searching..." : "Find Deals"}
          </button>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mt-2 ml-4">{error}</p>}
    </div>
  );
}
