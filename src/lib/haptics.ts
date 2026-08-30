/**
 * Aspirantx Haptic Feedback & Audio-Tactile Touch Utility
 * Provides native mobile haptic feedback & sound click feel
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

/**
 * Triggers native mobile haptic vibration if available (via navigator.vibrate or Web Haptics)
 */
export function triggerHapticFeedback(type: HapticType = 'light'): void {
  if (typeof window === 'undefined') return;

  try {
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
        case 'selection':
          navigator.vibrate(12); // Crisp 12ms tap
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate([40]);
          break;
        case 'success':
          navigator.vibrate([15, 40, 20]); // Dual rhythm tap
          break;
        case 'warning':
          navigator.vibrate([30, 50, 30]);
          break;
        case 'error':
          navigator.vibrate([50, 60, 50, 60, 50]);
          break;
      }
    }
  } catch (err) {
    // Silent catch if user permissions or device doesn't support vibration
  }
}

/**
 * Attach global event listener for all interactive elements to give instant tactile feedback
 */
export function initTactileTouchListener(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handlePointerDown = (e: PointerEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Check if target or ancestor is interactive
    const interactiveEl = target.closest('button, a, [role="button"], input[type="checkbox"], input[type="radio"], select, .ax-card-interactive, .touch-ripple');
    
    if (interactiveEl) {
      triggerHapticFeedback('light');
    }
  };

  window.addEventListener('pointerdown', handlePointerDown, { passive: true });
  return () => window.removeEventListener('pointerdown', handlePointerDown);
}
