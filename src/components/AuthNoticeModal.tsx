import React, { useState } from 'react';
import { ExternalLink, UserCheck, ShieldAlert, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthNoticeModal: React.FC<AuthNoticeModalProps> = ({ isOpen, onClose }) => {
  const { setGuestDisplayName, dismissPopupBlocked, user } = useAuth();
  const [nickname, setNickname] = useState(user?.displayName || 'Student');

  if (!isOpen) return null;

  const handleOpenNewTab = () => {
    try {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    } catch {
      // fallback
    }
  };

  const handleSaveGuestName = (e: React.FormEvent) => {
    e.preventDefault();
    setGuestDisplayName(nickname);
    dismissPopupBlocked();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="auth-notice-modal"
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0d1829] border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden p-6 space-y-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
                Browser Popup Blocked
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Embedded preview policy or browser security
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              dismissPopupBlocked();
              onClose();
            }}
            className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Google authentication requires opening an identity authorization window, which may be blocked inside embedded previews or by browser ad-blockers.
        </p>

        <div className="space-y-3 pt-1">
          {/* Action Option 1: Open New Tab */}
          <button
            type="button"
            onClick={handleOpenNewTab}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 transition cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 text-left">
              <ExternalLink className="w-4 h-4 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-bold text-zinc-900 dark:text-white">
                  Open App in New Tab
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Allows Google Sign-In popups to open directly
                </div>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-emerald-500 text-zinc-950">
              Open ↗
            </span>
          </button>

          {/* Action Option 2: Continue as Guest */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
              <UserCheck className="w-4 h-4 text-blue-500" />
              <span>Or Continue in Guest Mode</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold ml-auto">
                Offline Ready
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              All exams, question creation, and practice session scores are securely preserved in your local browser storage.
            </p>

            <form onSubmit={handleSaveGuestName} className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter student name..."
                maxLength={24}
                className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold transition hover:opacity-90 cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                Save & Continue
              </button>
            </form>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => {
              dismissPopupBlocked();
              onClose();
            }}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 font-medium cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
