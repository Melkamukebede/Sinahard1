import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  School,
  User,
  MapPin,
  Calendar,
  Phone,
  CheckCircle2,
  X,
  Sparkles,
  LogIn,
  Layers,
  BookOpen,
  ShieldCheck,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Mail,
  Lock,
  ArrowRight,
  UserPlus,
  Compass,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppUser, UserRole } from '../types';
import { AppCoin } from './AppCoin';
import { getUserCoins } from '../services/coinService';
import { auth } from '../firebase';

export interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (registeredUser: Partial<AppUser>) => void;
  sharedExamId?: string | null;
  sharedExamName?: string | null;
  onAccessSharedExam?: (examId: string) => void;
}

const ETHIOPIAN_REGIONS = [
  'Addis Ababa',
  'Oromia',
  'Amhara',
  'Sidama',
  'Tigray',
  'Hawassa City',
  'Central Ethiopia',
  'South Ethiopia',
  'Dire Dawa',
  'Harari',
  'Afar',
  'Somali',
  'Benishangul-Gumuz',
  'Gambela',
  'South West Ethiopia',
];

const GRADE_LEVELS = [
  { id: '12', label: 'Grade 12 (Matric / EUEE)', shortLabel: 'Grade 12' },
  { id: '11', label: 'Grade 11 (Preparatory)', shortLabel: 'Grade 11' },
  { id: '10', label: 'Grade 10 (Secondary)', shortLabel: 'Grade 10' },
  { id: '9', label: 'Grade 9 (Secondary)', shortLabel: 'Grade 9' },
  { id: 'Freshman', label: 'Freshman (University)', shortLabel: 'Freshman' },
  { id: 'Senior University', label: 'Senior University', shortLabel: 'University' },
];

const STREAM_OPTIONS = [
  { id: 'Natural Science', label: 'Natural Science', desc: 'Physics, Chem, Bio, Math' },
  { id: 'Social Science', label: 'Social Science', desc: 'History, Geog, Econ, Math' },
  { id: 'General', label: 'General Curriculum', desc: 'Standard Core Curriculum' },
];

const EXAM_YEAR_OPTIONS = [
  { id: '2018 E.C. (2026)', label: '2018 E.C. (2026) - Upcoming' },
  { id: '2017 E.C. (2025)', label: '2017 E.C. (2025)' },
  { id: '2016 E.C. (2024)', label: '2016 E.C. (2024)' },
  { id: '2015 E.C. (2023)', label: '2015 E.C. (2023)' },
  { id: '2014 E.C. (2022)', label: '2014 E.C. (2022)' },
  { id: '2013 E.C. (2021)', label: '2013 E.C. (2021)' },
  { id: '2012 E.C. (2020)', label: '2012 E.C. (2020)' },
  { id: '2011 E.C. (2019)', label: '2011 E.C. (2019)' },
  { id: '2010 E.C. (2018)', label: '2010 E.C. (2018)' },
  { id: 'General Practice', label: 'General Practice & Mastery' },
];

const TEACHING_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'History',
  'Geography',
  'Economics',
  'Civics',
  'Aptitude / SAT',
  'General Science',
];

interface OptionSpinnerProps<T extends string> {
  label: string;
  icon: React.ReactNode;
  value: T;
  options: { id: T; label: string; shortLabel?: string; desc?: string }[];
  onChange: (val: T) => void;
  disabled?: boolean;
  disabledNote?: string;
}

function OptionSpinner<T extends string>({
  label,
  icon,
  value,
  options,
  onChange,
  disabled = false,
  disabledNote,
}: OptionSpinnerProps<T>) {
  const currentIndex = Math.max(
    0,
    options.findIndex(
      (opt) =>
        opt.id === value ||
        opt.label === value ||
        (value && opt.id.includes(value)) ||
        (value && opt.label.includes(value))
    )
  );

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    const prevIndex = (currentIndex - 1 + options.length) % options.length;
    onChange(options[prevIndex].id);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    const nextIndex = (currentIndex + 1) % options.length;
    onChange(options[nextIndex].id);
  };

  const currentOption = options[currentIndex] || options[0];

  return (
    <div className={`space-y-1 ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
          {icon}
          <span>{label}</span>
        </label>
        {disabledNote && (
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
            {disabledNote}
          </span>
        )}
      </div>

      <div className="relative flex items-center rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-1 hover:border-zinc-300 dark:hover:border-zinc-700 transition shadow-2xs">
        <button
          type="button"
          disabled={disabled}
          onClick={handlePrev}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-black dark:text-white hover:bg-zinc-200/80 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0 disabled:opacity-30"
          aria-label={`Previous ${label}`}
        >
          <ChevronLeft className="w-4 h-4 text-black dark:text-white" />
        </button>

        <div className="relative flex-1 px-2.5 py-1 text-center min-w-0 cursor-pointer">
          <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
            {currentOption?.label || value}
          </div>
          {currentOption?.desc && (
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
              {currentOption.desc}
            </div>
          )}

          <select
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value as T)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-xs"
            aria-label={label}
          >
            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label} {opt.desc ? `(${opt.desc})` : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={handleNext}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-black dark:text-white hover:bg-zinc-200/80 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0 disabled:opacity-30"
          aria-label={`Next ${label}`}
        >
          <ChevronRight className="w-4 h-4 text-black dark:text-white" />
        </button>

        <div className="pr-1.5 pl-0.5 text-black dark:text-white pointer-events-none">
          <ChevronDown className="w-3.5 h-3.5 text-black dark:text-white" />
        </div>
      </div>
    </div>
  );
}

export const UserRegistrationModal: React.FC<UserRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  sharedExamId,
  sharedExamName,
  onAccessSharedExam,
}) => {
  const {
    user,
    firebaseUser,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    sendPasswordReset,
    isSigningIn,
    popupBlocked,
    updateStudentProfile,
    error: authError,
    clearError,
  } = useAuth();

  const isUserEmailAdmin = Boolean(
    firebaseUser?.email?.toLowerCase().trim() === 'melkamukebede11@gmail.com' ||
    user?.email?.toLowerCase().trim() === 'melkamukebede11@gmail.com'
  );

  const isFirebaseLinked = Boolean(
    (firebaseUser && user?.uid !== 'guest' && !user?.isAnonymous) ||
    (auth.currentUser && !auth.currentUser.isAnonymous)
  );

  // Two-page navigation:
  // Step 1: Sign up by email / Sign in by Google options
  // Step 2: Linked with Firebase -> Grade, Stream, School, etc.
  const [currentStep, setCurrentStep] = useState<1 | 2>(() => {
    // If user is already authenticated with Firebase, go straight to Step 2
    return isFirebaseLinked ? 2 : 1;
  });

  // Step 1 Email Auth state
  const [emailAuthMode, setEmailAuthMode] = useState<'signup' | 'signin'>('signup');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [resetSentSuccess, setResetSentSuccess] = useState(false);

  // Step 2 Profile states
  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    if (isUserEmailAdmin) return 'admin';
    return (user?.role as UserRole) || 'student';
  });

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [grade, setGrade] = useState(String(user?.grade || '12'));
  const [stream, setStream] = useState<'Natural Science' | 'Social Science' | 'General'>(
    (user?.stream as any) || 'Natural Science'
  );
  const [schoolName, setSchoolName] = useState(user?.school || user?.schoolName || '');
  const [region, setRegion] = useState(user?.region || 'Addis Ababa');
  const [targetExamYear, setTargetExamYear] = useState(() => {
    const saved = user?.targetExamYear ? String(user.targetExamYear) : '';
    if (saved) {
      const match = EXAM_YEAR_OPTIONS.find(
        (opt) => opt.id === saved || opt.label === saved || saved.includes(opt.id.slice(0, 9))
      );
      if (match) return match.id;
      return saved;
    }
    return '2018 E.C. (2026)';
  });
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');

  // Teacher specific state
  const [teacherName, setTeacherName] = useState(user?.teacherName || user?.displayName || '');
  const [teachingSubject, setTeachingSubject] = useState('Mathematics');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Auto-advance to Step 2 when user becomes authenticated with Firebase
  useEffect(() => {
    if (isFirebaseLinked && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [isFirebaseLinked]);

  // Sync state with user context
  useEffect(() => {
    if (user) {
      if (user.displayName && !displayName) setDisplayName(user.displayName);
      if (user.role) setSelectedRole(user.role);
      if (user.grade) setGrade(String(user.grade));
      if (user.stream) setStream(user.stream);
      if (user.school || user.schoolName) setSchoolName(user.school || user.schoolName || '');
      if (user.teacherName) setTeacherName(user.teacherName);
      if (user.region) setRegion(user.region);
      if (user.targetExamYear) {
        const saved = String(user.targetExamYear);
        const match = EXAM_YEAR_OPTIONS.find(
          (opt) => opt.id === saved || opt.label === saved || saved.includes(opt.id.slice(0, 9))
        );
        setTargetExamYear(match ? match.id : saved);
      }
      if (user.phoneNumber) setPhoneNumber(user.phoneNumber);
    }
    if (isUserEmailAdmin) {
      setSelectedRole('admin');
    }
  }, [user, isUserEmailAdmin]);

  const handleGradeSelect = (selectedGrade: string) => {
    setGrade(selectedGrade);
    if (selectedGrade === '9' || selectedGrade === '10') {
      setStream('General');
    } else if (stream === 'General') {
      setStream('Natural Science');
    }
  };

  const handleGoogleConnect = async () => {
    setFormError(null);
    clearError();
    const success = await signInWithGoogle();
    if (success) {
      const currentUser = auth.currentUser;
      if (currentUser?.displayName) {
        if (!displayName || displayName === 'Student') {
          setDisplayName(currentUser.displayName);
        }
        if (!teacherName || teacherName === 'Teacher') {
          setTeacherName(currentUser.displayName);
        }
      }
      // Step 2 is shown when linked
      setCurrentStep(2);
    }
    return success;
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setResetSentSuccess(false);

    if (!emailInput.trim() || !emailInput.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (emailAuthMode === 'signup') {
      if (!displayName.trim() && selectedRole !== 'teacher') {
        setFormError('Please enter your full name.');
        return;
      }
      if (selectedRole === 'teacher' && !teacherName.trim()) {
        setFormError('Please enter your teacher name.');
        return;
      }
      if (passwordInput.length < 6) {
        setFormError('Password must be at least 6 characters long.');
        return;
      }
      if (passwordInput !== confirmPasswordInput) {
        setFormError('Passwords do not match. Please verify.');
        return;
      }

      const activeName = selectedRole === 'teacher' ? teacherName.trim() : displayName.trim();
      const res = await signUpWithEmail(emailInput, passwordInput, activeName);
      if (res.success) {
        // Move to Page 2: Link with Grade, Stream & School fields
        setCurrentStep(2);
      } else {
        setFormError(res.error || 'Registration failed.');
      }
    } else {
      // Sign In mode
      if (!passwordInput) {
        setFormError('Please enter your password.');
        return;
      }
      const res = await signInWithEmail(emailInput, passwordInput);
      if (res.success) {
        // Move to Page 2
        setCurrentStep(2);
      } else {
        setFormError(res.error || 'Sign in failed.');
      }
    }
  };

  const handleForgotPassword = async () => {
    if (!emailInput.trim()) {
      setFormError('Please type your email address above to receive password reset link.');
      return;
    }
    setFormError(null);
    const res = await sendPasswordReset(emailInput);
    if (res.success) {
      setResetSentSuccess(true);
    } else {
      setFormError(res.error || 'Could not send reset email.');
    }
  };

  const executeSaveProfile = async (profileData: Partial<AppUser>) => {
    setIsSubmitting(true);
    try {
      await updateStudentProfile(profileData);
      localStorage.setItem('has_completed_role_onboarding', 'true');
      
      // Initialize free coin locally for instant access
      if (user || profileData.displayName) {
        getUserCoins({ uid: user?.uid || 'student', ...profileData } as AppUser);
      }

      setSavedSuccess(true);

      if (onSuccess) {
        onSuccess(profileData);
      }

      // If user clicked a shared exam, directly trigger shared exam access
      if (sharedExamId && onAccessSharedExam) {
        onAccessSharedExam(sharedExamId);
      }

      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 650);
    } catch (err) {
      console.error('Registration failed:', err);
      setFormError('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (selectedRole === 'student') {
      if (!displayName.trim()) {
        setFormError('Please enter your full name.');
        return;
      }
      if (!schoolName.trim()) {
        setFormError('Please enter your school name.');
        return;
      }
    } else if (selectedRole === 'teacher') {
      if (!teacherName.trim()) {
        setFormError('Please enter your teacher name.');
        return;
      }
      if (!schoolName.trim()) {
        setFormError('Please enter your school name.');
        return;
      }
    }

    const finalRole: UserRole = isUserEmailAdmin ? 'admin' : selectedRole;
    const profileData: Partial<AppUser> = {
      role: finalRole,
      displayName: selectedRole === 'teacher' ? teacherName.trim() : displayName.trim(),
      grade,
      stream,
      school: schoolName.trim(),
      schoolName: schoolName.trim(),
      teacherName: selectedRole === 'teacher' ? teacherName.trim() : undefined,
      teachingSubject: selectedRole === 'teacher' ? teachingSubject : undefined,
      isVerifiedTeacher: isUserEmailAdmin ? true : Boolean(user?.isVerifiedTeacher),
      region,
      targetExamYear,
      phoneNumber: phoneNumber.trim(),
      isRegistered: true,
      registeredAt: user?.registeredAt || new Date().toISOString(),
    };

    await executeSaveProfile(profileData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg rounded-[28px] bg-white dark:bg-[#0c182b] border border-zinc-200/90 dark:border-white/10 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col"
      >
        {/* Header with Step Indicator */}
        <div className="px-5 sm:px-6 py-4 border-b border-zinc-100 dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shrink-0">
              {currentStep === 1 ? (
                <UserPlus className="w-5 h-5 text-black dark:text-white" />
              ) : selectedRole === 'teacher' ? (
                <School className="w-5 h-5 text-black dark:text-white" />
              ) : selectedRole === 'admin' ? (
                <ShieldCheck className="w-5 h-5 text-black dark:text-white" />
              ) : (
                <GraduationCap className="w-5 h-5 text-black dark:text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold font-['Outfit',sans-serif] text-zinc-950 dark:text-white">
                  {currentStep === 1 ? 'Step 1: Account Access' : 'Step 2: Academic Profile'}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                  {currentStep === 1 ? 'Page 1 of 2' : 'Page 2 of 2'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {currentStep === 1
                  ? 'Sign up with email or connect via Google account'
                  : 'Customize your grade, stream, and school in Firebase'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-black dark:text-white" />
          </button>
        </div>

        {/* Step Progress Stepper Bar */}
        <div className="grid grid-cols-2 border-b border-zinc-100 dark:border-white/10 text-xs font-bold">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`py-2.5 px-3 flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
              currentStep === 1
                ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white bg-zinc-50/50 dark:bg-zinc-900/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
            }`}
          >
            <div className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
              currentStep === 1
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
            }`}>
              1
            </div>
            <span>Sign Up &amp; Auth</span>
            {isFirebaseLinked && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (isFirebaseLinked || displayName.trim()) {
                setCurrentStep(2);
              }
            }}
            className={`py-2.5 px-3 flex items-center justify-center gap-2 transition cursor-pointer border-b-2 ${
              currentStep === 2
                ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white bg-zinc-50/50 dark:bg-zinc-900/40'
                : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
            }`}
          >
            <div className={`w-5 h-5 rounded-full text-[11px] flex items-center justify-center font-bold ${
              currentStep === 2
                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
            }`}>
              2
            </div>
            <span>Grade &amp; School</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4">

          {/* ======================================================== */}
          {/* SHARED EXAM ACCESS PROMPT (When clicked shared exams)    */}
          {/* ======================================================== */}
          {sharedExamId && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5 text-amber-600 dark:text-amber-400">
                <Compass className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-zinc-950 dark:text-white">
                    Access Shared Exam
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <AppCoin size="xs" />
                    <span>Free Pass</span>
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  Sign up or log in below to unlock <strong className="text-zinc-900 dark:text-white font-semibold">{sharedExamName || sharedExamId}</strong>. You will automatically start practicing with synced score tracking!
                </p>
              </div>
            </div>
          )}

          {/* Error & Status Alerts */}
          {formError && (
            <div className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="font-bold underline cursor-pointer text-rose-900 dark:text-rose-100 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {authError && !formError && (
            <div className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
              <span>{authError}</span>
              <button
                type="button"
                onClick={clearError}
                className="font-bold underline cursor-pointer text-rose-900 dark:text-rose-100 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {resetSentSuccess && (
            <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Password reset link sent to your email. Please check your inbox.</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* PAGE 1: SIGN UP BY EMAIL & SIGN IN BY GOOGLE             */}
          {/* ======================================================== */}
          {currentStep === 1 && (
            <motion.div
              key="step-1-auth"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* If already linked with Firebase, show connected pill */}
              {isFirebaseLinked && (
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-zinc-950 dark:text-white truncate">
                        Signed in as {user?.email || firebaseUser?.email}
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Firebase authenticated. Click Next to update your grade &amp; school.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-3 py-1.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* 1. SINGLE PROMINENT GOOGLE SIGN IN BUTTON */}
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isSigningIn}
                  onClick={handleGoogleConnect}
                  className="w-full py-3 px-4 rounded-2xl bg-zinc-950 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs sm:text-sm shadow-sm transition cursor-pointer flex items-center justify-center gap-2.5 active:scale-98 disabled:opacity-60"
                >
                  {isSigningIn ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      <span>Connecting with Google...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12.24 10.285V13.4h6.887C18.2 16.14 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.53 0 2.925.57 3.99 1.515l2.43-2.43C17.07 3.51 14.775 2.5 12.24 2.5 6.99 2.5 2.74 6.75 2.74 12s4.25 9.5 9.5 9.5c5.49 0 9.15-3.855 9.15-9.33 0-.63-.06-1.245-.18-1.885H12.24z" />
                      </svg>
                      <span>Sign In with Google</span>
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-3 text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Instant 1-Click Link</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <AppCoin size="xs" />
                    <span>1 Free Coin Included</span>
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-zinc-200 dark:border-zinc-800 w-full" />
                <span className="bg-white dark:bg-[#0c182b] px-3 text-[11px] font-bold uppercase tracking-wider text-zinc-400 shrink-0">
                  Or Sign Up by Email
                </span>
              </div>

              {/* Email Auth Toggle Tabs: Sign Up vs Sign In */}
              <div className="p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEmailAuthMode('signup');
                    setFormError(null);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    emailAuthMode === 'signup'
                      ? 'bg-white dark:bg-[#0c182b] text-zinc-950 dark:text-white shadow-2xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account (Sign Up)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmailAuthMode('signin');
                    setFormError(null);
                  }}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    emailAuthMode === 'signin'
                      ? 'bg-white dark:bg-[#0c182b] text-zinc-950 dark:text-white shadow-2xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
                {/* Full Name for Sign Up */}
                {emailAuthMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-black dark:text-white" />
                      <span>Full Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={selectedRole === 'teacher' ? teacherName : displayName}
                      onChange={(e) => {
                        if (selectedRole === 'teacher') {
                          setTeacherName(e.target.value);
                        } else {
                          setDisplayName(e.target.value);
                        }
                      }}
                      placeholder={selectedRole === 'teacher' ? 'e.g. Teacher Melkamu Kebede' : 'e.g. Melkamu Kebede'}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 transition"
                    />
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 transition"
                  />
                </div>

                {/* Password Input */}
                <div className={emailAuthMode === 'signup' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : ''}>
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-black dark:text-white" />
                      <span>Password *</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 transition"
                    />
                  </div>

                  {emailAuthMode === 'signup' && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-black dark:text-white" />
                        <span>Confirm Password *</span>
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="Re-type password"
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 transition"
                      />
                    </div>
                  )}
                </div>

                {/* Forgot Password Link for Sign In */}
                {emailAuthMode === 'signin' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit Email Button */}
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="w-full py-2.5 px-4 rounded-full bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
                >
                  {isSigningIn ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <>
                      <span>{emailAuthMode === 'signup' ? 'Create Account & Continue to Step 2' : 'Sign In & Continue to Step 2'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Guest / Skip Option */}
              <div className="pt-2 flex items-center justify-between text-xs border-t border-zinc-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer text-[11px] font-medium"
                >
                  Skip for now &amp; Continue as Guest →
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* PAGE 2: USER LINKED WITH FIREBASE (Grade, Stream, School)*/}
          {/* ======================================================== */}
          {currentStep === 2 && (
            <motion.div
              key="step-2-profile"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {/* Linked Firebase Status Banner */}
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={displayName || teacherName || user.email || 'User'}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                      {(displayName || teacherName || user?.email || firebaseUser?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-950 dark:text-white truncate">
                      {user?.email || firebaseUser?.email || (displayName ? `${displayName} (Guest)` : 'Guest Student')}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{isFirebaseLinked ? 'Linked with Firebase Firestore' : 'Local Offline Profile'}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-[11px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-2 py-1 rounded-lg hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0"
                >
                  Change Account
                </button>
              </div>

              {/* Role Switcher: Student vs Teacher */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className={`p-3 rounded-2xl text-left border transition cursor-pointer flex items-center justify-between ${
                    selectedRole === 'student'
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap
                      className={`w-4 h-4 ${
                        selectedRole === 'student'
                          ? 'text-white dark:text-zinc-950'
                          : 'text-black dark:text-white'
                      }`}
                    />
                    <div>
                      <div className="font-bold text-xs sm:text-sm">Student</div>
                      <div className={`text-[10px] ${selectedRole === 'student' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        Practice &amp; tests
                      </div>
                    </div>
                  </div>
                  {selectedRole === 'student' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white dark:text-zinc-950 shrink-0" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('teacher')}
                  className={`p-3 rounded-2xl text-left border transition cursor-pointer flex items-center justify-between ${
                    selectedRole === 'teacher'
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <School
                      className={`w-4 h-4 ${
                        selectedRole === 'teacher'
                          ? 'text-white dark:text-zinc-950'
                          : 'text-black dark:text-white'
                      }`}
                    />
                    <div>
                      <div className="font-bold text-xs sm:text-sm">Teacher</div>
                      <div className={`text-[10px] ${selectedRole === 'teacher' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        Create &amp; publish
                      </div>
                    </div>
                  </div>
                  {selectedRole === 'teacher' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-white dark:text-zinc-950 shrink-0" />
                  )}
                </button>
              </div>

              {/* Main Profile Form */}
              <form onSubmit={handleProfileSubmit} className="space-y-3.5">
                {selectedRole === 'teacher' ? (
                  /* TEACHER FIELDS */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-black dark:text-white" />
                          <span>Full Name *</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={teacherName}
                          onChange={(e) => setTeacherName(e.target.value)}
                          placeholder="e.g. Teacher Melkamu Kebede"
                          className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5 text-black dark:text-white" />
                          <span>School Name *</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          placeholder="e.g. Bole Secondary School"
                          className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-black dark:text-white" />
                          <span>Teaching Subject</span>
                        </label>
                        <select
                          value={teachingSubject}
                          onChange={(e) => setTeachingSubject(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 transition cursor-pointer"
                        >
                          {TEACHING_SUBJECTS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <OptionSpinner
                        label="Region / City"
                        icon={<MapPin className="w-3.5 h-3.5 text-black dark:text-white" />}
                        value={region}
                        options={ETHIOPIAN_REGIONS.map((r) => ({ id: r, label: r }))}
                        onChange={setRegion}
                      />
                    </div>
                  </div>
                ) : (
                  /* STUDENT / ADMIN FIELDS */
                  <div className="space-y-3.5">
                    {/* Full Name & School Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-black dark:text-white" />
                          <span>Full Name *</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="e.g. Melkamu Kebede"
                          className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                          <School className="w-3.5 h-3.5 text-black dark:text-white" />
                          <span>School Name *</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={schoolName}
                          onChange={(e) => setSchoolName(e.target.value)}
                          placeholder="e.g. Bole Secondary School"
                          className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 transition"
                        />
                      </div>
                    </div>

                    {/* 1. Grade Level Spinner */}
                    <OptionSpinner
                      label="Grade Level"
                      icon={<GraduationCap className="w-3.5 h-3.5 text-black dark:text-white" />}
                      value={grade}
                      options={GRADE_LEVELS}
                      onChange={handleGradeSelect}
                    />

                    {/* 2. Stream Focus Spinner */}
                    <OptionSpinner
                      label="Stream Focus"
                      icon={<Layers className="w-3.5 h-3.5 text-black dark:text-white" />}
                      value={stream}
                      options={STREAM_OPTIONS}
                      onChange={(val) => setStream(val as any)}
                      disabled={grade === '9' || grade === '10'}
                      disabledNote={grade === '9' || grade === '10' ? 'General Core for Grades 9 & 10' : undefined}
                    />

                    {/* 3. Region / City & Target Exam Year Spinners */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <OptionSpinner
                        label="Region / City"
                        icon={<MapPin className="w-3.5 h-3.5 text-black dark:text-white" />}
                        value={region}
                        options={ETHIOPIAN_REGIONS.map((r) => ({ id: r, label: r }))}
                        onChange={setRegion}
                      />

                      <OptionSpinner
                        label="Target Exam Year"
                        icon={<Calendar className="w-3.5 h-3.5 text-black dark:text-white" />}
                        value={targetExamYear}
                        options={EXAM_YEAR_OPTIONS}
                        onChange={setTargetExamYear}
                      />
                    </div>
                  </div>
                )}

                {/* Mobile Phone (Optional) */}
                <div>
                  <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>Mobile Phone (Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0911234567"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 transition"
                  />
                </div>

                {/* Action Bar */}
                <div className="pt-3 flex items-center justify-between gap-3 border-t border-zinc-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back to Step 1</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-6 py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-zinc-100 font-bold text-xs shadow-xs transition cursor-pointer active:scale-98 flex items-center gap-2 ${
                      isSubmitting ? 'opacity-70 cursor-wait' : ''
                    }`}
                  >
                    {savedSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Saved to Firebase!</span>
                      </>
                    ) : isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        <span>Saving Profile...</span>
                      </>
                    ) : sharedExamId ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Save &amp; Start Shared Exam 🚀</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-white dark:text-zinc-950" />
                        <span>Save Profile &amp; Finish</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

        </div>
      </motion.div>
    </div>
  );
};

export default UserRegistrationModal;
