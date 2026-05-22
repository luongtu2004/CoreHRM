'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface FormDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accentColor?: string; // e.g. 'blue' | 'emerald' | 'rose'
}

export default function FormDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  accentColor = 'blue',
}: FormDrawerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const gradients: Record<string, string> = {
    blue: 'from-blue-500 to-indigo-600',
    emerald: 'from-emerald-500 to-teal-600',
    rose: 'from-rose-500 to-pink-600',
    purple: 'from-purple-500 to-fuchsia-600',
    amber: 'from-amber-400 to-orange-500',
  };
  const gradient = gradients[accentColor] ?? gradients.blue;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[3px]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-hidden bg-white shadow-[−20px_0_60px_rgba(0,0,0,0.15)]"
          >
            {/* Gradient header bar */}
            <div className={`bg-gradient-to-r ${gradient} px-6 py-5`}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
                  {subtitle && (
                    <p className="mt-0.5 text-sm text-white/70">{subtitle}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="ml-4 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white/80 transition-all hover:bg-white/25 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable form content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-slate-50/50">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
