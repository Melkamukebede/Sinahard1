export interface Question {
  id: string;
  text: string;
  options: string[];
  correct: number; // 0-3 index
  explanation?: string;
}

export type SubjectType = 'theory' | 'calculation';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type ExamCategory = 'official' | 'created';
export type CreatedExamType = 'teacher' | 'student_draft';
export type UserRole = 'student' | 'teacher' | 'admin';

export interface ExamMetadata {
  subject: string;
  grade?: number | string;
  stream?: string;
  topic?: string;
  timeLimit: number;
  targetExamYear?: string;
  description?: string;
  category?: ExamCategory;
  createdType?: CreatedExamType;
  school?: string;
  teacherName?: string;
  examYear?: string;
  curator?: string;
  pushedToCloud?: boolean;
}

export interface Exam {
  id: string;
  name: string;
  title?: string;
  subject: string;
  topic?: string;
  grade?: number | string; // e.g. 9, 10, 11, 12, 'Freshman', 'National Exam'
  timeLimit: number; // in minutes
  metadata?: ExamMetadata;
  questions: Question[];
  questionCount?: number;
  description?: string;
  userId?: string;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Two-tier Exam Repository Categorization:
  // - 'official': Synced from cloud, created by admins (examYear, subject, grade, stream)
  // - 'created':
  //    * 'student_draft': Local offline only, editable, exportable
  //    * 'teacher': Synced to cloud, created by verified teachers (school, teacherName, grade, subject, topic)
  category?: ExamCategory;
  createdType?: CreatedExamType;
  school?: string;
  teacherName?: string;
  examYear?: string;
  // Dual-type exam categorization & curated catalog fields
  sourceType?: 'user_created' | 'curated_catalog' | 'firestore';
  isDownloaded?: boolean;
  catalogId?: string;
  stream?: string;
  targetExamYear?: string;
  curator?: string;
  rating?: number;
  downloadCount?: number;
  // Cloud Database Storage tracking
  isUploadedToCloud?: boolean;
  cloudStorageEngine?: 'firestore';
  cloudUploadedAt?: string;
  authorEmail?: string;
  adminTag?: string;
  cloudId?: string;
  isPushedToCloud?: boolean;
  pushedToCloud?: boolean;
}

export interface CloudUploadProgress {
  status: 'idle' | 'testing' | 'uploading' | 'success' | 'error';
  engine: 'firestore';
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
  subjectType?: string;
}

/**
 * Dedicated practice performance metric decoupled from exams library
 */
export type UserAttempt = ExamResult;

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
  role?: UserRole; // 'student' | 'teacher' | 'admin'
  grade?: number | string;
  stream?: 'Natural Science' | 'Social Science' | 'General';
  schoolName?: string;
  school?: string;
  teacherName?: string;
  teachingSubject?: string;
  isVerifiedTeacher?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  registeredAt?: string;
  isPaid?: boolean;
  region?: string;
  targetExamYear?: string | number;
  phoneNumber?: string;
  isRegistered?: boolean;
  coins?: number;
  metadata?: {
    creationTime?: string;
    lastSignInTime?: string;
  };
}

export type SubscriptionDuration = 'plan_29' | 'plan_49' | 'plan_74' | 'plan_99' | '1day' | '1week' | '1month' | '3months' | '6months' | string;

export type PaymentMethod = 'chapa' | 'telebirr' | 'cbe' | 'abyssinia';

export type PaymentStatus = 'pending' | 'verified' | 'rejected' | 'expired';

export interface SubscriptionPlan {
  id: SubscriptionDuration;
  name: string;
  durationLabel: string;
  days: number;
  priceETB: number;
  coins: number;
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
  coinsAdded?: number;
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
