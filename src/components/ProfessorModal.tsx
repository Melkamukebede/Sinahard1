import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  X,
  ArrowRight,
  FileText,
  HelpCircle,
  Code,
  Zap,
  Loader2,
  Plus,
  Minus,
  Smartphone,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  BookOpen,
  Key,
  ExternalLink,
  Trash2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { isMobileUserDevice } from '../services/latexClipboardService';
import { MathRenderer } from './MathRenderer';
import { Question, Exam } from '../types';
import {
  generateExamQuestions,
  getUserGeminiApiKey,
  saveUserGeminiApiKey,
  clearUserGeminiApiKey,
  hasUserGeminiApiKey,
} from '../services/geminiClientService';

interface ProfessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToQuestionTextEditor?: () => void;
  onGoToPaste?: () => void;
  onAddGeneratedQuestions?: (questions: Question[], examTitle?: string) => void;
  onStartDirectPractice?: (exam: Exam) => void;
}

type SubjectType = 'calculation' | 'theory';
type ActiveView = 'prompt' | 'generate' | 'txt_preview';
type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
type PromptStyle = 'brief' | 'detailed';

const GRADE_LIST = ['7', '8', '9', '10', '11', '12', 'Freshman', 'Senior University'];

const SUBJECT_PRESETS = [
  'Physics',
  'Mathematics',
  'Chemistry',
  'Biology',
  'Social Studies',
  'English',
  'Economics',
  'General Aptitude',
];

export const ProfessorModal: React.FC<ProfessorModalProps> = ({
  isOpen,
  onClose,
  onGoToQuestionTextEditor,
  onGoToPaste,
  onAddGeneratedQuestions,
  onStartDirectPractice,
}) => {
  // Mobile device detection and Phone LaTeX optimization toggle
  const isMobileDevice = isMobileUserDevice();
  const [optimizeForPhone, setOptimizeForPhone] = useState<boolean>(() => isMobileDevice);

  // Core Configuration - Brief & Focused
  const [subjectType, setSubjectType] = useState<SubjectType>('calculation');
  const [grade, setGrade] = useState<string>('12');
  const [subject, setSubject] = useState<string>('Physics');
  const [topics, setTopics] = useState<string>('Classical Mechanics & Kinematics');
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [timeLimit, setTimeLimit] = useState<number>(20);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [promptStyle, setPromptStyle] = useState<PromptStyle>('brief');

  // UI View Tab & Interactive States
  const [activeView, setActiveView] = useState<ActiveView>('prompt');
  const [copied, setCopied] = useState<boolean>(false);
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // In-app AI generation state (powered by Gemini)
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [generatedTitle, setGeneratedTitle] = useState<string>('');

  // Client-side Gemini API key configuration (for Cloudflare Pages / Static Hosting)
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => getUserGeminiApiKey());
  const [apiKeySuccessMsg, setApiKeySuccessMsg] = useState<string | null>(null);

  const triggerRegeneration = () => {
    setIsRegenerating(true);
    setTimeout(() => setIsRegenerating(false), 120);
  };

  // Grade Stepper Helpers
  const currentGradeIndex = useMemo(() => {
    const idx = GRADE_LIST.indexOf(String(grade));
    return idx >= 0 ? idx : 5; // Default to Grade 12
  }, [grade]);

  const handlePrevGrade = () => {
    if (currentGradeIndex > 0) {
      triggerRegeneration();
      setGrade(GRADE_LIST[currentGradeIndex - 1]);
    }
  };

  const handleNextGrade = () => {
    if (currentGradeIndex < GRADE_LIST.length - 1) {
      triggerRegeneration();
      setGrade(GRADE_LIST[currentGradeIndex + 1]);
    }
  };

  // Question Count Stepper (1 to 25)
  const handleDecrementQuestions = () => {
    triggerRegeneration();
    setTotalQuestions((prev) => Math.max(1, prev - 1));
  };

  const handleIncrementQuestions = () => {
    triggerRegeneration();
    setTotalQuestions((prev) => Math.min(25, prev + 1));
  };

  // Time Limit Stepper (5-minute increments)
  const handleDecrementTime = () => {
    triggerRegeneration();
    setTimeLimit((prev) => Math.max(5, prev - 5));
  };

  const handleIncrementTime = () => {
    triggerRegeneration();
    setTimeLimit((prev) => Math.min(180, prev + 5));
  };

  // Quick curriculum presets
  const applyPreset = (preset: 'physics' | 'math12' | 'chemistry' | 'biology' | 'social') => {
    triggerRegeneration();
    if (preset === 'physics') {
      setSubjectType('calculation');
      setGrade('12');
      setSubject('Physics');
      setTopics('Classical Mechanics, Newton Laws & Work-Energy');
      setTotalQuestions(10);
      setTimeLimit(20);
      setDifficulty('Medium');
    } else if (preset === 'math12') {
      setSubjectType('calculation');
      setGrade('12');
      setSubject('Mathematics');
      setTopics('Calculus, Limits, Derivatives & Integrals');
      setTotalQuestions(10);
      setTimeLimit(25);
      setDifficulty('Hard');
    } else if (preset === 'chemistry') {
      setSubjectType('calculation');
      setGrade('12');
      setSubject('Chemistry');
      setTopics('Chemical Equilibrium, Kinetics & Stoichiometry');
      setTotalQuestions(10);
      setTimeLimit(20);
      setDifficulty('Medium');
    } else if (preset === 'biology') {
      setSubjectType('theory');
      setGrade('12');
      setSubject('Biology');
      setTopics('Cell Biology, Genetics & Human Physiology');
      setTotalQuestions(10);
      setTimeLimit(15);
      setDifficulty('Medium');
    } else if (preset === 'social') {
      setSubjectType('theory');
      setGrade('12');
      setSubject('Social Studies');
      setTopics('Modern Ethiopian History, Geography & Civics');
      setTotalQuestions(10);
      setTimeLimit(15);
      setDifficulty('Medium');
    }
  };

  // Calibrated Difficulty Guides
  const difficultyConfig = useMemo(() => {
    if (difficulty === 'Easy') {
      return {
        label: 'Easy (Foundational Mastery)',
        summary: 'Direct single-step formulas and core conceptual recall.',
        briefGuide: 'Direct 1-step substitution (e.g. F = ma directly) with clear, distinct distractors.',
        distractorRule: 'Distractors must represent simple arithmetic slips or misplaced signs.',
      };
    } else if (difficulty === 'Hard') {
      return {
        label: 'Hard (Challenger & Olympiad)',
        summary: 'Multi-stage synthesis, variable isolation, and non-trivial calculations.',
        briefGuide: 'Multi-stage problems requiring derivation and synthesis across multiple concepts before final evaluation.',
        distractorRule: 'Distractors must be mathematically plausible intermediate results from alternative missteps.',
      };
    } else {
      return {
        label: 'Medium (Standard Exam)',
        summary: 'National exam benchmark with 2-step algebraic reasoning.',
        briefGuide: 'Standard preparatory exam standard: 2-step reasoning (e.g. solve for intermediate acceleration first), algebraic rearrangement, and plausible distractors.',
        distractorRule: 'Distractors must reflect common student math slips like forgetting to square velocity or inverted fractions.',
      };
    }
  }, [difficulty]);

  // Generate standardized Plain Text (.TXT format) prompt for AI
  const generatedPrompt = useMemo(() => {
    const isMath = subjectType === 'calculation';
    const isMobile = isMobileDevice || optimizeForPhone;
    const mainTopic = topics.split(',')[0]?.trim() || 'Classical Mechanics';
    const cleanGrade = String(grade || '12');

    // BRIEF PROMPT MODE: High-impact, concise, holistic
    if (promptStyle === 'brief') {
      if (isMath || isMobile) {
        return `Please generate ${totalQuestions} professional multiple choice questions in plain .txt format for:
Grade: ${cleanGrade}
Subject: ${subject}
Topic: ${mainTopic}
Time Limit: ${timeLimit} minutes

FORMAT SPECIFICATION:
================================================================
Grade: ${cleanGrade}
Subject: ${subject}
Topic: ${mainTopic}
Time Limit: ${timeLimit} minutes
================================================================

For each question:
1. [Question statement with exact LaTeX notation for all quantities: $m = 1200\\text{ kg}$, $v = 24\\text{ m/s}$, $t = 8\\text{ s}$]
   A) [Option with exact LaTeX $...$: e.g. $2400\\text{ N}$ or $\\frac{3}{4}\\text{ m/s}$]
   B) [Option with exact LaTeX $...$]
   C) [Option with exact LaTeX $...$]
   D) [Option with exact LaTeX $...$]
   Answer: [Correct Option Letter: A, B, C, or D]
   Explanation: **Formula:**
[ a = \\frac{v - u}{t} ]

[ F = ma ]

**Calculation:**
[ a = \\frac{24 - 0}{8} = 3\\text{ m/s}^2 ]

[ F = 1200 \\times 3 = 3600\\text{ N} ]

**Answer:** $3600\\text{ N}$ (Option B)

CRITICAL RULES FOR EXACT LATEX & CROSS-PLATFORM COMPLIANCE (PC & PHONES):
1. DELIMIT EVERY MATHEMATICAL QUANTITY & UNIT:
   - In Question statements, wrap ALL variables, formulas, and quantities with units in $...$ (e.g. $m = 1200\\text{ kg}$, $v = 24\\text{ m/s}$, $t = 8\\text{ s}$).
   - NEVER leave naked \\text{...} or raw units unwrapped in the question or options. Always enclose in $...$.
2. EXACT LATEX IN ALL 4 OPTIONS (A, B, C, D):
   - Wrap EVERY mathematical or numerical option in $...$ (e.g. A) $2400\\text{ N}$, B) $3600\\text{ N}$, C) $4800\\text{ N}$, D) $14400\\text{ N}$).
   - NEVER output plain ASCII math like '5 m/s^2', '3/4', or 'sqrt(5)'. Always use $\\frac{3}{4}$ and $\\sqrt{2}$.
3. STRICTLY NO NUMBERS IN EXPLANATIONS:
   - Do NOT write numbered lists like "1. Formula", "2. Calculation", or "Step 1", "Step 2".
   - Use ONLY bold thematic labels (**Formula:**, **Calculation:**, **Answer:**).
4. FORMULA ISOLATION & BRACKETS:
   - Wrap display equations on their own dedicated line using bracket format [ equation ] (e.g. [ a = \\frac{v - u}{t} ] and [ F = ma ]).
   - Place blank lines before and after every display equation for clean formatting on mobile phones and PC.
   - Strictly retain all LaTeX commands and backslashes (\\frac, \\sqrt, \\times, \\cdot, \\pm, ^2, _0, \\Delta, \\theta, \\pi, \\Omega).
   - Wrap units in \\text{...} inside math mode (e.g. \\text{ kg}, \\text{ m/s}^2, \\text{ N}, \\text{ J}).
5. BALANCED RANDOM ANSWER SELECTION:
   - Randomize correct option letters evenly and unpredictably across A, B, C, and D. Avoid letter bias.
6. DIFFICULTY CALIBRATION (${difficulty.toUpperCase()}): ${difficultyConfig.briefGuide}
7. REALISTIC DISTRACTORS: Options B, C, D must reflect realistic student calculation slips (${difficultyConfig.distractorRule}).
8. OUTPUT: Return strictly pure plain text. Do not wrap in markdown code blocks (\`\`\`). Start immediately with the FORMAT SPECIFICATION header.`;
      } else {
        return `Please generate ${totalQuestions} professional multiple choice questions in plain .txt format for:
Grade: ${cleanGrade}
Subject: ${subject}
Topic: ${mainTopic}
Time Limit: ${timeLimit} minutes

FORMAT SPECIFICATION:
================================================================
Grade: ${cleanGrade}
Subject: ${subject}
Topic: ${mainTopic}
Time Limit: ${timeLimit} minutes
================================================================

For each question:
1. [Clear conceptual or scenario-based question statement]
   A) [Option A]
   B) [Option B]
   C) [Option C]
   D) [Option D]
   Answer: [Correct Option Letter: A, B, C, or D]
   Explanation: **Core Concept:**
[Scientific principle, historical context, or fundamental definition]

**Key Reason:**
[Why the chosen option is correct and accurate]

**Distractor Analysis:**
[Brief reason why other plausible choices are incorrect]

**Answer:** Option [Letter]

CRITICAL RULES:
1. STRICTLY NO NUMBERS IN EXPLANATION: Do NOT write "1. Concept 2. Reason". Use ONLY bold thematic labels (**Core Concept:**, **Key Reason:**, **Distractor Analysis:**, **Answer:**).
2. BALANCED RANDOM ANSWER SELECTION: Distribute the correct answer evenly across A, B, C, and D without bias.
3. DIFFICULTY CALIBRATION (${difficulty.toUpperCase()}): ${difficultyConfig.briefGuide}
4. OUTPUT: Return strictly pure plain text. Do not wrap in markdown code blocks (\`\`\`). Start immediately with the FORMAT SPECIFICATION header.`;
      }
    }

    // DETAILED MASTER PROMPT MODE: Comprehensive curriculum rubric
    let subjectRules = '';
    if (isMath) {
      subjectRules = `CRITICAL FORMATTING & VERTICAL STEP-WISE EXPLANATION RULES (MANDATORY):
1. EXACT LATEX IN QUESTION STATEMENT & ALL OPTIONS:
   - In problem statements, wrap every variable, quantity, and unit in $...$ (e.g. $m = 1200\\text{ kg}$, $v = 24\\text{ m/s}$, $\\theta = 30^\\circ$).
   - NEVER leave raw \\text{...} or numbers unwrapped without $...$.
   - In multiple-choice options (A, B, C, D), EVERY numerical or formula option MUST be enclosed in $...$ (e.g. A) $2400\\text{ N}$, B) $3600\\text{ N}$, C) $\\frac{3}{4}\\text{ m/s}$).
   - NEVER output raw plain ASCII fractions (3/4) or roots (sqrt). Use \\frac{3}{4} and \\sqrt{2}.
2. STRICTLY NO NUMBERS IN EXPLANATION:
   - Do NOT write numbered lists in the explanation (NEVER write "1. Formula", "2. Calculation", or "Step 1", "Step 2").
   - Structure every explanation vertically using clean, bold thematic labels:
     **Formula:**
     [ a = \\frac{v - u}{t} ]
     
     [ F = ma ]
     
     **Calculation:**
     [ a = \\frac{24 - 0}{8} = 3\\text{ m/s}^2 ]
     
     [ F = 1200 \\times 3 = 3600\\text{ N} ]
     
     **Answer:** $3600\\text{ N}$ (Option B)
3. PHONE-SAFE LATEX MATHEMATICAL NOTATION & FORMULA ISOLATION:
   - To make equations 100% resilient across mobile phones and desktop touch clipboards:
     a) Always put display formulas on their own dedicated line using bracket notation [ equation ] (e.g. [ a = \\frac{v - u}{t} ] or [ F = ma ]).
     b) Separate equations with blank lines above and below for clean formatting.
     c) Always keep backslashes intact on all LaTeX keywords: \\frac{numerator}{denominator}, \\sqrt{x}, \\times, \\cdot, \\pm, \\Delta, \\theta, \\pi, \\Omega, \\mu.
     d) Wrap physical units in \\text{...} inside math mode (e.g. $50\\text{ m/s}$, $1200\\text{ kg}$, $3600\\text{ N}$).
4. BALANCED RANDOM ANSWER DISTRIBUTION:
   - Randomize correct option letters evenly across A, B, C, and D.
5. DISTRACTOR INTEGRITY:
   - ${difficultyConfig.distractorRule}`;
    } else {
      subjectRules = `CRITICAL THEORY & CONCEPTUAL EXPLANATION RULES:
1. STRICTLY NO NUMBERS IN EXPLANATION:
   - Do NOT use numbered lists like "1. Definition 2. Reason".
   - Structure explanations using bold thematic sections:
     **Core Concept:** [State underlying scientific law, definition, or historical context]
     **Key Reason:** [Explain exactly why the correct answer is valid]
     **Distractor Analysis:** [Briefly clarify why plausible incorrect choices fail]
     **Answer:** [Option Letter and summary statement]
2. BALANCED RANDOM ANSWER DISTRIBUTION:
   - Randomize correct option letters evenly across A, B, C, and D.`;
    }

    return `You are an expert exam professor and national curriculum specialist creating a standardized ${totalQuestions}-question examination for Grade ${cleanGrade} students in ${subject}.

OUTPUT FORMAT REQUIREMENT:
Return the exam strictly in clean plain text (.TXT format), ready for direct import into Exam Master.
- DO NOT wrap the output in markdown code fences (\`\`\`txt or \`\`\`).
- DO NOT include conversational greetings, intros, or outros.
- Start directly on line 1 with the FORMAT SPECIFICATION header below, followed by question 1.

REQUIRED EXAM HEADER:
================================================================
FORMAT SPECIFICATION:
Grade: ${cleanGrade}
Subject: ${subject}
Topic: ${mainTopic}
Time Limit: ${timeLimit} minutes
================================================================

QUESTION STRUCTURE (Repeat for all ${totalQuestions} questions):
1. [Question text or scenario with exact LaTeX: $m = 1200\\text{ kg}$, $v = 24\\text{ m/s}$]
   A) [Option A with exact LaTeX: $2400\\text{ N}$]
   B) [Option B with exact LaTeX: $3600\\text{ N}$]
   C) [Option C with exact LaTeX: $4800\\text{ N}$]
   D) [Option D with exact LaTeX: $14400\\text{ N}$]
   Answer: [Correct Option Letter: A, B, C, or D]
   Explanation:
[Provide step-wise explanation without numbers according to rules below]

${difficultyConfig.summary}

${subjectRules}

EXAM PARAMETERS:
- Total Questions: ${totalQuestions}
- Grade Level: Grade ${cleanGrade}
- Specific Topics to Cover: ${topics || 'Standard curriculum'}
- Difficulty Setting: ${difficulty}
- Answer Key Balance: Randomize correct option letters evenly across A, B, C, and D.`;
  }, [subjectType, grade, subject, topics, totalQuestions, timeLimit, difficulty, promptStyle, difficultyConfig, isMobileDevice, optimizeForPhone]);

  // Sample TXT Output Preview matching format
  const sampleTxtPreview = useMemo(() => {
    const cleanGrade = String(grade || '12');
    const mainTopic = topics.split(',')[0]?.trim() || 'Classical Mechanics';
    if (subjectType === 'calculation') {
      return `================================================================
FORMAT SPECIFICATION:
Grade: ${cleanGrade}
Subject: ${subject || 'Physics'}
Topic: ${mainTopic}
Time Limit: ${timeLimit} minutes
================================================================

1. A car of mass $m = 1200\\text{ kg}$ accelerates uniformly from rest to a velocity of $v = 24\\text{ m/s}$ in $t = 8\\text{ s}$. What is the net force acting on the car?
   A) $2400\\text{ N}$
   B) $3600\\text{ N}$
   C) $4800\\text{ N}$
   D) $14400\\text{ N}$
   Answer: B
   Explanation: **Formula:**
[ a = \\frac{v - u}{t} ]

[ F = ma ]

**Calculation:**
[ a = \\frac{24 - 0}{8} = 3\\text{ m/s}^2 ]

[ F = 1200 \\times 3 = 3600\\text{ N} ]

**Answer:** $3600\\text{ N}$ (Option B)

2. An object accelerates uniformly from initial velocity $u = 5\\text{ m/s}$ to final velocity $v = 25\\text{ m/s}$ in time $t = 4\\text{ s}$. What is its displacement?
   A) $60\\text{ m}$
   B) $120\\text{ m}$
   C) $30\\text{ m}$
   D) $50\\text{ m}$
   Answer: A
   Explanation: **Formula:**
[ s = ut + \\frac{1}{2}at^2 ]

**Calculation:**
[ a = \\frac{25 - 5}{4} = 5\\text{ m/s}^2 ]

[ s = (5)(4) + \\frac{1}{2}(5)(4^2) = 20 + 40 = 60\\text{ m} ]

**Answer:** $60\\text{ m}$ (Option A)`;
    } else {
      return `================================================================
FORMAT SPECIFICATION:
Grade: ${cleanGrade}
Subject: ${subject || 'Biology'}
Topic: ${mainTopic}
Time Limit: ${timeLimit} minutes
================================================================

1. Which organelle is primarily responsible for generating cellular ATP through oxidative phosphorylation?
   A) Ribosome
   B) Mitochondria
   C) Golgi apparatus
   D) Endoplasmic reticulum
   Answer: B
   Explanation: **Core Concept:**
Mitochondria are the primary biochemical powerhouses of eukaryotic cells, executing the Krebs cycle and oxidative phosphorylation.

**Key Reason:**
Option B is correct because the inner mitochondrial cristae host the electron transport chain synthesizing ATP.

**Distractor Analysis:**
Ribosomes synthesize proteins, the Golgi modifies macromolecules, and the ER facilitates lipid/protein synthesis.

**Answer:** Option B`;
    }
  }, [subjectType, grade, subject, topics, timeLimit]);

  const handleCopy = async () => {
    try {
      setIsCopying(true);
      await navigator.clipboard.writeText(generatedPrompt);
      setTimeout(() => {
        setIsCopying(false);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }, 150);
    } catch {
      setIsCopying(false);
    }
  };

  const handleCopyAndProceed = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
    } catch {
      // ignore
    }
    onClose();
    if (onGoToQuestionTextEditor) {
      onGoToQuestionTextEditor();
    } else if (onGoToPaste) {
      onGoToPaste();
    }
  };

  // Direct In-App Generation with Gemini (Supports Express backend, Cloudflare Pages functions, and Client fallback)
  const handleGenerateWithGemini = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    setApiKeySuccessMsg(null);
    try {
      const result = await generateExamQuestions({
        subject,
        grade,
        topic: topics || 'Standard Curriculum',
        totalQuestions,
        difficulty,
        subjectType,
        timeLimit,
        customPrompt: generatedPrompt,
      });

      if (result.status === 'success' && Array.isArray(result.questions) && result.questions.length > 0) {
        setGeneratedQuestions(result.questions);
        setGeneratedTitle(result.title || `${subject} Grade ${grade} Exam`);
        setActiveView('generate');
        setShowApiKeyInput(false);
      } else if (result.status === 'needs_key') {
        setShowApiKeyInput(true);
        setAiError(
          result.message ||
            'Enter your free Gemini API key below to generate questions directly in your browser on Cloudflare Pages.'
        );
      } else {
        setAiError(
          result.message ||
            'Gemini generation is temporarily unavailable. You can click Copy Prompt to generate with ChatGPT or Gemini web.'
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error generating questions';
      setAiError(msg);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveApiKey = () => {
    if (!apiKeyInput.trim()) return;
    saveUserGeminiApiKey(apiKeyInput.trim());
    setApiKeySuccessMsg('API key saved! You can now generate directly.');
    setTimeout(() => setApiKeySuccessMsg(null), 4000);
  };

  const handleClearApiKey = () => {
    clearUserGeminiApiKey();
    setApiKeyInput('');
    setApiKeySuccessMsg('API key removed from browser storage.');
    setTimeout(() => setApiKeySuccessMsg(null), 3000);
  };

  // Launch direct practice mode with the generated questions
  const handleLaunchPracticeWithGenerated = () => {
    if (generatedQuestions.length === 0) return;
    const examObj: Exam = {
      id: `ai-exam-${Date.now()}`,
      name: generatedTitle || `${subject} Grade ${grade} - ${topics}`,
      title: generatedTitle || `${subject} Grade ${grade} - ${topics}`,
      subject,
      topic: topics,
      grade,
      timeLimit,
      questions: generatedQuestions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onClose();
    if (onStartDirectPractice) {
      onStartDirectPractice(examObj);
    }
  };

  // Add generated questions to wizard / editor
  const handleAddQuestionsToEditor = () => {
    if (generatedQuestions.length === 0) return;
    onClose();
    if (onAddGeneratedQuestions) {
      onAddGeneratedQuestions(generatedQuestions, generatedTitle);
    } else if (onGoToQuestionTextEditor) {
      onGoToQuestionTextEditor();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="professor-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]"
    >
      <div
        id="professor-modal-container"
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-[28px] sm:rounded-[32px] bg-white dark:bg-[#0c182b] text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden backdrop-blur-2xl"
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-zinc-900 via-zinc-600 to-zinc-900 dark:from-white/40 dark:via-white/80 dark:to-white/40" />

        {/* Header */}
        <div className="relative px-5 sm:px-6 py-4 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-zinc-50/80 dark:bg-[#0c182b]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-['Outfit',sans-serif] text-zinc-950 dark:text-white">
                  AI Prompt Studio
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setOptimizeForPhone((prev) => !prev);
                    triggerRegeneration();
                  }}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                    optimizeForPhone
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title="Toggle Phone-Optimized Exact LaTeX prompt directives"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>{optimizeForPhone ? 'Phone LaTeX: Active' : 'Phone LaTeX: Off'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowApiKeyInput((prev) => !prev)}
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                    hasUserGeminiApiKey()
                      ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                      : showApiKeyInput
                      ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-transparent'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                  title="Configure Gemini API Key for client-side generation (Cloudflare/Static)"
                >
                  <Key className="w-3 h-3" />
                  <span>{hasUserGeminiApiKey() ? 'API Key: Set' : 'API Key'}</span>
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Brief holistic prompts & in-app creation for ChatGPT, Claude, Gemini & DeepSeek
              </p>
            </div>
          </div>

          <button
            id="professor-modal-close-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-[#0f1d33] text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-[#132238] flex items-center justify-center transition cursor-pointer border border-zinc-200 dark:border-white/10"
            aria-label="Close AI Prompt Studio"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs bg-white dark:bg-[#070e1a]">
          {/* Quick Curriculum Presets Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider shrink-0 mr-1">
              Presets:
            </span>
            <button
              type="button"
              onClick={() => applyPreset('physics')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer border ${
                subject === 'Physics'
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-[#0f1d33] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-[#132238]'
              }`}
            >
              Physics Gr 12
            </button>
            <button
              type="button"
              onClick={() => applyPreset('math12')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer border ${
                subject === 'Mathematics'
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-[#0f1d33] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-[#132238]'
              }`}
            >
              Calculus Gr 12
            </button>
            <button
              type="button"
              onClick={() => applyPreset('chemistry')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer border ${
                subject === 'Chemistry'
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-[#0f1d33] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-[#132238]'
              }`}
            >
              Chemistry Gr 12
            </button>
            <button
              type="button"
              onClick={() => applyPreset('biology')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer border ${
                subject === 'Biology'
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-[#0f1d33] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-[#132238]'
              }`}
            >
              Biology Gr 12
            </button>
            <button
              type="button"
              onClick={() => applyPreset('social')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer border ${
                subject === 'Social Studies'
                  ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-[#0f1d33] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-[#132238]'
              }`}
            >
              Social Studies
            </button>
          </div>

          {/* Stepper Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Subject Type Segmented Switch */}
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10 flex flex-col justify-between">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                Question Type
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-200/70 dark:bg-[#070e1a] rounded-xl border border-zinc-300/40 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setSubjectType('calculation');
                    triggerRegeneration();
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    subjectType === 'calculation'
                      ? 'bg-white dark:bg-[#0f1d33] text-zinc-950 dark:text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Math/LaTeX
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubjectType('theory');
                    triggerRegeneration();
                  }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                    subjectType === 'theory'
                      ? 'bg-white dark:bg-[#0f1d33] text-zinc-950 dark:text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  Theory
                </button>
              </div>
            </div>

            {/* Grade Stepper */}
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10 flex flex-col justify-between">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                Curriculum Grade
              </label>
              <div className="flex items-center justify-between bg-white dark:bg-[#070e1a] border border-zinc-200 dark:border-white/10 rounded-xl px-2 py-1">
                <button
                  type="button"
                  onClick={handlePrevGrade}
                  disabled={currentGradeIndex <= 0}
                  className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#0f1d33] hover:bg-zinc-200 dark:hover:bg-[#132238] flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                  aria-label="Previous grade"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-xs text-zinc-900 dark:text-white">
                  Grade {grade}
                </span>
                <button
                  type="button"
                  onClick={handleNextGrade}
                  disabled={currentGradeIndex >= GRADE_LIST.length - 1}
                  className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#0f1d33] hover:bg-zinc-200 dark:hover:bg-[#132238] flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                  aria-label="Next grade"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Questions Stepper */}
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10 flex flex-col justify-between">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                Questions Count
              </label>
              <div className="flex items-center justify-between bg-white dark:bg-[#070e1a] border border-zinc-200 dark:border-white/10 rounded-xl px-2 py-1">
                <button
                  type="button"
                  onClick={handleDecrementQuestions}
                  disabled={totalQuestions <= 1}
                  className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#0f1d33] hover:bg-zinc-200 dark:hover:bg-[#132238] flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                  aria-label="Decrease question count"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-xs text-zinc-900 dark:text-white">
                  {totalQuestions} Questions
                </span>
                <button
                  type="button"
                  onClick={handleIncrementQuestions}
                  disabled={totalQuestions >= 25}
                  className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#0f1d33] hover:bg-zinc-200 dark:hover:bg-[#132238] flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                  aria-label="Increase question count"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Time Limit Stepper */}
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10 flex flex-col justify-between">
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
                Time Limit
              </label>
              <div className="flex items-center justify-between bg-white dark:bg-[#070e1a] border border-zinc-200 dark:border-white/10 rounded-xl px-2 py-1">
                <button
                  type="button"
                  onClick={handleDecrementTime}
                  disabled={timeLimit <= 5}
                  className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#0f1d33] hover:bg-zinc-200 dark:hover:bg-[#132238] flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                  aria-label="Decrease time limit"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-xs text-zinc-900 dark:text-white">
                  {timeLimit} min
                </span>
                <button
                  type="button"
                  onClick={handleIncrementTime}
                  disabled={timeLimit >= 180}
                  className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-[#0f1d33] hover:bg-zinc-200 dark:hover:bg-[#132238] flex items-center justify-center transition cursor-pointer disabled:opacity-40"
                  aria-label="Increase time limit"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Subject & Topics Input Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  triggerRegeneration();
                }}
                placeholder="e.g. Physics, Chemistry, Calculus"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-hidden focus:border-zinc-950 dark:focus:border-white transition"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                Topics / Concept Focus
              </label>
              <input
                type="text"
                value={topics}
                onChange={(e) => {
                  setTopics(e.target.value);
                  triggerRegeneration();
                }}
                placeholder="e.g. Classical Mechanics, Work & Energy"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10 text-xs font-semibold text-zinc-900 dark:text-white focus:outline-hidden focus:border-zinc-950 dark:focus:border-white transition"
              />
            </div>
          </div>

          {/* Difficulty Segmented Selector */}
          <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-2xl bg-zinc-50 dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10">
            <div>
              <span className="text-xs font-bold text-zinc-900 dark:text-white block">
                Difficulty: {difficultyConfig.label}
              </span>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {difficultyConfig.summary}
              </p>
            </div>
            <div className="flex items-center gap-1 p-1 bg-zinc-200/70 dark:bg-[#070e1a] rounded-xl border border-zinc-300/40 dark:border-white/5">
              {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setDifficulty(lvl);
                    triggerRegeneration();
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    difficulty === lvl
                      ? 'bg-white dark:bg-[#0f1d33] text-zinc-950 dark:text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Client-Side Gemini API Key Card (for Cloudflare Pages / Static Hosting) */}
          {showApiKeyInput && (
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-950 dark:text-blue-100 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-blue-950 dark:text-blue-100 flex items-center gap-2">
                      <span>Client-Side Gemini API Key</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider">
                        Cloudflare Ready
                      </span>
                    </h4>
                    <p className="text-[11px] text-blue-800/80 dark:text-blue-200/80 mt-0.5">
                      Directly generates verified exams in your browser on Cloudflare Pages without needing a server.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApiKeyInput(false)}
                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 rounded-lg cursor-pointer"
                  title="Close API Key panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Enter your Gemini API Key (e.g. AIzaSy...)"
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#070e1a] border border-blue-300 dark:border-blue-500/40 text-xs font-mono text-zinc-900 dark:text-white focus:outline-hidden focus:border-blue-600 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveApiKey();
                      handleGenerateWithGemini();
                    }}
                    disabled={!apiKeyInput.trim() || isGeneratingAi}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 transition active:scale-98 shrink-0"
                  >
                    {isGeneratingAi ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Save & Generate</span>
                  </button>
                  {hasUserGeminiApiKey() && (
                    <button
                      type="button"
                      onClick={handleClearApiKey}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 transition cursor-pointer shrink-0"
                      title="Clear stored key"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {apiKeySuccessMsg && (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{apiKeySuccessMsg}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-blue-900/70 dark:text-blue-200/70 pt-1 flex-wrap gap-2">
                  <span>Saved only in your browser local storage. Never shared.</span>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <span>Get Free API Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Generation Error Banner */}
          {aiError && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs space-y-2">
                <p className="font-semibold">{aiError}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {!showApiKeyInput && (
                    <button
                      type="button"
                      onClick={() => setShowApiKeyInput(true)}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Key className="w-3 h-3" />
                      <span>Enter Gemini API Key</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 font-bold text-[11px] inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Prompt for External AI</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View Selector Tabs & Action Bar */}
          <div className="pt-1 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-200 dark:border-white/10 pb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Main View Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveView('prompt')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      activeView === 'prompt'
                        ? 'bg-white dark:bg-[#0f1d33] text-zinc-950 dark:text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Holistic Prompt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (generatedQuestions.length === 0 && !isGeneratingAi) {
                        handleGenerateWithGemini();
                      } else {
                        setActiveView('generate');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      activeView === 'generate'
                        ? 'bg-white dark:bg-[#0f1d33] text-zinc-950 dark:text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      AI Exam Generator
                      {generatedQuestions.length > 0 && ` (${generatedQuestions.length})`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveView('txt_preview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      activeView === 'txt_preview'
                        ? 'bg-white dark:bg-[#0f1d33] text-zinc-950 dark:text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Format Preview</span>
                  </button>
                </div>

                {/* Brief vs Detailed Toggle (Only in Prompt view) */}
                {activeView === 'prompt' && (
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        triggerRegeneration();
                        setPromptStyle('brief');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        promptStyle === 'brief'
                          ? 'bg-white dark:bg-[#0f1d33] text-zinc-950 dark:text-white shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                      title="Concise high-impact prompt"
                    >
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>Brief</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerRegeneration();
                        setPromptStyle('detailed');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        promptStyle === 'detailed'
                          ? 'bg-white dark:bg-[#0f1d33] text-zinc-950 dark:text-white shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                      title="Full pedagogical rubric"
                    >
                      <span>Full Rubric</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons in Tab Header */}
              <div className="flex items-center gap-2">
                {/* Generate with Gemini CTA Button */}
                <button
                  type="button"
                  disabled={isGeneratingAi}
                  onClick={handleGenerateWithGemini}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs active:scale-98 disabled:opacity-50"
                  title="Generate questions directly with Gemini"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate with AI</span>
                    </>
                  )}
                </button>

                {/* Copy Prompt Button */}
                <button
                  type="button"
                  disabled={isCopying}
                  onClick={handleCopy}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs active:scale-98 disabled:opacity-50"
                  title="Copy prompt for external AI chatbots"
                >
                  {isCopying ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Copying...</span>
                    </>
                  ) : copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Prompt</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: PROMPT */}
            {activeView === 'prompt' && (
              <div className="space-y-2.5">
                <textarea
                  id="generated-prompt-textarea"
                  rows={10}
                  readOnly
                  value={generatedPrompt}
                  className="w-full p-4 font-mono text-xs leading-relaxed rounded-[22px] bg-zinc-50 dark:bg-[#070e1a] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100 select-all focus:outline-hidden shadow-xs"
                />
                <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 px-1 flex-wrap gap-2">
                  <span>Compatible with ChatGPT, Claude, Gemini & DeepSeek.</span>
                  <span className="text-zinc-900 dark:text-white font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Exact KaTeX Math & Balanced Random Answer Keys (A, B, C, D)
                  </span>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: AI IN-APP GENERATOR RESULTS */}
            {activeView === 'generate' && (
              <div className="space-y-3">
                {isGeneratingAi ? (
                  <div className="py-12 px-4 rounded-[24px] bg-zinc-50 dark:bg-[#070e1a] border border-zinc-200 dark:border-white/10 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shadow-md animate-bounce">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                        Gemini 3.8 Flash is Creating Your Exam...
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md">
                        Synthesizing {totalQuestions} curriculum-aligned questions for {subject} with exact LaTeX formulas, balanced answer keys, and step-by-step solutions.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Formulating equations & distractors...</span>
                    </div>
                  </div>
                ) : generatedQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {/* Header bar of results */}
                    <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#070e1a] border border-zinc-200 dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-bold text-xs text-zinc-900 dark:text-white">
                          Generated {generatedQuestions.length} Questions for {subject}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleLaunchPracticeWithGenerated}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition"
                          title="Launch Practice Mode with dynamic answer shuffling"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start Practice Now</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAddQuestionsToEditor}
                          className="px-3.5 py-1.5 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition"
                          title="Import into Exam Wizard for editing"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Add to Exam Wizard</span>
                        </button>
                      </div>
                    </div>

                    {/* Questions Card Deck with MathRenderer */}
                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                      {generatedQuestions.map((q, qIdx) => (
                        <div
                          key={q.id || qIdx}
                          className="p-4 rounded-[22px] bg-zinc-50 dark:bg-[#070e1a] border border-zinc-200/80 dark:border-white/10 space-y-3 text-zinc-900 dark:text-white"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-xs text-zinc-900 dark:text-white">
                              Question {qIdx + 1}:
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              Correct: Option {String.fromCharCode(65 + q.correct)}
                            </span>
                          </div>

                          <div className="text-sm font-medium leading-relaxed">
                            <MathRenderer content={q.text} />
                          </div>

                          {/* Options grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt, optIdx) => {
                              const isCorrect = optIdx === q.correct;
                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                                    isCorrect
                                      ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500 text-zinc-950 dark:text-white font-medium'
                                      : 'bg-white dark:bg-[#0c182b] border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300'
                                  }`}
                                >
                                  <span
                                    className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-zinc-100 dark:bg-[#0f1d33] text-zinc-600 dark:text-zinc-400'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <div className="flex-1 truncate">
                                    <MathRenderer content={opt} inline />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation */}
                          {q.explanation && (
                            <div className="p-3 rounded-xl bg-white dark:bg-[#0c182b] border border-zinc-200/80 dark:border-white/10 text-xs space-y-1">
                              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                                Step-by-step Solution:
                              </span>
                              <div className="text-zinc-800 dark:text-zinc-200 leading-relaxed">
                                <MathRenderer content={q.explanation} />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 px-4 rounded-[24px] bg-zinc-50 dark:bg-[#070e1a] border border-zinc-200 dark:border-white/10 text-center space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center mx-auto shadow-xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                        Create Questions with Gemini AI
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
                        Click below to generate {totalQuestions} questions for {subject} with exact formulas and balanced randomized answers.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateWithGemini}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer shadow-xs active:scale-98 transition"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate {totalQuestions} Questions Now</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: SAMPLE TXT OUTPUT PREVIEW */}
            {activeView === 'txt_preview' && (
              <div className="space-y-1.5">
                <textarea
                  rows={9}
                  readOnly
                  value={sampleTxtPreview}
                  className="w-full p-4 font-mono text-xs leading-relaxed rounded-[22px] bg-zinc-50 dark:bg-[#070e1a] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100 select-all focus:outline-hidden shadow-xs"
                />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
                  Format standard: questions, options A–D, Answer letter, and bracket formula display <strong>{'[ a = \\frac{v - u}{t} ]'}</strong>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-zinc-100 dark:border-white/10 bg-zinc-50/80 dark:bg-[#0c182b]/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <span>Ready for ChatGPT, Claude, Gemini & DeepSeek</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="professor-footer-close-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0f1d33] text-zinc-700 dark:text-zinc-300 font-bold text-xs hover:bg-zinc-100 dark:hover:bg-[#132238] cursor-pointer shadow-xs transition"
            >
              Close
            </button>

            {generatedQuestions.length > 0 ? (
              <button
                type="button"
                onClick={handleLaunchPracticeWithGenerated}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition"
              >
                <span>Launch Practice ({generatedQuestions.length} Qs)</span>
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                id="professor-go-to-editor-btn"
                type="button"
                onClick={handleCopyAndProceed}
                className="px-5 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:opacity-90 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition"
                title="Copy prompt to clipboard and open Question Editor"
              >
                <span>Copy & Open Editor</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
