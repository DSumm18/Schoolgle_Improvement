"use client";

import { useState, useRef, useEffect } from 'react';
import { 
    MessageCircle, X, Send, Loader2, Sparkles, 
    BookOpen, GraduationCap, BarChart3, Target,
    Lightbulb, ChevronDown, Minimize2, Maximize2
} from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface EdChatbotProps {
    context?: {
        schoolName?: string;
        currentView?: string;
        selectedCategory?: string;
        gaps?: Array<{ area: string; description: string }>;
        recentFindings?: string;
        topic?: string;
    };
}

const QUICK_PROMPTS = [
    { icon: BookOpen, label: "What is EEF?", prompt: "What is the EEF and how can it help my school?" },
    { icon: Target, label: "Ofsted expects...", prompt: "What does Ofsted look for in Quality of Education?" },
    { icon: BarChart3, label: "Reading gaps", prompt: "How can I improve reading outcomes using research?" },
    { icon: Lightbulb, label: "High-impact strategies", prompt: "What are the highest impact teaching strategies?" },
];

export default function EdChatbot({ context }: EdChatbotProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && !isMinimized) {
            inputRef.current?.focus();
        }
    }, [isOpen, isMinimized]);

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
            const response = await fetch('/api/ed/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    })),
                    context: {
                        ...context,
                        topic: text // Add the current query as topic for EEF matching
                    }
                })
            });

            const data = await response.json();

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response || "I'm sorry, I couldn't process that. Could you try again?",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again in a moment.",
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
        // Convert markdown-style formatting to HTML
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^• /gm, '• ')
            .replace(/^- /gm, '• ')
            .replace(/\n/g, '<br/>');
    };

    // Floating button when closed
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group z-50"
                title="Chat with Ed"
            >
                <div className="relative">
                    <GraduationCap size={28} className="group-hover:scale-110 transition-transform" />
                    <Sparkles size={14} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                </div>
                <span className="absolute -top-2 -left-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
                    Ed
                </span>
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
            isMinimized ? 'w-72' : 'w-96'
        }`}>
            {/* Chat Window */}
            <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col ${
                isMinimized ? 'h-14' : 'h-[32rem]'
            }`}>
                {/* Header */}
                <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 flex items-center justify-between cursor-pointer"
                    onClick={() => isMinimized && setIsMinimized(false)}
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <GraduationCap size={22} />
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Ed</h3>
                            <p className="text-xs text-white/80">Your AI School Improvement Partner</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.length === 0 ? (
                                // Welcome Screen
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <GraduationCap className="text-emerald-600" size={32} />
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-2">Hello! I'm Ed 👋</h4>
                                    <p className="text-sm text-gray-600 mb-4">
                                        I can help you understand Ofsted expectations, explain EEF research, 
                                        and suggest evidence-based improvements.
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {QUICK_PROMPTS.map((prompt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => sendMessage(prompt.prompt)}
                                                className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg text-left text-sm hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                                            >
                                                <prompt.icon size={16} className="text-emerald-600 flex-shrink-0" />
                                                <span className="text-gray-700">{prompt.label}</span>
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
                                        <div className={`max-w-[85%] ${
                                            message.role === 'user' 
                                                ? 'bg-emerald-500 text-white rounded-2xl rounded-br-md' 
                                                : 'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-100'
                                        } px-4 py-3`}>
                                            {message.role === 'assistant' && (
                                                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                                                    <GraduationCap size={16} className="text-emerald-600" />
                                                    <span className="text-xs font-semibold text-emerald-600">Ed</span>
                                                </div>
                                            )}
                                            <div 
                                                className={`text-sm leading-relaxed ${message.role === 'assistant' ? 'prose prose-sm' : ''}`}
                                                dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-100 px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin text-emerald-600" />
                                            <span className="text-sm text-gray-500">Ed is thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-200">
                            <div className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask Ed anything about school improvement..."
                                    className="flex-1 px-4 py-2.5 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-sm"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim() || isLoading}
                                    className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 text-center">
                                Ed uses EEF research & Ofsted framework • Responses are AI-generated
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

