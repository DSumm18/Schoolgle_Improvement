"use client";

import { useRef, useState, useCallback } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

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
    const submittedUrl = (url || inputRef.current?.value || "").trim();

    if (!submittedUrl) {
      setError("Please paste a product page URL");
      return;
    }
    if (validate(submittedUrl)) {
      setUrl(submittedUrl);
      onSubmit(submittedUrl);
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
      <form
        noValidate
        className="relative flex items-center"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <Link2
          className={`absolute left-4 text-gray-400 ${isLarge ? "w-5 h-5" : "w-4 h-4"}`}
        />
        <input
          ref={inputRef}
          type="url"
          placeholder="Paste an Amazon, YPO, TTS or supplier product URL"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
          }}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className={`w-full ${
            isLarge ? "pl-12 pr-36 py-5 text-lg" : "pl-10 pr-28 py-3"
          } rounded-full border-2 border-emerald-100 bg-white text-slate-950 placeholder-slate-400 shadow-lg shadow-emerald-900/5 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50`}
        />
        <div className="absolute right-2 flex gap-1">
          <button
            type="button"
            onClick={handlePaste}
            disabled={isLoading}
            aria-label="Paste URL from clipboard"
            className="rounded-full p-2 text-slate-400 hover:text-emerald-700 disabled:opacity-50"
            title="Paste from clipboard"
          >
            <ClipboardPaste className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className={`flex items-center gap-1 rounded-full bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 ${
              isLarge ? "px-6 py-2" : "px-4 py-1.5"
            }`}
          >
            <Search className="w-4 h-4" />
            {isLoading ? "Searching..." : "Find Deals"}
          </button>
        </div>
      </form>
      {error && <p className="text-red-500 text-sm mt-2 ml-4">{error}</p>}
    </div>
  );
}
