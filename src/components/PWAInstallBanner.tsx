import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { SinahardLogo } from './SinahardLogo';

export const PWAInstallBanner: React.FC = () => {
  const {
    isInstalled,
    canInstall,
    isIOS,
    showIOSInstructions,
    installApp,
    dismissIOSInstructions,
  } = usePWAInstall();

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem('sinahard_pwa_banner_dismissed') === 'true';
    setDismissed(isDismissed);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('sinahard_pwa_banner_dismissed', 'true');
  };

  if (isInstalled || !canInstall || dismissed) {
    // If iOS instructions are actively requested, still show the modal even if banner is dismissed
    if (showIOSInstructions) {
      return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <SinahardLogo size="sm" idSuffix="pwa-ios" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-950 dark:text-white">Install on iPhone / iPad</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Add to Home Screen for fullscreen & offline exams</p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissIOSInstructions}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-700 dark:text-zinc-300">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
                <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-zinc-900 dark:text-white">Tap the Share button</p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px] flex items-center gap-1">
                    At the bottom bar in Safari, tap the <Share className="w-3.5 h-3.5 inline text-blue-500" /> Share icon.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-zinc-900 dark:text-white">Select 'Add to Home Screen'</p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px] flex items-center gap-1">
                    Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline text-emerald-500" /> <b>Add to Home Screen</b>.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissIOSInstructions}
              className="w-full py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs shadow-xs hover:bg-black dark:hover:bg-zinc-100 transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* Mobile/Tablet Smart Install Banner */}
      <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-sky-500/10 via-blue-600/10 to-emerald-500/10 border border-sky-500/25 dark:border-sky-400/20 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shrink-0 shadow-xs">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-950 dark:text-white truncate flex items-center gap-1.5">
              <span>Install Sinahard App</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300 font-extrabold uppercase">
                Offline
              </span>
            </p>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
              Fullscreen practice, 0ms load time, and home screen icon
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={installApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-950 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs shadow-xs transition cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Guided Install Sheet */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <SinahardLogo size="sm" idSuffix="pwa-ios-modal" />
                <div>
                  <h3 className="font-bold text-sm text-zinc-950 dark:text-white">Install on iPhone / iPad</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Add to Home Screen for fullscreen & offline exams</p>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissIOSInstructions}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-700 dark:text-zinc-300">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
                <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-zinc-900 dark:text-white">Tap the Share button</p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px] flex items-center gap-1">
                    At the bottom bar in Safari, tap the <Share className="w-3.5 h-3.5 inline text-blue-500" /> Share icon.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-zinc-900 dark:text-white">Select 'Add to Home Screen'</p>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px] flex items-center gap-1">
                    Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline text-emerald-500" /> <b>Add to Home Screen</b>.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissIOSInstructions}
              className="w-full py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold text-xs shadow-xs hover:bg-black dark:hover:bg-zinc-100 transition cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
