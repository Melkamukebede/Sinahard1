import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  User,
  School,
  MapPin,
  Calendar,
  Phone,
  CheckCircle2,
  Check,
  X,
  Sparkles,
  LogIn,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppUser } from '../types';

interface StudentRegistrationModalProps {
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
  { id: '12', label: 'Grade 12', subtitle: 'University Entrance Prep' },
  { id: '11', label: 'Grade 11', subtitle: 'Senior High Curriculum' },
  { id: '10', label: 'Grade 10', subtitle: 'Secondary Curriculum' },
  { id: '9', label: 'Grade 9', subtitle: 'Secondary Curriculum' },
  { id: 'Freshman', label: 'University Freshman', subtitle: 'Higher Education Remedial' },
];

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
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

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [grade, setGrade] = useState(String(user?.grade || '12'));
  const [stream, setStream] = useState<'Natural Science' | 'Social Science' | 'General'>(
    (user?.stream as any) || 'Natural Science'
  );
  const [schoolName, setSchoolName] = useState(user?.schoolName || '');
  const [region, setRegion] = useState(user?.region || 'Addis Ababa');
  const [targetExamYear, setTargetExamYear] = useState(
    String(user?.targetExamYear || '2026 (2018 E.C.)')
  );
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Synchronize when user changes
  useEffect(() => {
    if (user) {
      if (user.displayName && !displayName) setDisplayName(user.displayName);
      if (user.grade) setGrade(String(user.grade));
      if (user.stream) setStream(user.stream);
      if (user.schoolName) setSchoolName(user.schoolName);
      if (user.region) setRegion(user.region);
      if (user.targetExamYear) setTargetExamYear(String(user.targetExamYear));
      if (user.phoneNumber) setPhoneNumber(user.phoneNumber);
    }
  }, [user]);

  // Adjust stream automatically when grade 9-10 is picked
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      alert('Please enter your full student name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const profileData: Partial<AppUser> = {
        displayName: displayName.trim(),
        grade,
        stream,
        schoolName: schoolName.trim(),
        region,
        targetExamYear,
        phoneNumber: phoneNumber.trim(),
        isRegistered: true,
      };

      await updateStudentProfile(profileData);
      setSavedSuccess(true);
      if (onSuccess) {
        onSuccess(profileData);
      }
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isGoogleLinked = Boolean(firebaseUser && user?.uid !== 'guest' && !user?.isAnonymous);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl rounded-[32px] bg-white/95 dark:bg-[#0c182b] border border-white/80 dark:border-white/10 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col backdrop-blur-2xl"
      >
        {/* Header Bar */}
        <div className="px-6 py-4.5 border-b border-zinc-100 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white flex items-center justify-center shadow-2xs border border-white/80 dark:border-white/10">
              <GraduationCap className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                  Student Registration
                </h2>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  Grade Tailored
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Register your grade and academic stream to access tailored official exams
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Google Account Connection Banner */}
          <div className="p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {isGoogleLinked ? (
                <>
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={displayName}
                      className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-bold flex items-center justify-center text-xs">
                      {displayName.charAt(0) || 'S'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-white">
                      <span>{user?.email}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                      Google Account Connected (Cloud Sync Active)
                    </span>
                  </div>
                </>
              ) : (
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    <LogIn className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                    <span>Connect Google Account (Recommended)</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Sync your registered grade, exams, and test scores across all your devices
                  </p>
                </div>
              )}
            </div>

            {!isGoogleLinked && (
              <button
                type="button"
                disabled={isSigningIn}
                onClick={handleGoogleConnect}
                className={`px-4 py-2 rounded-full bg-zinc-950 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 font-semibold text-xs shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-98 ${
                  isSigningIn ? 'opacity-70 cursor-wait' : ''
                }`}
              >
                {isSigningIn ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.24 10.285V13.4h6.887C18.2 16.14 15.645 18 12.24 18c-3.315 0-6-2.685-6-6s2.685-6 6-6c1.53 0 2.925.57 3.99 1.515l2.43-2.43C17.07 3.51 14.775 2.5 12.24 2.5 6.99 2.5 2.74 6.75 2.74 12s4.25 9.5 9.5 9.5c5.49 0 9.15-3.855 9.15-9.33 0-.63-.06-1.245-.18-1.885H12.24z" />
                    </svg>
                    <span>Sign In with Google</span>
                  </>
                )}
              </button>
            )}
          </div>

          {popupBlocked && (
            <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 flex items-center justify-between gap-2">
              <span>Google popup blocked by preview security. You can continue filling registration below.</span>
              <button
                type="button"
                onClick={() => window.open(window.location.href, '_blank')}
                className="font-semibold underline flex items-center gap-1 text-zinc-900 dark:text-white"
              >
                Open in new tab <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>Student Full Name *</span>
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your student full name (e.g. Melkamu Kebede)"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 focus:border-zinc-400 dark:focus:border-zinc-600 transition"
              />
            </div>

            {/* School Level / Grade Selection (CRITICAL) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span>School Level & Grade *</span>
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-normal">
                  Exams will filter to this grade
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GRADE_LEVELS.map((gl) => {
                  const isSelected = grade === gl.id;
                  return (
                    <button
                      key={gl.id}
                      type="button"
                      onClick={() => handleGradeSelect(gl.id)}
                      className={`p-2.5 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                          : 'bg-zinc-50/80 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{gl.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white dark:text-zinc-950" />}
                      </div>
                      <span className={`text-[10px] mt-1 line-clamp-1 ${isSelected ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        {gl.subtitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Academic Stream (Critical Form 1) */}
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>Academic Stream / Focus Track *</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Natural Science', 'Social Science', 'General'] as const).map((s) => {
                  const isSelected = stream === s;
                  const isRecommended =
                    (grade === '12' || grade === '11') && s !== 'General'
                      ? 'Grade 11-12 Track'
                      : grade === '9' || grade === '10'
                      ? 'Grade 9-10 Common'
                      : '';
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStream(s)}
                      className={`p-2.5 rounded-xl text-center border transition cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs font-semibold'
                          : 'bg-zinc-50/80 dark:bg-zinc-900/50 border-zinc-200/80 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 font-medium'
                      }`}
                    >
                      <span className="text-xs block">{s}</span>
                      {isRecommended && (
                        <span className={`text-[9px] block font-normal mt-0.5 ${isSelected ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400 dark:text-zinc-500'}`}>
                          {isRecommended}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* School Name & Region (Critical Form 2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span>School / Academy Name</span>
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="e.g. Bole Secondary, Menelik II"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 focus:border-zinc-400 dark:focus:border-zinc-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span>Administrative Region / City</span>
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 focus:border-zinc-400 dark:focus:border-zinc-600 transition cursor-pointer"
                >
                  {ETHIOPIAN_REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Exam Year & Phone Number (Critical Form 3) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span>Target National Exam Year</span>
                </label>
                <select
                  value={targetExamYear}
                  onChange={(e) => setTargetExamYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 focus:border-zinc-400 dark:focus:border-zinc-600 transition cursor-pointer"
                >
                  <option value="2026 (2018 E.C.)">2026 (2018 E.C.) - Upcoming</option>
                  <option value="2027 (2019 E.C.)">2027 (2019 E.C.)</option>
                  <option value="2028 (2020 E.C.)">2028 (2020 E.C.)</option>
                  <option value="General Practice">General Practice / Re-take</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span>Mobile Phone (Optional for Telebirr / CBE)</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 0911234567"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/15 dark:focus:ring-white/20 focus:border-zinc-400 dark:focus:border-zinc-600 transition"
                />
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-3 flex items-center justify-between gap-3 border-t border-zinc-100 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-black dark:hover:bg-zinc-100 font-semibold text-xs shadow-xs transition cursor-pointer active:scale-98 flex items-center gap-2 ${
                  isSubmitting ? 'opacity-70 cursor-wait' : ''
                }`}
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Profile Saved!</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    <span>Saving Registration...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Save & Filter Grade {grade} Exams</span>
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
