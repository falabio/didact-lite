"use client";

import { MessageSquare, ArrowRight, BookOpen, Clock, Users, Calendar, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

interface AgenticSidebarProps {
    subject: string;
    classGrade: string;
    schoolName: string;
    term: string;
    session: string;
    chatMessages: {role: 'user'|'bot', content: string}[];
    chatInput: string;
    setChatInput: (val: string) => void;
    onSendChat: () => void;
    loading: boolean;
    chatEndRef: any;
    onUpdateContext: (field: string, val: string) => void;
    generatedDocs?: any[];
    onViewDoc?: (index: number) => void;
    onDownloadDoc?: (index: number) => void;
    onDownloadAll?: () => void;
    onPrintAll?: () => void;
}

export default function AgenticSidebar({
    subject, classGrade, schoolName, term, session, chatMessages, chatInput, setChatInput, onSendChat, loading, chatEndRef, onUpdateContext,
    generatedDocs = [], onViewDoc, onDownloadDoc, onDownloadAll, onPrintAll
}: AgenticSidebarProps) {
    return (
        <div className="w-full h-full flex flex-col bg-[#F5F5F7] border-r border-zinc-200">
            {/* Context Header */}
            <div className="p-6 border-b border-zinc-200 bg-white space-y-4">
                <h2 className="text-sm font-black tracking-widest uppercase text-zinc-400">Workspace Context</h2>
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                        <BookOpen size={14} className="text-zinc-400" />
                        <input 
                            value={subject} 
                            onChange={e => onUpdateContext('subject', e.target.value)}
                            className="bg-transparent border-none outline-none text-xs font-bold text-zinc-800 w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                        <Users size={14} className="text-zinc-400" />
                        <input 
                            value={classGrade} 
                            onChange={e => onUpdateContext('classGrade', e.target.value)}
                            className="bg-transparent border-none outline-none text-xs font-bold text-zinc-800 w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                        <Clock size={14} className="text-zinc-400" />
                        <select 
                            value={term} 
                            onChange={e => onUpdateContext('term', e.target.value)}
                            className="bg-transparent border-none outline-none text-xs font-bold text-zinc-800 w-full cursor-pointer appearance-none"
                        >
                            <option>First Term</option><option>Second Term</option><option>Third Term</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                        <Calendar size={14} className="text-zinc-400" />
                        <input 
                            value={session} 
                            onChange={e => onUpdateContext('session', e.target.value)}
                            className="bg-transparent border-none outline-none text-xs font-bold text-zinc-800 w-full"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-zinc-50 p-2 rounded-lg border border-zinc-100 col-span-2">
                        <BookOpen size={14} className="text-zinc-400" />
                        <input 
                            value={schoolName} 
                            onChange={e => onUpdateContext('schoolName', e.target.value)}
                            placeholder="School Name (For PDF Export)"
                            className="bg-transparent border-none outline-none text-xs font-bold text-zinc-800 w-full"
                        />
                    </div>
                </div>
            </div>
            
            {/* Generated Documents List */}
            {generatedDocs.length > 0 && (
                <div className="p-6 border-b border-zinc-200 bg-white/50 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[10px] font-black tracking-widest uppercase text-zinc-400">Generated Weeks</h2>
                        <div className="flex gap-2">
                            <button onClick={onPrintAll} title="Combine & Print" className="p-1.5 hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-black transition-all">
                                <FileText size={14} />
                            </button>
                            <button onClick={onDownloadAll} title="Download All" className="p-1.5 hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-black transition-all">
                                <ArrowRight size={14} className="rotate-90" />
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {generatedDocs.map((doc: any, i: number) => (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className="group flex items-center justify-between p-3 bg-white border border-zinc-100 rounded-xl hover:border-black hover:shadow-md transition-all cursor-pointer"
                                onClick={() => onViewDoc?.(i)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-zinc-50 rounded-lg flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
                                        <FileText size={14} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-zinc-800">Week {doc.week || i + 1}</p>
                                        <p className="text-[9px] font-medium text-zinc-400 truncate max-w-[100px]">{doc.topic || 'Lesson Plan'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-group-hover:opacity-100 transition-all">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDownloadDoc?.(i); }}
                                        className="p-1.5 hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-black"
                                    >
                                        <ArrowRight size={12} className="rotate-90" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {chatMessages.map((msg, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={i} 
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user' 
                                ? 'bg-black text-white rounded-tr-none shadow-md' 
                                : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none shadow-sm'
                        }`}>
                            {msg.content}
                        </div>
                    </motion.div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-zinc-200 p-4 rounded-2xl rounded-tl-none flex gap-1 shadow-sm">
                            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay:'200ms'}}></span>
                            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{animationDelay:'400ms'}}></span>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-zinc-200">
                <div className="relative flex items-end bg-zinc-50 border border-zinc-200 rounded-2xl p-2 transition-all focus-within:border-black focus-within:bg-white focus-within:shadow-lg">
                    <textarea 
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                onSendChat();
                            }
                        }}
                        placeholder="Instruct Didact..."
                        className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none outline-none text-sm text-zinc-800 placeholder:text-zinc-400 px-2 py-2 resize-none"
                        rows={1}
                    />
                    <button 
                        onClick={onSendChat}
                        disabled={!chatInput.trim() || loading}
                        className="w-10 h-10 shrink-0 bg-black text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 ml-2 mb-0.5"
                    >
                        <ArrowRight size={18} />
                    </button>
                </div>
                <div className="text-center mt-3">
                    <p className="text-[10px] text-zinc-400 font-medium">Press <kbd className="font-sans px-1 py-0.5 bg-zinc-100 rounded border border-zinc-200 text-zinc-500">Enter</kbd> to send, <kbd className="font-sans px-1 py-0.5 bg-zinc-100 rounded border border-zinc-200 text-zinc-500">Shift+Enter</kbd> for new line</p>
                </div>
            </div>
        </div>
    );
}
