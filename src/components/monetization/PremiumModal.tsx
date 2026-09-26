'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePaystackPayment } from 'react-paystack';
import { X, CheckCircle2, Zap, Sparkles } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PremiumModal({ isOpen, onClose, onSuccess }: PremiumModalProps) {
  const { user } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<'day_pass' | 'termly'>('termly');

  const plans = {
    day_pass: {
      price: 200,
      label: 'Day Pass',
      description: 'Full access for 24 hours.',
      features: ['Unlimited Plan Generation', 'Export to PDF', 'Bulk Export']
    },
    termly: {
      price: 5000,
      label: 'Termly Subscription',
      description: 'Best value! Full access for 3 months.',
      features: ['Unlimited Plan Generation', 'Export to PDF', 'Bulk Export', 'Priority AI Models', 'Future Predictor (Beta)']
    }
  };

  const config = {
    reference: (new Date()).getTime().toString(),
    email: user?.primaryEmailAddress?.emailAddress || '',
    amount: plans[selectedPlan].price * 100, // Paystack uses kobo
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
    metadata: {
      plan_type: selectedPlan,
      custom_fields: []
    }
  };

  const initializePayment = usePaystackPayment(config);

  const handlePay = () => {
    if (!user) return;
    initializePayment({
      onSuccess: () => {
        // Since we process via webhook, we might just show a success message here 
        // or trigger a reload/re-fetch of the user
        if (onSuccess) onSuccess();
        onClose();
        // Give a little time for webhook to hit before reloading
        setTimeout(() => window.location.reload(), 2000);
      },
      onClose: () => {
        // Payment modal closed without success
      }
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div 
          className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92dvh] sm:max-h-[90vh]"
          initial={{ scale: 0.95, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 30, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Top Grabber & Sticky Cancel */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50 sticky top-0 z-20">
            <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Didact Premium</span>
            </div>
            <button
              onClick={onClose}
              className="text-xs font-bold text-indigo-600 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 transition-colors"
            >
              Cancel
            </button>
          </div>

          <button 
            onClick={onClose}
            aria-label="Close modal"
            className="hidden md:flex absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Side: Features */}
          <div className="w-full md:w-1/2 bg-zinc-50 p-6 sm:p-8 border-r border-zinc-100 overflow-y-auto">
            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              Didact Premium
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-2">Unlock Your Teaching Superpowers</h2>
            <p className="text-zinc-600 mb-6 sm:mb-8 text-xs sm:text-sm leading-relaxed">
              You've hit your free limit. Upgrade to access professional tools and unlimited generation.
            </p>

            <ul className="space-y-3 sm:space-y-4">
              {plans[selectedPlan].features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-zinc-700">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Side: Plans */}
          <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-center overflow-y-auto pb-safe sm:pb-8">
            <h3 className="text-lg sm:text-xl font-bold text-zinc-900 mb-4 sm:mb-6">Choose Your Plan</h3>

            <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              {/* Day Pass Option */}
              <button
                onClick={() => setSelectedPlan('day_pass')}
                className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 transition-all ${
                  selectedPlan === 'day_pass' 
                    ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                    : 'border-zinc-200 hover:border-indigo-300'
                }`}
              >
                <div className="text-left">
                  <div className="font-bold text-zinc-900 text-sm">{plans.day_pass.label}</div>
                  <div className="text-xs text-zinc-500">{plans.day_pass.description}</div>
                </div>
                <div className="text-base sm:text-lg font-bold text-indigo-700">₦200</div>
              </button>

              {/* Termly Option */}
              <button
                onClick={() => setSelectedPlan('termly')}
                className={`w-full relative flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 transition-all ${
                  selectedPlan === 'termly' 
                    ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                    : 'border-zinc-200 hover:border-indigo-300'
                }`}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  Best Value
                </div>
                <div className="text-left">
                  <div className="font-bold text-zinc-900 text-sm">{plans.termly.label}</div>
                  <div className="text-xs text-zinc-500">{plans.termly.description}</div>
                </div>
                <div className="text-base sm:text-lg font-bold text-indigo-700">₦5,000</div>
              </button>
            </div>

            <button
              onClick={handlePay}
              className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl bg-zinc-900 text-white font-bold text-base sm:text-lg hover:bg-zinc-800 transition-colors shadow-lg active:scale-[0.98]"
            >
              <Zap className="w-5 h-5 fill-current" />
              Pay ₦{plans[selectedPlan].price} with Paystack
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 mt-2 rounded-lg text-xs font-bold text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
            >
              Cancel and Return
            </button>

            <p className="text-center text-[11px] text-zinc-400 mt-2 flex items-center justify-center gap-1">
              Secure payments via Paystack
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
