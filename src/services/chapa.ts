import { SubscriptionPlan, AppUser } from '../types';

export interface ChapaInitializeRequest {
  amount: number;
  currency: 'ETB';
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  tx_ref: string;
  callback_url?: string;
  return_url?: string;
  customization?: {
    title?: string;
    description?: string;
    logo?: string;
  };
}

export interface ChapaInitializeResponse {
  message: string;
  status: 'success' | 'failed';
  data?: {
    checkout_url: string;
  };
}

export interface ChapaVerifyResponse {
  message: string;
  status: 'success' | 'failed';
  data?: {
    first_name: string;
    last_name: string;
    email: string;
    currency: string;
    amount: number;
    charge: number;
    mode: string;
    method: string;
    type: string;
    status: 'success' | 'pending' | 'failed';
    reference: string;
    tx_ref: string;
    customization: {
      title: string;
      description: string;
    };
    created_at: string;
    updated_at: string;
  };
}

// Generate unique transaction reference for Ethiopian Birr payments
export function generateTxRef(userId: string, planId: string): string {
  const timestamp = Date.now();
  const randomEntropy =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/[^a-zA-Z0-9]/g, '').slice(0, 8)
      : Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 6);
  const cleanUid = (userId || 'guest').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8);
  const cleanPlan = (planId || 'sub').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `EMP-${cleanPlan}-${cleanUid}-${timestamp}-${randomEntropy}`;
}

/**
 * Initializes a transaction with Chapa payment gateway.
 * First tries the server-side API (/api/chapa/initialize),
 * and gracefully falls back to client direct call or manual reference flow.
 */
export async function initializeChapaPayment(
  plan: SubscriptionPlan,
  user: AppUser,
  phoneNumber?: string,
  userProvidedKey?: string
): Promise<{ checkoutUrl?: string; txRef: string; fallbackToManual?: boolean; error?: string }> {
  let txRef = generateTxRef(user.uid, plan.id);
  const chapaKey =
    userProvidedKey ||
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.VITE_CHAPA_SECRET_KEY || import.meta.env?.VITE_CHAPA_PUBLIC_KEY)) ||
    '';

  const names = (user.displayName || 'Student User').trim().split(' ');
  const firstName = names[0] || 'Student';
  const lastName = names.slice(1).join(' ') || 'User';

  // Chapa strictly validates email format
  const rawEmail = (user.email || '').trim();
  const email =
    rawEmail && rawEmail.includes('@') && !rawEmail.endsWith('.et')
      ? rawEmail
      : rawEmail && rawEmail.includes('@')
      ? rawEmail
      : 'student@gmail.com';

  const cleanPhone = (phoneNumber || '0911000000').replace(/[^0-9+]/g, '') || '0911000000';

  const payload = {
    amount: plan.priceETB,
    currency: 'ETB',
    email,
    first_name: firstName,
    last_name: lastName,
    phone_number: cleanPhone,
    tx_ref: txRef,
    callback_url: window.location.origin,
    return_url: `${window.location.origin}?chapa_verify=${txRef}`,
    customization: {
      title: 'Sinahard Pro',
      description: `${plan.durationLabel} plan`,
    },
    ...(userProvidedKey ? { secretKey: userProvidedKey } : {}),
  };

  // 1. Try server-side proxy route (/api/chapa/initialize)
  try {
    const serverRes = await fetch('/api/chapa/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const serverData: ChapaInitializeResponse & { tx_ref?: string } = await serverRes.json();
    if (serverData.status === 'success' && serverData.data?.checkout_url) {
      return { checkoutUrl: serverData.data.checkout_url, txRef: serverData.tx_ref || txRef };
    } else if (serverData.message) {
      const msg =
        typeof serverData.message === 'string'
          ? serverData.message
          : JSON.stringify(serverData.message);
      return {
        txRef: serverData.tx_ref || txRef,
        error: `Chapa gateway: ${msg}`,
      };
    }
  } catch (_e) {
    // If server route is unavailable (e.g., pure static preview), continue to direct attempt
  }

  // 2. Direct browser call to Chapa API (if key is present)
  // Ensure fresh txRef in case the previous one was logged on network error
  if (chapaKey) {
    const directTxRef = generateTxRef(user.uid, plan.id);
    try {
      const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${chapaKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: plan.priceETB,
          currency: 'ETB',
          email,
          first_name: firstName,
          last_name: lastName,
          phone_number: cleanPhone,
          tx_ref: directTxRef,
          callback_url: window.location.origin,
          return_url: `${window.location.origin}?chapa_verify=${directTxRef}`,
          customization: {
            title: 'Sinahard Pro',
            description: `${plan.durationLabel} plan`,
          },
        }),
      });

      const data: ChapaInitializeResponse = await response.json();
      if (data.status === 'success' && data.data?.checkout_url) {
        return { checkoutUrl: data.data.checkout_url, txRef: directTxRef };
      }
      return {
        txRef: directTxRef,
        fallbackToManual: true,
        error: data.message || 'Payment gateway initialization failed.',
      };
    } catch (err) {
      console.warn('Chapa API direct gateway note:', err);
      return {
        txRef: directTxRef,
        fallbackToManual: true,
        error: 'Unable to reach Chapa online gateway. You can use direct Telebirr / CBE transfer.',
      };
    }
  }

  // 3. Fallback to reference-based Telebirr / CBE transfer
  return {
    txRef,
    fallbackToManual: true,
  };
}

/**
 * Verifies transaction with Chapa API via server proxy or direct gateway.
 */
export async function verifyChapaTransaction(
  txRef: string,
  secretKey?: string
): Promise<{ verified: boolean; message: string; data?: ChapaVerifyResponse['data'] }> {
  // 1. Try server-side verification proxy
  try {
    const serverRes = await fetch(`/api/chapa/verify/${txRef}`);
    if (serverRes.ok) {
      const serverData: ChapaVerifyResponse = await serverRes.json();
      if (serverData.status === 'success' && serverData.data?.status === 'success') {
        return { verified: true, message: 'Payment successfully verified!', data: serverData.data };
      }
      if (serverData.message) {
        return { verified: false, message: serverData.message };
      }
    }
  } catch (_e) {
    // Continue to direct verification
  }

  // 2. Try direct verification if key is provided
  const key =
    secretKey ||
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.VITE_CHAPA_SECRET_KEY || import.meta.env?.VITE_CHAPA_PUBLIC_KEY)) ||
    '';

  if (!key) {
    return {
      verified: false,
      message: 'Chapa Secret Key not provided for automatic verification.',
    };
  }

  try {
    const res = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
    const result: ChapaVerifyResponse = await res.json();
    if (result.status === 'success' && result.data?.status === 'success') {
      return { verified: true, message: 'Payment successfully verified!', data: result.data };
    }
    return { verified: false, message: result.message || 'Verification pending or unsuccessful.' };
  } catch (err) {
    return {
      verified: false,
      message: err instanceof Error ? err.message : 'Network error verifying transaction',
    };
  }
}
