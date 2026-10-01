import React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Plus,
  Menu,
  ShieldCheck,
} from 'lucide-react';
import { PageTab } from './Navbar';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { isUserAdmin, isUserTeacher } from '../services/db';
import { prefetchCreateWizard } from '../services/prefetch';

interface MobileNavProps {
  activeTab: PageTab;
  onTabChange: (tab: PageTab) => void;
  onOpenDrawer: () => void;
  examsCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  onOpenDrawer,
  examsCount = 0,
}) => {
  const { unreadAlertsCount } = useNotifications();
  const { user } = useAuth();
  const isTeacher = Boolean(user && isUserTeacher(user));
  const isAdmin = isUserAdmin(user);

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation Bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#070e1a]/95 backdrop-blur-2xl border-t border-zinc-200/80 dark:border-white/10 px-3 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl transition-colors select-none"
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 px-1 rounded-2xl transition-all cursor-pointer active:scale-95 touch-manipulation ${
            activeTab === 'home'
              ? 'text-zinc-950 dark:text-white font-bold'
              : 'text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-colors ${
              activeTab === 'home'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                : 'bg-transparent'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* 2. Exams / Library */}
        <button
          type="button"
          onClick={() => onTabChange('files')}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 px-1 rounded-2xl transition-all cursor-pointer active:scale-95 touch-manipulation relative ${
            activeTab === 'files'
              ? 'text-zinc-950 dark:text-white font-bold'
              : 'text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <div
            className={`p-1.5 rounded-xl transition-colors relative ${
              activeTab === 'files'
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                : 'bg-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            {examsCount > 0 && activeTab !== 'files' && (
              <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-0.5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-[9px] font-bold flex items-center justify-center shadow-xs">
                {examsCount > 99 ? '99+' : examsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">{isTeacher ? 'School' : 'Exams'}</span>
        </button>

        {/* 3. Center Create Action (Prominent) */}
        <button
          type="button"
          onMouseEnter={prefetchCreateWizard}
          onTouchStart={prefetchCreateWizard}
          onClick={() => onTabChange('create')}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-1 px-1 rounded-2xl transition-all cursor-pointer active:scale-90 touch-manipulation group"
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-md ${
              activeTab === 'create'
                ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 ring-2 ring-zinc-900/20 dark:ring-white/20'
                : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 hover:scale-105'
            }`}
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span
            className={`text-[10px] tracking-tight ${
              activeTab === 'create'
                ? 'font-bold text-zinc-950 dark:text-white'
                : 'font-medium text-zinc-600 dark:text-zinc-300'
            }`}
          >
            Create
          </span>
        </button>

        {/* 4. Activity or Admin Hub */}
        {isAdmin ? (
          <button
            type="button"
            onClick={() => onTabChange('admin-subs')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 px-1 rounded-2xl transition-all cursor-pointer active:scale-95 touch-manipulation ${
              activeTab === 'admin-subs'
                ? 'text-zinc-950 dark:text-white font-bold'
                : 'text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-colors ${
                activeTab === 'admin-subs'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'bg-transparent'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-[10px] tracking-tight">Admin</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onTabChange('results')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 px-1 rounded-2xl transition-all cursor-pointer active:scale-95 touch-manipulation ${
              activeTab === 'results'
                ? 'text-zinc-950 dark:text-white font-bold'
                : 'text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-colors ${
                activeTab === 'results'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-xs'
                  : 'bg-transparent'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight">Activity</span>
          </button>
        )}

        {/* 5. Menu / Utilities Drawer */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-1 px-1 rounded-2xl transition-all cursor-pointer active:scale-95 touch-manipulation text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
        >
          <div className="p-1.5 rounded-xl relative">
            <Menu className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-zinc-950 dark:bg-white animate-pulse" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
};
