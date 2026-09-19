import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FileText,
  HelpCircle,
  Settings,
  CheckCircle2,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileCode,
  Save,
  BookOpen,
  Upload,
  Clock,
  Award,
  Target,
  FileUp,
  Check,
  Edit3,
  ClipboardPaste,
  Crown,
  AlertCircle,
  Clipboard,
  X,
  FileCheck2,
  CloudUpload,
  Database,
  Share2,
  Bot,
  Download,
  Calculator,
  Info,
  Copy,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Exam, Question, SubjectType, DifficultyLevel } from '../types';
import { MathRenderer } from './MathRenderer';
import { UserTierStatus } from '../services/subscriptionLimits';

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

export interface ExtractedExamMetadata {
  name?: string;
  subject?: string;
  grade?: string | number;
  difficulty?: DifficultyLevel;
  subjectType?: SubjectType;
  timeLimit?: number;
  passingScore?: number;
  description?: string;
}

/**
 * Extracts exam details (Name, Subject, Difficulty, Time Limit, Passing Score, Focus)
 * from file headers structured like:
 * ================================================================
 * EXAM: English Grammar Test
 * Subject: English
 * Difficulty: Medium
 * Subject Type: Theory & Concepts
 * Time Limit: 25 minutes
 * Passing Score: 70%
 * Total Questions: 10
 * ================================================================
 */
export const extractExamMetadataFromText = (raw: string): ExtractedExamMetadata => {
  const metadata: ExtractedExamMetadata = {};
  if (!raw || !raw.trim()) return metadata;

  const lines = raw.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('===') || trimmed.startsWith('---') || trimmed.startsWith('***')) {
      continue;
    }

    // Stop extracting if we hit the first numbered question
    if (/^(?:question\s*\d+[:\.]?|\d+[\.\)]|\#+\s*\d+[\.\)]?)\s+[a-zA-Z]/i.test(trimmed)) {
      break;
    }

    // 1. Exam Name / Title
    const nameMatch = trimmed.match(/^(?:EXAM(?:\s*NAME)?|TITLE)\s*[:\-\=]\s*(.+)$/i);
    if (nameMatch && !metadata.name) {
      metadata.name = nameMatch[1].trim();
      continue;
    }

    // 2. Subject Type / Focus (checked before Subject to prevent false match)
    const subjectTypeMatch = trimmed.match(/^SUBJECT\s*TYPE\s*[:\-\=]\s*(.+)$/i);
    if (subjectTypeMatch) {
      const val = subjectTypeMatch[1].toLowerCase();
      if (val.includes('calc') || val.includes('math') || val.includes('problem')) {
        metadata.subjectType = 'calculation';
      } else {
        metadata.subjectType = 'theory';
      }
      continue;
    }

    // 3. Subject Name
    const subjectMatch = trimmed.match(/^SUBJECT\s*[:\-\=]\s*(.+)$/i);
    if (subjectMatch && !metadata.subject) {
      metadata.subject = subjectMatch[1].trim();
      continue;
    }

    // 4. Difficulty Level
    const diffMatch = trimmed.match(/^DIFFICULTY(?:\s*LEVEL)?\s*[:\-\=]\s*(.+)$/i);
    if (diffMatch && !metadata.difficulty) {
      const d = diffMatch[1].toLowerCase();
      if (d.includes('easy')) metadata.difficulty = 'Easy';
      else if (d.includes('hard')) metadata.difficulty = 'Hard';
      else metadata.difficulty = 'Medium';
      continue;
    }

    // 5. Time Limit / Duration
    const timeMatch = trimmed.match(/^(?:TIME(?:\s*LIMIT)?|DURATION)\s*[:\-\=]\s*(\d+)/i);
    if (timeMatch && !metadata.timeLimit) {
      const mins = parseInt(timeMatch[1], 10);
      if (!isNaN(mins) && mins > 0) {
        metadata.timeLimit = mins;
      }
      continue;
    }

    // 6. Passing Score / Pass Mark
    const passMatch = trimmed.match(/^(?:PASSING(?:\s*SCORE)?|PASS\s*MARK|PASS)\s*[:\-\=]\s*(\d+)/i);
    if (passMatch && !metadata.passingScore) {
      const score = parseInt(passMatch[1], 10);
      if (!isNaN(score) && score > 0 && score <= 100) {
        metadata.passingScore = score;
      }
      continue;
    }

    // 7. Description
    const descMatch = trimmed.match(/^DESCRIPTION\s*[:\-\=]\s*(.+)$/i);
    if (descMatch && !metadata.description) {
      metadata.description = descMatch[1].trim();
      continue;
    }

    // 8. Grade / Academic Level
    const gradeMatch = trimmed.match(/^(?:GRADE(?:\s*LEVEL)?|ACADEMIC\s*LEVEL|CLASS)\s*[:\-\=]\s*(.+)$/i);
    if (gradeMatch && !metadata.grade) {
      metadata.grade = gradeMatch[1].trim();
      continue;
    }
  }

  return metadata;
};

// Strips metadata headers and top divider lines before question parsing
export const stripExamHeader = (raw: string): string => {
  let cleaned = raw;
  // Strip top divider block enclosed by ===== or -----
  cleaned = cleaned.replace(/^[=\-\*]{3,}[\s\S]*?[=\-\*]{3,}/m, '');

  // Strip leading lines that are header metadata (EXAM:, Subject:, etc.) before the first question
  const lines = cleaned.split('\n');
  let firstQuestionIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) continue;
    if (/^(?:question\s*\d+[:\.]?|\d+[\.\)]|\#+\s*\d+[\.\)]?)\s+/i.test(l)) {
      firstQuestionIdx = i;
      break;
    }
  }
  if (firstQuestionIdx > 0) {
    cleaned = lines.slice(firstQuestionIdx).join('\n');
  }
  return cleaned;
};

// Robust plain text parser supporting numbered questions, options A-D, answer keys, and explanations
const parsePlainTextRobust = (raw: string): Question[] => {
  const questions: Question[] = [];
  const cleanContent = stripExamHeader(raw);

  let rawBlocks = cleanContent.trim().split(/\n\s*\n+/);
  // If questions are single-spaced, split by question boundary
  if (rawBlocks.length <= 1 && /\n\s*(?:question\s*\d+[:\.]?|\d+[\.\)]|\#+\s*\d+[\.\)]?)\s+/i.test(cleanContent)) {
    rawBlocks = cleanContent.trim().split(/\n(?=\s*(?:question\s*\d+[:\.]?|\d+[\.\)]|\#+\s*\d+[\.\)]?)\s+)/i);
  }

  rawBlocks.forEach((block) => {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) return;

    let text = '';
    let lineIndex = 0;

    const firstLine = lines[0];
    const headerMatch = firstLine.match(/^(?:question\s*\d+[:\.]?|\d+[\.\)]|\#+\s*\d+[\.\)]?)\s*(.*)/i);
    if (headerMatch) {
      text = headerMatch[1].trim() || firstLine;
      lineIndex = 1;
    } else {
      text = firstLine;
      lineIndex = 1;
    }

    while (
      lineIndex < lines.length &&
      !/^[A-D1-4][\)\.\:\-]/i.test(lines[lineIndex]) &&
      !/^\([A-D1-4]\)/i.test(lines[lineIndex]) &&
      !/^(?:answer|ans|correct|explanation|explain):/i.test(lines[lineIndex])
    ) {
      text += ' ' + lines[lineIndex];
      lineIndex++;
    }

    const options: string[] = [];
    let correct = -1;
    let explanation = '';

    for (let i = lineIndex; i < lines.length; i++) {
      const line = lines[i];

      const ansMatch = line.match(/^(?:answer|ans|correct(?:\s*answer)?|key)\s*[:\-\=]\s*\(?([A-D1-4])\)?/i);
      if (ansMatch) {
        const char = ansMatch[1].toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(char)) {
          correct = ['A', 'B', 'C', 'D'].indexOf(char);
        } else {
          const num = parseInt(char, 10) - 1;
          if (num >= 0 && num < 4) correct = num;
        }
        continue;
      }

      const expMatch = line.match(/^(?:explanation|explain|reasoning|\/\/|note|reason)\s*[:\-\=]\s*(.*)/i);
      if (expMatch) {
        explanation = expMatch[1].trim();
        continue;
      }

      const optMatch = line.match(/^(?:\(([A-D1-4])\)|([A-D1-4])[\)\.\:\-])\s*(.*)/i);
      if (optMatch) {
        const char = (optMatch[1] || optMatch[2]).toUpperCase();
        let letterIdx = ['A', 'B', 'C', 'D'].indexOf(char);
        if (letterIdx === -1) {
          letterIdx = parseInt(char, 10) - 1;
        }
        let optText = optMatch[3].trim();

        if (optText.endsWith('*')) {
          optText = optText.slice(0, -1).trim();
          if (letterIdx >= 0 && letterIdx < 4) correct = letterIdx;
        } else if (optText.includes('[correct]') || optText.includes('(correct)')) {
          optText = optText.replace(/\[correct\]|\(correct\)/gi, '').trim();
          if (letterIdx >= 0 && letterIdx < 4) correct = letterIdx;
        }

        options.push(optText);
      } else if (explanation) {
        explanation += ' ' + line;
      }
    }

    if (text.trim() && options.length >= 2) {
      while (options.length < 4) {
        options.push(`Option ${String.fromCharCode(65 + options.length)}`);
      }

      questions.push({
        id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        text: text.trim(),
        options: options.slice(0, 4),
        correct: correct >= 0 && correct < 4 ? correct : 0,
        explanation: explanation.trim(),
      });
    }
  });

  return questions;
};

export const CreateExamWizard: React.FC<CreateExamWizardProps> = ({
  initialExam,
  initialMode,
  onSaveExam,
  onCancel,
  onOpenPasteModal,
  onOpenProfessorModal,
  userTier,
  onOpenSubscriptionModal,
  onOpenDatabaseUpload,
  isAdmin = false,
}) => {
  // If editing an existing exam, start in manual wizard; otherwise prompt selection mode or passed initialMode
  const [creationMode, setCreationMode] = useState<'select' | 'manual' | 'paste'>(
    initialExam ? 'manual' : (initialMode || 'select')
  );

  const [currentStep, setCurrentStep] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState(initialExam?.name || '');
  const [subject, setSubject] = useState(initialExam?.subject || '');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialExam?.difficulty || 'Medium');
  const [timeLimit, setTimeLimit] = useState<number>(initialExam?.timeLimit || 25);
  const [passingScore, setPassingScore] = useState<number>(initialExam?.passingScore || 70);
  const [subjectType, setSubjectType] = useState<SubjectType>(initialExam?.subjectType || 'theory');
  const [description, setDescription] = useState(initialExam?.description || '');
  const [grade, setGrade] = useState<string | number | undefined>(initialExam?.grade);

  const [questions, setQuestions] = useState<Question[]>(() => {
    if (initialExam?.questions && initialExam.questions.length > 0) {
      return JSON.parse(JSON.stringify(initialExam.questions));
    }
    return [
      {
        id: 'q_' + Date.now(),
        text: '',
        options: ['', '', '', ''],
        correct: 0,
        explanation: '',
      },
    ];
  });

  const [expandedIndex, setExpandedIndex] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick Tips for Students
  const [showTips, setShowTips] = useState<boolean>(() => {
    return localStorage.getItem('hide_create_tips') !== 'true';
  });
  const [isMathTipsExpanded, setIsMathTipsExpanded] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);
  const [testFormula, setTestFormula] = useState<string>('\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');

  const samplePrompt = `Please generate 10 multiple choice questions in plain .txt format for [Subject & Topic, e.g. Grade 12 Physics Electromagnetism or Freshman Math Limits].

OUTPUT RULES:
1. Output pure plain text (.txt format). No markdown code blocks, no greetings or conversational text.
2. Put an asterisk (*) right after the correct option letter, like: C* The electric field is zero.
3. For math and science formulas, use standard LaTeX like \\( \\frac{a}{b} \\) or \\( x^2 \\).
4. VERTICAL STEP-BY-STEP EXPLANATIONS: For math questions, write the calculation vertically step-by-step with each step on its own line (not in one horizontal sentence).`;

  const formulaShortcuts = [
    { label: 'Fraction', code: '\\frac{a}{b}' },
    { label: 'Square Root', code: '\\sqrt{x}' },
    { label: 'Power / Exponent', code: 'x^2 + y^2 = r^2' },
    { label: 'Plus or Minus', code: '\\pm' },
    { label: 'Multiplication', code: '\\times' },
    { label: 'Greek Symbols', code: '\\alpha, \\beta, \\theta, \\pi, \\Delta' },
    { label: 'Integration', code: '\\int_{a}^{b} f(x) dx' },
    { label: 'Limit', code: '\\lim_{x \\to 0} \\frac{\\sin(x)}{x} = 1' },
  ];

  const handleCopyFormula = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFormula(code);
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  // Synchronize state whenever initialExam or initialMode changes
  useEffect(() => {
    if (initialExam) {
      setCreationMode('manual');
      setName(initialExam.name || '');
      setSubject(initialExam.subject || '');
      setDifficulty(initialExam.difficulty || 'Medium');
      setTimeLimit(initialExam.timeLimit || 25);
      setPassingScore(initialExam.passingScore || 70);
      setSubjectType(initialExam.subjectType || 'theory');
      setDescription(initialExam.description || '');
      setGrade(initialExam.grade);
      if (initialExam.questions && initialExam.questions.length > 0) {
        setQuestions(JSON.parse(JSON.stringify(initialExam.questions)));
      } else {
        setQuestions([
          {
            id: 'q_' + Date.now(),
            text: '',
            options: ['', '', '', ''],
            correct: 0,
            explanation: '',
          },
        ]);
      }
      setCurrentStep(1);
      setErrorMsg(null);
      setSuccessMsg(null);
    } else if (initialMode) {
      setCreationMode(initialMode);
    }
  }, [initialExam, initialMode]);

  // Paste Text view internal state
  const [pasteRawText, setPasteRawText] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Automatically extract exam details (Name, Subject, Difficulty, Time Limit, etc.) from editor text in real-time
  const extractedMeta = useMemo(() => extractExamMetadataFromText(pasteRawText), [pasteRawText]);

  const maxManualQuestions = userTier?.maxQuestionsPerExam ?? 20;
  const maxImportQuestions = userTier?.maxImportQuestions ?? 20;
  const isPremium = userTier?.isPremium ?? false;

  // Real-time parsing of pasted / imported text into preview questions
  useEffect(() => {
    const trimmed = pasteRawText.trim();
    if (!trimmed) {
      setParsingError(null);
      setPreviewQuestions([]);
      return;
    }

    const parsed = parsePlainTextRobust(trimmed);
    if (parsed.length > 0) {
      setParsingError(null);
      setPreviewQuestions(parsed);
    } else {
      setParsingError(
        'Unable to recognize questions. Ensure questions are numbered (e.g. 1. Question), options start with A) B) C) D), and answers are indicated (e.g. Answer: C).'
      );
      setPreviewQuestions([]);
    }
  }, [pasteRawText]);

  // Handle .txt file import -> Loads directly into the text editor & extracts exam details
  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      // 1. Paste imported content directly into text editor
      setPasteRawText(content);

      // 2. Extract and prefill metadata from file header if present
      const meta = extractExamMetadataFromText(content);
      if (meta.name) setName(meta.name);
      if (meta.subject) setSubject(meta.subject);
      if (meta.difficulty) setDifficulty(meta.difficulty);
      if (meta.subjectType) setSubjectType(meta.subjectType);
      if (meta.timeLimit) setTimeLimit(meta.timeLimit);
      if (meta.passingScore) setPassingScore(meta.passingScore);
      if (meta.description) setDescription(meta.description);

      // 3. Switch to Paste Text workspace so user can review and edit in the text editor
      setCreationMode('paste');

      const linesCount = content.split('\n').length;
      const detailsMsg = meta.name
        ? ` • Detected Exam: "${meta.name}" (${meta.subject || 'General'}, ${meta.difficulty || 'Medium'})`
        : '';
      setSuccessMsg(`Imported "${file.name}" (${linesCount} lines) into editor${detailsMsg}.`);
      setTimeout(() => setSuccessMsg(null), 6000);
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = '';
  };

  // Clipboard Paste Helper
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPasteRawText((prev) => (prev ? prev + '\n\n' + text : text));
        setSuccessMsg('Pasted content from clipboard into editor!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch {
      setErrorMsg('Could not read clipboard. Please paste manually into the editor.');
    }
  };

  // Sample format preset: Exact header structure and standard numbered questions
  const handleInsertSampleText = () => {
    setPasteRawText(`================================================================
EXAM: English Grammar & Syntax Test
Subject: English
Difficulty: Medium
Subject Type: Theory & Concepts
Time Limit: 25 minutes
Passing Score: 70%
Total Questions: 2
================================================================

1. By the time we arrived at the station, the train ______.
   A) already leaves
   B) has already left
   C) had already left
   D) was already leaving
   Answer: C
   Explanation: The past perfect (had + past participle) is used for an action that happened before another past action.

2. She ______ in London for five years before she moved to Paris.
   A) lives
   B) lived
   C) has lived
   D) is living
   Answer: B
   Explanation: The simple past is used for a completed period of time in the past that has no connection to the present.`);
  };

  // Preset for Freshman Applied Mathematics I (5 questions)
  const handleInsertFreshmanMathSample = () => {
    setPasteRawText(`================================================================
EXAM: Applied Mathematics I - Freshman Evaluation Exam
Subject: Applied Mathematics
Grade: Freshman
Difficulty: Medium
Subject Type: Calculation & Analytical
Time Limit: 30 minutes
Passing Score: 70%
Total Questions: 5
Description: Ethiopian University Freshman Applied Mathematics I test questions covering Limits, Calculus & Chain Rule, Integration by Parts, Matrices & Invertibility, and Optimization.
================================================================

1. Evaluate the limit: lim (x -> 0) [sin(3x) / (e^(2x) - 1)]
   A) 3/2
   B) 2/3
   C) 1
   D) 0
   Answer: A
   Explanation: Using L'Hopital's Rule for the 0/0 indeterminate form: differentiate the numerator d/dx[sin(3x)] = 3*cos(3x) and denominator d/dx[e^(2x) - 1] = 2*e^(2x). Evaluating at x = 0 yields (3 * 1) / (2 * 1) = 3/2. Alternatively, rewrite as [sin(3x)/(3x)] * [2x/(e^(2x)-1)] * (3/2) = 1 * 1 * (3/2) = 3/2.

2. Given the function f(x) = ln(x^2 + 1), what is the equation of the tangent line to the graph of f(x) at x = 1?
   A) y = x - 1 + ln(2)
   B) y = 2x - 2 + ln(2)
   C) y = x + ln(2)
   D) y = 2x + ln(2)
   Answer: A
   Explanation: At x = 1, y0 = f(1) = ln(1^2 + 1) = ln(2). Taking the derivative via chain rule gives f'(x) = 2x / (x^2 + 1). At x = 1, the slope m = f'(1) = 2(1) / (1 + 1) = 1. Using the point-slope form y - y0 = m(x - x0): y - ln(2) = 1(x - 1), which simplifies to y = x - 1 + ln(2).

3. Evaluate the definite integral: Integral from 0 to 1 of [x * e^(2x)] dx
   A) (e^2 + 1) / 4
   B) (e^2 - 1) / 4
   C) (e^2 + 1) / 2
   D) (e^2 - 2) / 4
   Answer: A
   Explanation: Using integration by parts with formula Integral(u dv) = u*v - Integral(v du). Set u = x -> du = dx, and dv = e^(2x) dx -> v = (1/2)*e^(2x). Then Integral[x*e^(2x) dx] = (1/2)*x*e^(2x) - (1/4)*e^(2x). Evaluating from 0 to 1: At x = 1, we get (1/2)*e^2 - (1/4)*e^2 = (1/4)*e^2. At x = 0, we get 0 - (1/4)*(1) = -1/4. Subtracting gives (1/4)*e^2 - (-1/4) = (e^2 + 1) / 4.

4. For what real value of k is the 2x2 matrix A = [[2, k], [4, 6]] singular (non-invertible)?
   A) k = 3
   B) k = -3
   C) k = 12
   D) k = 0
   Answer: A
   Explanation: A square matrix is singular if and only if its determinant equals zero. det(A) = (2)(6) - (4)(k) = 12 - 4k. Setting det(A) = 0 gives 12 - 4k = 0 -> 4k = 12 -> k = 3.

5. An open-top rectangular box with a square base is designed to hold a fixed volume of 32 m^3. What base side length x minimizes the surface area of the material used?
   A) 4 m
   B) 2 m
   C) 8 m
   D) sqrt(32) m
   Answer: A
   Explanation: Volume V = x^2 * h = 32 -> h = 32 / x^2. The surface area S of the open box is base area + 4 side walls: S(x) = x^2 + 4xh = x^2 + 4x(32 / x^2) = x^2 + 128/x. The first derivative is S'(x) = 2x - 128/x^2. Setting S'(x) = 0 gives 2x = 128/x^2 -> 2x^3 = 128 -> x^3 = 64 -> x = 4 m. S''(4) = 2 + 256/(4^3) = 6 > 0, confirming a minimum.`);
  };

  // Import parsed questions and extract exam details (Name, Subject, Difficulty, Time, Passing Score)
  const handleImportParsedQuestions = (onlyWithinLimit: boolean = false) => {
    if (previewQuestions.length === 0) {
      setErrorMsg('No valid questions to import. Please review your text format in the editor above.');
      return;
    }

    // 1. Extract and apply metadata details from header block
    const meta = extractExamMetadataFromText(pasteRawText);
    if (meta.name) setName(meta.name);
    if (meta.subject) setSubject(meta.subject);
    if (meta.difficulty) setDifficulty(meta.difficulty);
    if (meta.subjectType) setSubjectType(meta.subjectType);
    if (meta.timeLimit) setTimeLimit(meta.timeLimit);
    if (meta.passingScore) setPassingScore(meta.passingScore);
    if (meta.description) setDescription(meta.description);
    if (meta.grade) setGrade(meta.grade);

    let toAdd = previewQuestions;
    if (onlyWithinLimit || (!isPremium && toAdd.length > maxImportQuestions)) {
      toAdd = toAdd.slice(0, maxImportQuestions);
      setSuccessMsg(
        `Imported ${toAdd.length} questions (${userTier?.isTrial ? '5-Day Trial' : 'Free'} limit: ${maxImportQuestions} questions/exam). Details applied: ${meta.name || name || 'Exam'}.`
      );
    } else {
      const detailsMsg = meta.name
        ? ` • Exam Details applied: "${meta.name}" (${meta.subject || subject || 'General'}, ${meta.timeLimit || timeLimit} min)`
        : '';
      setSuccessMsg(`Imported ${toAdd.length} questions into exam${detailsMsg}!`);
    }

    if (toAdd.length === 0) {
      setErrorMsg(`Limit reached (${maxImportQuestions} questions). Upgrade to Premium in ETB to import more questions.`);
      return;
    }

    // 2. Populate questions
    if (questions.length === 1 && !questions[0].text.trim()) {
      setQuestions(toAdd);
    } else {
      setQuestions([...questions, ...toAdd]);
    }

    // 3. Return to manual wizard: if title exists (from extracted header or manual input), proceed to Step 2 (Questions)
    setCreationMode('manual');
    if (meta.name || name.trim()) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  // Direct instant save to local storage: bypasses manual steps and adds to app immediately
  const handleInstantSaveFromPaste = (onlyWithinLimit: boolean = false) => {
    if (previewQuestions.length === 0) {
      setErrorMsg('No valid questions found to save. Please review the editor format above.');
      return;
    }

    let toSave = previewQuestions;
    const isExceeding = !isPremium && previewQuestions.length > maxImportQuestions;
    if (isExceeding) {
      if (onlyWithinLimit) {
        toSave = previewQuestions.slice(0, maxImportQuestions);
      } else {
        setErrorMsg(
          `Your ${userTier?.isTrial ? '5-Day Trial' : 'Free'} plan allows up to ${maxImportQuestions} questions per exam (found ${previewQuestions.length}). Please choose "Save First ${maxImportQuestions} Instantly" or upgrade to Premium in ETB.`
        );
        return;
      }
    }

    const meta = extractExamMetadataFromText(pasteRawText);
    const examData: Exam = {
      id: initialExam?.id || 'exam_' + Date.now(),
      name: (meta.name || name).trim() || 'Imported Exam',
      subject: (meta.subject || subject).trim() || 'General',
      difficulty: meta.difficulty || difficulty,
      timeLimit: meta.timeLimit || Number(timeLimit) || 25,
      passingScore: meta.passingScore || Number(passingScore) || 70,
      subjectType: meta.subjectType || subjectType,
      grade: meta.grade || grade || initialExam?.grade,
      description: (meta.description || description).trim(),
      questions: toSave,
      createdAt: initialExam?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveExam(examData);
  };

  const handleAddQuestion = () => {
    if (!isPremium && questions.length >= maxManualQuestions) {
      setErrorMsg(
        `Question limit reached (${maxManualQuestions} questions on your ${
          userTier?.isTrial ? '5-Day Trial' : 'Free'
        } plan). Upgrade to Premium in ETB to create exams with unlimited questions!`
      );
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

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
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

  const validateStep1 = () => {
    if (!name.trim()) {
      setErrorMsg('Please specify an Exam Title.');
      setCurrentStep(1);
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const validateStep2 = () => {
    if (questions.length === 0) {
      setErrorMsg('Please add at least one question.');
      setCurrentStep(2);
      return false;
    }
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        setErrorMsg(`Question ${i + 1} text cannot be empty.`);
        setExpandedIndex(i);
        setCurrentStep(2);
        return false;
      }
      for (let j = 0; j < questions[i].options.length; j++) {
        if (!questions[i].options[j]?.trim()) {
          setErrorMsg(`Question ${i + 1}: Option ${String.fromCharCode(65 + j)} is empty.`);
          setExpandedIndex(i);
          setCurrentStep(2);
          return false;
        }
      }
    }
    setErrorMsg(null);
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    }
  };

  const handleSave = () => {
    if (!validateStep1() || !validateStep2()) return;

    const examData: Exam = {
      id: initialExam?.id || 'exam_' + Date.now(),
      name: name.trim(),
      subject: subject.trim() || 'General',
      difficulty,
      timeLimit: Number(timeLimit) || 20,
      passingScore: Number(passingScore) || 70,
      subjectType,
      grade: grade || initialExam?.grade,
      description: description.trim(),
      questions,
      createdAt: initialExam?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveExam(examData);
  };

  // 1. Initial Selection Screen: "Manual" or "Paste Text File"
  if (creationMode === 'select') {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
                Create Exam
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Choose how you would like to compose your exam
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {/* Freemium Tier Status Info Card */}
        {userTier && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
              userTier.isPremium
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                : userTier.isTrial
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-300'
                : 'bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Crown className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold block">
                  {userTier.isPremium
                    ? '👑 Premium Scholar Active'
                    : userTier.isTrial
                    ? `🎁 3-Day Welcome Trial Active (${userTier.trialDaysRemaining} days remaining)`
                    : userTier.isGuest
                    ? '👤 Guest Mode (Local Storage)'
                    : '🎓 Free Student Tier (Cloud Synced)'}
                </span>
                <span className="text-[11px] opacity-85">
                  {userTier.isPremium
                    ? 'Create & import unlimited questions with full step-by-step LaTeX math solutions.'
                    : userTier.isTrial
                    ? `Up to ${userTier.maxQuestionsPerExam} questions per exam and full import support.`
                    : userTier.isGuest
                    ? `Up to ${userTier.maxQuestionsPerExam} questions per exam. Sign in to activate your 3-Day Welcome Trial (50 questions)!`
                    : `Up to ${userTier.maxQuestionsPerExam} questions per exam. Upgrade for unlimited bulk imports.`}
                </span>
              </div>
            </div>

            {!userTier.isPremium && onOpenSubscriptionModal && (
              <button
                type="button"
                onClick={onOpenSubscriptionModal}
                className="px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-[11px] shrink-0 cursor-pointer shadow-xs transition"
              >
                Upgrade in ETB
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Option A: Manual Creation */}
          <button
            type="button"
            onClick={() => {
              setCreationMode('manual');
              setCurrentStep(1);
            }}
            className="p-6 rounded-[24px] bg-white dark:bg-[#0c1626] border border-zinc-200/80 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-md transition text-left group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Edit3 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold font-['Syne',sans-serif] text-zinc-900 dark:text-white mb-1">
                Manual
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Step-by-step wizard to specify exam details, questions, options, and solutions manually.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span>Start wizard</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Option B: Question Text Editor */}
          <button
            type="button"
            onClick={() => {
              setCreationMode('paste');
            }}
            className="p-6 rounded-[24px] bg-white dark:bg-[#0c1626] border border-zinc-200/80 dark:border-white/10 hover:border-blue-500/50 hover:shadow-md transition text-left group cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold font-['Syne',sans-serif] text-zinc-900 dark:text-white mb-1">
                Question Text Editor
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Import .txt files, type or paste questions directly with real-time formatting and parsing.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
              <span>Open editor</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        {/* Interactive Tips for Creating Questions */}
        <div className="rounded-3xl bg-white dark:bg-[#0c1626] border border-zinc-200/80 dark:border-white/10 shadow-xs overflow-hidden">
          <div className="p-5 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                  Tips for Creating Questions
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Quick, calm guide on adding questions and formulas
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !showTips;
                setShowTips(next);
                localStorage.setItem('hide_create_tips', (!next).toString());
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>{showTips ? 'Hide Tips' : 'Show Tips'}</span>
              {showTips ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showTips && (
            <div className="p-5 space-y-4 text-xs font-['Plus_Jakarta_Sans',sans-serif]">
              {/* Calm Banner Text */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800">
                <p className="text-zinc-700 dark:text-zinc-300 font-normal leading-relaxed">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">ExamMaster</span> is comprehensive — you can create any question and practice prepared exams in an interactive app, for all grade level students.
                </p>
              </div>

              {/* 3 Ways to Add Questions */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  You can add questions in this app in three ways:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800">
                    <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 mb-1">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] flex items-center justify-center font-bold">1</span>
                      <span>Manually</span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                      Add each question manually while reading textbooks or after studying.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800">
                    <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 mb-1">
                      <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] flex items-center justify-center font-bold">2</span>
                      <span>Copy & Paste from AI</span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                      Copy questions created by any AI like Claude, Gemini, ChatGPT, or DeepSeek.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800">
                    <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 mb-1">
                      <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] flex items-center justify-center font-bold">3</span>
                      <span>Import .txt Files</span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                      Import questions shared by friends or downloaded from Telegram channels.
                    </p>
                  </div>
                </div>
              </div>

              {/* Share Created Questions */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5">
                <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-zinc-700 dark:text-zinc-300 text-[11px] leading-relaxed">
                  <strong>Share with friends:</strong> You can share your created questions with friends so everyone can practice together by clicking the <strong>Export</strong> button on your exam card in the Library!
                </p>
              </div>

              {/* Ready to Use AI Prompt */}
              <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span className="font-bold text-purple-900 dark:text-purple-200 text-xs">
                      Ready-To-Use AI Prompt
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(samplePrompt);
                      setCopiedPrompt(true);
                      setTimeout(() => setCopiedPrompt(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[10px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-[11px]">
                  Copy prompts to AI to create your questions, then paste them back here.
                </p>
              </div>

              {/* Expandable Math & Science Formula Help */}
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsMathTipsExpanded((prev) => !prev)}
                  className="w-full p-3 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/40 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold text-zinc-900 dark:text-white text-xs">
                      Math & Science Formulas Help
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                    <span>{isMathTipsExpanded ? 'Collapse' : 'Expand'}</span>
                    {isMathTipsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </div>
                </button>

                {isMathTipsExpanded && (
                  <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 space-y-3 bg-white dark:bg-[#0c1626]">
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Hint: This type of formula code helps just for creating manual questions.</span>
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {formulaShortcuts.map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => handleCopyFormula(item.code)}
                          className="px-2 py-1 rounded-lg text-[11px] bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 cursor-pointer transition"
                          title={`Copy ${item.code}`}
                        >
                          {copiedFormula === item.code ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 text-zinc-400" />
                          )}
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. "Question Text Editor" Screen: Exam Professor at TOP, Text Editor & Bulk Features at BOTTOM
  if (creationMode === 'paste') {
    const isExceedingLimit = !isPremium && previewQuestions.length > maxImportQuestions;

    return (
      <div className="max-w-4xl mx-auto space-y-5 pb-12">
        {/* Hidden File Input for .txt import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setCreationMode('select')}
              className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition cursor-pointer"
              title="Back to options"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
                Question Text Editor
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Import .txt files or type & paste questions directly with real-time formatting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCreationMode('manual')}
              className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Switch to Manual
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* System Messages */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button type="button" onClick={() => setErrorMsg(null)} className="cursor-pointer p-1 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              {successMsg}
            </span>
            <button type="button" onClick={() => setSuccessMsg(null)} className="cursor-pointer p-1 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TOP SECTION: Exam Professor Button */}
        <div className="p-4 sm:p-5 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white flex items-center gap-2">
                <span>Exam Professor</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  AI Prompt Builder
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                Generate tailored .txt exam prompts for ChatGPT, Claude, Gemini, or DeepSeek.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenProfessorModal}
            className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Open Exam Professor</span>
          </button>
        </div>

        {/* BOTTOM SECTION: Integrated Text Editor & Bulk Parser Workspace */}
        <div className="p-5 rounded-[24px] bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4">
          {/* Header Row: Clean title without clutter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <ClipboardPaste className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Questions Text Editor
                </h2>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Type, paste, or import questions with exam header details (EXAM, Subject, Time Limit, etc.)
                </p>
              </div>
            </div>
          </div>

          {/* Action Bar: Import .txt, Paste Clipboard, Sample Preset */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {/* Import .txt File button */}
              <button
                type="button"
                onClick={handleTriggerFileInput}
                className="px-3.5 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                title="Import .txt file with exam details and questions directly into editor"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Import .txt File</span>
              </button>

              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                title="Paste from clipboard"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste Clipboard</span>
              </button>
            </div>

            {/* Presets & Clear */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleInsertFreshmanMathSample}
                className="px-3 py-1.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-2xs"
                title="Insert 5 Freshman Applied Mathematics I exam questions"
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-500" />
                <span>Freshman Math (5 Qs)</span>
              </button>

              <button
                type="button"
                onClick={handleInsertSampleText}
                className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold cursor-pointer transition flex items-center gap-1.5"
                title="Insert standard exam format sample with header metadata"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-500" />
                <span>Grammar Sample</span>
              </button>

              {pasteRawText && (
                <button
                  type="button"
                  onClick={() => setPasteRawText('')}
                  className="px-2.5 py-1.5 rounded-full text-rose-500 hover:bg-rose-500/10 text-xs font-semibold cursor-pointer transition ml-1"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Extracted Exam Details Indicator Card */}
          {(extractedMeta.name || extractedMeta.subject || extractedMeta.grade || extractedMeta.difficulty || extractedMeta.timeLimit || extractedMeta.passingScore) && (
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Detected Exam Header Details
                </span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400">
                  Auto-applies when continuing
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {extractedMeta.name && (
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/60 text-zinc-800 dark:text-zinc-200 font-medium">
                    <strong className="text-blue-600 dark:text-blue-400">Exam:</strong> {extractedMeta.name}
                  </span>
                )}
                {extractedMeta.subject && (
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/60 text-zinc-800 dark:text-zinc-200 font-medium">
                    <strong className="text-blue-600 dark:text-blue-400">Subject:</strong> {extractedMeta.subject}
                  </span>
                )}
                {extractedMeta.grade && (
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold">
                    <strong className="text-emerald-600 dark:text-emerald-400">Level:</strong> {extractedMeta.grade}
                  </span>
                )}
                {extractedMeta.difficulty && (
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/60 text-zinc-800 dark:text-zinc-200 font-medium">
                    <strong className="text-blue-600 dark:text-blue-400">Difficulty:</strong> {extractedMeta.difficulty}
                  </span>
                )}
                {extractedMeta.timeLimit && (
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/60 text-zinc-800 dark:text-zinc-200 font-medium">
                    <strong className="text-blue-600 dark:text-blue-400">Time Limit:</strong> {extractedMeta.timeLimit} min
                  </span>
                )}
                {extractedMeta.passingScore && (
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/60 text-zinc-800 dark:text-zinc-200 font-medium">
                    <strong className="text-blue-600 dark:text-blue-400">Passing Score:</strong> {extractedMeta.passingScore}%
                  </span>
                )}
              </div>
            </div>
          )}

          {/* The Textarea Editor */}
          <div>
            <textarea
              ref={textareaRef}
              rows={13}
              value={pasteRawText}
              onChange={(e) => setPasteRawText(e.target.value)}
              placeholder={`================================================================
EXAM: English Grammar Test
Subject: English
Difficulty: Medium
Subject Type: Theory & Concepts
Time Limit: 25 minutes
Passing Score: 70%
================================================================

1. By the time we arrived at the station, the train ______.
   A) already leaves
   B) has already left
   C) had already left
   D) was already leaving
   Answer: C
   Explanation: The past perfect is used for an action that happened before another past action.

2. She ______ in London for five years before she moved to Paris.
   A) lives
   B) lived
   C) has lived
   D) is living
   Answer: B
   Explanation: The simple past is used for a completed period of time.`}
              className="w-full px-4 py-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-400 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 leading-relaxed shadow-inner"
            />
          </div>

          {/* Stats Bar & Parser Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
            <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 text-[11px]">
              <span>Lines: <strong className="text-zinc-800 dark:text-zinc-200">{pasteRawText ? pasteRawText.split('\n').length : 0}</strong></span>
              <span>•</span>
              <span>Characters: <strong className="text-zinc-800 dark:text-zinc-200">{pasteRawText.length}</strong></span>
            </div>

            {/* Questions count badge */}
            <div className="flex items-center gap-2">
              {previewQuestions.length > 0 ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{previewQuestions.length} Questions Detected</span>
                </span>
              ) : pasteRawText.trim() ? (
                <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Scanning format...</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Parsing error alert */}
          {parsingError && pasteRawText.trim() && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{parsingError}</span>
            </div>
          )}

          {/* Freemium / Trial Limit Warning Banner */}
          {isExceedingLimit && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800 dark:text-amber-200">
                  <Crown className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    Questions Cap Reached ({previewQuestions.length} detected vs. {maxImportQuestions} allowed)
                  </span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Your current {userTier?.isTrial ? '3-Day Trial' : userTier?.isGuest ? 'Guest' : 'Free'} plan allows up to {maxImportQuestions} imported questions per exam. Upgrade to Premium in ETB for unlimited questions!
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleImportParsedQuestions(true)}
                  className="px-3.5 py-1.5 rounded-full bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition cursor-pointer shadow-xs"
                >
                  Import First {maxImportQuestions}
                </button>
                {onOpenSubscriptionModal && (
                  <button
                    type="button"
                    onClick={onOpenSubscriptionModal}
                    className="px-3.5 py-1.5 rounded-full border border-amber-500/40 bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-300 font-bold text-xs hover:bg-amber-50 dark:hover:bg-zinc-700 transition cursor-pointer"
                  >
                    Upgrade in ETB
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Live Preview of Parsed Questions */}
          {previewQuestions.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span>Parsed Questions Preview ({previewQuestions.length})</span>
                </h3>
                <span className="text-[11px] text-zinc-400">
                  KaTeX math formulas rendered live
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                {previewQuestions.map((q, idx) => {
                  const isLocked = !isPremium && idx >= maxImportQuestions;
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border text-xs transition ${
                        isLocked
                          ? 'bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200/50 dark:border-zinc-800/50 opacity-60'
                          : 'bg-zinc-50 dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="font-semibold text-zinc-900 dark:text-white flex items-start gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[11px] shrink-0">
                            Q{idx + 1}
                          </span>
                          <div className="leading-relaxed">
                            <MathRenderer text={q.text} />
                          </div>
                        </div>

                        {isLocked && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-[10px] shrink-0 flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            <span>Requires Premium</span>
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-7">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = optIdx === q.correct;
                          return (
                            <div
                              key={optIdx}
                              className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-2 ${
                                isCorrect
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                                  : 'bg-white dark:bg-zinc-800/60 border-zinc-200/70 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                              }`}
                            >
                              <span className="font-mono text-[10px] font-bold">
                                {String.fromCharCode(65 + optIdx)})
                              </span>
                              <div className="truncate flex-1">
                                <MathRenderer text={opt} />
                              </div>
                              {isCorrect && <Check className="w-3 h-3 text-emerald-500 shrink-0 ml-auto" />}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="mt-2 pl-7 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-start gap-1.5">
                          <span className="font-semibold text-blue-500 shrink-0">Explanation:</span>
                          <div>
                            <MathRenderer text={q.explanation} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setCreationMode('manual')}
                className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition w-full sm:w-auto text-center"
              >
                Switch to Manual
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              {isExceedingLimit ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleInstantSaveFromPaste(true)}
                    className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    title="Save first questions directly to local library and update app instantly"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save First {maxImportQuestions} Instantly</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleImportParsedQuestions(true)}
                    className="px-4 py-2 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition cursor-pointer"
                  >
                    Review First {maxImportQuestions}
                  </button>

                  {onOpenSubscriptionModal && (
                    <button
                      type="button"
                      onClick={onOpenSubscriptionModal}
                      className="px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Upgrade for All {previewQuestions.length}</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {previewQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleInstantSaveFromPaste(false)}
                      className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                      title="Directly save to local storage and add to app instantly"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Exam Instantly</span>
                    </button>
                  )}

                  {isAdmin && onOpenDatabaseUpload && previewQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const meta = extractExamMetadataFromText(pasteRawText);
                        const examData: Exam = {
                          id: initialExam?.id || 'exam_' + Date.now(),
                          name: (meta.name || name).trim() || 'Imported Exam',
                          subject: (meta.subject || subject).trim() || 'General',
                          difficulty: meta.difficulty || difficulty,
                          timeLimit: meta.timeLimit || Number(timeLimit) || 25,
                          passingScore: meta.passingScore || Number(passingScore) || 70,
                          subjectType: meta.subjectType || subjectType,
                          description: (meta.description || description).trim(),
                          questions: previewQuestions,
                          createdAt: initialExam?.createdAt || new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        };
                        onOpenDatabaseUpload(examData);
                      }}
                      className="px-4 py-2.5 rounded-full border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                      title="Upload questions directly to Cloud Firestore"
                    >
                      <CloudUpload className="w-3.5 h-3.5" />
                      <span>Upload to Firestore</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={previewQuestions.length === 0}
                    onClick={() => handleImportParsedQuestions(false)}
                    className={`px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition shadow-xs ${
                      previewQuestions.length > 0
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                    }`}
                  >
                    <span>
                      {previewQuestions.length > 0
                        ? extractedMeta.name
                          ? `Review & Configure "${extractedMeta.name}"`
                          : `Review & Configure (${previewQuestions.length} Qs)`
                        : 'Enter or Paste Questions Above'}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Manual Wizard Flow (Steps 1 to 4)
  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* Hidden File Input for .txt import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
              {initialExam ? 'Edit Exam' : 'Create Exam'}
            </h1>
            {initialExam && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Updating &ldquo;{name || initialExam.name}&rdquo;
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!initialExam && (
            <button
              type="button"
              onClick={() => setCreationMode('select')}
              className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Change Mode
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white px-3 py-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Cancel
          </button>
          {initialExam && (
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
              title="Save changes to this exam"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          )}
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="p-2 rounded-2xl bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-xs">
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { step: 1, label: 'Details', icon: BookOpen },
            { step: 2, label: `Questions (${questions.length})`, icon: HelpCircle },
            { step: 3, label: 'Settings', icon: Settings },
            { step: 4, label: 'Review', icon: CheckCircle2 },
          ].map(({ step, label, icon: Icon }) => {
            const isActive = currentStep === step;
            const isDone = currentStep > step;
            return (
              <button
                key={step}
                type="button"
                onClick={() => {
                  if (step === 1) setCurrentStep(1);
                  else if (step === 2 && validateStep1()) setCurrentStep(2);
                  else if (step === 3 && validateStep1() && validateStep2()) setCurrentStep(3);
                  else if (step === 4 && validateStep1() && validateStep2()) setCurrentStep(4);
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition cursor-pointer text-xs font-semibold ${
                  isActive
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow-xs'
                    : isDone
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                    : 'text-zinc-400 dark:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            {successMsg}
          </span>
          <button type="button" onClick={() => setSuccessMsg(null)} className="cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Step 1: Details */}
      {currentStep === 1 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Exam Title *
              </label>
              <input
                id="exam-title"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Calculus: Limits & Derivatives"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Subject
              </label>
              <input
                id="exam-subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics, Physics, Chemistry"
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Difficulty Level
              </label>
              <select
                id="exam-difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Time Limit (Minutes)
              </label>
              <input
                id="exam-time"
                type="number"
                min="1"
                max="180"
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              id="exam-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Exam instructions or syllabus goals..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              {initialExam && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Next: Questions</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Questions Editor */}
      {currentStep === 2 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-900 dark:text-white">
                Questions ({questions.length}{!isPremium ? ` / ${maxManualQuestions}` : ''})
              </span>
              {userTier && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    userTier.isPremium
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                      : userTier.isTrial
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-400'
                      : 'bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {userTier.isPremium
                    ? '👑 Premium'
                    : userTier.isTrial
                    ? `🎁 Trial: ${userTier.trialDaysRemaining}d left`
                    : '🎓 Free (Max 20)'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Import .txt File button */}
              <button
                type="button"
                onClick={handleTriggerFileInput}
                className="px-3 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 hover:bg-emerald-500/20 cursor-pointer transition"
                title="Import .txt file and paste in editor"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Import .txt File</span>
              </button>

              <button
                type="button"
                onClick={() => setCreationMode('paste')}
                className="px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1.5 hover:bg-blue-500/20 cursor-pointer transition"
                title="Open Paste Text editor workspace"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Paste Text</span>
              </button>

              <button
                type="button"
                onClick={onOpenProfessorModal}
                className="px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center gap-1.5 hover:bg-purple-500/20 cursor-pointer"
                title="Generate prompt"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Prompt</span>
              </button>

              {isAdmin && onOpenDatabaseUpload && questions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (!validateStep1() || !validateStep2()) return;
                    const currentExam: Exam = {
                      id: initialExam?.id || 'exam_' + Date.now(),
                      name: name.trim(),
                      subject: subject.trim() || 'General',
                      difficulty,
                      timeLimit: Number(timeLimit) || 20,
                      passingScore: Number(passingScore) || 70,
                      subjectType,
                      description: description.trim(),
                      questions,
                      createdAt: initialExam?.createdAt || new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    };
                    onOpenDatabaseUpload(currentExam);
                  }}
                  className="px-3.5 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-500/25 cursor-pointer transition shadow-2xs"
                  title="Upload created questions to Cloud Firestore"
                >
                  <CloudUpload className="w-3.5 h-3.5" />
                  <span>Upload to Firestore</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleAddQuestion}
                disabled={!isPremium && questions.length >= maxManualQuestions}
                className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                title="Add new question"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          {/* Freemium Limit Warning if reaching or at cap */}
          {!isPremium && questions.length >= maxManualQuestions && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium">
                <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  {userTier?.isTrial
                    ? `Trial limit reached (${maxManualQuestions} questions). Upgrade to ExamMaster Premium for unlimited questions.`
                    : `Free plan limit reached (${maxManualQuestions} questions). Upgrade to Premium (starts at 19.9 ETB) for unlimited questions.`}
                </span>
              </div>
              {onOpenSubscriptionModal && (
                <button
                  type="button"
                  onClick={onOpenSubscriptionModal}
                  className="px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs shrink-0 cursor-pointer shadow-xs transition"
                >
                  Upgrade in ETB
                </button>
              )}
            </div>
          )}

          {/* Collapsible Questions List */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {questions.map((q, qIndex) => {
              const isExpanded = expandedIndex === qIndex;
              return (
                <div
                  key={q.id || qIndex}
                  className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 overflow-hidden"
                >
                  {/* Accordion Bar */}
                  <div
                    onClick={() => setExpandedIndex(isExpanded ? -1 : qIndex)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {qIndex + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {q.text.trim() ? q.text : <span className="text-zinc-400 italic">Empty question...</span>}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveQuestion(qIndex);
                          }}
                          className="p-1 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                  </div>

                  {/* Question Content Form */}
                  {isExpanded && (
                    <div className="p-4 pt-2 border-t border-zinc-200/60 dark:border-zinc-800 space-y-3.5 bg-white dark:bg-[#0a1220]">
                      {/* Question Text */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                            Question Prompt
                          </label>
                        </div>

                        <textarea
                          rows={2}
                          value={q.text}
                          onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                          placeholder="Type question prompt or math formula..."
                          className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </div>

                      {/* Options Grid */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                          Options (Select checkmark for correct answer)
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {q.options.map((opt, optIndex) => {
                            const isCorrect = q.correct === optIndex;
                            const char = String.fromCharCode(65 + optIndex);

                            return (
                              <div
                                key={optIndex}
                                className={`flex items-center gap-2 p-2 rounded-xl border transition ${
                                  isCorrect
                                    ? 'border-emerald-500 bg-emerald-500/5'
                                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => updateCorrectOption(qIndex, optIndex)}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition cursor-pointer ${
                                    isCorrect
                                      ? 'bg-emerald-500 text-zinc-950 font-extrabold shadow-xs'
                                      : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-500/30'
                                  }`}
                                  title={`Mark ${char} as correct`}
                                >
                                  {isCorrect ? '✓' : char}
                                </button>

                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => updateOptionText(qIndex, optIndex, e.target.value)}
                                  placeholder={`Option ${char}`}
                                  className="w-full text-xs sm:text-sm bg-transparent border-none text-zinc-900 dark:text-white focus:outline-none placeholder-zinc-400"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Explanation */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                          Step-by-step Solution (Optional)
                        </label>
                        <textarea
                          rows={2}
                          value={q.explanation || ''}
                          onChange={(e) => updateExplanation(qIndex, e.target.value)}
                          placeholder="Reasoning, proof, or derivation..."
                          className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              {initialExam && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Next: Settings</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Settings */}
      {currentStep === 3 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Passing Score (%)
              </label>
              <input
                id="exam-pass"
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
                Subject Focus
              </label>
              <select
                id="exam-subjecttype"
                value={subjectType}
                onChange={(e) => setSubjectType(e.target.value as SubjectType)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
              >
                <option value="theory">Theory & Concepts</option>
                <option value="calculation">Mathematical Calculations</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              {initialExam && (
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Next: Review</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Review & Save */}
      {currentStep === 4 && (
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-xs space-y-4">
          {/* Exam Summary Header */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <h3 className="text-lg font-bold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
              {name}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              <span>Subject: <strong className="text-zinc-800 dark:text-zinc-200">{subject || 'General'}</strong></span>
              <span>•</span>
              <span>Difficulty: <strong className="text-zinc-800 dark:text-zinc-200">{difficulty}</strong></span>
              <span>•</span>
              <span>Duration: <strong className="text-zinc-800 dark:text-zinc-200">{timeLimit}m</strong></span>
              <span>•</span>
              <span>Passing: <strong className="text-zinc-800 dark:text-zinc-200">{passingScore}%</strong></span>
              <span>•</span>
              <span>Questions: <strong className="text-zinc-800 dark:text-zinc-200">{questions.length}</strong></span>
            </div>
            {description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                {description}
              </p>
            )}
          </div>

          {/* Questions Summary */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1"
              >
                <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-start gap-2">
                  <span className="text-emerald-500 font-bold shrink-0">Q{idx + 1}:</span>
                  <span className="truncate">{q.text}</span>
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-medium pl-6">
                  ✓ Correct: {String.fromCharCode(65 + q.correct)}. {q.options[q.correct]}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Save / Cancel Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>

              {isAdmin && onOpenDatabaseUpload && (
                <button
                  type="button"
                  onClick={() => {
                    if (!validateStep1() || !validateStep2()) return;
                    const examData: Exam = {
                      id: initialExam?.id || 'exam_' + Date.now(),
                      name: name.trim(),
                      subject: subject.trim() || 'General',
                      difficulty,
                      timeLimit: Number(timeLimit) || 20,
                      passingScore: Number(passingScore) || 70,
                      subjectType,
                      description: description.trim(),
                      questions,
                      createdAt: initialExam?.createdAt || new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    };
                    onOpenDatabaseUpload(examData);
                  }}
                  className="px-4 py-2 rounded-full border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                  title="Upload questions to Cloud Firestore"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>Upload to Firestore</span>
                </button>
              )}

              <button
                id="saveExamBtn"
                type="button"
                onClick={handleSave}
                className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>{initialExam ? 'Save Changes' : 'Save Exam'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper parser for .txt files
export function parseTextQuestions(content: string): Question[] {
  return parsePlainTextRobust(content);
}
