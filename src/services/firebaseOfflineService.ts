import { AppUser, Exam, Question, UserSubscription } from '../types';
import { isUserAdmin, isUserTeacher, isUserSubscriptionActive } from './db';
import { getUserCoins } from './coinService';
import { UserTierStatus } from './subscriptionLimits';

/**
 * Standard Free/Guest limits enforced whenever the app or Firebase connection is offline.
 * Prevents excess or unauthorized usage while disconnected from backend verification.
 */
export const OFFLINE_FREE_GUEST_LIMITS = {
  maxQuestionsPerExam: 20,
  maxImportQuestions: 20,
  maxPracticeQuestions: 20,
  tierLabel: 'Free / Guest Offline Cap',
  description:
    'Network unavailable: Exam creation and practice are restricted to 20 questions to prevent unverified offline usage.',
} as const;

// Module-level connection state
let _isFirebaseReachable = true;
const _listeners = new Set<(isOffline: boolean) => void>();

/**
 * Determine if the app is currently offline (browser disconnected or Firebase unreachable).
 */
export function isAppOffline(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }
  return !_isFirebaseReachable;
}

/**
 * Manually update Firebase reachability flag (e.g., from testConnection or failed network pings).
 */
export function setFirebaseReachable(reachable: boolean): void {
  const previous = isAppOffline();
  _isFirebaseReachable = reachable;
  const current = isAppOffline();
  if (previous !== current) {
    notifyNetworkListeners(current);
  }
}

/**
 * Broadcast network state changes to all active listeners.
 */
function notifyNetworkListeners(offline: boolean) {
  _listeners.forEach((listener) => {
    try {
      listener(offline);
    } catch (err) {
      console.warn('Error in offline listener:', err);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sinahard_offline_state_changed', {
        detail: { isOffline: offline },
      })
    );
  }
}

/**
 * Subscribe to connectivity changes (both browser online/offline and Firebase connection).
 */
export function subscribeToNetworkState(listener: (isOffline: boolean) => void): () => void {
  _listeners.add(listener);

  // Initialize browser event listeners if not already bound
  if (typeof window !== 'undefined') {
    const onOnline = () => {
      _isFirebaseReachable = true;
      notifyNetworkListeners(false);
    };
    const onOffline = () => {
      notifyNetworkListeners(true);
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // Initial notification with current state
    listener(isAppOffline());

    return () => {
      _listeners.delete(listener);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }

  return () => {
    _listeners.delete(listener);
  };
}

/**
 * Result structure when validating or enforcing exam creation limits.
 */
export interface OfflineCreationValidationResult {
  allowed: boolean;
  clampedExam: Exam;
  originalCount: number;
  finalCount: number;
  wasClamped: boolean;
  isOffline: boolean;
  warning?: string;
}

/**
 * ENFORCE EXAM CREATION LIMITS:
 * When the app is offline, enforce the Free/Guest limit of 20 questions per exam.
 * Clamps excess questions to prevent unauthorized local storage exploitation while disconnected.
 */
export function enforceOfflineExamCreation(
  exam: Exam,
  user?: AppUser | null,
  userTier?: UserTierStatus | null
): OfflineCreationValidationResult {
  const offline = isAppOffline();
  const originalCount = exam.questions?.length || 0;

  // 1. If Offline: Strictly enforce the 20-question Free/Guest cap
  if (offline) {
    if (originalCount > OFFLINE_FREE_GUEST_LIMITS.maxQuestionsPerExam) {
      const clampedQuestions = (exam.questions || []).slice(
        0,
        OFFLINE_FREE_GUEST_LIMITS.maxQuestionsPerExam
      );

      const clampedExam: Exam = {
        ...exam,
        questions: clampedQuestions,
        metadata: {
          ...exam.metadata,
          offlineCapped: true,
          originalQuestionCount: originalCount,
        },
      };

      return {
        allowed: true,
        clampedExam,
        originalCount,
        finalCount: OFFLINE_FREE_GUEST_LIMITS.maxQuestionsPerExam,
        wasClamped: true,
        isOffline: true,
        warning: `App is currently offline. Enforced Free/Guest limit of ${OFFLINE_FREE_GUEST_LIMITS.maxQuestionsPerExam} questions per exam. The first 20 questions were saved.`,
      };
    }

    return {
      allowed: true,
      clampedExam: exam,
      originalCount,
      finalCount: originalCount,
      wasClamped: false,
      isOffline: true,
    };
  }

  // 2. If Online: Enforce user's normal authenticated tier allowance
  const isAdm = Boolean(user && isUserAdmin(user));
  const isTch = Boolean(user && isUserTeacher(user));
  const isPrem = Boolean(userTier?.isPremium || isAdm || isTch);
  const maxAllowed = isPrem ? 200 : (userTier?.maxQuestionsPerExam ?? 20);

  if (!isPrem && originalCount > maxAllowed) {
    const clampedQuestions = (exam.questions || []).slice(0, maxAllowed);
    return {
      allowed: true,
      clampedExam: { ...exam, questions: clampedQuestions },
      originalCount,
      finalCount: maxAllowed,
      wasClamped: true,
      isOffline: false,
      warning: `Free tier limit of ${maxAllowed} questions applied. Upgrade to Sinahard Pro for full bulk exams.`,
    };
  }

  return {
    allowed: true,
    clampedExam: exam,
    originalCount,
    finalCount: originalCount,
    wasClamped: false,
    isOffline: false,
  };
}

/**
 * Result structure when validating or enforcing practice mode limits.
 */
export interface OfflinePracticeValidationResult {
  allowed: boolean;
  practiceExam: Exam;
  originalCount: number;
  activeCount: number;
  wasCapped: boolean;
  isOffline: boolean;
  tier: 'guest' | 'free' | 'pro';
  notice?: string;
}

/**
 * ENFORCE EXAM PRACTICE LIMITS:
 * When offline, prevents unmetered practice of full 50-100 question exams unless
 * authorized. For guest and free accounts without coins, clamps practice sessions
 * to the first 20 questions.
 */
export function enforceOfflineExamPractice(
  exam: Exam,
  user?: AppUser | null,
  activeSubscription?: UserSubscription | null
): OfflinePracticeValidationResult {
  const offline = isAppOffline();
  const totalQuestions = exam.questions?.length || 0;
  const isAdm = Boolean(user && isUserAdmin(user));
  const isTch = Boolean(user && isUserTeacher(user));
  const isProActive = isUserSubscriptionActive(activeSubscription || null);
  const isGuest = !user || user.uid === 'guest' || user.isAnonymous;
  const coins = getUserCoins(user, activeSubscription);

  // If exam is within standard 20-question limit, it is always allowed for free
  if (totalQuestions <= OFFLINE_FREE_GUEST_LIMITS.maxPracticeQuestions) {
    return {
      allowed: true,
      practiceExam: exam,
      originalCount: totalQuestions,
      activeCount: totalQuestions,
      wasCapped: false,
      isOffline: offline,
      tier: isGuest ? 'guest' : isProActive || isAdm || isTch ? 'pro' : 'free',
    };
  }

  // Large exam (> 20 questions):
  // When offline: check if user has local Pro status or coins to unlock
  if (offline) {
    if (isAdm || isTch || isProActive || coins > 0) {
      // Authorized via offline Pro pass or available coins
      return {
        allowed: true,
        practiceExam: exam,
        originalCount: totalQuestions,
        activeCount: totalQuestions,
        wasCapped: false,
        isOffline: true,
        tier: 'pro',
      };
    }

    // Guest or Free user with 0 coins attempting to practice > 20 questions offline:
    // Strictly cap to Free/Guest 20 questions to prevent bypass
    const cappedQuestions = (exam.questions || []).slice(
      0,
      OFFLINE_FREE_GUEST_LIMITS.maxPracticeQuestions
    );
    const clampedExam: Exam = {
      ...exam,
      questions: cappedQuestions,
    };

    return {
      allowed: true,
      practiceExam: clampedExam,
      originalCount: totalQuestions,
      activeCount: OFFLINE_FREE_GUEST_LIMITS.maxPracticeQuestions,
      wasCapped: true,
      isOffline: true,
      tier: isGuest ? 'guest' : 'free',
      notice: `Offline Mode: Practicing first ${OFFLINE_FREE_GUEST_LIMITS.maxPracticeQuestions} questions (Free/Guest limit). Connect to network or top up coins to practice full ${totalQuestions}-question exam.`,
    };
  }

  // Online mode: Pro or within allowed limits
  return {
    allowed: true,
    practiceExam: exam,
    originalCount: totalQuestions,
    activeCount: totalQuestions,
    wasCapped: false,
    isOffline: false,
    tier: isGuest ? 'guest' : isProActive || isAdm || isTch ? 'pro' : 'free',
  };
}

/**
 * ENFORCE QUESTION IMPORT / PASTE LIMITS:
 * Ensures pasted or imported text cannot bypass the 20-question limit when offline.
 */
export function enforceOfflineQuestionImport(
  questions: Question[],
  user?: AppUser | null,
  isPremiumUser = false
): {
  allowedQuestions: Question[];
  wasCapped: boolean;
  originalCount: number;
  allowedCount: number;
  message?: string;
} {
  const offline = isAppOffline();
  const originalCount = questions.length;

  // Offline: always enforce 20 max
  if (offline) {
    if (originalCount > OFFLINE_FREE_GUEST_LIMITS.maxImportQuestions) {
      const allowedQuestions = questions.slice(0, OFFLINE_FREE_GUEST_LIMITS.maxImportQuestions);
      return {
        allowedQuestions,
        wasCapped: true,
        originalCount,
        allowedCount: OFFLINE_FREE_GUEST_LIMITS.maxImportQuestions,
        message: `Offline mode: Imported first ${OFFLINE_FREE_GUEST_LIMITS.maxImportQuestions} questions (Free/Guest offline cap). Network is required for bulk imports.`,
      };
    }

    return {
      allowedQuestions: questions,
      wasCapped: false,
      originalCount,
      allowedCount: originalCount,
    };
  }

  // Online: check premium
  const maxAllowed = isPremiumUser ? 200 : OFFLINE_FREE_GUEST_LIMITS.maxImportQuestions;
  if (!isPremiumUser && originalCount > maxAllowed) {
    return {
      allowedQuestions: questions.slice(0, maxAllowed),
      wasCapped: true,
      originalCount,
      allowedCount: maxAllowed,
      message: `Imported first ${maxAllowed} questions (Free plan cap). Upgrade to Sinahard Pro for unlimited imports.`,
    };
  }

  return {
    allowedQuestions: questions,
    wasCapped: false,
    originalCount,
    allowedCount: originalCount,
  };
}
