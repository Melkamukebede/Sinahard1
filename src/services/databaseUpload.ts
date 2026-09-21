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
  topic?: string;
  stream?: string;
  timeLimit?: number;
  targetExamYear?: string;
  curator?: string;
  asOfficialExam?: boolean;
  onProgress?: (progressPercent: number, status: string) => void;
}

export interface FirestoreUploadResult {
  success: boolean;
  examId: string;
  questionsCount: number;
  message: string;
}

export function inferGrade(text: string): string {
  if (/freshman|university|remedial|college|undergrad/i.test(text)) {
    return 'Freshman';
  }
  const match = text.match(/grade\s*(\d{1,2})/i) || text.match(/g(\d{1,2})/i);
  if (match) {
    return match[1];
  }
  return '12';
}

export function inferStream(
  subject: string = '',
  text: string = '',
  grade: string = '12'
): 'Natural Science' | 'Social Science' | 'General' | 'Higher Education' {
  if (grade === 'Freshman') return 'Higher Education';
  if (grade === '9' || grade === '10') return 'General';

  const combined = `${subject} ${text}`.toLowerCase();
  if (/freshman|calculus|linear algebra|differential|remedial|engineering/i.test(combined)) {
    return 'Higher Education';
  }
  if (/physics|chemistry|biology|technical drawing|math|algebra|geometry/i.test(combined)) {
    return 'Natural Science';
  }
  if (/history|geography|economics|business|civics/i.test(combined)) {
    return 'Social Science';
  }
  return 'General';
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
    adminTag,
    grade,
    topic,
    stream,
    timeLimit,
    targetExamYear,
    curator,
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

  const finalGrade = String(grade || exam.grade || inferGrade(`${exam.name} ${exam.title || ''}`));
  const finalTopic = (topic || exam.topic || (exam.name.includes(':') ? exam.name.split(':')[1].trim() : '')).trim();
  const finalStream = stream || (exam as any).stream || inferStream(exam.subject, `${exam.name} ${exam.title || ''}`, finalGrade);
  const finalCurator = (
    curator ||
    exam.curator ||
    (finalGrade === 'Freshman' ? 'University Higher Education Mathematics Board' : 'Official Ministry Curriculum Specialist')
  ).trim();
  const finalAdminTag = (
    adminTag ||
    exam.adminTag ||
    (finalGrade === 'Freshman' ? 'University Freshman Curriculum' : `Grade ${finalGrade} National Curriculum Exam`)
  ).trim();
  const finalTimeLimit = Number(timeLimit ?? exam.timeLimit) || 20;
  const finalTargetExamYear = targetExamYear || (exam as any).targetExamYear || '2026 (2018 E.C.)';
  const nowIso = new Date().toISOString();

  // 2. Prepare clean, non-redundant exam payload for Firestore with nested metadata
  const title = (exam.title || exam.name || 'Official Curriculum Exam').trim();
  const examMetadata: Record<string, unknown> = {
    subject: (exam.subject || 'General').trim(),
    grade: finalGrade,
    stream: finalStream,
    timeLimit: finalTimeLimit,
    ...(finalTopic ? { topic: finalTopic } : {}),
    ...(finalTargetExamYear ? { targetExamYear: finalTargetExamYear } : {}),
    ...(exam.description?.trim() ? { description: exam.description.trim() } : {}),
  };

  const firestoreExamPayload: Record<string, unknown> = {
    id: examId,
    catalogId: exam.catalogId || examId,
    title,
    metadata: examMetadata,
    questions: sanitizedQuestions,
    questionCount: sanitizedQuestions.length,
    isPublic,
    userId: authorId,
    sourceType: asOfficialExam ? 'curated_catalog' : (exam.sourceType || 'curated_catalog'),
    createdAt: exam.createdAt || nowIso,
    updatedAt: nowIso,
    ...(authorEmail ? { authorEmail } : {}),
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
            subject: (exam.subject || 'General').trim(),
            text: q.text,
            options: q.options,
            correct: q.correct,
            isPublic,
            grade: finalGrade,
            stream: finalStream,
            userId: authorId,
            uploadedAt: nowIso,
            ...(q.explanation ? { explanation: q.explanation } : {}),
            ...(finalTopic ? { topic: finalTopic } : {}),
            ...(authorEmail ? { authorEmail } : {}),
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
      id: examId,
      catalogId: exam.catalogId || examId,
      title,
      subject: (exam.subject || 'General').trim(),
      grade: finalGrade,
      stream: finalStream,
      topic: finalTopic,
      timeLimit: finalTimeLimit,
      targetExamYear: finalTargetExamYear,
      metadata: examMetadata as any,
      questions: sanitizedQuestions,
      questionCount: sanitizedQuestions.length,
      isPublic,
      userId: authorId,
      sourceType: asOfficialExam ? 'curated_catalog' : (exam.sourceType || 'curated_catalog'),
      createdAt: exam.createdAt || nowIso,
      updatedAt: nowIso,
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
      message: `Successfully uploaded "${exam.name}" (${finalGrade === 'Freshman' ? 'University Freshman' : `Grade ${finalGrade}`}) with ${uploadedCount} question(s) to Cloud Firestore and synchronized to Official Exams!`,
    };
  } catch (err: unknown) {
    handleFirestoreError(err, OperationType.WRITE, `exams/${examId}`);
  }
}
