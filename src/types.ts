export interface Question {
  id: string;
  text: string;
  options: string[];
  correct: number; // 0-3 index
  explanation?: string;
}

export type SubjectType = 'theory' | 'calculation';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface Exam {
  id: string;
  name: string;
  title?: string;
  subject: string;
  topic?: string;
  grade?: number | string; // e.g. 9, 10, 11, 12, 'Freshman', 'National Exam'
  timeLimit: number; // in minutes
  questions: Question[];
  description?: string;
  userId?: string;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Dual-type exam categorization & curated catalog fields
  sourceType?: 'user_created' | 'curated_catalog';
  isDownloaded?: boolean;
  catalogId?: string;
  stream?: string;
  targetExamYear?: string;
  unit?: string;
  curator?: string;
  rating?: number;
  downloadCount?: number;
  // Cloud Database Storage tracking
  isUploadedToCloud?: boolean;
  cloudStorageEngine?: 'firestore' | 'supabase';
  cloudUploadedAt?: string;
  authorEmail?: string;
  adminTag?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  examTable: string;
  questionTable: string;
}

export interface CloudUploadProgress {
  status: 'idle' | 'testing' | 'uploading' | 'success' | 'error';
  engine: 'firestore' | 'supabase';
  progressPercent: number;
  message: string;
  uploadedExamsCount: number;
  uploadedQuestionsCount: number;
  errorDetail?: string;
}

export interface ExamAnswerRecord {
  text: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface ExamResult {
  id?: string | number;
  examId: string;
  examTitle: string;
  date: string;
  score: number; // correct count
  total: number; // total count
  percentage: number;
  timeSpent: number; // in seconds
  answers: ExamAnswerRecord[];
  userId?: string;
}

export interface StudyReminder {
  id: string;
  userId: string;
  time: string; // "HH:MM"
  enabled: boolean;
  days: string[]; // ["Mon", "Tue", ...]
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
  grade?: number | string;
  stream?: 'Natural Science' | 'Social Science' | 'General';
  schoolName?: string;
  region?: string;
  targetExamYear?: string | number;
  phoneNumber?: string;
  isRegistered?: boolean;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

export type SubscriptionDuration = '1day' | '1week' | '1month' | '6months';

export type PaymentMethod = 'chapa' | 'telebirr' | 'cbe' | 'abyssinia';

export type PaymentStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export interface SubscriptionPlan {
  id: SubscriptionDuration;
  name: string;
  durationLabel: string;
  days: number;
  priceETB: number;
  badge?: string;
  popular?: boolean;
  description: string;
}

export interface UserSubscription {
  id?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  planDuration: SubscriptionDuration;
  amountETB: number;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  paymentStatus: PaymentStatus;
  startDate?: string;
  expiresAt?: string;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
}
