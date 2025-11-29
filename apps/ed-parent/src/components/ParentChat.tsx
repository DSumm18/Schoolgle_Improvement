"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, GraduationCap, Calendar, FileText, Users, HelpCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ParentChatProps {
  schoolSlug: string;
  schoolName: string;
}

const QUICK_QUESTIONS = [
  { icon: Calendar, text: "When are the next term dates?" },
  { icon: FileText, text: "What's the uniform policy?" },
  { icon: Users, text: "How do I report my child absent?" },
  { icon: HelpCircle, text: "What time does school start?" },
];

export default function ParentChat({ schoolSlug, schoolName }: ParentChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          context: {
            organizationId: schoolSlug,
            schoolName: schoolName,
            product: 'parent-chat',
            userRole: 'parent'
          }
        })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || "I'm sorry, I couldn't process that. Could you try rephrasing your question?",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment, or contact the school office directly.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^• /gm, '• ')
      .replace(/^- /gm, '• ')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          // Welcome Screen
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <GraduationCap className="text-emerald-600" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Hello! I'm Ed 👋
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              I can answer questions about {schoolName} - term dates, policies, events, and more!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(q.text)}
                  className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-xl text-left hover:border-emerald-300 hover:bg-emerald-50 transition-all group"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <q.icon size={20} className="text-emerald-600" />
                  </div>
                  <span className="text-gray-700 font-medium">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Messages
          messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-emerald-500 text-white rounded-2xl rounded-br-sm'
                  : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm shadow-md border border-gray-100'
              } px-5 py-4`}>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                    <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                      <GraduationCap size={14} className="text-emerald-600" />
                    </div>
                    <span className="text-xs font-bold text-emerald-600">Ed</span>
                  </div>
                )}
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                />
                <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/70' : 'text-gray-400'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm shadow-md border border-gray-100 px-5 py-4">
              <div className="flex items-center gap-3">
                <Loader2 size={18} className="animate-spin text-emerald-600" />
                <span className="text-sm text-gray-500">Ed is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-gray-200">
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about the school..."
            className="flex-1 px-5 py-3.5 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium"
          >
            <Send size={18} />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Ed provides information based on school policies and data • Responses are AI-generated
        </p>
      </div>
    </div>
  );
}
