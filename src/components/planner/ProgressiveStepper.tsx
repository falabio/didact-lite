"use client";

import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProgressiveStepperProps {
    loadingStep: number;
    subject: string;
    activeTab: string;
}

export default function ProgressiveStepper({ loadingStep, subject, activeTab }: ProgressiveStepperProps) {
    const steps = [
        { title: "Drafting content", sub: `Generating pedagogy for ${subject}` },
        { title: "Auditing accuracy", sub: "Verifying session year and timing" },
        { title: "Refining details", sub: "Applying self-corrections & polishing" },
        { title: "Finalizing", sub: "Bundling your master document" }
    ];

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-24 px-8 flex flex-col items-center justify-center space-y-10 bg-white/90 backdrop-blur-md rounded-[40px] border border-zinc-200 shadow-2xl mt-8"
        >
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-black tracking-tight text-black">Creating your Masterpiece</h3>
                <p className="text-zinc-500 font-medium">
                    {activeTab === 'planner' ? "Sit back while our AI agents build your lesson plan" : 
                     activeTab === 'tests' ? "Generating smart pedagogical questions" : 
                     "Designing a comprehensive terminal exam"}
                </p>
            </div>

            <div className="w-full max-w-sm space-y-6">
                {steps.map((step, idx) => (
                    <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ 
                            opacity: loadingStep < idx ? 0.3 : 1,
                            x: 0,
                            scale: loadingStep === idx ? 1.02 : 1
                        }}
                        className="flex items-center gap-4"
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                            loadingStep > idx ? 'bg-black border-black text-white' : 
                            loadingStep === idx ? 'bg-white border-black text-black shadow-lg' : 
                            'bg-zinc-50 border-zinc-200 text-zinc-300'
                        }`}>
                            {loadingStep > idx ? (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                    <Check size={20} strokeWidth={3} />
                                </motion.div>
                            ) : (idx + 1)}
                        </div>
                        <div className="flex-1">
                            <p className={`font-bold transition-colors ${loadingStep === idx ? 'text-black' : 'text-zinc-400'}`}>{step.title}</p>
                            <p className="text-xs text-zinc-400 font-medium">{step.sub}</p>
                        </div>
                        {loadingStep === idx && (
                            <motion.div 
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="w-2 h-2 bg-black rounded-full"
                            />
                        )}
                    </motion.div>
                ))}
            </div>

            <div className="pt-4">
                <div className="w-48 h-1 bg-zinc-100 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(loadingStep / 3) * 100}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-black"
                    />
                </div>
            </div>
        </motion.div>
    );
}
