"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/SupabaseAuthContext";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Monitor,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  confidence?: number;
  suggestions?: string[];
}

interface EdSidebarChatProps {
  collapsed: boolean;
}

export default function EdSidebarChat({ collapsed }: EdSidebarChatProps) {
  const { user, organization, organizationId } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Listen for context events from EdChatButton components across the app
  useEffect(() => {
    const handleContextEvent = (event: CustomEvent) => {
      const context = event.detail;
      setIsOpen(true);
      if (context?.initialMessage) {
        // Small delay to let the chat open first
        setTimeout(() => handleSend(context.initialMessage), 500);
      }
    };

    window.addEventListener(
      "ed-open-with-context",
      handleContextEvent as EventListener,
    );
    return () => {
      window.removeEventListener(
        "ed-open-with-context",
        handleContextEvent as EventListener,
      );
    };
  }, []);

  // Send greeting when chat first opens
  const sendGreeting = useCallback(async () => {
    if (hasGreeted || !organizationId) return;
    setHasGreeted(true);

    try {
      const res = await fetch("/api/ed/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "hello",
          context: {
            url: pathname,
            hostname: window.location.hostname,
            title: document.title,
            visibleText: "",
            headings: [],
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages([
          {
            id: data.id || crypto.randomUUID(),
            role: "assistant",
            content: data.answer,
            timestamp: new Date(),
            confidence: data.confidence,
            suggestions: data.suggestions,
          },
        ]);
      } else {
        setMessages([
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Hello! I'm Ed, your school assistant. How can I help you today?`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch {
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Hello! I'm Ed, your school assistant. How can I help you today?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [hasGreeted, organizationId, pathname]);

  const handleOpen = () => {
    setIsOpen(true);
    if (!hasGreeted) {
      sendGreeting();
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Auto-resize textarea back to single line
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    // Include image if one is pending (screenshot or upload)
    const imageToSend = pendingImage;
    if (pendingImage) {
      setPendingImage(null); // Clear after sending
    }

    try {
      const res = await fetch("/api/ed/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: messageText,
          image: imageToSend || undefined,
          context: {
            url: pathname,
            hostname: window.location.hostname,
            title: document.title,
            visibleText: "",
            headings: [],
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage: Message = {
        id: data.id || crypto.randomUUID(),
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
        confidence: data.confidence,
        suggestions: data.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date(),
          confidence: 0,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  // Screen capture — lets Ed see what the user sees
  const handleScreenCapture = async () => {
    setIsCapturing(true);
    try {
      // Use getDisplayMedia for screen sharing
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" } as any,
      });

      // Capture a single frame
      const track = stream.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();

      // Draw to canvas and convert to base64
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(bitmap, 0, 0);
      const base64 = canvas.toDataURL("image/jpeg", 0.7);

      // Stop the stream immediately after capture
      stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());

      setPendingImage(base64);
      setInput(
        (prev) =>
          prev || "What can you see on my screen? Can you help me with this?",
      );
      inputRef.current?.focus();
    } catch (err: any) {
      // User cancelled or API not supported
      if (err.name !== "AbortError" && err.name !== "NotAllowedError") {
        console.error("[Ed] Screen capture failed:", err);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPendingImage(base64);
      setInput((prev) => prev || "Can you help me with what's in this image?");
      inputRef.current?.focus();
    };
    reader.readAsDataURL(file);

    // Reset file input so the same file can be re-selected
    e.target.value = "";
  };

  // Format message content with basic markdown
  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br />");
  };

  // Don't render if no user or org
  if (!user || !organizationId) return null;

  return (
    <>
      {/* Ed Floating Button — fixed bottom-left, always visible */}
      <button
        onClick={handleOpen}
        className={`fixed z-[48] bottom-4 transition-all duration-300 rounded-full shadow-lg hover:shadow-xl cursor-pointer group ${
          collapsed ? "left-4 lg:left-[5.5rem]" : "left-4 lg:left-[17rem]"
        } ${
          isOpen
            ? "bg-primary scale-90"
            : "bg-card border border-border hover:border-primary/30 hover:scale-105 active:scale-95"
        }`}
        style={{ width: 48, height: 48 }}
        title="Ask Ed"
      >
        <div className="flex items-center justify-center w-full h-full relative">
          {isOpen ? (
            <MessageCircle size={20} className="text-primary-foreground" />
          ) : (
            <>
              <Sparkles
                size={20}
                className="text-primary transition-all duration-300"
              />
              {/* Pulse indicator */}
              {messages.length === 0 && (
                <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse border-2 border-card" />
              )}
            </>
          )}
        </div>
      </button>

      {/* Chat Panel — opens from bottom-left */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-[45] lg:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Window */}
            <motion.div
              ref={chatContainerRef}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`fixed z-[50] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden ${
                collapsed
                  ? "left-4 lg:left-[5.5rem] bottom-16"
                  : "left-4 lg:left-[17rem] bottom-16"
              } max-lg:left-4 max-lg:right-4 max-lg:bottom-16`}
              style={{
                width: "min(420px, calc(100vw - 2rem))",
                height: "min(560px, calc(100vh - 6rem))",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                    <Sparkles size={14} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Ed</h3>
                    <p className="text-[10px] text-muted-foreground leading-none">
                      {organization?.name || "Your school assistant"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    title="Close"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: formatMessage(message.content),
                        }}
                      />
                      {/* Suggestions */}
                      {message.suggestions &&
                        message.suggestions.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/30 flex flex-wrap gap-1.5">
                            {message.suggestions.map((suggestion, i) => (
                              <button
                                key={i}
                                onClick={() => handleSend(suggestion)}
                                className="text-xs px-2.5 py-1 rounded-full bg-background/80 hover:bg-background text-foreground border border-border/50 hover:border-primary/30 transition-all"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-xl px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Pending image preview */}
              {pendingImage && (
                <div className="px-3 py-2 border-t border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border">
                      <img
                        src={pendingImage}
                        alt="Attached"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">
                        Screen capture attached
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">
                        Ed will analyse what&apos;s on screen
                      </p>
                    </div>
                    <button
                      onClick={() => setPendingImage(null)}
                      className="p-1 rounded hover:bg-muted"
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="px-3 py-2.5 border-t border-border bg-card">
                {/* Hidden file input for image upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div className="flex items-end gap-1.5">
                  {/* Screen capture button */}
                  <button
                    onClick={handleScreenCapture}
                    disabled={isLoading || isCapturing}
                    className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted disabled:opacity-40 transition-all"
                    title="Share your screen with Ed"
                  >
                    {isCapturing ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Monitor size={16} />
                    )}
                  </button>

                  {/* Image upload button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted disabled:opacity-40 transition-all"
                    title="Upload an image"
                  >
                    <ImageIcon size={16} />
                  </button>

                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Ed anything..."
                    rows={1}
                    className="flex-1 resize-none bg-muted rounded-lg px-3 py-2 text-sm border border-border/50 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/60 transition-all"
                    disabled={isLoading}
                    style={{ maxHeight: 120 }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={(!input.trim() && !pendingImage) || isLoading}
                    className="shrink-0 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    title="Send"
                  >
                    {isLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground/40 mt-1.5 text-center">
                  Ed has access to your school&apos;s data based on your role
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
