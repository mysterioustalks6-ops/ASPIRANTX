import { AvatarConfig, DEFAULT_AVATAR_CONFIG } from '../components/AvatarStudioModal';

/**
 * Generates an SVG string representation of an Aspirant Avatar
 * based on the provided AvatarConfig.
 */
export function generateAvatarSvg(config: AvatarConfig = DEFAULT_AVATAR_CONFIG): string {
  const c = config || DEFAULT_AVATAR_CONFIG;

  // Body paths
  let bodyMarkup = '';
  if (c.bodyStyle === 'shirt') {
    bodyMarkup = `
      <path d="M70 250 C70 210, 100 190, 150 190 C200 190, 230 210, 230 250 L245 320 L55 320 Z" fill="#FFFFFF" stroke="#161B18" stroke-width="4" />
      <path d="M120 190 L150 230 L180 190" fill="#F1F5F9" stroke="#161B18" stroke-width="3" />
      <path d="M150 230 L150 320" stroke="#CBD5E1" stroke-width="3" stroke-dasharray="6 6" />
      <circle cx="150" cy="250" r="3" fill="#161B18" />
      <circle cx="150" cy="280" r="3" fill="#161B18" />
    `;
  } else if (c.bodyStyle === 'hoodie') {
    bodyMarkup = `
      <path d="M65 245 C65 205, 95 185, 150 185 C205 185, 235 205, 235 245 L250 320 L50 320 Z" fill="#1E293B" stroke="#0F172A" stroke-width="4" />
      <path d="M110 188 C130 220, 170 220, 190 188" stroke="#10B981" stroke-width="4" fill="none" />
      <path d="M135 220 L135 260" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" />
      <path d="M165 220 L165 260" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" />
    `;
  } else if (c.bodyStyle === 'blazer') {
    bodyMarkup = `
      <path d="M65 250 C65 210, 95 190, 150 190 C205 190, 235 210, 235 250 L250 320 L50 320 Z" fill="#0F172A" stroke="#020617" stroke-width="4" />
      <path d="M120 190 L150 240 L180 190" fill="#FFFFFF" stroke="#020617" stroke-width="2" />
      <path d="M145 200 L150 235 L155 200 Z" fill="#EF4444" />
    `;
  } else if (c.bodyStyle === 'kurta') {
    bodyMarkup = `
      <path d="M70 245 C70 205, 100 188, 150 188 C200 188, 230 205, 230 245 L240 320 L60 320 Z" fill="#F8FAFC" stroke="#334155" stroke-width="3" />
      <path d="M142 188 L142 245 L158 245 L158 188" fill="#E2E8F0" stroke="#334155" stroke-width="2" />
      <circle cx="150" cy="205" r="2.5" fill="#334155" />
      <circle cx="150" cy="225" r="2.5" fill="#334155" />
    `;
  } else {
    // default tshirt
    bodyMarkup = `
      <path d="M70 245 C70 205, 100 188, 150 188 C200 188, 230 205, 230 245 L245 320 L55 320 Z" fill="#059669" stroke="#064E3B" stroke-width="4" />
      <path d="M120 188 C135 208, 165 208, 180 188" stroke="#064E3B" stroke-width="3" fill="none" />
    `;
  }

  // Hair paths
  let hairMarkup = '';
  if (c.hairStyle === 'short') {
    hairMarkup = `<path d="M103 115 C102 70, 140 60, 197 115 C190 70, 150 62, 103 115 Z" fill="${c.hairColor}" stroke="#161B18" stroke-width="3" />`;
  } else if (c.hairStyle === 'wavy') {
    hairMarkup = `<path d="M98 120 C96 60, 135 50, 195 55 C210 90, 202 125, 195 125 C185 85, 125 75, 98 120 Z" fill="${c.hairColor}" stroke="#161B18" stroke-width="3" />`;
  } else if (c.hairStyle === 'curly') {
    hairMarkup = `
      <g fill="${c.hairColor}" stroke="#161B18" stroke-width="2.5">
        <circle cx="110" cy="85" r="14" />
        <circle cx="132" cy="72" r="15" />
        <circle cx="155" cy="70" r="16" />
        <circle cx="178" cy="76" r="15" />
        <circle cx="195" cy="95" r="13" />
      </g>
    `;
  } else if (c.hairStyle === 'parted') {
    hairMarkup = `<path d="M102 115 C100 68, 145 60, 198 85 C190 70, 135 62, 102 115 Z" fill="${c.hairColor}" stroke="#161B18" stroke-width="3" />`;
  }

  // Facial hair paths
  let facialHairMarkup = '';
  if (c.facialHair === 'stubble') {
    facialHairMarkup = `<path d="M125 152 C125 178, 175 178, 175 152" stroke="#475569" stroke-width="4" stroke-dasharray="2 3" fill="none" />`;
  } else if (c.facialHair === 'beard') {
    facialHairMarkup = `<path d="M110 138 C110 185, 140 195, 150 195 C160 195, 190 185, 190 138 C185 175, 168 182, 150 182 C132 182, 115 175, 110 138 Z" fill="#161B18" />`;
  } else if (c.facialHair === 'goatee') {
    facialHairMarkup = `
      <g fill="#161B18">
        <path d="M142 165 C146 172, 154 172, 158 165 L155 186 C150 188, 145 186, 145 186 Z" />
        <path d="M140 150 C145 147, 155 147, 160 150" stroke="#161B18" stroke-width="2.5" stroke-linecap="round" />
      </g>
    `;
  } else if (c.facialHair === 'mustache') {
    facialHairMarkup = `<path d="M130 150 C138 145, 148 153, 150 150 C152 153, 162 145, 170 150 C175 154, 165 158, 150 155 C135 158, 125 154, 130 150 Z" fill="#161B18" stroke="#161B18" stroke-width="1.5" />`;
  } else if (c.facialHair === 'salt_pepper') {
    facialHairMarkup = `<path d="M110 138 C110 185, 140 195, 150 195 C160 195, 190 185, 190 138 C185 175, 168 182, 150 182 C132 182, 115 175, 110 138 Z" fill="#64748B" />`;
  }

  // Accessories paths
  let accessoryMarkup = '';
  if (c.accessory === 'reading_glasses') {
    accessoryMarkup = `
      <g stroke="#0F172A" stroke-width="3" fill="none">
        <rect x="118" y="116" width="26" height="20" rx="3" fill="#38BDF8" fill-opacity="0.2" />
        <rect x="156" y="116" width="26" height="20" rx="3" fill="#38BDF8" fill-opacity="0.2" />
        <path d="M144 124 L156 124" />
        <path d="M118 122 L102 128" />
        <path d="M182 122 L198 128" />
      </g>
    `;
  } else if (c.accessory === 'round_glasses') {
    accessoryMarkup = `
      <g stroke="#0F172A" stroke-width="3" fill="none">
        <circle cx="130" cy="126" r="13" fill="#38BDF8" fill-opacity="0.2" />
        <circle cx="170" cy="126" r="13" fill="#38BDF8" fill-opacity="0.2" />
        <path d="M143 126 L157 126" />
        <path d="M117 124 L102 128" />
        <path d="M183 124 L198 128" />
      </g>
    `;
  } else if (c.accessory === 'headphones') {
    accessoryMarkup = `
      <g stroke="#0F172A" stroke-width="4" fill="none">
        <path d="M96 135 C90 70, 210 70, 204 135" stroke-linecap="round" />
        <rect x="90" y="125" width="12" height="24" rx="6" fill="#10B981" stroke="#064E3B" stroke-width="2" />
        <rect x="198" y="125" width="12" height="24" rx="6" fill="#10B981" stroke="#064E3B" stroke-width="2" />
      </g>
    `;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 320" width="300" height="320">
      <rect width="100%" height="100%" rx="32" fill="${c.bgColor || '#FACC15'}" />
      ${bodyMarkup}
      <path d="M132 170 L132 195 C132 205, 168 205, 168 195 L168 170 Z" fill="${c.skinTone}" stroke="#161B18" stroke-width="3" />
      <path d="M105 130 C105 75, 195 75, 195 130 C195 175, 175 190, 150 190 C125 190, 105 175, 105 130 Z" fill="${c.skinTone}" stroke="#161B18" stroke-width="3.5" />
      <path d="M98 132 C95 125, 105 120, 106 135 C107 145, 100 148, 98 140 Z" fill="${c.skinTone}" stroke="#161B18" stroke-width="3" />
      <path d="M202 132 C205 125, 195 120, 194 135 C193 145, 200 148, 202 140 Z" fill="${c.skinTone}" stroke="#161B18" stroke-width="3" />
      <ellipse cx="132" cy="126" rx="4" ry="4.5" fill="#161B18" />
      <ellipse cx="168" cy="126" rx="4" ry="4.5" fill="#161B18" />
      <circle cx="134" cy="124" r="1.2" fill="#FFFFFF" />
      <circle cx="170" cy="124" r="1.2" fill="#FFFFFF" />
      <path d="M124 116 C129 113, 137 114, 140 117" stroke="#161B18" stroke-width="2.5" stroke-linecap="round" />
      <path d="M176 116 C171 113, 163 114, 160 117" stroke="#161B18" stroke-width="2.5" stroke-linecap="round" />
      <path d="M148 126 C152 134, 153 140, 147 143" stroke="#161B18" stroke-width="2.5" stroke-linecap="round" fill="none" />
      <path d="M136 156 C144 163, 156 163, 164 156" stroke="#161B18" stroke-width="3" stroke-linecap="round" fill="none" />
      ${hairMarkup}
      ${facialHairMarkup}
      ${accessoryMarkup}
    </svg>
  `.trim();
}

/**
 * Returns a data:image/svg+xml;utf8 URI ready to be used as img src or avatarUrl
 */
export function avatarConfigToDataUrl(config: AvatarConfig = DEFAULT_AVATAR_CONFIG): string {
  const svg = generateAvatarSvg(config);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Generates an SVG monogram avatar with modern gradients
 */
export function generateMonogramDataUrl(letter: string, gradientId: string = 'emerald'): string {
  const char = (letter || 'A').toUpperCase().slice(0, 2);
  const gradients: Record<string, { start: string; end: string }> = {
    emerald: { start: '#10B981', end: '#064E3B' },
    violet: { start: '#8B5CF6', end: '#4C1D95' },
    cyan: { start: '#06B6D4', end: '#0E7490' },
    amber: { start: '#F59E0B', end: '#B45309' },
    rose: { start: '#F43F5E', end: '#9F1239' },
  };

  const g = gradients[gradientId] || gradients.emerald;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
      <defs>
        <linearGradient id="monoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${g.start}" />
          <stop offset="100%" stop-color="${g.end}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" rx="48" fill="url(#monoGrad)" />
      <text x="50%" y="54%" font-size="88" font-family="system-ui, -apple-system, sans-serif" font-weight="900" fill="#FFFFFF" dominant-baseline="middle" text-anchor="middle" letter-spacing="-2">
        ${char}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
