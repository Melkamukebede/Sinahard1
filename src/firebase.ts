import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);

// Initialize Firestore with robust multi-tab IndexedDB cache and long-polling auto-detection for proxies/firewalls
const firestoreDbId =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined;

export const db = initializeFirestore(
  app,
  {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
    experimentalAutoDetectLongPolling: true,
  },
  firestoreDbId
);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import { setFirebaseReachable } from './services/firebaseOfflineService';

// Test initial connection with graceful offline detection
export async function testConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    setFirebaseReachable(false);
    return false;
  }
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection check timed out')), 2500)
    );
    await Promise.race([getDoc(doc(db, 'exams', '_health_check_')), timeoutPromise]);
    setFirebaseReachable(true);
    return true;
  } catch {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setFirebaseReachable(isOnline);
    return isOnline;
  }
}

// Background idle connection test (non-blocking)
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      testConnection().catch(() => {});
    });
  } else {
    setTimeout(() => {
      testConnection().catch(() => {});
    }, 1500);
  }
}

// Re-export Offline & Free/Guest Enforcement Utilities in Firebase Logic
export {
  isAppOffline,
  subscribeToNetworkState,
  enforceOfflineExamCreation,
  enforceOfflineExamPractice,
  enforceOfflineQuestionImport,
  OFFLINE_FREE_GUEST_LIMITS,
  setFirebaseReachable,
} from './services/firebaseOfflineService';
export type {
  OfflineCreationValidationResult,
  OfflinePracticeValidationResult,
} from './services/firebaseOfflineService';

