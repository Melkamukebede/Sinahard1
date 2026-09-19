import React, { useEffect } from 'react';
import {
  X,
  Bell,
  BookOpen,
  Download,
  RotateCcw,
  Sun,
  Moon,
  LogIn,
  LogOut,
  Cloud,
  CloudOff,
  GraduationCap,
  ChevronRight,
  ShieldCheck,
  Crown,
  CloudUpload,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { UserSubscription } from '../types';
import { isUserAdmin } from '../services/db';

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNotificationsModal: () => void;
  onNavigateToManual?: () => void;
  onNavigateToAdminSubs?: () => void;
  onOpenDatabaseUpload?: () => void;
  onExportAllData: () => void;
  onResetDefaultExams: () => void;
  onOpenSubscriptionModal: () => void;
  activeSubscription: UserSubscription | null;
}

export const AppDrawer: React.FC<AppDrawerProps> = ({
  isOpen,
  onClose,
  onOpenNotificationsModal,
  onNavigateToManual,
  onNavigateToAdminSubs,
  onOpenDatabaseUpload,
  onExportAllData,
  onResetDefaultExams,
  onOpenSubscriptionModal,
}) => {
  const { user, signInWithGoogle, signOut, isSigningIn } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { unreadAlertsCount, permission, dailyReminderEnabled } = useNotifications();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCloudSynced = Boolean(user && user.uid !== 'guest' && !user.isAnonymous);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          id="app-drawer-panel"
          className="relative w-screen max-w-sm bg-white/95 dark:bg-[#070e1a]/95 backdrop-blur-2xl border-l border-white/60 dark:border-white/10 shadow-2xl flex flex-col transition-transform animate-in slide-in-from-right duration-300 ease-out overflow-hidden"
        >
          {/* Subtle Atmospheric Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-12 -left-24 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Drawer Header - Frosted Glass Bar */}
          <div className="relative px-5 py-4 border-b border-white/60 dark:border-white/10 flex items-center justify-between bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold shadow-2xs">
                <GraduationCap className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h3 className="font-bold text-sm font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                  ExamMaster Menu
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Utilities, AI tools & settings
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="relative flex-1 overflow-y-auto p-5 space-y-4">
            {/* User Account / Profile Porcelain Card */}
            <div className="p-4 rounded-[22px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-10 h-10 rounded-full border border-white/80 dark:border-white/20 object-cover shadow-2xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold flex items-center justify-center text-sm border border-white/80 dark:border-white/10 shadow-2xs">
                    {user?.displayName?.charAt(0) || 'S'}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                    {user?.displayName || 'Guest Student'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {isCloudSynced ? (
                      <>
                        <Cloud className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Cloud Synced
                        </span>
                      </>
                    ) : (
                      <>
                        <CloudOff className="w-3 h-3 text-zinc-400" />
                        <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                          Local Guest Storage
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
                {isCloudSynced ? (
                  <button
                    type="button"
                    onClick={signOut}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSigningIn}
                    onClick={() => {
                      onClose();
                      signInWithGoogle();
                    }}
                    className="w-full py-2 px-4 rounded-full bg-zinc-950 dark:bg-white hover:opacity-90 text-white dark:text-zinc-950 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In with Google
                  </button>
                )}
              </div>
            </div>

            {/* Specialized Tools & Utilities */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                Tools & Utilities
              </div>

              {/* Premium Ethiopian Birr Subscription Card */}
              <button
                id="drawer-premium-btn"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSubscriptionModal();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-[22px] bg-white dark:bg-[#0c182b] hover:bg-zinc-50 dark:hover:bg-[#0f1d33] border border-white/80 dark:border-white/10 text-left shadow-xs active:scale-98 transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-white/80 dark:border-white/10 flex items-center justify-center font-bold shadow-2xs">
                    <Crown className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <span>Premium Subscription</span>
                      <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        ETB
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Telebirr, CBE & Chapa day/month plans
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Admin Payment Verification (Melkamu / Admin) */}
              {isUserAdmin(user) && onNavigateToAdminSubs && (
                <button
                  id="drawer-admin-subs-btn"
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToAdminSubs();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-[22px] bg-white dark:bg-[#0c182b] hover:bg-zinc-50 dark:hover:bg-[#0f1d33] border border-white/80 dark:border-white/10 text-left shadow-xs active:scale-98 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-white/80 dark:border-white/10 flex items-center justify-center font-bold shadow-2xs">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <span>Payment Verification</span>
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          Admin
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Verify Telebirr, CBE & BoA references
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* Database Storage Uploader (Cloud Firestore - Admin only) */}
              {isUserAdmin(user) && onOpenDatabaseUpload && (
                <button
                  id="drawer-db-upload-btn"
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDatabaseUpload();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-[22px] bg-white dark:bg-[#0c182b] hover:bg-zinc-50 dark:hover:bg-[#0f1d33] border border-white/80 dark:border-white/10 text-left shadow-xs active:scale-98 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-white/80 dark:border-white/10 flex items-center justify-center font-bold shadow-2xs">
                      <CloudUpload className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <span>Cloud Firestore Upload</span>
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                          Admin
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Sync questions directly to Firebase Firestore
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {/* Push & Study Notifications */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNotificationsModal();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-[22px] bg-white dark:bg-[#0c182b] hover:bg-zinc-50 dark:hover:bg-[#0f1d33] border border-white/80 dark:border-white/10 text-left shadow-xs active:scale-98 transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-white/80 dark:border-white/10 flex items-center justify-center shadow-2xs">
                    <Bell className="w-4 h-4" />
                    {unreadAlertsCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <span>Study Cadence & Push</span>
                      {dailyReminderEnabled && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold border border-zinc-200 dark:border-zinc-700">
                          Daily
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Reminders & browser alerts
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Data & Backup Tools */}
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                Data & Management
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onExportAllData}
                  className="p-3 rounded-[20px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 hover:border-zinc-300 dark:hover:border-zinc-700 text-left shadow-xs active:scale-98 transition cursor-pointer"
                  title="Export complete backup as JSON"
                >
                  <Download className="w-4 h-4 text-zinc-700 dark:text-zinc-300 mb-1" />
                  <div className="text-xs font-bold text-zinc-900 dark:text-white">Backup JSON</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Export data</div>
                </button>

                <button
                  type="button"
                  onClick={onResetDefaultExams}
                  className="p-3 rounded-[20px] bg-white dark:bg-[#0c182b] border border-white/80 dark:border-white/10 hover:border-zinc-300 dark:hover:border-zinc-700 text-left shadow-xs active:scale-98 transition cursor-pointer"
                  title="Restore default sample curriculum exams"
                >
                  <RotateCcw className="w-4 h-4 text-zinc-700 dark:text-zinc-300 mb-1" />
                  <div className="text-xs font-bold text-zinc-900 dark:text-white">Reset Samples</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400">Restore default</div>
                </button>
              </div>
            </div>
          </div>

          {/* Drawer Footer with Theme Toggle */}
          <div className="p-4 border-t border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/80 dark:border-white/10 bg-white dark:bg-[#0c182b] text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-xs transition cursor-pointer"
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-zinc-200" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-zinc-700" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>
            </div>

            <span className="text-[10px] font-mono text-zinc-400">
              ExamMaster v2.1
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
