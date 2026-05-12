"use client";

import { X, MessageSquare, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownBlock from '../common/MarkdownBlock';

interface ChatAssistantProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    messages: any[];
    input: string;
    setInput: (input: string) => void;
    onSend: (msg?: string) => void;
    loading: boolean;
    chatEndRef: any;
}

export default function ChatAssistant({
    isOpen, setIsOpen, messages, input, setInput, onSend, loading, chatEndRef
}: ChatAssistantProps) {
    return (
        <div className="fixed bottom-6 right-6 z-[100] print:hidden">
            {!isOpen ? (
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(true)}
                    className="w-14 h-14 bg-black rounded-full flex items-center justify-center p-0 shadow-2xl text-white transition-all duration-300 group relative"
                >
                    <MessageSquare size={24} />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-black rounded-full animate-pulse"></span>
                </motion.button>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="w-80 max-w-[calc(100vw-20px)] bg-white rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden flex flex-col"
                >
                    <div className="p-4 bg-black text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center">
                                <img src="/logo.svg" alt="" className="w-3.5 h-3.5 invert" />
                            </div>
                            <span className="text-xs font-bold tracking-tight uppercase">Didact Support</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="h-[350px] overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
                        {messages.filter(m => m.content && m.content.trim() !== "").map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] p-3 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-black text-white rounded-tr-none shadow-md' 
                                        : 'bg-white border border-zinc-100 text-zinc-800 rounded-tl-none shadow-sm'
                                }`}>
                                    {msg.role === 'bot' ? (
                                        <MarkdownBlock content={msg.content} />
                                    ) : msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border p-3 rounded-2xl rounded-tl-none flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" style={{animationDelay:'200ms'}}></span>
                                    <span className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce" style={{animationDelay:'400ms'}}></span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-4 border-t bg-white">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Ask anything..." 
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && onSend()}
                                className="flex-1 bg-zinc-50 border-none px-4 py-2 rounded-xl text-sm focus:bg-white transition-all outline-none"
                            />
                            <button 
                                onClick={() => onSend()}
                                disabled={!input.trim() || loading}
                                className="p-2 bg-black text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                            >
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
