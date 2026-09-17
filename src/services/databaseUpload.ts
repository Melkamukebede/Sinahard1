import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Exam, Question, AppUser } from '../types';
import { getLocalExams, saveLocalExams, ADMIN_EMAIL, isUserAdmin } from './db';

export interface FirestoreUploadOptions {
  uploadIndividualQuestions?: boolean;
  isPublic?: boolean;
  adminTag?: string;
  onProgress?: (progressPercent: number, status: string) => void;
}

export interface FirestoreUploadResult {
  success: boolean;
  examId: string;
  questionsCount: number;
  message: string;
}

/**
 * Validates whether current user has verified administrator privileges.
 */
export function canUserUploadToFirestore(user: AppUser | null): boolean {
  if (!user) return false;
  if (user.isAnonymous || user.uid === 'guest') return false;
  return isUserAdmin(user);
}

/**
 * Upload an Exam and its questions into Firebase Cloud Firestore collections:
 *  - `/exams/{examId}`
 *  - `/questions/{questionId}`
 *
 * Strictly restricted to verified administrator (melkamukebede11@gmail.com).
 */
export async function uploadExamToFirestore(
  exam: Exam,
  user: AppUser | null,
  options: FirestoreUploadOptions = {}
): Promise<FirestoreUploadResult> {
  const {
    uploadIndividualQuestions = true,
    isPublic = true,
    adminTag = 'Official Curriculum Exam',
    onProgress,
  } = options;

  if (!canUserUploadToFirestore(user)) {
    throw new Error(
      'Access Denied: You must be logged in as administrator (melkamukebede11@gmail.com) to upload questions to Cloud Firestore.'
    );
  }

  const examId = exam.id || 'exam_' + Date.now();
  const authorEmail = user?.email || ADMIN_EMAIL;
  const authorId = user?.uid || 'admin_user';

  onProgress?.(15, 'Preparing exam document payload...');

  const firestoreExamPayload: Partial<Exam> & Record<string, unknown> = {
    ...exam,
    id: examId,
    name: exam.name.trim(),
    title: exam.title || exam.name.trim(),
    subject: (exam.subject || 'General').trim(),
    difficulty: exam.difficulty || 'Medium',
    timeLimit: Number(exam.timeLimit) || 20,
    passingScore: Number(exam.passingScore) || 70,
    subjectType: exam.subjectType || 'theory',
    description: (exam.description || '').trim(),
    isPublic,
    userId: authorId,
    authorId,
    authorEmail,
    adminTag,
    isUploadedToCloud: true,
    cloudStorageEngine: 'firestore',
    cloudUploadedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    // 1. Upload main exam document to Firestore
    onProgress?.(30, 'Saving exam to Firestore /exams collection...');
    const examDocRef = doc(db, 'exams', examId);
    await setDoc(examDocRef, firestoreExamPayload);

    // 2. Batch-upload individual questions into /questions for question bank search & modular access
    let uploadedCount = exam.questions.length;
    if (uploadIndividualQuestions && exam.questions.length > 0) {
      onProgress?.(50, `Uploading ${exam.questions.length} questions in Firestore batches...`);
      
      // Firestore batch limit is 500 ops per batch. We chunk in safe sizes of 400.
      const CHUNK_SIZE = 400;
      for (let i = 0; i < exam.questions.length; i += CHUNK_SIZE) {
        const chunk = exam.questions.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(db);

        chunk.forEach((q, chunkIdx) => {
          const globalIdx = i + chunkIdx;
          const qId = q.id || `q_${examId}_${globalIdx}`;
          const qRef = doc(db, 'questions', qId);
          batch.set(qRef, {
            id: qId,
            examId,
            examName: exam.name.trim(),
            subject: exam.subject || 'General',
            text: q.text,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation || '',
            isPublic,
            authorId,
            authorEmail,
            uploadedAt: new Date().toISOString(),
          });
        });

        await batch.commit();
        const percent = Math.min(90, Math.round(50 + ((i + chunk.length) / exam.questions.length) * 40));
        onProgress?.(percent, `Committed ${Math.min(i + CHUNK_SIZE, exam.questions.length)} of ${exam.questions.length} questions...`);
      }
      uploadedCount = exam.questions.length;
    }

    onProgress?.(95, 'Updating local repository state...');

    // 3. Update local cache with uploaded metadata flag
    const local = getLocalExams();
    const idx = local.findIndex((e) => e.id === exam.id);
    if (idx >= 0) {
      local[idx] = {
        ...local[idx],
        isUploadedToCloud: true,
        cloudStorageEngine: 'firestore',
        cloudUploadedAt: new Date().toISOString(),
      };
      saveLocalExams(local);
    }

    onProgress?.(100, 'Upload complete!');

    return {
      success: true,
      examId,
      questionsCount: uploadedCount,
      message: `Successfully uploaded "${exam.name}" and ${uploadedCount} question(s) directly to Firebase Cloud Firestore!`,
    };
  } catch (err: unknown) {
    handleFirestoreError(err, OperationType.WRITE, `exams/${examId}`);
  }
}
