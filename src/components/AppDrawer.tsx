import React, { useEffect } from 'react';
import {
  X,
  Sparkles,
  FileCode,
  FileText,
  Bell,
  BookOpen,
  Download,
  RotateCcw,
  Sun,
  Moon,
  LogIn,
  LogOut,
  UserCheck,
  Cloud,
  CloudOff,
  GraduationCap,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { Exam, ExamResult } from '../types';

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfessorModal: () => void;
  onOpenPasteModal: () => void;
  onOpenNotificationsModal: () => void;
  onNavigateToManual: () => void;
  onExportAllData: () => void;
  onResetDefaultExams: () => void;
}

export const AppDrawer: React.FC<AppDrawerProps> = ({
  isOpen,
  onClose,
  onOpenProfessorModal,
  onOpenPasteModal,
  onOpenNotificationsModal,
  onNavigateToManual,
  onExportAllData,
  onResetDefaultExams,
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
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          id="app-drawer-panel"
          className="w-screen max-w-sm bg-white dark:bg-[#070e1a] border-l border-zinc-200/80 dark:border-white/10 shadow-2xl flex flex-col transition-transform animate-in slide-in-from-right duration-300 ease-out"
        >
          {/* Drawer Header */}
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-[#0d1829]/80 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm font-['Syne',sans-serif] text-zinc-900 dark:text-white">
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
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* User Account / Profile Card */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center gap-3">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-10 h-10 rounded-full border border-emerald-500 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/30">
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
                        <CloudOff className="w-3 h-3 text-blue-500" />
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          Local Guest Storage
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
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
                    className="w-full py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In with Google
                  </button>
                )}
              </div>
            </div>

            {/* Specialized Tools & AI Utilities */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1 mb-2">
                Tools & Utilities
              </div>

              {/* User Manual Documentation - Prominently in Drawer */}
              <button
                id="drawer-manual-btn"
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToManual();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold shadow-xs">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <span>User Manual</span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        Guide
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      LaTeX formulas & app documentation
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Exam Professor AI */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProfessorModal();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white">
                      Exam Professor
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Curriculum prompt studio
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors" />
              </button>

              {/* Paste / Import Questions */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPasteModal();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white">
                      Paste as Text File
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Raw question parser
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors" />
              </button>

              {/* Push & Study Notifications */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNotificationsModal();
                }}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800 text-left transition cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                    {unreadAlertsCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-zinc-950 font-bold text-[9px] flex items-center justify-center">
                        {unreadAlertsCount}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <span>Study Cadence & Push</span>
                      {dailyReminderEnabled && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                          Daily
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Reminders & browser alerts
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors" />
              </button>
            </div>

            {/* Data & Backup Tools */}
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                Data & Management
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onExportAllData}
                  className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-left transition cursor-pointer"
                  title="Export complete backup as JSON"
                >
                  <Download className="w-4 h-4 text-emerald-500 mb-1" />
                  <div className="text-xs font-bold text-zinc-900 dark:text-white">Backup JSON</div>
                  <div className="text-[10px] text-zinc-500">Export data</div>
                </button>

                <button
                  type="button"
                  onClick={onResetDefaultExams}
                  className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-left transition cursor-pointer"
                  title="Restore default sample curriculum exams"
                >
                  <RotateCcw className="w-4 h-4 text-amber-500 mb-1" />
                  <div className="text-xs font-bold text-zinc-900 dark:text-white">Reset Samples</div>
                  <div className="text-[10px] text-zinc-500">Restore default</div>
                </button>
              </div>
            </div>
          </div>

          {/* Drawer Footer with Theme Toggle */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-[#0d1829]/90 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Switch to Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Switch to Dark Mode</span>
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
