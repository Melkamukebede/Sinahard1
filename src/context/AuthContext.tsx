import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { AppUser } from '../types';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isSigningIn: boolean;
  popupBlocked: boolean;
  signInWithGoogle: () => Promise<boolean>;
  signOut: () => Promise<void>;
  error: string | null;
  clearError: () => void;
  dismissPopupBlocked: () => void;
  setGuestDisplayName: (name: string) => void;
  updateStudentGrade: (grade: number | string, stream?: 'Natural Science' | 'Social Science' | 'General') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_GUEST_NAME_KEY = 'exam_master_guest_name';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AppUser | null>(() => {
    const savedGuestName = localStorage.getItem(LOCAL_GUEST_NAME_KEY);
    if (savedGuestName) {
      return {
        uid: 'guest',
        displayName: savedGuestName,
        isAnonymous: true,
      };
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [popupBlocked, setPopupBlocked] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isSigningInRef = useRef<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        const savedGrade = localStorage.getItem('student_selected_grade') || '12';
        const savedStream = (localStorage.getItem('student_selected_stream') as any) || 'Natural Science';

        const appUser: AppUser = {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || 'Student',
          photoURL: currentUser.photoURL,
          isAnonymous: currentUser.isAnonymous,
          grade: savedGrade,
          stream: savedStream,
          metadata: {
            creationTime: currentUser.metadata.creationTime,
            lastSignInTime: currentUser.metadata.lastSignInTime,
          },
        };
        setUser(appUser);

        // Sync or create user document in Firestore
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              id: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || 'Student',
              photoURL: currentUser.photoURL || '',
              grade: savedGrade,
              stream: savedStream,
              createdAt: new Date().toISOString(),
            });
          } else {
            const data = userSnap.data();
            if (data?.grade) {
              localStorage.setItem('student_selected_grade', String(data.grade));
              if (data.stream) localStorage.setItem('student_selected_stream', data.stream);
              setUser((prev) => (prev ? { ...prev, grade: data.grade, stream: data.stream } : prev));
            }
          }
        } catch (err) {
          console.warn('Could not sync user profile to Firestore:', err);
        }
      } else {
        // Fallback to local guest if saved
        const savedGuestName = localStorage.getItem(LOCAL_GUEST_NAME_KEY);
        if (savedGuestName) {
          setUser({
            uid: 'guest',
            displayName: savedGuestName,
            isAnonymous: true,
          });
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
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

  const updateStudentGrade = async (grade: number | string, stream?: 'Natural Science' | 'Social Science' | 'General') => {
    localStorage.setItem('student_selected_grade', String(grade));
    if (stream) localStorage.setItem('student_selected_stream', stream);
    
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
        signInWithGoogle,
        signOut,
        error,
        clearError,
        dismissPopupBlocked,
        setGuestDisplayName,
        updateStudentGrade,
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
