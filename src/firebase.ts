import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);

// Support both standard (default) Firestore and named databases
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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

// Test initial connection as required by firebase skill
export async function testConnection(): Promise<boolean> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Connection check timed out')), 3000)
    );
    await Promise.race([getDocFromServer(doc(db, 'test', 'connection')), timeoutPromise]);
    setFirebaseReachable(true);
    return true;
  } catch (error) {
    setFirebaseReachable(false);
    if (error instanceof Error) {
      if (error.message.includes('the client is offline') || error.message.includes('timed out') || error.message.includes('Backend didn\'t respond')) {
        console.info('Firebase offline cache mode active.');
        return false;
      }
    }
    return false;
  }
}
testConnection().catch(() => {});

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

