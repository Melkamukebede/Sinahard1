import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SinahardLogo } from './SinahardLogo';
import { useAuth } from '../context/AuthContext';
import { isUserAdmin, isUserTeacher } from '../services/db';
import { ShieldCheck, GraduationCap, School, Compass, Sparkles } from 'lucide-react';

interface AppSplashScreenProps {
  onComplete: () => void;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({ onComplete }) => {
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState(12);
  const [statusText, setStatusText] = useState('Connecting to Sinahard...');
  const [detectedRole, setDetectedRole] = useState<'admin' | 'teacher' | 'student' | 'guest' | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const completedRef = useRef(false);

  // Background Role Evaluation
  useEffect(() => {
    if (!authLoading) {
      if (user && isUserAdmin(user)) {
        setDetectedRole('admin');
      } else if (user && isUserTeacher(user)) {
        setDetectedRole('teacher');
      } else if (user && user.uid !== 'guest' && !user.isAnonymous) {
        setDetectedRole('student');
      } else {
        setDetectedRole('guest');
      }
    }
  }, [user, authLoading]);

  // Smooth Progression Loop
  useEffect(() => {
    let animationFrameId: number;

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const minDuration = 1400; // minimum duration (ms) for a silky smooth, luxurious feel

      if (authLoading) {
        // While auth is still checking in the background, smoothly advance up to ~75%
        const simulated = Math.min(75, Math.floor((elapsed / 1200) * 75) + 12);
        setProgress(simulated);

        if (simulated < 35) {
          setStatusText('Verifying credentials...');
        } else if (simulated < 65) {
          setStatusText('Checking account permissions...');
        } else {
          setStatusText('Resolving user workspace...');
        }

        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        // Auth is resolved in background! Now evaluate role and smoothly finish to 100%
        const remainingTo100 = Math.max(0, minDuration - elapsed);

        if (elapsed < minDuration) {
          const ratio = elapsed / minDuration;
          const target = Math.min(95, Math.floor(75 + ratio * 20));
          setProgress((prev) => Math.max(prev, target));
          animationFrameId = requestAnimationFrame(updateProgress);
        } else {
          // Reached final stage
          setProgress(100);

          if (user && isUserAdmin(user)) {
            setStatusText('Admin access verified');
          } else if (user && isUserTeacher(user)) {
            setStatusText('Teacher workspace verified');
          } else if (user && user.uid !== 'guest' && !user.isAnonymous) {
            setStatusText('Student profile verified');
          } else {
            setStatusText('Guest mode ready');
          }

          if (!completedRef.current) {
            completedRef.current = true;
            // Brief pause at 100% so user sees completion before seamless fade out
            setTimeout(() => {
              setIsClosing(true);
              setTimeout(() => {
                onComplete();
              }, 450); // matches fade exit duration
            }, 300);
          }
        }
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrameId);
  }, [authLoading, user, onComplete]);

  // Role info badge helper
  const renderRoleBadge = () => {
    if (!detectedRole) return null;

    switch (detectedRole) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator Access</span>
          </span>
        );
      case 'teacher':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-500/20 backdrop-blur-md">
            <School className="w-3.5 h-3.5" />
            <span>Teacher Portal</span>
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/20 backdrop-blur-md">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student Dashboard</span>
          </span>
        );
      case 'guest':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 text-xs font-semibold border border-zinc-500/20 backdrop-blur-md">
            <Compass className="w-3.5 h-3.5" />
            <span>Guest Explorer</span>
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#060c18] overflow-hidden select-none"
        >
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] rounded-full bg-sky-500/10 dark:bg-sky-500/15 blur-[100px] pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full bg-blue-600/10 dark:bg-cyan-400/10 blur-[70px] pointer-events-none" />

          {/* Central Branded Container */}
          <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center">
            
            {/* Animated Sinahard Emblem */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative mb-6"
            >
              {/* Pulsing Backlight Ring */}
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-sky-400/20 via-blue-500/20 to-cyan-300/20 blur-md animate-pulse" />
              
              <div className="relative p-2 rounded-3xl bg-white/60 dark:bg-white/[0.04] backdrop-blur-xl border border-zinc-200/80 dark:border-white/10 shadow-2xl">
                <SinahardLogo size="2xl" idSuffix="splash" />
              </div>
            </motion.div>

            {/* App Brand Name & Please wait... */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="space-y-1.5 mb-8"
            >
              <h1 className="text-2xl sm:text-3xl font-extrabold font-['Outfit',sans-serif] tracking-tight text-zinc-950 dark:text-white">
                Sinahard
              </h1>
              <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium text-zinc-600 dark:text-zinc-300">
                <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-spin" style={{ animationDuration: '4s' }} />
                <span>Please wait...</span>
              </div>
            </motion.div>

            {/* Advanced Animated Progressor */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="w-full space-y-3"
            >
              {/* Progress Track */}
              <div className="relative w-full h-2.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 p-0.5 overflow-hidden backdrop-blur-sm shadow-inner">
                {/* Dynamic Fill Bar */}
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.2 }}
                >
                  {/* High-speed Specular Shimmer Ray */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                  {/* Glowing Leading Head */}
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_10px_#38bdf8]" />
                </motion.div>
              </div>

              {/* Progress Percentage & Status Label */}
              <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400 px-0.5">
                <span className="truncate max-w-[210px] text-left">
                  {statusText}
                </span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-200">
                  {Math.round(progress)}%
                </span>
              </div>
            </motion.div>

            {/* Resolved Role Indicator (Discreet & Elegant) */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
              className="mt-6 h-7 flex items-center justify-center"
            >
              {renderRoleBadge()}
            </motion.div>
          </div>

          {/* Bottom subtle copyright / branding note */}
          <div className="absolute bottom-6 text-[10px] tracking-wider uppercase font-semibold text-zinc-400 dark:text-zinc-600">
            National Exam & Academic Mastery Portal
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
