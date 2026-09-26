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
  ChevronDown,
  ChevronUp,
  User,
  Globe,
  Info,
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
import { SinahardLogo } from './SinahardLogo';
import { AppCoin } from './AppCoin';
import { getUserCoins, addCoinsToUser } from '../services/coinService';

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
    ETHIOPIAN_SUBSCRIPTION_PLANS[1] || ETHIOPIAN_SUBSCRIPTION_PLANS[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('telebirr');
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
  const [showComparison, setShowComparison] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      checkTelebirrConfigStatus().then(setTelebirrStatus);
      // Ensure scrolling starts at the very upmost top position
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      });
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
        await addCoinsToUser(user || effectiveUser, selectedPlan.coins);
        setSuccessNotice(
          `Thank you! Your ${paymentMethod.toUpperCase()} transaction #${transactionRef.trim()} was recorded. +${selectedPlan.coins} Coins credited to your account!`
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
    <div
      ref={scrollContainerRef}
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-5 pt-3 sm:pt-6 pb-20 bg-black/60 backdrop-blur-md overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]"
    >
      <div
        ref={modalContentRef}
        className="relative w-full max-w-2xl my-2 sm:my-4 rounded-[32px] bg-white/95 dark:bg-[000000]/95 border border-white/80 dark:border-white/10 shadow-2xl overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Subtle Atmospheric Ambient Glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-zinc-500/5 dark:bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-zinc-600/5 dark:bg-white/[0.01] rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header - Sticky so it is always accessible at the upmost position */}
        <div className="sticky top-0 z-30 px-6 pt-5 pb-4 bg-white/95 dark:bg-[000000]/95 border-b border-zinc-200/80 dark:border-white/10 flex items-start justify-between backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <SinahardLogo size="lg" idSuffix="sub-modal" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                  Sinahard Premium
                </h2>
                <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  Ethiopian Birr (ETB)
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Unlock full exam downloads, LaTeX math step-by-step solutions, and grade categories
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="payment-cancel-btn-top"
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-98"
              title="Cancel payment"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        {/* Current Coin Balance & Status Card */}
        <div className="mx-6 mt-4 p-4 rounded-[22px] bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-emerald-500/10 dark:from-amber-500/15 dark:via-sky-500/15 dark:to-emerald-500/15 border border-amber-500/30 dark:border-amber-500/20 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AppCoin size="lg" animate={true} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  Your Balance:
                </span>
                <span className="font-mono text-sm font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  {getUserCoins(user, activeSubscription)} Coins
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                  {!user || user.uid === 'guest' || user.isAnonymous ? 'Guest Tier' : isActive ? 'Pro Tier' : 'Free Tier'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                {!user || user.uid === 'guest' || user.isAnonymous
                  ? 'Guests have 0 coins. Register with Google to get 1 Free Coin or top up.'
                  : '1 Coin unlocks 1 full practice exam or comprehensive solution pass.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/25 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>100% Offline Verified</span>
          </div>
        </div>

        {/* Current Active Status Alert */}
        {isActive && activeSubscription && (
          <div className="mx-6 mt-3 p-3.5 rounded-[22px] bg-white dark:bg-[000000] border border-white/80 dark:border-white/10 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-zinc-950 dark:text-white shrink-0" />
              <div>
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  Active Premium Subscription
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Plan: {activeSubscription.planDuration} • Valid until:{' '}
                  {activeSubscription.expiresAt
                    ? new Date(activeSubscription.expiresAt).toLocaleDateString()
                    : 'Active'}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs">
              Verified
            </span>
          </div>
        )}

        <div className="relative p-6 space-y-5">
          {/* Plan Duration Selector */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                1. Choose Payment Plan
              </label>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                Offline Capable • No Expiry on Coins
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ETHIOPIAN_SUBSCRIPTION_PLANS.map((plan) => {
                const isSelected = selectedPlan.id === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => handleSelectPlan(plan)}
                    className={`relative p-3.5 rounded-[22px] text-left border transition cursor-pointer flex flex-col justify-between shadow-xs active:scale-98 ${
                      isSelected
                        ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-transparent ring-2 ring-amber-400/50'
                        : 'bg-white dark:bg-[000000] border-white/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {plan.badge && (
                      <span className={`absolute -top-2.5 right-2 text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-xs ${
                        isSelected
                          ? 'bg-amber-400 text-zinc-950'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                      }`}>
                        {plan.badge}
                      </span>
                    )}
                    <div>
                      <span className={`text-xs font-bold block ${isSelected ? 'text-white dark:text-zinc-950' : 'text-zinc-900 dark:text-white'}`}>
                        {plan.name}
                      </span>
                      <span className={`text-[11px] block mt-0.5 ${isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500'}`}>
                        {plan.durationLabel}
                      </span>
                      <div className="flex items-center gap-1.5 mt-2 py-1 px-2 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 w-fit">
                        <AppCoin size="xs" />
                        <span className={`text-xs font-extrabold font-mono ${isSelected ? 'text-amber-300 dark:text-amber-800' : 'text-amber-600 dark:text-amber-400'}`}>
                          {plan.coins} Coins
                        </span>
                      </div>
                    </div>
                    <div className={`mt-3 pt-2 border-t ${isSelected ? 'border-white/20 dark:border-zinc-300' : 'border-zinc-100 dark:border-zinc-800/60'}`}>
                      <span className={`text-base font-extrabold font-['Outfit',sans-serif] ${isSelected ? 'text-white dark:text-zinc-950' : 'text-zinc-900 dark:text-white'}`}>
                        {plan.priceETB} <span className={`text-[11px] font-semibold ${isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500'}`}>ETB</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-2.5">
              2. Choose Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'telebirr', name: 'Telebirr', icon: Smartphone, desc: 'Mobile Transfer / *127#' },
                { id: 'chapa', name: 'Chapa', icon: Zap, desc: 'Coming Soon', isComingSoon: true },
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
                    className={`p-3 rounded-[22px] text-left border transition cursor-pointer flex items-center gap-2.5 shadow-xs active:scale-98 relative overflow-hidden ${
                      isSelected
                        ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-transparent'
                        : 'bg-white dark:bg-[000000] border-white/80 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/20 dark:bg-zinc-900/20 text-white dark:text-zinc-950 font-bold'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold block truncate ${isSelected ? 'text-white dark:text-zinc-950' : 'text-zinc-900 dark:text-white'}`}>{m.name}</span>
                        {m.isComingSoon && (
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md shrink-0 leading-none ${
                            isSelected
                              ? 'bg-amber-400 text-zinc-950'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}>
                            Soon
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] block truncate ${isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500'}`}>{m.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Account Details Box - Porcelain Container */}
          <div className="p-4 rounded-[24px] bg-white dark:bg-[000000] border border-white/80 dark:border-white/10 shadow-xs space-y-3">
            {paymentMethod === 'telebirr' && (
              <div className="space-y-3">
                {/* Telebirr Mode Switcher with Coming Soon for API */}
                <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-full border border-white/60 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setTelebirrMode('manual');
                      setCheckoutUrl(null);
                      setActiveTxRef(null);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      telebirrMode === 'manual'
                        ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
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
                    className={`flex-1 py-1.5 px-3 rounded-full text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      telebirrMode === 'gateway'
                        ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Telebirr Direct API</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 ml-0.5">
                      Pending
                    </span>
                  </button>
                </div>

                {telebirrMode === 'gateway' ? (
                  <div className="space-y-3 p-3.5 rounded-[20px] bg-white/70 dark:bg-zinc-900/50 border border-white/60 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">
                          Telebirr Direct API Gateway — Pending Activation
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        Pending TIN Approval
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Direct automated Telebirr checkout integration is currently waiting for merchant Tax Identification Number (TIN) &amp; Ethio Telecom enterprise verification.
                    </p>

                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
                      <div className="text-[11px] font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                        <span>Recommended Instant Alternative:</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                        • Switch to <strong>Direct Telebirr (*127#)</strong> above to transfer manually and enter your SMS reference, or<br/>
                        • Choose <strong>Chapa (API)</strong> to pay instantly using your <strong>Telebirr wallet</strong> via automated checkout!
                      </p>
                    </div>

                    {/* Developer Preview & Test Portal */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowTelebirrConfig(!showTelebirrConfig)}
                        className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>
                          {showTelebirrConfig ? 'Hide Developer Test Controls' : 'Developer Sandbox Test Controls'}
                        </span>
                      </button>

                      {showTelebirrConfig && (
                        <div className="mt-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 space-y-2 text-xs">
                          <p className="text-[10px] text-zinc-500">
                            You can test the Telebirr payment simulation flow before your official TIN is activated:
                          </p>
                          <div>
                            <span className="text-[10px] text-zinc-500 block mb-0.5">Test Customer Phone:</span>
                            <input
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="0918049806"
                              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-[11px]"
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
                                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-[11px]"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-zinc-500 block mb-0.5">Short Code (Till):</span>
                              <input
                                type="text"
                                value={telebirrShortCode}
                                onChange={(e) => setTelebirrShortCode(e.target.value)}
                                placeholder="100234"
                                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 font-mono text-[11px]"
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
                          0918-04-98-06
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy('0918049806', 'telebirr')}
                          className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedAccount === 'telebirr' ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1.5">
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
                    <span className="font-mono font-bold text-zinc-900 dark:text-white tracking-wide">
                      1000442803769
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy('1000442803769', 'cbe')}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedAccount === 'cbe' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Pay <strong>{selectedPlan.priceETB} ETB</strong> to Commercial Bank of Ethiopia (CBE Birr or Mobile Banking).
                </p>
              </div>
            )}

            {paymentMethod === 'chapa' && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Chapa Automated Gateway
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed font-normal">
                  Chapa online payment integration is currently coming soon. Please use <strong>Telebirr</strong>, <strong>CBE Birr</strong>, or <strong>Bank of Abyssinia</strong> below for immediate membership activation.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('telebirr')}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90 transition cursor-pointer shadow-2xs"
                  >
                    Pay with Telebirr (*127#)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cbe')}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer border border-zinc-200 dark:border-zinc-700"
                  >
                    Pay with CBE Birr
                  </button>
                </div>
              </div>
            )}

            {paymentMethod === 'abyssinia' && (
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">Bank of Abyssinia Account:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-900 dark:text-white tracking-wide">
                      244028993
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy('244028993', 'boa')}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedAccount === 'boa' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Transfer <strong>{selectedPlan.priceETB} ETB</strong> via BoA mobile banking or branch.
                </p>
              </div>
            )}
          </div>

          {/* Reference input for manual methods */}
          {paymentMethod !== 'chapa' && !(paymentMethod === 'telebirr' && telebirrMode === 'gateway') && (
            <div>
              <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                3. Transaction Confirmation Code / Reference
              </label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. FT260915... or Telebirr SMS code"
                className="w-full px-4 py-2.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-white/10 shadow-2xs"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Enter the receipt number from your mobile banking notification to verify your access.
              </p>
            </div>
          )}

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-[20px] bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 rounded-[20px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-zinc-950 dark:text-white" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Guest account notice */}
          {(!user || user.uid === 'guest') && (
            <div className="p-3.5 rounded-[22px] bg-white dark:bg-[000000] border border-white/80 dark:border-white/10 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="text-xs text-zinc-600 dark:text-zinc-300">
                  You are in guest mode. Sign in to link this subscription with your Google account.
                </span>
              </div>
              {handleTriggerSignIn && (
                <button
                  type="button"
                  onClick={handleTriggerSignIn}
                  className="px-4 py-1.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs shrink-0 cursor-pointer transition shadow-xs active:scale-98"
                >
                  Sign In
                </button>
              )}
            </div>
          )}

          {/* Active Checkout Portal Card (for both Telebirr and Chapa) */}
          {checkoutUrl && (
            <div className="p-4 rounded-[24px] bg-white dark:bg-[000000] border border-white/80 dark:border-white/10 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 dark:bg-white animate-ping" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                    {paymentMethod === 'telebirr' ? 'Telebirr Payment Ready' : 'Chapa Payment Ready'}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  Ref: {activeTxRef}
                </span>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                {paymentMethod === 'telebirr'
                  ? 'Your Telebirr checkout session has been created. Click below to complete authorization and activate your subscription:'
                  : 'Your checkout session has been created. Click below to pay with Telebirr, CBE Birr, or debit card, then verify your payment:'}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Direct Open in New Tab */}
                <button
                  type="button"
                  onClick={() => handleOpenCheckoutInNewTab(checkoutUrl)}
                  className="px-4 py-2 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-98"
                >
                  <span>{paymentMethod === 'telebirr' ? 'Open Telebirr Portal' : 'Open Chapa Portal'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                {/* Direct Redirect in Same Tab */}
                <button
                  type="button"
                  onClick={() => { window.location.href = checkoutUrl; }}
                  className="px-3.5 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                  title="Directly redirect in this tab"
                >
                  <span>Open in this Tab</span>
                </button>

                {/* Copy Link */}
                <button
                  type="button"
                  onClick={handleCopyCheckoutLink}
                  className="px-3 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Copy payment link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-zinc-950 dark:text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                </button>

                {/* Verify Status */}
                <button
                  type="button"
                  disabled={isVerifying}
                  onClick={handleVerifyStatus}
                  className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
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
                  className="px-3 py-2 rounded-full text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  title="Generate a brand new checkout session"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>New Session</span>
                </button>
              </div>

              {/* Direct clickable URL fallback */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center justify-between gap-2">
                <span className="shrink-0 text-zinc-500">Direct URL:</span>
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-zinc-700 dark:text-zinc-300 hover:underline font-mono text-[10px]"
                >
                  {checkoutUrl}
                </a>
              </div>
            </div>
          )}

          {/* Collapsible Tier Comparison: Guest vs Logged-in vs Premium */}
          <div className="rounded-[24px] border border-white/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] backdrop-blur-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowComparison(!showComparison)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/40 dark:hover:bg-white/[0.05] transition cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4 text-zinc-700 dark:text-zinc-300 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                    Compare Plans: Guest vs. Logged In vs. Premium
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {showComparison ? 'Click to collapse comparison' : 'Click to expand details of what each tier gets'}
                  </span>
                </div>
              </div>
              <div className="p-1 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {showComparison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showComparison && (
              <div className="p-4 pt-1 border-t border-white/60 dark:border-white/10 space-y-3 text-xs animate-in fade-in duration-200">
                {/* Guest Mode */}
                <div className="p-3.5 rounded-[20px] bg-white dark:bg-[000000] border border-white/80 dark:border-white/10 shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      Guest Mode (No Account / Local Storage)
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                      Free / Instant
                    </span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-400 list-disc list-inside">
                    <li>Create or practice exams with up to <strong>20 questions</strong> per exam.</li>
                    <li>Countdown timer, question flagging, scratchpad &amp; scientific calculator included.</li>
                    <li>Instant grading, percentage score, and KaTeX math formulas.</li>
                    <li>Saved in current browser (no cloud sync across phones or laptops).</li>
                  </ul>
                </div>

                {/* Logged-In User */}
                <div className="p-3.5 rounded-[20px] bg-white dark:bg-[000000] border border-white/80 dark:border-white/10 shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-zinc-500" />
                      Logged-In (Free Google Account)
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                      🎁 3-Day Trial Included
                    </span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-400 list-disc list-inside">
                    <li><strong>🎁 First 3 Days:</strong> Welcome Trial unlocked with up to <strong>50 questions per exam</strong> &amp; bulk import.</li>
                    <li><strong>Permanent Cloud Sync:</strong> All exams, test history &amp; scores automatically backed up in Firestore across all devices.</li>
                    <li>Persistent study reminders, push alert preferences &amp; custom profile.</li>
                    <li>Standard 20 questions/exam available permanently after trial period ends.</li>
                  </ul>
                </div>

                {/* Premium Scholar */}
                <div className="p-3.5 rounded-[20px] bg-white dark:bg-[000000] border border-white/80 dark:border-white/10 shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
                      Premium Scholar (ETB Subscription)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950">
                      From 19.9 ETB
                    </span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-zinc-600 dark:text-zinc-400 list-disc list-inside">
                    <li><strong>Unlimited Questions:</strong> Build, practice, and test with 100, 200, or 500+ questions without any cap.</li>
                    <li><strong>Unlimited Bulk Imports:</strong> Import full curriculum units, past national exam sheets &amp; lecture notes directly.</li>
                    <li><strong>Full Worked Solutions:</strong> Complete step-by-step LaTeX formulas, worked math steps, and memory aid tricks.</li>
                    <li><strong>Priority Payments:</strong> Instant automated Telebirr activation, or CBE / BoA manual verification (Chapa automated gateway coming soon).</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Action Button Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-zinc-200/80 dark:border-white/10">
            <div>
              <span className="text-xs text-zinc-500 block">Total Due:</span>
              <span className="text-lg font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                {selectedPlan.priceETB} ETB
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Scroll to Upmost Button */}
              <button
                type="button"
                onClick={() => {
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="p-2.5 rounded-full text-zinc-500 hover:text-zinc-950 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer border border-zinc-200 dark:border-zinc-700 shadow-2xs active:scale-98"
                title="Scroll to upmost top"
              >
                <ChevronUp className="w-4 h-4" />
              </button>

              {/* Bottom Cancel Button */}
              <button
                id="payment-cancel-btn-bottom"
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-2xs active:scale-98 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                title="Cancel and close payment dialog"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>

              {/* Submit Payment Button */}
              <button
                id="payment-submit-btn-bottom"
                type="button"
                disabled={isSubmitting || paymentMethod === 'chapa'}
                onClick={() => {
                  if (paymentMethod === 'chapa') {
                    return;
                  }
                  if (
                    paymentMethod === 'telebirr' &&
                    telebirrMode === 'gateway' &&
                    checkoutUrl
                  ) {
                    handleOpenCheckoutInNewTab(checkoutUrl);
                  } else {
                    handleSubmitPayment();
                  }
                }}
                className={`flex-1 sm:flex-initial px-6 py-2.5 rounded-full font-semibold text-xs flex items-center justify-center gap-2 transition shadow-xs active:scale-98 disabled:opacity-50 ${
                  paymentMethod === 'chapa'
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 cursor-not-allowed'
                    : 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 cursor-pointer'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {paymentMethod === 'chapa'
                    ? 'Chapa Payment (Coming Soon)'
                    : paymentMethod === 'telebirr' && telebirrMode === 'gateway'
                    ? checkoutUrl
                      ? 'Open Telebirr Checkout ↗'
                      : 'Proceed to Telebirr Checkout'
                    : 'Submit & Verify Payment'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
