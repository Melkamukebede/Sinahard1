import { AppUser, UserSubscription, SubscriptionPlan } from '../types';
import { isUserAdmin, isUserTeacher, isUserSubscriptionActive } from './db';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const GUEST_COINS_DEFAULT = 0;
export const FREE_REGISTERED_COINS_DEFAULT = 1;

const LOCAL_STORAGE_COINS_PREFIX = 'sinahard_user_coins_';
const LOCAL_STORAGE_FREE_COIN_CLAIMED = 'sinahard_free_coin_claimed_';
const LOCAL_STORAGE_OFFLINE_PRACTICE_COUNT = 'sinahard_offline_exam_count_';

export interface CoinTransactionResult {
  success: boolean;
  remainingCoins: number;
  message: string;
}

export interface OfflineAccessCheck {
  allowed: boolean;
  tier: 'guest' | 'free' | 'pro';
  coins: number;
  isOffline: boolean;
  reason?: string;
  canUseCoinToUnlock?: boolean;
}

/**
 * Returns current coin balance for a user.
 * - Guest: 0 coins
 * - Registered Free: 1 initial starter coin
 * - Purchased / Pro: stored balance or unlimited for teachers/admins
 */
export function getUserCoins(
  user: AppUser | null,
  activeSubscription?: UserSubscription | null
): number {
  if (typeof window === 'undefined') return 0;

  // 1. Admins and Teachers have unlimited coins
  if (user && (isUserAdmin(user) || isUserTeacher(user))) {
    return 999;
  }

  // 2. Active Subscription gives Pro access
  if (isUserSubscriptionActive(activeSubscription || null)) {
    // If they have explicit coin balance, return it, or grant high access
    const stored = getLocalUserCoins(user?.uid || 'guest');
    return Math.max(stored, 16);
  }

  // 3. Guest User: strictly 0 coins
  const isGuest = !user || user.uid === 'guest' || user.isAnonymous;
  if (isGuest) {
    return 0;
  }

  // 4. Registered Student:
  const uid = user.uid;
  const storedCoinsStr = localStorage.getItem(`${LOCAL_STORAGE_COINS_PREFIX}${uid}`);
  const freeClaimed = localStorage.getItem(`${LOCAL_STORAGE_FREE_COIN_CLAIMED}${uid}`);

  if (storedCoinsStr !== null) {
    const val = parseInt(storedCoinsStr, 10);
    return isNaN(val) ? 0 : Math.max(0, val);
  }

  // First time registered user: automatically grant 1 Free Coin!
  if (!freeClaimed) {
    localStorage.setItem(`${LOCAL_STORAGE_COINS_PREFIX}${uid}`, String(FREE_REGISTERED_COINS_DEFAULT));
    localStorage.setItem(`${LOCAL_STORAGE_FREE_COIN_CLAIMED}${uid}`, 'true');
    dispatchCoinsChanged(FREE_REGISTERED_COINS_DEFAULT);
    return FREE_REGISTERED_COINS_DEFAULT;
  }

  return 0;
}

/**
 * Direct internal helper to get raw stored coins
 */
function getLocalUserCoins(uid: string): number {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_COINS_PREFIX}${uid}`);
    if (raw === null) return 0;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  } catch {
    return 0;
  }
}

/**
 * Sets coins in local storage and dispatches update event.
 */
export function setUserCoinsLocally(uid: string, count: number): void {
  try {
    const safeCount = Math.max(0, count);
    localStorage.setItem(`${LOCAL_STORAGE_COINS_PREFIX}${uid}`, String(safeCount));
    dispatchCoinsChanged(safeCount);
  } catch (err) {
    console.warn('Could not save coins to localStorage:', err);
  }
}

/**
 * Add coins to user (after successful payment or bonus).
 */
export async function addCoinsToUser(
  user: AppUser | null,
  coinsToAdd: number
): Promise<number> {
  const uid = user?.uid || 'guest';
  const current = getLocalUserCoins(uid);
  const newTotal = current + Math.max(0, coinsToAdd);
  setUserCoinsLocally(uid, newTotal);

  // Sync to Firestore if user is logged in
  if (user && user.uid !== 'guest' && !user.isAnonymous) {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { coins: newTotal }).catch(async () => {
        await setDoc(userRef, { coins: newTotal }, { merge: true });
      });
    } catch {
      // Offline fallback: will sync next time
    }
  }

  return newTotal;
}

/**
 * Spend 1 coin for unlocking a full exam / study pass.
 * Works 100% offline!
 */
export function spendCoinForExam(
  user: AppUser | null,
  activeSubscription?: UserSubscription | null,
  examName?: string
): CoinTransactionResult {
  // Teachers, Admins, and Active Subscription don't spend coins
  if (user && (isUserAdmin(user) || isUserTeacher(user))) {
    return { success: true, remainingCoins: 999, message: 'Unlimited Staff Access' };
  }
  if (isUserSubscriptionActive(activeSubscription || null)) {
    return { success: true, remainingCoins: 999, message: 'Active Pro Access' };
  }

  const isGuest = !user || user.uid === 'guest' || user.isAnonymous;
  if (isGuest) {
    return {
      success: false,
      remainingCoins: 0,
      message: 'Guest accounts do not have coins. Please register to claim 1 Free Coin or purchase a plan.',
    };
  }

  const uid = user.uid;
  const current = getLocalUserCoins(uid);

  if (current <= 0) {
    return {
      success: false,
      remainingCoins: 0,
      message: 'Insufficient coins. Top up with 29.9 Birr (4 Coins) or higher to unlock full exams.',
    };
  }

  const updated = current - 1;
  setUserCoinsLocally(uid, updated);

  // Sync to Firestore in background if online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const userRef = doc(db, 'users', uid);
      updateDoc(userRef, { coins: updated }).catch(() => {});
    } catch {
      // Offline: local storage is authoritative
    }
  }

  return {
    success: true,
    remainingCoins: updated,
    message: `1 coin redeemed successfully! Remaining: ${updated} coin${updated === 1 ? '' : 's'}.`,
  };
}

/**
 * OFFLINE ACCESS CHECK:
 * Checks whether user can practice an exam offline without internet.
 * Supports:
 * - Free 20 questions limit offline for everyone.
 * - Full exam unlocking with coins offline.
 * - Pro/Teacher unlimited offline.
 */
export function checkOfflineExamAccess(
  user: AppUser | null,
  activeSubscription: UserSubscription | null,
  questionCount: number
): OfflineAccessCheck {
  const isOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;
  const isAdm = Boolean(user && isUserAdmin(user));
  const isTch = Boolean(user && isUserTeacher(user));
  const isPro = isUserSubscriptionActive(activeSubscription);

  // Pro/Teacher/Admin: full offline access
  if (isAdm || isTch || isPro) {
    return {
      allowed: true,
      tier: 'pro',
      coins: 999,
      isOffline,
    };
  }

  const isGuest = !user || user.uid === 'guest' || user.isAnonymous;
  const coins = getUserCoins(user, activeSubscription);

  // If question count is <= 20 questions, it is allowed for free offline
  if (questionCount <= 20) {
    return {
      allowed: true,
      tier: isGuest ? 'guest' : 'free',
      coins,
      isOffline,
      reason: isGuest ? 'Guest Free 20-Question Mode' : 'Free Tier 20-Question Mode',
    };
  }

  // Full exam (> 20 questions):
  if (coins > 0) {
    return {
      allowed: true,
      tier: 'free',
      coins,
      isOffline,
      canUseCoinToUnlock: true,
      reason: `You have ${coins} coin${coins > 1 ? 's' : ''}. 1 coin will unlock this full ${questionCount}-question exam offline.`,
    };
  }

  // No coins remaining
  return {
    allowed: false,
    tier: isGuest ? 'guest' : 'free',
    coins: 0,
    isOffline,
    reason: isGuest
      ? 'Guest mode has 0 coins. Register to get 1 Free Coin or top up.'
      : 'You have used your free coin. Upgrade or top up starting at 29.9 Birr (4 Coins) to unlock full exams.',
  };
}

/**
 * Notify components of coin balance changes.
 */
function dispatchCoinsChanged(newCoins: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('sinahard_coins_updated', {
        detail: { coins: newCoins },
      })
    );
  }
}
