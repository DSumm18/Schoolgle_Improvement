/**
 * API Client for Ed Widget
 * Calls the /api/ed/chat endpoint which uses the Ed Agents Orchestrator
 * This provides the correct school support prompts for logged-in users
 */

// ChatContext type - inlined to avoid cross-package dependency
type ChatContext = Record<string, unknown>;

declare const chrome: any; // Chrome extension API (available in extension context)

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  question: string;
  image?: string; // Base64 image data (screenshot or user upload)
  messages?: ChatMessage[]; // Recent conversation history for context
  context?: {
    url: string;
    hostname: string;
    title: string;
    tool?: {
      id: string;
      name: string;
      category: string;
    };
    visibleText: string;
    headings: Array<{ level: number; text: string }>;
    selectedText?: string;
  };
  organizationId?: string;
  userId?: string;
}

interface ChatResponse {
  id: string;
  answer: string;
  suggestions?: string[];
  confidence: number;
  source: "ai" | "cache" | "fallback" | "automation";
}

interface WebsiteKnowledgeResponse {
  answer: string;
  sources: Array<{
    url: string;
    title: string;
    snippet: string;
  }>;
  confidence: number;
}

export class EdAPIClient {
  private baseUrl: string;
  private organizationId?: string;
  private userId?: string;
  private accessToken?: string;
  private mode: "website" | "support" | "school" = "school";
  private screenStream: MediaStream | null = null; // Live screen share stream
  private screenVideo: HTMLVideoElement | null = null;

  constructor(
    baseUrl: string = "/api/ed/chat",
    organizationId?: string,
    userId?: string,
    accessToken?: string,
  ) {
    this.baseUrl = baseUrl;
    this.organizationId = organizationId;
    this.userId = userId;
    this.accessToken = accessToken;
  }

  /**
   * Set the mode for this client
   */
  setMode(mode: "website" | "support" | "school"): void {
    this.mode = mode;
  }

  /**
   * Query website knowledge base for visitor questions
   */
  async queryWebsiteKnowledge(
    question: string,
  ): Promise<WebsiteKnowledgeResponse | null> {
    if (!this.organizationId || this.mode !== "website") {
      return null;
    }

    try {
      const response = await fetch("/api/ed/website-knowledge", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          organizationId: this.organizationId,
        }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error("[EdAPIClient] Website knowledge query error:", error);
    }

    return null;
  }

  /**
   * Send chat message to /api/ed/chat endpoint
   * This uses the Ed Agents Orchestrator with proper school support prompts
   */
  async chat(
    userMessage: string,
    _context?: ChatContext,
    image?: string,
    conversationHistory?: Array<{
      role: "user" | "assistant";
      content: string;
    }>,
  ): Promise<string> {
    try {
      // Build page context
      const pageContext = {
        url: window.location.href,
        hostname: window.location.hostname,
        title: document.title,
        visibleText: document.body?.innerText?.substring(0, 5000) || "",
        headings: Array.from(
          document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
        )
          .map((h) => ({
            level: parseInt(h.tagName[1]),
            text: h.textContent?.trim() || "",
          }))
          .filter((h) => h.text)
          .slice(0, 20),
      };

      const requestBody: ChatRequest = {
        question: userMessage,
        image, // Base64 screenshot or user-uploaded image
        messages: conversationHistory?.slice(-10), // Last 10 messages for context
        context: pageContext,
        organizationId: this.organizationId,
        userId: this.userId,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (this.accessToken) {
        headers["Authorization"] = `Bearer ${this.accessToken}`;
        console.log("[EdAPIClient] Sending with Bearer token (length:", this.accessToken.length + ")");
      } else {
        console.warn("[EdAPIClient] NO ACCESS TOKEN — request will likely 401");
      }

      const response = await fetch(this.baseUrl, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data: ChatResponse = await response.json();

      return (
        data.answer || "I'm sorry, I couldn't get a response. Please try again."
      );
    } catch (error) {
      console.error("[EdAPIClient] Error:", error);

      // Fallback responses based on mode
      if (this.organizationId) {
        // School mode - logged in user
        return "I'm having trouble connecting right now. As your school support assistant, I can help with tasks once I'm back online. Please try again in a moment.";
      } else {
        // Support mode - pre-login
        return "I'm having trouble connecting. For help logging in, please try refreshing the page or contact support if the problem persists.";
      }
    }
  }

  /**
   * Get greeting based on mode (website, support, or school)
   */
  getGreeting(
    mode: "website" | "support" | "school" = "school",
    userName?: string,
  ): string {
    if (mode === "website") {
      return `Hi! I'm Ed, the school assistant. How can I help you today?`;
    }

    if (mode === "support") {
      return `Hi! I'm Ed. Need help logging in or finding something?`;
    }

    const name = userName ? ` ${userName}` : "";
    return `Hi${name}! I'm Ed, your school assistant. What can I help with?`;
  }

  /**
   * Start screen sharing — user grants permission once, then Ed can see
   * their screen on every message. Uses getDisplayMedia (works in all browsers).
   * GDPR: frames are captured in-memory, sent with the request, never stored.
   */
  async startScreenShare(): Promise<boolean> {
    try {
      if (this.screenStream) return true; // Already sharing

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      this.screenStream = stream;

      // Create hidden video element to draw frames from
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.style.position = "fixed";
      video.style.top = "-9999px";
      document.body.appendChild(video);
      await video.play();
      this.screenVideo = video;

      // Clean up when user stops sharing via browser UI
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        this.stopScreenShare();
      });

      console.log("[EdAPIClient] Screen sharing started");
      return true;
    } catch (error) {
      console.error("[EdAPIClient] Screen share failed:", error);
      return false;
    }
  }

  /**
   * Stop screen sharing and clean up resources
   */
  stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }
    if (this.screenVideo) {
      this.screenVideo.remove();
      this.screenVideo = null;
    }
    console.log("[EdAPIClient] Screen sharing stopped");
  }

  /**
   * Is screen sharing currently active?
   */
  get isScreenSharing(): boolean {
    return !!this.screenStream && this.screenStream.active;
  }

  /**
   * Grab a single frame from the live screen share stream.
   * Returns base64 data URL or null if not sharing.
   */
  captureFrame(): string | null {
    if (!this.screenVideo || !this.screenStream?.active) return null;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = this.screenVideo.videoWidth || 1280;
      canvas.height = this.screenVideo.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(this.screenVideo, 0, 0, canvas.width, canvas.height);
      // Use JPEG at 0.7 quality to keep payload small (~100-200KB)
      return canvas.toDataURL("image/jpeg", 0.7);
    } catch {
      return null;
    }
  }

  /**
   * Capture a screenshot — tries screen share first, then extension API.
   * GDPR: image is never stored, only sent for this request.
   */
  async captureScreen(): Promise<string | null> {
    // 1. If screen sharing is active, grab a frame instantly
    const frame = this.captureFrame();
    if (frame) return frame;

    // 2. Fallback: try Chrome extension's captureVisibleTab
    try {
      if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        return new Promise((resolve) => {
          chrome.runtime.sendMessage(
            { type: "CAPTURE_SCREENSHOT" },
            (response: any) => {
              resolve(response?.screenshot || null);
            },
          );
          setTimeout(() => resolve(null), 3000);
        });
      }
    } catch {
      // Extension not available
    }

    return null;
  }

  /**
   * Update the access token (called when session refreshes or auth becomes available)
   */
  setAccessToken(token: string | undefined): void {
    this.accessToken = token;
  }

  /**
   * Update user context (called when user logs in)
   */
  setContext(organizationId: string, userId: string): void {
    this.organizationId = organizationId;
    this.userId = userId;
  }
}
