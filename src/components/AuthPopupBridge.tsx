import React, { useEffect, useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export const AuthPopupBridge: React.FC = () => {
  const [status, setStatus] = useState<'signing_in' | 'success' | 'error'>('signing_in');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('sinahard_auth_channel');
    } catch {
      // BroadcastChannel fallback
    }

    const runAuth = async () => {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        setStatus('success');
        if (channel) {
          channel.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', uid: result.user.uid });
        }
        if (window.opener) {
          try {
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', uid: result.user.uid }, '*');
          } catch {
            // ignore
          }
        }
        setTimeout(() => {
          window.close();
        }, 600);
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code || '';
        const msg = err instanceof Error ? err.message : String(err);
        if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
          window.close();
          return;
        }
        setStatus('error');
        setErrorMsg(msg || 'Authentication failed. Please try again.');
      }
    };

    runAuth();

    return () => {
      if (channel) channel.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center font-['Plus_Jakarta_Sans',sans-serif]">
      {status === 'signing_in' && (
        <div className="space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-900 dark:text-white mx-auto" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Connecting Google Account...</h2>
          <p className="text-xs text-zinc-500">Please choose your account in the Google prompt window</p>
        </div>
      )}
      {status === 'success' && (
        <div className="space-y-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Account Connected!</h2>
          <p className="text-xs text-zinc-500">Syncing with your registration page...</p>
        </div>
      )}
      {status === 'error' && (
        <div className="space-y-3 max-w-xs">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Connection Notice</h2>
          <p className="text-xs text-zinc-500">{errorMsg}</p>
          <button
            type="button"
            onClick={() => window.close()}
            className="px-4 py-1.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs font-bold cursor-pointer transition shadow-xs"
          >
            Close Window
          </button>
        </div>
      )}
    </div>
  );
};
