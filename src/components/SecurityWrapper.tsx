import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { UserProfile } from '../types';

interface SecurityWrapperProps {
  user: UserProfile;
  children: React.ReactNode;
  enabled?: boolean;
}

export const SecurityWrapper: React.FC<SecurityWrapperProps> = ({ 
  user, 
  children, 
  enabled = true 
}) => {
  const [isViolationTriggered, setIsViolationTriggered] = useState(false);
  const [violationType, setViolationType] = useState<string>('');

  useEffect(() => {
    if (!enabled) return;

    // 1. Disable Right-Click Context Menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert('⚠️ Security Notice: Right-click copy is disabled to protect academic resources.');
    };

    // 2. Disable Selection & Copy/Cut Events
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      // Allow selection inside inputs and textareas
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      e.preventDefault();
    };

    const handleCopyCutPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      e.preventDefault();
      alert('⚠️ Copy/Paste Blocked: Content protection is active on this portal.');
    };

    // 3. Disable Keyboard shortcuts (Copy, Save, Print, Inspect)
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // Block Ctrl+C, Ctrl+X, Ctrl+A (Select All), Ctrl+S (Save), Ctrl+P (Print)
      if (ctrlOrCmd && ['c', 'x', 'a', 's', 'p'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        
        if (key === 'p') {
          setIsViolationTriggered(true);
          setViolationType('Print / PDF Export attempt detected.');
        } else if (key === 'c' || key === 'x') {
          alert('⚠️ Shortcut Disabled: Copy operations are restricted.');
        }
        return false;
      }

      // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Chrome DevTools shortcuts)
      if (ctrlOrCmd && e.shiftKey && ['i', 'j', 'c'].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        setIsViolationTriggered(true);
        setViolationType('Developer Inspector Shortcut detected.');
        return false;
      }

      // Block F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        setIsViolationTriggered(true);
        setViolationType('F12 Inspection tool key pressed.');
        return false;
      }
    };

    // 4. Print prevention using media listeners
    const handleBeforePrint = () => {
      setIsViolationTriggered(true);
      setViolationType('Print Window event triggered.');
    };

    // 5. Anti-Debugging Loop (Freeze code execution if DevTools is open)
    const intervalId = setInterval(() => {
      // This debugger pauses execution only if DevTools is open.
      // If DevTools is closed, it passes instantly without notice.
      const startTime = performance.now();
      debugger;
      const endTime = performance.now();
      
      // If the execution took more than 100ms, it means the debugger statement paused the browser
      // because DevTools is open!
      if (endTime - startTime > 100) {
        setIsViolationTriggered(true);
        setViolationType('Active debugger tool attachment detected.');
      }
    }, 1000);

    // 6. Docked DevTools Detection (Checks window size ratios on desktop)
    const handleResize = () => {
      // Ignore mobile devices, touch devices, and mobile viewports (<= 768px)
      if (window.innerWidth <= 768 || 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)) {
        return;
      }
      const threshold = 160;
      const isDevToolsOpenHorizontally = window.outerWidth - window.innerWidth > threshold;
      const isDevToolsOpenVertically = window.outerHeight - window.innerHeight > threshold;

      if (isDevToolsOpenHorizontally || isDevToolsOpenVertically) {
        setIsViolationTriggered(true);
        setViolationType('Docked Developer Inspect Panel detected.');
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleCopyCutPaste);
    document.addEventListener('cut', handleCopyCutPaste);
    document.addEventListener('paste', handleCopyCutPaste);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('copy', handleCopyCutPaste);
      document.removeEventListener('cut', handleCopyCutPaste);
      document.removeEventListener('paste', handleCopyCutPaste);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('resize', handleResize);
      clearInterval(intervalId);
    };
  }, [enabled]);

  // If a security violation occurred, display a full-screen lockdown warning screen
  if (isViolationTriggered && enabled) {
    return (
      <div className="fixed inset-0 z-50 bg-[#060813] flex flex-col items-center justify-center p-6 text-center space-y-6 select-none">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
          <ShieldAlert className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2 max-w-md">
          <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full font-black tracking-widest uppercase">
            Security Lockdown Triggered
          </span>
          <h2 className="text-xl font-black text-white">Access Denied (Copy Protection)</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            AspirantX has detected an action violating the copyright protection terms ({violationType}). 
            To resume your preparation, please close all Developer Tools / Print windows and refresh this tab.
          </p>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-black text-xs rounded-xl shadow-lg transition-all"
        >
          I Closed It, Refresh Page
        </button>
      </div>
    );
  }

  // Draw semi-transparent screenshot protection watermarks
  const watermarkText = `${user.email || 'guest@aspirantx.com'} • IP: 192.168.1.107 • SECURE PORTAL`;

  return (
    <div className="relative w-full h-full">
      {/* Background Watermark Grid */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden opacity-[0.02] select-none flex flex-wrap gap-20 p-10 justify-around items-center">
        {Array.from({ length: 16 }).map((_, idx) => (
          <div 
            key={idx} 
            className="text-white text-xs font-black tracking-widest uppercase rotate-[-30deg] whitespace-nowrap"
          >
            {watermarkText}
          </div>
        ))}
      </div>

      {children}
    </div>
  );
};
