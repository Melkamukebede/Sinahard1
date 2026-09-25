import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppUser, UserRole } from '../types';
import { AppCoin } from './AppCoin';
import { getUserCoins } from '../services/coinService';

export interface UserRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (registeredUser: Partial<AppUser>) => void;
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

// Target Exam Year starting from 2010 E.C.
const EXAM_YEAR_OPTIONS = [
  { id: '2010 E.C. (2018)', label: '2010 E.C. (2018)' },
  { id: '2011 E.C. (2019)', label: '2011 E.C. (2019)' },
  { id: '2012 E.C. (2020)', label: '2012 E.C. (2020)' },
  { id: '2013 E.C. (2021)', label: '2013 E.C. (2021)' },
  { id: '2014 E.C. (2022)', label: '2014 E.C. (2022)' },
  { id: '2015 E.C. (2023)', label: '2015 E.C. (2023)' },
  { id: '2016 E.C. (2024)', label: '2016 E.C. (2024)' },
  { id: '2017 E.C. (2025)', label: '2017 E.C. (2025)' },
  { id: '2018 E.C. (2026)', label: '2018 E.C. (2026) - Upcoming' },
  { id: '2019 E.C. (2027)', label: '2019 E.C. (2027)' },
  { id: '2020 E.C. (2028)', label: '2020 E.C. (2028)' },
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

/**
 * Interactive Spinner Selector Component
 * Provides both left/right stepper controls and a click-to-open dropdown
 */
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

      {/* Spinner Control Container */}
      <div className="relative flex items-center rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-1 hover:border-zinc-300 dark:hover:border-zinc-700 transition shadow-2xs">
        {/* Left Step Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={handlePrev}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-black dark:text-white hover:bg-zinc-200/80 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0 disabled:opacity-30"
          aria-label={`Previous ${label}`}
        >
          <ChevronLeft className="w-4 h-4 text-black dark:text-white" />
        </button>

        {/* Center Display & Accessible Native Select Dropdown */}
        <div className="relative flex-1 px-2.5 py-1 text-center min-w-0 cursor-pointer">
          <div className="text-xs font-bold text-zinc-900 dark:text-white truncate">
            {currentOption?.label || value}
          </div>
          {currentOption?.desc && (
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
              {currentOption.desc}
            </div>
          )}

          {/* Invisible Overlay Select for Direct Dropdown Choice */}
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

        {/* Right Step Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={handleNext}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-black dark:text-white hover:bg-zinc-200/80 dark:hover:bg-zinc-800 transition cursor-pointer shrink-0 disabled:opacity-30"
          aria-label={`Next ${label}`}
        >
          <ChevronRight className="w-4 h-4 text-black dark:text-white" />
        </button>

        {/* Dropdown Chevron indicator */}
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
}) => {
  const {
    user,
    firebaseUser,
    signInWithGoogle,
    isSigningIn,
    popupBlocked,
    updateStudentProfile,
  } = useAuth();

  const isUserEmailAdmin = Boolean(
    firebaseUser?.email === 'melkamukebede11@gmail.com' ||
    user?.email === 'melkamukebede11@gmail.com'
  );

  // Role state
  const [selectedRole, setSelectedRole] = useState<UserRole>(() => {
    if (isUserEmailAdmin) return 'admin';
    return (user?.role as UserRole) || 'student';
  });

  // Form states
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
    const success = await signInWithGoogle();
    if (success && firebaseUser) {
      if (firebaseUser.displayName && !displayName) {
        setDisplayName(firebaseUser.displayName);
      }
      if (firebaseUser.displayName && !teacherName) {
        setTeacherName(firebaseUser.displayName);
      }
    }
    return success;
  };

  const isGoogleLinked = Boolean(firebaseUser && user?.uid !== 'guest' && !user?.isAnonymous);

  const executeSave = async (profileData: Partial<AppUser>) => {
    setIsSubmitting(true);
    try {
      await updateStudentProfile(profileData);
      localStorage.setItem('has_completed_role_onboarding', 'true');
      // Initialize free coin locally for instant offline usage
      if (user || profileData.displayName) {
        getUserCoins({ uid: user?.uid || 'student', ...profileData } as AppUser);
      }

      setSavedSuccess(true);
      if (onSuccess) {
        onSuccess(profileData);
      }
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, forceLocal = false) => {
    e.preventDefault();

    if (selectedRole === 'student') {
      if (!displayName.trim()) {
        alert('Please enter your full name.');
        return;
      }
      if (!schoolName.trim()) {
        alert('Please enter your school name.');
        return;
      }
    } else if (selectedRole === 'teacher') {
      if (!teacherName.trim()) {
        alert('Please enter your teacher name.');
        return;
      }
      if (!schoolName.trim()) {
        alert('Please enter your school name.');
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

    // If not signed in and not forcing local guest save, prompt sign in first
    if (!isGoogleLinked && !forceLocal) {
      setIsSubmitting(true);
      const signedIn = await handleGoogleConnect();
      if (!signedIn) {
        setIsSubmitting(false);
        return;
      }
    }

    await executeSave(profileData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif]">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg rounded-[28px] bg-white dark:bg-[#0c182b] border border-zinc-200/90 dark:border-white/10 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shrink-0">
              {selectedRole === 'teacher' ? (
                <School className="w-4 h-4 text-black dark:text-white" />
              ) : selectedRole === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-black dark:text-white" />
              ) : (
                <GraduationCap className="w-4 h-4 text-black dark:text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-['Outfit',sans-serif] text-zinc-950 dark:text-white">
                  {selectedRole === 'teacher'
                    ? 'Teacher Registration & Setup'
                    : selectedRole === 'admin'
                    ? 'Administrator Setup'
                    : 'Student Registration & Setup'}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                  {selectedRole}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {selectedRole === 'teacher'
                  ? 'Publish exams for your school students.'
                  : selectedRole === 'admin'
                  ? 'Manage national curriculum repository.'
                  : 'Customize your grade, stream, and practice exams.'}
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

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
          
          {/* ======================================================== */}
          {/* SINGLE PROMINENT GOOGLE SIGN IN CARD                     */}
          {/* ======================================================== */}
          {!isGoogleLinked ? (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/30 dark:border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-black dark:text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5 flex-wrap">
                    <span>First sign in to sync</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/25 text-zinc-900 dark:text-amber-200">
                      Recommended
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <AppCoin size="xs" />
                      <span>1 Free Coin Included</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Sign in with your Google account first to securely sync your exams, and immediately claim your 1 Free Coin for offline exams.
                  </p>
                </div>
              </div>

              {/* ONLY ONE Google Sign-In Button */}
              <button
                type="button"
                disabled={isSigningIn}
                onClick={handleGoogleConnect}
                className="px-4 py-2.5 rounded-full bg-zinc-950 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-98 disabled:opacity-50"
              >
                {isSigningIn ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    <span>Connecting...</span>
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
            </div>
          ) : (
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
                    {(displayName || teacherName || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-950 dark:text-white truncate">
                    {user?.email}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Google Account Connected</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
                Active
              </span>
            </div>
          )}

          {popupBlocked && (
            <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2">
              <span>Google popup was blocked by browser.</span>
              <button
                type="button"
                onClick={() => window.open(window.location.href, '_blank')}
                className="font-bold underline flex items-center gap-1 cursor-pointer"
              >
                Open in tab <ExternalLink className="w-3 h-3 text-black dark:text-white" />
              </button>
            </div>
          )}

          {/* Role Switcher */}
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
                    Practice & tests
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
                    Create & publish
                  </div>
                </div>
              </div>
              {selectedRole === 'teacher' && (
                <CheckCircle2 className="w-3.5 h-3.5 text-white dark:text-zinc-950 shrink-0" />
              )}
            </button>
          </div>

          {/* Teacher Verification Notice */}
          {selectedRole === 'teacher' && (
            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <School className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
              <span>Teacher accounts are reviewed by Admin before full publishing.</span>
            </div>
          )}

          {/* Admin Account Alert */}
          {isUserEmailAdmin && (
            <div className="px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-black dark:text-white" />
                Administrator Account
              </span>
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold cursor-pointer ${
                  selectedRole === 'admin'
                    ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                }`}
              >
                Admin Mode
              </button>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-3.5">
            {selectedRole === 'teacher' ? (
              /* ================= TEACHER FIELDS ================= */
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

                  {/* Region Spinner for Teacher */}
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
              /* ================= STUDENT / ADMIN FIELDS WITH SPINNER FEATURES ================= */
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

                {/* 1. GRADE LEVEL SPINNER FEATURE */}
                <OptionSpinner
                  label="Grade Level"
                  icon={<GraduationCap className="w-3.5 h-3.5 text-black dark:text-white" />}
                  value={grade}
                  options={GRADE_LEVELS}
                  onChange={handleGradeSelect}
                />

                {/* 2. STREAM FOCUS SPINNER FEATURE */}
                <OptionSpinner
                  label="Stream Focus"
                  icon={<Layers className="w-3.5 h-3.5 text-black dark:text-white" />}
                  value={stream}
                  options={STREAM_OPTIONS}
                  onChange={(val) => setStream(val as any)}
                  disabled={grade === '9' || grade === '10'}
                  disabledNote={grade === '9' || grade === '10' ? 'General Core for Grades 9 & 10' : undefined}
                />

                {/* 3. REGION / CITY SPINNER FEATURE & TARGET YEAR SPINNER FEATURE (Starting from 2010 E.C.) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Region Spinner */}
                  <OptionSpinner
                    label="Region / City"
                    icon={<MapPin className="w-3.5 h-3.5 text-black dark:text-white" />}
                    value={region}
                    options={ETHIOPIAN_REGIONS.map((r) => ({ id: r, label: r }))}
                    onChange={setRegion}
                  />

                  {/* Exam Year Spinner */}
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                >
                  Cancel
                </button>

                {!isGoogleLinked && (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:underline px-2 py-1 cursor-pointer"
                  >
                    Continue as Guest
                  </button>
                )}
              </div>

              {/* Single Main Action Button */}
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
                    <span>Saved!</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-white dark:text-zinc-950" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default UserRegistrationModal;
