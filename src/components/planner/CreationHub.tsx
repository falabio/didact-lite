"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, 
    Sparkles, 
    Upload, 
    FileText, 
    Trash2, 
    Plus, 
    ArrowRight,
    User,
    Book,
    GraduationCap,
    Calendar,
    Clock,
    FileSearch,
    Search,
    ChevronDown,
    Check,
    X,
    Printer
} from 'lucide-react';
import { SchemeRow } from '../../types';
import { SUBJECTS, CLASSES, TERMS, CONTENT_DEPTHS, SESSIONS, DURATIONS, PERIOD_COUNTS, PERIOD_DURATIONS } from '../../lib/constants';

interface CreationHubProps {
    activeTab: string;
    teacherName: string;
    subject: string;
    classGrade: string;
    term: string;
    session: string;
    lessonDuration: string;
    pagesPerLesson: string;
    items: SchemeRow[];
    setTeacherName: (v: string) => void;
    setSubject: (v: string) => void;
    setClassGrade: (v: string) => void;
    setTerm: (v: string) => void;
    setSession: (v: string) => void;
    setLessonDuration: (v: string) => void;
    setPagesPerLesson: (v: string) => void;
    setItems: (v: SchemeRow[]) => void;
    numPeriods: string;
    setNumPeriods: (v: string) => void;
    periodConfig: Record<string, string>;
    setPeriodConfig: (v: Record<string, string>) => void;
    onGenerate: () => void;
    onBack: () => void;
    isPremium: boolean;
    loading?: boolean;
    loadingStep?: number;
    loadingMessage?: string;
    loadingProgress?: number;
    error?: string;
}

export default function CreationHub({
    activeTab, teacherName, subject, classGrade, term, session, lessonDuration, pagesPerLesson, items,
    numPeriods, setNumPeriods, periodConfig, setPeriodConfig,
    setTeacherName, setSubject, setClassGrade, setTerm, setSession, setLessonDuration, setPagesPerLesson, setItems,
    onGenerate, onBack, isPremium, loading = false, loadingStep = 0, loadingMessage = "", loadingProgress = 0, error = "",
    onGenerateTopicExam
}: CreationHubProps & { onGenerateTopicExam?: (topic: string, classGrade: string) => void }) {
    const [step, setStep] = useState(1);
    const [isTopicBuilderActive, setIsTopicBuilderActive] = useState(false);
    const [topicSearchQuery, setTopicSearchQuery] = useState("");
    const [bulkText, setBulkText] = useState("");
    const [isExtracting, setIsExtracting] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [subjectSearch, setSubjectSearch] = useState("");
    const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

    const filteredSubjects = SUBJECTS.filter(s => 
        s.toLowerCase().includes(subjectSearch.toLowerCase())
    );

    const totalSteps = 8;

    const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const stepTitles = [
        "Teacher Identity",
        "Subject Selection",
        "Class Selection",
        "Academic Timing",
        "Number of Periods",
        "Period Durations",
        "Content Depth",
        "Curriculum Topics"
    ];
    const loadingStates = [
        "Analyzing Curriculum",
        "Structuring Pedagogy",
        "Generating Content",
        "Finalizing Documents"
    ];

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isPremium) {
            setUploadError("Premium feature: Please upgrade to extract topics from files.");
            return;
        }

        setIsExtracting(true);
        setUploadError("");
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/extract-topics', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error("Extraction failed");
            const data = await res.json();
            if (Array.isArray(data)) {
                setItems(data);
                setStep(2); // Jump to topics view
            }
        } catch (err) {
            setUploadError("Failed to extract topics. Please try again or paste manually.");
        } finally {
            setIsExtracting(false);
        }
    };

    const handleBulkParse = async () => {
        if (!bulkText.trim()) return;
        setIsExtracting(true);
        try {
            const res = await fetch('/api/parse-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: bulkText })
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setItems(data);
                setBulkText("");
            }
        } catch (e) {
            setUploadError("Failed to parse text.");
        } finally {
            setIsExtracting(false);
        }
    };

    const handlePrintOutline = () => {
        const originalTitle = document.title;
        const cleanSubject = subject.replace(/[^a-zA-Z0-9]+/g, '_');
        const cleanGrade = classGrade.replace(/[^a-zA-Z0-9]+/g, '_');
        const title = `${cleanSubject}_${cleanGrade}_Curriculum_Outline`;
        document.title = title;
        setTimeout(() => {
            window.print();
            setTimeout(() => {
                document.title = originalTitle;
            }, 100);
        }, 100);
    };

    return (
        <>
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full max-w-4xl mx-auto bg-white rounded-[40px] shadow-2xl border border-zinc-100 overflow-hidden print:hidden"
            >
            {/* Header */}
            <div className="p-8 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/50">
                <button 
                    onClick={step === 1 ? onBack : prevStep} 
                    className="p-2 hover:bg-white rounded-full transition-all text-zinc-400 hover:text-black"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="text-center">
                    <h2 className="text-2xl font-black tracking-tight text-black capitalize">{activeTab} Configuration</h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Step {step} of {totalSteps}: {stepTitles[step - 1]}</p>
                    </div>
                </div>
                <div className="w-10">
                    {step > 1 && (
                        <div className="text-[10px] font-black text-zinc-300 bg-zinc-100 px-2 py-1 rounded-md">
                            {Math.round((step / totalSteps) * 100)}%
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full bg-zinc-100">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(step / totalSteps) * 100}%` }}
                    className="h-full bg-black"
                />
            </div>

            <div className="p-10 relative">
                {error && !loading && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600"
                    >
                        <Sparkles size={18} className="shrink-0 rotate-45" />
                        <p className="text-sm font-bold">{error}</p>
                    </motion.div>
                )}
                {loading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-50 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center"
                    >
                        {error ? (
                            <div className="space-y-6 max-w-sm">
                                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Sparkles size={40} className="rotate-45" />
                                </div>
                                <h2 className="text-3xl font-black text-black">Something went wrong</h2>
                                <p className="text-red-500 font-medium leading-relaxed bg-red-50 p-4 rounded-2xl">
                                    {error}
                                </p>
                                <button 
                                    onClick={onGenerate}
                                    className="px-8 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="w-32 h-32 relative mb-10">
                                    <div className="absolute inset-0 border-4 border-zinc-100 rounded-[40px]" />
                                    <motion.div 
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-0 border-4 border-t-black rounded-[40px]"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles size={40} className="text-black animate-pulse" />
                                    </div>
                                </div>

                                <div className="space-y-6 max-w-sm">
                                    <h2 className="text-3xl font-black text-black">Didact is Thinking</h2>
                                    <p className="text-zinc-400 font-medium leading-relaxed">
                                        We're architecting your professional lesson materials based on your specific configuration.
                                    </p>
                                </div>

                                <div className="mt-12 w-full max-w-xs space-y-4">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">
                                        <span>Progress</span>
                                        <span>{loadingProgress || Math.round(((loadingStep + 1) / loadingStates.length) * 100)}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${loadingProgress || ((loadingStep + 1) / loadingStates.length) * 100}%` }}
                                            className="h-full bg-black transition-all duration-500"
                                        />
                                    </div>
                                    <div className="text-sm font-black text-black animate-pulse">
                                        {loadingMessage || loadingStates[loadingStep] || "Processing..."}
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div 
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-md mx-auto space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <User size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-black">What's your name?</h3>
                                <p className="text-zinc-400 font-medium">This will be used for the lesson plan header.</p>
                            </div>
                            
                            <div className="relative group">
                                <input 
                                    autoFocus
                                    placeholder="Surname and Initials (e.g. Smith J.D.)"
                                    value={teacherName}
                                    onChange={e => setTeacherName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && teacherName && nextStep()}
                                    className="w-full px-6 py-5 bg-zinc-50 border border-zinc-100 rounded-3xl focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all font-bold text-xl text-center placeholder:text-zinc-200 placeholder:font-medium"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={onBack}
                                    className="flex-1 py-5 bg-zinc-100 text-zinc-500 rounded-3xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={nextStep}
                                    disabled={!teacherName}
                                    className="flex-[2] py-5 bg-black text-white rounded-3xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-3 shadow-xl shadow-black/10"
                                >
                                    Continue <ArrowRight size={20} />
                                </button>
                            </div>

                            {activeTab === 'exams' && (
                                <div className="mt-8 pt-8 border-t border-zinc-100">
                                    <h4 className="text-center text-sm font-black tracking-widest uppercase text-zinc-400 mb-4">Or use past BECE questions</h4>
                                    <button 
                                        onClick={() => { setIsTopicBuilderActive(true); setStep(9); }}
                                        className="w-full py-5 bg-blue-50 text-blue-600 rounded-3xl font-black uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Book size={20} /> BECE Topic-to-Exam Builder
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-md mx-auto space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Book size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-black">Which subject?</h3>
                                <p className="text-zinc-400 font-medium">Select a subject from the list or type to search.</p>
                            </div>

                            <div className="relative">
                                <div className="relative group">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300" size={20} />
                                    <input 
                                        autoFocus
                                        placeholder="Search subjects..."
                                        value={subjectSearch}
                                        onChange={e => {
                                            setSubjectSearch(e.target.value);
                                            setIsSubjectDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsSubjectDropdownOpen(true)}
                                        className="w-full pl-16 pr-6 py-5 bg-zinc-50 border border-zinc-100 rounded-3xl focus:bg-white focus:border-black outline-none transition-all font-bold text-lg"
                                    />
                                </div>

                                <AnimatePresence>
                                    {isSubjectDropdownOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute z-20 w-full mt-2 bg-white border border-zinc-100 rounded-3xl shadow-2xl max-h-64 overflow-y-auto custom-scrollbar p-2"
                                        >
                                            {filteredSubjects.length > 0 ? (
                                                filteredSubjects.map(s => (
                                                    <button
                                                        key={s}
                                                        onClick={() => {
                                                            setSubject(s);
                                                            setSubjectSearch("");
                                                            setIsSubjectDropdownOpen(false);
                                                            nextStep();
                                                        }}
                                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-left font-bold transition-all ${subject === s ? 'bg-black text-white' : 'hover:bg-zinc-50'}`}
                                                    >
                                                        {s}
                                                        {subject === s && <Check size={16} />}
                                                    </button>
                                                ))
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setSubject(subjectSearch);
                                                        setSubjectSearch("");
                                                        setIsSubjectDropdownOpen(false);
                                                        nextStep();
                                                    }}
                                                    className="w-full px-4 py-3 rounded-2xl text-left font-bold hover:bg-zinc-50 text-blue-600"
                                                >
                                                    Use "{subjectSearch}"
                                                </button>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex flex-wrap gap-2 justify-center">
                                {["Mathematics", "English Language", "Basic Science"].map(s => (
                                    <button 
                                        key={s}
                                        onClick={() => { setSubject(s); nextStep(); }}
                                        className="px-4 py-2 rounded-full border border-zinc-200 text-xs font-bold text-zinc-500 hover:border-black hover:text-black transition-all"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={prevStep}
                                className="w-full py-5 bg-zinc-100 text-zinc-500 rounded-3xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                            >
                                Back
                            </button>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div 
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-md mx-auto space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <GraduationCap size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-black">What class?</h3>
                                <p className="text-zinc-400 font-medium">Select the target grade level.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {CLASSES.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { setClassGrade(c); nextStep(); }}
                                        className={`px-4 py-6 rounded-3xl border-2 font-black transition-all ${classGrade === c ? 'border-black bg-black text-white shadow-xl scale-[1.02]' : 'border-zinc-50 bg-zinc-50 text-zinc-400 hover:border-zinc-200 hover:bg-white hover:text-black'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={prevStep}
                                className="w-full py-5 bg-zinc-100 text-zinc-500 rounded-3xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                            >
                                Back
                            </button>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div 
                            key="step4"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-md mx-auto space-y-10"
                        >
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Calendar size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-black">Timing & Session</h3>
                                <p className="text-zinc-400 font-medium">Define the academic timeframe.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Current Term</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {TERMS.map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setTerm(t)}
                                                className={`px-3 py-4 rounded-2xl text-xs font-black transition-all ${term === t ? 'bg-black text-white shadow-lg' : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100'}`}
                                            >
                                                {t.split(" ")[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Academic Session</label>
                                    <div className="relative group">
                                        <select 
                                            value={session}
                                            onChange={e => setSession(e.target.value)}
                                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:bg-white focus:border-black outline-none transition-all font-bold appearance-none"
                                        >
                                            {SESSIONS.map(s => <option key={s}>{s}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={prevStep}
                                    className="flex-1 py-5 bg-zinc-100 text-zinc-500 rounded-3xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={nextStep}
                                    className="flex-[2] py-5 bg-black text-white rounded-3xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10"
                                >
                                    Continue <ArrowRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 5 && (
                        <motion.div 
                            key="step5"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-md mx-auto space-y-10"
                        >
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Plus size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-black">Number of Periods</h3>
                                <p className="text-zinc-400 font-medium">How many periods per week for this subject?</p>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                {PERIOD_COUNTS.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { setNumPeriods(c); nextStep(); }}
                                        className={`px-4 py-8 rounded-3xl border-2 font-black transition-all ${numPeriods === c ? 'border-black bg-black text-white shadow-xl scale-[1.02]' : 'border-zinc-50 bg-zinc-50 text-zinc-400 hover:border-zinc-200 hover:bg-white hover:text-black'}`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={prevStep}
                                className="w-full py-5 bg-zinc-100 text-zinc-500 rounded-3xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                            >
                                Back
                            </button>
                        </motion.div>
                    )}

                    {step === 6 && (
                        <motion.div 
                            key="step6"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-md mx-auto space-y-10"
                        >
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Clock size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-black">Period Durations</h3>
                                <p className="text-zinc-400 font-medium">Set the duration for each individual period.</p>
                            </div>

                            <div className="space-y-4">
                                {Array.from({ length: parseInt(numPeriods) }).map((_, i) => (
                                    <div key={i} className="flex items-center gap-4 p-6 bg-zinc-50 border border-zinc-100 rounded-3xl">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-zinc-300 border border-zinc-100">
                                            P{i + 1}
                                        </div>
                                        <div className="flex-1 relative">
                                            <select 
                                                value={periodConfig[`p${i + 1}`] || "40 mins"}
                                                onChange={e => {
                                                    setPeriodConfig({
                                                        ...periodConfig,
                                                        [`p${i + 1}`]: e.target.value
                                                    });
                                                }}
                                                className="w-full pl-0 pr-8 bg-transparent font-black text-lg outline-none appearance-none"
                                            >
                                                {PERIOD_DURATIONS.map(d => <option key={d}>{d}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={16} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={prevStep}
                                    className="flex-1 py-5 bg-zinc-100 text-zinc-500 rounded-3xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                                >
                                    Back
                                </button>
                                <button 
                                    onClick={nextStep}
                                    className="flex-[2] py-5 bg-black text-white rounded-3xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/10"
                                >
                                    Continue <ArrowRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 7 && (
                        <motion.div 
                            key="step5"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-md mx-auto space-y-10"
                        >
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Clock size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-black">Content Detail</h3>
                                <p className="text-zinc-400 font-medium">How detailed should each generated lesson be?</p>
                            </div>

                            <div className="space-y-4">
                                {CONTENT_DEPTHS.map(d => (
                                    <button
                                        key={d}
                                        onClick={() => { setPagesPerLesson(d); nextStep(); }}
                                        className={`w-full flex items-center justify-between px-8 py-6 rounded-3xl border-2 font-black transition-all ${pagesPerLesson === d ? 'border-black bg-black text-white shadow-xl scale-[1.02]' : 'border-zinc-50 bg-zinc-50 text-zinc-400 hover:border-zinc-200 hover:bg-white hover:text-black'}`}
                                    >
                                        {d}
                                        {pagesPerLesson === d && <Check size={20} />}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={prevStep}
                                className="w-full py-5 bg-zinc-100 text-zinc-500 rounded-3xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                            >
                                Back
                            </button>
                        </motion.div>
                    )}
                    {step === 8 && (
                        <motion.div 
                            key="step6"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            {/* Topic Input Options */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Option A: Smart Extraction</h3>
                                    <div className={`relative border-2 border-dashed rounded-[32px] p-10 text-center transition-all ${isExtracting ? 'bg-zinc-50 border-zinc-200' : 'border-zinc-100 hover:border-black hover:bg-zinc-50/50'}`}>
                                        {isExtracting ? (
                                            <div className="space-y-4">
                                                <div className="w-12 h-12 border-4 border-zinc-100 border-t-black rounded-full animate-spin mx-auto" />
                                                <p className="text-sm font-bold text-black animate-pulse">Analyzing document...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <input 
                                                    type="file" 
                                                    onChange={handleFileUpload}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    accept="image/*,application/pdf"
                                                />
                                                <div className="space-y-4">
                                                    <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                                                        <Upload size={32} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-black">Upload Scheme of Work</p>
                                                        <p className="text-xs text-zinc-400 mt-1">Pictures or PDFs supported</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        {uploadError && <p className="text-[10px] text-red-500 font-bold mt-4 uppercase tracking-tighter">{uploadError}</p>}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Option B: Bulk Paste</h3>
                                    <div className="relative">
                                        <textarea 
                                            placeholder="Paste your topics here. One per line or with dates..."
                                            value={bulkText}
                                            onChange={e => setBulkText(e.target.value)}
                                            className="w-full h-48 p-6 bg-zinc-50 border border-zinc-100 rounded-[32px] focus:bg-white focus:border-black outline-none transition-all font-medium text-sm resize-none"
                                        />
                                        <button 
                                            onClick={handleBulkParse}
                                            disabled={!bulkText.trim() || isExtracting}
                                            className="absolute bottom-4 right-4 px-4 py-2 bg-black text-white rounded-full text-[10px] font-black uppercase tracking-widest disabled:opacity-30"
                                        >
                                            Parse Text
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Topics List */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Curriculum Structure ({items.length} Weeks)</h3>
                                    <div className="flex items-center gap-6">
                                        {items.length > 0 && (
                                            <>
                                                <button 
                                                    onClick={handlePrintOutline}
                                                    className="flex items-center gap-2 text-xs font-black text-zinc-600 hover:text-black transition-colors"
                                                >
                                                    <Printer size={14}/> Print Outline
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if(window.confirm("Clear all topics?")) setItems([]);
                                                    }}
                                                    className="flex items-center gap-2 text-xs font-black text-red-500 hover:text-red-600 transition-colors"
                                                >
                                                    <X size={14}/> Clear All
                                                </button>
                                            </>
                                        )}
                                        <button 
                                            onClick={() => setItems([...items, { week: String(items.length + 1), startDate: "", endDate: "", topic: "", objectives: "" }])}
                                            className="flex items-center gap-2 text-xs font-black text-blue-600 hover:text-blue-700 transition-colors"
                                        >
                                            <Plus size={14}/> Add Week
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {items.map((item, idx) => (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            key={idx} 
                                            className="flex gap-4 p-4 bg-zinc-50/50 border border-zinc-100 rounded-2xl group hover:border-black/10 transition-all"
                                        >
                                            <div className="w-10 h-10 shrink-0 bg-white border border-zinc-200 rounded-xl flex items-center justify-center text-xs font-black text-zinc-400">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <input 
                                                    placeholder="Topic Name"
                                                    value={item.topic}
                                                    onChange={e => {
                                                        const newItems = [...items];
                                                        newItems[idx].topic = e.target.value;
                                                        setItems(newItems);
                                                    }}
                                                    className="bg-transparent border-none outline-none font-bold text-zinc-800 placeholder:text-zinc-300 w-full"
                                                />
                                                <input 
                                                    placeholder="Learning Objectives (Optional)"
                                                    value={item.objectives}
                                                    onChange={e => {
                                                        const newItems = [...items];
                                                        newItems[idx].objectives = e.target.value;
                                                        setItems(newItems);
                                                    }}
                                                    className="bg-transparent border-none outline-none text-xs font-medium text-zinc-400 placeholder:text-zinc-200 w-full"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => setItems(items.filter((_, i) => i !== idx))}
                                                className="p-2 text-zinc-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-10 flex justify-between items-center border-t border-zinc-100">
                                <button onClick={prevStep} className="text-sm font-bold text-zinc-400 hover:text-black transition-all">
                                    Back to Configuration
                                </button>
                                <button 
                                    onClick={onGenerate}
                                    disabled={items.length === 0 || !subject}
                                    className="btn-primary px-12 py-5 shadow-2xl bg-black text-white rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100"
                                >
                                    <Sparkles size={20}/>
                                    Generate {activeTab === 'planner' ? 'Lesson Plan' : activeTab}
                                </button>
                            </div>
                        </motion.div>
                    )}
                    {step === 9 && isTopicBuilderActive && (
                        <motion.div 
                            key="step9"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="max-w-md mx-auto space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Book size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-black">Topic-to-Exam Builder</h3>
                                <p className="text-zinc-400 font-medium">Type a topic to automatically pull relevant past BECE questions (2018-2025).</p>
                            </div>

                            <div className="relative group">
                                <input 
                                    autoFocus
                                    placeholder="e.g. Electrical Energy, Algebra..."
                                    value={topicSearchQuery}
                                    onChange={e => setTopicSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && topicSearchQuery && onGenerateTopicExam?.(topicSearchQuery, classGrade)}
                                    className="w-full px-6 py-5 bg-zinc-50 border border-zinc-100 rounded-3xl focus:bg-white focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all font-bold text-xl text-center placeholder:text-zinc-200 placeholder:font-medium"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => { setIsTopicBuilderActive(false); setStep(1); }}
                                    className="flex-1 py-5 bg-zinc-100 text-zinc-500 rounded-3xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => onGenerateTopicExam?.(topicSearchQuery, classGrade)}
                                    disabled={!topicSearchQuery}
                                    className="flex-[2] py-5 bg-black text-white rounded-3xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-3 shadow-xl shadow-black/10"
                                >
                                    Build Exam <ArrowRight size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>

            {/* Curriculum Outline Print Layout */}
            <div className="hidden print:block font-serif text-black leading-relaxed" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                <style>{`
                    @media print {
                        @page {
                            margin: 0;
                        }
                        body {
                            padding: 1.6cm !important;
                            margin: 0 !important;
                            background: #fff !important;
                        }
                    }
                `}</style>
                <div className="text-center space-y-4 pb-6 border-b-2 border-black mb-8">
                    <h1 className="text-3xl font-extrabold uppercase m-0">{term} Curriculum Outline</h1>
                    <p className="text-lg font-medium uppercase m-0">
                        {subject} • {classGrade} • {session}
                    </p>
                    {teacherName && <p className="text-xs uppercase m-0">Master Teacher: {teacherName}</p>}
                </div>

                <table className="w-full border-collapse border border-black text-sm">
                    <thead>
                        <tr>
                            <th className="border border-black p-2 text-left font-bold uppercase w-16">Week</th>
                            <th className="border border-black p-2 text-left font-bold uppercase">Topic / Content Outline</th>
                            <th className="border border-black p-2 text-left font-bold uppercase">Learning Objectives / Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="border border-black p-2 font-bold text-center">{idx + 1}</td>
                                <td className="border border-black p-2 font-bold">{item.topic || 'Not Specified'}</td>
                                <td className="border border-black p-2">{item.objectives || 'None Specified'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
