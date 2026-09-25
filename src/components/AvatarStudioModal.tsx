import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Sparkles, User, Palette, Glasses, Shirt, Smile } from 'lucide-react';

export interface AvatarConfig {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  facialHair: string;
  bodyStyle: string;
  accessory: string;
  bgColor: string;
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skinTone: '#F3C5A5',
  hairStyle: 'short',
  hairColor: '#2D231E',
  facialHair: 'none',
  bodyStyle: 'shirt',
  accessory: 'none',
  bgColor: '#FACC15' // Yellow hero like Regain
};

interface AvatarStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: AvatarConfig;
  onSave: (config: AvatarConfig) => void;
}

export const AvatarStudioModal: React.FC<AvatarStudioModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSave
}) => {
  const [config, setConfig] = useState<AvatarConfig>(currentConfig || DEFAULT_AVATAR_CONFIG);
  const [activeTab, setActiveTab] = useState<'Face' | 'Hair' | 'Facial Hair' | 'Body' | 'Accessory' | 'Background'>('Facial Hair');

  if (!isOpen) return null;

  const BACKGROUND_COLORS = [
    { label: 'Sun Gold', color: '#FACC15' },
    { label: 'Emerald Forest', color: '#10B981' },
    { label: 'Deep Cyan', color: '#06B6D4' },
    { label: 'Royal Violet', color: '#8B5CF6' },
    { label: 'Rose Pink', color: '#F43F5E' },
    { label: 'OLED Charcoal', color: '#1E2520' }
  ];

  const SKIN_TONES = [
    { label: 'Fair', color: '#FBD8B5' },
    { label: 'Warm', color: '#F3C5A5' },
    { label: 'Olive', color: '#E0A37A' },
    { label: 'Rich Brown', color: '#A0633C' },
    { label: 'Deep Ebony', color: '#5C3822' }
  ];

  const FACIAL_HAIR_OPTIONS = [
    { id: 'none', label: 'Clean Shaven', desc: 'Fresh & sharp' },
    { id: 'stubble', label: 'Light Stubble', desc: 'Subtle shadow' },
    { id: 'beard', label: 'Full Beard', desc: 'Dense beard' },
    { id: 'goatee', label: 'Goatee', desc: 'French cut' },
    { id: 'mustache', label: 'Handlebar', desc: 'Imperial mustache' },
    { id: 'salt_pepper', label: 'Salt & Pepper', desc: 'Experienced scholar' }
  ];

  const HAIR_STYLES = [
    { id: 'bald', label: 'Bald / Shaved' },
    { id: 'short', label: 'Classic Crew' },
    { id: 'wavy', label: 'Wavy Volume' },
    { id: 'curly', label: 'Curly Top' },
    { id: 'parted', label: 'Side Part' },
    { id: 'bun', label: 'Top Bun' }
  ];

  const BODY_STYLES = [
    { id: 'shirt', label: 'White Collared Shirt', emoji: '👔' },
    { id: 'hoodie', label: 'Study Hoodie', emoji: '🧥' },
    { id: 'tshirt', label: 'Casual Crewneck', emoji: '👕' },
    { id: 'blazer', label: 'Officer Blazer', emoji: '🤵' },
    { id: 'kurta', label: 'Minimalist Kurta', emoji: '🥻' }
  ];

  const ACCESSORIES = [
    { id: 'none', label: 'None', emoji: '🚫' },
    { id: 'reading_glasses', label: 'Study Specs', emoji: '👓' },
    { id: 'round_glasses', label: 'Professor Glasses', emoji: '🕶️' },
    { id: 'headphones', label: 'Noise Cancel Headphones', emoji: '🎧' },
    { id: 'coffee', label: 'Focus Coffee Mug', emoji: '☕' },
    { id: 'pen_book', label: 'IAS Notebook & Pen', emoji: '📓' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="max-w-md w-full bg-[#0C0F0D] border border-[#1E2520] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1E2520] bg-[#121614]">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm transition-all"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="text-center">
            <span className="text-sm font-bold text-white tracking-wide">Avatar Studio</span>
            <p className="text-[10px] text-emerald-400 font-medium">Design Your Aspirant Identity</p>
          </div>
          <button
            onClick={() => {
              onSave(config);
              onClose();
            }}
            className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            Save
          </button>
        </div>

        {/* Live Vector Character Canvas */}
        <div 
          className="relative h-56 sm:h-64 flex items-end justify-center overflow-hidden transition-colors duration-300"
          style={{ backgroundColor: config.bgColor }}
        >
          {/* Subtle Canvas Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Illustrated SVG Character */}
          <svg
            viewBox="0 0 300 320"
            className="w-48 sm:w-56 h-auto drop-shadow-2xl z-10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Body / Shirt */}
            {config.bodyStyle === 'shirt' && (
              <g>
                <path d="M70 250 C70 210, 100 190, 150 190 C200 190, 230 210, 230 250 L245 320 L55 320 Z" fill="#FFFFFF" stroke="#161B18" strokeWidth="4" />
                <path d="M120 190 L150 230 L180 190" fill="#F1F5F9" stroke="#161B18" strokeWidth="3" />
                <path d="M150 230 L150 320" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="6 6" />
                <circle cx="150" cy="250" r="3" fill="#161B18" />
                <circle cx="150" cy="280" r="3" fill="#161B18" />
              </g>
            )}
            {config.bodyStyle === 'hoodie' && (
              <g>
                <path d="M65 245 C65 205, 95 185, 150 185 C205 185, 235 205, 235 245 L250 320 L50 320 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
                <path d="M110 188 C130 220, 170 220, 190 188" stroke="#10B981" strokeWidth="4" fill="none" />
                <path d="M135 220 L135 260" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M165 220 L165 260" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            )}
            {config.bodyStyle === 'blazer' && (
              <g>
                <path d="M65 250 C65 210, 95 190, 150 190 C205 190, 235 210, 235 250 L250 320 L50 320 Z" fill="#0F172A" stroke="#020617" strokeWidth="4" />
                <path d="M120 190 L150 240 L180 190" fill="#FFFFFF" stroke="#020617" strokeWidth="2" />
                <path d="M145 200 L150 235 L155 200 Z" fill="#EF4444" />
              </g>
            )}
            {config.bodyStyle === 'kurta' && (
              <g>
                <path d="M70 245 C70 205, 100 188, 150 188 C200 188, 230 205, 230 245 L240 320 L60 320 Z" fill="#F8FAFC" stroke="#334155" strokeWidth="3" />
                <path d="M142 188 L142 245 L158 245 L158 188" fill="#E2E8F0" stroke="#334155" strokeWidth="2" />
                <circle cx="150" cy="205" r="2.5" fill="#334155" />
                <circle cx="150" cy="225" r="2.5" fill="#334155" />
              </g>
            )}
            {config.bodyStyle === 'tshirt' && (
              <g>
                <path d="M70 245 C70 205, 100 188, 150 188 C200 188, 230 205, 230 245 L245 320 L55 320 Z" fill="#059669" stroke="#064E3B" strokeWidth="4" />
                <path d="M120 188 C135 208, 165 208, 180 188" stroke="#064E3B" strokeWidth="3" fill="none" />
              </g>
            )}

            {/* Neck */}
            <path d="M132 170 L132 195 C132 205, 168 205, 168 195 L168 170 Z" fill={config.skinTone} stroke="#161B18" strokeWidth="3" />

            {/* Head / Face */}
            <path d="M105 130 C105 75, 195 75, 195 130 C195 175, 175 190, 150 190 C125 190, 105 175, 105 130 Z" fill={config.skinTone} stroke="#161B18" strokeWidth="3.5" />

            {/* Ears */}
            <path d="M98 132 C95 125, 105 120, 106 135 C107 145, 100 148, 98 140 Z" fill={config.skinTone} stroke="#161B18" strokeWidth="3" />
            <path d="M202 132 C205 125, 195 120, 194 135 C193 145, 200 148, 202 140 Z" fill={config.skinTone} stroke="#161B18" strokeWidth="3" />

            {/* Eyes */}
            <ellipse cx="132" cy="126" rx="4" ry="4.5" fill="#161B18" />
            <ellipse cx="168" cy="126" rx="4" ry="4.5" fill="#161B18" />
            <circle cx="134" cy="124" r="1.2" fill="#FFFFFF" />
            <circle cx="170" cy="124" r="1.2" fill="#FFFFFF" />

            {/* Eyebrows */}
            <path d="M124 116 C129 113, 137 114, 140 117" stroke="#161B18" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M176 116 C171 113, 163 114, 160 117" stroke="#161B18" strokeWidth="2.5" strokeLinecap="round" />

            {/* Nose */}
            <path d="M148 126 C152 134, 153 140, 147 143" stroke="#161B18" strokeWidth="2.5" strokeLinecap="round" fill="none" />

            {/* Smile / Mouth */}
            <path d="M136 156 C144 163, 156 163, 164 156" stroke="#161B18" strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Hair Style */}
            {config.hairStyle === 'short' && (
              <path d="M103 115 C102 70, 140 60, 197 115 C190 70, 150 62, 103 115 Z" fill={config.hairColor} stroke="#161B18" strokeWidth="3" />
            )}
            {config.hairStyle === 'wavy' && (
              <path d="M98 120 C96 60, 135 50, 195 55 C210 90, 202 125, 195 125 C185 85, 125 75, 98 120 Z" fill={config.hairColor} stroke="#161B18" strokeWidth="3" />
            )}
            {config.hairStyle === 'curly' && (
              <g fill={config.hairColor} stroke="#161B18" strokeWidth="2.5">
                <circle cx="110" cy="85" r="14" />
                <circle cx="132" cy="72" r="15" />
                <circle cx="155" cy="70" r="16" />
                <circle cx="178" cy="76" r="15" />
                <circle cx="195" cy="95" r="13" />
              </g>
            )}
            {config.hairStyle === 'parted' && (
              <path d="M102 115 C100 68, 145 60, 198 85 C190 70, 135 62, 102 115 Z" fill={config.hairColor} stroke="#161B18" strokeWidth="3" />
            )}

            {/* Facial Hair */}
            {config.facialHair === 'stubble' && (
              <path d="M125 152 C125 178, 175 178, 175 152" stroke="#475569" strokeWidth="4" strokeDasharray="2 3" fill="none" />
            )}
            {config.facialHair === 'beard' && (
              <path d="M110 138 C110 185, 140 195, 150 195 C160 195, 190 185, 190 138 C185 175, 168 182, 150 182 C132 182, 115 175, 110 138 Z" fill="#161B18" />
            )}
            {config.facialHair === 'goatee' && (
              <g fill="#161B18">
                <path d="M142 165 C146 172, 154 172, 158 165 L155 186 C150 188, 145 186, 145 186 Z" />
                <path d="M140 150 C145 147, 155 147, 160 150" stroke="#161B18" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            )}
            {config.facialHair === 'mustache' && (
              <path d="M130 150 C138 145, 148 153, 150 150 C152 153, 162 145, 170 150 C175 154, 165 158, 150 155 C135 158, 125 154, 130 150 Z" fill="#161B18" stroke="#161B18" strokeWidth="1.5" />
            )}
            {config.facialHair === 'salt_pepper' && (
              <path d="M110 138 C110 185, 140 195, 150 195 C160 195, 190 185, 190 138 C185 175, 168 182, 150 182 C132 182, 115 175, 110 138 Z" fill="#64748B" />
            )}

            {/* Accessories */}
            {config.accessory === 'reading_glasses' && (
              <g stroke="#0F172A" strokeWidth="3" fill="none">
                <rect x="118" y="116" width="26" height="20" rx="3" fill="#38BDF8" fillOpacity="0.2" />
                <rect x="156" y="116" width="26" height="20" rx="3" fill="#38BDF8" fillOpacity="0.2" />
                <path d="M144 124 L156 124" />
                <path d="M118 122 L102 128" />
                <path d="M182 122 L198 128" />
              </g>
            )}
            {config.accessory === 'round_glasses' && (
              <g stroke="#0F172A" strokeWidth="3" fill="none">
                <circle cx="130" cy="126" r="13" fill="#38BDF8" fillOpacity="0.2" />
                <circle cx="170" cy="126" r="13" fill="#38BDF8" fillOpacity="0.2" />
                <path d="M143 126 L157 126" />
                <path d="M117 124 L102 128" />
                <path d="M183 124 L198 128" />
              </g>
            )}
            {config.accessory === 'headphones' && (
              <g stroke="#0F172A" strokeWidth="4" fill="none">
                <path d="M96 135 C90 70, 210 70, 204 135" strokeLinecap="round" />
                <rect x="90" y="125" width="12" height="24" rx="6" fill="#10B981" stroke="#064E3B" strokeWidth="2" />
                <rect x="198" y="125" width="12" height="24" rx="6" fill="#10B981" stroke="#064E3B" strokeWidth="2" />
              </g>
            )}
          </svg>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center overflow-x-auto no-scrollbar border-b border-[#1E2520] bg-[#121614] px-2 py-2">
          {(['Face', 'Hair', 'Facial Hair', 'Body', 'Accessory', 'Background'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content Panels */}
        <div className="p-4 overflow-y-auto flex-1 bg-[#0C0F0D]">
          {activeTab === 'Facial Hair' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {FACIAL_HAIR_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setConfig({ ...config, facialHair: opt.id })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    config.facialHair === opt.id
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                      : 'bg-[#161B18] border-[#1E2520] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-white">{opt.label}</span>
                    {config.facialHair === opt.id && (
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black">✓</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1">{opt.desc}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'Hair' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {HAIR_STYLES.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setConfig({ ...config, hairStyle: opt.id })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      config.hairStyle === opt.id
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                        : 'bg-[#161B18] border-[#1E2520] hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold text-white">{opt.label}</span>
                  </button>
                ))}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 mb-2">Hair Color</p>
                <div className="flex items-center gap-2.5">
                  {['#161B18', '#3E2723', '#5D4037', '#78909C', '#F59E0B'].map(c => (
                    <button
                      key={c}
                      onClick={() => setConfig({ ...config, hairColor: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        config.hairColor === c ? 'border-emerald-400 scale-110 shadow-lg' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Face' && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-2.5">Skin Complexion</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {SKIN_TONES.map(tone => (
                  <button
                    key={tone.color}
                    onClick={() => setConfig({ ...config, skinTone: tone.color })}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                      config.skinTone === tone.color
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                        : 'bg-[#161B18] border-[#1E2520]'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-black/20 shadow-inner flex-shrink-0"
                      style={{ backgroundColor: tone.color }}
                    />
                    <span className="text-xs font-bold text-white">{tone.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Body' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {BODY_STYLES.map(b => (
                <button
                  key={b.id}
                  onClick={() => setConfig({ ...config, bodyStyle: b.id })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    config.bodyStyle === b.id
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                      : 'bg-[#161B18] border-[#1E2520] hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl">{b.emoji}</span>
                  <span className="text-xs font-bold text-white">{b.label}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'Accessory' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ACCESSORIES.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setConfig({ ...config, accessory: acc.id })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                    config.accessory === acc.id
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                      : 'bg-[#161B18] border-[#1E2520] hover:border-slate-700'
                  }`}
                >
                  <span className="text-xl">{acc.emoji}</span>
                  <span className="text-xs font-bold text-white">{acc.label}</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'Background' && (
            <div>
              <p className="text-[11px] font-semibold text-slate-400 mb-2.5">Profile Banner Color</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {BACKGROUND_COLORS.map(bg => (
                  <button
                    key={bg.color}
                    onClick={() => setConfig({ ...config, bgColor: bg.color })}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                      config.bgColor === bg.color
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-md'
                        : 'bg-[#161B18] border-[#1E2520]'
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full border border-black/20 shadow-inner flex-shrink-0"
                      style={{ backgroundColor: bg.color }}
                    />
                    <span className="text-xs font-bold text-white">{bg.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
