import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FileText,
  HelpCircle,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Save,
  Clock,
  Target,
  FileUp,
  Check,
  ClipboardPaste,
  AlertCircle,
  X,
  FileCheck2,
  CloudUpload,
  BookOpen,
  Copy,
  Eye,
  EyeOff,
  GraduationCap,
  Download,
  Search,
  Maximize2,
  Minimize2,
  Upload,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Exam, Question } from '../types';
import { MathRenderer } from './MathRenderer';
import { UserTierStatus } from '../services/subscriptionLimits';
import { SinahardLogo } from './SinahardLogo';

interface CreateExamWizardProps {
  initialExam?: Exam | null;
  initialMode?: 'select' | 'manual' | 'paste';
  onSaveExam: (exam: Exam) => void;
  onCancel: () => void;
  onOpenPasteModal?: () => void;
  onOpenProfessorModal: () => void;
  userTier?: UserTierStatus;
  onOpenSubscriptionModal?: () => void;
  onOpenDatabaseUpload?: (exam: Exam) => void;
  isAdmin?: boolean;
}

interface ExtractedExamMetadata {
  name?: string;
  subject?: string;
  topic?: string;
  grade?: string | number;
  timeLimit?: number;
  description?: string;
}

export const GRADE_OPTIONS = ['12', '11', '10', '9', '8', '7', 'Freshman', 'Senior University', 'All'];

// Extract and normalize grade/level values
export const normalizeGrade = (raw: string | number | undefined | null): string => {
  if (raw === undefined || raw === null) return '12';
  const str = String(raw).trim();
  if (!str) return '12';

  // Check for university senior / senior university / undergrad exit
  if (/senior\s*(?:university|college|undergrad)?|university\s*senior/i.test(str)) {
    return 'Senior University';
  }
  // Check for university / freshman / college / remedial
  if (/freshman|first\s*year/i.test(str)) {
    return 'Freshman';
  }
  if (/university|college|undergrad|higher/i.test(str)) {
    return 'Freshman';
  }
  // Check for all / general
  if (/^all$/i.test(str)) {
    return 'All';
  }
  // Look for any number 1-12 (e.g. "Grade 10", "10th", "10", "G10", "Grade: 10", "Class 11")
  const numMatch = str.match(/\b(1[0-2]|[1-9])(?:th|st|nd|rd)?\b/i) || str.match(/(\d{1,2})/);
  if (numMatch) {
    return String(parseInt(numMatch[1], 10));
  }

  const matched = GRADE_OPTIONS.find((g) => g.toLowerCase() === str.toLowerCase());
  if (matched) return matched;

  return str;
};

// Extract Exam metadata from header specification block
export const extractExamMetadataFromText = (raw: string): ExtractedExamMetadata => {
  const metadata: ExtractedExamMetadata = {};
  if (!raw || !raw.trim()) return metadata;

  const lines = raw.split('\n');

  for (const line of lines) {
    const rawTrimmed = line.trim();
    if (!rawTrimmed || rawTrimmed.startsWith('===') || rawTrimmed.startsWith('---') || rawTrimmed.startsWith('***')) {
      continue;
    }

    // Stop metadata scanning once questions start
    if (/^(?:question\s*\d+[:\.]?|\bq\d+[:\.\)]|\d+[\.\)]|\#+\s*\d+[\.\)]?)\s+[a-zA-Z0-9\\\(]/i.test(rawTrimmed)) {
      break;
    }

    if (/^FORMAT\s*SPECIFICATION/i.test(rawTrimmed)) {
      continue;
    }

    // Strip leading markdown bullets (*, -, +, >, ##) and remove ALL markdown bold/italic asterisks, backticks, underscores
    const cleanLine = rawTrimmed
      .replace(/^[\*\-\+\>\#\s]+/, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/__/g, '')
      .replace(/`/g, '')
      .trim();

    // 1. Grade: handles "Grade: 10", "Grade 10", "Grade Level: 11", "Class: 9", "Academic Level: Freshman", "Grade: Senior University"
    const gradeMatch = cleanLine.match(/^(?:GRADE(?:\s*LEVEL)?|ACADEMIC\s*LEVEL|CLASS(?:\s*LEVEL)?)\s*[:\-\=]?\s*(.+)$/i);
    if (gradeMatch && !metadata.grade) {
      metadata.grade = normalizeGrade(gradeMatch[1].trim());
      continue;
    }

    // 2. Topic / Chapter / Unit
    const topicMatch = cleanLine.match(/^(?:TOPIC|CHAPTER|UNIT(?:\s*NAME)?)\s*[:\-\=]?\s*(.+)$/i);
    if (topicMatch && !metadata.topic) {
      metadata.topic = topicMatch[1].trim();
      continue;
    }

    // 3. Subject / Course: handles "Subject: Physics", "Subject - Physics", "Subject / Course: Physics", "Course: Mathematics", "Subject = Chemistry"
    const subjectMatch = cleanLine.match(/^(?:SUBJECT(?:\s*(?:NAME|\/\s*COURSE))?|COURSE|DISCIPLINE|FIELD)\s*[:\-\=]?\s*(.+)$/i);
    if (subjectMatch && !metadata.subject) {
      metadata.subject = subjectMatch[1].trim();
      continue;
    }

    // 4. Time Limit / Duration
    const timeMatch = cleanLine.match(/^(?:TIME(?:\s*LIMIT)?|DURATION)\s*[:\-\=]?\s*(\d+)/i);
    if (timeMatch && !metadata.timeLimit) {
      const mins = parseInt(timeMatch[1], 10);
      if (!isNaN(mins) && mins > 0) {
        metadata.timeLimit = mins;
      }
      continue;
    }

    // 5. Exam Name / Title
    const nameMatch = cleanLine.match(/^(?:EXAM(?:\s*(?:NAME|TITLE))?|TITLE)\s*[:\-\=]?\s*(.+)$/i);
    if (nameMatch && !metadata.name) {
      metadata.name = nameMatch[1].trim();
      continue;
    }

    // 6. Description
    const descMatch = cleanLine.match(/^DESCRIPTION\s*[:\-\=]?\s*(.+)$/i);
    if (descMatch && !metadata.description) {
      metadata.description = descMatch[1].trim();
      continue;
    }
  }

  // Fallback 1: If no explicit Grade line was found, look in the header slice (first 600 characters)
  if (!metadata.grade) {
    const headerSlice = raw.slice(0, 600);
    if (/senior\s*(?:university|college|undergrad)?|university\s*senior/i.test(headerSlice)) {
      metadata.grade = 'Senior University';
    } else {
      const inlineGradeMatch = headerSlice.match(/\b(?:grade|class|g)\s*[:\-\s]?\s*(1[0-2]|[7-9])(?:th|st|nd|rd)?\b/i);
      if (inlineGradeMatch) {
        metadata.grade = inlineGradeMatch[1];
      } else if (/\b(freshman|first\s*year)\b/i.test(headerSlice)) {
        metadata.grade = 'Freshman';
      } else if (/\b(university|college)\b/i.test(headerSlice)) {
        metadata.grade = 'Freshman';
      }
    }
  }

  // Fallback 2: If no explicit Subject line was found, inspect header text or title for common subjects
  if (!metadata.subject) {
    const headerSlice = raw.slice(0, 600);
    const commonSubjects = [
      'Applied Mathematics', 'Engineering Mathematics', 'Mathematics', 'Math', 'Physics', 'Chemistry', 'Biology',
      'General Science', 'Natural Science', 'History', 'Civics', 'Geography', 'Economics',
      'English', 'Information Technology', 'Computer Science', 'Technical Drawing'
    ];
    for (const sub of commonSubjects) {
      const regex = new RegExp(`\\b${sub}\\b`, 'i');
      if (regex.test(headerSlice)) {
        metadata.subject = sub === 'Math' ? 'Mathematics' : sub;
        break;
      }
    }
  }

  // Infer Title if missing
  if (!metadata.name) {
    if (metadata.subject && metadata.topic) {
      metadata.name = `${metadata.subject}: ${metadata.topic}`;
    } else if (metadata.topic) {
      metadata.name = metadata.topic;
    } else if (metadata.subject) {
      const gradeStr = metadata.grade === 'Senior University' ? 'University Senior' : metadata.grade === 'Freshman' ? 'University Freshman' : metadata.grade ? `Grade ${metadata.grade}` : '';
      metadata.name = gradeStr ? `${gradeStr} ${metadata.subject}` : `${metadata.subject} Exam`;
    }
  }

  return metadata;
};

// Strips metadata headers and top divider lines before question parsing
export const stripExamHeader = (raw: string): string => {
  let cleaned = raw;
  cleaned = cleaned.replace(/^[=\-\*]{3,}[\s\S]*?[=\-\*]{3,}/m, '');
  cleaned = cleaned.replace(/^FORMAT\s*SPECIFICATION:?[\s\S]*?(?=(?:question\s*\d+|\d+[\.\)]|\#+\s*\d+))/i, '');

  const lines = cleaned.split('\n');
  let firstQuestionIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    if (/^(?:question\s*\d+[:\.]?|\d+[\.\)]|\#+\s*\d+[\.\)]?)\s+[a-zA-Z0-9\\]/i.test(l)) {
      firstQuestionIdx = i;
      break;
    }
  }
  if (firstQuestionIdx > 0) {
    cleaned = lines.slice(firstQuestionIdx).join('\n');
  }
  return cleaned;
};

// Robust plain text parser supporting numbered questions, options A-D, answers, and KaTeX math formulas
const parsePlainTextRobust = (raw: string): Question[] => {
  const questions: Question[] = [];
  const cleanContent = stripExamHeader(raw).trim();
  if (!cleanContent) return questions;

  let rawBlocks: string[] = [];
  const hasNumberedQuestions = /(?:^|\n)\s*(?:question\s*\d+[:\.]?|\bq\d+[:\.\)]|\d+[\.\)]|\#+\s*\d+[\.\)])\s+/i.test(cleanContent);

  if (hasNumberedQuestions) {
    const splitRegex = /(?:^|\n)(?=\s*(?:question\s*\d+[:\.]?|\bq\d+[:\.\)]|\d+[\.\)]|\#+\s*\d+[\.\)])\s+)/i;
    rawBlocks = cleanContent.split(splitRegex).map((b) => b.trim()).filter(Boolean);
  } else {
    rawBlocks = cleanContent.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean);
  }

  rawBlocks.forEach((block) => {
    const lines = block.split('\n');
    if (!lines.length) return;

    const textLines: string[] = [];
    const options: string[] = [];
    let correct = -1;
    const explanationLines: string[] = [];
    let inExplanation = false;
    let foundFirstOption = false;

    const firstLine = lines[0].trim();
    const headerMatch = firstLine.match(/^(?:question\s*\d+[:\.]?|\bq\d+[:\.\)]|\d+[\.\)]|\#+\s*\d+[\.\)]?)\s*(.*)/i);
    if (headerMatch) {
      if (headerMatch[1]?.trim()) {
        textLines.push(headerMatch[1].trim());
      }
    } else {
      textLines.push(firstLine);
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        if (inExplanation) {
          explanationLines.push('');
        }
        continue;
      }

      if (/^explanation\s*[:\-]/i.test(line)) {
        inExplanation = true;
        const expText = line.replace(/^explanation\s*[:\-]\s*/i, '').trim();
        if (expText) explanationLines.push(expText);
        continue;
      }

      if (inExplanation) {
        explanationLines.push(line);
        continue;
      }

      const optMatch = line.match(/^([A-Da-d])[\.\)\:\-]\s*(.*)/);
      if (optMatch) {
        foundFirstOption = true;
        let optText = optMatch[2].trim();
        if (optText.endsWith('*')) {
          const letter = optMatch[1].toUpperCase();
          correct = letter.charCodeAt(0) - 65;
          optText = optText.slice(0, -1).trim();
        }
        options.push(optText);
        continue;
      }

      const ansMatch = line.match(/^(?:correct\s*answer|answer|ans)\s*[:\-\=]\s*([A-Da-d])/i);
      if (ansMatch) {
        const letter = ansMatch[1].toUpperCase();
        correct = letter.charCodeAt(0) - 65;
        continue;
      }

      if (!foundFirstOption) {
        textLines.push(line);
      }
    }

    if (textLines.length && options.length >= 2) {
      while (options.length < 4) {
        options.push('');
      }
      questions.push({
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        text: textLines.join('\n').trim(),
        options: options.slice(0, 4),
        correct: correct >= 0 && correct < 4 ? correct : 0,
        explanation: explanationLines.join('\n').trim(),
      });
    }
  });

  return questions;
};

export const CreateExamWizard: React.FC<CreateExamWizardProps> = ({
  initialExam,
  onSaveExam,
  onCancel,
  onOpenProfessorModal,
  userTier,
  onOpenSubscriptionModal,
  onOpenDatabaseUpload,
  isAdmin,
}) => {
  // Step 1: Info & Smart Paste | Step 2: Verification & Save
  const [currentStep, setCurrentStep] = useState<1 | 2>(initialExam ? 2 : 1);

  // Metadata Form State
  const [name, setName] = useState(initialExam?.name || '');
  const [subject, setSubject] = useState(initialExam?.subject || '');
  const [topic, setTopic] = useState(initialExam?.topic || '');
  const [grade, setGrade] = useState<string | number>(initialExam?.grade || '12');
  const [timeLimit, setTimeLimit] = useState<number>(initialExam?.timeLimit || 20);
  const [description, setDescription] = useState(initialExam?.description || '');

  // Grade and Subject auto-detection tracking
  const [userManuallySelectedGrade, setUserManuallySelectedGrade] = useState<boolean>(Boolean(initialExam?.grade));
  const [detectedGradeFromText, setDetectedGradeFromText] = useState<string | null>(null);
  const [userManuallySelectedSubject, setUserManuallySelectedSubject] = useState<boolean>(Boolean(initialExam?.subject));
  const [detectedSubjectFromText, setDetectedSubjectFromText] = useState<string | null>(null);

  // Questions State
  const [questions, setQuestions] = useState<Question[]>(() => {
    if (initialExam?.questions && initialExam.questions.length > 0) {
      return JSON.parse(JSON.stringify(initialExam.questions));
    }
    return [];
  });

  // Smart Paste State
  const [pasteRawText, setPasteRawText] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Verification View state & Optimizations
  const [expandedIndex, setExpandedIndex] = useState<number>(0);
  const [previewingIndices, setPreviewingIndices] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAllPreviewOpen, setIsAllPreviewOpen] = useState<boolean>(false);
  const [isAllExpanded, setIsAllExpanded] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const txtFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const maxQuestions = userTier?.maxQuestionsPerExam ?? 20;
  const isPremium = userTier?.isPremium ?? false;

  // Real-time Parser for Smart Paste
  useEffect(() => {
    const trimmed = pasteRawText.trim();
    if (!trimmed) {
      setPreviewQuestions([]);
      setParsingError(null);
      setDetectedGradeFromText(null);
      setDetectedSubjectFromText(null);
      return;
    }

    // Auto-infer metadata from text header if not already set or while typing
    const meta = extractExamMetadataFromText(trimmed);
    if (meta.name && !name) setName(meta.name);
    if (meta.topic && !topic) setTopic(meta.topic);

    // Auto-detect and sync Subject from Smart Paste text
    if (meta.subject) {
      setDetectedSubjectFromText(meta.subject);
      if (!userManuallySelectedSubject || !subject) {
        setSubject(meta.subject);
      }
    } else {
      setDetectedSubjectFromText(null);
    }

    // Auto-detect and sync Grade/Level from Smart Paste text
    if (meta.grade) {
      const normalizedGrade = normalizeGrade(meta.grade);
      setDetectedGradeFromText(normalizedGrade);
      if (!userManuallySelectedGrade) {
        setGrade(normalizedGrade);
      }
    } else {
      setDetectedGradeFromText(null);
    }

    if (meta.timeLimit && (timeLimit === 20 || !initialExam)) {
      setTimeLimit(meta.timeLimit);
    }
    if (meta.description && !description) {
      setDescription(meta.description);
    }

    const parsed = parsePlainTextRobust(trimmed);
    if (parsed.length > 0) {
      setPreviewQuestions(parsed);
      setParsingError(null);
    } else {
      setPreviewQuestions([]);
      setParsingError('Formatting tip: Number each question (1. ...), provide options A) B) C) D), and specify Answer: [A/B/C/D].');
    }
  }, [pasteRawText, userManuallySelectedGrade, userManuallySelectedSubject]);

  // Load sample exam
  const handleInsertSample = () => {
    setUserManuallySelectedGrade(false);
    setUserManuallySelectedSubject(false);
    const sample = `================================================================
FORMAT SPECIFICATION:
Grade: 12
Subject: Physics
Topic: Classical Mechanics & Work-Energy
Time Limit: 25 minutes
================================================================

1. A car of mass \\( m = 1200 \\text{ kg} \\) accelerates from rest to \\( v = 20 \\text{ m/s} \\). What is its kinetic energy?
   A) \\( 240,000 \\text{ J} \\)*
   B) \\( 120,000 \\text{ J} \\)
   C) \\( 480,000 \\text{ J} \\)
   D) \\( 24,000 \\text{ J} \\)
   Answer: A
   Explanation: **Formula:**
\\[ E_k = \\frac{1}{2} m v^2 \\]
**Calculation:**
\\[ E_k = \\frac{1}{2} (1200)(20^2) = 600 \\times 400 = 240,000 \\text{ J} = 240 \\text{ kJ} \\]

2. What is the SI unit of gravitational field strength?
   A) \\( \\text{N/kg} \\)*
   B) \\( \\text{J/s} \\)
   C) \\( \\text{kg}\\cdot\\text{m/s} \\)
   D) \\( \\text{W} \\)
   Answer: A
   Explanation: Gravitational field strength is defined as force per unit mass: \\( g = \\frac{F}{m} \\), giving units of \\( \\text{N/kg} \\) (equivalent to \\( \\text{m/s}^2 \\)).

3. Evaluate the work done by a constant force \\( \\vec{F} = 50 \\text{ N} \\) pushing an object \\( d = 8 \\text{ m} \\) along its direction.
   A) \\( 400 \\text{ J} \\)*
   B) \\( 200 \\text{ J} \\)
   C) \\( 58 \\text{ J} \\)
   D) \\( 320 \\text{ J} \\)
   Answer: A
   Explanation: Work is defined as \\( W = F \\cdot d \\cos(\\theta) \\). With \\( \\theta = 0^\\circ \\), \\( W = 50 \\times 8 = 400 \\text{ J} \\).`;

    setPasteRawText(sample);
    setName('Grade 12 Physics: Classical Mechanics & Work-Energy');
    setSubject('Physics');
    setTopic('Classical Mechanics');
    setGrade('12');
    setTimeLimit(25);
    setImportedFileName('Sample Exam (Physics Grade 12)');
    setSuccessMsg('Sample exam loaded with Grade 12 & KaTeX formulas!');
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handlePasteClipboard = async () => {
    setUserManuallySelectedGrade(false);
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPasteRawText((prev) => (prev ? prev + '\n\n' + text : text));
        setSuccessMsg('Pasted clipboard text into editor!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch {
      setErrorMsg('Clipboard permission denied. Please paste directly into the box.');
    }
  };

  // Process .txt / plain text file
  const handleProcessFile = (file: File) => {
    if (!file) return;
    setUserManuallySelectedGrade(false);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPasteRawText(content);
        setImportedFileName(file.name);
        setSuccessMsg(`Imported "${file.name}" (${(file.size / 1024).toFixed(1)} KB) successfully into Smart Paste!`);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    };
    reader.onerror = () => {
      setErrorMsg(`Failed to read "${file.name}". Please ensure it is a valid text file.`);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    e.target.value = '';
  };

  // Drag and Drop handlers for .txt import
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  // Export .txt file with current exam metadata and questions
  const handleExportTxt = () => {
    const currentQuestions = previewQuestions.length > 0 ? previewQuestions : questions;

    let content = '';
    if (currentQuestions.length > 0) {
      const headerLines: string[] = [];
      if (name.trim()) headerLines.push(`Exam Title: ${name.trim()}`);
      if (grade) headerLines.push(`Grade: ${grade}`);
      if (subject.trim()) headerLines.push(`Subject: ${subject.trim()}`);
      if (topic.trim()) headerLines.push(`Topic: ${topic.trim()}`);
      if (timeLimit) headerLines.push(`Time Limit: ${timeLimit} minutes`);
      if (description.trim()) headerLines.push(`Description: ${description.trim()}`);

      const formattedQuestions = currentQuestions.map((q, idx) => {
        const lines: string[] = [
          `${idx + 1}. ${q.text.trim()}`,
          ...q.options.map((opt, oIdx) => `   ${String.fromCharCode(65 + oIdx)}) ${opt}${q.correct === oIdx ? '*' : ''}`),
          `   Answer: ${String.fromCharCode(65 + q.correct)}`,
        ];
        if (q.explanation && q.explanation.trim()) {
          lines.push(`   Explanation: ${q.explanation.trim()}`);
        }
        return lines.join('\n');
      });

      content = (headerLines.length > 0 ? headerLines.join('\n') + '\n\n' : '') + formattedQuestions.join('\n\n');
    } else if (pasteRawText.trim()) {
      content = pasteRawText.trim();
    } else {
      setErrorMsg('No exam content to export yet. Please paste or enter questions first.');
      return;
    }

    const safeTitle = (name || 'sinahard_exam')
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/gi, '_')
      .replace(/^_+|_+$/g, '');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeTitle || 'exam'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setSuccessMsg(`Exported "${link.download}" successfully!`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Move from Step 1 to Step 2
  const handleProceedToVerify = () => {
    if (!name.trim()) {
      setErrorMsg('Please specify an Exam Title before continuing.');
      return;
    }

    if (previewQuestions.length === 0 && questions.length === 0) {
      setErrorMsg('No questions detected. Paste formatted questions into the editor or start with a blank question.');
      return;
    }

    let resolvedQuestions = previewQuestions.length > 0 ? previewQuestions : questions;
    if (!isPremium && resolvedQuestions.length > maxQuestions) {
      resolvedQuestions = resolvedQuestions.slice(0, maxQuestions);
      setSuccessMsg(`Loaded first ${maxQuestions} questions (Free plan cap). Upgrade for unlimited questions.`);
    }

    setQuestions(resolvedQuestions);
    setExpandedIndex(0);
    setErrorMsg(null);
    setCurrentStep(2);
  };

  // Start with blank question directly in Step 2
  const handleStartBlank = () => {
    if (!name.trim()) {
      setName('Custom Exam');
    }
    setQuestions([
      {
        id: 'q_' + Date.now(),
        text: '',
        options: ['', '', '', ''],
        correct: 0,
        explanation: '',
      },
    ]);
    setExpandedIndex(0);
    setCurrentStep(2);
  };

  // Question editing helpers
  const handleAddQuestion = () => {
    if (!isPremium && questions.length >= maxQuestions) {
      setErrorMsg(`Limit reached (${maxQuestions} questions). Upgrade to add more.`);
      return;
    }
    const newQ: Question = {
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      text: '',
      options: ['', '', '', ''],
      correct: 0,
      explanation: '',
    };
    setQuestions([...questions, newQ]);
    setExpandedIndex(questions.length);
  };

  const handleDuplicateQuestion = (idx: number) => {
    if (!isPremium && questions.length >= maxQuestions) {
      setErrorMsg(`Limit reached (${maxQuestions} questions). Upgrade to add more.`);
      return;
    }
    const target = questions[idx];
    const dup: Question = {
      ...JSON.parse(JSON.stringify(target)),
      id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    };
    const updated = [...questions];
    updated.splice(idx + 1, 0, dup);
    setQuestions(updated);
    setExpandedIndex(idx + 1);
    setSuccessMsg(`Duplicated question ${idx + 1}`);
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      setErrorMsg('An exam must have at least one question.');
      return;
    }
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    if (expandedIndex >= updated.length) {
      setExpandedIndex(updated.length - 1);
    }
  };

  const updateQuestionText = (idx: number, text: string) => {
    const updated = [...questions];
    updated[idx].text = text;
    setQuestions(updated);
  };

  const updateOptionText = (qIdx: number, optIdx: number, text: string) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx] = text;
    setQuestions(updated);
  };

  const updateCorrectOption = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    updated[qIdx].correct = optIdx;
    setQuestions(updated);
  };

  const updateExplanation = (idx: number, text: string) => {
    const updated = [...questions];
    updated[idx].explanation = text;
    setQuestions(updated);
  };

  const insertFormulaToQuestion = (qIdx: number, formula: string, targetField: 'text' | 'explanation') => {
    const updated = [...questions];
    if (targetField === 'text') {
      updated[qIdx].text = (updated[qIdx].text ? updated[qIdx].text + ' ' : '') + formula;
    } else {
      updated[qIdx].explanation = (updated[qIdx].explanation ? updated[qIdx].explanation + ' ' : '') + formula;
    }
    setQuestions(updated);
  };

  const toggleQuestionPreview = (idx: number) => {
    setPreviewingIndices((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleAllPreviews = () => {
    const nextState = !isAllPreviewOpen;
    setIsAllPreviewOpen(nextState);
    const newPreviews: Record<number, boolean> = {};
    questions.forEach((_, idx) => {
      newPreviews[idx] = nextState;
    });
    setPreviewingIndices(newPreviews);
  };

  const toggleAllExpanded = () => {
    const nextState = !isAllExpanded;
    setIsAllExpanded(nextState);
    // When expanding all, we can indicate all are expanded by setting -2 or toggling state
  };

  // Step 2 Question Stats
  const questionsStats = useMemo(() => {
    const total = questions.length;
    const withFormulas = questions.filter(
      (q) => q.text.includes('\\(') || q.text.includes('\\[') || q.options.some((o) => o.includes('\\('))
    ).length;
    const withSolutions = questions.filter((q) => q.explanation && q.explanation.trim().length > 0).length;
    return { total, withFormulas, withSolutions };
  }, [questions]);

  // Step 2 Filtered Questions
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) {
      return questions.map((q, idx) => ({ q, originalIndex: idx }));
    }
    const qLower = searchQuery.toLowerCase();
    return questions
      .map((q, idx) => ({ q, originalIndex: idx }))
      .filter(({ q, originalIndex }) => {
        const matchesIndex = String(originalIndex + 1).includes(qLower);
        const matchesText = q.text.toLowerCase().includes(qLower);
        const matchesOptions = q.options.some((opt) => opt.toLowerCase().includes(qLower));
        const matchesExplanation = q.explanation ? q.explanation.toLowerCase().includes(qLower) : false;
        return matchesIndex || matchesText || matchesOptions || matchesExplanation;
      });
  }, [questions, searchQuery]);

  // Validation & Save
  const handleFinalSave = () => {
    if (!name.trim()) {
      setErrorMsg('Please specify an Exam Title.');
      setCurrentStep(1);
      return;
    }

    if (questions.length === 0) {
      setErrorMsg('Exam must have at least one question.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        setErrorMsg(`Question ${i + 1} prompt cannot be empty.`);
        setExpandedIndex(i);
        return;
      }
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j]?.trim()) {
          setErrorMsg(`Question ${i + 1}: Option ${String.fromCharCode(65 + j)} cannot be empty.`);
          setExpandedIndex(i);
          return;
        }
      }
    }

    const resolvedSubject = subject.trim() || 'General';
    const resolvedTopic = topic.trim();

    const examData: Exam = {
      id: initialExam?.id || 'exam_' + Date.now(),
      name: name.trim(),
      subject: resolvedSubject,
      topic: resolvedTopic || undefined,
      grade: grade || '12',
      timeLimit: Number(timeLimit) || 20,
      description: description.trim() || undefined,
      questions,
      createdAt: initialExam?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isUploadedToCloud: initialExam?.isUploadedToCloud ?? false,
    };

    onSaveExam(examData);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-['Plus_Jakarta_Sans',sans-serif] pb-24">
      {/* ─────────────────────────────────────────────────────────────
          HERO CONTAINER: MATCHING SINAHARD APP COLOR DESIGN
      ───────────────────────────────────────────────────────────── */}
      <div className="relative rounded-[32px] sm:rounded-[38px] bg-white/70 dark:bg-[#070e1a]/95 backdrop-blur-2xl border border-white/70 dark:border-white/10 p-5 sm:p-8 shadow-[0_20px_50px_rgba(25,50,80,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] overflow-hidden space-y-6">
        {/* Subtle Atmospheric Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-zinc-400/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row with Sinahard Pro Brand & 2-Step Pill Bar */}
        <div className="relative z-10 border-b border-zinc-200/70 dark:border-white/10 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <SinahardLogo size="lg" idSuffix="create-hero" className="shrink-0" />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-zinc-100 dark:bg-[#0c182b] border border-zinc-200/80 dark:border-white/10 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-black dark:text-white" />
                <span>Sinahard Exam Studio</span>
                <span className="text-zinc-400 dark:text-zinc-600">•</span>
                <span className="font-normal text-zinc-500 dark:text-zinc-400">
                  {currentStep === 1 ? 'Step 1: Info & Smart Paste' : 'Step 2: Verify & KaTeX Math'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] tracking-tight text-zinc-900 dark:text-white">
                {currentStep === 1 ? 'Create & Import Exam' : 'Verify Questions & KaTeX Formulas'}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {currentStep === 1
                  ? 'Configure grade level, subject, and paste questions with automatic KaTeX math & key detection'
                  : 'Review rendered math expressions, verify answers, and save to your repository'}
              </p>
            </div>
          </div>

          {/* 2-Step Navigation Switcher */}
          <div className="flex items-center p-1 rounded-full bg-white/80 dark:bg-[#0c182b]/80 backdrop-blur-md border border-white/80 dark:border-white/10 text-xs shadow-xs self-start sm:self-center">
            <button
              id="step-tab-1"
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-semibold transition cursor-pointer active:scale-98 ${
                currentStep === 1
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <span>1. Info & Paste</span>
            </button>

            <button
              id="step-tab-2"
              type="button"
              onClick={() => {
                if (previewQuestions.length > 0 || questions.length > 0) {
                  handleProceedToVerify();
                }
              }}
              disabled={previewQuestions.length === 0 && questions.length === 0}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-semibold transition cursor-pointer active:scale-98 ${
                currentStep === 2
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs'
                  : previewQuestions.length > 0 || questions.length > 0
                  ? 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  : 'opacity-40 cursor-not-allowed text-zinc-400 dark:text-zinc-600'
              }`}
            >
              <span>2. Verify & Save</span>
              {(previewQuestions.length > 0 || questions.length > 0) && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200/70 dark:bg-zinc-800 font-bold">
                  {previewQuestions.length || questions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Notifications / Alerts */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="p-1 hover:bg-rose-500/20 rounded-md transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMsg(null)}
                className="p-1 hover:bg-emerald-500/20 rounded-md transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─────────────────────────────────────────────────────────────
            STEP 1: INFO & SMART PASTE (Single Cohesive View)
        ───────────────────────────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="space-y-6 relative z-10">
            {/* Prompts Page Button Above Exam Specification & Grade Level */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c182b]/90 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(25,50,80,0.04)] dark:shadow-[0_12px_35px_rgba(0,0,0,0.3)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-black dark:text-white" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <span>AI Exam Prompts Studio</span>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-white/10 text-black dark:text-white text-[10px] font-bold">
                      Prompts Page
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Generate ready-to-use prompts for ChatGPT, Claude, or Gemini to create exams for Sinahard
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenProfessorModal}
                className="w-full sm:w-auto px-4 py-2 rounded-2xl bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shrink-0 shadow-xs active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5 text-white dark:text-black" />
                <span>Prompts Page</span>
              </button>
            </div>

            {/* Metadata Section */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-[#0c182b]/90 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(25,50,80,0.04)] dark:shadow-[0_12px_35px_rgba(0,0,0,0.3)] space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-black dark:text-white" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Exam Specification & Grade Level
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {detectedGradeFromText && (
                    <span className="text-[11px] text-zinc-900 dark:text-white font-semibold flex items-center gap-1 bg-zinc-100 dark:bg-white/10 px-2.5 py-0.5 rounded-full border border-zinc-200/80 dark:border-white/10">
                      <Sparkles className="w-3 h-3 text-black dark:text-white" />
                      <span>{detectedGradeFromText === 'Senior University' ? 'Univ Senior' : detectedGradeFromText === 'Freshman' ? 'Univ Freshman' : `Grade ${detectedGradeFromText}`} Detected</span>
                    </span>
                  )}
                  {detectedSubjectFromText && (
                    <span className="text-[11px] text-zinc-900 dark:text-white font-semibold flex items-center gap-1 bg-zinc-100 dark:bg-white/10 px-2.5 py-0.5 rounded-full border border-zinc-200/80 dark:border-white/10">
                      <BookOpen className="w-3 h-3 text-black dark:text-white" />
                      <span>{detectedSubjectFromText}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                {/* Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>Exam Title <span className="text-rose-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Grade 12 Physics: Classical Mechanics"
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl bg-white/90 dark:bg-[#08111e]/90 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-black/40 dark:focus:border-white/40 shadow-2xs"
                  />
                </div>

                {/* Grade / Level */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-black dark:text-white" />
                      <span>Grade / Level</span>
                    </span>
                    {detectedGradeFromText && (
                      <span className="text-[10px] text-zinc-900 dark:text-white font-semibold">
                        Auto-detected
                      </span>
                    )}
                  </label>
                  <select
                    value={String(grade)}
                    onChange={(e) => {
                      setUserManuallySelectedGrade(true);
                      setGrade(e.target.value);
                    }}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl bg-white/90 dark:bg-[#08111e]/90 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 shadow-2xs"
                  >
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g} className="bg-white dark:bg-[#0c182b] text-zinc-900 dark:text-white">
                        {g === 'Freshman' ? 'University Freshman' : g === 'Senior University' ? 'University Senior' : g === 'All' ? 'All Grades' : `Grade ${g}`}
                      </option>
                    ))}
                    {!GRADE_OPTIONS.includes(String(grade)) && (
                      <option value={String(grade)} className="bg-white dark:bg-[#0c182b] text-zinc-900 dark:text-white">
                        {String(grade).toLowerCase().startsWith('grade') ? grade : `Grade ${grade}`}
                      </option>
                    )}
                  </select>

                  {/* Feedback indicator for auto-extracted grade */}
                  {detectedGradeFromText && detectedGradeFromText === String(grade) ? (
                    <div className="flex items-center gap-1 text-[11px] text-zinc-800 dark:text-zinc-200 font-medium mt-1">
                      <Check className="w-3 h-3 text-black dark:text-white" />
                      <span>Auto-synced: {grade === 'Senior University' ? 'University Senior' : grade === 'Freshman' ? 'University Freshman' : `Grade ${grade}`}</span>
                    </div>
                  ) : detectedGradeFromText ? (
                    <button
                      type="button"
                      onClick={() => {
                        setGrade(detectedGradeFromText);
                        setUserManuallySelectedGrade(false);
                      }}
                      className="flex items-center gap-1 text-[11px] text-zinc-900 dark:text-white font-semibold mt-1 hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-black dark:text-white" />
                      <span>Use detected {detectedGradeFromText === 'Senior University' ? 'University Senior' : detectedGradeFromText === 'Freshman' ? 'University Freshman' : `Grade ${detectedGradeFromText}`}</span>
                    </button>
                  ) : null}
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>Time Limit (min)</span>
                  </label>
                  <input
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(Math.max(1, parseInt(e.target.value, 10) || 20))}
                    min={1}
                    max={240}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl bg-white/90 dark:bg-[#08111e]/90 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 shadow-2xs"
                  />
                </div>

                {/* Subject */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-black dark:text-white" />
                      <span>Subject</span>
                    </span>
                    {detectedSubjectFromText && (
                      <span className="text-[10px] text-zinc-900 dark:text-white font-semibold">
                        Auto-detected
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setUserManuallySelectedSubject(true);
                    }}
                    placeholder="e.g. Physics, Mathematics, Biology..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl bg-white/90 dark:bg-[#08111e]/90 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 shadow-2xs"
                  />

                  {/* Feedback indicator for auto-extracted subject */}
                  {detectedSubjectFromText && detectedSubjectFromText.toLowerCase() === subject.trim().toLowerCase() ? (
                    <div className="flex items-center gap-1 text-[11px] text-zinc-800 dark:text-zinc-200 font-medium mt-1">
                      <Check className="w-3 h-3 text-black dark:text-white" />
                      <span>Auto-synced: {subject}</span>
                    </div>
                  ) : detectedSubjectFromText ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSubject(detectedSubjectFromText);
                        setUserManuallySelectedSubject(false);
                      }}
                      className="flex items-center gap-1 text-[11px] text-zinc-900 dark:text-white font-semibold mt-1 hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-black dark:text-white" />
                      <span>Use detected Subject: {detectedSubjectFromText}</span>
                    </button>
                  ) : null}
                </div>

                {/* Topic */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>Topic / Chapter (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. Work-Energy Theorem, Calculus I..."
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl bg-white/90 dark:bg-[#08111e]/90 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Smart Paste Section */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-[#0c182b]/90 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-[0_8px_30px_rgba(25,50,80,0.04)] dark:shadow-[0_12px_35px_rgba(0,0,0,0.3)] space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <ClipboardPaste className="w-4 h-4 text-black dark:text-white" />
                    <span>Smart Paste</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Paste exam questions with options and answer keys, or import a .txt exam file
                  </p>
                </div>

                {/* Action Buttons Toolbar with Black Button Style */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Dedicated Import .txt File */}
                  <input
                    type="file"
                    ref={txtFileInputRef}
                    onChange={handleFileChange}
                    accept=".txt,text/plain"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => txtFileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-full bg-black dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-98"
                    title="Import .txt exam file directly into Smart Paste"
                  >
                    <FileUp className="w-3.5 h-3.5 text-white dark:text-black" />
                    <span>Import .txt</span>
                  </button>

                  {/* Export .txt File */}
                  <button
                    type="button"
                    onClick={handleExportTxt}
                    className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0c182b] hover:bg-zinc-50 dark:hover:bg-[#0f1d33] text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/10 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-98"
                    title="Export exam questions to a .txt file"
                  >
                    <Download className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>Export (.txt)</span>
                  </button>

                  {/* Paste from Clipboard */}
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="px-3 py-1.5 rounded-full bg-white dark:bg-[#0c182b] hover:bg-zinc-50 dark:hover:bg-[#0f1d33] text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-white/10 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs active:scale-98"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>Paste</span>
                  </button>

                  {/* Load Sample Exam */}
                  <button
                    type="button"
                    onClick={handleInsertSample}
                    className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-white/10 hover:bg-zinc-200 dark:hover:bg-white/15 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-zinc-200/80 dark:border-white/10 shadow-xs active:scale-98"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>Sample</span>
                  </button>

                  {pasteRawText && (
                    <button
                      type="button"
                      onClick={() => {
                        setPasteRawText('');
                        setPreviewQuestions([]);
                        setImportedFileName(null);
                      }}
                      className="p-1.5 rounded-full text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer"
                      title="Clear editor text"
                    >
                      <Trash2 className="w-4 h-4 text-black dark:text-white" />
                    </button>
                  )}
                </div>
              </div>

              {/* Imported File Info Banner */}
              {importedFileName && (
                <div className="flex items-center justify-between p-2.5 px-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-800 dark:text-emerald-300 shadow-2xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-black dark:text-white shrink-0" />
                    <span className="truncate">
                      <strong>Imported:</strong> {importedFileName}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                      • {previewQuestions.length} Questions detected
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => txtFileInputRef.current?.click()}
                    className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0 ml-2 cursor-pointer"
                  >
                    Re-import .txt
                  </button>
                </div>
              )}

              {/* Smart Paste Textarea with Drag & Drop */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className="relative"
              >
                <textarea
                  ref={textareaRef}
                  rows={12}
                  value={pasteRawText}
                  onChange={(e) => setPasteRawText(e.target.value)}
                  placeholder={`Paste or drag-and-drop your .txt exam file here. Format example:\n\nGrade: 12\nSubject: Physics\nTopic: Mechanics\n\n1. What is the derivative of f(x) = x^2?\n   A) 2x*\n   B) x\n   C) 2\n   D) x^3\n   Answer: A\n   Explanation: Using the power rule, d/dx[x^2] = 2x.`}
                  className="w-full p-4 text-xs sm:text-sm font-mono rounded-2xl bg-white/90 dark:bg-[#08111e]/90 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 leading-relaxed resize-y shadow-2xs"
                />

                {/* Drag-and-drop Active Indicator */}
                {isDraggingFile && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-dashed border-emerald-500 bg-emerald-500/15 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20 pointer-events-none">
                    <FileUp className="w-10 h-10 text-black dark:text-white animate-bounce" />
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      Drop your .txt exam file here to import!
                    </span>
                  </div>
                )}

                {/* Status Pill in Corner */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2 pointer-events-none z-10">
                  {previewQuestions.length > 0 ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-xs">
                      <FileCheck2 className="w-3.5 h-3.5 text-black" />
                      <span>{previewQuestions.length} Questions Detected</span>
                    </span>
                  ) : pasteRawText.trim() ? (
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-500/30">
                      Parsing format...
                    </span>
                  ) : null}
                </div>
              </div>

              {parsingError && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  <HelpCircle className="w-3.5 h-3.5 shrink-0 text-black dark:text-white" />
                  <span>{parsingError}</span>
                </p>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0c182b]/90 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-xs flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-full border border-zinc-200/80 dark:border-white/10 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold transition cursor-pointer active:scale-98"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartBlank}
                  className="px-4 py-2 rounded-full bg-white dark:bg-[#0c182b] hover:bg-zinc-50 dark:hover:bg-[#0f1d33] border border-white/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition cursor-pointer shadow-xs active:scale-98"
                >
                  Or Start Blank
                </button>

                <button
                  type="button"
                  onClick={handleProceedToVerify}
                  disabled={previewQuestions.length === 0 && questions.length === 0}
                  className={`px-5 py-2.5 rounded-full font-semibold text-xs flex items-center gap-2 transition cursor-pointer active:scale-98 ${
                    previewQuestions.length > 0 || questions.length > 0
                      ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-xs hover:bg-black dark:hover:bg-zinc-100'
                      : 'opacity-40 cursor-not-allowed bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  <span>Next: Verify & Save ({previewQuestions.length || questions.length} Qs)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            STEP 2: VERIFICATION & SAVE (Questions Review & Editing)
        ───────────────────────────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="space-y-6 relative z-10">
            {/* Header Summary Strip */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-[#0c182b]/90 backdrop-blur-xl border border-white/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white font-['Outfit',sans-serif]">
                  {name || 'Untitled Exam'}
                </h3>
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 mt-0.5">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Grade {grade}</span>
                  <span>•</span>
                  <span>{subject || 'General'}</span>
                  {topic && (
                    <>
                      <span>•</span>
                      <span>{topic}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{timeLimit}m</span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-500/30">
                  {questionsStats.total} Questions
                </span>
                {questionsStats.withFormulas > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium text-xs border border-emerald-500/20 hidden sm:inline-flex">
                    {questionsStats.withFormulas} KaTeX
                  </span>
                )}
                {questionsStats.withSolutions > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 font-medium text-xs border border-zinc-200/80 dark:border-white/10 hidden sm:inline-flex">
                    {questionsStats.withSolutions} Solutions
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1 cursor-pointer active:scale-98 transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-black" />
                  <span>Add Question</span>
                </button>
              </div>
            </div>

            {/* Filter & View Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/70 dark:bg-[#0c182b]/80 backdrop-blur-md border border-white/80 dark:border-white/10 shadow-2xs">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-black dark:text-white absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions by formula, keywords or options..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white/90 dark:bg-[#08111e]/90 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    <X className="w-3 h-3 text-black dark:text-white" />
                  </button>
                )}
              </div>

              {/* View Control Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 justify-end">
                <button
                  type="button"
                  onClick={toggleAllPreviews}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-98 ${
                    isAllPreviewOpen
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-white dark:bg-[#0c182b] border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#0f1d33]'
                  }`}
                  title={isAllPreviewOpen ? 'Hide all live math previews' : 'Preview all questions with rendered KaTeX'}
                >
                  {isAllPreviewOpen ? (
                    <EyeOff className="w-3.5 h-3.5 text-black dark:text-white" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-black dark:text-white" />
                  )}
                  <span>{isAllPreviewOpen ? 'Hide Math' : 'Preview KaTeX'}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleAllExpanded}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer active:scale-98 ${
                    isAllExpanded
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-white dark:bg-[#0c182b] border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#0f1d33]'
                  }`}
                  title={isAllExpanded ? 'Collapse all questions' : 'Expand all questions for full review'}
                >
                  {isAllExpanded ? (
                    <Minimize2 className="w-3.5 h-3.5 text-black dark:text-white" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5 text-black dark:text-white" />
                  )}
                  <span>{isAllExpanded ? 'Collapse' : 'Expand All'}</span>
                </button>
              </div>
            </div>

            {/* Question List */}
            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-white/10 bg-white/40 dark:bg-[#08111e]/40 space-y-2">
                <Search className="w-8 h-8 text-black dark:text-white mx-auto" />
                <p className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  No questions match "{searchQuery}"
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Clear search filter
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuestions.map(({ q, originalIndex }) => {
                  const isExpanded = isAllExpanded || expandedIndex === originalIndex;
                  return (
                    <div
                      key={q.id || originalIndex}
                      className="rounded-2xl border border-white/80 dark:border-white/10 bg-white/80 dark:bg-[#0c182b]/90 backdrop-blur-md shadow-2xs overflow-hidden"
                    >
                      {/* Accordion Row */}
                      <div
                        onClick={() => setExpandedIndex(isExpanded && !isAllExpanded ? -1 : originalIndex)}
                        className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-[#08111e]/80 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {originalIndex + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                            {q.text.trim() ? q.text : <span className="text-zinc-400 italic">Empty question prompt...</span>}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleQuestionPreview(originalIndex);
                            }}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              previewingIndices[originalIndex]
                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                : 'text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                            }`}
                            title={previewingIndices[originalIndex] ? 'Hide live preview' : 'Preview KaTeX math'}
                          >
                            {previewingIndices[originalIndex] ? <EyeOff className="w-3.5 h-3.5 text-black dark:text-white" /> : <Eye className="w-3.5 h-3.5 text-black dark:text-white" />}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateQuestion(originalIndex);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                            title="Duplicate question"
                          >
                            <Copy className="w-3.5 h-3.5 text-black dark:text-white" />
                          </button>

                          {questions.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveQuestion(originalIndex);
                              }}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 transition cursor-pointer"
                              title="Delete question"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-black dark:text-white" />
                            </button>
                          )}

                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-black dark:text-white" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-black dark:text-white" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Edit Form */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 pt-2 border-t border-zinc-100 dark:border-white/5 space-y-3.5 bg-zinc-50/50 dark:bg-[#08111e]/40">
                          {/* Live Preview Box */}
                          {previewingIndices[originalIndex] && (
                            <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#0c182b] border border-emerald-500/30 text-xs space-y-2 shadow-xs">
                              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                <span className="flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-black dark:text-white" />
                                  <span>Live Math Preview</span>
                                </span>
                                <span>Correct: Option {String.fromCharCode(65 + q.correct)}</span>
                              </div>
                              <div className="text-zinc-900 dark:text-white font-medium">
                                <MathRenderer content={q.text || '*(No question text entered yet)*'} />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                {q.options.map((opt, oIdx) => (
                                  <div
                                    key={oIdx}
                                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                                      q.correct === oIdx
                                        ? 'border-emerald-500 bg-emerald-500/10 font-semibold'
                                        : 'border-zinc-200/80 dark:border-white/10 bg-white/80 dark:bg-[#08111e]/60'
                                    }`}
                                  >
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                      q.correct === oIdx ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                                    }`}>
                                      {String.fromCharCode(65 + oIdx)}
                                    </span>
                                    <div className="min-w-0 flex-1 truncate">
                                      <MathRenderer content={opt || `Option ${String.fromCharCode(65 + oIdx)}`} inline />
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {q.explanation && (
                                <div className="pt-2 border-t border-zinc-200/80 dark:border-white/10 text-zinc-600 dark:text-zinc-400">
                                  <span className="font-bold text-[10px] uppercase text-emerald-600 dark:text-emerald-400 block mb-0.5">Solution:</span>
                                  <MathRenderer content={q.explanation} />
                                </div>
                              )}
                            </div>
                          )}

                          {/* Prompt */}
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                Question Prompt
                              </label>
                              <div className="flex items-center gap-1 flex-wrap">
                                {[
                                  { label: '½ frac', code: '\\(\\frac{a}{b}\\)' },
                                  { label: '√ root', code: '\\(\\sqrt{x}\\)' },
                                  { label: 'x² pow', code: '\\(x^2\\)' },
                                  { label: '±', code: '\\(\\pm\\)' },
                                  { label: '×', code: '\\(\\times\\)' },
                                  { label: 'π', code: '\\(\\pi\\)' },
                                  { label: 'display eq', code: '\\[ E_k = \\frac{1}{2}mv^2 \\]' },
                                ].map((sc) => (
                                  <button
                                    key={sc.label}
                                    type="button"
                                    onClick={() => insertFormulaToQuestion(originalIndex, sc.code, 'text')}
                                    className="px-2 py-0.5 rounded-full bg-white dark:bg-[#0c182b] hover:bg-emerald-500/15 dark:hover:bg-emerald-500/20 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono border border-zinc-200/80 dark:border-white/10 cursor-pointer shadow-2xs transition"
                                  >
                                    {sc.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <textarea
                              rows={2}
                              value={q.text}
                              onChange={(e) => updateQuestionText(originalIndex, e.target.value)}
                              placeholder="Question prompt or math formula..."
                              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-2xl bg-white/90 dark:bg-[#08111e]/90 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 shadow-2xs"
                            />
                          </div>

                          {/* Options */}
                          <div className="space-y-2">
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                              Options (Click circle to set correct answer)
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {q.options.map((opt, optIndex) => {
                                const isCorrect = q.correct === optIndex;
                                const char = String.fromCharCode(65 + optIndex);

                                return (
                                  <div
                                    key={optIndex}
                                    className={`flex items-center gap-2 p-2.5 rounded-2xl border transition ${
                                      isCorrect
                                        ? 'border-emerald-500 bg-emerald-500/10'
                                        : 'border-zinc-200/80 dark:border-white/10 bg-white/90 dark:bg-[#08111e]/90'
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => updateCorrectOption(originalIndex, optIndex)}
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition cursor-pointer ${
                                        isCorrect
                                          ? 'bg-emerald-500 text-zinc-950 font-extrabold shadow-2xs'
                                          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-500/30'
                                      }`}
                                      title={`Mark ${char} as correct`}
                                    >
                                      {isCorrect ? '✓' : char}
                                    </button>

                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => updateOptionText(originalIndex, optIndex, e.target.value)}
                                      placeholder={`Option ${char}`}
                                      className="w-full text-xs sm:text-sm bg-transparent border-none text-zinc-900 dark:text-white focus:outline-hidden placeholder-zinc-400"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Solution */}
                          <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                              Step-by-step Solution (Optional)
                            </label>
                            <textarea
                              rows={2}
                              value={q.explanation || ''}
                              onChange={(e) => updateExplanation(originalIndex, e.target.value)}
                              placeholder="Reasoning, derivation, or formula proof..."
                              className="w-full px-3.5 py-2 text-xs rounded-2xl bg-white/90 dark:bg-[#08111e]/90 border border-zinc-200/80 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 resize-none shadow-2xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-[#0c182b]/90 backdrop-blur-xl border border-white/80 dark:border-white/10 shadow-xs flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-full border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#08111e] transition active:scale-98"
              >
                <ChevronLeft className="w-4 h-4 text-black dark:text-white" />
                <span>Back to Edit & Paste</span>
              </button>

              <div className="flex items-center gap-2">
                {onOpenDatabaseUpload && (
                  <button
                    type="button"
                    onClick={() => {
                      handleFinalSave();
                      onOpenDatabaseUpload({
                        id: initialExam?.id || 'exam_' + Date.now(),
                        name,
                        subject: subject || 'General',
                        topic: topic || undefined,
                        grade: grade || '12',
                        timeLimit: Number(timeLimit) || 20,
                        questions,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      });
                    }}
                    className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-98 transition shadow-xs hover:bg-emerald-500/20"
                  >
                    <CloudUpload className="w-3.5 h-3.5 text-black dark:text-white" />
                    <span>Publish to Firestore</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleFinalSave}
                  className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition"
                >
                  <Save className="w-3.5 h-3.5 text-black" />
                  <span>Save Exam</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
