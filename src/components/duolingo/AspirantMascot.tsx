import React from 'react';
import { motion } from 'motion/react';

export type MascotState = 'idle' | 'happy' | 'celebrating' | 'thinking' | 'encouraging';

interface AspirantMascotProps {
  state?: MascotState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speechBubble?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * "Veer" - The AspirantX Champion Mascot
 * An energetic, inspiring Indian Falcon / Phoenix Scholar wearing an Aspirant headband,
 * graduation feather crest, and a bright confident expression.
 * 100% original vector SVG character designed specifically for exam aspirants.
 */
export const AspirantMascot: React.FC<AspirantMascotProps> = ({
  state = 'idle',
  size = 'md',
  speechBubble,
  className = '',
  onClick,
}) => {
  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { w: 64, h: 64, bubbleText: 'text-[10px]' };
      case 'md':
        return { w: 96, h: 96, bubbleText: 'text-xs' };
      case 'lg':
        return { w: 140, h: 140, bubbleText: 'text-sm' };
      case 'xl':
        return { w: 180, h: 180, bubbleText: 'text-base' };
    }
  };

  const { w, h, bubbleText } = getDimensions();

  // Animation variants depending on emotional state
  const mascotVariants = {
    idle: {
      y: [0, -4, 0],
      transition: { duration: 2.2, repeat: Infinity }
    },
    happy: {
      y: [0, -12, 0, -8, 0],
      rotate: [0, -4, 4, -2, 0],
      transition: { duration: 0.8 }
    },
    celebrating: {
      y: [0, -16, 0, -10, 0],
      rotate: [0, -6, 6, -4, 0],
      scale: [1, 1.08, 1, 1.05, 1],
      transition: { duration: 1.2, repeat: Infinity }
    },
    thinking: {
      rotate: [0, 4, 0],
      transition: { duration: 1.8, repeat: Infinity }
    },
    encouraging: {
      scale: [1, 1.04, 1],
      y: [0, -4, 0],
      transition: { duration: 1.6, repeat: Infinity }
    }
  };

  return (
    <div 
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <motion.div
        variants={mascotVariants}
        animate={state}
        style={{ width: w, height: h }}
        className="relative shrink-0"
      >
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full filter drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* DEFINITIONS & GRADIENTS */}
          <defs>
            {/* Primary Body: Vibrant Emerald / Teal Gradient */}
            <linearGradient id="bodyGrad" x1="20" y1="30" x2="140" y2="150" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="60%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            {/* Belly / Chest: Warm Golden Sunrise */}
            <linearGradient id="chestGrad" x1="45" y1="65" x2="115" y2="135" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#EAB308" />
            </linearGradient>

            {/* Headband / Hero Ribbon: Crimson Energy */}
            <linearGradient id="headbandGrad" x1="30" y1="35" x2="130" y2="55" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>

            {/* Beak / Talons: Amber Orange */}
            <linearGradient id="beakGrad" x1="70" y1="65" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FB923C" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
          </defs>

          {/* FEET / TALONS */}
          <ellipse cx="60" cy="148" rx="14" ry="6" fill="#EA580C" />
          <ellipse cx="100" cy="148" rx="14" ry="6" fill="#EA580C" />
          <circle cx="53" cy="149" r="3" fill="#C2410C" />
          <circle cx="60" cy="150" r="3.2" fill="#C2410C" />
          <circle cx="67" cy="149" r="3" fill="#C2410C" />
          <circle cx="93" cy="149" r="3" fill="#C2410C" />
          <circle cx="100" cy="150" r="3.2" fill="#C2410C" />
          <circle cx="107" cy="149" r="3" fill="#C2410C" />

          {/* MAIN ROUNDED BODY */}
          <path
            d="M80 20 C125 20, 138 60, 138 98 C138 132, 115 146, 80 146 C45 146, 22 132, 22 98 C22 60, 35 20, 80 20 Z"
            fill="url(#bodyGrad)"
            stroke="#064E3B"
            strokeWidth="4"
          />

          {/* CHEST PLUMAGE */}
          <path
            d="M80 68 C105 68, 114 85, 114 108 C114 130, 100 142, 80 142 C60 142, 46 130, 46 108 C46 85, 55 68, 80 68 Z"
            fill="url(#chestGrad)"
          />
          {/* Subtle Chest Feather scallops */}
          <path d="M68 95 Q80 102 92 95" stroke="#CA8A04" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M72 110 Q80 116 88 110" stroke="#CA8A04" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* WINGS */}
          {state === 'celebrating' || state === 'happy' ? (
            // Raised triumphant wings
            <>
              {/* Left Wing Up */}
              <path
                d="M30 85 C10 65, 8 40, 24 35 C38 32, 42 55, 36 80 Z"
                fill="#059669"
                stroke="#064E3B"
                strokeWidth="3.5"
              />
              {/* Right Wing Up */}
              <path
                d="M130 85 C150 65, 152 40, 136 35 C122 32, 118 55, 124 80 Z"
                fill="#059669"
                stroke="#064E3B"
                strokeWidth="3.5"
              />
            </>
          ) : (
            // Natural resting side wings
            <>
              {/* Left Wing */}
              <path
                d="M26 80 C18 95, 20 118, 38 122 C40 112, 38 92, 32 80 Z"
                fill="#059669"
                stroke="#064E3B"
                strokeWidth="3.5"
              />
              {/* Right Wing */}
              <path
                d="M134 80 C142 95, 140 118, 122 122 C120 112, 122 92, 128 80 Z"
                fill="#059669"
                stroke="#064E3B"
                strokeWidth="3.5"
              />
            </>
          )}

          {/* HEAD CREST FEATHERS (Top Wisdom Tuft) */}
          <path d="M80 20 C76 8, 80 2, 84 2 C88 2, 86 10, 84 20 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="2" />
          <path d="M72 23 C66 12, 70 8, 74 7 C78 7, 76 15, 76 23 Z" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
          <path d="M88 23 C94 12, 90 8, 86 7 C82 7, 84 15, 84 23 Z" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />

          {/* HERO ASPIRANT HEADBAND */}
          <path
            d="M32 44 C55 36, 105 36, 128 44 L126 55 C105 48, 55 48, 34 55 Z"
            fill="url(#headbandGrad)"
            stroke="#991B1B"
            strokeWidth="2.5"
          />
          {/* Headband Star / Aspirant Crest */}
          <circle cx="80" cy="46" r="5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1.5" />
          <path d="M80 43 L81 45 L83 45 L81.5 46.5 L82 48.5 L80 47.5 L78 48.5 L78.5 46.5 L77 45 L79 45 Z" fill="#EAB308" />

          {/* EYES */}
          {state === 'happy' || state === 'celebrating' ? (
            // Cheerful arching eyes
            <>
              <path d="M54 62 Q64 54 74 62" stroke="#0F172A" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <path d="M86 62 Q96 54 106 62" stroke="#0F172A" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              {/* Rosy Blush */}
              <circle cx="48" cy="74" r="6" fill="#F87171" opacity="0.6" />
              <circle cx="112" cy="74" r="6" fill="#F87171" opacity="0.6" />
            </>
          ) : state === 'thinking' ? (
            // Contemplative eyes (one looking up, one squinted)
            <>
              <ellipse cx="64" cy="62" rx="10" ry="11" fill="#FFFFFF" stroke="#064E3B" strokeWidth="3" />
              <circle cx="66" cy="58" r="5" fill="#0F172A" />
              <circle cx="68" cy="56" r="2" fill="#FFFFFF" />

              <path d="M88 64 Q97 58 106 64" stroke="#0F172A" strokeWidth="4" strokeLinecap="round" fill="none" />
            </>
          ) : (
            // Big luminous determined aspirant eyes
            <>
              {/* Left Eye */}
              <ellipse cx="63" cy="63" rx="11" ry="12" fill="#FFFFFF" stroke="#064E3B" strokeWidth="3" />
              <circle cx="64" cy="63" r="6.5" fill="#0F172A" />
              <circle cx="66.5" cy="60.5" r="2.8" fill="#FFFFFF" />
              <circle cx="62" cy="65.5" r="1.4" fill="#FFFFFF" />

              {/* Right Eye */}
              <ellipse cx="97" cy="63" rx="11" ry="12" fill="#FFFFFF" stroke="#064E3B" strokeWidth="3" />
              <circle cx="96" cy="63" r="6.5" fill="#0F172A" />
              <circle cx="98.5" cy="60.5" r="2.8" fill="#FFFFFF" />
              <circle cx="94" cy="65.5" r="1.4" fill="#FFFFFF" />

              {/* Confidence Eyebrows */}
              <path d="M52 50 Q64 47 74 52" stroke="#064E3B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              <path d="M108 50 Q96 47 86 52" stroke="#064E3B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </>
          )}

          {/* BEAK */}
          <path
            d="M72 72 Q80 66 88 72 Q84 88 80 91 Q76 88 72 72 Z"
            fill="url(#beakGrad)"
            stroke="#9A3412"
            strokeWidth="2.5"
          />
          {/* Beak smile highlight */}
          <path d="M75 75 Q80 72 85 75" stroke="#FDBA74" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* CELEBRATION CROWN / TROPHY (Optional during victory state) */}
          {state === 'celebrating' && (
            <g transform="translate(62, -2)">
              <polygon points="0,22 9,6 18,22 27,6 36,22" fill="#FBBF24" stroke="#B45309" strokeWidth="2" />
              <circle cx="9" cy="6" r="2.5" fill="#EF4444" />
              <circle cx="27" cy="6" r="2.5" fill="#3B82F6" />
              <circle cx="18" cy="14" r="3" fill="#10B981" />
            </g>
          )}
        </svg>
      </motion.div>

      {/* DUOLINGO-STYLE SPEECH BUBBLE */}
      {speechBubble && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, x: -8 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative bg-[#1A1D24] text-[#F3F4F6] border-2 border-[#2A2F3A] rounded-2xl px-3.5 py-2.5 shadow-xl max-w-[220px]"
        >
          {/* Bubble triangle pointer pointing left to mascot */}
          <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-t-[7px] border-t-transparent border-b-[7px] border-b-transparent border-r-[8px] border-r-[#2A2F3A]" />
          <div className="absolute top-1/2 -left-[6px] -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[7px] border-r-[#1A1D24]" />
          <p className={`${bubbleText} font-extrabold leading-snug`}>
            {speechBubble}
          </p>
        </motion.div>
      )}
    </div>
  );
};
