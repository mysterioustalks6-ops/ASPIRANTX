import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { UserProfile } from '../types';
import { saveUserProfile } from '../lib/gamification';
import { 
  Crown, 
  Check, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  CreditCard, 
  X, 
  CheckCircle2, 
  ArrowRight,
  Shield,
  Smartphone,
  KeyRound,
  Lock,
  Send
} from 'lucide-react';

interface PremiumPlansProps {
  user?: UserProfile | null;
  onUnlockPremium?: () => void;
}

export const PremiumPlans: React.FC<PremiumPlansProps> = ({ user, onUnlockPremium }) => {
  const [upgraded, setUpgraded] = useState<boolean>(Boolean(user?.isPremium));
  
  // Dynamic Pricing & Razorpay Gateway state from Admin Settings
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | 'lifetime'>('monthly');
  const [pricing, setPricing] = useState({
    monthlyPrice: 299,
    annualPrice: 1499,
    lifetimePrice: 2999,
    currency: 'INR',
    customDiscountPercent: 20,
    priceMoneyRules: 'Special Cashback: Get 100% XP bonus & ₹50 Cashback on completing 30-day study streak!',
  });

  // Fetch Gateway Settings from Admin Backend
  useEffect(() => {
    fetch('/api/admin/gateway-settings', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.planPricing) setPricing(data.planPricing);
      })
      .catch(() => {});
  }, []);

  // Gateway loading & notice state
  const [isOpeningGateway, setIsOpeningGateway] = useState<boolean>(false);
  const [gatewayNotice, setGatewayNotice] = useState<string | null>(null);

  // Modal States
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('aspirant@upi');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  // UTR / Transaction Reference Form State
  const [utrNumber, setUtrNumber] = useState('');
  const [utrSuccessMsg, setUtrSuccessMsg] = useState<string | null>(null);
  const [utrErrorMsg, setUtrErrorMsg] = useState<string | null>(null);
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);

  const getActiveAmount = () => {
    if (selectedPlan === 'monthly') return pricing.monthlyPrice;
    if (selectedPlan === 'annual') return pricing.annualPrice;
    return pricing.lifetimePrice;
  };

  const handleVerifyBackendPayment = async (razorpayResponse: any) => {
    setIsOpeningGateway(true);
    setGatewayNotice(null);

    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/payments/verify-payment', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature,
          userEmail: user?.email,
          planId: selectedPlan,
        }),
      });

      const data = await res.json();
      setIsOpeningGateway(false);

      if (data.verified && data.isPremium) {
        setPaymentSuccess(true);
        setUpgraded(true);
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.6 },
        });

        if (user) {
          const updatedUser: UserProfile = {
            ...user,
            isPremium: true,
          };
          await saveUserProfile(updatedUser);
        }

        if (onUnlockPremium) onUnlockPremium();
      } else {
        setGatewayNotice(`❌ Cryptographic Signature Failure: ${data.error || 'Backend payment verification failed.'}`);
      }
    } catch (err: any) {
      setIsOpeningGateway(false);
      setGatewayNotice(`❌ Server Verification Error: Could not reach payment server to verify signature.`);
    }
  };

  const handleInitiateRazorpayCheckout = async () => {
    const amount = getActiveAmount();
    setGatewayNotice(null);
    setIsOpeningGateway(true);

    try {
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Create Razorpay Order from server endpoint
      const res = await fetch('/api/payments/razorpay-order', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          planId: selectedPlan,
          amount,
          currency: pricing.currency,
          userEmail: user?.email,
          userName: user?.name,
        }),
      });

      const orderData = await res.json();
      setIsOpeningGateway(false);

      if (!res.ok || orderData.error) {
        setGatewayNotice('⚠️ ' + (orderData.error || 'Failed to create payment order.'));
        return;
      }

      if (orderData.hasKey && orderData.keyId && typeof window !== 'undefined') {
        const isRazorpayValidFn = () => {
          try {
            const rzp = (window as any).Razorpay;
            return (
              typeof rzp === 'function' &&
              !(rzp.prototype && (rzp.prototype instanceof Element || rzp.prototype instanceof Node))
            );
          } catch (err) {
            return false;
          }
        };

        if (!isRazorpayValidFn()) {
          await new Promise<void>((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            script.onload = () => {
              setTimeout(resolve, 500); // Give script time to initialize
            };
            script.onerror = () => resolve();
            document.body.appendChild(script);
          });
        }

        if (isRazorpayValidFn()) {
          const options: any = {
            key: orderData.keyId,
            amount: Math.round(amount * 100), // in paise
            currency: orderData.currency || 'INR',
            name: 'AspirantX Pro Membership',
            description: `AspirantX PRO ${selectedPlan.toUpperCase()} Pass`,
            prefill: {
              name: user?.name || 'Aspirant Student',
              email: user?.email || 'student@aspirantx.com',
            },
            theme: { color: '#f59e0b' },
            handler: function (response: any) {
              if (response && response.razorpay_payment_id && response.razorpay_signature) {
                handleVerifyBackendPayment(response);
              } else {
                setGatewayNotice('❌ Payment response missing required cryptographic signature or payment ID.');
              }
            },
            modal: {
              ondismiss: function () {
                console.log('Razorpay modal dismissed');
              },
            },
          };

          if (orderData.orderId) {
            options.order_id = orderData.orderId;
          } else {
            setGatewayNotice('❌ Error: No valid Order ID received from Razorpay Orders API.');
            setIsOpeningGateway(false);
            return;
          }

          try {
            const RazorpayClass = (window as any).Razorpay;
            const rzp1 = new RazorpayClass(options);
            rzp1.on('payment.failed', function (resp: any) {
              setGatewayNotice(`❌ Razorpay Payment Failed: ${resp.error?.description || 'Transaction cancelled or declined.'}`);
            });
            rzp1.open();
            return;
          } catch (err: any) {
            console.warn('Razorpay constructor error:', err);
            setGatewayNotice(`⚠️ Could not launch Razorpay window: ${err?.message || 'SDK error'}`);
            return;
          }
        } else {
          setGatewayNotice('⚠️ Failed to load Razorpay SDK. Please check your internet connection and try again.');
          return;
        }
      } else {
        // Key missing
        setGatewayNotice(
          '⚠️ Razorpay Gateway Inactive: Razorpay Key ID is not configured by Admin. Please set Razorpay Key in Admin Panel > Settings, or transfer payment directly via UPI and enter your 12-digit UTR below for Admin verification.'
        );
        return;
      }
    } catch (e: any) {
      setIsOpeningGateway(false);
      setGatewayNotice('⚠️ Gateway error connecting to payment server. Please try again or submit UTR below.');
    }
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiId || upiId.trim().length < 4) {
      alert('Please enter a valid UPI ID or Transaction Reference');
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowPaymentModal(false);
      setUtrSuccessMsg(`✅ UPI payment reference '${upiId}' submitted for verification. Admin will confirm and activate PRO Pass.`);
    }, 1200);
  };

  const handleSubmitUtrVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim() || utrNumber.trim().length < 6) {
      setUtrErrorMsg('Please enter a valid 12-digit UTR or Transaction Reference number.');
      return;
    }

    setIsSubmittingUtr(true);
    setUtrErrorMsg(null);

    try {
      const cleanUtr = utrNumber.trim().toUpperCase();
      const token = localStorage.getItem('aspirantx_auth_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/payments/utr-submit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          utr: cleanUtr,
          plan: selectedPlan,
          amount: getActiveAmount(),
          userEmail: user?.email,
          userName: user?.name,
        }),
      });

      const data = await res.json();
      setIsSubmittingUtr(false);

      if (data.success) {
        setUtrSuccessMsg(
          `✅ Transaction Ref UTR '${cleanUtr}' submitted successfully! Admin will verify and activate your PRO Pass shortly.`
        );
        setUtrNumber('');
      } else {
        setUtrErrorMsg(`❌ ${data.error || 'Failed to submit UTR for verification.'}`);
      }
    } catch (err) {
      setIsSubmittingUtr(false);
      setUtrErrorMsg('❌ Network error submitting UTR reference to server. Please try again.');
    }
  };

  const planFeatures = [
    'Unlimited AI Mains Answer & Essay Evaluation',
    'Personalized PYQ Trend Analysis & Prediction Engine',
    'Live Pomodoro Group Study Rooms with Toppers',
    'Full Access to UPSC & SSC Test Series (500+ Mocks)',
    '1-on-1 AI Interview Simulator with Real-time Speech',
    'Offline Study Notes PDF Exporter & Priority Support',
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* 💳 Razorpay / Gateway Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <div className="max-w-md w-full bg-[#0d0f17] border border-amber-500/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900 border border-slate-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black text-sm">
                  AX
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Razorpay / UPI Payment Gateway</h3>
                  <p className="text-[10px] text-slate-400">256-Bit Encrypted Payment Verification</p>
                </div>
              </div>

              {paymentSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                  </div>
                  <h3 className="text-xl font-black text-white">Payment Verified & PRO Unlocked!</h3>
                  <p className="text-xs text-slate-300">
                    Your AspirantX PRO Pass is now active. Enjoy full access to AI Chatbots, PYQ Predictors, and Answer Evaluation!
                  </p>
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setPaymentSuccess(false);
                    }}
                    className="w-full py-3 rounded-xl font-bold text-xs bg-emerald-500 text-slate-950 hover:brightness-110"
                  >
                    Return to Dashboard
                  </button>
                </div>
              ) : (
                <form onSubmit={handleExecutePayment} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-amber-300">AspirantX PRO {selectedPlan.toUpperCase()} Pass</span>
                      <p className="text-[10px] text-slate-400">Full UPSC & SSC AI Suite</p>
                    </div>
                    <span className="text-lg font-black text-white">₹{getActiveAmount()}</span>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-semibold ${
                        paymentMethod === 'upi'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" /> UPI / GPay
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-semibold ${
                        paymentMethod === 'card'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" /> Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('netbanking')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-semibold ${
                        paymentMethod === 'netbanking'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Shield className="w-4 h-4" /> NetBanking
                    </button>
                  </div>

                  {paymentMethod === 'upi' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">UPI ID / VPA Address</label>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@upi or gpay"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                  )}

                  {paymentMethod === 'card' && (
                    <div className="space-y-2 text-xs">
                      <input
                        type="text"
                        placeholder="Card Number (4000 1234 5678 9010)"
                        defaultValue="4242 4242 4242 4242"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                        required
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="MM/YY"
                          defaultValue="12/28"
                          className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                          required
                        />
                        <input
                          type="text"
                          placeholder="CVV"
                          defaultValue="123"
                          className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white"
                          required
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="w-full py-3.5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:brightness-110 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessingPayment ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                        Verifying Transaction...
                      </span>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-slate-950" /> Complete ₹{getActiveAmount()} Payment & Unlock PRO
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 border border-amber-500/30 text-center relative overflow-hidden space-y-3">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-widest">
          <Crown className="w-4 h-4 text-amber-400" /> Official AspirantX PRO Subscription
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Level Up Your UPSC & SSC Preparation
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          PRO access requires verified payment or direct Admin approval. Unlock unlimited AI Mains evaluation, PYQ predictors, and study rooms.
        </p>

        {/* Security Rule Notice */}
        <div className="p-3 rounded-2xl bg-black/50 border border-amber-500/30 text-xs text-amber-300 font-medium flex items-center justify-center gap-2 max-w-lg mx-auto">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>PRO Access is activated upon successful payment or manually approved by Admin.</span>
        </div>

        {/* Dynamic Admin Price Rules */}
        {pricing.priceMoneyRules && (
          <div className="mt-2 p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 font-semibold flex items-center justify-center gap-2 max-w-lg mx-auto">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{pricing.priceMoneyRules}</span>
          </div>
        )}
      </div>

      {/* Plan Selector Duration Tabs */}
      <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 max-w-md mx-auto text-xs font-bold">
        <button
          onClick={() => setSelectedPlan('monthly')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            selectedPlan === 'monthly'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Monthly Pass (₹{pricing.monthlyPrice})
        </button>
        <button
          onClick={() => setSelectedPlan('annual')}
          className={`flex-1 py-2.5 rounded-xl transition-all relative ${
            selectedPlan === 'annual'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Annual Pass (₹{pricing.annualPrice})
          <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-slate-950 uppercase">
            Save {pricing.customDiscountPercent}%
          </span>
        </button>
        <button
          onClick={() => setSelectedPlan('lifetime')}
          className={`flex-1 py-2.5 rounded-xl transition-all ${
            selectedPlan === 'lifetime'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Lifetime (₹{pricing.lifetimePrice})
        </button>
      </div>

      {/* Gateway Status / Alert Notice */}
      {gatewayNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs font-semibold leading-relaxed relative flex items-start gap-3 shadow-lg"
        >
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
            <Zap className="w-4 h-4" />
          </div>
          <div className="flex-1 pr-6">
            <span className="font-bold text-amber-300 block mb-0.5">Payment Gateway Notice</span>
            {gatewayNotice}
          </div>
          <button
            onClick={() => setGatewayNotice(null)}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Main Payment & Admin Approval Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Official PRO Plan Subscription */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border-2 border-amber-500/50 relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-amber-950/20">
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 uppercase tracking-widest">
            {selectedPlan === 'annual' ? 'BEST VALUE' : selectedPlan === 'lifetime' ? 'UNLIMITED PASS' : 'MOST POPULAR'}
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> AspirantX PRO {selectedPlan.toUpperCase()} Pass
            </span>
            <div className="text-3xl font-black text-white mt-2">
              ₹{getActiveAmount()}{' '}
              <span className="text-xs font-normal text-slate-400">
                / {selectedPlan === 'monthly' ? 'month' : selectedPlan === 'annual' ? 'year' : 'lifetime'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">All-inclusive power suite for serious aspirants.</p>

            <ul className="mt-6 space-y-3 text-xs text-slate-200">
              {planFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            id="upgrade-pro-btn"
            onClick={handleInitiateRazorpayCheckout}
            disabled={upgraded || isOpeningGateway}
            className={`w-full mt-8 py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-60 ${
              upgraded
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 hover:brightness-110 shadow-amber-500/20'
            }`}
          >
            {upgraded ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> PRO Membership Active
              </>
            ) : isOpeningGateway ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                Connecting to Razorpay...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-slate-950" /> Pay ₹{getActiveAmount()} & Activate PRO
              </>
            )}
          </button>

        </div>

        {/* Card 2: Manual UTR Verification & Admin Approval Request */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 relative overflow-hidden flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" /> Manual Payment / Admin Approval
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                VERIFIED
              </span>
            </div>

            <h3 className="text-lg font-black text-white mt-1">Paid via Direct UPI / QR Code?</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              If you transferred payment directly or need Admin approval, submit your 12-digit UTR / Reference ID below. Admin will verify and activate your PRO Pass.
            </p>

            {utrSuccessMsg && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
                {utrSuccessMsg}
              </div>
            )}

            {utrErrorMsg && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {utrErrorMsg}
              </div>
            )}

            <form onSubmit={handleSubmitUtrVerification} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  12-Digit Transaction UTR / Ref Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 423198004521"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingUtr}
                className="w-full py-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-all flex items-center justify-center gap-2"
              >
                {isSubmittingUtr ? (
                  <span className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" /> Submit UTR for Admin Approval
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <span className="font-bold text-white block">Direct Admin Contact:</span>
              <p>Email: <code className="text-amber-300 font-mono">ambujyadav0010@gmail.com</code></p>
              <p>Admin can instantly unlock PRO Pass for any user in Admin Panel.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
