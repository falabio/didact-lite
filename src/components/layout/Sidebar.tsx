"use client";

import { X, BookOpen, Sparkles, Check, History, Crown } from 'lucide-react';
import { SignInButton } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'framer-motion';
import { AppTab } from '../../types';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: string;
    setActiveTab: (tab: any) => void;
    isPremium: boolean;
    isSignedIn: boolean | undefined;
    onUpgrade: () => void;
}

export default function Sidebar({ 
    isOpen, 
    onClose, 
    activeTab, 
    setActiveTab, 
    isPremium, 
    isSignedIn, 
    onUpgrade 
}: SidebarProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
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
                        className="relative w-80 h-full bg-white shadow-2xl p-8 flex flex-col"
                    >
                        <div className="flex justify-between items-center mb-10">
                            <span className="text-lg font-bold text-black">Navigation</span>
                            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-black transition-colors rounded-full hover:bg-zinc-50">
                                <X size={20}/>
                            </button>
                        </div>
                        
                        <nav className="flex-1 space-y-2">
                            {[
                                { id: 'planner', label: 'Lesson Planner', icon: <BookOpen size={18}/> },
                                { id: 'tests', label: 'Tests', icon: <Sparkles size={18}/> },
                                { id: 'exams', label: 'Exams', icon: <Check size={18}/> },
                                { id: 'bank', label: 'Question Bank', icon: <History size={18}/> },
                            ].map(t => (
                                <button 
                                    key={t.id} 
                                    onClick={() => { setActiveTab(t.id); onClose(); }}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                                        activeTab === t.id 
                                            ? 'bg-zinc-100 text-black font-semibold' 
                                            : 'text-zinc-600 hover:bg-zinc-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {t.icon} <span>{t.label}</span>
                                    </div>
                                </button>
                            ))}
                        </nav>

                        <div className="mt-auto space-y-4 pt-6 border-t border-zinc-100">
                            {!isPremium && isSignedIn && (
                                <div className="space-y-4">
                                    <button 
                                        onClick={onUpgrade} 
                                        className="w-full btn-accent flex items-center justify-center gap-2 py-4 bg-black hover:bg-zinc-800 border-none text-white shadow-xl hover:shadow-2xl transition-all group rounded-2xl"
                                    >
                                        <Crown size={18} className="text-yellow-400 group-hover:rotate-12 transition-transform"/> 
                                        <span>Upgrade to Pro</span>
                                    </button>
                                    <p className="text-[10px] text-center text-zinc-400 font-bold uppercase tracking-widest">₦3,500 for 3 months</p>
                                </div>
                            )}
                            {!isSignedIn && (
                                <SignInButton mode="modal">
                                    <div className="w-full py-3 bg-zinc-100 text-black font-bold rounded-xl hover:bg-zinc-200 transition-all text-sm text-center cursor-pointer">
                                        Sign In / Create Account
                                    </div>
                                </SignInButton>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
