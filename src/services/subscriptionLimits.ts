import { AppUser, UserSubscription } from '../types';
import { isUserSubscriptionActive } from './db';

const FIRST_VISIT_STORAGE_KEY = 'exam_master_first_seen_timestamp';
export const TRIAL_DURATION_DAYS = 3;

export const PLAN_LIMITS = {
  guest: {
    maxQuestionsPerExam: 20,
    maxImportQuestions: 20,
    label: 'Guest Mode',
    description: 'Instant local practice: up to 20 questions per exam without an account.',
  },
  free: {
    maxQuestionsPerExam: 20,
    maxImportQuestions: 20,
    label: 'Free Student',
    description: 'Up to 20 questions per exam with permanent cloud backup across all devices.',
  },
  trial: {
    maxQuestionsPerExam: 50,
    maxImportQuestions: 50,
    label: '3-Day Welcome Trial',
    description: 'Special 3-day welcome trial for signed-in students: up to 50 questions per exam & full import access.',
  },
  premium: {
    maxQuestionsPerExam: Infinity,
    maxImportQuestions: Infinity,
    label: 'Premium Scholar',
    description: 'Unlimited questions, bulk .txt imports, full solutions, and priority support.',
  },
};

export interface UserTierStatus {
  tier: 'premium' | 'trial' | 'free' | 'guest';
  isPremium: boolean;
  isTrial: boolean;
  isFree: boolean;
  isGuest: boolean;
  trialDaysRemaining: number;
  maxQuestionsPerExam: number;
  maxImportQuestions: number;
  tierBadge: string;
  tierDescription: string;
  accountAgeDays: number;
}

/**
 * Determines or retrieves the initial timestamp when the user first joined or used the app.
 */
export function getAccountFirstSeenTimestamp(
  user: AppUser | null,
  creationTimeStr?: string | null
): number {
  if (creationTimeStr) {
    const parsed = new Date(creationTimeStr).getTime();
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  try {
    let stored = localStorage.getItem(FIRST_VISIT_STORAGE_KEY);
    if (!stored) {
      stored = String(Date.now());
      localStorage.setItem(FIRST_VISIT_STORAGE_KEY, stored);
    }
    const parsed = parseInt(stored, 10);
    return isNaN(parsed) ? Date.now() : parsed;
  } catch {
    return Date.now();
  }
}

/**
 * Calculates current tier status:
 * 1. Premium if active verified subscription exists
 * 2. If user is guest (not logged in / local storage), tier is 'guest' (20 questions, prompted to sign in for 3-day trial)
 * 3. If user is logged in with Google account:
 *    - 3-Day Welcome Trial if account is <= 3 days old (up to 50 questions & full import)
 *    - Free tier permanently afterwards (20 questions cap, cloud synced)
 */
export function getUserTierStatus(
  user: AppUser | null,
  activeSubscription: UserSubscription | null,
  accountCreationTime?: string | null
): UserTierStatus {
  // 1. Check verified active premium
  const isPremium = isUserSubscriptionActive(activeSubscription);
  if (isPremium) {
    return {
      tier: 'premium',
      isPremium: true,
      isTrial: false,
      isFree: false,
      isGuest: false,
      trialDaysRemaining: 0,
      maxQuestionsPerExam: PLAN_LIMITS.premium.maxQuestionsPerExam,
      maxImportQuestions: PLAN_LIMITS.premium.maxImportQuestions,
      tierBadge: 'Premium Active',
      tierDescription: PLAN_LIMITS.premium.description,
      accountAgeDays: 0,
    };
  }

  // 2. Guest Mode: Not signed in or guest UID
  const isGuestUser = !user || user.uid === 'guest' || user.isAnonymous;
  if (isGuestUser) {
    return {
      tier: 'guest',
      isPremium: false,
      isTrial: false,
      isFree: false,
      isGuest: true,
      trialDaysRemaining: 0,
      maxQuestionsPerExam: PLAN_LIMITS.guest.maxQuestionsPerExam,
      maxImportQuestions: PLAN_LIMITS.guest.maxImportQuestions,
      tierBadge: 'Guest Mode (20 Qs)',
      tierDescription: PLAN_LIMITS.guest.description,
      accountAgeDays: 0,
    };
  }

  // 3. Logged-in User: Check 3-day trial period from Google account creation
  const firstSeen = getAccountFirstSeenTimestamp(user, accountCreationTime || user.metadata?.creationTime);
  const now = Date.now();
  const diffMs = Math.max(0, now - firstSeen);
  const accountAgeDays = diffMs / (1000 * 60 * 60 * 24);

  if (accountAgeDays <= TRIAL_DURATION_DAYS) {
    const daysRemaining = Math.max(1, Math.ceil(TRIAL_DURATION_DAYS - accountAgeDays));
    return {
      tier: 'trial',
      isPremium: false,
      isTrial: true,
      isFree: false,
      isGuest: false,
      trialDaysRemaining: daysRemaining,
      maxQuestionsPerExam: PLAN_LIMITS.trial.maxQuestionsPerExam,
      maxImportQuestions: PLAN_LIMITS.trial.maxImportQuestions,
      tierBadge: `3-Day Trial: ${daysRemaining}d left`,
      tierDescription: PLAN_LIMITS.trial.description,
      accountAgeDays: Math.floor(accountAgeDays),
    };
  }

  // 4. Standard Free Tier (after 3 days of account age)
  return {
    tier: 'free',
    isPremium: false,
    isTrial: false,
    isFree: true,
    isGuest: false,
    trialDaysRemaining: 0,
    maxQuestionsPerExam: PLAN_LIMITS.free.maxQuestionsPerExam,
    maxImportQuestions: PLAN_LIMITS.free.maxImportQuestions,
    tierBadge: 'Free Tier (Synced)',
    tierDescription: PLAN_LIMITS.free.description,
    accountAgeDays: Math.floor(accountAgeDays),
  };
}
