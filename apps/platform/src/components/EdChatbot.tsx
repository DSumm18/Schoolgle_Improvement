"use client";

import { useState, useRef, useEffect } from 'react';
import {
    MessageCircle, X, Send, Loader2, Sparkles,
    BookOpen, GraduationCap, BarChart3, Target,
    Lightbulb, ChevronDown, Minimize2, Maximize2
} from 'lucide-react';
import { EdShapeParticles } from './EdShapeParticles';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface LanguageInfo {
    code: string;
    name: string;
    countryCode: string; // ISO country code for flag integration
    prompt: string;
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
    const [detectedLanguage, setDetectedLanguage] = useState<LanguageInfo | null>(null);
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
                        topic: text
                    },
                    stream: true // Enable streaming
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            // Handle streaming response
            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body reader');
            }

            const decoder = new TextDecoder();
            let streamedContent = '';

            // Create placeholder assistant message
            const assistantMessageIndex = messages.length + 1;
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '',
                timestamp: new Date()
            }]);

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;

                            try {
                                const parsed = JSON.parse(data);

                                // Handle language detection
                                if (parsed.language) {
                                    setDetectedLanguage(parsed.language);
                                }

                                // Handle content chunks
                                if (parsed.content) {
                                    streamedContent += parsed.content;

                                    // Update the assistant message with new content
                                    setMessages(prev => {
                                        const newMessages = [...prev];
                                        newMessages[assistantMessageIndex] = {
                                            role: 'assistant',
                                            content: streamedContent,
                                            timestamp: new Date()
                                        };
                                        return newMessages;
                                    });
                                }
                            } catch (e) {
                                // Skip invalid JSON
                            }
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }

            // If no content was streamed, show fallback
            if (!streamedContent) {
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[assistantMessageIndex] = {
                        role: 'assistant',
                        content: "I'm sorry, I couldn't process that. Could you try again?",
                        timestamp: new Date()
                    };
                    return newMessages;
                });
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('Chat error:', errorMessage, error);

            let userFriendlyMessage = "I'm having trouble connecting right now. Please try again in a moment.";

            // Provide more specific error messages when possible
            if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                userFriendlyMessage = "I'm having trouble connecting to the server. Please check your internet connection and try again.";
            } else if (errorMessage.includes('timeout')) {
                userFriendlyMessage = "The request is taking longer than expected. Please try again.";
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: userFriendlyMessage,
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
                className="fixed bottom-6 right-6 group z-50 hover:scale-110 transition-transform duration-300"
                title="Chat with Ed"
            >
                <EdShapeParticles
                    type={detectedLanguage && detectedLanguage.code !== 'en' ? 'flag' : 'orb'}
                    countryCode={detectedLanguage?.countryCode}
                    size={64}
                    animated={true}
                />
                <span className="absolute -top-2 -left-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
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
                        <EdShapeParticles
                            type={detectedLanguage && detectedLanguage.code !== 'en' ? 'flag' : 'orb'}
                            countryCode={detectedLanguage?.countryCode}
                            size={40}
                            animated={true}
                        />
                        <div>
                            <h3 className="font-bold text-lg">Ed</h3>
                            <p className="text-xs text-white/80">
                                {detectedLanguage && detectedLanguage.code !== 'en'
                                    ? `Speaking ${detectedLanguage.name}`
                                    : 'Your AI School Improvement Partner'}
                            </p>
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
                                    <div className="mx-auto mb-4 flex justify-center">
                                        <EdShapeParticles type="orb" size={64} animated={true} />
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-2">Hello! I'm Ed</h4>
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
                                                    <EdShapeParticles
                                                        type={detectedLanguage && detectedLanguage.code !== 'en' ? 'flag' : 'orb'}
                                                        countryCode={detectedLanguage?.countryCode}
                                                        size={20}
                                                        animated={false}
                                                    />
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
                                        <div className="flex items-center gap-3">
                                            <EdShapeParticles type="thinking" size={32} animated={true} />
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

