"use client";

import { History, Menu } from 'lucide-react';
import { SignInButton, UserButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';

interface NavbarProps {
    isSignedIn: boolean | undefined;
    onHistoryOpen: () => void;
    onMenuOpen: () => void;
    onHome: () => void;
}

export default function Navbar({ isSignedIn, onHistoryOpen, onMenuOpen, onHome }: NavbarProps) {
    return (
        <header className="sticky top-0 z-50 glass border-b border-zinc-100 print:hidden">
            <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between"
            >
                <button 
                    onClick={onHome}
                    className="flex items-center gap-3 hover:opacity-70 transition-opacity"
                >
                    <img src="/logo.svg" alt="Didact Logo" className="w-10 h-10 object-contain" />
                    <span className="text-xl font-bold tracking-tight text-zinc-900">Didact</span>
                </button>

                <div className="flex items-center gap-2 sm:gap-4">
                    <button 
                        onClick={onHistoryOpen} 
                        className="p-2 text-zinc-500 hover:text-black transition-all hover:bg-zinc-50 rounded-full"
                    >
                        <History size={20} />
                    </button>
                    {isSignedIn ? (
                        <UserButton appearance={{ elements: { userButtonAvatarBox: 'w-8 h-8' } }} />
                    ) : (
                        <SignInButton mode="modal">
                            <span className="text-sm font-bold text-zinc-900 hover:text-blue-600 transition-colors cursor-pointer inline-block px-3 py-1.5 rounded-lg hover:bg-zinc-50">
                                Sign In
                            </span>
                        </SignInButton>
                    )}
                    <button 
                        onClick={onMenuOpen} 
                        className="p-2 text-zinc-500 hover:text-black transition-all hover:bg-zinc-50 rounded-full"
                    >
                        <Menu size={20} />
                    </button>
                </div>
            </motion.div>
        </header>
    );
}
