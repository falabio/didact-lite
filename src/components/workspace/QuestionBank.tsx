"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Search, Download, Trash2, Filter, Loader2 } from 'lucide-react';

export default function QuestionBank() {
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('All');
    const [subjects, setSubjects] = useState<string[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/bank?q=${encodeURIComponent(search)}&subject=${encodeURIComponent(subjectFilter)}`);
            const data = await res.json();
            setQuestions(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Fetch Questions Error:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await fetch('/api/get-subjects');
            const data = await res.json();
            setSubjects(['All', ...(Array.isArray(data) ? data : [])]);
        } catch (e) {}
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        const timer = setTimeout(fetchQuestions, 500);
        return () => clearTimeout(timer);
    }, [search, subjectFilter]);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Delete this question from the bank?")) return;
        try {
            const res = await fetch(`/api/bank?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setQuestions(prev => prev.filter(q => q.id !== id));
            } else {
                const errorData = await res.json();
                alert(`Failed to delete: ${errorData.error || 'Unknown error'}`);
            }
        } catch (e) {
            alert("Failed to delete question due to a network error.");
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl mx-auto space-y-10"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter text-black">Question Bank</h1>
                    <p className="text-zinc-500 font-medium">Browse and manage your generated pedagogical content.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18}/>
                        <input 
                            placeholder="Search questions..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:border-black outline-none transition-all text-sm w-64 shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-3 rounded-2xl transition-all shadow-sm ${showFilters ? 'bg-black text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}
                    >
                        <Filter size={18}/>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 bg-white border border-zinc-100 rounded-[32px] shadow-sm flex flex-wrap gap-3">
                            {subjects.map(s => (
                                <button 
                                    key={s}
                                    onClick={() => setSubjectFilter(s)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${subjectFilter === s ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="animate-spin text-zinc-300" size={48} />
                    </div>
                ) : questions.length > 0 ? (
                    questions.map(q => (
                        <motion.div 
                            layout
                            key={q.id} 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400">
                                    <History size={20}/>
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="space-y-2 flex-1">
                                            <p className="font-bold text-black leading-relaxed">{q.question_text}</p>
                                            
                                            {/* Diagrams */}
                                            {q.has_diagram && q.diagram_image_path && (
                                                <div className="mt-4 mb-4 rounded-xl overflow-hidden border border-zinc-100 max-w-sm">
                                                    <img src={q.diagram_image_path} alt="Diagram" className="w-full h-auto" />
                                                </div>
                                            )}

                                            {/* Options */}
                                            {q.option_a && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                                    {[
                                                        { label: 'A', val: q.option_a },
                                                        { label: 'B', val: q.option_b },
                                                        { label: 'C', val: q.option_c },
                                                        { label: 'D', val: q.option_d }
                                                    ].map(opt => opt.val && (
                                                        <div key={opt.label} className="flex gap-2 text-sm bg-zinc-50/50 p-2 rounded-lg border border-zinc-100">
                                                            <span className="font-black text-zinc-400">({opt.label})</span>
                                                            <span className="text-zinc-600 font-medium">{opt.val}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-2 py-0.5 bg-zinc-50 rounded-md border border-zinc-100">{q.subject}</span>
                                                {q.academic_topics && (
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 px-2 py-0.5 bg-blue-50 rounded-md border border-blue-100">{q.academic_topics}</span>
                                                )}
                                                {q.year && (
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Year: {q.year}</span>
                                                )}
                                                {q.correct_answer && (
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-green-600 px-2 py-0.5 bg-green-50 rounded-md border border-green-100">Ans: {q.correct_answer}</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button className="p-2 text-zinc-400 hover:text-black transition-colors"><Download size={18}/></button>
                                            <button onClick={() => handleDelete(q.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="p-20 text-center bg-zinc-50/50 rounded-[40px] border border-dashed border-zinc-200">
                        <p className="text-zinc-400 font-medium">No questions found. Try a different search or filter.</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
