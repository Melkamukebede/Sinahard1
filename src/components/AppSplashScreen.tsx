import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SinahardLogo } from './SinahardLogo';
import { useAuth } from '../context/AuthContext';
import { isUserAdmin, isUserTeacher, isTeacherVerified } from '../services/db';
import { ShieldCheck, GraduationCap, School, Compass, Sparkles } from 'lucide-react';

interface AppSplashScreenProps {
  onComplete: () => void;
}

export const AppSplashScreen: React.FC<AppSplashScreenProps> = ({ onComplete }) => {
  const { user, loading: authLoading } = useAuth();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Connecting to Sinahard...');
  const [detectedRole, setDetectedRole] = useState<'admin' | 'teacher_verified' | 'teacher_pending' | 'student' | 'guest' | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Store stable refs to avoid interrupting progress animation on re-renders
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const userRef = useRef(user);
  userRef.current = user;

  // Real-time background role detection
  useEffect(() => {
    if (user && isUserAdmin(user)) {
      setDetectedRole('admin');
    } else if (user && isUserTeacher(user)) {
      setDetectedRole(isTeacherVerified(user) ? 'teacher_verified' : 'teacher_pending');
    } else if (user && user.uid !== 'guest' && !user.isAnonymous) {
      setDetectedRole('student');
    } else if (!authLoading) {
      setDetectedRole('guest');
    }
  }, [user, authLoading]);

  // Guaranteed visible progress shower running smoothly on mount
  useEffect(() => {
    let animationFrameId: number;
    const startTime = Date.now();
    // 2200ms visible progress duration - smooth, clear, and perfectly perceptible
    const PROGRESS_DURATION = 2200;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progressFraction = Math.min(1, elapsed / PROGRESS_DURATION);

      // Smooth progression from 0% to 100%
      const currentPercent = Math.min(100, Math.floor(progressFraction * 100));
      setProgress(currentPercent);

      // Micro status labels during progress
      if (currentPercent < 25) {
        setStatusText('Connecting to Sinahard...');
      } else if (currentPercent < 55) {
        setStatusText('Verifying credentials & permissions...');
      } else if (currentPercent < 85) {
        setStatusText('Configuring workspace...');
      } else {
        const u = userRef.current;
        if (u && isUserAdmin(u)) {
          setStatusText('Administrator access verified');
        } else if (u && isUserTeacher(u)) {
          setStatusText(isTeacherVerified(u) ? 'Teacher studio verified' : 'Teacher workspace ready');
        } else if (u && u.uid !== 'guest' && !u.isAnonymous) {
          setStatusText('Student profile verified');
        } else {
          setStatusText('Guest mode ready');
        }
      }

      if (progressFraction < 1) {
        animationFrameId = requestAnimationFrame(tick);
      } else {
        setProgress(100);
        // Pause briefly at 100% for user confirmation, then trigger graceful exit fade
        setTimeout(() => {
          setIsClosing(true);
          setTimeout(() => {
            onCompleteRef.current();
          }, 350);
        }, 220);
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Role info badge helper
  const renderRoleBadge = () => {
    if (!detectedRole) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 text-xs font-semibold border border-zinc-500/20 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 animate-spin text-sky-500" style={{ animationDuration: '3s' }} />
          <span>Verifying access...</span>
        </span>
      );
    }

    switch (detectedRole) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 backdrop-blur-md shadow-xs animate-in fade-in duration-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Administrator Access</span>
          </span>
        );
      case 'teacher_verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-500/20 backdrop-blur-md shadow-xs animate-in fade-in duration-200">
            <School className="w-3.5 h-3.5 text-sky-500" />
            <span>Teacher Studio (Verified)</span>
          </span>
        );
      case 'teacher_pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 backdrop-blur-md shadow-xs animate-in fade-in duration-200">
            <School className="w-3.5 h-3.5 text-amber-500" />
            <span>Teacher Studio</span>
          </span>
        );
      case 'student':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-500/20 backdrop-blur-md shadow-xs animate-in fade-in duration-200">
            <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
            <span>Student Dashboard</span>
          </span>
        );
      case 'guest':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 text-xs font-semibold border border-zinc-500/20 backdrop-blur-md shadow-xs animate-in fade-in duration-200">
            <Compass className="w-3.5 h-3.5 text-zinc-500" />
            <span>Guest Explorer</span>
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-[#070e1a] overflow-hidden select-none"
        >
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] rounded-full bg-sky-500/10 dark:bg-sky-500/15 blur-[100px] pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full bg-blue-600/10 dark:bg-cyan-400/10 blur-[70px] pointer-events-none" />

          {/* Central Branded Container */}
          <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 text-center">
            
            {/* Animated Sinahard Emblem */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="space-y-1.5 mb-7"
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="w-full space-y-3"
            >
              {/* Progress Track */}
              <div className="relative w-full h-2.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800/80 p-0.5 overflow-hidden backdrop-blur-sm shadow-inner">
                {/* Dynamic Fill Bar */}
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.1 }}
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
                  {progress}%
                </span>
              </div>
            </motion.div>

            {/* Resolved Role Indicator */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.18 }}
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
