import React, { useState } from 'react';
import { soundFx } from '../lib/soundEffects';

export type VeerState = 'idle' | 'cheering' | 'thinking' | 'worried' | 'sleeping';

export interface VeerMascotProps {
  state?: VeerState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speechBubble?: string;
  showSpeechBubble?: boolean;
  className?: string;
  onClick?: () => void;
  showClickTip?: boolean;
}

const VEER_DIALOGUES: Record<VeerState, string[]> = {
  idle: [
    'Aaj ki Ride shuru karein? Bas 3 stops baaki hain! 🚀',
    'Roz 2 chapters mark off karo, consistency hi exam nikalwayegi. 📚',
    'Dhyan se padho, jaldbazi nahi! Main yahin hoon. 🦉',
  ],
  cheering: [
    'Shabaash! Ek aur topic lock ho gaya! 🎉',
    'Gazab accuracy! Aaj AIR-1 wali pace hai! ⚡',
    'Target poora! Aaj ki padhai top-class rahi! 🏆',
  ],
  thinking: [
    'Is question ko dhyan se padho, concept clear hai na? 🤔',
    'Pehle eliminate karo, phir answer choose karo! 💭',
    'Formula yaad karo, derivation samajh aa jayegi. 📐',
  ],
  worried: [
    'Revision time aa gaya hai! Ye topics thode fade ho rahe hain. ⚠️',
    'Streak tutne mat dena! Bas 10 minute ka drill kar lo. 🔥',
    'Galat hua? Koi baat nahi, solution sheet dekho aur seekho! 💡',
  ],
  sleeping: [
    'Zzz... Aaj ka goal complete! Ab acchi neend lo. 🌙',
    'Brain recharge time! Kal subah nayi Ride shuru karenge. 😴',
  ],
};

export const VeerMascot: React.FC<VeerMascotProps> = ({
  state = 'idle',
  size = 'md',
  speechBubble,
  showSpeechBubble = true,
  className = '',
  onClick,
  showClickTip = true,
}) => {
  const [dialogueIndex, setDialogueIndex] = useState(0);

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { w: 56, h: 56, text: 'text-[11px]' };
      case 'md':
        return { w: 84, h: 84, text: 'text-xs' };
      case 'lg':
        return { w: 120, h: 120, text: 'text-sm' };
      case 'xl':
        return { w: 160, h: 160, text: 'text-base' };
    }
  };

  const { w, h, text } = getDimensions();

  const handleClick = () => {
    soundFx.playTap();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(15);
    }
    const pool = VEER_DIALOGUES[state];
    setDialogueIndex((prev) => (prev + 1) % pool.length);
    onClick?.();
  };

  const activeSpeech = showSpeechBubble
    ? (speechBubble || VEER_DIALOGUES[state][dialogueIndex % VEER_DIALOGUES[state].length])
    : null;

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      {/* Speech Bubble */}
      {activeSpeech && (
        <div
          onClick={handleClick}
          className={`mb-2 px-3 py-2 rounded-2xl bg-[var(--sr-surface)] border-2 border-[var(--sr-line-strong)] text-[var(--sr-text)] font-bold shadow-sm max-w-[260px] text-center cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 ${text}`}
        >
          {activeSpeech}
          {/* Arrow */}
          <div className="w-2.5 h-2.5 bg-[var(--sr-surface)] border-b-2 border-r-2 border-[var(--sr-line-strong)] rotate-45 mx-auto -mb-3.5 mt-1" />
        </div>
      )}

      {/* Vector SVG Mascot (Original Indian Scholar Falcon/Owl "Veer") */}
      <div
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`Veer Mascot: ${state} state`}
        className="cursor-pointer transition-transform duration-150 active:scale-90 hover:scale-105"
        style={{ width: w, height: h }}
      >
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Body Base */}
          <ellipse cx="60" cy="68" rx="42" ry="40" fill="#18803E" />
          {/* Chest Feathers (Warm Cream) */}
          <ellipse cx="60" cy="74" rx="26" ry="25" fill="#F8FAFC" />
          <path
            d="M52 68 Q60 76 68 68 M50 78 Q60 86 70 78"
            stroke="#CBD5E1"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Wings */}
          {state === 'cheering' ? (
            <>
              {/* Wings Raised in Triumph */}
              <path
                d="M20 60 C8 38 12 18 24 24 C32 30 36 50 32 68 Z"
                fill="#137333"
                stroke="#0D5023"
                strokeWidth="2"
              />
              <path
                d="M100 60 C112 38 108 18 96 24 C88 30 84 50 88 68 Z"
                fill="#137333"
                stroke="#0D5023"
                strokeWidth="2"
              />
            </>
          ) : (
            <>
              {/* Folded Calm Wings */}
              <path
                d="M20 62 C16 75 22 92 34 88 C36 78 30 64 24 60 Z"
                fill="#137333"
                stroke="#0D5023"
                strokeWidth="1.5"
              />
              <path
                d="M100 62 C104 75 98 92 86 88 C84 78 90 64 96 60 Z"
                fill="#137333"
                stroke="#0D5023"
                strokeWidth="1.5"
              />
            </>
          )}

          {/* Head */}
          <circle cx="60" cy="40" r="32" fill="#18803E" />

          {/* Aspirant Headband (Saffron/Gold Milestone Accent) */}
          <path
            d="M30 34 C44 26 76 26 90 34 L88 40 C74 32 46 32 32 40 Z"
            fill="#D97706"
          />
          {/* Ashoka/Focus Jewel on Headband */}
          <circle cx="60" cy="35" r="4.5" fill="#FFFFFF" stroke="#D97706" strokeWidth="1.5" />
          <circle cx="60" cy="35" r="2" fill="#1D4ED8" />

          {/* Eyes & Expressions */}
          {state === 'sleeping' ? (
            <>
              {/* Closed Sleep Eyes */}
              <path d="M42 46 Q49 52 56 46" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
              <path d="M64 46 Q71 52 78 46" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : state === 'worried' ? (
            <>
              {/* Worried / Focused Eyes */}
              <ellipse cx="49" cy="46" rx="9" ry="10" fill="#FFFFFF" />
              <ellipse cx="71" cy="46" rx="9" ry="10" fill="#FFFFFF" />
              <circle cx="49" cy="48" r="4" fill="#0F172A" />
              <circle cx="71" cy="48" r="4" fill="#0F172A" />
              {/* Worried Brows */}
              <path d="M40 38 L54 41" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M80 38 L66 41" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Big Confident Scholar Eyes */}
              <ellipse cx="49" cy="46" rx="9" ry="10" fill="#FFFFFF" />
              <ellipse cx="71" cy="46" rx="9" ry="10" fill="#FFFFFF" />
              <circle cx="50" cy="46" r="4.5" fill="#0F172A" />
              <circle cx="72" cy="46" r="4.5" fill="#0F172A" />
              {/* Eye Catchlights */}
              <circle cx="52" cy="44" r="1.5" fill="#FFFFFF" />
              <circle cx="74" cy="44" r="1.5" fill="#FFFFFF" />
              {/* Determined Brows */}
              <path d="M42 37 L54 39" stroke="#0D5023" strokeWidth="2" strokeLinecap="round" />
              <path d="M78 37 L66 39" stroke="#0D5023" strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {/* Scholar Beak */}
          <polygon points="56,52 64,52 60,61" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />

          {/* Feet */}
          <ellipse cx="48" cy="104" rx="7" ry="4" fill="#D97706" />
          <ellipse cx="72" cy="104" rx="7" ry="4" fill="#D97706" />
        </svg>
      </div>

      {showClickTip && (
        <span className="text-[11px] font-bold text-[var(--sr-text-subtle)] mt-1 tracking-tight">
          Tap Veer 🦉
        </span>
      )}
    </div>
  );
};
