import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import confetti from 'canvas-confetti';

// ============================================================================
// MOTION TIMING PRESETS & HOOKS
// ============================================================================

export const MOTION_TIMING = {
  micro: 0.15,      // 150ms for buttons, icons, tap feedback
  normal: 0.25,     // 250ms for card appearances, tabs, accordions
  modal: 0.32,      // 320ms for dialogs, drawers, bottom sheets
  celebration: 0.85 // 850ms for confetti, score reveals, level up
} as const;

export const MOTION_EASE = {
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  smooth: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  outCubic: [0.215, 0.61, 0.355, 1] as [number, number, number, number],
  outExpo: [0.16, 1, 0.3, 1] as [number, number, number, number],
} as const;

/**
 * Hook to detect prefers-reduced-motion media query
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReduced;
}

// ============================================================================
// CELEBRATION & CONFETTI HELPER
// ============================================================================

export function triggerConfetti(options?: confetti.Options) {
  try {
    confetti({
      particleCount: options?.particleCount ?? 60,
      spread: options?.spread ?? 70,
      origin: options?.origin ?? { y: 0.7 },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'],
      disableForReducedMotion: true,
      ...options,
    });
  } catch (_e) {
    // Graceful fallback if canvas is restricted
  }
}

// ============================================================================
// REUSABLE MOTION PRIMITIVES
// ============================================================================

/**
 * Clean Opacity Fade-In
 */
export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}> = ({ children, delay = 0, duration = MOTION_TIMING.normal, className = '' }) => {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: reduced ? 0.05 : duration,
        delay: reduced ? 0 : delay,
        ease: MOTION_EASE.smooth,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Upward Slide & Fade Transition
 */
export const SlideUp: React.FC<{
  id?: string;
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}> = ({
  id,
  children,
  delay = 0,
  duration = MOTION_TIMING.normal,
  distance = 16,
  className = '',
}) => {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: reduced ? 0 : distance }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -distance }}
      transition={{
        duration: reduced ? 0.05 : duration,
        delay: reduced ? 0 : delay,
        ease: MOTION_EASE.outCubic,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Spring-based Scale-In Entrance
 */
export const ScaleIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}> = ({ children, delay = 0, duration = MOTION_TIMING.normal, className = '' }) => {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: reduced ? 1 : 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: reduced ? 1 : 0.94 }}
      transition={{
        duration: reduced ? 0.05 : duration,
        delay: reduced ? 0 : delay,
        ease: MOTION_EASE.outExpo,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Top-Level View & Page Transition Wrapper
 */
export const PageTransition: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : -8 }}
      transition={{
        duration: reduced ? 0.08 : MOTION_TIMING.normal,
        ease: MOTION_EASE.outCubic,
      }}
      className={`w-full ${className}`}
    >
      {children}
    </motion.div>
  );
};

/**
 * Cascading Container & Item Stagger
 */
export const Stagger: React.FC<{
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}> = ({ children, staggerDelay = 0.045, className = '' }) => {
  const reduced = usePrefersReducedMotion();

  const containerVariants: Variants = useMemo(() => ({
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: reduced ? 0 : staggerDelay,
      },
    },
  }), [reduced, staggerDelay]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem: React.FC<{
  children: React.ReactNode;
  distance?: number;
  className?: string;
}> = ({ children, distance = 14, className = '' }) => {
  const reduced = usePrefersReducedMotion();

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : distance },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reduced ? 0.05 : MOTION_TIMING.normal,
        ease: MOTION_EASE.outCubic,
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};

/**
 * Interactive Mobile Touch & Click Elevation Feedback
 */
export const PressFeedback: React.FC<{
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  disabled?: boolean;
}> = ({ children, onClick, className = '', disabled = false }) => {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      whileHover={reduced || disabled ? {} : { y: -2, transition: { duration: 0.12 } }}
      whileTap={reduced || disabled ? {} : { scale: 0.97, transition: { duration: 0.08 } }}
      onClick={disabled ? undefined : onClick}
      className={`cursor-pointer select-none ${className}`}
    >
      {children}
    </motion.div>
  );
};

/**
 * Centered Modal Backdrop & Dialog Transition
 */
export const ModalTransition: React.FC<{
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ isOpen, onClose, children, className = '' }) => {
  const reduced = usePrefersReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.05 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: reduced ? 1 : 0.95, y: reduced ? 0 : 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduced ? 1 : 0.95, y: reduced ? 0 : 8 }}
            transition={{ duration: reduced ? 0.08 : MOTION_TIMING.modal, ease: MOTION_EASE.outExpo }}
            className={`relative z-10 w-full max-h-[90vh] overflow-y-auto ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/**
 * Side-sliding Drawer Transition (from left or right)
 */
export const DrawerTransition: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}> = ({ isOpen, onClose, side = 'left', children, className = '' }) => {
  const reduced = usePrefersReducedMotion();
  const xOffset = side === 'left' ? '-100%' : '100%';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.05 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Drawer Body */}
          <motion.div
            initial={{ x: reduced ? 0 : xOffset, opacity: reduced ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reduced ? 0 : xOffset, opacity: reduced ? 0 : 1 }}
            transition={{ duration: reduced ? 0.08 : MOTION_TIMING.modal, ease: MOTION_EASE.outCubic }}
            className={`relative z-10 h-full ${side === 'right' ? 'ml-auto' : ''} ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/**
 * Smooth Number CountUp Animation
 */
export const CountUp: React.FC<{
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}> = ({ value, duration = 1.0, suffix = '', prefix = '', className = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const end = value;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const startTime = performance.now();
    const durationMs = duration * 1000;

    let frameId: number;

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      } else {
        setDisplayValue(end);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration, reduced]);

  return (
    <span className={className}>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
};

/**
 * Smooth Animated Progress Bar (0% -> target%)
 */
export const ProgressAnimation: React.FC<{
  percent?: number;
  value?: number;
  duration?: number;
  className?: string;
  barColor?: string;
  barClassName?: string;
}> = ({
  percent,
  value,
  duration = 0.8,
  className = 'h-2 bg-slate-800 rounded-full overflow-hidden',
  barColor,
  barClassName,
}) => {
  const reduced = usePrefersReducedMotion();
  const rawPercent = value !== undefined ? value : (percent ?? 0);
  const clampedPercent = Math.min(Math.max(rawPercent, 0), 100);
  const finalBarColor = barClassName || barColor || 'bg-gradient-to-r from-blue-500 to-indigo-500';

  return (
    <div className={`relative ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clampedPercent}%` }}
        transition={{
          duration: reduced ? 0.05 : duration,
          ease: MOTION_EASE.outCubic,
        }}
        className={`h-full ${finalBarColor} rounded-full`}
      />
    </div>
  );
};

/**
 * Subtle Horizontal Error Shake
 */
export const ErrorShake: React.FC<{
  triggerKey?: any;
  children: React.ReactNode;
  className?: string;
}> = ({ triggerKey, children, className = '' }) => {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      key={triggerKey ? String(triggerKey) : 'error-shake'}
      animate={
        !reduced
          ? { x: [0, -6, 6, -4, 4, -2, 2, 0] }
          : { x: 0 }
      }
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Smooth Expanding Accordion Content Transition
 */
export const AccordionTransition: React.FC<{
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ isOpen, children, className = '' }) => {
  const reduced = usePrefersReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{
            duration: reduced ? 0.05 : MOTION_TIMING.normal,
            ease: MOTION_EASE.smooth,
          }}
          className={`overflow-hidden ${className}`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Skeleton Shimmer Placeholder
 */
export const SkeletonShimmer: React.FC<{
  className?: string;
  width?: string;
  height?: string;
}> = ({ className = 'h-4 bg-slate-800/80 rounded', width = 'w-full', height = '' }) => {
  return (
    <div
      className={`relative overflow-hidden ${width} ${height} ${className} before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent`}
    />
  );
};

/**
 * Streak Flame Glow Pulse
 */
export const FlameGlow: React.FC<{
  streak?: number;
  active?: boolean;
  children?: React.ReactNode;
  className?: string;
}> = ({ streak, active, children, className = '' }) => {
  const reduced = usePrefersReducedMotion();
  const isGlowing = active ?? (streak !== undefined && streak > 0);

  return (
    <motion.div
      animate={
        reduced || !isGlowing
          ? {}
          : {
              scale: [1, 1.08, 1],
              filter: [
                'drop-shadow(0 0 4px rgba(245, 158, 11, 0.4))',
                'drop-shadow(0 0 10px rgba(245, 158, 11, 0.7))',
                'drop-shadow(0 0 4px rgba(245, 158, 11, 0.4))',
              ],
            }
      }
      transition={{
        duration: 2.2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`inline-flex items-center gap-1.5 ${className}`}
    >
      {children ? children : <span className="text-amber-400 font-bold">🔥 {streak ?? 1}</span>}
    </motion.div>
  );
};

/**
 * Empty State Container with Animated Icon
 */
export const EmptyState: React.FC<{
  icon: string | React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}> = ({ icon, title, description, action, className = '' }) => {
  return (
    <FadeIn className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm ${className}`}>
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="text-4xl mb-3 select-none"
      >
        {icon}
      </motion.div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-4">{description}</p>
      {action && (
        <PressFeedback>
          <button
            onClick={action.onClick}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium shadow-md transition-colors"
          >
            {action.label}
          </button>
        </PressFeedback>
      )}
    </FadeIn>
  );
};

/**
 * Downward Slide & Fade Transition
 */
export const SlideDown: React.FC<{
  id?: string;
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}> = ({
  id,
  children,
  delay = 0,
  duration = MOTION_TIMING.normal,
  distance = 16,
  className = '',
}) => {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: reduced ? 0 : -distance }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reduced ? 0 : distance }}
      transition={{
        duration: reduced ? 0.05 : duration,
        delay: reduced ? 0 : delay,
        ease: MOTION_EASE.outCubic,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Success Bounce / Check Pop Animation
 */
export const SuccessFeedback: React.FC<{
  triggerKey?: any;
  children: React.ReactNode;
  className?: string;
}> = ({ triggerKey, children, className = '' }) => {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      key={triggerKey ? String(triggerKey) : 'success-feedback'}
      animate={
        !reduced
          ? { scale: [0.85, 1.15, 0.95, 1.05, 1] }
          : { opacity: [0.7, 1] }
      }
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * Toast Transition (Slide in from top or bottom)
 */
export const ToastTransition: React.FC<{
  isOpen: boolean;
  position?: 'top' | 'bottom';
  children: React.ReactNode;
  className?: string;
}> = ({ isOpen, position = 'bottom', children, className = '' }) => {
  const reduced = usePrefersReducedMotion();
  const yOffset = position === 'bottom' ? 24 : -24;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : yOffset, scale: reduced ? 1 : 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: reduced ? 0 : yOffset, scale: reduced ? 1 : 0.95 }}
          transition={{ duration: reduced ? 0.05 : MOTION_TIMING.normal, ease: MOTION_EASE.outCubic }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Hook to reveal element on viewport enter using native IntersectionObserver
 * Zero scroll listener overhead, zero layout thrashing.
 */
export function useScrollReveal(threshold = 0.1, rootMargin = '0px 0px -40px 0px') {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = elementRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.unobserve(node);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref: elementRef, isVisible: isIntersecting };
}

/**
 * Scroll Reveal Component via IntersectionObserver
 * Opacity 0 -> 1, translateY(12px) -> 0, 350ms, respects prefers-reduced-motion
 */
export const ScrollReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
}> = ({
  children,
  delay = 0,
  duration = 0.35,
  distance = 12,
  className = '',
}) => {
  const reduced = usePrefersReducedMotion();
  const { ref, isVisible } = useScrollReveal();

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible || reduced ? 'none' : `translateY(${distance}px)`,
        transition: reduced
          ? 'opacity 0.1s ease'
          : `opacity ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        willChange: isVisible ? 'auto' : 'opacity, transform',
      }}
      className={className}
    >
      {children}
    </div>
  );
};

/**
 * Natural Bottom Sheet Transition with Backdrop
 */
export const BottomSheetTransition: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}> = ({ isOpen, onClose, children, className = '' }) => {
  const reduced = usePrefersReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.05 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Sheet Body */}
          <motion.div
            initial={{ y: reduced ? 0 : '100%', opacity: reduced ? 1 : 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reduced ? 0 : '100%', opacity: reduced ? 1 : 0 }}
            transition={{
              duration: reduced ? 0.08 : MOTION_TIMING.modal,
              ease: MOTION_EASE.outCubic,
            }}
            className={`relative z-10 w-full max-h-[92vh] overflow-y-auto rounded-t-3xl bg-slate-900 border-t border-slate-800 shadow-2xl ${className}`}
          >
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-slate-700/60 rounded-full mx-auto my-3" />
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/**
 * Micro Checkmark Pop Interaction
 * Subtle 0.85 -> 1.12 -> 1.0 scale pop for instant tactile feedback
 */
export const CheckmarkPop: React.FC<{
  isChecked: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ isChecked, children, className = '' }) => {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      key={isChecked ? 'checked' : 'unchecked'}
      initial={false}
      animate={
        isChecked && !reduced
          ? { scale: [0.85, 1.12, 1] }
          : { scale: 1 }
      }
      transition={{ duration: 0.18, ease: MOTION_EASE.outCubic }}
      className={`inline-flex items-center justify-center ${className}`}
    >
      {children}
    </motion.div>
  );
};

/**
 * Ephemeral Floating Reward Badge (+XP / +Coins)
 * Gently floats up ~18px and fades over 650ms, auto-unmounting.
 */
export const FloatingRewardBadge: React.FC<{
  text: string;
  onComplete?: () => void;
  className?: string;
}> = ({ text, onComplete, className = '' }) => {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.span
      initial={{ opacity: 0, y: 0, scale: 0.8 }}
      animate={{ opacity: [0, 1, 1, 0], y: reduced ? 0 : -20, scale: 1 }}
      transition={{
        duration: 0.7,
        times: [0, 0.2, 0.7, 1],
        ease: MOTION_EASE.outCubic,
      }}
      onAnimationComplete={onComplete}
      className={`pointer-events-none absolute z-30 font-black text-xs px-2 py-0.5 rounded-full shadow-md ${className || 'bg-amber-400 text-slate-950 border border-amber-300'}`}
    >
      {text}
    </motion.span>
  );
};

/**
 * Progressive Discovery / Next Recommended Action Card
 * Smoothly reveals next step contextual suggestion with settle easing
 */
export const ProgressiveDiscoveryCard: React.FC<{
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  icon?: React.ReactNode;
  badge?: string;
  className?: string;
}> = ({ title, subtitle, actionLabel, onAction, icon, badge, className = '' }) => {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 12, scale: reduced ? 1 : 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: reduced ? 0 : -10 }}
      transition={{ duration: MOTION_TIMING.normal, ease: MOTION_EASE.outCubic }}
      className={`p-4 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg ${className}`}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-bold text-white">{title}</h4>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <PressFeedback>
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-colors shrink-0 shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer"
        >
          {actionLabel}
        </button>
      </PressFeedback>
    </motion.div>
  );
};


