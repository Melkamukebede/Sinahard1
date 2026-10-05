import { Exam } from '../types';

export interface SharedHistoryItem {
  id: string; // Unique record id
  examId: string;
  title: string;
  subject: string;
  grade: string;
  topic: string;
  duration: number; // in minutes
  questionsCount: number;
  shareUrl: string;
  sharedAt: string; // ISO string
  type: 'shared_by_me' | 'accessed_by_me';
  authorName?: string;
}

const STORAGE_KEY = 'sinahard_shared_history';
export const DEFAULT_PRODUCTION_DOMAIN = 'https://sinahard1.pages.dev';

/**
 * Extracts a clean grade label from an exam
 */
export function getCleanGradeLabel(exam: Exam): string {
  if (exam.grade !== undefined && exam.grade !== null && String(exam.grade).trim() !== '') {
    const g = String(exam.grade).trim();
    if (g.toLowerCase().startsWith('grade')) return g;
    return `Grade ${g}`;
  }
  const name = exam.name || exam.title || '';
  const match = name.match(/grade\s*(\d{1,2})/i) || name.match(/g(\d{1,2})/i);
  if (match) return `Grade ${match[1]}`;
  if (/freshman/i.test(name)) return 'Grade Freshman';
  if (/university|college/i.test(name)) return 'University';
  return 'General';
}

/**
 * Formats the standard share URL for an exam.
 * Defaults to the active app origin so shared links open and work immediately,
 * with optional production domain (sinahard1.pages.dev) selection.
 */
export function buildExamShareUrl(exam: Exam, domainOption: 'active' | 'production' = 'active'): string {
  const examId = (exam.catalogId || exam.id).trim();
  const activeOrigin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : DEFAULT_PRODUCTION_DOMAIN;
  const baseUrl = domainOption === 'production' ? DEFAULT_PRODUCTION_DOMAIN : activeOrigin;
  return `${baseUrl}/?id=${encodeURIComponent(examId)}`;
}

/**
 * Generates the clean formatted specification text with clear emojis & bullets
 * exactly as required by the Sinahard Exam Specification format:
 *
 * 📌 Sinahard Exam Specification
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * •Title: Geography: introduction to geograpy
 * • Level: Grade Freshman
 * • Subject: Geography
 * • Topic: introduction to geograpy
 * • Duration: 40 Minutes
 * • Questions: 25 Multiple-Choice Questions
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 👉 Practice this exam on Sinahard:
 * https://sinahard1.pages.dev/?id=exam_1791170263655
 */
export function generateExamShareText(exam: Exam, domainOption: 'active' | 'production' = 'active'): string {
  const title = (exam.name || exam.title || 'Practice Exam').trim();
  const level = getCleanGradeLabel(exam);
  const subject = (exam.subject || exam.metadata?.subject || 'General').trim();
  const topic = (exam.topic || exam.metadata?.topic || exam.description || title).trim();
  const duration = Number(exam.timeLimit) || 40;
  const questionsCount = exam.questions?.length || exam.questionCount || 0;
  const shareUrl = buildExamShareUrl(exam, domainOption);

  return `📌 Sinahard Exam Specification
━━━━━━━━━━━━━━━━━━━━━━━━━━━
•Title: ${title}
• Level: ${level}
• Subject: ${subject}
• Topic: ${topic}
• Duration: ${duration} Minutes
• Questions: ${questionsCount} Multiple-Choice Questions
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👉 Practice this exam on Sinahard:
${shareUrl}`;
}

/**
 * Retrieves all stored shared history items
 */
export function getSharedHistory(): SharedHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort(
        (a, b) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime()
      );
    }
  } catch (err) {
    console.warn('Failed to parse shared history from localStorage:', err);
  }
  return [];
}

/**
 * Adds an exam to the shared history (either shared by user or accessed via link/code)
 */
export function addToSharedHistory(
  exam: Exam,
  type: 'shared_by_me' | 'accessed_by_me',
  customUrl?: string
): SharedHistoryItem {
  const list = getSharedHistory();
  const examId = (exam.catalogId || exam.id).trim();
  const title = (exam.name || exam.title || 'Practice Exam').trim();
  const level = getCleanGradeLabel(exam);
  const subject = (exam.subject || exam.metadata?.subject || 'General').trim();
  const topic = (exam.topic || exam.metadata?.topic || exam.description || title).trim();
  const duration = Number(exam.timeLimit) || 40;
  const questionsCount = exam.questions?.length || exam.questionCount || 0;
  const shareUrl = customUrl || buildExamShareUrl(exam);

  // Check if already in list with same examId and type
  const existingIdx = list.findIndex((item) => item.examId === examId && item.type === type);

  const newItem: SharedHistoryItem = {
    id: `shared_hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    examId,
    title,
    subject,
    grade: level,
    topic,
    duration,
    questionsCount,
    shareUrl,
    sharedAt: new Date().toISOString(),
    type,
    authorName: exam.teacherName || exam.metadata?.teacherName || undefined,
  };

  if (existingIdx >= 0) {
    // Update existing record with updated timestamp and URL
    list[existingIdx] = {
      ...list[existingIdx],
      title,
      questionsCount,
      shareUrl,
      sharedAt: new Date().toISOString(),
    };
  } else {
    list.unshift(newItem);
  }

  // Cap to last 100 history items
  const trimmed = list.slice(0, 100);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to save shared history to localStorage:', err);
  }

  return newItem;
}

/**
 * Deletes a single item from the shared history by record ID or exam ID
 */
export function deleteFromSharedHistory(recordId: string): void {
  const list = getSharedHistory();
  const filtered = list.filter((item) => item.id !== recordId && item.examId !== recordId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.warn('Failed to delete item from shared history:', err);
  }
}

/**
 * Clears the entire shared history
 */
export function clearSharedHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear shared history:', err);
  }
}
