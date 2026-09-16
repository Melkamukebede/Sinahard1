import { AppUser, UserSubscription } from '../types';
import { isUserSubscriptionActive } from './db';

const FIRST_VISIT_STORAGE_KEY = 'exam_master_first_seen_timestamp';
export const TRIAL_DURATION_DAYS = 5;

export const PLAN_LIMITS = {
  free: {
    maxQuestionsPerExam: 20,
    maxImportQuestions: 20,
    label: 'Free Student',
    description: 'Up to 20 questions per exam and standard practice.',
  },
  trial: {
    maxQuestionsPerExam: 50,
    maxImportQuestions: 50,
    label: '5-Day Welcome Trial',
    description: 'Enhanced 5-day access: up to 50 questions per import and full subject access.',
  },
  premium: {
    maxQuestionsPerExam: Infinity,
    maxImportQuestions: Infinity,
    label: 'Premium Scholar',
    description: 'Unlimited questions, bulk .txt imports, full solutions, and priority support.',
  },
};

export interface UserTierStatus {
  tier: 'premium' | 'trial' | 'free';
  isPremium: boolean;
  isTrial: boolean;
  isFree: boolean;
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
 * 2. Trial if account is <= 5 days old
 * 3. Free tier permanently afterwards (20 questions cap)
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
      trialDaysRemaining: 0,
      maxQuestionsPerExam: PLAN_LIMITS.premium.maxQuestionsPerExam,
      maxImportQuestions: PLAN_LIMITS.premium.maxImportQuestions,
      tierBadge: 'Premium Active',
      tierDescription: PLAN_LIMITS.premium.description,
      accountAgeDays: 0,
    };
  }

  // 2. Check 5-day trial period
  const firstSeen = getAccountFirstSeenTimestamp(user, accountCreationTime);
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
      trialDaysRemaining: daysRemaining,
      maxQuestionsPerExam: PLAN_LIMITS.trial.maxQuestionsPerExam,
      maxImportQuestions: PLAN_LIMITS.trial.maxImportQuestions,
      tierBadge: `Trial: ${daysRemaining}d left`,
      tierDescription: PLAN_LIMITS.trial.description,
      accountAgeDays: Math.floor(accountAgeDays),
    };
  }

  // 3. Standard Free Tier (after 5 days)
  return {
    tier: 'free',
    isPremium: false,
    isTrial: false,
    isFree: true,
    trialDaysRemaining: 0,
    maxQuestionsPerExam: PLAN_LIMITS.free.maxQuestionsPerExam,
    maxImportQuestions: PLAN_LIMITS.free.maxImportQuestions,
    tierBadge: 'Free Tier',
    tierDescription: PLAN_LIMITS.free.description,
    accountAgeDays: Math.floor(accountAgeDays),
  };
}
