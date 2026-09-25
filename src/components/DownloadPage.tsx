import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Smartphone, 
  Download, 
  QrCode, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  ExternalLink, 
  Globe, 
  Apple, 
  Lock, 
  Zap, 
  Check, 
  ArrowRight,
  BookOpen,
  Trophy
} from 'lucide-react';
import { SlideUp, PressFeedback } from '../lib/animations';

interface DownloadPageProps {
  onOpenApp?: () => void;
}

export const DownloadPage: React.FC<DownloadPageProps> = ({ onOpenApp }) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const downloadUrl = 'https://studyride.in/studyride.apk';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(downloadUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // QR Code URL via standard SVG generator (QR Server API for clean visual resolution)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(downloadUrl)}&bgcolor=030712&color=38bdf8&margin=10`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-slate-950">
      {/* ── TOP NAV ─────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="StudyRide Logo" 
              className="w-9 h-9 rounded-xl object-cover border border-slate-800 shadow-lg shadow-emerald-500/20" 
            />
            <span className="font-black text-xl text-white tracking-tight">StudyRide</span>
          </div>

          <div className="flex items-center gap-3">
            {onOpenApp && (
              <button
                onClick={onOpenApp}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                Open Web App
              </button>
            )}
            <a
              href="/studyride.apk"
              download="StudyRide.apk"
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-sm font-bold shadow-md shadow-sky-500/20 transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download APK</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-sky-400 bg-sky-500/10 border border-sky-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Mobile Application</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Take StudyRide <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">With You</span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Study anywhere. Practice anywhere. Protect your concentration from distracting apps with on-device Focus Shield.
          </p>
        </div>
      </section>

      {/* ── DOWNLOAD CHANNELS GRID ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Android Release APK (Direct & Verified) */}
          <SlideUp delay={0.1}>
            <div className="h-full p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/90 border border-sky-500/30 shadow-2xl relative flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 px-4 py-1.5 bg-sky-500 text-slate-950 font-black text-xs rounded-bl-2xl uppercase tracking-wider">
                Production Release
              </div>

              <div>
                <div className="flex items-center gap-3 mb-4">
                  <img 
                    src="/logo.png" 
                    alt="StudyRide Logo" 
                    className="w-12 h-12 rounded-2xl object-cover border border-emerald-500/40 shadow-lg shadow-emerald-500/20 shrink-0" 
                  />
                  <div>
                    <h2 className="text-2xl font-black text-white">StudyRide for Android</h2>
                    <div className="text-xs text-emerald-400 font-semibold">Version 2.5.0 • Official Build (September 2026)</div>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                  Full-featured native Android app with local Focus Shield, cheat-proof CBT exam engine, active recall flashcards, and live question banks.
                </p>

                {/* Feature Checklist */}
                <div className="space-y-2.5 mb-8">
                  {[
                    'Computer Based Test (CBT) with Zero-Leakage',
                    'Focus Shield: On-Device YouTube & Instagram Distraction Filter',
                    'Active Recall Leitner Spaced-Repetition Flashcards',
                    'Pomodoro Study Timer with Ambient Sound Generator',
                    'Authoritative Trophy Collection & Challenge Progression',
                    'Offline-Friendly Architecture with Neon Sync'
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Area */}
              <div className="pt-6 border-t border-slate-800 space-y-3">
                <a
                  href="/studyride.apk"
                  download="StudyRide.apk"
                  className="w-full py-4 px-6 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-base shadow-xl shadow-sky-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Android App (.apk v2.4.3)</span>
                </a>

                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>File Size: ~11.4 MB</span>
                  <span>Requires Android 8.0+</span>
                  <button 
                    onClick={handleCopyLink}
                    className="text-sky-400 hover:underline"
                  >
                    {copiedUrl ? 'Copied Link!' : 'Copy Direct URL'}
                  </button>
                </div>

                {/* Play Protect & Installation Notice Card */}
                <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Google Play Protect Warning? (आसानी से इंस्टॉल करें)</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Direct APK download hone ke karan Google Play Protect warning dikha sakta hai. Install karne ke liye:
                  </p>
                  <ol className="text-[11px] text-slate-300 space-y-1 list-decimal list-inside">
                    <li>Browser warning par <strong className="text-white">"Download anyway"</strong> par click karein.</li>
                    <li>Play Protect warning aane par <strong className="text-amber-300">"More details"</strong> (अधिक विवरण) par click karein.</li>
                    <li>Neeche <strong className="text-amber-300">"Install anyway"</strong> (फिर भी इंस्टॉल करें) select karein.</li>
                  </ol>
                </div>
              </div>
            </div>
          </SlideUp>

          {/* Card 2: Desktop QR Code & Multi-Platform */}
          <SlideUp delay={0.15}>
            <div className="h-full p-8 rounded-3xl bg-slate-900/80 border border-slate-800 relative flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">Scan to Install</h2>
                    <div className="text-xs text-slate-400">Direct phone camera installation</div>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mb-6">
                  Reading on a laptop or desktop? Scan this QR code with your mobile camera to immediately download and install the official APK.
                </p>

                {/* QR Code Container */}
                <div className="flex items-center justify-center my-6">
                  <div className="p-4 rounded-3xl bg-slate-950 border-2 border-slate-800 shadow-xl inline-block">
                    <img 
                      src={qrCodeUrl} 
                      alt="Scan to download StudyRide APK"
                      className="w-48 h-48 rounded-xl object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* iOS Status Card */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Apple className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Apple iOS Version</div>
                    <div className="text-[11px] text-slate-400">In Active Development</div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  Coming Soon
                </span>
              </div>
            </div>
          </SlideUp>
        </div>
      </section>

      {/* ── TRUST & INTEGRITY SECTION ─────────────────────────────────── */}
      <section className="border-t border-slate-900 bg-slate-950/60 py-16 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">Built for Serious Academic Preparation</h3>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Our engineering commitments are grounded in actual implementation, transparent architecture, and respect for student privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Local-Only Distraction Filter</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Focus Shield operates on-device using Android VpnService per-app routing. Zero student web traffic or private data is ever routed through external servers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                <Trophy className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Server-Authoritative Records</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                No fake achievements or client-side badges. All study hours, CBT scores, and challenges are cryptographically verified by Neon PostgreSQL.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Play Store Policy Compliant</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Strictly avoids invasive AccessibilityService hacks and QUERY_ALL_PACKAGES scans. Follows official Google developer guidelines for device health.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-900 py-8 px-4 text-center text-xs text-slate-400">
        <p>© 2026 StudyRide Technologies. All rights reserved.</p>
        <p className="mt-1">Designed for UPSC, NEET, SSC CGL & Competitive Exam Aspirants.</p>
      </footer>
    </div>
  );
};
