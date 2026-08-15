import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  Crown, 
  Zap, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Gift, 
  AlertCircle, 
  Building, 
  Smartphone,
  History,
  ShieldCheck,
  Award,
  ChevronRight,
  X
} from 'lucide-react';
import { UserProfile } from '../types';

interface WalletData {
  balance: number;
  held?: number;
  totalEarned: number;
  totalSpent: number;
  inrRate: number;
  inrValue: number;
  minPayoutCoins: number;
  transactions: Array<{
    id: string;
    type: 'reward_streak' | 'reward_cbt' | 'reward_helpful_post' | 'tip_received' | 'tip_sent' | 'conversion' | 'payout';
    amount: number;
    description: string;
    createdAt: string;
  }>;
}

interface PayoutRecord {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  coins: number;
  inrAmount: number;
  payoutMethod: 'upi' | 'bank';
  payoutDetails: {
    upiId?: string;
    accountHolder?: string;
    accountNumber?: string;
    ifsc?: string;
  };
  status: 'pending_admin_review' | 'paid' | 'rejected' | string;
  gateway: string;
  rzpReferenceId?: string | null;
  transferReference?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  processedAt?: string | null;
  processedBy?: string | null;
}

interface CommunityWalletProps {
  userProfile: UserProfile;
  onOpenPremium?: () => void;
}

export const CommunityWallet: React.FC<CommunityWalletProps> = ({ userProfile, onOpenPremium }) => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'earned' | 'spent' | 'payouts'>('all');

  // Modals
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);
  const [showConvertModal, setShowConvertModal] = useState<boolean>(false);

  // Payout Form State
  const [payoutCoins, setPayoutCoins] = useState<number>(500);
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>(userProfile.name || '');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [ifsc, setIfsc] = useState<string>('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState<boolean>(false);
  const [payoutSuccess, setPayoutSuccess] = useState<PayoutRecord | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  // Conversion State
  const [convertCoins, setConvertCoins] = useState<number>(100);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [convertMsg, setConvertMsg] = useState<{ success: boolean; text: string } | null>(null);

  const fetchWallet = async () => {
    try {
      const res = await fetch(`/api/user/wallet?userId=${encodeURIComponent(userProfile.id)}`);
      const data = await res.json();
      if (data.success && data.wallet) {
        setWallet(data.wallet);
      }
    } catch (err) {
      console.warn('Failed to fetch wallet:', err);
    }
  };

  const fetchPayouts = async () => {
    try {
      const res = await fetch(`/api/user/wallet/payouts?userId=${encodeURIComponent(userProfile.id)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.payouts)) {
        setPayouts(data.payouts);
      }
    } catch (err) {
      console.warn('Failed to fetch payouts:', err);
    }
  };

  useEffect(() => {
    Promise.all([fetchWallet(), fetchPayouts()]).finally(() => setLoading(false));
  }, [userProfile.id]);

  const handleConvert = async (type: 'pro_days' | 'cash') => {
    setIsConverting(true);
    setConvertMsg(null);
    try {
      const res = await fetch('/api/user/wallet/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.id,
          conversionType: type,
          coins: convertCoins,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConvertMsg({ success: true, text: data.message });
        setWallet(data.updatedWallet);
      } else {
        setConvertMsg({ success: false, text: data.error || 'Conversion failed.' });
      }
    } catch (err: any) {
      setConvertMsg({ success: false, text: err?.message || 'Network error.' });
    } finally {
      setIsConverting(false);
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutError(null);

    if (payoutMethod === 'upi' && !upiId.trim()) {
      setPayoutError('Please enter a valid UPI ID (e.g., student@oksbi).');
      return;
    }
    if (payoutMethod === 'bank' && (!accountNumber.trim() || !ifsc.trim())) {
      setPayoutError('Please enter valid Bank Account Number and IFSC Code.');
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const res = await fetch('/api/user/wallet/payout-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userProfile.id,
          coins: payoutCoins,
          payoutMethod,
          payoutDetails: {
            upiId: upiId.trim(),
            accountHolder: accountHolder.trim(),
            accountNumber: accountNumber.trim(),
            ifsc: ifsc.trim().toUpperCase(),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPayoutSuccess(data.payout);
        setPayouts((prev) => [data.payout, ...prev]);
        if (wallet) {
          setWallet({ ...wallet, balance: data.updatedBalance });
        }
      } else {
        setPayoutError(data.error || 'Payout request failed.');
      }
    } catch (err: any) {
      setPayoutError(err?.message || 'Network error during payout.');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  const filteredTransactions = (wallet?.transactions || []).filter((tx) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'earned') return tx.amount > 0;
    if (activeFilter === 'spent') return tx.amount < 0 && tx.type !== 'payout';
    if (activeFilter === 'payouts') return tx.type === 'payout';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* WALLET HERO DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Balance Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 relative overflow-hidden shadow-xl text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Coins className="w-4 h-4 fill-amber-400" />
              <span>Aspirant Study Tokens & Wallet</span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              10 Coins = ₹1 INR
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline gap-6">
            <div>
              <p className="text-3xl sm:text-4xl font-black text-amber-400 flex items-center gap-2">
                <Coins className="w-8 h-8 fill-amber-400" />
                {wallet?.balance ?? 250}
                <span className="text-lg text-slate-300 font-medium">Coins</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Available Real-World Value: <strong className="text-emerald-400 font-extrabold">₹{((wallet?.balance ?? 250) * 0.1).toFixed(2)} INR</strong>
              </p>
            </div>

            {wallet?.held !== undefined && wallet.held > 0 && (
              <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">In Escrow (Pending Review)</span>
                <span className="text-lg font-black text-amber-200">🪙 {wallet.held} Coins (₹{(wallet.held * 0.1).toFixed(2)})</span>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                setConvertMsg(null);
                setShowConvertModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Crown className="w-4 h-4 fill-current" />
              <span>Convert to PRO Days</span>
            </button>

            <button
              onClick={() => {
                setPayoutSuccess(null);
                setPayoutError(null);
                setShowPayoutModal(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Request Payout (UPI / Bank)</span>
            </button>
          </div>
        </div>

        {/* Lifetime Earnings Metric Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-md">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
              <span>Earnings Overview</span>
              <Award className="w-4 h-4 text-purple-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-1 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Total Coins Earned</span>
                <span className="font-extrabold text-emerald-400">+{wallet?.totalEarned ?? 350}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800 text-xs">
                <span className="text-slate-400">Total Coins Spent / Tipped</span>
                <span className="font-extrabold text-rose-400">-{wallet?.totalSpent ?? 100}</span>
              </div>
              <div className="flex justify-between items-center py-1 text-xs">
                <span className="text-slate-400">Min. Payout Threshold</span>
                <span className="font-bold text-slate-200">500 Coins (₹50)</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Escrow protected: tokens held securely until admin approval</span>
          </div>
        </div>
      </div>

      {/* HOW TO EARN TOKENS SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-100 flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Ways to Earn Study Tokens</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 w-fit">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-200">Daily Study Streak</p>
            <p className="text-[11px] text-slate-400">Maintain consecutive study days to earn +20 to +50 coins daily.</p>
            <p className="text-xs font-extrabold text-amber-400">+20–50 Coins</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit">
              <Award className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-200">Complete CBT Tests</p>
            <p className="text-[11px] text-slate-400">Score &gt;70% in all-India mock tests to unlock bonus bounties.</p>
            <p className="text-xs font-extrabold text-amber-400">+100 Coins</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit">
              <Gift className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-200">Help Peers & Share Notes</p>
            <p className="text-[11px] text-slate-400">Answer questions or post high-yield notes in Community to get tipped.</p>
            <p className="text-xs font-extrabold text-amber-400">+10–50 Coins / Tip</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 w-fit">
              <Crown className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-200">Refer Fellow Aspirants</p>
            <p className="text-[11px] text-slate-400">Invite batchmates with your referral link and get 150 coins per join.</p>
            <p className="text-xs font-extrabold text-amber-400">+150 Coins / Refer</p>
          </div>
        </div>
      </div>

      {/* TRANSACTION HISTORY & PAYOUT LEDGER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-100">
            <History className="w-4 h-4 text-indigo-400" />
            <span>Wallet Ledger & Activity History</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl text-xs font-semibold text-slate-400 border border-slate-800">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'hover:text-slate-200'
              }`}
            >
              All Activity
            </button>
            <button
              onClick={() => setActiveFilter('earned')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'earned' ? 'bg-indigo-600 text-white font-bold' : 'hover:text-slate-200'
              }`}
            >
              Earned (+)
            </button>
            <button
              onClick={() => setActiveFilter('spent')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'spent' ? 'bg-indigo-600 text-white font-bold' : 'hover:text-slate-200'
              }`}
            >
              Spent / Tips (-)
            </button>
            <button
              onClick={() => setActiveFilter('payouts')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'payouts' ? 'bg-indigo-600 text-white font-bold' : 'hover:text-slate-200'
              }`}
            >
              Razorpay Payouts
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="divide-y divide-slate-800/80">
          {filteredTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No transactions found in this view.
            </div>
          ) : (
            filteredTransactions.map((tx) => {
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl shrink-0 ${
                      isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-200 truncate">{tx.description}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-black text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? `+${tx.amount}` : tx.amount} Coins
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RAZORPAY PAYOUT MODAL */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Zap className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Razorpay Cash Payout</h3>
                  <p className="text-[11px] text-slate-400">Withdraw study tokens directly to your Bank or UPI</p>
                </div>
              </div>

              <button
                onClick={() => setShowPayoutModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {payoutSuccess ? (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Payout Request Completed!</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    ₹{payoutSuccess.inrAmount} INR has been dispatched via RazorpayX Payouts.
                  </p>
                  <div className="pt-2 text-[11px] text-slate-400 font-mono space-y-1">
                    <p>Transaction ID: <span className="text-slate-200">{payoutSuccess.id}</span></p>
                    <p>Reference: <span className="text-slate-200">{payoutSuccess.rzpReferenceId}</span></p>
                    <p>Gateway: <span className="text-slate-200">{payoutSuccess.gateway}</span></p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handlePayoutSubmit} className="space-y-4">
                {/* Available Balance Preview */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Available Balance:</span>
                    <p className="font-black text-amber-400 text-sm mt-0.5">{wallet?.balance ?? 250} Coins</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Conversion Rate:</span>
                    <p className="font-bold text-slate-200 text-xs mt-0.5">10 Coins = ₹1 INR</p>
                  </div>
                </div>

                {/* Coin Amount Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Amount of Coins to Withdraw (Min 500):</label>
                  <div className="flex items-center gap-2">
                    {[500, 1000, 2000].map((preset) => (
                      <button
                        type="button"
                        key={preset}
                        onClick={() => setPayoutCoins(preset)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          payoutCoins === preset
                            ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {preset} Coins (₹{preset * 0.1})
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={500}
                    max={wallet?.balance || 500}
                    value={payoutCoins}
                    onChange={(e) => setPayoutCoins(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-emerald-400 font-bold">
                    You will receive: ₹{(payoutCoins * 0.1).toFixed(2)} INR
                  </p>
                </div>

                {/* Payout Method Toggle */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Payout Transfer Mode:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('upi')}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold ${
                        payoutMethod === 'upi'
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Instant UPI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('bank')}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold ${
                        payoutMethod === 'bank'
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <Building className="w-4 h-4" />
                      <span>Bank Account</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Details Field */}
                {payoutMethod === 'upi' ? (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">UPI ID (VPA):</label>
                    <input
                      type="text"
                      placeholder="e.g. mobile@upi or student@oksbi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Account Holder Name:</label>
                      <input
                        type="text"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Account Number:</label>
                        <input
                          type="password"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Bank Account No."
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">IFSC Code:</label>
                        <input
                          type="text"
                          value={ifsc}
                          onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                          placeholder="SBIN0001234"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {payoutError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                    {payoutError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingPayout || (wallet?.balance || 0) < payoutCoins}
                    className="px-5 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    {isSubmittingPayout ? 'Processing via Razorpay...' : `Confirm ₹${(payoutCoins * 0.1).toFixed(2)} Payout`}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* CONVERT TO PRO MODAL */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5 relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Crown className="w-5 h-5 fill-purple-400" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Convert Tokens to PRO Days</h3>
                  <p className="text-[11px] text-slate-400">100 Coins = 1 Full Day of AspirantX PRO</p>
                </div>
              </div>

              <button
                onClick={() => setShowConvertModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400">Available:</span>
                  <p className="font-extrabold text-amber-400 text-sm mt-0.5">{wallet?.balance ?? 250} Coins</p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Conversion Cost:</span>
                  <p className="font-extrabold text-purple-300 text-sm mt-0.5">100 Coins / Day</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Choose Coins to Convert:</label>
                <div className="flex gap-2">
                  {[100, 200, 300].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setConvertCoins(c)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-bold ${
                        convertCoins === c
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      {c} Coins ({c / 100}d PRO)
                    </button>
                  ))}
                </div>
              </div>

              {convertMsg && (
                <div className={`p-3 rounded-xl border text-xs font-semibold ${
                  convertMsg.success
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                }`}>
                  {convertMsg.text}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConvertModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => handleConvert('pro_days')}
                disabled={isConverting || (wallet?.balance || 0) < convertCoins}
                className="px-5 py-2.5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/20 disabled:opacity-50"
              >
                {isConverting ? 'Converting...' : `Redeem ${convertCoins / 100} Day(s) PRO`}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
