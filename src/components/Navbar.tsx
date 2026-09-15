import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  PlusCircle,
  Sun,
  Moon,
  LogIn,
  LogOut,
  User as UserIcon,
  Cloud,
  CloudOff,
  GraduationCap,
  Sparkles,
  Menu,
  HelpCircle,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { AuthNoticeModal } from './AuthNoticeModal';

export type PageTab = 'home' | 'files' | 'results' | 'create' | 'manual';

interface NavbarProps {
  activeTab: PageTab;
  onTabChange: (tab: PageTab) => void;
  onOpenNotifications: () => void;
  onOpenDrawer: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenNotifications,
  onOpenDrawer,
}) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const {
    user,
    signInWithGoogle,
    signOut,
    loading: authLoading,
    isSigningIn,
    popupBlocked,
    dismissPopupBlocked,
  } = useAuth();
  const { unreadAlertsCount } = useNotifications();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [manualNoticeOpen, setManualNoticeOpen] = useState(false);

  const isCloudSynced = Boolean(user && user.uid !== 'guest' && !user.isAnonymous);

  const handleSignInClick = async () => {
    if (isSigningIn) return;
    const success = await signInWithGoogle();
    if (!success && popupBlocked) {
      // modal automatically triggered via popupBlocked
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/85 dark:bg-[#070e1a]/85 border-b border-zinc-200/80 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div
          onClick={() => onTabChange('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-blue-500 flex items-center justify-center text-zinc-950 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5 text-zinc-950 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-['Syne',sans-serif] font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-500 via-teal-400 to-blue-500 bg-clip-text text-transparent">
              ExamMaster <span className="text-xs uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 ml-1">Pro</span>
            </span>
          </div>
        </div>

        {/* Center Nav Tabs */}
        <nav className="hidden md:flex items-center p-1 rounded-full bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-sm">
          <button
            id="nav-tab-home"
            type="button"
            onClick={() => onTabChange('home')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-medium transition cursor-pointer ${
              activeTab === 'home'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm shadow-emerald-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Home
          </button>
          <button
            id="nav-tab-files"
            type="button"
            onClick={() => onTabChange('files')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-medium transition cursor-pointer ${
              activeTab === 'files'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm shadow-emerald-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Exams
          </button>
          <button
            id="nav-tab-results"
            type="button"
            onClick={() => onTabChange('results')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-medium transition cursor-pointer ${
              activeTab === 'results'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm shadow-emerald-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Results
          </button>
          <button
            id="nav-tab-create"
            type="button"
            onClick={() => onTabChange('create')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-medium transition cursor-pointer ${
              activeTab === 'create'
                ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm shadow-emerald-500/20'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Create
          </button>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Light / Dark Mode Toggle Button */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/80 transition cursor-pointer shadow-xs"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Drawer Menu Button */}
          <button
            id="drawer-toggle-btn"
            type="button"
            onClick={onOpenDrawer}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/80 transition cursor-pointer shadow-xs"
            title="Open Utilities & Tools Drawer"
            aria-label="Open Drawer Menu"
          >
            <Menu className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            <span className="hidden sm:inline">Menu</span>
            {unreadAlertsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          {/* Firebase Authentication & Sync Status */}
          {authLoading ? (
            <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
          ) : user && isCloudSynced ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition cursor-pointer"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center justify-center">
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <span className="text-xs font-semibold max-w-[90px] truncate text-emerald-700 dark:text-emerald-400">
                  {user.displayName || 'Synced'}
                </span>
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-2 z-50 text-sm">
                  <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="font-semibold text-zinc-900 dark:text-white truncate">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <Cloud className="w-3 h-3" />
                      Firestore Sync Active
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      signOut();
                      setShowUserMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : user && !isCloudSynced ? (
            <div className="relative flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2.5 pr-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition cursor-pointer"
                title="Guest Mode active (Local Storage)"
              >
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center">
                  {user.displayName?.charAt(0) || 'G'}
                </div>
                <span className="text-xs font-semibold max-w-[80px] truncate text-blue-700 dark:text-blue-400">
                  {user.displayName}
                </span>
                <CloudOff className="w-3.5 h-3.5 text-blue-500" />
              </button>

              <button
                type="button"
                disabled={isSigningIn}
                onClick={handleSignInClick}
                className="p-1.5 rounded-full text-zinc-500 hover:text-emerald-500 transition cursor-pointer"
                title="Connect Google Account"
              >
                {isSigningIn ? (
                  <div className="w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-10 mt-1 w-60 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-2 z-50 text-sm">
                  <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 space-y-1">
                    <p className="font-semibold text-zinc-900 dark:text-white truncate">
                      {user.displayName}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                      <CloudOff className="w-3 h-3 text-zinc-400" />
                      Local Guest Storage Active
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      setManualNoticeOpen(true);
                    }}
                    className="w-full px-4 py-2 text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 flex items-center gap-2 cursor-pointer transition text-xs"
                  >
                    <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                    Edit Profile Name / Mode
                  </button>
                  <button
                    type="button"
                    disabled={isSigningIn}
                    onClick={() => {
                      setShowUserMenu(false);
                      handleSignInClick();
                    }}
                    className="w-full px-4 py-2 text-left text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2 cursor-pointer transition text-xs font-semibold"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In with Google (Cloud Sync)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              id="google-signin-btn"
              type="button"
              disabled={isSigningIn}
              onClick={handleSignInClick}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-zinc-950 transition cursor-pointer shadow-sm shadow-emerald-500/20 ${
                isSigningIn ? 'opacity-70 cursor-wait' : ''
              }`}
              title="Sign in with Google to sync exams and results in real time"
            >
              {isSigningIn ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-950/40 border-t-zinc-950 animate-spin" />
                  <span className="hidden sm:inline">Connecting...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">Sign In</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Auth Notice Modal when popups are blocked in iframe */}
      <AuthNoticeModal
        isOpen={popupBlocked || manualNoticeOpen}
        onClose={() => {
          dismissPopupBlocked();
          setManualNoticeOpen(false);
        }}
      />

      {/* Mobile Tab Navigation */}
      <div className="md:hidden flex items-center justify-around px-2 py-1 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/90 text-xs">
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${
            activeTab === 'home' ? 'text-emerald-500 font-bold' : 'text-zinc-500'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('files')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${
            activeTab === 'files' ? 'text-emerald-500 font-bold' : 'text-zinc-500'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Exams</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('results')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${
            activeTab === 'results' ? 'text-emerald-500 font-bold' : 'text-zinc-500'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Results</span>
        </button>
        <button
          type="button"
          onClick={() => onTabChange('create')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg ${
            activeTab === 'create' ? 'text-emerald-500 font-bold' : 'text-zinc-500'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create</span>
        </button>
      </div>
    </header>
  );
};
