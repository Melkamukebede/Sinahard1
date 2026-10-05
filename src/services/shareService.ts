import { doc, getDoc, setDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '../firebase';
import { Exam, Question } from '../types';
import { CURATED_EXAMS_CATALOG } from '../data/curatedCatalog';
import { getCachedOfficialExams, sanitizeFirestoreExam } from './officialExams';
import { getLocalExams } from './db';

export const getShareBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'https://sinahard.com.et';
};

export const SHARE_BASE_URL = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://sinahard.com.et';

/**
 * Extracts the target exam identifier from any URL parameter, hash, or path.
 * Supports:
 *  - ?id=... (primary short link)
 *  - ?examId=...
 *  - ?e=...
 *  - ?catalogId=...
 *  - #/?id=... or #id=...
 *  - /practice/:id or /exam/:id
 */
export function extractTargetExamId(): string | null {
  if (typeof window === 'undefined') return null;

  // 1. Standard search parameters (?id=... or ?examId=...)
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const fromSearch =
      searchParams.get('id') ||
      searchParams.get('examId') ||
      searchParams.get('e') ||
      searchParams.get('catalogId');

    if (fromSearch && fromSearch.trim()) {
      return decodeURIComponent(fromSearch.trim());
    }
  } catch {
    // Ignore URL parse errors
  }

  // 2. Location hash parameters (e.g. #/?id=... or #id=...)
  try {
    const hash = window.location.hash;
    if (hash) {
      const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
      const queryIdx = cleanHash.indexOf('?');
      const hashQuery = queryIdx !== -1 ? cleanHash.slice(queryIdx) : cleanHash;
      const hashParams = new URLSearchParams(hashQuery.startsWith('?') ? hashQuery : `?${hashQuery}`);
      const fromHash =
        hashParams.get('id') ||
        hashParams.get('examId') ||
        hashParams.get('e') ||
        hashParams.get('catalogId');

      if (fromHash && fromHash.trim()) {
        return decodeURIComponent(fromHash.trim());
      }
    }
  } catch {
    // Ignore hash parse errors
  }

  // 3. Clean path parameters (e.g. /practice/:id or /exam/:id)
  try {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (
      pathParts.length >= 2 &&
      (pathParts[0] === 'practice' || pathParts[0] === 'exam' || pathParts[0] === 'e')
    ) {
      return decodeURIComponent(pathParts[1].trim());
    }
  } catch {
    // Ignore path errors
  }

  return null;
}

export interface CloudPublishResult {
  success: boolean;
  examId: string;
  error?: string;
}

/**
 * Automatically publishes/synchronizes an exam to Cloud Firestore /exams/{examId}
 * so that any recipient opening the short link on any device can immediately fetch it
 * and launch Practice Mode with complete questions and specifications.
 */
export async function publishExamForCloudSharing(exam: Exam): Promise<CloudPublishResult> {
  const examId = (exam.catalogId || exam.id).trim();
  if (!examId) {
    return { success: false, examId: '', error: 'Missing exam identifier.' };
  }

  try {
    const authorUid = auth.currentUser?.uid || 'guest';
    const authorEmail = auth.currentUser?.email || null;
    const nowIso = new Date().toISOString();

    // Sanitize questions array to guarantee complete fields
    const sanitizedQuestions: Question[] = (exam.questions || []).map((q, idx) => ({
      id: q.id || `q_${examId}_${idx + 1}`,
      text: String(q.text || ''),
      options:
        Array.isArray(q.options) && q.options.length > 0
          ? q.options.map((o) => String(o ?? ''))
          : ['', '', '', ''],
      correct:
        typeof q.correct === 'number' && !isNaN(q.correct)
          ? Math.max(0, Math.min(3, q.correct))
          : 0,
      explanation: q.explanation ? String(q.explanation) : '',
    }));

    const title = (exam.title || exam.name || 'Practice Exam').trim();
    const examMetadata = {
      subject: (exam.subject || 'General').trim(),
      grade: String(exam.grade || '12'),
      timeLimit: Number(exam.timeLimit) || 20,
      ...(exam.topic?.trim() ? { topic: exam.topic.trim() } : {}),
      ...(exam.stream ? { stream: exam.stream } : {}),
      ...(exam.targetExamYear ? { targetExamYear: exam.targetExamYear } : {}),
      ...(exam.description?.trim() ? { description: exam.description.trim() } : {}),
    };

    const payload = {
      id: examId,
      catalogId: exam.catalogId || examId,
      title,
      name: title,
      grade: String(exam.grade || '12'),
      subject: (exam.subject || 'General').trim(),
      timeLimit: Number(exam.timeLimit) || 20,
      metadata: examMetadata,
      questions: sanitizedQuestions,
      questionCount: sanitizedQuestions.length,
      isPublic: true,
      sourceType: exam.sourceType || 'user_shared',
      userId: authorUid,
      createdAt: exam.createdAt || nowIso,
      updatedAt: nowIso,
      ...(authorEmail ? { authorEmail } : {}),
    };

    const examDocRef = doc(db, 'exams', examId);
    // Write directly using merge: true to handle both initial creation and updates
    await setDoc(examDocRef, payload, { merge: true });

    return { success: true, examId };
  } catch (err: any) {
    const errorDetails = err?.message || String(err);
    console.error('Failed uploading exam to Cloud Firestore for sharing:', err);
    return {
      success: false,
      examId,
      error: errorDetails,
    };
  }
}

/**
 * Resolves an exam from targetId for direct practice mode launch.
 * Searches across:
 *  1. Local storage & active exams library (0ms instant launch)
 *  2. Curated official catalog (0ms instant launch)
 *  3. Cached official curriculum exams
 *  4. Cloud Firestore /exams documents (by doc ID, catalogId, or id field)
 *  5. Cloud Firestore /questions collection (if question bank was uploaded separately)
 */
export async function resolveExamForPractice(
  targetId: string,
  options?: {
    currentExams?: Exam[];
    onStatus?: (status: string) => void;
  }
): Promise<Exam | null> {
  const cleanId = targetId.trim();
  if (!cleanId) return null;

  const normalized = cleanId.toLowerCase();

  // 1. Search in local library exams (fastest, 0ms)
  const localList = options?.currentExams && options.currentExams.length > 0
    ? options.currentExams
    : getLocalExams();

  const matchedLocal = localList.find(
    (e) =>
      e.id === cleanId ||
      e.id.toLowerCase() === normalized ||
      (e.catalogId && (e.catalogId === cleanId || e.catalogId.toLowerCase() === normalized))
  );

  if (matchedLocal && matchedLocal.questions && matchedLocal.questions.length > 0) {
    return matchedLocal;
  }

  // 2. Search in official curated catalog
  const matchedCurated = CURATED_EXAMS_CATALOG.find(
    (e) =>
      e.id === cleanId ||
      e.id.toLowerCase() === normalized ||
      (e.catalogId && (e.catalogId === cleanId || e.catalogId.toLowerCase() === normalized))
  );

  if (matchedCurated && matchedCurated.questions && matchedCurated.questions.length > 0) {
    return matchedCurated;
  }

  // 3. Search in cached official exams
  const cachedOfficial = getCachedOfficialExams();
  const matchedCached = cachedOfficial.find(
    (e) =>
      e.id === cleanId ||
      e.id.toLowerCase() === normalized ||
      (e.catalogId && (e.catalogId === cleanId || e.catalogId.toLowerCase() === normalized))
  );

  if (matchedCached && matchedCached.questions && matchedCached.questions.length > 0) {
    return matchedCached;
  }

  // 4. Fetch directly from Cloud Firestore
  options?.onStatus?.('Fetching exam from cloud database...');

  try {
    let firestoreData: any = null;
    let resolvedDocId = cleanId;

    // A. Direct doc lookup
    const directSnap = await getDoc(doc(db, 'exams', cleanId));
    if (directSnap.exists()) {
      firestoreData = directSnap.data();
      resolvedDocId = directSnap.id;
    } else {
      // Try lowercase doc id
      if (cleanId !== normalized) {
        const lowerSnap = await getDoc(doc(db, 'exams', normalized));
        if (lowerSnap.exists()) {
          firestoreData = lowerSnap.data();
          resolvedDocId = lowerSnap.id;
        }
      }

      // B. Query by catalogId field
      if (!firestoreData) {
        options?.onStatus?.('Searching catalog database...');
        const qCatalog = query(collection(db, 'exams'), where('catalogId', '==', cleanId), limit(1));
        const catalogDocs = await getDocs(qCatalog);
        if (!catalogDocs.empty) {
          firestoreData = catalogDocs.docs[0].data();
          resolvedDocId = catalogDocs.docs[0].id;
        }
      }

      // C. Query by id field
      if (!firestoreData) {
        const qId = query(collection(db, 'exams'), where('id', '==', cleanId), limit(1));
        const idDocs = await getDocs(qId);
        if (!idDocs.empty) {
          firestoreData = idDocs.docs[0].data();
          resolvedDocId = idDocs.docs[0].id;
        }
      }
    }

    if (!firestoreData) {
      return null;
    }

    // 5. Check if questions are inside the exam document or in /questions bank
    let rawQuestions: any[] = Array.isArray(firestoreData.questions) ? firestoreData.questions : [];

    if (rawQuestions.length === 0) {
      options?.onStatus?.('Loading practice questions...');
      try {
        const qQuery = query(
          collection(db, 'questions'),
          where('examId', '==', resolvedDocId),
          limit(200)
        );
        const qSnap = await getDocs(qQuery);
        if (!qSnap.empty) {
          rawQuestions = qSnap.docs.map((d) => d.data());
        }
      } catch (qErr) {
        console.warn('Could not query questions bank collection:', qErr);
      }
    }

    const sanitizedExam = sanitizeFirestoreExam(
      {
        ...firestoreData,
        questions: rawQuestions,
      },
      resolvedDocId
    );

    // Optimize: Cache resolved exam locally so future practice launches cost 0 Firestore reads
    try {
      const existing = getCachedOfficialExams();
      const idx = existing.findIndex((e) => e.id === sanitizedExam.id || (e.catalogId && e.catalogId === sanitizedExam.catalogId));
      if (idx >= 0) {
        existing[idx] = sanitizedExam;
      } else {
        existing.push(sanitizedExam);
      }
      localStorage.setItem('exam_master_official_exams_cache', JSON.stringify(existing));
    } catch {
      // ignore storage quota errors gracefully
    }

    return sanitizedExam;
  } catch (err) {
    console.error('Error fetching exam from Firestore:', err);
    throw err;
  }
}
