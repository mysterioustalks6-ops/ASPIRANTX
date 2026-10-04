import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
        {/* Backdrop Tap */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Sheet Content */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[var(--sr-surface)] border-t-2 border-x-2 border-[var(--sr-line-strong)] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] shadow-2xl z-10"
        >
          {/* Drag Pill Handle */}
          <div className="w-12 h-1.5 rounded-full bg-[var(--sr-line-strong)] mx-auto mb-4" />

          {/* Header */}
          {(title || subtitle) && (
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                {title && (
                  <h3 className="text-lg font-black text-[var(--sr-text)] tracking-tight">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs font-medium text-[var(--sr-text-muted)] mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close sheet"
                className="w-8 h-8 rounded-full bg-[var(--sr-surface-2)] text-[var(--sr-text-muted)] hover:text-[var(--sr-text)] flex items-center justify-center cursor-pointer transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="space-y-4">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
