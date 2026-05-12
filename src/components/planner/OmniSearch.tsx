"use client";

import { useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface OmniSearchProps {
    onSearch: (query: string) => void;
}

export default function OmniSearch({ onSearch }: OmniSearchProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query.trim());
        }
    };

    const suggestions = [
        "Create a 3-week lesson plan for JSS 2 Mathematics on Algebra",
        "Generate a First Term scheme of work for Basic Science",
        "Design a quick revision test for English Language"
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-3xl mx-auto mt-32 space-y-8"
        >
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-5xl font-black tracking-tighter text-black">What would you like to teach?</h1>
                <p className="text-xl text-zinc-400 font-medium tracking-tight">Enter a topic, class, or subject, and Didact will build your workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="relative group">
                <div className={`absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[32px] blur opacity-20 transition duration-1000 group-hover:opacity-40 ${isFocused ? 'opacity-40 duration-200' : ''}`}></div>
                <div className="relative flex items-center bg-white border border-zinc-200 rounded-[30px] p-2 shadow-2xl transition-all">
                    <div className="pl-6 pr-4 text-zinc-400">
                        <Sparkles size={24} className={isFocused ? 'text-blue-500 transition-colors' : ''} />
                    </div>
                    <input 
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="e.g. JSS 3 Basic Tech on Woodwork..."
                        className="flex-1 bg-transparent border-none outline-none text-xl text-zinc-800 placeholder:text-zinc-300 py-4 font-medium"
                    />
                    <button 
                        type="submit"
                        disabled={!query.trim()}
                        className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 mr-1"
                    >
                        <ArrowRight size={24} />
                    </button>
                </div>
            </form>

            <div className="flex flex-wrap justify-center gap-3 pt-8">
                {suggestions.map((s, i) => (
                    <button 
                        key={i}
                        onClick={() => onSearch(s)}
                        className="px-4 py-2 bg-zinc-50 border border-zinc-100 rounded-full text-xs font-bold text-zinc-500 hover:text-black hover:bg-zinc-100 hover:border-zinc-200 transition-all cursor-pointer"
                    >
                        {s}
                    </button>
                ))}
            </div>
        </motion.div>
    );
}
