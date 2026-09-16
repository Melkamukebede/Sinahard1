import React, { useState, useRef } from 'react';
import {
  Crown,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  X,
  CreditCard,
  Building,
  Smartphone,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Sliders,
  Clock,
} from 'lucide-react';
import {
  SubscriptionPlan,
  UserSubscription,
  PaymentMethod,
  AppUser,
} from '../types';
import {
  ETHIOPIAN_SUBSCRIPTION_PLANS,
  calculateSubscriptionExpiry,
  createSubscriptionRecord,
  isUserSubscriptionActive,
  verifySubscriptionByTxRef,
} from '../services/db';
import { initializeChapaPayment, verifyChapaTransaction } from '../services/chapa';
import {
  initializeTelebirrPayment,
  verifyTelebirrPayment,
  checkTelebirrConfigStatus,
  TelebirrConfigStatus,
} from '../services/telebirr';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: AppUser | null;
  activeSubscription: UserSubscription | null;
  onSubscriptionCreated?: (sub: UserSubscription) => void;
  onSignInRequired?: () => void;
  onOpenSignIn?: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  user,
  activeSubscription,
  onSubscriptionCreated,
  onSignInRequired,
  onOpenSignIn,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    ETHIOPIAN_SUBSCRIPTION_PLANS[2] // 1 month selected by default
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('chapa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [chapaApiKey, setChapaApiKey] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [activeTxRef, setActiveTxRef] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Telebirr Developer API State (set to manual as default while waiting for TIN/Ethio Telecom approval)
  const [telebirrMode, setTelebirrMode] = useState<'gateway' | 'manual'>('manual');
  const [showTelebirrConfig, setShowTelebirrConfig] = useState(false);
  const [telebirrAppId, setTelebirrAppId] = useState('');
  const [telebirrShortCode, setTelebirrShortCode] = useState('');
  const [telebirrAppKey, setTelebirrAppKey] = useState('');
  const [telebirrStatus, setTelebirrStatus] = useState<TelebirrConfigStatus | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      checkTelebirrConfigStatus().then(setTelebirrStatus);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isActive = isUserSubscriptionActive(activeSubscription);
  const handleTriggerSignIn = onSignInRequired || onOpenSignIn;

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setCheckoutUrl(null);
    setActiveTxRef(null);
    setErrorMsg(null);
    setSuccessNotice(null);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(label);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleCopyCheckoutLink = () => {
    if (!checkoutUrl) return;
    navigator.clipboard.writeText(checkoutUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenCheckoutInNewTab = (urlToOpen: string) => {
    try {
      const opened = window.open(urlToOpen, '_blank', 'noopener,noreferrer');
      if (!opened || opened.closed || typeof opened.closed === 'undefined') {
        // Fallback to top window or location if popups strictly blocked
        window.location.href = urlToOpen;
      }
    } catch (_err) {
      window.location.href = urlToOpen;
    }
  };

  const handleVerifyStatus = async () => {
    if (!activeTxRef || isVerifying) return;
    setIsVerifying(true);
    setErrorMsg(null);
    try {
      if (paymentMethod === 'telebirr') {
        const res = await verifyTelebirrPayment(activeTxRef);
        if (res.verified) {
          const verified = await verifySubscriptionByTxRef(activeTxRef, user || null);
          if (verified && onSubscriptionCreated) {
            onSubscriptionCreated(verified);
          }
          setSuccessNotice('🎉 Telebirr payment verified! Your Premium membership is now active.');
          setCheckoutUrl(null);
          setActiveTxRef(null);
        } else {
          setErrorMsg(
            res.message ||
              'Telebirr payment has not been completed yet. Please authorize it in the checkout portal and try again.'
          );
        }
      } else {
        const res = await verifyChapaTransaction(activeTxRef);
        if (res.verified) {
          const verified = await verifySubscriptionByTxRef(activeTxRef, user || null);
          if (verified && onSubscriptionCreated) {
            onSubscriptionCreated(verified);
          }
          setSuccessNotice('Payment verified! Your Premium membership is now active.');
          setCheckoutUrl(null);
          setActiveTxRef(null);
        } else {
          setErrorMsg(
            res.message ||
              'Payment has not been completed yet on Chapa. Please complete it on the payment page and try again.'
          );
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error checking payment status';
      setErrorMsg(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (isSubmittingRef.current || isSubmitting) return;
    isSubmittingRef.current = true;

    const effectiveUser: AppUser =
      user && user.uid !== 'guest'
        ? user
        : {
            uid:
              user?.uid === 'guest' && user?.displayName
                ? `guest-${user.displayName.toLowerCase().replace(/\s+/g, '-')}`
                : `guest-${Date.now().toString(36)}`,
            displayName: user?.displayName || 'Guest Student',
            email: user?.email || '',
            isAnonymous: true,
          };

    setErrorMsg(null);
    setIsSubmitting(true);

    // Pre-open window synchronously during user click to bypass browser popup blockers
    let paymentWindow: Window | null = null;
    const isAutomatedGateway =
      paymentMethod === 'chapa' || (paymentMethod === 'telebirr' && telebirrMode === 'gateway');

    if (isAutomatedGateway) {
      try {
        paymentWindow = window.open('about:blank', '_blank');
        if (paymentWindow) {
          const isTb = paymentMethod === 'telebirr';
          const title = isTb ? 'Connecting to telebirr...' : 'Connecting to Chapa...';
          const heading = isTb ? 'Connecting to telebirr Gateway...' : 'Connecting to Chapa Checkout...';
          const desc = isTb
            ? 'Preparing your official Telebirr payment session. Please do not close this window.'
            : 'Preparing your secure payment session for Telebirr, CBE Birr, and cards. Please do not close this window.';
          const accent = isTb ? '#008b47' : '#10b981';

          paymentWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>${title}</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #09090b;
                    color: #ffffff;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    text-align: center;
                    padding: 24px;
                    box-sizing: border-box;
                  }
                  .spinner {
                    width: 44px;
                    height: 44px;
                    border: 3px solid rgba(255, 255, 255, 0.15);
                    border-top-color: ${accent};
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-bottom: 20px;
                  }
                  @keyframes spin { to { transform: rotate(360deg); } }
                  h2 { font-size: 20px; font-weight: 700; margin: 0 0 8px 0; }
                  p { font-size: 14px; color: #a1a1aa; margin: 0; max-width: 380px; line-height: 1.5; }
                </style>
              </head>
              <body>
                <div class="spinner"></div>
                <h2>${heading}</h2>
                <p>${desc}</p>
              </body>
            </html>
          `);
        }
      } catch (_e) {
        // Fallback handled via UI buttons if popup blocked
      }
    }

    try {
      if (paymentMethod === 'telebirr' && telebirrMode === 'gateway') {
        // Telebirr Developer API Automated Gateway
        const customKeys =
          telebirrAppId.trim() && telebirrShortCode.trim()
            ? {
                appId: telebirrAppId.trim(),
                shortCode: telebirrShortCode.trim(),
                appKey: telebirrAppKey.trim() || undefined,
              }
            : undefined;

        const tbRes = await initializeTelebirrPayment(
          selectedPlan,
          effectiveUser,
          phoneNumber,
          customKeys
        );

        if (tbRes.toPayUrl) {
          setCheckoutUrl(tbRes.toPayUrl);
          setActiveTxRef(tbRes.outTradeNo);

          if (paymentWindow && !paymentWindow.closed) {
            paymentWindow.location.href = tbRes.toPayUrl;
          }

          await createSubscriptionRecord(
            {
              userId: effectiveUser.uid,
              userEmail: effectiveUser.email || '',
              userName: effectiveUser.displayName || 'Student',
              planDuration: selectedPlan.id,
              amountETB: selectedPlan.priceETB,
              paymentMethod: 'telebirr',
              transactionReference: tbRes.outTradeNo,
              paymentStatus: 'pending',
              createdAt: new Date().toISOString(),
            },
            effectiveUser
          );

          setSuccessNotice(
            `Telebirr checkout session initialized! (Trade No: ${tbRes.outTradeNo})`
          );
          setIsSubmitting(false);
          return;
        } else {
          if (paymentWindow && !paymentWindow.closed) {
            paymentWindow.close();
          }
          setErrorMsg(tbRes.error || 'Failed to initialize Telebirr gateway session');
          setIsSubmitting(false);
          return;
        }
      } else if (paymentMethod === 'chapa') {
        // Attempt Chapa automated gateway
        const chapaRes = await initializeChapaPayment(
          selectedPlan,
          effectiveUser,
          phoneNumber,
          chapaApiKey
        );

        if (chapaRes.checkoutUrl) {
          setCheckoutUrl(chapaRes.checkoutUrl);
          setActiveTxRef(chapaRes.txRef);

          // Redirect the opened window to the actual Chapa checkout
          if (paymentWindow && !paymentWindow.closed) {
            paymentWindow.location.href = chapaRes.checkoutUrl;
          }

          // Record pending transaction in Firestore
          await createSubscriptionRecord(
            {
              userId: effectiveUser.uid,
              userEmail: effectiveUser.email || '',
              userName: effectiveUser.displayName || 'Student',
              planDuration: selectedPlan.id,
              amountETB: selectedPlan.priceETB,
              paymentMethod: 'chapa',
              transactionReference: chapaRes.txRef,
              paymentStatus: 'pending',
              createdAt: new Date().toISOString(),
            },
            effectiveUser
          );

          setSuccessNotice(
            `Chapa checkout initialized! Complete your payment with Telebirr or CBE Birr. Ref: ${chapaRes.txRef}`
          );
          setIsSubmitting(false);
          return;
        } else {
          // Close blank window on error
          if (paymentWindow && !paymentWindow.closed) {
            paymentWindow.close();
          }

          if (chapaRes.error) {
            setErrorMsg(chapaRes.error);
            setIsSubmitting(false);
            return;
          }
        }

        // If direct gateway key wasn't active, fallback to transaction reference submission
        const refToUse = transactionRef.trim() || chapaRes.txRef;
        const sub = await createSubscriptionRecord(
          {
            userId: effectiveUser.uid,
            userEmail: effectiveUser.email || '',
            userName: effectiveUser.displayName || 'Student',
            planDuration: selectedPlan.id,
            amountETB: selectedPlan.priceETB,
            paymentMethod: 'chapa',
            transactionReference: refToUse,
            paymentStatus: 'pending',
            createdAt: new Date().toISOString(),
          },
          effectiveUser
        );

        if (onSubscriptionCreated) onSubscriptionCreated(sub);
        setSuccessNotice(
          `Payment request submitted! Ref: ${refToUse}. You will be verified promptly.`
        );
      } else {
        // Direct Telebirr (manual), CBE, or Abyssinia Bank transfer
        if (!transactionRef.trim()) {
          setErrorMsg('Please enter your Bank or Telebirr transaction confirmation reference.');
          setIsSubmitting(false);
          return;
        }

        const sub = await createSubscriptionRecord(
          {
            userId: user?.uid || effectiveUser.uid,
            userEmail: user?.email || effectiveUser.email || '',
            userName: user?.displayName || effectiveUser.displayName || 'Student',
            planDuration: selectedPlan.id,
            amountETB: selectedPlan.priceETB,
            paymentMethod,
            transactionReference: transactionRef.trim(),
            paymentStatus: 'pending',
            createdAt: new Date().toISOString(),
          },
          user || effectiveUser
        );

        if (onSubscriptionCreated) onSubscriptionCreated(sub);
        setSuccessNotice(
          `Thank you! Your ${paymentMethod.toUpperCase()} transaction #${transactionRef.trim()} was recorded. We are verifying it.`
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error submitting subscription');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 rounded-[28px] bg-white dark:bg-[#0c1626] border border-zinc-200/90 dark:border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent border-b border-zinc-200/80 dark:border-white/10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-zinc-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black font-['Syne',sans-serif] text-zinc-900 dark:text-white">
                  ExamMaster Premium
                </h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Ethiopian Birr (ETB)
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                Unlock full exam downloads, LaTeX math step-by-step solutions, and grade categories
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Status Alert */}
        {isActive && activeSubscription && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Active Premium Subscription
                </p>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  Plan: {activeSubscription.planDuration} • Valid until:{' '}
                  {activeSubscription.expiresAt
                    ? new Date(activeSubscription.expiresAt).toLocaleDateString()
                    : 'Active'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500 text-zinc-950">
              Verified
            </span>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Plan Duration Selector */}
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-2.5">
              1. Choose Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ETHIOPIAN_SUBSCRIPTION_PLANS.map((plan) => {
                const isSelected = selectedPlan.id === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    className={`relative p-3.5 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 dark:border-amber-400 shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 right-2 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 shadow-xs">
                        {plan.badge}
                      </span>
                    )}
                    <div>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                        {plan.durationLabel}
                      </span>
                      <span className="text-[11px] text-zinc-500">{plan.name}</span>
                    </div>
                    <div className="mt-3 pt-2 border-t border-zinc-200/50 dark:border-zinc-800/50">
                      <span className="text-base font-extrabold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
                        {plan.priceETB} <span className="text-[11px] font-semibold text-zinc-500">ETB</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-2.5">
              2. Choose Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'telebirr', name: 'Telebirr', icon: Smartphone, desc: 'Mobile Transfer / *127#' },
                { id: 'chapa', name: 'Chapa (API)', icon: Zap, desc: 'Instant Live Gateway' },
                { id: 'cbe', name: 'CBE Birr / CBE', icon: Building, desc: 'Commercial Bank' },
                { id: 'abyssinia', name: 'BoA (Abyssinia)', icon: CreditCard, desc: 'Direct Bank' },
              ].map((m) => {
                const isSelected = paymentMethod === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as PaymentMethod);
                      setCheckoutUrl(null);
                      setActiveTxRef(null);
                      setErrorMsg(null);
                    }}
                    className={`p-3 rounded-2xl text-left border transition cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 dark:border-emerald-400 text-zinc-900 dark:text-white shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-emerald-500 text-zinc-950 font-bold'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold block truncate">{m.name}</span>
                      <span className="text-[10px] text-zinc-500 block truncate">{m.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Account Details Box */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-3">
            {paymentMethod === 'telebirr' && (
              <div className="space-y-3">
                {/* Telebirr Mode Switcher with Coming Soon for API */}
                <div className="flex items-center gap-2 p-1 bg-zinc-200/70 dark:bg-zinc-800/80 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setTelebirrMode('manual');
                      setCheckoutUrl(null);
                      setActiveTxRef(null);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      telebirrMode === 'manual'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Direct Telebirr (*127# / App)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTelebirrMode('gateway');
                      setCheckoutUrl(null);
                      setActiveTxRef(null);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      telebirrMode === 'gateway'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Telebirr Direct API</span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 ml-0.5">
                      Coming Soon
                    </span>
                  </button>
                </div>

                {telebirrMode === 'gateway' ? (
                  <div className="space-y-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                          Telebirr Direct API Gateway — Coming Soon
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        Pending TIN Approval
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      Direct automated Telebirr checkout integration is currently waiting for merchant Tax Identification Number (TIN) &amp; Ethio Telecom enterprise verification.
                    </p>

                    <div className="p-2.5 rounded-lg bg-white/70 dark:bg-zinc-900/70 border border-amber-500/20 space-y-1.5">
                      <div className="text-[11px] font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Recommended Instant Alternative:</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        • Switch to <strong>Direct Telebirr (*127#)</strong> above to transfer manually and enter your SMS reference, or<br/>
                        • Choose <strong>Chapa (API)</strong> to pay instantly using your <strong>Telebirr wallet</strong> via automated checkout!
                      </p>
                    </div>

                    {/* Developer Preview & Test Portal (for testing ahead of live launch) */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowTelebirrConfig(!showTelebirrConfig)}
                        className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>
                          {showTelebirrConfig ? 'Hide Developer Test Controls' : 'Developer Sandbox Test Controls'}
                        </span>
                      </button>

                      {showTelebirrConfig && (
                        <div className="mt-2 p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                          <p className="text-[10px] text-zinc-500">
                            You can test the Telebirr payment simulation flow before your official TIN is activated:
                          </p>
                          <div>
                            <span className="text-[10px] text-zinc-500 block mb-0.5">Test Customer Phone:</span>
                            <input
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="0911000000"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-mono text-[11px]"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] text-zinc-500 block mb-0.5">App ID (Once issued):</span>
                              <input
                                type="text"
                                value={telebirrAppId}
                                onChange={(e) => setTelebirrAppId(e.target.value)}
                                placeholder="telebirr-app-id"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-mono text-[11px]"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-500 block mb-0.5">Short Code (Till):</span>
                              <input
                                type="text"
                                value={telebirrShortCode}
                                onChange={(e) => setTelebirrShortCode(e.target.value)}
                                placeholder="100234"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 font-mono text-[11px]"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400">Telebirr Merchant / Phone:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-zinc-900 dark:text-white">
                          0911-00-00-00
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy('0911000000', 'telebirr')}
                          className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedAccount === 'telebirr' ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      Send <strong>{selectedPlan.priceETB} ETB</strong> via Telebirr app or *127#, then paste the SMS transaction number below.
                    </p>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'cbe' && (
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">CBE Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">
                      1000-1234-5678-90
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy('10001234567890', 'cbe')}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedAccount === 'cbe' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Pay <strong>{selectedPlan.priceETB} ETB</strong> to Commercial Bank of Ethiopia (CBE Birr or Mobile Banking).
                </p>
              </div>
            )}

            {paymentMethod === 'chapa' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    Chapa Automated Gateway Integration
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Instant Online Checkout
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  Seamlessly connects to Chapa to process Telebirr, CBE Birr, and card payments with immediate verification.
                </p>
                <div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number (e.g. 0911234567)"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'abyssinia' && (
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">Bank of Abyssinia Account:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">
                      BOA-9876-5432-10
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy('BOA9876543210', 'boa')}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedAccount === 'boa' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Transfer <strong>{selectedPlan.priceETB} ETB</strong> via BoA mobile banking or branch.
                </p>
              </div>
            )}
          </div>

          {/* Reference input for manual methods */}
          {paymentMethod !== 'chapa' && !(paymentMethod === 'telebirr' && telebirrMode === 'gateway') && (
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                3. Transaction Confirmation Code / Reference
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. FT260915... or Telebirr SMS code"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Enter the receipt number from your mobile banking notification to verify your access.
              </p>
            </div>
          )}

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Guest account notice */}
          {(!user || user.uid === 'guest') && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs text-amber-800 dark:text-amber-200">
                  You are in guest mode. Sign in to link this subscription with your Google account.
                </span>
              </div>
              {handleTriggerSignIn && (
                <button
                  type="button"
                  onClick={handleTriggerSignIn}
                  className="px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs shrink-0 cursor-pointer transition shadow-xs"
                >
                  Sign In
                </button>
              )}
            </div>
          )}

          {/* Active Checkout Portal Card (for both Telebirr and Chapa) */}
          {checkoutUrl && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent border-2 border-emerald-500/40 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-black text-emerald-950 dark:text-emerald-100 uppercase tracking-wider">
                    {paymentMethod === 'telebirr' ? 'Telebirr Payment Ready' : 'Chapa Payment Ready'}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                  Ref: {activeTxRef}
                </span>
              </div>

              <p className="text-xs text-emerald-900 dark:text-emerald-100 leading-relaxed font-medium">
                {paymentMethod === 'telebirr'
                  ? 'Your Telebirr checkout session has been created. Click below to complete authorization and activate your subscription:'
                  : 'Your checkout session has been created. Click below to pay with Telebirr, CBE Birr, or debit card, then verify your payment:'}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Direct Open in New Tab */}
                <button
                  type="button"
                  onClick={() => handleOpenCheckoutInNewTab(checkoutUrl)}
                  className="px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <span>{paymentMethod === 'telebirr' ? 'Open Telebirr Portal' : 'Open Chapa Portal'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                {/* Direct Redirect in Same Tab (if browser strictly blocks popups) */}
                <button
                  type="button"
                  onClick={() => { window.location.href = checkoutUrl; }}
                  className="px-3.5 py-2.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-900 dark:text-emerald-200 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                  title="Directly redirect in this tab"
                >
                  <span>Open in this Tab</span>
                </button>

                {/* Copy Link */}
                <button
                  type="button"
                  onClick={handleCopyCheckoutLink}
                  className="px-3 py-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Copy payment link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                </button>

                {/* Verify Status */}
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={handleVerifyStatus}
                  className="px-4 py-2.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                  <span>{isVerifying ? 'Checking...' : 'Check Payment Status'}</span>
                </button>

                {/* Reset / Start Fresh Session */}
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutUrl(null);
                    setActiveTxRef(null);
                    setErrorMsg(null);
                    setSuccessNotice(null);
                  }}
                  className="px-3 py-2.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Generate a brand new checkout session"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Start New Session</span>
                </button>
              </div>

              {/* Direct clickable URL fallback */}
              <div className="pt-2 border-t border-emerald-500/20 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center justify-between gap-2">
                <span className="shrink-0 text-zinc-500">Direct URL:</span>
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-emerald-600 dark:text-emerald-400 hover:underline font-mono text-[10px]"
                >
                  {checkoutUrl}
                </a>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div>
              <span className="text-xs text-zinc-500 block">Total Due:</span>
              <span className="text-lg font-black font-['Syne',sans-serif] text-zinc-900 dark:text-white">
                {selectedPlan.priceETB} ETB
              </span>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (
                  (paymentMethod === 'chapa' ||
                    (paymentMethod === 'telebirr' && telebirrMode === 'gateway')) &&
                  checkoutUrl
                ) {
                  handleOpenCheckoutInNewTab(checkoutUrl);
                } else {
                  handleSubmitPayment();
                }
              }}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-zinc-950 font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {paymentMethod === 'telebirr' && telebirrMode === 'gateway'
                  ? checkoutUrl
                    ? 'Open Telebirr Checkout ↗'
                    : 'Proceed to Telebirr Checkout'
                  : paymentMethod === 'chapa'
                  ? checkoutUrl
                    ? 'Open Chapa Checkout ↗'
                    : 'Proceed to Chapa Checkout'
                  : 'Submit & Verify Payment'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
