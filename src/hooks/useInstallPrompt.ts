import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export interface UseInstallPromptReturn {
  showPrompt: boolean;
  canInstall: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  showIOSInstructions: boolean;
  toastMessage: string | null;
  handleInstall: () => Promise<void>;
  handleDismiss: () => void;
  closeIOSInstructions: () => void;
}

export function useInstallPrompt(): UseInstallPromptReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState<boolean>(false);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Detect if the app is already running as an installed PWA or native Capacitor app
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches || 
    (window.navigator as any).standalone === true ||
    Capacitor.isNativePlatform()
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
      setCanInstall(true);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // If iOS Safari, installation is always available via Share -> Add to Home Screen
    if (isIOS) {
      setCanInstall(true);
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
    }

    // Fallback: On browsers where beforeinstallprompt takes a few seconds or is triggered later
    const timer = setTimeout(() => {
      const dismissed = localStorage.getItem('aspirantx_pwa_install_dismissed') === 'true';
      if (!dismissed && !isStandalone) {
        setShowPrompt(true);
      }
    }, 2500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone, isIOS]);

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
      // Safety fallback if triggerInstall is called without captured beforeinstallprompt
      setToastMessage("Install isn't available right now — you can still use AspirantX in your browser");
      setTimeout(() => setToastMessage(null), 4000);
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
    canInstall,
    isIOS,
    isAndroid,
    isStandalone,
    showIOSInstructions,
    toastMessage,
    handleInstall,
    handleDismiss,
    closeIOSInstructions,
  };
}
