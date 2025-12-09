"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Bot, User, X, Image as ImageIcon } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    imageData?: string;
    timestamp: Date;
}

interface StaffChatProps {
    schoolSlug: string;
    schoolName: string;
    capturedScreen?: string | null;
    contextPrompt?: string;
    onClearCapture?: () => void;
}

export default function StaffChat({
    schoolSlug,
    schoolName,
    capturedScreen,
    contextPrompt,
    onClearCapture
}: StaffChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Handle context prompt from quick skills
    useEffect(() => {
        if (contextPrompt && contextPrompt !== input) {
            setInput(contextPrompt);
            inputRef.current?.focus();
        }
    }, [contextPrompt]);

    const sendMessage = async (messageText?: string) => {
        const text = messageText || input.trim();
        if (!text || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: text,
            imageData: capturedScreen || undefined,
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
                        content: m.content,
                        imageData: m.imageData
                    })),
                    context: {
                        organizationId: schoolSlug,
                        schoolName: schoolName,
                        product: 'staff-tools',
                        userRole: 'staff'
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

            // Clear captured screen after sending
            if (capturedScreen && onClearCapture) {
                onClearCapture();
            }
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
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bot className="text-indigo-600" size={32} />
                        </div>
                        <h4 className="font-bold text-gray-900 mb-2">Ready to help!</h4>
                        <p className="text-sm text-gray-600">
                            Ask me about MIS systems, school operations, or capture your screen for contextual guidance.
                        </p>
                    </div>
                ) : (
                    messages.map((message, idx) => (
                        <div
                            key={idx}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] ${
                                message.role === 'user'
                                    ? 'bg-indigo-500 text-white rounded-2xl rounded-br-md'
                                    : 'bg-white text-gray-800 rounded-2xl rounded-bl-md shadow-sm border border-gray-100'
                            } px-4 py-3`}>
                                {message.role === 'assistant' && (
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                                        <Bot size={16} className="text-indigo-600" />
                                        <span className="text-xs font-semibold text-indigo-600">Ed</span>
                                    </div>
                                )}
                                {message.imageData && (
                                    <div className="mb-2">
                                        <img
                                            src={message.imageData}
                                            alt="Screenshot"
                                            className="rounded-lg max-w-full h-auto border border-gray-200"
                                        />
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
                                <Loader2 size={16} className="animate-spin text-indigo-600" />
                                <span className="text-sm text-gray-500">Ed is analyzing...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
                {capturedScreen && (
                    <div className="mb-3 relative">
                        <div className="flex items-center gap-2 p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <ImageIcon size={16} className="text-indigo-600" />
                            <span className="text-sm text-indigo-700 flex-1">Screenshot attached</span>
                            <button
                                onClick={onClearCapture}
                                className="p-1 hover:bg-indigo-100 rounded transition-colors"
                            >
                                <X size={16} className="text-indigo-600" />
                            </button>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask Ed anything about school operations..."
                        className="flex-1 px-4 py-2.5 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || isLoading}
                        className="p-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                    Ed helps with MIS systems, data analysis & school operations • AI-generated responses
                </p>
            </div>
        </div>
    );
}
