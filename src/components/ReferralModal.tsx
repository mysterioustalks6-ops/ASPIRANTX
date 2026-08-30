import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { generateReferralCode, applyReferralCode } from '../lib/gamification';
import { 
  Gift, 
  Share2, 
  Copy, 
  Check, 
  Users, 
  Sparkles, 
  Coins, 
  Award, 
  X, 
  Send, 
  QrCode, 
  ShieldCheck, 
  ChevronRight,
  Zap,
  ArrowRight
} from 'lucide-react';

interface ReferralModalProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: (updated: UserProfile) => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [inputCode, setInputCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const referralCode = user.referralCode || generateReferralCode(user.id);
  const shareUrl = `${window.location.origin}?ref=${referralCode}`;
  const whatsappShareText = encodeURIComponent(
    `🚀 Hey! Join me on AspirantX - the ultimate study platform for Class 1 to Ph.D. & Competitive Exams!\n\nUse my Referral Code: *${referralCode}* to get 150 FREE Bonus Coins + 1 Day PRO Pass!\n\nJoin here: ${shareUrl}`
  );
  const telegramShareText = encodeURIComponent(
    `🚀 Join me on AspirantX! Use my Referral Code ${referralCode} to claim 150 Free Coins & PRO Pass.`
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const res = await applyReferralCode(user, inputCode);
    setIsSubmitting(false);

    if (res.success) {
      setFeedbackMessage({ text: res.message, isError: false });
      setInputCode('');
      if (onUserUpdated) onUserUpdated(res.updatedUser);
    } else {
      setFeedbackMessage({ text: res.message, isError: true });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative my-auto"
      >
        {/* Glow Effects */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between relative z-10 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Refer & Earn Program
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 uppercase">
                  150 Coins + PRO Pass
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Invite friends, classmates & fellow aspirants to earn coins & unlock PRO perks!
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

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Section 1: Your Unique Referral Code Box */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Your Personal Referral Code
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
                <Users className="w-3.5 h-3.5 text-cyan-400" /> Referred: {user.totalReferrals || 2} Friends
              </span>
            </div>

            {/* Code Display & Copy Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full flex-1 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700/80 flex items-center justify-between group">
                <span className="text-lg font-black tracking-widest font-mono text-amber-300">
                  {referralCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-amber-500/30"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Direct Share Link Copy */}
              <button
                onClick={handleCopyLink}
                className="w-full sm:w-auto px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Copied Link!
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-cyan-400" /> Copy Link
                  </>
                )}
              </button>
            </div>

            {/* Quick Share Apps */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <a
                href={`https://wa.me/?text=${whatsappShareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Send className="w-4 h-4 text-emerald-400" /> Share on WhatsApp
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${telegramShareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Send className="w-4 h-4 text-sky-400" /> Share on Telegram
              </a>
            </div>
          </div>

          {/* Section 2: Redeem Friend's Code */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Have a Friend's Referral Code?
            </h3>
            <p className="text-xs text-slate-400">
              Enter code from a friend to immediately claim <strong>+150 Bonus Coins</strong> + <strong>1 Day FREE PRO Pass</strong>!
            </p>

            {user.referredBy ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>You redeemed code <strong>'{user.referredBy}'</strong>! Bonus granted.</span>
              </div>
            ) : (
              <form onSubmit={handleRedeemCode} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  required
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="e.g. ASPIRANT-1024"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-400 text-xs text-white font-mono uppercase outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-cyan-500/20"
                >
                  {isSubmitting ? 'Verifying...' : 'Redeem Code'}
                </button>
              </form>
            )}

            {feedbackMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-bold border ${
                  feedbackMessage.isError
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {feedbackMessage.text}
              </div>
            )}
          </div>

          {/* Section 3: Referral Milestone Rewards Roadmap */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4" /> Referral Milestones & Unlockable Rewards
            </h3>

            <div className="space-y-2.5 text-xs">
              {/* Milestone 1 */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 font-black">
                    1 Friend
                  </div>
                  <div>
                    <p className="font-bold text-white">+100 Bonus Coins & 50 XP</p>
                    <p className="text-[10px] text-slate-400">Awarded as soon as friend signs up</p>
                  </div>
                </div>
                <span className="text-emerald-400 font-extrabold text-[11px] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Unlocked
                </span>
              </div>

              {/* Milestone 2 */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 font-black">
                    5 Friends
                  </div>
                  <div>
                    <p className="font-bold text-white">+500 Coins + 3 Days PRO Pass</p>
                    <p className="text-[10px] text-slate-400">Progress: 2/5 Friends Referred</p>
                  </div>
                </div>
                <span className="text-amber-400 font-extrabold text-[11px]">
                  3 More Needed
                </span>
              </div>

              {/* Milestone 3 */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 font-black">
                    10 Friends
                  </div>
                  <div>
                    <p className="font-bold text-white">+1,000 Coins + 7 Days PRO Pass + Ambassador Badge</p>
                    <p className="text-[10px] text-slate-400">Super Aspirant Status</p>
                  </div>
                </div>
                <span className="text-purple-400 font-extrabold text-[11px]">
                  Locked
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900">
          <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400" /> Total Earnings: {user.referralEarnings || 200} Coins
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
