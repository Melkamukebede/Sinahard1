import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isSigningIn: boolean;
  popupBlocked: boolean;
  isRegistrationModalOpen: boolean;
  openRegistrationModal: () => void;
  closeRegistrationModal: () => void;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  dismissPopupBlocked: () => void;
  setGuestDisplayName: (name: string) => void;
  updateStudentGrade: (grade: number | string, stream?: 'Natural Science' | 'Social Science' | 'General') => Promise<void>;
  updateStudentProfile: (profile: Partial<AppUser>) => Promise<void>;
  refreshUserProfile: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_GUEST_NAME_KEY = 'exam_master_guest_name';
const LOCAL_STUDENT_GRADE_KEY = 'student_selected_grade';
const LOCAL_STUDENT_STREAM_KEY = 'student_selected_stream';
const LOCAL_STUDENT_SCHOOL_KEY = 'student_school_name';
const LOCAL_STUDENT_REGION_KEY = 'student_region';
const LOCAL_STUDENT_TARGET_YEAR_KEY = 'student_target_year';
const LOCAL_STUDENT_PHONE_KEY = 'student_phone';
const LOCAL_STUDENT_IS_REGISTERED_KEY = 'student_is_registered';
const LOCAL_USER_ROLE_KEY = 'user_account_role';
const LOCAL_TEACHER_NAME_KEY = 'teacher_display_name';
const LOCAL_TEACHER_IS_VERIFIED_KEY = 'teacher_is_verified';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(() => {
    const savedGuestName = localStorage.getItem(LOCAL_GUEST_NAME_KEY);
    const savedGrade = localStorage.getItem(LOCAL_STUDENT_GRADE_KEY) || '12';
    const savedStream = (localStorage.getItem(LOCAL_STUDENT_STREAM_KEY) as any) || 'Natural Science';
    const savedSchool = localStorage.getItem(LOCAL_STUDENT_SCHOOL_KEY) || '';
    const savedRegion = localStorage.getItem(LOCAL_STUDENT_REGION_KEY) || '';
    const savedTargetYear = localStorage.getItem(LOCAL_STUDENT_TARGET_YEAR_KEY) || '';
    const savedPhone = localStorage.getItem(LOCAL_STUDENT_PHONE_KEY) || '';
    const isRegistered = localStorage.getItem(LOCAL_STUDENT_IS_REGISTERED_KEY) === 'true';
    const savedRole = (localStorage.getItem(LOCAL_USER_ROLE_KEY) as any) || 'student';
    const savedTeacherName = localStorage.getItem(LOCAL_TEACHER_NAME_KEY) || '';
    const savedIsVerifiedTeacher = localStorage.getItem(LOCAL_TEACHER_IS_VERIFIED_KEY) === 'true';

    if (savedGuestName) {
      return {
        uid: 'guest',
        displayName: savedGuestName,
        email: null,
        photoURL: null,
        isAnonymous: true,
        role: savedRole,
        grade: savedGrade,
        stream: savedStream,
        schoolName: savedSchool,
        school: savedSchool,
        teacherName: savedTeacherName,
        isVerifiedTeacher: savedRole === 'teacher' ? savedIsVerifiedTeacher : (savedRole === 'admin'),
        region: savedRegion,
        targetExamYear: savedTargetYear,
        phoneNumber: savedPhone,
        isRegistered,
      };
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [popupBlocked, setPopupBlocked] = useState<boolean>(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState<boolean>(() => {
    const hasRegistered = localStorage.getItem(LOCAL_STUDENT_IS_REGISTERED_KEY) === 'true';
    const hasOnboarded = localStorage.getItem('has_completed_role_onboarding') === 'true';
    return !hasRegistered && !hasOnboarded;
  });
  const [error, setError] = useState<string | null>(null);

  const isSigningInRef = useRef<boolean>(false);
  const unsubUserRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        const savedGrade = localStorage.getItem(LOCAL_STUDENT_GRADE_KEY) || '12';
        const savedStream = (localStorage.getItem(LOCAL_STUDENT_STREAM_KEY) as any) || 'Natural Science';
        const savedSchool = localStorage.getItem(LOCAL_STUDENT_SCHOOL_KEY) || '';
        const savedRegion = localStorage.getItem(LOCAL_STUDENT_REGION_KEY) || '';
        const savedTargetYear = localStorage.getItem(LOCAL_STUDENT_TARGET_YEAR_KEY) || '2026 (2018 E.C.)';
        const savedPhone = localStorage.getItem(LOCAL_STUDENT_PHONE_KEY) || '';
        const localRegistered = localStorage.getItem(LOCAL_STUDENT_IS_REGISTERED_KEY) === 'true';
        const savedRole = (localStorage.getItem(LOCAL_USER_ROLE_KEY) as any) || (currentUser.email === 'melkamukebede11@gmail.com' ? 'admin' : 'student');
        const savedTeacherName = localStorage.getItem(LOCAL_TEACHER_NAME_KEY) || '';
        const savedIsVerifiedTeacher = localStorage.getItem(LOCAL_TEACHER_IS_VERIFIED_KEY) === 'true';
        const isEmailAdmin = currentUser.email?.toLowerCase().trim() === 'melkamukebede11@gmail.com';
        const initialRole = isEmailAdmin ? 'admin' : savedRole;

        let appUser: AppUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || (initialRole === 'teacher' ? 'Teacher' : 'Student'),
          photoURL: currentUser.photoURL,
          isAnonymous: currentUser.isAnonymous,
          role: initialRole,
          grade: savedGrade,
          stream: savedStream,
          schoolName: savedSchool,
          school: savedSchool,
          teacherName: savedTeacherName,
          region: savedRegion,
          targetExamYear: savedTargetYear,
          phoneNumber: savedPhone,
          isRegistered: localRegistered,
          isVerifiedTeacher: (isEmailAdmin || initialRole === 'admin') ? true : savedIsVerifiedTeacher,
          metadata: {
            creationTime: currentUser.metadata.creationTime,
            lastSignInTime: currentUser.metadata.lastSignInTime,
          },
        };
        setUser(appUser);

        // Sync or retrieve user document from Firestore
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              id: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || (initialRole === 'teacher' ? 'Teacher' : 'Student'),
              photoURL: currentUser.photoURL || '',
              role: initialRole,
              grade: savedGrade,
              stream: savedStream,
              schoolName: savedSchool,
              school: savedSchool,
              teacherName: savedTeacherName,
              region: savedRegion,
              targetExamYear: savedTargetYear,
              phoneNumber: savedPhone,
              isRegistered: localRegistered,
              isVerifiedTeacher: (isEmailAdmin || initialRole === 'admin') ? true : savedIsVerifiedTeacher,
              createdAt: new Date().toISOString(),
            });
            // If new user and not yet fully registered, open registration modal
            if (!localRegistered) {
              setIsRegistrationModalOpen(true);
            }
          } else {
            const data = userSnap.data();
            const resolvedRole = isEmailAdmin 
              ? 'admin' 
              : (data?.role || savedRole || 'student');
            const resolvedGrade = data?.grade || savedGrade;
            const resolvedStream = data?.stream || savedStream;
            const resolvedSchool = data?.school || data?.schoolName || savedSchool;
            const resolvedTeacherName = data?.teacherName || savedTeacherName;
            const resolvedRegion = data?.region || savedRegion;
            const resolvedTargetYear = data?.targetExamYear || savedTargetYear;
            const resolvedPhone = data?.phoneNumber || savedPhone;
            const resolvedIsRegistered = Boolean(data?.isRegistered || localRegistered);

            localStorage.setItem(LOCAL_USER_ROLE_KEY, resolvedRole);
            localStorage.setItem(LOCAL_STUDENT_GRADE_KEY, String(resolvedGrade));
            localStorage.setItem(LOCAL_STUDENT_STREAM_KEY, resolvedStream);
            if (resolvedSchool) {
              localStorage.setItem(LOCAL_STUDENT_SCHOOL_KEY, resolvedSchool);
            }
            if (resolvedTeacherName) {
              localStorage.setItem(LOCAL_TEACHER_NAME_KEY, resolvedTeacherName);
            }
            if (resolvedRegion) localStorage.setItem(LOCAL_STUDENT_REGION_KEY, resolvedRegion);
            if (resolvedTargetYear) localStorage.setItem(LOCAL_STUDENT_TARGET_YEAR_KEY, String(resolvedTargetYear));
            if (resolvedPhone) localStorage.setItem(LOCAL_STUDENT_PHONE_KEY, resolvedPhone);
            if (resolvedIsRegistered) localStorage.setItem(LOCAL_STUDENT_IS_REGISTERED_KEY, 'true');

            const isVerifiedTeacher = (isEmailAdmin || resolvedRole === 'admin')
              ? true
              : Boolean(
                  data?.isVerifiedTeacher === true ||
                  data?.isVerifiedTeacher === 'true' ||
                  data?.status === 'verified' ||
                  data?.isVerified === true ||
                  data?.verified === true
                );

            localStorage.setItem(LOCAL_TEACHER_IS_VERIFIED_KEY, String(isVerifiedTeacher));

            appUser = {
              ...appUser,
              displayName: data?.displayName || currentUser.displayName || (resolvedRole === 'teacher' ? 'Teacher' : 'Student'),
              role: resolvedRole,
              grade: resolvedGrade,
              stream: resolvedStream,
              schoolName: resolvedSchool,
              school: resolvedSchool,
              teacherName: resolvedTeacherName,
              teachingSubject: data?.teachingSubject || undefined,
              isVerifiedTeacher,
              isPaid: Boolean(data?.isPaid),
              region: resolvedRegion,
              targetExamYear: resolvedTargetYear,
              phoneNumber: resolvedPhone,
              isRegistered: resolvedIsRegistered,
            };
            setUser(appUser);

            // If user has not completed registration, show registration prompt
            if (!resolvedIsRegistered) {
              setIsRegistrationModalOpen(true);
            }
          }
        } catch (err) {
          console.warn('Could not sync user profile to Firestore:', err);
        }

        // Setup real-time listener for current user's profile updates (e.g. admin verification)
        const userRef = doc(db, 'users', currentUser.uid);
        if (unsubUserRef.current) {
          unsubUserRef.current();
        }
        unsubUserRef.current = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const liveData = docSnap.data();
              const isAdminEmail = currentUser.email?.toLowerCase().trim() === 'melkamukebede11@gmail.com';
              const liveRole = isAdminEmail ? 'admin' : (liveData.role || 'student');
              const liveVerified = (isAdminEmail || liveRole === 'admin')
                ? true
                : Boolean(
                    liveData.isVerifiedTeacher === true ||
                    liveData.isVerifiedTeacher === 'true' ||
                    liveData.status === 'verified' ||
                    liveData.isVerified === true ||
                    liveData.verified === true
                  );

              localStorage.setItem(LOCAL_TEACHER_IS_VERIFIED_KEY, String(liveVerified));

              setUser((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  displayName: liveData.displayName || prev.displayName,
                  role: liveRole,
                  grade: liveData.grade || prev.grade,
                  stream: liveData.stream || prev.stream,
                  schoolName: liveData.school || liveData.schoolName || prev.schoolName,
                  school: liveData.school || liveData.schoolName || prev.school,
                  teacherName: liveData.teacherName || prev.teacherName,
                  teachingSubject: liveData.teachingSubject || prev.teachingSubject,
                  isVerifiedTeacher: liveVerified,
                  isPaid: Boolean(liveData.isPaid ?? prev.isPaid),
                  isRegistered: Boolean(liveData.isRegistered ?? prev.isRegistered),
                };
              });
            }
          },
          (err) => {
            console.warn('Real-time user profile sync error:', err);
          }
        );
      } else {
        if (unsubUserRef.current) {
          unsubUserRef.current();
          unsubUserRef.current = null;
        }
        // Fallback to local guest if saved
        const savedGuestName = localStorage.getItem(LOCAL_GUEST_NAME_KEY);
        if (savedGuestName) {
          setUser({
            uid: 'guest',
            displayName: savedGuestName,
            email: null,
            photoURL: null,
            isAnonymous: true,
            grade: localStorage.getItem(LOCAL_STUDENT_GRADE_KEY) || '12',
            stream: (localStorage.getItem(LOCAL_STUDENT_STREAM_KEY) as any) || 'Natural Science',
            schoolName: localStorage.getItem(LOCAL_STUDENT_SCHOOL_KEY) || '',
            region: localStorage.getItem(LOCAL_STUDENT_REGION_KEY) || '',
            targetExamYear: localStorage.getItem(LOCAL_STUDENT_TARGET_YEAR_KEY) || '',
            phoneNumber: localStorage.getItem(LOCAL_STUDENT_PHONE_KEY) || '',
            isRegistered: localStorage.getItem(LOCAL_STUDENT_IS_REGISTERED_KEY) === 'true',
          });
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubUserRef.current) {
        unsubUserRef.current();
        unsubUserRef.current = null;
      }
    };
  }, []);

  const signInWithGoogle = async (): Promise<boolean> => {
    if (isSigningInRef.current) {
      console.warn('Sign-in already in progress, ignoring duplicate trigger.');
      return false;
    }

    isSigningInRef.current = true;
    setIsSigningIn(true);
    setError(null);
    setPopupBlocked(false);

    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      const msg = err instanceof Error ? err.message : String(err);

      if (code === 'auth/popup-blocked') {
        console.warn('Popup was blocked by browser/iframe restrictions.');
        setPopupBlocked(true);
        setError('The sign-in popup was blocked. You can open the app in a new tab or continue as a guest.');
      } else if (code === 'auth/cancelled-popup-request') {
        console.warn('Popup request was cancelled or replaced by another action.');
      } else if (code === 'auth/popup-closed-by-user') {
        console.info('User closed the sign-in window.');
      } else if (code === 'auth/unauthorized-domain') {
        const currentHost = window.location.hostname;
        console.error(`Firebase Auth Error: Domain "${currentHost}" is not authorized.`);
        setError(`This domain (${currentHost}) is not authorized in your Firebase project. Please add "${currentHost}" in Firebase Console → Authentication → Settings → Authorized domains.`);
      } else if (msg.includes('INTERNAL ASSERTION FAILED')) {
        console.warn('Handled internal Firebase Auth assertion gracefully.');
        setPopupBlocked(true);
      } else {
        console.error('Google Sign-In Error:', err);
        setError(msg || 'Sign-in failed. Please try again.');
      }
      return false;
    } finally {
      isSigningInRef.current = false;
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await fbSignOut(auth);
      localStorage.removeItem(LOCAL_GUEST_NAME_KEY);
      localStorage.removeItem(LOCAL_TEACHER_IS_VERIFIED_KEY);
      setUser(null);
    } catch (err: unknown) {
      console.error('Sign-Out Error:', err);
      setError('Sign-out failed.');
    }
  };

  const setGuestDisplayName = (name: string) => {
    const trimmed = name.trim() || 'Student';
    localStorage.setItem(LOCAL_GUEST_NAME_KEY, trimmed);
    setUser({
      uid: 'guest',
      displayName: trimmed,
      isAnonymous: true,
      grade: localStorage.getItem('student_selected_grade') || '12',
      stream: (localStorage.getItem('student_selected_stream') as any) || 'Natural Science',
    });
  };

  const openRegistrationModal = () => setIsRegistrationModalOpen(true);
  const closeRegistrationModal = () => setIsRegistrationModalOpen(false);

  const updateStudentProfile = async (profileData: Partial<AppUser>) => {
    // 1. Local Storage persistence
    if (profileData.role) localStorage.setItem(LOCAL_USER_ROLE_KEY, profileData.role);
    if (profileData.displayName) localStorage.setItem(LOCAL_GUEST_NAME_KEY, profileData.displayName);
    if (profileData.grade) localStorage.setItem(LOCAL_STUDENT_GRADE_KEY, String(profileData.grade));
    if (profileData.stream) localStorage.setItem(LOCAL_STUDENT_STREAM_KEY, profileData.stream);
    const resolvedSchool = profileData.school || profileData.schoolName;
    if (resolvedSchool) localStorage.setItem(LOCAL_STUDENT_SCHOOL_KEY, resolvedSchool);
    if (profileData.teacherName) localStorage.setItem(LOCAL_TEACHER_NAME_KEY, profileData.teacherName);
    if (profileData.region) localStorage.setItem(LOCAL_STUDENT_REGION_KEY, profileData.region);
    if (profileData.targetExamYear) localStorage.setItem(LOCAL_STUDENT_TARGET_YEAR_KEY, String(profileData.targetExamYear));
    if (profileData.phoneNumber) localStorage.setItem(LOCAL_STUDENT_PHONE_KEY, profileData.phoneNumber);
    localStorage.setItem(LOCAL_STUDENT_IS_REGISTERED_KEY, 'true');

    // 2. State update
    setUser((prev) => {
      const isUserAdmin = (prev?.email === 'melkamukebede11@gmail.com') || (profileData.email === 'melkamukebede11@gmail.com');
      const finalRole = isUserAdmin ? 'admin' : (profileData.role ?? prev?.role ?? 'student');
      const updated: AppUser = {
        uid: prev?.uid || 'guest',
        email: prev?.email || null,
        displayName: profileData.displayName ?? prev?.displayName ?? (finalRole === 'teacher' ? 'Teacher' : 'Student'),
        photoURL: prev?.photoURL || null,
        isAnonymous: prev?.isAnonymous ?? true,
        role: finalRole,
        grade: profileData.grade ?? prev?.grade ?? '12',
        stream: profileData.stream ?? prev?.stream ?? 'Natural Science',
        schoolName: resolvedSchool ?? prev?.schoolName ?? prev?.school,
        school: resolvedSchool ?? prev?.school ?? prev?.schoolName,
        teacherName: profileData.teacherName ?? prev?.teacherName,
        teachingSubject: profileData.teachingSubject ?? prev?.teachingSubject,
        isVerifiedTeacher: isUserAdmin ? true : Boolean(profileData.isVerifiedTeacher ?? prev?.isVerifiedTeacher ?? false),
        isPaid: profileData.isPaid ?? prev?.isPaid,
        region: profileData.region ?? prev?.region,
        targetExamYear: profileData.targetExamYear ?? prev?.targetExamYear,
        phoneNumber: profileData.phoneNumber ?? prev?.phoneNumber,
        isRegistered: true,
        metadata: prev?.metadata,
      };
      return updated;
    });

    // 3. Firestore persistence if authenticated
    if (firebaseUser) {
      try {
        const isEmailAdmin = firebaseUser.email?.toLowerCase().trim() === 'melkamukebede11@gmail.com';
        const isVerified = isEmailAdmin ? true : Boolean(profileData.isVerifiedTeacher ?? user?.isVerifiedTeacher ?? false);
        localStorage.setItem(LOCAL_TEACHER_IS_VERIFIED_KEY, String(isVerified));

        const userRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(
          userRef,
          {
            ...profileData,
            ...(resolvedSchool ? { school: resolvedSchool, schoolName: resolvedSchool } : {}),
            isVerifiedTeacher: isVerified,
            isRegistered: true,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Failed to update student profile in Firestore:', err);
      }
    }
  };

  const refreshUserProfile = async (): Promise<boolean> => {
    if (!firebaseUser) return false;
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        const isAdminEmail = firebaseUser.email?.toLowerCase().trim() === 'melkamukebede11@gmail.com';
        const liveRole = isAdminEmail ? 'admin' : (data.role || 'student');
        const liveVerified = (isAdminEmail || liveRole === 'admin')
          ? true
          : Boolean(
              data.isVerifiedTeacher === true ||
              data.isVerifiedTeacher === 'true' ||
              data.status === 'verified' ||
              data.isVerified === true ||
              data.verified === true
            );

        localStorage.setItem(LOCAL_TEACHER_IS_VERIFIED_KEY, String(liveVerified));

        setUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            displayName: data.displayName || prev.displayName,
            role: liveRole,
            grade: data.grade || prev.grade,
            stream: data.stream || prev.stream,
            schoolName: data.school || data.schoolName || prev.schoolName,
            school: data.school || data.schoolName || prev.school,
            teacherName: data.teacherName || prev.teacherName,
            teachingSubject: data.teachingSubject || prev.teachingSubject,
            isVerifiedTeacher: liveVerified,
            isPaid: Boolean(data.isPaid ?? prev.isPaid),
            isRegistered: Boolean(data.isRegistered ?? prev.isRegistered),
          };
        });
        return liveVerified;
      }
    } catch (err) {
      console.warn('Failed to refresh user profile from Firestore:', err);
    }
    return false;
  };

  const updateStudentGrade = async (grade: number | string, stream?: 'Natural Science' | 'Social Science' | 'General') => {
    localStorage.setItem(LOCAL_STUDENT_GRADE_KEY, String(grade));
    if (stream) localStorage.setItem(LOCAL_STUDENT_STREAM_KEY, stream);
    
    setUser((prev) => (prev ? { ...prev, grade, ...(stream ? { stream } : {}) } : prev));

    if (firebaseUser) {
      try {
        const userRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userRef, { grade, ...(stream ? { stream } : {}) }, { merge: true });
      } catch (err) {
        console.warn('Failed to update student grade in Firestore:', err);
      }
    }
  };

  const clearError = () => setError(null);
  const dismissPopupBlocked = () => setPopupBlocked(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isSigningIn,
        popupBlocked,
        isRegistrationModalOpen,
        openRegistrationModal,
        closeRegistrationModal,
        signInWithGoogle,
        signOut,
        error,
        clearError,
        dismissPopupBlocked,
        setGuestDisplayName,
        updateStudentGrade,
        updateStudentProfile,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
