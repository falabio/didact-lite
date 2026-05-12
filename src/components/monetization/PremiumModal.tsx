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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Left Side: Features */}
          <div className="w-full md:w-1/2 bg-zinc-50 p-8 border-r border-zinc-100">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              Didact Premium
            </div>
            
            <h2 className="text-3xl font-bold text-zinc-900 mb-2">Unlock Your Teaching Superpowers</h2>
            <p className="text-zinc-600 mb-8 leading-relaxed">
              You've hit your free limit. Upgrade to access professional tools and unlimited generation.
            </p>

            <ul className="space-y-4">
              {plans[selectedPlan].features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 text-zinc-700">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Side: Plans */}
          <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
            <h3 className="text-xl font-bold text-zinc-900 mb-6">Choose Your Plan</h3>

            <div className="space-y-4 mb-8">
              {/* Day Pass Option */}
              <button
                onClick={() => setSelectedPlan('day_pass')}
                className={\`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all \${
                  selectedPlan === 'day_pass' 
                    ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                    : 'border-zinc-200 hover:border-indigo-300'
                }\`}
              >
                <div className="text-left">
                  <div className="font-bold text-zinc-900">{plans.day_pass.label}</div>
                  <div className="text-sm text-zinc-500">{plans.day_pass.description}</div>
                </div>
                <div className="text-lg font-bold text-indigo-700">₦200</div>
              </button>

              {/* Termly Option */}
              <button
                onClick={() => setSelectedPlan('termly')}
                className={\`w-full relative flex items-center justify-between p-4 rounded-xl border-2 transition-all \${
                  selectedPlan === 'termly' 
                    ? 'border-indigo-600 bg-indigo-50 shadow-sm' 
                    : 'border-zinc-200 hover:border-indigo-300'
                }\`}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Best Value
                </div>
                <div className="text-left">
                  <div className="font-bold text-zinc-900">{plans.termly.label}</div>
                  <div className="text-sm text-zinc-500">{plans.termly.description}</div>
                </div>
                <div className="text-lg font-bold text-indigo-700">₦5,000</div>
              </button>
            </div>

            <button
              onClick={handlePay}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-zinc-900 text-white font-bold text-lg hover:bg-zinc-800 transition-colors shadow-lg hover:shadow-xl active:scale-[0.98]"
            >
              <Zap className="w-5 h-5 fill-current" />
              Pay ₦{plans[selectedPlan].price} with Paystack
            </button>
            <p className="text-center text-xs text-zinc-400 mt-4 flex items-center justify-center gap-1">
              Secure payments via Paystack
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
