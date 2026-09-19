import { SubscriptionPlan, AppUser } from '../types';

export interface TelebirrInitializeRequest {
  amount: number;
  outTradeNo: string;
  subject: string;
  phone?: string;
  returnUrl?: string;
  notifyUrl?: string;
  appId?: string;
  shortCode?: string;
  appKey?: string;
  publicKey?: string;
  privateKey?: string;
}

export interface TelebirrInitializeResponse {
  status: 'success' | 'failed';
  message: string;
  data?: {
    toPayUrl: string;
    outTradeNo: string;
  };
  isSandbox?: boolean;
}

export interface TelebirrVerifyResponse {
  status: 'success' | 'failed';
  verified: boolean;
  message: string;
  data?: {
    outTradeNo: string;
    tradeStatus: 'SUCCESS' | 'PENDING' | 'FAILED';
    amount?: number;
    raw?: unknown;
  };
}

export interface TelebirrConfigStatus {
  isConfigured: boolean;
  hasAppId: boolean;
  hasShortCode: boolean;
  hasKeys: boolean;
  mode: 'live' | 'sandbox';
}

/**
 * Generate a unique outTradeNo for Telebirr H5 payment
 * Format: EMP-TB-[PLAN]-[UID]-[TIMESTAMP]-[SALT]
 */
export function generateTelebirrTradeNo(userId: string, planId: string): string {
  const timestamp = Date.now();
  const randomEntropy =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)
      : Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 6);
  const cleanUid = (userId || 'guest').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  const cleanPlan = (planId || 'sub').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `EMP-TB-${cleanPlan}-${cleanUid}-${timestamp}-${randomEntropy}`.slice(0, 50);
}

/**
 * Initializes a transaction with the Telebirr Developer Gateway.
 * Invokes the server-side proxy route (/api/telebirr/initialize).
 */
export async function initializeTelebirrPayment(
  plan: SubscriptionPlan,
  user: AppUser,
  phoneNumber?: string,
  credentials?: {
    appId?: string;
    shortCode?: string;
    appKey?: string;
    publicKey?: string;
    privateKey?: string;
  }
): Promise<{ toPayUrl?: string; outTradeNo: string; isSandbox?: boolean; error?: string }> {
  const outTradeNo = generateTelebirrTradeNo(user.uid, plan.id);
  const cleanPhone = (phoneNumber || '0911000000').replace(/[^0-9+]/g, '') || '0911000000';

  const payload: TelebirrInitializeRequest = {
    amount: plan.priceETB,
    outTradeNo,
    subject: `Sinahard Pro - ${plan.name}`,
    phone: cleanPhone,
    returnUrl: `${window.location.origin}?telebirr_verify=${outTradeNo}`,
    notifyUrl: `${window.location.origin}/api/telebirr/notify`,
    ...(credentials?.appId ? { appId: credentials.appId } : {}),
    ...(credentials?.shortCode ? { shortCode: credentials.shortCode } : {}),
    ...(credentials?.appKey ? { appKey: credentials.appKey } : {}),
    ...(credentials?.publicKey ? { publicKey: credentials.publicKey } : {}),
    ...(credentials?.privateKey ? { privateKey: credentials.privateKey } : {}),
  };

  try {
    const res = await fetch('/api/telebirr/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: TelebirrInitializeResponse = await res.json();
    if (data.status === 'success' && data.data?.toPayUrl) {
      return {
        toPayUrl: data.data.toPayUrl,
        outTradeNo: data.data.outTradeNo || outTradeNo,
        isSandbox: data.isSandbox,
      };
    } else {
      return {
        outTradeNo,
        error: data.message || 'Telebirr payment gateway initialization failed.',
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to reach Telebirr server proxy';
    return {
      outTradeNo,
      error: msg,
    };
  }
}

/**
 * Verifies transaction with Telebirr Query API via server proxy.
 */
export async function verifyTelebirrPayment(
  outTradeNo: string
): Promise<TelebirrVerifyResponse> {
  try {
    const res = await fetch(`/api/telebirr/verify/${outTradeNo}`);
    const data: TelebirrVerifyResponse = await res.json();
    return data;
  } catch (err: unknown) {
    return {
      status: 'failed',
      verified: false,
      message: err instanceof Error ? err.message : 'Network error verifying Telebirr payment',
    };
  }
}

/**
 * Checks server configuration status for Telebirr
 */
export async function checkTelebirrConfigStatus(): Promise<TelebirrConfigStatus> {
  try {
    const res = await fetch('/api/telebirr/config-status');
    if (res.ok) {
      return await res.json();
    }
  } catch (_e) {
    // Return default offline status
  }
  return {
    isConfigured: false,
    hasAppId: false,
    hasShortCode: false,
    hasKeys: false,
    mode: 'sandbox',
  };
}
