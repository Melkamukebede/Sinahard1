import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  School,
  BookOpen,
  CloudUpload,
  ShieldCheck,
  RefreshCw,
  LogOut,
  Edit3,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Mail,
  User,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { AppUser } from '../types';
import { SinahardLogo } from './SinahardLogo';

interface TeacherPendingVerificationViewProps {
  user: AppUser;
  onSignOut: () => Promise<void>;
  onOpenRegistrationModal: () => void;
  onRefreshStatus: () => Promise<boolean>;
}

export const TeacherPendingVerificationView: React.FC<TeacherPendingVerificationViewProps> = ({
  user,
  onSignOut,
  onOpenRegistrationModal,
  onRefreshStatus,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const handleCheckNow = async () => {
    setIsChecking(true);
    setCheckMessage(null);
    try {
      const isVerified = await onRefreshStatus();
      if (isVerified) {
        setCheckMessage('Verification confirmed! Unlocking Teacher Studio...');
      } else {
        setCheckMessage('Status: Under Review. Melkamu (Admin) has received your request and will verify your school credentials shortly.');
      }
    } catch {
      setCheckMessage('Could not connect to verify status. Please check your internet connection and try again.');
    } finally {
      setIsChecking(false);
      setTimeout(() => {
        setCheckMessage((curr) => (curr?.includes('Under Review') ? null : curr));
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#070e1a] text-zinc-950 dark:text-white font-['Plus_Jakarta_Sans',sans-serif] selection:bg-zinc-950 selection:text-white dark:selection:bg-white dark:selection:text-zinc-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 w-full backdrop-blur-2xl bg-white/80 dark:bg-[#070e1a]/85 border-b border-zinc-200/80 dark:border-white/10 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <SinahardLogo size="md" idSuffix="teacher-pending" />
            <div className="flex flex-col">
              <span className="font-['Outfit',sans-serif] font-bold text-base sm:text-lg tracking-tight text-zinc-900 dark:text-white flex items-center gap-1.5">
                Sinahard
                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                  Teacher Studio
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenRegistrationModal}
              className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition cursor-pointer flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-black dark:text-white" />
              <span className="hidden sm:inline">Edit Details</span>
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5 text-black dark:text-white" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* 1. Main Review Notice Banner */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[32px] sm:rounded-[36px] bg-white dark:bg-[#0c182b] border border-zinc-200/90 dark:border-white/10 p-6 sm:p-10 shadow-sm relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-zinc-100 dark:bg-zinc-800/40 blur-3xl pointer-events-none" />

          <div className="relative space-y-6">
            {/* Status Pill with Pulsing indicator */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-900 dark:bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-900 dark:bg-white" />
              </span>
              <Clock className="w-3.5 h-3.5 text-black dark:text-white ml-0.5" />
              <span>Account Under Admin Review</span>
            </div>

            <div className="space-y-3 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-['Outfit',sans-serif] tracking-tight text-zinc-950 dark:text-white leading-tight">
                Please Wait, Admin is Checking Your Verification
              </h1>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
                Thank you for registering as a teacher on Sinahard Ethiopian Exam System. The administrator (<strong className="font-semibold text-zinc-950 dark:text-white">Melkamu</strong>) is currently verifying your school credentials and teaching subject before unlocking full cloud publishing rights.
              </p>
            </div>

            {/* Verification Status Check Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={handleCheckNow}
                disabled={isChecking}
                className="px-6 py-3 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-98 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-white dark:text-zinc-950 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Checking Status with Firestore...' : 'Check Verification Status'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenRegistrationModal}
                className="px-5 py-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4 text-black dark:text-white" />
                <span>Update School Info</span>
              </button>
            </div>

            {/* Check Feedback Message */}
            {checkMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-black dark:text-white shrink-0" />
                <span>{checkMessage}</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* 2. Registered Teacher Credentials Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[32px] bg-white dark:bg-[#0c182b] border border-zinc-200/90 dark:border-white/10 p-6 sm:p-8 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-black dark:text-white" />
              <h2 className="text-sm font-bold font-['Outfit',sans-serif] uppercase tracking-wider text-zinc-950 dark:text-white">
                Your Registered Credentials
              </h2>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-zinc-700">
              Pending Admin Check
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                <User className="w-3.5 h-3.5 text-black dark:text-white" />
                <span>Teacher Name</span>
              </div>
              <div className="text-sm font-bold text-zinc-950 dark:text-white truncate">
                {user.teacherName || user.displayName || 'Instructor'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                <School className="w-3.5 h-3.5 text-black dark:text-white" />
                <span>Affiliated School</span>
              </div>
              <div className="text-sm font-bold text-zinc-950 dark:text-white truncate">
                {user.school || user.schoolName || 'Ethiopian Secondary School'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                <BookOpen className="w-3.5 h-3.5 text-black dark:text-white" />
                <span>Subject & Grade</span>
              </div>
              <div className="text-sm font-bold text-zinc-950 dark:text-white truncate">
                {user.teachingSubject || 'General Science'} • Grade {user.grade || '12'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                <Mail className="w-3.5 h-3.5 text-black dark:text-white" />
                <span>Linked Account</span>
              </div>
              <div className="text-sm font-bold text-zinc-950 dark:text-white truncate">
                {user.email || 'Google Account'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. WHAT TEACHERS DO IN THIS APP (Short & Brief Way with Black Icons & Beautiful Display) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[32px] sm:rounded-[36px] bg-white dark:bg-[#0c182b] border border-zinc-200/90 dark:border-white/10 p-6 sm:p-10 shadow-sm space-y-6"
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-900 dark:text-white">
              <Sparkles className="w-3.5 h-3.5 text-black dark:text-white" />
              <span>Teacher Capabilities Overview</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-zinc-950 dark:text-white tracking-tight">
              What Teachers Do in Sinahard
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
              A brief overview of your tools and privileges once verified by the administrator:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Capability 1 */}
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-xs">
                  <BookOpen className="w-6 h-6 text-black dark:text-white" />
                </div>
                <h3 className="font-['Outfit',sans-serif] font-bold text-base sm:text-lg text-zinc-950 dark:text-white">
                  1. Create Class & Unit Exams
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                  Draft multiple-choice questions with answer choices and step-by-step solutions using our instant <strong className="font-semibold text-zinc-950 dark:text-white">Smart Paste text parser</strong> or the structured question wizard.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" />
                <span>Grades 7–12 & University freshman</span>
              </div>
            </div>

            {/* Capability 2 */}
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-xs">
                  <CloudUpload className="w-6 h-6 text-black dark:text-white" />
                </div>
                <h3 className="font-['Outfit',sans-serif] font-bold text-base sm:text-lg text-zinc-950 dark:text-white">
                  2. Push to Cloud Firestore
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                  Publish verified exams directly to the <strong className="font-semibold text-zinc-950 dark:text-white">Cloud Firestore database</strong>. Your exams automatically carry your name, school affiliation, and topic tags for students to discover.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" />
                <span>One-click Cloud Firestore synchronization</span>
              </div>
            </div>

            {/* Capability 3 */}
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-xs">
                  <School className="w-6 h-6 text-black dark:text-white" />
                </div>
                <h3 className="font-['Outfit',sans-serif] font-bold text-base sm:text-lg text-zinc-950 dark:text-white">
                  3. Dedicated School Repository
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                  Access your school's mock examinations, midterms, and unit quizzes in one place with the dedicated <strong className="font-semibold text-zinc-950 dark:text-white">My School</strong> filter, letting your students practice school material together.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" />
                <span>Targeted to your school's students</span>
              </div>
            </div>

            {/* Capability 4 */}
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-6 h-6 text-black dark:text-white" />
                </div>
                <h3 className="font-['Outfit',sans-serif] font-bold text-base sm:text-lg text-zinc-950 dark:text-white">
                  4. Zero Fees & Simplified Studio
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal">
                  Verified teachers enjoy an <strong className="font-semibold text-zinc-950 dark:text-white">ad-free, paywall-free environment</strong>. Unnecessary student billing banners, results pages, and payment prompts are completely hidden for a clean authoring flow.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-black dark:text-white" />
                <span>Unlimited exam creation & exports</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4. Administrator Contact Help Note */}
        <div className="text-center py-4 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
          <p>
            Need expedited teacher verification? Contact the administrator at{' '}
            <a
              href="mailto:melkamukebede11@gmail.com"
              className="font-bold underline text-zinc-900 dark:text-white hover:opacity-80"
            >
              melkamukebede11@gmail.com
            </a>
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            Sinahard Ethiopian Exam System • Built for Teachers & Secondary Students
          </p>
        </div>
      </main>
    </div>
  );
};

export default TeacherPendingVerificationView;
