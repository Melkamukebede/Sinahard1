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
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppUser, UserRole } from '../types';

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
  { id: '12', label: 'Grade 12' },
  { id: '11', label: 'Grade 11' },
  { id: '10', label: 'Grade 10' },
  { id: '9', label: 'Grade 9' },
  { id: 'Freshman', label: 'Freshman' },
  { id: 'Senior University', label: 'University' },
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
  const [targetExamYear, setTargetExamYear] = useState(
    String(user?.targetExamYear || '2026 (2018 E.C.)')
  );
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
      if (user.targetExamYear) setTargetExamYear(String(user.targetExamYear));
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

    // If not signed in and not forcing local guest save, sign in first before saving
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
        className="relative w-full max-w-xl rounded-[28px] bg-white dark:bg-[#0c182b] border border-zinc-200/90 dark:border-white/10 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header - Crisp, clean, uncluttered */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-white/10 bg-zinc-50/70 dark:bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shrink-0">
              {selectedRole === 'teacher' ? (
                <School className="w-5 h-5 text-black dark:text-white" />
              ) : selectedRole === 'admin' ? (
                <ShieldCheck className="w-5 h-5 text-black dark:text-white" />
              ) : (
                <GraduationCap className="w-5 h-5 text-black dark:text-white" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-['Outfit',sans-serif] text-zinc-950 dark:text-white">
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
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {selectedRole === 'teacher'
                  ? 'Publish exams for your school students.'
                  : selectedRole === 'admin'
                  ? 'Manage national curriculum repository.'
                  : 'Tailored exams and school curriculum.'}
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
        <div className="overflow-y-auto p-6 space-y-5">
          {/* ======================================================== */}
          {/* 1. TOP SIGN-IN BUTTON & STATUS (PROMINENT AT TOP)         */}
          {/* ======================================================== */}
          {!isGoogleLinked ? (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="min-w-0">
                <div className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                  <LogIn className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
                  <span>Sign In with Google</span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Connect your account to save your profile and sync progress across devices
                </p>
              </div>
              <button
                type="button"
                disabled={isSigningIn}
                onClick={handleGoogleConnect}
                className="px-4 py-2.5 rounded-full bg-zinc-950 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-98 disabled:opacity-50"
              >
                {isSigningIn ? (
                  <span>Connecting...</span>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.24 10.285V13.4h6.887C18.2 16.14 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.53 0 2.925.57 3.99 1.515l2.43-2.43C17.07 3.51 14.775 2.5 12.24 2.5 6.99 2.5 2.74 6.75 2.74 12s4.25 9.5 9.5 9.5c5.49 0 9.15-3.855 9.15-9.33 0-.63-.06-1.245-.18-1.885H12.24z" />
                    </svg>
                    <span>Sign In with Google</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/90 dark:border-zinc-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={displayName || teacherName || user.email || 'User'}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                    {(displayName || teacherName || user?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-950 dark:text-white truncate">
                    {user?.email}
                  </div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Signed in with Google</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 shrink-0">
                Account Linked
              </span>
            </div>
          )}

          {popupBlocked && (
            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 flex items-center justify-between gap-2">
              <span>Google popup was blocked by browser.</span>
              <button
                type="button"
                onClick={() => window.open(window.location.href, '_blank')}
                className="font-bold underline flex items-center gap-1 text-black dark:text-white cursor-pointer"
              >
                Open in tab <ExternalLink className="w-3 h-3 text-black dark:text-white" />
              </button>
            </div>
          )}

          {/* Role Switcher - Compact & Clear */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`p-3.5 rounded-2xl text-left border transition cursor-pointer flex items-center justify-between ${
                selectedRole === 'student'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                  : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap
                  className={`w-4 h-4 ${
                    selectedRole === 'student'
                      ? 'text-white dark:text-zinc-950'
                      : 'text-black dark:text-white'
                  }`}
                />
                <div>
                  <div className="font-bold text-xs sm:text-sm">Student</div>
                  <div className={`text-[11px] ${selectedRole === 'student' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    Practice & tests
                  </div>
                </div>
              </div>
              {selectedRole === 'student' && (
                <CheckCircle2 className="w-4 h-4 text-white dark:text-zinc-950 shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('teacher')}
              className={`p-3.5 rounded-2xl text-left border transition cursor-pointer flex items-center justify-between ${
                selectedRole === 'teacher'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                  : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <School
                  className={`w-4 h-4 ${
                    selectedRole === 'teacher'
                      ? 'text-white dark:text-zinc-950'
                      : 'text-black dark:text-white'
                  }`}
                />
                <div>
                  <div className="font-bold text-xs sm:text-sm">Teacher</div>
                  <div className={`text-[11px] ${selectedRole === 'teacher' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    Create & publish
                  </div>
                </div>
              </div>
              {selectedRole === 'teacher' && (
                <CheckCircle2 className="w-4 h-4 text-white dark:text-zinc-950 shrink-0" />
              )}
            </button>
          </div>

          {/* Teacher Verification Notice */}
          {selectedRole === 'teacher' && (
            <div className="px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <School className="w-3.5 h-3.5 text-black dark:text-white shrink-0" />
              <span>Teacher accounts are reviewed by Admin in the Check Panel. You can create exams and push directly to Firebase for your school.</span>
            </div>
          )}

          {/* Admin Account Alert (compact) */}
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

          {/* Form Fields */}
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
            {selectedRole === 'teacher' ? (
              /* ================= TEACHER FIELDS ================= */
              <div className="space-y-3.5">
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

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-black dark:text-white" />
                      <span>Region / City</span>
                    </label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 transition cursor-pointer"
                    >
                      {ETHIOPIAN_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              /* ================= STUDENT / ADMIN FIELDS ================= */
              <div className="space-y-4">
                {/* Full Name & School */}
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

                {/* Grade Selection */}
                <div>
                  <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1.5 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>Grade Level *</span>
                  </label>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {GRADE_LEVELS.map((gl) => {
                      const isSelected = grade === gl.id;
                      return (
                        <button
                          key={gl.id}
                          type="button"
                          onClick={() => handleGradeSelect(gl.id)}
                          className={`py-2 px-2 rounded-xl text-center border transition cursor-pointer ${
                            isSelected
                              ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs font-bold'
                              : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 font-medium'
                          }`}
                        >
                          <span className="text-xs truncate block">{gl.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Academic Stream (for Grade 11, 12, and University) */}
                {grade !== '9' && grade !== '10' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-black dark:text-white" />
                      <span>Stream Focus *</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Natural Science', 'Social Science', 'General'] as const).map((s) => {
                        const isSelected = stream === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setStream(s)}
                            className={`py-2 px-2 rounded-xl text-center border transition cursor-pointer ${
                              isSelected
                                ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs font-bold'
                                : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-zinc-400 font-medium'
                            }`}
                          >
                            <span className="text-xs truncate block">{s}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Region & Exam Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-black dark:text-white" />
                      <span>Region / City</span>
                    </label>
                    <select
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 transition cursor-pointer"
                    >
                      {ETHIOPIAN_REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-black dark:text-white" />
                      <span>Target Exam Year</span>
                    </label>
                    <select
                      value={targetExamYear}
                      onChange={(e) => setTargetExamYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 transition cursor-pointer"
                    >
                      <option value="2026 (2018 E.C.)">2026 (2018 E.C.) - Upcoming</option>
                      <option value="2027 (2019 E.C.)">2027 (2019 E.C.)</option>
                      <option value="2028 (2020 E.C.)">2028 (2020 E.C.)</option>
                      <option value="General Practice">General Practice</option>
                    </select>
                  </div>
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

            {/* ======================================================== */}
            {/* 2. SIGN IN BEFORE SAVE (RIGHT BEFORE ACTION BUTTON)       */}
            {/* ======================================================== */}
            {!isGoogleLinked ? (
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>Sign in before saving</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Sign in with Google to securely save your registration to the cloud
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSigningIn}
                  onClick={handleGoogleConnect}
                  className="px-4 py-2 rounded-full bg-zinc-950 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-98 disabled:opacity-50"
                >
                  {isSigningIn ? (
                    <span>Connecting...</span>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12.24 10.285V13.4h6.887C18.2 16.14 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.53 0 2.925.57 3.99 1.515l2.43-2.43C17.07 3.51 14.775 2.5 12.24 2.5 6.99 2.5 2.74 6.75 2.74 12s4.25 9.5 9.5 9.5c5.49 0 9.15-3.855 9.15-9.33 0-.63-.06-1.245-.18-1.885H12.24z" />
                      </svg>
                      <span>Sign In with Google</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/80 dark:border-zinc-800 flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Ready to save to Google account: <strong className="text-zinc-900 dark:text-white">{user?.email}</strong></span>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-3 flex items-center justify-between gap-3 border-t border-zinc-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                >
                  Cancel
                </button>

                {!isGoogleLinked && (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    className="text-[11px] text-zinc-500 dark:text-zinc-400 hover:underline px-2 py-1 cursor-pointer"
                  >
                    Save locally without Google
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-7 py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-zinc-100 font-bold text-xs shadow-xs transition cursor-pointer active:scale-98 flex items-center gap-2 ${
                  isSubmitting ? 'opacity-70 cursor-wait' : ''
                }`}
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white dark:text-zinc-950" />
                    <span>Saved!</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : !isGoogleLinked ? (
                  <>
                    <LogIn className="w-3.5 h-3.5 text-white dark:text-zinc-950" />
                    <span>Sign In & Save</span>
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
