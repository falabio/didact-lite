"use client";

import { X, History, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    savedHistory: any[];
    onLoadEntry: (entry: any) => void;
    onDeleteEntry: (index: number) => void;
    onClearAll: () => void;
}

export default function HistorySidebar({
    isOpen, onClose, savedHistory, onLoadEntry, onDeleteEntry, onClearAll
}: HistorySidebarProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex justify-end">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/10 backdrop-blur-sm" 
                        onClick={onClose} 
                    />
                    <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-96 h-full bg-white shadow-2xl p-8 flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex flex-col">
                                <span className="text-xl font-bold tracking-tight">History</span>
                                {savedHistory.length > 0 && (
                                    <button 
                                        onClick={onClearAll} 
                                        className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline text-left mt-1"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                                <X size={20}/>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                            {savedHistory.length === 0 ? (
                                <div className="py-20 text-center space-y-4">
                                    <History size={24} className="text-zinc-300 mx-auto" />
                                    <p className="text-zinc-400 text-sm font-medium">No history yet.</p>
                                </div>
                            ) : savedHistory.map((h, i) => (
                                <motion.div 
                                    layout
                                    key={h.id || i} 
                                    className="group relative"
                                >
                                    <div 
                                        onClick={() => onLoadEntry(h)} 
                                        className="p-4 rounded-2xl border border-zinc-100 hover:border-black transition-all cursor-pointer bg-white"
                                    >
                                        <div className="flex justify-between mb-2">
                                            <span className={`badge ${h.type === 'Plan' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {h.type}
                                            </span>
                                            <span className="text-[10px] text-zinc-300">{h.date}</span>
                                        </div>
                                        <h4 className="font-bold text-zinc-800 line-clamp-1">{h.subject}</h4>
                                        <p className="text-xs text-zinc-400">{h.classGrade} • {h.term}</p>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteEntry(i);
                                        }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:text-red-600"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
