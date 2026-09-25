import React from 'react';
import { AvatarConfig, DEFAULT_AVATAR_CONFIG } from './AvatarStudioModal';

interface AspirantAvatarProps {
  config?: AvatarConfig;
  className?: string;
}

export const AspirantAvatar: React.FC<AspirantAvatarProps> = ({
  config = DEFAULT_AVATAR_CONFIG,
  className = 'w-full h-full'
}) => {
  const c = config || DEFAULT_AVATAR_CONFIG;

  return (
    <svg
      viewBox="0 0 300 320"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Body / Shirt */}
      {c.bodyStyle === 'shirt' && (
        <g>
          <path d="M70 250 C70 210, 100 190, 150 190 C200 190, 230 210, 230 250 L245 320 L55 320 Z" fill="#FFFFFF" stroke="#161B18" strokeWidth="4" />
          <path d="M120 190 L150 230 L180 190" fill="#F1F5F9" stroke="#161B18" strokeWidth="3" />
          <path d="M150 230 L150 320" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="6 6" />
          <circle cx="150" cy="250" r="3" fill="#161B18" />
          <circle cx="150" cy="280" r="3" fill="#161B18" />
        </g>
      )}
      {c.bodyStyle === 'hoodie' && (
        <g>
          <path d="M65 245 C65 205, 95 185, 150 185 C205 185, 235 205, 235 245 L250 320 L50 320 Z" fill="#1E293B" stroke="#0F172A" strokeWidth="4" />
          <path d="M110 188 C130 220, 170 220, 190 188" stroke="#10B981" strokeWidth="4" fill="none" />
          <path d="M135 220 L135 260" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M165 220 L165 260" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
      {c.bodyStyle === 'blazer' && (
        <g>
          <path d="M65 250 C65 210, 95 190, 150 190 C205 190, 235 210, 235 250 L250 320 L50 320 Z" fill="#0F172A" stroke="#020617" strokeWidth="4" />
          <path d="M120 190 L150 240 L180 190" fill="#FFFFFF" stroke="#020617" strokeWidth="2" />
          <path d="M145 200 L150 235 L155 200 Z" fill="#EF4444" />
        </g>
      )}
      {c.bodyStyle === 'kurta' && (
        <g>
          <path d="M70 245 C70 205, 100 188, 150 188 C200 188, 230 205, 230 245 L240 320 L60 320 Z" fill="#F8FAFC" stroke="#334155" strokeWidth="3" />
          <path d="M142 188 L142 245 L158 245 L158 188" fill="#E2E8F0" stroke="#334155" strokeWidth="2" />
          <circle cx="150" cy="205" r="2.5" fill="#334155" />
          <circle cx="150" cy="225" r="2.5" fill="#334155" />
        </g>
      )}
      {c.bodyStyle === 'tshirt' && (
        <g>
          <path d="M70 245 C70 205, 100 188, 150 188 C200 188, 230 205, 230 245 L245 320 L55 320 Z" fill="#059669" stroke="#064E3B" strokeWidth="4" />
          <path d="M120 188 C135 208, 165 208, 180 188" stroke="#064E3B" strokeWidth="3" fill="none" />
        </g>
      )}

      {/* Neck */}
      <path d="M132 170 L132 195 C132 205, 168 205, 168 195 L168 170 Z" fill={c.skinTone} stroke="#161B18" strokeWidth="3" />

      {/* Head / Face */}
      <path d="M105 130 C105 75, 195 75, 195 130 C195 175, 175 190, 150 190 C125 190, 105 175, 105 130 Z" fill={c.skinTone} stroke="#161B18" strokeWidth="3.5" />

      {/* Ears */}
      <path d="M98 132 C95 125, 105 120, 106 135 C107 145, 100 148, 98 140 Z" fill={c.skinTone} stroke="#161B18" strokeWidth="3" />
      <path d="M202 132 C205 125, 195 120, 194 135 C193 145, 200 148, 202 140 Z" fill={c.skinTone} stroke="#161B18" strokeWidth="3" />

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
      {c.hairStyle === 'short' && (
        <path d="M103 115 C102 70, 140 60, 197 115 C190 70, 150 62, 103 115 Z" fill={c.hairColor} stroke="#161B18" strokeWidth="3" />
      )}
      {c.hairStyle === 'wavy' && (
        <path d="M98 120 C96 60, 135 50, 195 55 C210 90, 202 125, 195 125 C185 85, 125 75, 98 120 Z" fill={c.hairColor} stroke="#161B18" strokeWidth="3" />
      )}
      {c.hairStyle === 'curly' && (
        <g fill={c.hairColor} stroke="#161B18" strokeWidth="2.5">
          <circle cx="110" cy="85" r="14" />
          <circle cx="132" cy="72" r="15" />
          <circle cx="155" cy="70" r="16" />
          <circle cx="178" cy="76" r="15" />
          <circle cx="195" cy="95" r="13" />
        </g>
      )}
      {c.hairStyle === 'parted' && (
        <path d="M102 115 C100 68, 145 60, 198 85 C190 70, 135 62, 102 115 Z" fill={c.hairColor} stroke="#161B18" strokeWidth="3" />
      )}

      {/* Facial Hair */}
      {c.facialHair === 'stubble' && (
        <path d="M125 152 C125 178, 175 178, 175 152" stroke="#475569" strokeWidth="4" strokeDasharray="2 3" fill="none" />
      )}
      {c.facialHair === 'beard' && (
        <path d="M110 138 C110 185, 140 195, 150 195 C160 195, 190 185, 190 138 C185 175, 168 182, 150 182 C132 182, 115 175, 110 138 Z" fill="#161B18" />
      )}
      {c.facialHair === 'goatee' && (
        <g fill="#161B18">
          <path d="M142 165 C146 172, 154 172, 158 165 L155 186 C150 188, 145 186, 145 186 Z" />
          <path d="M140 150 C145 147, 155 147, 160 150" stroke="#161B18" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
      {c.facialHair === 'mustache' && (
        <path d="M130 150 C138 145, 148 153, 150 150 C152 153, 162 145, 170 150 C175 154, 165 158, 150 155 C135 158, 125 154, 130 150 Z" fill="#161B18" stroke="#161B18" strokeWidth="1.5" />
      )}
      {c.facialHair === 'salt_pepper' && (
        <path d="M110 138 C110 185, 140 195, 150 195 C160 195, 190 185, 190 138 C185 175, 168 182, 150 182 C132 182, 115 175, 110 138 Z" fill="#64748B" />
      )}

      {/* Accessories */}
      {c.accessory === 'reading_glasses' && (
        <g stroke="#0F172A" strokeWidth="3" fill="none">
          <rect x="118" y="116" width="26" height="20" rx="3" fill="#38BDF8" fillOpacity="0.2" />
          <rect x="156" y="116" width="26" height="20" rx="3" fill="#38BDF8" fillOpacity="0.2" />
          <path d="M144 124 L156 124" />
          <path d="M118 122 L102 128" />
          <path d="M182 122 L198 128" />
        </g>
      )}
      {c.accessory === 'round_glasses' && (
        <g stroke="#0F172A" strokeWidth="3" fill="none">
          <circle cx="130" cy="126" r="13" fill="#38BDF8" fillOpacity="0.2" />
          <circle cx="170" cy="126" r="13" fill="#38BDF8" fillOpacity="0.2" />
          <path d="M143 126 L157 126" />
          <path d="M117 124 L102 128" />
          <path d="M183 124 L198 128" />
        </g>
      )}
      {c.accessory === 'headphones' && (
        <g stroke="#0F172A" strokeWidth="4" fill="none">
          <path d="M96 135 C90 70, 210 70, 204 135" strokeLinecap="round" />
          <rect x="90" y="125" width="12" height="24" rx="6" fill="#10B981" stroke="#064E3B" strokeWidth="2" />
          <rect x="198" y="125" width="12" height="24" rx="6" fill="#10B981" stroke="#064E3B" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
};
