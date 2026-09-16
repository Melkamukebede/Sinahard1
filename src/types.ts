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
  difficulty: DifficultyLevel;
  timeLimit: number; // in minutes
  passingScore: number; // e.g. 70 (%)
  subjectType: SubjectType;
  description?: string;
  questions: Question[];
  userId?: string;
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  passingScore: number;
  timeSpent: number; // in seconds
  subjectType?: SubjectType;
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
