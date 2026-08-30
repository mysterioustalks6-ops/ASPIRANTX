import { useState, useEffect } from 'react';

export interface UseInstallPromptReturn {
  showPrompt: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  showIOSInstructions: boolean;
  handleInstall: () => Promise<void>;
  handleDismiss: () => void;
  closeIOSInstructions: () => void;
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState<boolean>(false);

  // 1. Detect if the app is already running as an installed PWA (Android / Desktop / iOS)
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true ||
    (window as any).Capacitor?.isNativePlatform?.() === true
  );

  // 2. Detect the platform using userAgent
  const isIOS = typeof window !== 'undefined' && 
    /iPad|iPhone|iPod/.test(navigator.userAgent) && 
    !(window as any).MSStream;

  const isAndroid = typeof window !== 'undefined' && 
    /Android/.test(navigator.userAgent);

  useEffect(() => {
    // If running in standalone PWA or already installed, NEVER show prompt
    if (isStandalone) {
      return;
    }

    // Check localStorage for saved dismissal flag: 'aspirantx_pwa_install_dismissed'
    const isDismissed = localStorage.getItem('aspirantx_pwa_install_dismissed') === 'true';
    const isInstalled = localStorage.getItem('aspirantx_app_installed') === 'true';
    if (isDismissed || isInstalled) {
      return;
    }

    // 3. Listen for browser's native 'beforeinstallprompt' event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback: On iOS or desktop where beforeinstallprompt doesn't fire immediately, show after 2s if not dismissed
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('aspirantx_pwa_install_dismissed') === 'true';
      if (!dismissed && !isStandalone) {
        setShowPrompt(true);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  // Handle "Install" action
  const handleInstall = async () => {
    if (isIOS) {
      // iOS Safari has no native install prompt API; show step-by-step instruction modal
      setShowIOSInstructions(true);
      setShowPrompt(false);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem('aspirantx_app_installed', 'true');
          setShowPrompt(false);
        }
      } catch (err) {
        console.warn('PWA install prompt error:', err);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback for browsers with manual install
      setShowPrompt(false);
    }
  };

  // Handle "Continue on Web" action: save permanently so it NEVER appears again
  const handleDismiss = () => {
    localStorage.setItem('aspirantx_pwa_install_dismissed', 'true');
    setShowPrompt(false);
    setShowIOSInstructions(false);
  };

  const closeIOSInstructions = () => {
    localStorage.setItem('aspirantx_pwa_install_dismissed', 'true');
    setShowIOSInstructions(false);
  };

  return {
    showPrompt,
    isIOS,
    isAndroid,
    isStandalone,
    showIOSInstructions,
    handleInstall,
    handleDismiss,
    closeIOSInstructions,
  };
}
