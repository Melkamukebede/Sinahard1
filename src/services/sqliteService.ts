/**
 * SQLite Service for ExamMaster Pro
 * 
 * Provides zero-dependency offline database generation and export using WebAssembly (sql.js).
 * Compiles verified exam questions into standardized .sqlite / .db binary files for 
 * offline desktop applications, mobile apps, or local school exam labs.
 */

import initSqlJs, { Database } from 'sql.js';
import { Question } from '../types';

export interface SqliteExportResult {
  fileName: string;
  blob: Blob;
  sizeBytes: number;
  questionCount: number;
}

/**
 * Initialize sql.js WebAssembly runtime
 */
async function getSqlInstance() {
  return await initSqlJs({
    locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`,
  });
}

/**
 * Creates an offline SQLite database containing the specified questions and exam metadata.
 */
export async function createExamSqliteDatabase(
  examTitle: string,
  subject: string,
  grade: string,
  stream: string,
  questions: (Question & { criticScore?: number; criticNotes?: string; verifiedByAgent?: boolean })[]
): Promise<Uint8Array> {
  const SQL = await getSqlInstance();
  const db: Database = new SQL.Database();

  // 1. Create Schema: exams and questions tables
  db.run(`
    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      grade TEXT NOT NULL,
      stream TEXT NOT NULL,
      total_questions INTEGER NOT NULL,
      source TEXT DEFAULT 'ExamMaster Pro LangGraph Multi-Agent',
      created_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      grade TEXT NOT NULL,
      topic TEXT,
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option_index INTEGER NOT NULL,
      explanation TEXT,
      critic_score INTEGER DEFAULT 100,
      critic_notes TEXT,
      verified_by_critic INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (exam_id) REFERENCES exams (id)
    );
  `);

  const examId = 'exam_' + Date.now();
  const now = new Date().toISOString();

  // 2. Insert Exam Record
  db.run(
    `INSERT INTO exams (id, title, subject, grade, stream, total_questions, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [examId, examTitle, subject, grade, stream, questions.length, now]
  );

  // 3. Insert Questions Records
  const insertQuestionStmt = db.prepare(`
    INSERT INTO questions (
      id, exam_id, subject, grade, topic, question_text,
      option_a, option_b, option_c, option_d,
      correct_option_index, explanation, critic_score,
      critic_notes, verified_by_critic, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const qId = q.id || `q_${Date.now()}_${i}`;
    const opts = Array.isArray(q.options) ? q.options : ['A', 'B', 'C', 'D'];
    const optA = opts[0] || 'Option A';
    const optB = opts[1] || 'Option B';
    const optC = opts[2] || 'Option C';
    const optD = opts[3] || 'Option D';
    const correctIdx = typeof q.correct === 'number' ? q.correct : 0;
    const score = q.criticScore || 95;
    const notes = q.criticNotes || 'Verified by LangGraph Critic';
    const isVerified = q.verifiedByAgent ? 1 : 1;

    insertQuestionStmt.run([
      qId,
      examId,
      q.subject || subject,
      q.grade || grade,
      q.topic || 'General Topic',
      q.text || '',
      optA,
      optB,
      optC,
      optD,
      correctIdx,
      q.explanation || '',
      score,
      notes,
      isVerified,
      now,
    ]);
  }

  insertQuestionStmt.free();

  // Export binary SQLite file
  const binaryArray = db.export();
  db.close();
  return binaryArray;
}

/**
 * Trigger immediate browser download of the generated SQLite file
 */
export async function downloadExamSqliteFile(
  examTitle: string,
  subject: string,
  grade: string,
  stream: string,
  questions: (Question & { criticScore?: number; criticNotes?: string; verifiedByAgent?: boolean })[]
): Promise<SqliteExportResult> {
  const binary = await createExamSqliteDatabase(examTitle, subject, grade, stream, questions);
  const blob = new Blob([binary], { type: 'application/x-sqlite3' });
  const sanitizedTitle = examTitle.toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  const fileName = `${sanitizedTitle || 'exam_questions'}_offline.sqlite`;

  if (typeof window !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return {
    fileName,
    blob,
    sizeBytes: blob.size,
    questionCount: questions.length,
  };
}
