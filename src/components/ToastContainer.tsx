import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, X, RotateCcw } from 'lucide-react';
import { useTaskStore } from '../store/useTaskStore';

export const ToastContainer: React.FC = () => {
  const toasts = useTaskStore((s) => s.toasts);
  const dismissToast = useTaskStore((s) => s.dismissToast);

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 md:bottom-5 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon =
            toast.type === 'success'
              ? CheckCircle2
              : toast.type === 'warning'
              ? AlertTriangle
              : Info;
          const iconColor =
            toast.type === 'success'
              ? 'text-[#22C55E]'
              : toast.type === 'warning'
              ? 'text-[#F59E0B]'
              : 'text-indigo-400';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto surface-elevated rounded-xl px-3.5 py-2.5 flex items-center gap-3 text-[13px] text-slate-900 dark:text-slate-100"
            >
              <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} strokeWidth={1.5} />
              <span className="flex-1 leading-snug">{toast.message}</span>
              {toast.undoAction && (
                <button
                  type="button"
                  onClick={() => {
                    toast.undoAction?.();
                    dismissToast(toast.id);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
                  Undo
                </button>
              )}
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
