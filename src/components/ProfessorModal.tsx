import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  X,
  ArrowRight,
  Calculator,
  BookOpen,
  FileText,
  HelpCircle,
  Code,
  Zap,
  Loader2,
  ChevronDown,
  Plus,
  Minus,
  Smartphone,
} from 'lucide-react';
import { isMobileUserDevice } from '../services/latexClipboardService';

interface ProfessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToQuestionTextEditor?: () => void;
  onGoToPaste?: () => void;
}

type SubjectType = 'calculation' | 'theory';
type ActiveView = 'prompt' | 'txt_preview';
type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
type PromptStyle = 'brief' | 'detailed';

const GRADE_LIST = ['7', '8', '9', '10', '11', '12', 'Freshman', 'Senior University'];

export const ProfessorModal: React.FC<ProfessorModalProps> = ({
  isOpen,
  onClose,
  onGoToQuestionTextEditor,
  onGoToPaste,
}) => {
  // Mobile device detection and Phone LaTeX optimization toggle
  const isMobileDevice = isMobileUserDevice();
  const [optimizeForPhone, setOptimizeForPhone] = useState<boolean>(() => isMobileDevice);

  // Core Configuration - Brief & Focused
  const [subjectType, setSubjectType] = useState<SubjectType>('calculation');
  const [grade, setGrade] = useState<string>('10');
  const [subject, setSubject] = useState<string>('Physics');
  const [topics, setTopics] = useState<string>('Classical Mechanics');
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [timeLimit, setTimeLimit] = useState<number>(20);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Medium');
  const [promptStyle, setPromptStyle] = useState<PromptStyle>('brief');

  // UI View Tab & Interactive States
  const [activeView, setActiveView] = useState<ActiveView>('prompt');
  const [copied, setCopied] = useState<boolean>(false);
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const triggerRegeneration = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 150);
  };

  // Grade Stepper Spinner Helpers
  const currentGradeIndex = useMemo(() => {
    const idx = GRADE_LIST.indexOf(String(grade));
    return idx >= 0 ? idx : 3; // Default to Grade 10 if custom
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

  // Question Count Stepper Spinner Helpers
  const handleDecrementQuestions = () => {
    triggerRegeneration();
    setTotalQuestions((prev) => Math.max(1, prev - 1));
  };

  const handleIncrementQuestions = () => {
    triggerRegeneration();
    setTotalQuestions((prev) => Math.min(100, prev + 1));
  };

  // Time Limit Stepper Spinner Helpers (5-minute increments)
  const handleDecrementTime = () => {
    triggerRegeneration();
    setTimeLimit((prev) => Math.max(5, prev - 5));
  };

  const handleIncrementTime = () => {
    triggerRegeneration();
    setTimeLimit((prev) => Math.min(180, prev + 5));
  };

  // Quick curriculum presets
  const applyPreset = (preset: 'physics' | 'math12' | 'chemistry' | 'freshman' | 'senior' | 'biology' | 'social') => {
    triggerRegeneration();
    if (preset === 'physics') {
      setSubjectType('calculation');
      setGrade('10');
      setSubject('Physics');
      setTopics('Classical Mechanics');
      setTotalQuestions(10);
      setTimeLimit(20);
      setDifficulty('Medium');
    } else if (preset === 'math12') {
      setSubjectType('calculation');
      setGrade('12');
      setSubject('Mathematics');
      setTopics('Quadratic Equations & Calculus');
      setTotalQuestions(10);
      setTimeLimit(25);
      setDifficulty('Medium');
    } else if (preset === 'chemistry') {
      setSubjectType('calculation');
      setGrade('11');
      setSubject('Chemistry');
      setTopics('Chemical Equilibrium & Stoichiometry');
      setTotalQuestions(10);
      setTimeLimit(20);
      setDifficulty('Medium');
    } else if (preset === 'freshman') {
      setSubjectType('calculation');
      setGrade('Freshman');
      setSubject('Applied Mathematics I');
      setTopics('Limits & Derivatives');
      setTotalQuestions(10);
      setTimeLimit(30);
      setDifficulty('Hard');
    } else if (preset === 'senior') {
      setSubjectType('calculation');
      setGrade('Senior University');
      setSubject('Applied Mathematics / Engineering');
      setTopics('Differential Equations & Systems');
      setTotalQuestions(10);
      setTimeLimit(35);
      setDifficulty('Hard');
    } else if (preset === 'biology') {
      setSubjectType('theory');
      setGrade('10');
      setSubject('Biology');
      setTopics('Cell Energetics & Molecular Biology');
      setTotalQuestions(10);
      setTimeLimit(20);
      setDifficulty('Medium');
    } else if (preset === 'social') {
      setSubjectType('theory');
      setGrade('11');
      setSubject('History & Civics');
      setTopics('Ethiopian History & Governance');
      setTotalQuestions(10);
      setTimeLimit(20);
      setDifficulty('Medium');
    }
  };

  // Difficulty Directive Details & Pedagogical Rubric
  const difficultyConfig = useMemo(() => {
    if (difficulty === 'Easy') {
      return {
        label: 'Easy (Foundational)',
        badgeColor: 'text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-500/30 font-bold',
        summary: 'Direct single-formula calculations & core concept recall.',
        briefGuide: 'Direct single-formula usage, clean numbers, standard SI units, distinct distractors without tricky traps.',
        detailedDirective: `DIFFICULTY LEVEL DIRECTIVE: EASY (FOUNDATIONAL / RECALL):
- Primary Focus: Direct single-step concept recall and single-formula calculation.
- Given variables must plug directly into standard formulas without prior variable isolation or multi-step substitution.
- Use clean numbers and standard SI units; avoid unit conversion traps (e.g. use m/s and kg directly).
- Distractors (incorrect options): Clear and distinctly different from the correct value; do NOT use confusing trick options or double-negatives.`,
        distractorRule: 'Distractors must be straightforward and distinct, avoiding subtle numerical traps.',
      };
    } else if (difficulty === 'Hard') {
      return {
        label: 'Hard (Advanced / Entrance)',
        badgeColor: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/30 font-bold',
        summary: 'Multi-concept synthesis & realistic distractor traps.',
        briefGuide: 'Combines 2+ principles (e.g. Energy + Kinematics), non-trivial algebra, unit conversion traps, and realistic misconception distractors.',
        detailedDirective: `DIFFICULTY LEVEL DIRECTIVE: HARD (ADVANCED / COMPETITIVE & UNIVERSITY ENTRANCE):
- Primary Focus: High-rigor, multi-concept synthesis combining two or more physical principles (e.g. Conservation of Mechanical Energy + Kinematics, or Work-Energy Theorem + Friction and Newton's 2nd Law; or optimization calculus).
- Requires non-trivial algebraic rearrangement or symbolic derivation before numerical substitution.
- Include realistic unit conversion traps (e.g. km/h to m/s, grams to kg, cm to meters) and boundary conditions.
- Distractors (incorrect options): Sophisticated distractors matching real student pitfalls (e.g. forgetting 1/2 factor in (1/2)mv^2, forgetting square root, sign slip, or using diameter instead of radius).`,
        distractorRule: 'Distractors must reflect common student errors such as neglecting the 1/2 factor, missed square roots, or forgotten unit conversions.',
      };
    } else {
      return {
        label: 'Medium (Standard Exam)',
        badgeColor: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30 font-bold',
        summary: 'National exam benchmark with 2-step algebraic reasoning.',
        briefGuide: 'Standard preparatory exam standard: 2-step reasoning (e.g. find acceleration first), algebraic rearrangement, and plausible distractors.',
        detailedDirective: `DIFFICULTY LEVEL DIRECTIVE: MEDIUM (STANDARD EXAM / NATIONAL CURRICULUM):
- Primary Focus: Standard Ethiopian National Exam / university preparatory exam benchmark.
- Problems require 2 reasoning steps (e.g. solve for an intermediate parameter like acceleration or velocity before computing kinetic energy, force, or distance).
- Requires moderate algebraic isolation of variables.
- Distractors (incorrect options): High-quality plausible choices reflecting common student calculation slips (e.g. forgetting to square terms, inverted fractions, sign slip, or arithmetic slips).`,
        distractorRule: 'Distractors must reflect common student math slips like forgetting to square velocity or inverted fractions.',
      };
    }
  }, [difficulty]);

  // Generate standardized Plain Text (.TXT format) prompt for AI
  const generatedPrompt = useMemo(() => {
    const isMath = subjectType === 'calculation';
    const isMobile = isMobileDevice || optimizeForPhone;
    const mainTopic = topics.split(',')[0]?.trim() || 'Classical Mechanics';
    const cleanGrade = String(grade || '10');

    // BRIEF PROMPT MODE: High-impact, concise, laser-focused
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

CRITICAL RULES FOR EXACT LATEX & PHONE CLIPBOARD COMPLIANCE:
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
   - Place blank lines before and after every display equation for clean formatting.
   - Strictly retain all LaTeX commands and backslashes (\\frac, \\sqrt, \\times, \\cdot, \\pm, ^2, _0, \\Delta, \\theta, \\pi, \\Omega).
   - Wrap units in \\text{...} inside math mode (e.g. \\text{ kg}, \\text{ m/s}^2, \\text{ N}, \\text{ J}).
5. DIFFICULTY CALIBRATION (${difficulty.toUpperCase()}): ${difficultyConfig.briefGuide}
6. REALISTIC DISTRACTORS: Options B, C, D must reflect realistic student calculation slips (${difficultyConfig.distractorRule}).
7. OUTPUT: Return strictly pure plain text. Do not wrap in markdown code blocks (\`\`\`). Start immediately with the FORMAT SPECIFICATION header.`;
      } else {
        return `Please generate ${totalQuestions} professional multiple choice questions in plain .txt format for:
Grade: ${cleanGrade}
Subject: ${subject}
Topic: ${mainTopic}
Time Limit: ${timeLimit} minutes

FORMAT SPECIFICATION:
===============================================================
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
2. DIFFICULTY CALIBRATION (${difficulty.toUpperCase()}): ${difficultyConfig.briefGuide}
3. OUTPUT: Return strictly pure plain text. Do not wrap in markdown code blocks (\`\`\`). Start immediately with the FORMAT SPECIFICATION header.`;
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
   - Do NOT write numbered lists in the explanation (NEVER write "1. Formula", "2. Calculation", "1. Substitute", or "Step 1", "Step 2").
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
     c) Always keep backslashes intact on all LaTeX keywords: \\frac{numerator}{denominator}, \\sqrt{x}, \\times, \\cdot, \\pm, \\Delta, \\theta, \\pi, \\Omega, \\mu. Never output raw ASCII math.
     d) Wrap physical units in \\text{...} inside math mode (e.g. $50\\text{ m/s}$, $1200\\text{ kg}$, $3600\\text{ N}$).
4. DISTRACTOR INTEGRITY:
   - ${difficultyConfig.distractorRule}`;
    } else {
      subjectRules = `CRITICAL THEORY & CONCEPTUAL EXPLANATION RULES:
1. STRICTLY NO NUMBERS IN EXPLANATION:
   - Do NOT use numbered lists like "1. Definition 2. Reason".
   - Structure explanations using bold thematic sections:
     **Core Concept:** [State underlying scientific law, definition, or historical context]
     **Key Reason:** [Explain exactly why the correct answer is valid]
     **Distractor Analysis:** [Briefly clarify why plausible incorrect choices fail]
     **Answer:** [Option Letter and summary statement]${isMobile ? `\n2. FORMULA NOTATION (PHONE-OPTIMIZED): If any scientific formulas or units are used, isolate them on dedicated bracket lines [ formula ] with blank line padding and wrap inline symbols in $...$.` : ''}`;
    }

    return `You are an expert exam professor and national curriculum specialist creating a standardized ${totalQuestions}-question examination for Grade ${cleanGrade} students in ${subject}.

OUTPUT FORMAT REQUIREMENT:
Return the exam strictly in clean plain text (.TXT format), ready for direct import into Exam Master.
- DO NOT wrap the output in markdown code fences (\`\`\`txt or \`\`\`).
- DO NOT include conversational greetings, intros ("Here is your exam"), or outros.
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

${difficultyConfig.detailedDirective}

${subjectRules}

EXAM PARAMETERS:
- Total Questions: ${totalQuestions}
- Grade Level: Grade ${cleanGrade}
- Specific Topics to Cover: ${topics || 'Standard curriculum'}
- Difficulty Setting: ${difficulty}
- Answer Key Balance: Randomize correct option letters evenly across A, B, C, and D.`;
  }, [subjectType, grade, subject, topics, totalQuestions, timeLimit, difficulty, promptStyle, difficultyConfig, isMobileDevice, optimizeForPhone]);

  // Sample TXT Output Preview matching user request
  const sampleTxtPreview = useMemo(() => {
    const cleanGrade = String(grade || '10');
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

  if (!isOpen) return null;

  return (
    <div
      id="professor-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]"
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
                  <span>{optimizeForPhone ? '📱 Phone LaTeX: Active' : 'Phone LaTeX: Off'}</span>
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Instant exam prompts for ChatGPT, Claude, Gemini & DeepSeek
              </p>
            </div>
          </div>

          <button
            id="professor-modal-close-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-[#0f1d33] text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-[#132238] flex items-center justify-center transition cursor-pointer border border-zinc-200 dark:border-white/10"
            aria-label="Close AI Prompt Builder"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs bg-white dark:bg-[#070e1a]">
          {/* Workflow Banner */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10 shadow-xs flex items-center justify-between gap-3 text-zinc-700 dark:text-zinc-300">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center shrink-0 shadow-xs">
                <HelpCircle className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                1. Adjust Parameters → 2. Copy Prompt → 3. Paste into AI & Question Editor
              </span>
            </div>
            {isGenerating && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-[#0f1d33] text-zinc-900 dark:text-white text-[11px] font-bold border border-zinc-300 dark:border-white/10 shrink-0">
                <Loader2 className="w-3 h-3 stroke-[2.5] animate-spin" />
                <span>Updating...</span>
              </div>
            )}
          </div>

          {/* Quick Curriculum Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-1 block">
              Curriculum Presets:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'physics', label: 'Physics (Mechanics)' },
                { id: 'math12', label: 'Grade 12 Math' },
                { id: 'chemistry', label: 'Chemistry' },
                { id: 'freshman', label: 'Freshman Math' },
                { id: 'senior', label: 'Univ Senior' },
                { id: 'biology', label: 'Biology' },
                { id: 'social', label: 'History & Civics' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id as any)}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-[#0f1d33] hover:bg-zinc-200 dark:hover:bg-[#132238] border border-zinc-200 dark:border-white/10 text-zinc-800 dark:text-zinc-200 shadow-2xs active:scale-98 cursor-pointer transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Archetype: Math & Science (Vertical Steps) vs Theory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                triggerRegeneration();
                setSubjectType('calculation');
              }}
              className={`p-3.5 rounded-[22px] border text-left transition cursor-pointer flex items-start gap-3 shadow-xs active:scale-98 ${
                subjectType === 'calculation'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white'
                  : 'bg-zinc-50 dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/20'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                subjectType === 'calculation'
                  ? 'bg-white/10 text-white dark:bg-[#070e1a] dark:text-white border-white/20'
                  : 'bg-white dark:bg-[#0f1d33] text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10'
              }`}>
                <Calculator className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="font-bold flex items-center gap-1.5">
                  <span className={subjectType === 'calculation' ? 'text-white dark:text-zinc-950' : 'text-zinc-900 dark:text-white'}>
                    Math & Science
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                    subjectType === 'calculation'
                      ? 'bg-white/20 text-white dark:bg-[#070e1a] dark:text-white border-transparent'
                      : 'bg-zinc-200 dark:bg-[#0f1d33] text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-white/10'
                  }`}>
                    KaTeX Steps
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 leading-relaxed ${subjectType === 'calculation' ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-500 dark:text-zinc-400'}`}>
                  Step-wise equations with Formula, Calculation & Answer.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerRegeneration();
                setSubjectType('theory');
              }}
              className={`p-3.5 rounded-[22px] border text-left transition cursor-pointer flex items-start gap-3 shadow-xs active:scale-98 ${
                subjectType === 'theory'
                  ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white'
                  : 'bg-zinc-50 dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/20'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                subjectType === 'theory'
                  ? 'bg-white/10 text-white dark:bg-[#070e1a] dark:text-white border-white/20'
                  : 'bg-white dark:bg-[#0f1d33] text-zinc-900 dark:text-white border-zinc-200 dark:border-white/10'
              }`}>
                <BookOpen className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <div className="font-bold flex items-center gap-1.5">
                  <span className={subjectType === 'theory' ? 'text-white dark:text-zinc-950' : 'text-zinc-900 dark:text-white'}>
                    Theory & Concepts
                  </span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                    subjectType === 'theory'
                      ? 'bg-white/20 text-white dark:bg-[#070e1a] dark:text-white border-transparent'
                      : 'bg-zinc-200 dark:bg-[#0f1d33] text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-white/10'
                  }`}>
                    Conceptual
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 leading-relaxed ${subjectType === 'theory' ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-500 dark:text-zinc-400'}`}>
                  Core principles, key reasons & distractor analysis.
                </p>
              </div>
            </button>
          </div>

          {/* Simplified Core Configuration with Interactive Spinners */}
          <div className="p-4 sm:p-5 rounded-[22px] bg-zinc-50 dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Grade Selector with Stepper Spinner */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Grade Level
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevGrade}
                  disabled={currentGradeIndex <= 0}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-[#0f1d33] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#132238] border border-zinc-200 dark:border-white/10 flex items-center justify-center font-bold text-sm disabled:opacity-30 cursor-pointer transition active:scale-95 shrink-0 shadow-2xs"
                  title="Previous grade"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="relative flex-1">
                  <select
                    value={grade}
                    onChange={(e) => {
                      triggerRegeneration();
                      setGrade(e.target.value);
                    }}
                    className="w-full pl-3 pr-8 py-2 rounded-xl bg-white dark:bg-[#070e1a] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-bold focus:outline-hidden focus:border-zinc-900 dark:focus:border-white cursor-pointer shadow-2xs appearance-none"
                  >
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12 (National Prep)</option>
                    <option value="Freshman">University Freshman</option>
                    <option value="Senior University">University Senior</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  type="button"
                  onClick={handleNextGrade}
                  disabled={currentGradeIndex >= GRADE_LIST.length - 1}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-[#0f1d33] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#132238] border border-zinc-200 dark:border-white/10 flex items-center justify-center font-bold text-sm disabled:opacity-30 cursor-pointer transition active:scale-95 shrink-0 shadow-2xs"
                  title="Next grade"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Subject Input */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => {
                  triggerRegeneration();
                  setSubject(e.target.value);
                }}
                placeholder="e.g. Physics"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#070e1a] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-zinc-900 dark:focus:border-white shadow-2xs"
              />
            </div>

            {/* 3. Topic Input */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Topic or Chapter
              </label>
              <input
                type="text"
                value={topics}
                onChange={(e) => {
                  triggerRegeneration();
                  setTopics(e.target.value);
                }}
                placeholder="e.g. Classical Mechanics"
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#070e1a] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-semibold focus:outline-hidden focus:border-zinc-900 dark:focus:border-white shadow-2xs"
              />
            </div>

            {/* 4. Time Limit with Stepper Spinner */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Time Limit
                </label>
                <span className="text-[11px] font-bold text-zinc-900 dark:text-white">
                  {timeLimit} minutes
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDecrementTime}
                  disabled={timeLimit <= 5}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-[#0f1d33] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#132238] border border-zinc-200 dark:border-white/10 flex items-center justify-center font-bold text-sm disabled:opacity-30 cursor-pointer transition active:scale-95 shrink-0 shadow-2xs"
                  title="Decrease by 5 mins"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="relative flex items-center flex-1">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={timeLimit}
                    onChange={(e) => {
                      triggerRegeneration();
                      setTimeLimit(Math.max(1, parseInt(e.target.value, 10) || 20));
                    }}
                    className="w-full px-2 py-2 text-center text-xs font-bold rounded-xl bg-white dark:bg-[#070e1a] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-hidden focus:border-zinc-900 dark:focus:border-white shadow-2xs"
                  />
                  <span className="text-[10px] text-zinc-400 font-bold absolute right-3 pointer-events-none">
                    mins
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleIncrementTime}
                  disabled={timeLimit >= 180}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-[#0f1d33] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#132238] border border-zinc-200 dark:border-white/10 flex items-center justify-center font-bold text-sm disabled:opacity-30 cursor-pointer transition active:scale-95 shrink-0 shadow-2xs"
                  title="Increase by 5 mins"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                {/* Quick Pills */}
                <div className="flex items-center gap-1">
                  {[15, 20, 30].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        triggerRegeneration();
                        setTimeLimit(t);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                        timeLimit === t
                          ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                          : 'bg-white dark:bg-[#0f1d33] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                      }`}
                    >
                      {t}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Question Count with Stepper Spinner */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Question Count
                </label>
                <span className="text-[11px] font-bold text-zinc-900 dark:text-white">
                  {totalQuestions} questions
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDecrementQuestions}
                  disabled={totalQuestions <= 1}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-[#0f1d33] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#132238] border border-zinc-200 dark:border-white/10 flex items-center justify-center font-bold text-sm disabled:opacity-30 cursor-pointer transition active:scale-95 shrink-0 shadow-2xs"
                  title="Decrease question count"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={totalQuestions}
                  onChange={(e) => {
                    triggerRegeneration();
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val > 0) {
                      setTotalQuestions(Math.min(100, Math.max(1, val)));
                    } else if (e.target.value === '') {
                      setTotalQuestions(1);
                    }
                  }}
                  className="flex-1 px-2 py-2 text-center text-xs font-bold rounded-xl bg-white dark:bg-[#070e1a] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-hidden focus:border-zinc-900 dark:focus:border-white shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleIncrementQuestions}
                  disabled={totalQuestions >= 100}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-[#0f1d33] text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#132238] border border-zinc-200 dark:border-white/10 flex items-center justify-center font-bold text-sm disabled:opacity-30 cursor-pointer transition active:scale-95 shrink-0 shadow-2xs"
                  title="Increase question count"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                {/* Quick Pills */}
                <div className="flex items-center gap-1">
                  {[5, 10, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        triggerRegeneration();
                        setTotalQuestions(num);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                        totalQuestions === num
                          ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                          : 'bg-white dark:bg-[#0f1d33] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 6. Difficulty Level Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                  Difficulty Level
                </label>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${difficultyConfig.badgeColor}`}>
                  {difficultyConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {(['Easy', 'Medium', 'Hard'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      triggerRegeneration();
                      setDifficulty(lvl);
                    }}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition shadow-2xs ${
                      difficulty === lvl
                        ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-zinc-950 dark:border-white shadow-xs'
                        : 'bg-white dark:bg-[#0c182b] border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-white/20'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* View Selector: Master Prompt vs .txt Output Preview */}
          <div className="pt-1 space-y-2">
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
                    <span>AI Prompt</span>
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
                    <span>Expected Result</span>
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
                      <Zap className="w-3 h-3" />
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

              {/* Copy Prompt Button */}
              <button
                type="button"
                disabled={isCopying}
                onClick={handleCopy}
                className="px-4 py-2 rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs active:scale-98 disabled:opacity-50"
              >
                {isCopying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Copying...</span>
                  </>
                ) : copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
            </div>

            {/* TAB CONTENT: PROMPT */}
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
                    Plain text format with KaTeX formulas
                  </span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SAMPLE TXT OUTPUT PREVIEW */}
            {activeView === 'txt_preview' && (
              <div className="space-y-1.5">
                <textarea
                  rows={9}
                  readOnly
                  value={sampleTxtPreview}
                  className="w-full p-4 font-mono text-xs leading-relaxed rounded-[22px] bg-zinc-50 dark:bg-[#070e1a] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-zinc-100 select-all focus:outline-hidden shadow-xs"
                />
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
                  Step-by-step layout using <strong>**Formula:**</strong>, <strong>**Calculation:**</strong>, and <strong>**Answer:**</strong>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-zinc-100 dark:border-white/10 bg-zinc-50/80 dark:bg-[#0c182b]/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            <span>Ready to generate in ChatGPT / Claude / Gemini</span>
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
          </div>
        </div>
      </div>
    </div>
  );
};
