"use client";

import { MessageCircle } from 'lucide-react';

interface ShareWhatsAppProps {
    text: string;
}

export default function ShareWhatsApp({ text }: ShareWhatsAppProps) {
    const handleShare = () => {
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    return (
        <button 
            onClick={handleShare}
            title="Share to WhatsApp"
            className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors flex items-center gap-2 text-xs font-bold"
        >
            <MessageCircle size={16} />
            <span className="hidden md:inline">Share snippet</span>
        </button>
    );
}
