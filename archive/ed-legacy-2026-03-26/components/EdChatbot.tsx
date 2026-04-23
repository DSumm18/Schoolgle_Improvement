"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Minimize2, Maximize2, Camera } from "lucide-react";
import SchoolgleAnimatedLogo from "@/components/SchoolgleAnimatedLogo";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  screenshot?: string;  // Include screenshot with message
}

interface EdChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export default function EdChatbot({
  isOpen,
  onToggle,
  isMinimized,
  onToggleMinimize,
}: EdChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Ed, your Schoolgle assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * Capture screenshot of current page using html2canvas
   */
  const captureScreenshot = async () => {
    setIsCapturing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        logging: false,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setScreenshot(dataUrl);
      console.log("Screenshot captured, size:", dataUrl.length);
    } catch (error) {
      console.error("Screenshot failed:", error);
      alert("Screenshot capture failed. Please try again.");
    } finally {
      setIsCapturing(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Call Ed Chat API
      const response = await fetch('/api/ed/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies for auth
        body: JSON.stringify({
          question: userInput,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          image: screenshot || undefined, // Send screenshot if available
          context: {
            url: window.location.href,
            hostname: window.location.hostname,
            title: document.title,
            visibleText: document.body.innerText.substring(0, 5000), // First 5000 chars
            headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
              level: parseInt(h.tagName[1]),
              text: h.textContent || ''
            }))
          },
          pageState: screenshot ? {
            screenshot,
            domSnapshot: document.documentElement.innerHTML.substring(0, 50000) // First 50KB of HTML
          } : undefined
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || "I apologize, but I couldn't generate a response. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Clear screenshot after sending
      setScreenshot(null);
    } catch (error) {
      console.error('Ed chat error:', error);

      // Clear screenshot on error too
      setScreenshot(null);

      // Fallback error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please make sure you're logged in and try again. If the problem persists, there might be an API configuration issue.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={onToggle}
          className="rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
          title="Open Ed Chatbot"
        >
          <SchoolgleAnimatedLogo size={60} showText={false} />
        </button>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={onToggleMinimize}
          className="rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95"
          title="Restore Ed Chatbot"
        >
          <SchoolgleAnimatedLogo size={60} showText={false} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-screen fixed right-0 top-0 z-30 shadow-xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-blue-600 text-white">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <h3 className="font-semibold">Ed - Your Assistant</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMinimize}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
            title="Minimize"
          >
            <Minimize2 size={16} />
          </button>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {message.timestamp.toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        {/* Screenshot preview */}
        {screenshot && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Camera size={16} className="text-blue-600" />
                <span className="text-sm text-blue-800">Screenshot captured</span>
              </div>
              <button
                type="button"
                onClick={() => setScreenshot(null)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Remove
              </button>
            </div>
            <img
              src={screenshot}
              alt="Captured screenshot"
              className="w-full h-32 object-cover rounded border border-blue-200"
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={captureScreenshot}
            disabled={isCapturing || isLoading}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${
              screenshot
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${isCapturing || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Capture screenshot of current page"
          >
            <Camera size={18} />
            {screenshot && <span className="text-green-600">✓</span>}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Ed anything..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
