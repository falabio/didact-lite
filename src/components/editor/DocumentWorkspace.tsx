"use client";

import { useState, useEffect } from 'react';
import { Printer, Sparkles, Wand2 } from 'lucide-react';
import { motion } from 'framer-motion';
import MarkdownBlock from '../common/MarkdownBlock';
import RefinementToolbar from './RefinementToolbar';
import GlobalRefinePalette from './GlobalRefinePalette';
import ShareWhatsApp from '../common/ShareWhatsApp';
import { Loader2, Download } from 'lucide-react';

interface DocumentWorkspaceProps {
    generatedPlan: any;
    term: string;
    subject: string;
    classGrade: string;
    session: string;
    teacherName: string;
    schoolName?: string;
    onClose: () => void;
    onPrint: () => void;
    onRefine: (text: string | string[], path: string) => void;
    updatePlanField: (path: string, value: any) => void;
    isPremium: boolean;
    onGlobalRefine: (instruction: string) => void;
    printFilter?: string | null;
}

export default function DocumentWorkspace({
    generatedPlan, term, subject, classGrade, session, teacherName, schoolName,
    onClose, onPrint, onRefine, updatePlanField, isPremium, onGlobalRefine,
    printFilter = null
}: DocumentWorkspaceProps) {
    const [selection, setSelection] = useState<{ text: string; rect: DOMRect; path?: string } | null>(null);
    const [isGlobalPaletteOpen, setIsGlobalPaletteOpen] = useState(false);
    const [isPredicting, setIsPredicting] = useState(false);

    const [includeQuestions, setIncludeQuestions] = useState(false);
    const [questionsMap, setQuestionsMap] = useState<Record<number, any[]>>({});
    const [fetchedWeeks, setFetchedWeeks] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (!isPremium || !generatedPlan?.weeklyPlans) return;

        generatedPlan.weeklyPlans.forEach((plan: any, idx: number) => {
            if (plan.topic && !fetchedWeeks[idx]) {
                setFetchedWeeks(prev => ({ ...prev, [idx]: true }));
                fetch(`/api/bank?q=${encodeURIComponent(plan.topic)}&subject=${encodeURIComponent(subject)}`)
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) {
                            setQuestionsMap(prev => ({
                                ...prev,
                                [idx]: data.slice(0, 5)
                            }));
                        }
                    })
                    .catch(err => {
                        console.error("Error prefetching questions for week", idx, err);
                        setFetchedWeeks(prev => ({ ...prev, [idx]: false }));
                    });
            }
        });
    }, [generatedPlan?.weeklyPlans, subject, isPremium, fetchedWeeks]);

    useEffect(() => {
        const handleMouseUp = () => {
            const sel = window.getSelection();
            if (sel && sel.toString().trim() && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                setSelection({ text: sel.toString(), rect });
            } else {
                setSelection(null);
            }
        };
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const handleRefinementAction = (action: string, text: string) => {
        // Send to parent or handle directly via an API route
        onRefine(text, action); // Placeholder path
        setSelection(null);
        window.getSelection()?.removeAllRanges();
    };

    const handlePredictQuestion = async () => {
        if (!isPremium) {
            alert("Predict 2026 Questions is a premium feature!");
            return;
        }
        setIsPredicting(true);
        try {
            // Grab the last 5 questions from the first section
            const pastQuestions = generatedPlan.sections?.[0]?.questions || [];
            const topic = subject; // We pass the subject or inferred topic

            const res = await fetch('/api/predict-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, pastQuestions })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to predict");

            const newPlan = JSON.parse(JSON.stringify(generatedPlan));
            // Ensure sections exist
            if (!newPlan.sections) newPlan.sections = [];
            // See if "2026 Predictions" section exists
            let predSection = newPlan.sections.find((s: any) => s.sectionTitle === "2026 Predicted Questions");
            if (!predSection) {
                predSection = { sectionTitle: "2026 Predicted Questions", questions: [] };
                newPlan.sections.push(predSection);
            }
            predSection.questions.push({
                question: data.question + "\n\n*(AI Predicted)*\n" + (data.explanation ? `\n> **Rationale:** ${data.explanation}` : ''),
                options: data.options
            });
            updatePlanField('', newPlan); // Using root replace
        } catch (e: any) {
            alert(e.message);
        } finally {
            setIsPredicting(false);
        }
    };

    const handlePrint = () => {
        const originalTitle = document.title;
        try {
            const cleanSubject = subject.replace(/[^a-zA-Z0-9]+/g, '_');
            const cleanGrade = classGrade.replace(/[^a-zA-Z0-9]+/g, '_');
            const docType = generatedPlan.sections ? 'Exam' : 'Lesson_Plan';
            document.title = `${cleanSubject}_${cleanGrade}_${docType}`;
            onPrint();
        } finally {
            setTimeout(() => {
                document.title = originalTitle;
            }, 1000);
        }
    };

    const handleDownloadPDF = async () => {
        if (!isPremium) {
            alert("PDF Downloads are a premium feature!");
            return;
        }
        
        const content = document.getElementById('printable-content');
        if (!content) return;

        // Temporarily inject school name header for the PDF capture
        const originalPadding = content.style.padding;
        let headerDiv: HTMLDivElement | null = null;

        if (schoolName && !generatedPlan.sections) {
            headerDiv = document.createElement('div');
            headerDiv.style.textAlign = 'center';
            headerDiv.style.marginBottom = '30px';
            headerDiv.style.borderBottom = '2px solid black';
            headerDiv.style.paddingBottom = '10px';
            headerDiv.innerHTML = `<h1 style="font-size: 28px; font-weight: 900; text-transform: uppercase; margin: 0;">${schoolName}</h1>`;
            content.insertBefore(headerDiv, content.firstChild);
        }

        // Hide wands, toolbars, sharing icons, and action buttons during PDF capture
        const hiddenElements = Array.from(content.querySelectorAll('.print\\:hidden, [class*="print:hidden"], button')) as HTMLElement[];
        const originalStyles = hiddenElements.map(el => ({
            el,
            display: el.style.display
        }));

        hiddenElements.forEach(el => {
            el.style.display = 'none';
        });

        try {
            // Need a slight delay to ensure DOM is updated
            await new Promise(r => setTimeout(r, 150));

            // Dynamically import client-only packages to prevent SSR issues
            const html2canvas = (await import('html2canvas')).default;
            const jsPDFMod = await import('jspdf');
            const jsPDF = jsPDFMod.jsPDF || jsPDFMod.default;

            const canvas = await html2canvas(content, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            // If the document is longer than one page, split it
            let heightLeft = pdfHeight;
            let position = 0;
            const pageHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            const cleanSubject = subject.replace(/[^a-zA-Z0-9]+/g, '_');
            const cleanGrade = classGrade.replace(/[^a-zA-Z0-9]+/g, '_');
            const docType = generatedPlan.sections ? 'Exam' : 'Lesson_Plan';
            const filename = `${cleanSubject}_${cleanGrade}_${docType}.pdf`;
            
            pdf.setProperties({
                title: `${cleanSubject} ${cleanGrade} ${docType.replace('_', ' ')}`
            });
            pdf.save(filename);

        } catch (e) {
            console.error("PDF Generation Error", e);
            alert("Failed to generate PDF. You can try 'Print Document' instead.");
        } finally {
            if (headerDiv) {
                content.removeChild(headerDiv);
            }
            content.style.padding = originalPadding;

            // Restore hidden elements
            originalStyles.forEach(({ el, display }) => {
                el.style.display = display;
            });
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto space-y-8 print:block relative"
        >
            <RefinementToolbar 
                selection={selection}
                onAction={handleRefinementAction}
                onClose={() => setSelection(null)}
            />
            
            <GlobalRefinePalette 
                isOpen={isGlobalPaletteOpen}
                onClose={() => setIsGlobalPaletteOpen(false)}
                onExecute={(instruction) => {
                    // Send global instruction
                    onGlobalRefine(instruction);
                }}
            />

            <div className="flex justify-end gap-3 items-center print:hidden mb-10">
                {isPremium && (
                    <button onClick={() => setIsGlobalPaletteOpen(true)} className="btn-ghost border-pro/20 bg-pro/5 text-pro hover:bg-pro/10 flex items-center gap-1">
                        <Sparkles size={18}/> Global Pro Refine
                    </button>
                )}
                {isPremium ? (
                    <label className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all select-none">
                        <input
                            type="checkbox"
                            checked={includeQuestions}
                            onChange={(e) => setIncludeQuestions(e.target.checked)}
                            className="accent-indigo-600"
                        />
                        <span>Include Question Bank</span>
                    </label>
                ) : (
                    <div 
                        onClick={() => alert("Question Bank integration is a premium feature! Upgrade to Pro to embed past exam questions.")}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 cursor-pointer opacity-60 hover:opacity-100 transition-all select-none"
                    >
                        <Sparkles size={14} className="text-zinc-400" />
                        <span className="text-zinc-400">Include Question Bank (Pro)</span>
                    </div>
                )}
                <button onClick={onClose} className="btn-ghost">Close Workspace</button>
                <button onClick={handleDownloadPDF} className="btn-secondary shadow-sm flex items-center gap-1"><Download size={18}/> Save PDF</button>
                <button onClick={handlePrint} className="btn-primary shadow-xl flex items-center gap-1"><Printer size={18}/> Print</button>
            </div>

            <div id="printable-content" className="surface-card bg-white p-12 shadow-2xl print:shadow-none print:p-0 rounded-[32px] border-none overflow-hidden relative selection:bg-blue-100 selection:text-blue-900">
                <style>{`
                    #printable-content {
                        font-family: "Times New Roman", Times, serif !important;
                        text-align: justify !important;
                    }
                    #printable-content * {
                        font-style: normal !important;
                    }
                    @media print {
                        @page {
                            margin: 0;
                        }
                        body {
                            padding: 1.6cm !important;
                            margin: 0 !important;
                            background: #fff !important;
                        }
                        body > *:not(#app-root) { display: none !important; }
                        #app-root * { visibility: hidden; }
                        #printable-content, #printable-content * { visibility: visible !important; }
                        #printable-content {
                            position: absolute !important; left: 1.6cm !important; top: 1.6cm !important;
                            width: calc(100% - 3.2cm) !important; margin: 0 !important; padding: 0 !important;
                            background: #fff !important; box-shadow: none !important; border: none !important;
                        }
                        ${printFilter ? `
                            .week-container:not(#week-${printFilter}) { display: none !important; }
                            .scheme-header { display: none !important; }
                            .print-footer { display: none !important; }
                        ` : ''}
                    }
                `}</style>
                
                <div className="space-y-20">
                    <div className="text-center space-y-4 pb-12 border-b-2 border-black scheme-header">
                        <h1 className="text-4xl font-extrabold uppercase tracking-tighter" contentEditable suppressContentEditableWarning={true}>{term} Scheme of Work</h1>
                        <p className="text-xl font-medium text-zinc-500 uppercase" contentEditable suppressContentEditableWarning={true}>
                            {subject} • {classGrade} • {session}
                        </p>
                    </div>

                    {/* Lesson Plan View */}
                    {generatedPlan.weeklyPlans && (
                        <div className="space-y-24">
                            {generatedPlan.weeklyPlans.map((p:any, pIdx:number)=>(
                                <div key={pIdx} id={`week-${p.week}`} className="space-y-10 group scroll-mt-24 week-container">
                                    {[1,2].map(periodNum => {
                                        const pd = periodNum === 1 ? p.period1 : p.period2;
                                        if(!pd) return null;
                                        return (
                                            <div key={periodNum} className="space-y-10 pb-16 border-b-2 border-zinc-100 last:border-0 relative break-inside-avoid">
                                                <div className="space-y-2">
                                                    <div className="text-[11px] font-bold text-zinc-900 grid grid-cols-2 lg:grid-cols-3 gap-2 pb-4 relative">
                                                        <button onClick={()=>onRefine(pd.periodTitle,`weeklyPlans[${pIdx}].period${periodNum}.periodTitle`)} className="absolute -right-4 -top-4 p-2 text-zinc-300 opacity-0 group-hover:opacity-100 transition-all hover:text-blue-500 print:hidden"><Wand2 size={16}/></button>
                                                        <span>Week: <span className="font-black underline" contentEditable onBlur={e=>updatePlanField(`weeklyPlans[${pIdx}].week`, e.currentTarget.innerText)}>{p.week}</span></span>
                                                        <span>Topic: <span className="font-black underline" contentEditable onBlur={e=>updatePlanField(`weeklyPlans[${pIdx}].topic`, e.currentTarget.innerText)}>{p.topic}</span></span>
                                                        <span>Subject: <span className="font-black underline">{subject}</span></span>
                                                        <span>Class: <span className="font-black underline">{classGrade}</span></span>
                                                        <span>Period: <span className="font-black underline" contentEditable onBlur={e=>updatePlanField(`weeklyPlans[${pIdx}].period${periodNum}.duration`, e.currentTarget.innerText)}>{pd.duration}</span> (Period {periodNum})</span>
                                                        <span className="col-span-full">Date: <span className="text-zinc-300">____________________________________________________</span></span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-6 text-[14px]">
                                                    {/* Objectives */}
                                                    <div className="flex gap-6">
                                                        <span className="w-24 shrink-0 font-black text-zinc-400 uppercase text-[10px] pt-1">Objectives</span>
                                                        <div className="flex-1 space-y-4">
                                                            <p className="font-bold underline text-zinc-700">By the end of this lesson, learners will be able to:</p>
                                                            <ul className="list-none space-y-2">
                                                                {pd.objectives?.map((o:string,oi:number)=>(
                                                                    <li key={oi} className="flex gap-2">
                                                                        <span className="font-bold">{oi+1}.</span> 
                                                                        <div contentEditable onBlur={(e)=> {
                                                                            const newObjs = [...pd.objectives];
                                                                            newObjs[oi] = e.currentTarget.innerText;
                                                                            updatePlanField(`weeklyPlans[${pIdx}].period${periodNum}.objectives`, newObjs);
                                                                        }} className="flex-1 focus:outline-none focus:bg-zinc-50 rounded px-1 transition-all"><MarkdownBlock content={o}/></div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>

                                                    {/* Materials & Reference */}
                                                    <div className="flex gap-6">
                                                        <span className="w-24 shrink-0 font-black text-zinc-400 uppercase text-[10px] pt-1">Materials</span>
                                                        <div contentEditable onBlur={(e)=>updatePlanField(`weeklyPlans[${pIdx}].period${periodNum}.materials`, e.currentTarget.innerText)} className="flex-1 text-zinc-800 font-medium focus:outline-none focus:bg-zinc-50 rounded px-1 transition-all">{pd.materials}</div>
                                                    </div>
                                                    <div className="flex gap-6">
                                                        <span className="w-24 shrink-0 font-black text-zinc-400 uppercase text-[10px] pt-1">Reference</span>
                                                        <div className="flex-1 text-blue-600 text-xs truncate underline">{pd.reference}</div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex gap-6">
                                                        <span className="w-24 shrink-0 font-black text-zinc-400 uppercase text-[10px] pt-1">Content</span>
                                                        <div className="flex-1 space-y-3">
                                                            {pd.content?.map((o:string,oi:number)=>(
                                                                <div key={oi} contentEditable onBlur={(e)=> {
                                                                    const newContent = [...pd.content];
                                                                    newContent[oi] = e.currentTarget.innerText;
                                                                    updatePlanField(`weeklyPlans[${pIdx}].period${periodNum}.content`, newContent);
                                                                }} className="font-medium focus:outline-none focus:bg-zinc-50 rounded px-1 transition-all"><MarkdownBlock content={o}/></div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Evaluation & Assignment */}
                                                    <div className="flex gap-6">
                                                        <span className="w-24 shrink-0 font-black text-zinc-400 uppercase text-[10px] pt-1">Evaluation</span>
                                                        <div className="flex-1 space-y-2">
                                                            {pd.evaluation?.map((e:string,ei:number)=>(
                                                                <div key={ei} contentEditable onBlur={(evt)=> {
                                                                    const newEvs = [...pd.evaluation];
                                                                    newEvs[ei] = evt.currentTarget.innerText;
                                                                    updatePlanField(`weeklyPlans[${pIdx}].period${periodNum}.evaluation`, newEvs);
                                                                }} className="flex gap-2 font-medium focus:outline-none transition-all"><span>•</span> {e.replace(/^[\[\-\s●•*]+/, '')}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* PRINTABLE PAST QUESTIONS assessment BLOCK */}
                                    {includeQuestions && questionsMap[pIdx] && questionsMap[pIdx].length > 0 && (
                                        <div className="pt-6 border-t-2 border-black mt-8 break-inside-avoid font-serif">
                                            <h3 className="text-lg font-bold uppercase mb-4 text-black text-left">Assessment / Past WAEC & BECE Questions</h3>
                                            <div className="space-y-6 text-left">
                                                {questionsMap[pIdx].map((q: any, qIdx: number) => {
                                                    let parsedOptions: any = null;
                                                    if (q.options) {
                                                        try {
                                                            parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                                                        } catch {
                                                            parsedOptions = q.options;
                                                        }
                                                    }

                                                    return (
                                                        <div key={q.id || qIdx} className="space-y-2 text-[13px] break-inside-avoid text-black">
                                                            <div className="flex gap-2">
                                                                <span className="font-bold">{qIdx + 1}.</span>
                                                                <div className="flex-1 font-medium">
                                                                    <MarkdownBlock content={q.question_text} />
                                                                </div>
                                                                <span className="text-[10px] text-zinc-500 italic">({q.exam_type || 'Exam'} {q.year})</span>
                                                            </div>
                                                            {parsedOptions && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0.5 pl-6 text-sm">
                                                                    {Object.entries(parsedOptions).map(([key, val]) => (
                                                                        <div key={key} className="flex gap-2">
                                                                            <span className="font-bold">({key})</span>
                                                                            <span>{val as string}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Test/Exam View */}
                    {generatedPlan.sections && (
                        <div className="space-y-16">
                            <div className="text-center space-y-4 pb-12 border-b-2 border-black scheme-header mb-10">
                                {schoolName && <h1 className="text-3xl font-black uppercase">{schoolName}</h1>}
                                <h2 className="text-xl font-bold uppercase">
                                    {term} {generatedPlan.title?.toLowerCase().includes('exam') ? 'Term Examination' : 'Continuous Assessment'}
                                </h2>
                                <div className="text-[11px] font-bold uppercase grid grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
                                    <span>Teacher: {teacherName || 'Not specified'}</span>
                                    <span>Subject: {subject}</span>
                                    <span>Class: {classGrade}</span>
                                    <span>Session: {session}</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-2xl font-black text-black">{generatedPlan.title}</h2>
                                <p className="italic text-zinc-600 font-serif">{generatedPlan.instructions}</p>
                            </div>

                            {generatedPlan.sections.map((section: any, sIdx: number) => (
                                <div key={sIdx} className="space-y-8">
                                    <h3 className="text-lg font-black border-b-2 border-black pb-2 uppercase tracking-tight">{section.sectionTitle}</h3>
                                    <div className="space-y-6">
                                        {section.questions.map((q: any, qIdx: number) => (
                                            <div key={qIdx} className="space-y-2 relative group">
                                                <div className="flex gap-2 font-medium">
                                                    <span className="font-black">{qIdx + 1}.</span>
                                                    <div contentEditable className="flex-1 focus:outline-none"><MarkdownBlock content={q.question}/></div>
                                                    <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                                                        <ShareWhatsApp text={`${q.question}\n${q.options ? Object.entries(q.options).map(([k,v]) => `(${k}) ${v}`).join('\n') : ''}`} />
                                                    </div>
                                                </div>
                                                {q.options && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-1 pl-6">
                                                        {Object.entries(q.options).map(([key, val]) => (
                                                            <div key={key} className="flex gap-2 text-sm">
                                                                <span className="font-bold">({key})</span>
                                                                <span contentEditable className="focus:outline-none">{val as string}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="pt-8 border-t border-zinc-100 print:hidden flex justify-center">
                                <button 
                                    onClick={handlePredictQuestion}
                                    disabled={isPredicting}
                                    className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-full font-black text-sm uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isPredicting ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                    {isPredicting ? "Predicting..." : "Predict 2026 Question"}
                                </button>
                            </div>

                            <div className="pt-20 border-t-2 border-black border-dashed mt-20 break-before-page">
                                <h2 className="text-xl font-black uppercase mb-10">Answer Key</h2>
                                <div className="grid grid-cols-2 gap-10">
                                    {Object.entries(generatedPlan.answerKey || {}).map(([type, answers]: [string, any]) => (
                                        <div key={type} className="space-y-4">
                                            <h3 className="font-black uppercase text-xs text-zinc-400">{type}</h3>
                                            <div className="grid grid-cols-5 gap-2">
                                                {(answers as any[]).map((a, i) => (
                                                    <div key={i} className="text-sm">
                                                        <span className="font-bold mr-1">{i + 1}.</span>
                                                        <span>{a}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-10 border-t border-zinc-100 mt-10 text-[10px] text-zinc-400 font-bold uppercase flex justify-between items-center italic px-12 pb-12 print:px-0 print-footer">
                <span>{!isPremium && "Generated by Didact OS Pedagogy • "}Teacher: {teacherName || 'Not specified'}</span>
                <span className="hidden sm:inline">Subject: {subject} ({classGrade})</span>
                <span>Session: {term} ({session})</span>
            </div>
        </motion.div>
    );
}
