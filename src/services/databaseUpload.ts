import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Exam, Question, AppUser, ExamCategory, CreatedExamType } from '../types';
import { getLocalExams, saveLocalExams, ADMIN_EMAIL, isUserAdmin } from './db';
import { publishOfficialExamLocally } from './officialExams';

export interface FirestoreUploadOptions {
  category?: ExamCategory;
  createdType?: CreatedExamType;
  school?: string;
  teacherName?: string;
  examYear?: string;
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
 * Validates whether current user has privileges to upload to Cloud Firestore:
 * - Administrator: Can upload official curated exams and school exams
 * - Verified Teacher: Can upload school-specific teacher exams
 * - Student: Not permitted to upload to Cloud (student exams remain local/offline)
 */
export function canUserUploadToFirestore(user: AppUser | null): boolean {
  if (!user) return false;
  if (user.isAnonymous || user.uid === 'guest') return false;
  return isUserAdmin(user) || user.role === 'teacher' || Boolean(user.isVerifiedTeacher);
}

/**
 * Highly optimized upload of an Exam and its questions into Firebase Cloud Firestore:
 *  - Main document: `/exams/{examId}`
 *  - Modular questions: `/questions/{questionId}` (parallel batch commits)
 *
 * Scopes:
 *  - Official Exams: Admin-created, accessible to all, organized by examYear and subject.
 *  - Teacher Exams: Teacher-created, synced to cloud for their school students, organized by school, teacherName, grade, subject, topic.
 *  - Student drafts: Kept locally for offline privacy and client exports.
 */
export async function uploadExamToFirestore(
  exam: Exam,
  user: AppUser | null,
  options: FirestoreUploadOptions = {}
): Promise<FirestoreUploadResult> {
  const {
    category: requestedCategory,
    createdType: requestedCreatedType,
    school: inputSchool,
    teacherName: inputTeacherName,
    examYear: inputExamYear,
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
      'Access Denied: You must be logged in as an Administrator or a Verified Teacher to upload exams to Cloud Firestore. Student study drafts are stored locally.'
    );
  }

  const isAdmin = isUserAdmin(user);
  const isTeacher = user?.role === 'teacher' || Boolean(user?.isVerifiedTeacher);

  // Determine category & sub-type
  let finalCategory: ExamCategory = 'official';
  let finalCreatedType: CreatedExamType | undefined = undefined;

  if (isTeacher && !isAdmin) {
    // Teachers upload to 'created' category with 'teacher' type
    finalCategory = 'created';
    finalCreatedType = 'teacher';
  } else if (isAdmin) {
    if (requestedCategory === 'created' || asOfficialExam === false) {
      finalCategory = 'created';
      finalCreatedType = requestedCreatedType || 'teacher';
    } else {
      finalCategory = 'official';
    }
  }

  const examId = exam.id || 'exam_' + Date.now();
  const authorEmail = user?.email || (isAdmin ? ADMIN_EMAIL : 'teacher@school.edu.et');
  const authorId = user?.uid || (isAdmin ? 'admin_user' : 'teacher_user');

  // Teacher & Official metadata
  const resolvedSchool = (inputSchool || user?.school || user?.schoolName || (exam as any).school || '').trim();
  const resolvedTeacherName = (inputTeacherName || user?.teacherName || user?.displayName || (exam as any).teacherName || 'Teacher').trim();
  const resolvedExamYear = (inputExamYear || targetExamYear || (exam as any).examYear || (exam as any).targetExamYear || '2026 (2018 E.C.)').trim();

  // Validate teacher fields
  if (finalCategory === 'created' && finalCreatedType === 'teacher') {
    if (!resolvedSchool) {
      throw new Error('School name is required for Teacher-created exams so your students can access them.');
    }
  }

  // 1. Sanitize questions
  const sanitizedQuestions = (exam.questions || []).map((q, idx) => ({
    id: q.id || `q_${examId}_${idx + 1}`,
    text: q.text?.trim() || `Question ${idx + 1}`,
    options: (q.options && q.options.length > 0)
      ? q.options.map((opt) => String(opt ?? '').trim())
      : ['A', 'B', 'C', 'D'],
    correct: typeof q.correct === 'number' ? q.correct : 0,
    ...(q.explanation ? { explanation: q.explanation.trim() } : {}),
    isPublic,
  }));

  const finalGrade = String(grade || exam.grade || inferGrade(`${exam.title || ''} ${exam.name || ''} ${exam.description || ''}`));
  const finalStream = stream || exam.stream || inferStream(exam.subject, `${exam.title || ''} ${exam.description || ''}`, finalGrade);
  const finalTopic = (topic || exam.topic || '').trim();
  const finalTimeLimit = Number(timeLimit ?? exam.timeLimit) || 20;
  const nowIso = new Date().toISOString();

  // 2. Prepare clean, non-redundant exam payload for Firestore
  const title = (exam.title || exam.name || (finalCategory === 'official' ? 'Official Curriculum Exam' : `${resolvedSchool} Exam`)).trim();
  const examMetadata: Record<string, unknown> = {
    subject: (exam.subject || 'General').trim(),
    grade: finalGrade,
    stream: finalStream,
    timeLimit: finalTimeLimit,
    category: finalCategory,
    ...(finalCategory === 'official' ? { examYear: resolvedExamYear } : {}),
    ...(finalCategory === 'created' ? { 
      createdType: finalCreatedType, 
      school: resolvedSchool, 
      teacherName: resolvedTeacherName 
    } : {}),
    ...(finalTopic ? { topic: finalTopic } : {}),
    ...(exam.description?.trim() ? { description: exam.description.trim() } : {}),
  };

  const firestoreExamPayload: Record<string, unknown> = {
    id: examId,
    catalogId: exam.catalogId || examId,
    title,
    category: finalCategory,
    ...(finalCreatedType ? { createdType: finalCreatedType } : {}),
    ...(resolvedSchool ? { school: resolvedSchool } : {}),
    ...(resolvedTeacherName ? { teacherName: resolvedTeacherName } : {}),
    ...(resolvedExamYear ? { examYear: resolvedExamYear } : {}),
    subject: (exam.subject || 'General').trim(),
    grade: finalGrade,
    topic: finalTopic,
    metadata: examMetadata,
    questions: sanitizedQuestions,
    questionCount: sanitizedQuestions.length,
    isPublic,
    userId: authorId,
    sourceType: finalCategory === 'official' ? 'curated_catalog' : 'user_created',
    createdAt: exam.createdAt || nowIso,
    updatedAt: nowIso,
    ...(authorEmail ? { authorEmail } : {}),
  };

  try {
    // 3. Upload main exam document to Firestore /exams
    onProgress?.(30, `Saving ${finalCategory === 'official' ? 'Official' : 'Teacher'} exam to Cloud Firestore /exams...`);
    const examDocRef = doc(db, 'exams', examId);
    await setDoc(examDocRef, firestoreExamPayload);

    // 4. Parallel batch commit for individual questions in /questions
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
            category: finalCategory,
            subject: (exam.subject || 'General').trim(),
            text: q.text,
            options: q.options,
            correct: q.correct,
            isPublic,
            grade: finalGrade,
            stream: finalStream,
            ...(resolvedSchool ? { school: resolvedSchool } : {}),
            ...(resolvedTeacherName ? { teacherName: resolvedTeacherName } : {}),
            ...(resolvedExamYear ? { examYear: resolvedExamYear } : {}),
            userId: authorId,
            uploadedAt: nowIso,
            ...(q.explanation ? { explanation: q.explanation.trim() } : {}),
            ...(finalTopic ? { topic: finalTopic } : {}),
            ...(authorEmail ? { authorEmail } : {}),
          });
        });

        return batch.commit();
      });

      // Execute batches in parallel for speed
      await Promise.all(batchPromises);
      uploadedCount = sanitizedQuestions.length;
    }

    onProgress?.(90, 'Updating local state and synchronization cache...');

    const fullyUpdatedExam: Exam = {
      ...exam,
      id: examId,
      catalogId: exam.catalogId || examId,
      title,
      category: finalCategory,
      createdType: finalCreatedType,
      school: resolvedSchool,
      teacherName: resolvedTeacherName,
      examYear: resolvedExamYear,
      subject: (exam.subject || 'General').trim(),
      grade: finalGrade,
      stream: finalStream,
      topic: finalTopic,
      timeLimit: finalTimeLimit,
      targetExamYear: resolvedExamYear,
      metadata: examMetadata as any,
      questions: sanitizedQuestions,
      questionCount: sanitizedQuestions.length,
      isPublic,
      userId: authorId,
      isUploadedToCloud: true,
      sourceType: finalCategory === 'official' ? 'curated_catalog' : 'user_created',
      createdAt: exam.createdAt || nowIso,
      updatedAt: nowIso,
    } as Exam;

    // 5. If official exam, synchronize with the Official Exams catalog
    if (finalCategory === 'official') {
      publishOfficialExamLocally(fullyUpdatedExam);
    }

    // 6. Update local repository state with uploaded metadata
    const local = getLocalExams();
    const idx = local.findIndex((e) => e.id === exam.id);
    if (idx >= 0) {
      local[idx] = {
        ...local[idx],
        ...fullyUpdatedExam,
      };
      saveLocalExams(local);
    } else {
      local.unshift(fullyUpdatedExam);
      saveLocalExams(local);
    }

    onProgress?.(100, 'Upload and synchronization complete!');

    const successDetail = finalCategory === 'official'
      ? `Official Exam (${resolvedExamYear} • ${exam.subject || 'General'})`
      : `Teacher Exam for ${resolvedSchool} (${resolvedTeacherName} • ${finalTopic || exam.subject})`;

    return {
      success: true,
      examId,
      questionsCount: uploadedCount,
      message: `Successfully uploaded "${title}" as ${successDetail} with ${uploadedCount} questions to Cloud Firestore!`,
    };
  } catch (err: unknown) {
    handleFirestoreError(err, OperationType.WRITE, `exams/${examId}`);
  }
}
