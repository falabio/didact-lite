"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Command, ArrowRight } from 'lucide-react';

interface GlobalRefinePaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onExecute: (instruction: string) => void;
}

export default function GlobalRefinePalette({ isOpen, onClose, onExecute }: GlobalRefinePaletteProps) {
    const [instruction, setInstruction] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (instruction.trim()) {
            onExecute(instruction.trim());
            setInstruction('');
            onClose();
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh]">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-zinc-200"
                >
                    <div className="p-4 bg-zinc-50 border-b border-zinc-100 flex items-center gap-2">
                        <Sparkles size={16} className="text-pro" />
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Global Pro Refine</span>
                    </div>
                    <form onSubmit={handleSubmit} className="p-4">
                        <div className="flex items-center gap-4">
                            <Command size={24} className="text-zinc-400" />
                            <input 
                                autoFocus
                                type="text"
                                value={instruction}
                                onChange={e => setInstruction(e.target.value)}
                                placeholder="e.g. Translate all objectives to French..."
                                className="flex-1 bg-transparent border-none outline-none text-xl text-zinc-800 placeholder:text-zinc-300 font-medium"
                            />
                            <button 
                                type="submit"
                                disabled={!instruction.trim()}
                                className="w-10 h-10 bg-pro text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                            >
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </form>
                    <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex flex-wrap gap-2">
                        {["Make the entire plan more interactive", "Convert all activities to group work", "Add a 5-minute warm-up to every lesson"].map((s, i) => (
                            <button 
                                key={i}
                                onClick={() => setInstruction(s)}
                                className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-zinc-600 hover:text-black hover:border-zinc-400 transition-colors"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
