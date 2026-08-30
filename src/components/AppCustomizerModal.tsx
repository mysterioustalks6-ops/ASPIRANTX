import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AppCustomizerSettings, 
  loadCustomizerSettings, 
  fetchServerCustomizerSettings,
  saveCustomizerSettings, 
  DEFAULT_CUSTOMIZER_SETTINGS,
  PRESET_BANNER_IMAGES
} from '../lib/customizer';
import { 
  Palette, 
  Sparkles, 
  Type, 
  Image as ImageIcon, 
  Wrench, 
  X, 
  Check, 
  RotateCcw, 
  Eye, 
  Layout, 
  Radio, 
  Sliders, 
  Megaphone,
  Layers,
  Zap,
  Globe,
  Upload
} from 'lucide-react';

interface AppCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (updated: AppCustomizerSettings) => void;
}

export const AppCustomizerModal: React.FC<AppCustomizerModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const [settings, setSettings] = useState<AppCustomizerSettings>(loadCustomizerSettings());
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'banner' | 'theme' | 'animation'>('branding');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      fetchServerCustomizerSettings().then((s) => setSettings(s));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (field: keyof AppCustomizerSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomizerSettings(settings);
    if (onSettingsSaved) onSettingsSaved(settings);

    setSaveSuccessMsg('🎨 Custom design & branding applied to live app!');
    setTimeout(() => {
      setSaveSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleResetToDefault = () => {
    setSettings(DEFAULT_CUSTOMIZER_SETTINGS);
    saveCustomizerSettings(DEFAULT_CUSTOMIZER_SETTINGS);
    if (onSettingsSaved) onSettingsSaved(DEFAULT_CUSTOMIZER_SETTINGS);
    setSaveSuccessMsg('Restored default AspirantX theme!');
    setTimeout(() => setSaveSuccessMsg(null), 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative my-auto my-6"
      >
        {/* Glow Header */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between relative z-10 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Live App Customizer & Design Studio
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                  Full Customization
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Change logo, brand name, fonts, background animations, banner photos & theme colors.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 bg-slate-950/50 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('branding')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'branding'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> 1. Logo & Brand Name
          </button>

          <button
            onClick={() => setActiveSubTab('banner')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'banner'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> 2. Banner Photo & Ticker
          </button>

          <button
            onClick={() => setActiveSubTab('theme')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'theme'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" /> 3. Theme & Font Style
          </button>

          <button
            onClick={() => setActiveSubTab('animation')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'animation'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> 4. Background FX & Animations
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {/* TAB 1: BRANDING & LOGO */}
          {activeSubTab === 'branding' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Wrench className="w-4 h-4" /> App Title & Brand Identity
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">App Name / Brand Title</label>
                    <input
                      type="text"
                      required
                      value={settings.brandName}
                      onChange={(e) => handleFieldChange('brandName', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                      placeholder="e.g. ASPIRANTX, STUDY HUB, ACADEMY"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Tagline / Slogan</label>
                    <input
                      type="text"
                      value={settings.brandTagline}
                      onChange={(e) => handleFieldChange('brandTagline', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                      placeholder="e.g. Class 1 to Ph.D. Exam Suite"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Logo Icon Text (Initials)</label>
                    <input
                      type="text"
                      maxLength={3}
                      value={settings.logoIconText}
                      onChange={(e) => handleFieldChange('logoIconText', e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs font-mono text-white outline-none"
                      placeholder="AX"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Brand Badge Text</label>
                    <input
                      type="text"
                      value={settings.brandBadge}
                      onChange={(e) => handleFieldChange('brandBadge', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                      placeholder="e.g. PRO, VIP, ULTRA"
                    />
                  </div>
                </div>

                {/* Custom Logo Image URL Option */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-purple-400" /> Custom Logo Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={settings.logoUrl || ''}
                    onChange={(e) => handleFieldChange('logoUrl', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                    placeholder="https://example.com/my-custom-logo.png"
                  />
                  <p className="text-[10px] text-slate-400">
                    If provided, this image will replace the text icon in the sidebar logo header.
                  </p>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Live Logo Preview</p>
                  <div className="flex items-center gap-3 mt-2">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-cyan-400" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-emerald-400 to-cyan-400 p-[1px]">
                        <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center font-black text-emerald-400 text-base font-mono">
                          {settings.logoIconText || 'AX'}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-white text-base tracking-wider">{settings.brandName || 'ASPIRANTX'}</h4>
                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded uppercase">
                          {settings.brandBadge || 'PRO'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{settings.brandTagline}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BANNER PHOTO & TICKER */}
          {activeSubTab === 'banner' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Main Hero Banner & Photo Customization
                </h3>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs font-bold text-slate-200">Show Hero Banner Card</span>
                  <input
                    type="checkbox"
                    checked={settings.showHeroBanner}
                    onChange={(e) => handleFieldChange('showHeroBanner', e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Banner Headline Title</label>
                  <input
                    type="text"
                    value={settings.heroBannerTitle}
                    onChange={(e) => handleFieldChange('heroBannerTitle', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Banner Subtitle / Description</label>
                  <input
                    type="text"
                    value={settings.heroBannerSubtitle}
                    onChange={(e) => handleFieldChange('heroBannerSubtitle', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Custom Photo Banner Image URL</label>
                  <input
                    type="url"
                    value={settings.heroBannerImageUrl}
                    onChange={(e) => handleFieldChange('heroBannerImageUrl', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white outline-none"
                    placeholder="https://images.unsplash.com/photo-1522202176988..."
                  />
                </div>

                {/* Preset Photo Banner Options */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Select Preset Background Photo</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PRESET_BANNER_IMAGES.map((img) => (
                      <div
                        key={img.label}
                        onClick={() => handleFieldChange('heroBannerImageUrl', img.url)}
                        className={`p-1 rounded-xl border cursor-pointer transition-all overflow-hidden ${
                          settings.heroBannerImageUrl === img.url
                            ? 'border-cyan-400 ring-2 ring-cyan-400/30 scale-105'
                            : 'border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img.url} alt={img.label} className="w-full h-14 object-cover rounded-lg" />
                        <p className="text-[10px] font-bold text-slate-300 mt-1 truncate px-1">{img.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Announcement Ticker */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Top Announcement Ticker
                </h3>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs font-bold text-slate-200">Show Top Ticker Banner</span>
                  <input
                    type="checkbox"
                    checked={settings.showAnnouncementTicker}
                    onChange={(e) => handleFieldChange('showAnnouncementTicker', e.target.checked)}
                    className="w-4 h-4 accent-amber-400 cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Announcement Text</label>
                  <input
                    type="text"
                    value={settings.announcementText}
                    onChange={(e) => handleFieldChange('announcementText', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-amber-400 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: THEME & FONT STYLE */}
          {activeSubTab === 'theme' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Theme Color Palette
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'CYBER_EMERALD', name: 'Cyber Emerald', desc: 'Futuristic Neon Green & Cyan Glow', gradient: 'from-emerald-400 to-cyan-400' },
                    { id: 'ROYAL_PURPLE', name: 'Royal Purple Luxury', desc: 'Deep Violet, Indigo & Amber Accents', gradient: 'from-purple-500 to-indigo-500' },
                    { id: 'FIRE_SUNSET', name: 'Fire Sunset', desc: 'Warm Amber, Orange & Red Atmosphere', gradient: 'from-amber-500 to-rose-500' },
                    { id: 'ELECTRIC_BLUE', name: 'Electric Sapphire', desc: 'Clean Sapphire & Deep Ocean Blue', gradient: 'from-blue-500 to-cyan-400' },
                    { id: 'GOLD_LUXURY', name: 'Gold & Emerald', desc: 'Premium Golden Royalty Aesthetic', gradient: 'from-amber-400 to-emerald-400' },
                  ].map((pal) => (
                    <button
                      type="button"
                      key={pal.id}
                      onClick={() => handleFieldChange('themePalette', pal.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                        settings.themePalette === pal.id
                          ? 'bg-cyan-500/10 border-cyan-400 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${pal.gradient} shrink-0 shadow-sm`} />
                      <div>
                        <p className="text-xs font-bold text-white">{pal.name}</p>
                        <p className="text-[10px] text-slate-400">{pal.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family Selection */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <Type className="w-4 h-4" /> Typography & Font Family
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'PLUS_JAKARTA', name: 'Plus Jakarta Sans', fontClass: 'font-sans' },
                    { id: 'OUTFIT', name: 'Outfit Display', fontClass: 'font-sans tracking-wide' },
                    { id: 'PLAYFAIR', name: 'Playfair Academic', fontClass: 'font-serif' },
                    { id: 'SPACE_GROTESK', name: 'Space Grotesk Cyber', fontClass: 'font-sans font-bold' },
                    { id: 'MONO', name: 'Fira Monospace', fontClass: 'font-mono' },
                  ].map((f) => (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => handleFieldChange('fontFamily', f.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${f.fontClass} ${
                        settings.fontFamily === f.id
                          ? 'bg-purple-500/15 border-purple-400 text-purple-300 font-extrabold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs block">{f.name}</span>
                      <span className="text-[10px] opacity-60">Sample 123</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BACKGROUND FX & ANIMATIONS */}
          {activeSubTab === 'animation' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Background Animation Style
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'AURORA_WAVE', name: 'Aurora Waves', desc: 'Floating slow gradient aurora waves' },
                    { id: 'NEON_CYBER', name: 'Neon Grid & Glow', desc: 'Cyberpunk animated particle grid' },
                    { id: 'ACADEMIC_SLATE', name: 'Academic Starfield', desc: 'Deep slate with gentle floating stars' },
                    { id: 'GOLDEN_EMERALD', name: 'Golden Emerald Ambient', desc: 'Luxury glowing ambient spheres' },
                    { id: 'MINIMAL_CLEAN', name: 'Minimal Dark', desc: 'Clean static dark background without blur' },
                  ].map((bg) => (
                    <button
                      type="button"
                      key={bg.id}
                      onClick={() => handleFieldChange('backgroundAnimation', bg.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        settings.backgroundAnimation === bg.id
                          ? 'bg-cyan-500/10 border-cyan-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <p className="text-xs font-bold text-white flex items-center justify-between">
                        {bg.name}
                        {settings.backgroundAnimation === bg.id && <Check className="w-4 h-4 text-cyan-400" />}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">{bg.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Enable Floating Particle Animations</span>
                    <span className="text-[10px] text-slate-400">Smooth motion particles for premium visual feel</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showBackgroundParticles}
                    onChange={(e) => handleFieldChange('showBackgroundParticles', e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Feedback Success Message */}
          {saveSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" /> {saveSuccessMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Check className="w-4 h-4" /> Apply Custom Theme
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
