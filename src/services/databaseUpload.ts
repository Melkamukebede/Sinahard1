import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Exam, Question, AppUser } from '../types';
import { getLocalExams, saveLocalExams, ADMIN_EMAIL, isUserAdmin } from './db';
import { publishOfficialExamLocally } from './officialExams';

export interface FirestoreUploadOptions {
  uploadIndividualQuestions?: boolean;
  isPublic?: boolean;
  adminTag?: string;
  grade?: number | string;
  unit?: string;
  asOfficialExam?: boolean;
  onProgress?: (progressPercent: number, status: string) => void;
}

export interface FirestoreUploadResult {
  success: boolean;
  examId: string;
  questionsCount: number;
  message: string;
}

function inferGrade(text: string): string {
  const match = text.match(/grade\s*(\d{1,2})/i) || text.match(/g(\d{1,2})/i);
  return match ? match[1] : '12';
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
 * Highly optimized upload of an Exam and its questions into Firebase Cloud Firestore:
 *  - Main document: `/exams/{examId}`
 *  - Modular questions: `/questions/{questionId}` (parallel batch commits)
 *  - Instantly synchronizes with the Official Exams catalog (Curated Catalog)
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
    grade,
    unit,
    asOfficialExam = true,
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

  onProgress?.(15, 'Sanitizing and preparing question bank payload...');

  // 1. Sanitize all questions: strip undefined fields to prevent Firestore serialization crashes
  const sanitizedQuestions: Question[] = (exam.questions || []).map((q, idx) => ({
    id: q.id || `q_${examId}_${idx + 1}`,
    text: String(q.text || ''),
    options: Array.isArray(q.options) && q.options.length > 0
      ? q.options.map((opt) => String(opt ?? ''))
      : ['', '', '', ''],
    correct: typeof q.correct === 'number' && !isNaN(q.correct) ? Math.max(0, Math.min(3, q.correct)) : 0,
    explanation: q.explanation ? String(q.explanation) : '',
  }));

  const finalGrade = grade || exam.grade || inferGrade(`${exam.name} ${exam.title || ''}`);
  const finalUnit = (unit || exam.unit || 'National Curriculum Unit').trim();
  const finalCurator = (adminTag || exam.curator || 'Official Ministry Curriculum Specialist').trim();
  const nowIso = new Date().toISOString();

  // 2. Prepare comprehensive exam payload
  const firestoreExamPayload: Partial<Exam> & Record<string, unknown> = {
    id: examId,
    name: exam.name.trim(),
    title: (exam.title || exam.name).trim(),
    subject: (exam.subject || 'General').trim(),
    difficulty: exam.difficulty || 'Medium',
    timeLimit: Number(exam.timeLimit) || 20,
    passingScore: Number(exam.passingScore) || 70,
    subjectType: exam.subjectType || 'theory',
    description: (exam.description || '').trim(),
    questions: sanitizedQuestions,
    grade: finalGrade,
    unit: finalUnit,
    curator: finalCurator,
    rating: exam.rating ?? 4.9,
    downloadCount: exam.downloadCount ?? 120,
    isPublic,
    userId: authorId,
    authorId,
    authorEmail,
    adminTag,
    sourceType: asOfficialExam ? 'curated_catalog' : (exam.sourceType || 'curated_catalog'),
    isUploadedToCloud: true,
    cloudStorageEngine: 'firestore',
    cloudUploadedAt: nowIso,
    updatedAt: nowIso,
    createdAt: exam.createdAt || nowIso,
  };

  try {
    // 3. Upload main exam document to Firestore /exams
    onProgress?.(30, 'Saving exam document to Cloud Firestore /exams...');
    const examDocRef = doc(db, 'exams', examId);
    await setDoc(examDocRef, firestoreExamPayload);

    // 4. Optimized parallel batch commit for individual questions in /questions
    let uploadedCount = sanitizedQuestions.length;
    if (uploadIndividualQuestions && sanitizedQuestions.length > 0) {
      onProgress?.(50, `Syncing ${sanitizedQuestions.length} questions to /questions bank...`);

      const CHUNK_SIZE = 400;
      const chunks: Question[][] = [];
      for (let i = 0; i < sanitizedQuestions.length; i += CHUNK_SIZE) {
        chunks.push(sanitizedQuestions.slice(i, i + CHUNK_SIZE));
      }

      // Prepare batches
      const batchPromises = chunks.map((chunk, chunkIdx) => {
        const batch = writeBatch(db);
        const baseOffset = chunkIdx * CHUNK_SIZE;

        chunk.forEach((q, idxInChunk) => {
          const globalIdx = baseOffset + idxInChunk;
          const qId = q.id || `q_${examId}_${globalIdx + 1}`;
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
            grade: finalGrade,
            unit: finalUnit,
            authorId,
            authorEmail,
            uploadedAt: nowIso,
          });
        });

        return batch.commit();
      });

      // Execute batches in parallel for maximum speed
      await Promise.all(batchPromises);
      uploadedCount = sanitizedQuestions.length;
    }

    onProgress?.(90, 'Instantly synchronizing to Official Exams catalog...');

    const fullyUpdatedExam: Exam = {
      ...exam,
      ...firestoreExamPayload,
      questions: sanitizedQuestions,
    } as Exam;

    // 5. Instantly broadcast to the Official Exams live catalog (0ms latency)
    publishOfficialExamLocally(fullyUpdatedExam);

    // 6. Update local repository state with uploaded metadata
    const local = getLocalExams();
    const idx = local.findIndex((e) => e.id === exam.id);
    if (idx >= 0) {
      local[idx] = {
        ...local[idx],
        ...fullyUpdatedExam,
      };
      saveLocalExams(local);
    }

    onProgress?.(100, 'Upload and instant synchronization complete!');

    return {
      success: true,
      examId,
      questionsCount: uploadedCount,
      message: `Successfully uploaded "${exam.name}" with ${uploadedCount} question(s) to Cloud Firestore and synchronized instantly to Official Exams!`,
    };
  } catch (err: unknown) {
    handleFirestoreError(err, OperationType.WRITE, `exams/${examId}`);
  }
}
