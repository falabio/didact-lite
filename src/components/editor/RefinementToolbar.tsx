"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, Sparkles, RefreshCcw, Shrink, Expand, AlertCircle } from 'lucide-react';

interface RefinementToolbarProps {
    selection: { text: string; rect: DOMRect; path?: string } | null;
    onAction: (action: string, text: string) => void;
    onClose: () => void;
}

export default function RefinementToolbar({ selection, onAction, onClose }: RefinementToolbarProps) {
    if (!selection) return null;

    const style = {
        top: selection.rect.top - 50 + window.scrollY,
        left: selection.rect.left + (selection.rect.width / 2) - 150
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={style}
                className="absolute z-[200] bg-black text-white p-1.5 rounded-xl shadow-2xl flex items-center gap-1 border border-zinc-800"
            >
                <div className="px-2 border-r border-zinc-700 flex items-center gap-2">
                    <Wand2 size={14} className="text-blue-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Didact AI</span>
                </div>
                
                <button 
                    onClick={() => onAction('rewrite', selection.text)}
                    className="p-1.5 px-3 text-xs font-medium hover:bg-zinc-800 rounded-lg flex items-center gap-1 transition-colors"
                >
                    <RefreshCcw size={12}/> Rewrite
                </button>
                <button 
                    onClick={() => onAction('simplify', selection.text)}
                    className="p-1.5 px-3 text-xs font-medium hover:bg-zinc-800 rounded-lg flex items-center gap-1 transition-colors"
                >
                    <Shrink size={12}/> Simplify
                </button>
                <button 
                    onClick={() => onAction('expand', selection.text)}
                    className="p-1.5 px-3 text-xs font-medium hover:bg-zinc-800 rounded-lg flex items-center gap-1 transition-colors"
                >
                    <Expand size={12}/> Expand
                </button>
                
                <div className="w-px h-4 bg-zinc-700 mx-1"></div>
                
                <button 
                    onClick={() => onAction('differentiate', selection.text)}
                    className="p-1.5 px-3 text-xs font-bold text-pro hover:bg-zinc-800 rounded-lg flex items-center gap-1 transition-colors group"
                >
                    <Sparkles size={12} className="group-hover:rotate-12 transition-transform"/> Differentiate
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
