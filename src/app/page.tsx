"use client";

import { useState, useEffect, useRef } from 'react';
import { BookOpen, Sparkles, History, Loader2, ArrowRight } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';

import dynamic from 'next/dynamic';

// Component Imports
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import ProgressiveStepper from '../components/planner/ProgressiveStepper';
import HistorySidebar from '../components/planner/HistorySidebar';
import OmniSearch from '../components/planner/OmniSearch';
import AgenticSidebar from '../components/workspace/AgenticSidebar';

// Types
import { SchemeRow, AppTab } from '../types';
import CreationHub from '../components/planner/CreationHub';
import QuestionBank from '../components/workspace/QuestionBank';

const DocumentWorkspace = dynamic(() => import('../components/editor/DocumentWorkspace'), { ssr: false });
const PremiumModal = dynamic(() => import('../components/monetization/PremiumModal'), { ssr: false });

export default function Home() {
    const { user, isSignedIn, isLoaded } = useUser();
    
    // Premium Logic
    const isPremium = !!(
        (user?.publicMetadata?.premiumUntil && new Date(user.publicMetadata.premiumUntil as string) > new Date()) || 
        user?.publicMetadata?.isPremium === true || 
        process.env.NODE_ENV === 'development' ||
        user?.primaryEmailAddress?.emailAddress === process.env.NEXT_PUBLIC_ADMIN_EMAIL
    );

    const initializePayment = (callbacks?: { onSuccess: () => void, onClose: () => void }) => {
        // @ts-ignore
        if (typeof window !== "undefined" && window.PaystackPop) {
            // @ts-ignore
            const handler = window.PaystackPop.setup({
                key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
                email: user?.primaryEmailAddress?.emailAddress || "test@example.com",
                amount: 3500 * 100,
                ref: new Date().getTime().toString(),
                callback: callbacks?.onSuccess || (() => {}),
                onClose: callbacks?.onClose || (() => {}),
            });
            handler.openIframe();
        } else {
            alert("Payment module is loading...");
        }
    };

    // UI State
    const [activeTab, setActiveTab] = useState<AppTab>('planner');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [isWorkspaceActive, setIsWorkspaceActive] = useState(false);
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

    // Auto-open config when switching to Tests/Exams from Sidebar
    const handleTabChange = (tab: AppTab) => {
        setActiveTab(tab);
        if (tab === 'tests' || tab === 'exams') {
            setIsConfigOpen(true);
        } else if (tab === 'planner') {
            setIsConfigOpen(false);
        }
    };
    
    // Generation State
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState("");
    const abortControllerRef = useRef<AbortController | null>(null);

    // Form Data
    const [teacherName, setTeacherName] = useState("");
    const [subject, setSubject] = useState("Mathematics");
    const [classGrade, setClassGrade] = useState("JSS1");
    const [term, setTerm] = useState("First Term");
    const [session, setSession] = useState("2025/2026 Session");
    const [schoolName, setSchoolName] = useState("");
    const [periodConfig, setPeriodConfig] = useState<Record<string, string>>({ p1: '40 mins', p2: '40 mins' });
    const [numPeriods, setNumPeriods] = useState("1");
    const [generatedDocs, setGeneratedDocs] = useState<any[]>([]);
    const [activePrintWeek, setActivePrintWeek] = useState<string | null>(null);
    const [contentLength, setContentLength] = useState("Standard");
    const [includeSow, setIncludeSow] = useState(true);
    const [items, setItems] = useState<SchemeRow[]>([
        { week: "1", startDate: "", endDate: "", topic: "", objectives: "" }
    ]);
    const [lessonDuration, setLessonDuration] = useState("40 mins");
    const [pagesPerLesson, setPagesPerLesson] = useState("Standard (1-2 pages)");
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const midtermWeek = "6";

    // Results
    const [generatedPlan, setGeneratedPlan] = useState<any>(null);
    const [savedHistory, setSavedHistory] = useState<any[]>([]);

    // Chat State
    const [chatMessages, setChatMessages] = useState<{role: 'user' | 'bot', content: string}[]>([
        { role: 'bot', content: "Hello! I'm Didact. How can I help you optimize your teaching today?" }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Persistence
    useEffect(() => {
        const saved = localStorage.getItem("lessonPlannerHistory");
        if (saved) setSavedHistory(JSON.parse(saved));

        const draft = localStorage.getItem("lessonPlannerDraft");
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (parsed.subject) setSubject(parsed.subject);
                if (parsed.classGrade) setClassGrade(parsed.classGrade);
                if (parsed.teacherName) setTeacherName(parsed.teacherName);
                if (parsed.session) setSession(parsed.session);
                if (parsed.items) setItems(parsed.items);
            } catch (e) {}
        }
    }, []);

    useEffect(() => {
        const draft = { subject, classGrade, term, teacherName, session, items, periodConfig, contentLength, schoolName };
        localStorage.setItem("lessonPlannerDraft", JSON.stringify(draft));
    }, [subject, classGrade, term, teacherName, session, items, periodConfig, contentLength, schoolName]);

    // Handlers
    const saveToHistory = (type: string, data: any) => {
        const newEntry = {
            id: Date.now(),
            type, subject, classGrade, term, teacherName, session, schoolName, items, periodConfig, data,
            date: new Date().toLocaleDateString()
        };
        const updated = [newEntry, ...savedHistory].slice(0, 15);
        setSavedHistory(updated);
        localStorage.setItem("lessonPlannerHistory", JSON.stringify(updated));
    };

    const loadHistoryEntry = (entry: any) => {
        setSubject(entry.subject);
        setClassGrade(entry.classGrade);
        setTerm(entry.term);
        setTeacherName(entry.teacherName);
        setSession(entry.session);
        if (entry.schoolName) setSchoolName(entry.schoolName);
        setItems(entry.items);
        if (entry.type === 'Plan') {
            setGeneratedPlan(entry.data);
            setIsWorkspaceActive(true);
        }
        setHistoryOpen(false);
    };

    const deleteHistoryEntry = (index: number) => {
        if (!window.confirm("Delete this saved document?")) return;
        const updated = [...savedHistory];
        updated.splice(index, 1);
        setSavedHistory(updated);
        localStorage.setItem("lessonPlannerHistory", JSON.stringify(updated));
    };

    const clearAllHistory = () => {
        if (!window.confirm("Are you sure?")) return;
        setSavedHistory([]);
        localStorage.removeItem("lessonPlannerHistory");
    };

    const handleHome = () => {
        setIsConfigOpen(false);
        setIsWorkspaceActive(false);
        setGeneratedPlan(null);
    };

    const generatePlan = async () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;
        setLoading(true); setError("");
        try {
            const reqItems = items.filter(i => i.week !== midtermWeek).map(i => ({ 
                ...i, 
                dates: i.startDate && i.endDate ? `${i.startDate} to ${i.endDate}` : i.startDate || i.endDate 
            }));
            const endpoint = activeTab === 'planner' ? '/api/generate-plan' : 
                             activeTab === 'tests' ? '/api/generate-test' : '/api/generate-exam';

            let requestBody: any = { 
                term, subject, classGrade, items: reqItems, 
                periodConfig: { p1: lessonDuration, p2: lessonDuration }, 
                contentLength: pagesPerLesson, 
                includeSow, session, teacherName 
            };

            if (activeTab === 'tests') {
                requestBody = {
                    title: `${classGrade} ${subject} - ${term} Test`,
                    subject,
                    classGrade,
                    term,
                    teacherName,
                    schoolName,
                    items: reqItems,
                    planContext: generatedPlan || reqItems,
                    bloomLevel: "Remembering, Understanding, and Applying",
                    duration: "40 Minutes",
                    types: ["mcq", "fill_in_gap", "theory"]
                };
            } else if (activeTab === 'exams') {
                requestBody = {
                    subject,
                    classGrade,
                    term,
                    teacherName,
                    schoolName,
                    topics: reqItems,
                    planContent: generatedPlan || reqItems,
                    bloomLevel: "Mixed (Remembering, Understanding, Applying, Analyzing, Evaluating)",
                    duration: "2 Hours"
                };
            }

            const response = await fetch(endpoint, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error("Generation failed.");
            const reader = response.body?.getReader();
            if (!reader) throw new Error("No stream.");
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(Boolean);
                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.status === 'planning') setLoadingStep(0);
                        if (parsed.status === 'verifying') setLoadingStep(1);
                        if (parsed.status === 'refining') setLoadingStep(2);
                        if (parsed.status === 'generating') {
                            setLoadingStep(2);
                            setLoadingMessage(parsed.message);
                            setLoadingProgress(parsed.progress);
                        }
                        if (parsed.status === 'error') {
                            if (parsed.upgradeRequired) {
                                setIsPremiumModalOpen(true);
                                setLoading(false);
                                controller.abort();
                                return;
                            }
                            throw new Error(parsed.message || "Generation failed.");
                        }
                        if (parsed.status === 'complete' && parsed.data) {
                            setLoadingStep(3);
                            const targetYear = session || "2025/2026 Session";
                            const cleanJSON = JSON.stringify(parsed.data).replaceAll("2024/2025", targetYear);
                            const cleanedData = JSON.parse(cleanJSON);
                            setGeneratedPlan(cleanedData);
                            saveToHistory("Plan", cleanedData);
                            setIsWorkspaceActive(true);
                            setIsConfigOpen(false);
                            if (cleanedData.weeklyPlans) setGeneratedDocs(cleanedData.weeklyPlans);
                        }
                    } catch (e: any) {
                        if (e.message && !e.message.startsWith("Unexpected token")) throw e;
                    }
                }
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') setError(err.message);
        } finally { 
            setLoading(false); 
            // Fallback error if stream closed without completion
            if (!generatedPlan && !error) {
                // Check if we actually got some data but not 'complete'
                setError("Generation was interrupted. This can happen due to network issues or AI limits. Please try again.");
            }
        }
    };

    const handleTopicExamGeneration = async (topic: string, classGrade: string) => {
        setLoading(true);
        setError("");
        setLoadingStep(0);
        setLoadingMessage("Pulling past BECE questions...");
        setLoadingProgress(30);

        try {
            const res = await fetch('/api/topic-exam', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, classGrade })
            });

            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || "Failed to generate topic exam.");
            }

            setLoadingProgress(100);
            setLoadingStep(3);
            setGeneratedPlan(data);
            saveToHistory("Exam", data);
            setIsWorkspaceActive(true);
            setIsConfigOpen(false);
            
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendChat = async (overrideMsg?: string) => {
        const msgToUse = overrideMsg || chatInput;
        if (!msgToUse.trim() || chatLoading) return;
        const userMsg = msgToUse.trim();
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatLoading(true);
        try {
            const res = await fetch('/api/support', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [...chatMessages, { role: 'user', content: userMsg }] })
            });
            const data = await res.json();
            setChatMessages(prev => [...prev, { role: 'bot', content: data.content }]);
        } catch (e) {
            setChatMessages(prev => [...prev, { role: 'bot', content: "Support unavailable." }]);
        } finally { setChatLoading(false); }
    };

    if (!isLoaded) return null;

    return (
        <div className="min-h-screen flex flex-col relative bg-[#FAFAFA]">
            <Script src="https://js.paystack.co/v1/inline.js" strategy="lazyOnload" />
            
            <Navbar 
                isSignedIn={isSignedIn} 
                onHistoryOpen={() => setHistoryOpen(true)} 
                onMenuOpen={() => setIsMenuOpen(true)} 
                onHome={handleHome}
            />

            <Sidebar 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                activeTab={activeTab} 
                setActiveTab={handleTabChange} 
                isPremium={isPremium} 
                isSignedIn={isSignedIn}
                onUpgrade={initializePayment}
            />

            {!isWorkspaceActive ? (
                <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-10 pb-32 print:p-0">
                    <AnimatePresence mode="wait">
                        {activeTab === 'bank' ? (
                            <QuestionBank key="bank" />
                        ) : isConfigOpen ? (
                            <CreationHub 
                                key="config"
                                activeTab={activeTab}
                                teacherName={teacherName}
                                subject={subject}
                                classGrade={classGrade}
                                term={term}
                                session={session}
                                lessonDuration={lessonDuration}
                                pagesPerLesson={pagesPerLesson}
                                items={items}
                                setTeacherName={setTeacherName}
                                setSubject={setSubject}
                                setClassGrade={setClassGrade}
                                setTerm={setTerm}
                                setSession={setSession}
                                setLessonDuration={setLessonDuration}
                                setPagesPerLesson={setPagesPerLesson}
                                setItems={setItems}
                                numPeriods={numPeriods}
                                setNumPeriods={setNumPeriods}
                                periodConfig={periodConfig}
                                setPeriodConfig={setPeriodConfig}
                                onGenerate={generatePlan}
                                onBack={() => setIsConfigOpen(false)}
                                isPremium={isPremium}
                                loading={loading}
                                loadingStep={loadingStep}
                                loadingMessage={loadingMessage}
                                loadingProgress={loadingProgress}
                                error={error}
                                onGenerateTopicExam={handleTopicExamGeneration}
                            />
                        ) : (
                            <motion.div 
                                key="search"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="h-[60vh] flex flex-col items-center justify-center space-y-12"
                            >
                                <div className="text-center space-y-4">
                                    <h1 className="text-6xl font-black tracking-tighter text-black">What would you like to teach today?</h1>
                                    <p className="text-xl text-zinc-400 font-medium tracking-tight">Generate professional lesson plans and assessments in seconds.</p>
                                </div>

                                <button 
                                    onClick={() => setIsConfigOpen(true)}
                                    className="group flex items-center gap-4 px-12 py-6 bg-black text-white rounded-[32px] text-lg font-black hover:scale-105 transition-all shadow-2xl shadow-black/20"
                                >
                                    <Sparkles size={24} className="text-yellow-400 animate-pulse"/>
                                    Generate Lesson
                                    <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            ) : (
                <main className="flex-1 w-full flex overflow-hidden h-[calc(100vh-64px)] print:h-auto print:overflow-visible">
                    {/* Left Pane: Agentic Sidebar */}
                    <div className="w-80 shrink-0 h-full hidden md:block print:hidden shadow-xl z-10">
                        <AgenticSidebar 
                            subject={subject}
                            classGrade={classGrade}
                            schoolName={schoolName}
                            term={term}
                            session={session}
                            teacherName={teacherName}
                            chatMessages={chatMessages}
                            chatInput={chatInput}
                            setChatInput={setChatInput}
                            onSendChat={() => handleSendChat()}
                            loading={chatLoading}
                            chatEndRef={chatEndRef}
                            onUpdateContext={(field, val) => {
                                if (field === 'subject') setSubject(val);
                                if (field === 'classGrade') setClassGrade(val);
                                if (field === 'schoolName') setSchoolName(val);
                                if (field === 'term') setTerm(val);
                                if (field === 'session') setSession(val);
                                if (field === 'teacherName') setTeacherName(val);
                            }}
                            generatedDocs={generatedDocs}
                            onViewDoc={(idx) => {
                                // Scroll to week or filter workspace
                                const el = document.getElementById(`week-${generatedDocs[idx].week}`);
                                el?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            onDownloadDoc={(idx) => {
                                if (!isPremium) {
                                    setIsPremiumModalOpen(true);
                                    return;
                                }
                                const weekNum = generatedDocs[idx].week;
                                setActivePrintWeek(weekNum);
                                const originalTitle = document.title;
                                const cleanSubject = subject.replace(/[^a-zA-Z0-9]+/g, '_');
                                const cleanGrade = classGrade.replace(/[^a-zA-Z0-9]+/g, '_');
                                const title = `${cleanSubject}_${cleanGrade}_Week_${weekNum}_Lesson_Plan`;
                                document.title = title;
                                setTimeout(() => {
                                    window.print();
                                    setActivePrintWeek(null);
                                }, 100);
                                setTimeout(() => {
                                    document.title = originalTitle;
                                }, 100);
                            }}
                            onDownloadAll={() => {
                                if (!isPremium) {
                                    setIsPremiumModalOpen(true);
                                    return;
                                }
                                setActivePrintWeek(null);
                                const originalTitle = document.title;
                                const cleanSubject = subject.replace(/[^a-zA-Z0-9]+/g, '_');
                                const cleanGrade = classGrade.replace(/[^a-zA-Z0-9]+/g, '_');
                                const title = `${cleanSubject}_${cleanGrade}_Lesson_Plans`;
                                document.title = title;
                                setTimeout(() => window.print(), 100);
                                setTimeout(() => {
                                    document.title = originalTitle;
                                }, 100);
                            }}
                            onPrintAll={() => {
                                if (!isPremium) {
                                    setIsPremiumModalOpen(true);
                                    return;
                                }
                                setActivePrintWeek(null);
                                const originalTitle = document.title;
                                const cleanSubject = subject.replace(/[^a-zA-Z0-9]+/g, '_');
                                const cleanGrade = classGrade.replace(/[^a-zA-Z0-9]+/g, '_');
                                const title = `${cleanSubject}_${cleanGrade}_Lesson_Plans`;
                                document.title = title;
                                setTimeout(() => window.print(), 100);
                                setTimeout(() => {
                                    document.title = originalTitle;
                                }, 100);
                            }}
                        />
                    </div>
                    
                    {/* Right Pane: Live Document */}
                    <div className="flex-1 h-full overflow-y-auto bg-zinc-50/50 p-8 print:p-0">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <ProgressiveStepper 
                                    key="stepper"
                                    loadingStep={loadingStep} 
                                    subject={subject} 
                                    activeTab={activeTab} 
                                />
                            ) : generatedPlan ? (
                                <DocumentWorkspace 
                                    key="workspace"
                                    generatedPlan={generatedPlan}
                                    term={term}
                                    subject={subject}
                                    classGrade={classGrade}
                                    session={session}
                                    teacherName={teacherName}
                                    schoolName={schoolName}
                                    printFilter={activePrintWeek}
                                    onClose={() => {
                                        setGeneratedPlan(null);
                                        setIsWorkspaceActive(false);
                                    }}
                                    onPrint={() => {
                                        const originalTitle = document.title;
                                        const cleanSubject = subject.replace(/[^a-zA-Z0-9]+/g, '_');
                                        const cleanGrade = classGrade.replace(/[^a-zA-Z0-9]+/g, '_');
                                        const title = `${cleanSubject}_${cleanGrade}_Lesson_Plans`;
                                        document.title = title;
                                        setTimeout(() => {
                                            window.print();
                                            setTimeout(() => {
                                                document.title = originalTitle;
                                            }, 100);
                                        }, 100);
                                    }}
                                    onRefine={async (text, action) => {
                                        try {
                                            const instructionMap: Record<string, string> = {
                                                rewrite: 'Rewrite this text to be clearer and more professional while preserving meaning.',
                                                simplify: 'Simplify this text so a JSS student can easily understand it. Use simpler words.',
                                                expand: 'Expand this text with more detail, examples, and explanation. Make it richer.',
                                                differentiate: 'Rewrite this text to accommodate different learning levels: provide a simplified version and an advanced version.',
                                            };
                                            const instruction = instructionMap[action as string] || `Apply this refinement: ${action}`;
                                            const res = await fetch('/api/refine', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ originalText: text, instruction })
                                            });
                                            if (!res.ok) {
                                                const err = await res.json();
                                                if (res.status === 403) {
                                                    setIsPremiumModalOpen(true);
                                                    return;
                                                }
                                                throw new Error(err.error || 'Refinement failed');
                                            }
                                            const data = await res.json();
                                            if (data.refinedText) {
                                                const planStr = JSON.stringify(generatedPlan);
                                                const originalStr = typeof text === 'string' ? text : '';
                                                if (originalStr && planStr.includes(originalStr)) {
                                                    const updatedStr = planStr.replace(originalStr, data.refinedText);
                                                    setGeneratedPlan(JSON.parse(updatedStr));
                                                } else {
                                                    navigator.clipboard?.writeText(data.refinedText);
                                                }
                                            }
                                        } catch (err: any) {
                                            console.error('Refine error:', err);
                                        }
                                    }}
                                    updatePlanField={(path, val) => {
                                        if (path === '__replace_root__') {
                                            setGeneratedPlan(val);
                                            return;
                                        }
                                        const newPlan = JSON.parse(JSON.stringify(generatedPlan));
                                        const parts = path.replace(/\]/g, '').split(/[.\[]/);
                                        let obj: any = newPlan;
                                        for (let i = 0; i < parts.length - 1; i++) {
                                            if (obj[parts[i]] !== undefined) obj = obj[parts[i]];
                                        }
                                        obj[parts[parts.length - 1]] = val;
                                        setGeneratedPlan(newPlan);
                                    }}
                                    isPremium={isPremium}
                                    onGlobalRefine={async (instruction: string) => {
                                        try {
                                            if (!instruction) return;
                                            const res = await fetch('/api/refine', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ originalContent: JSON.stringify(generatedPlan), prompt: instruction })
                                            });
                                            if (!res.ok) {
                                                const err = await res.json();
                                                if (res.status === 403) { setIsPremiumModalOpen(true); return; }
                                                throw new Error(err.error || 'Refinement failed');
                                            }
                                            const data = await res.json();
                                            if (data.updatedContent) {
                                                const cleaned = data.updatedContent.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
                                                setGeneratedPlan(JSON.parse(cleaned));
                                            }
                                        } catch (err: any) {
                                            console.error('Global refine error:', err);
                                        }
                                    }}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center text-zinc-400">
                                    Document rendering...
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>
            )}

            <HistorySidebar 
                isOpen={historyOpen}
                onClose={() => setHistoryOpen(false)}
                savedHistory={savedHistory}
                onLoadEntry={loadHistoryEntry}
                onDeleteEntry={deleteHistoryEntry}
                onClearAll={clearAllHistory}
            />

            {!isWorkspaceActive && (
                <footer className="py-20 text-center opacity-30 text-[11px] font-medium tracking-widest uppercase print:hidden">
                    Didact AI Pedagogy • {new Date().getFullYear()}
                </footer>
            )}

            <PremiumModal 
                isOpen={isPremiumModalOpen} 
                onClose={() => setIsPremiumModalOpen(false)} 
            />
        </div>
    );
}
