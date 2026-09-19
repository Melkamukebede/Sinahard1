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
} from 'lucide-react';

interface ProfessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToQuestionTextEditor?: () => void;
  onGoToPaste?: () => void;
}

type SubjectType = 'calculation' | 'theory';
type ActiveView = 'prompt' | 'txt_preview';

export const ProfessorModal: React.FC<ProfessorModalProps> = ({
  isOpen,
  onClose,
  onGoToQuestionTextEditor,
  onGoToPaste,
}) => {
  // Core Configuration - Brief & Focused
  const [subjectType, setSubjectType] = useState<SubjectType>('calculation');
  const [subject, setSubject] = useState<string>('Grade 12 Mathematics');
  const [topics, setTopics] = useState<string>('quadratic equations, derivatives, limits, matrices');
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [eduLevel, setEduLevel] = useState<string>('Grade 12 / National Exam');
  const [timeLimit, setTimeLimit] = useState<number>(25);
  const [difficulty, setDifficulty] = useState<'Standard' | 'Challenging' | 'Introductory'>('Standard');

  // UI View Tab
  const [activeView, setActiveView] = useState<ActiveView>('prompt');
  const [copied, setCopied] = useState<boolean>(false);

  // Quick curriculum presets
  const applyPreset = (preset: 'math12' | 'physics' | 'chemistry' | 'biology' | 'freshman' | 'social') => {
    if (preset === 'math12') {
      setSubjectType('calculation');
      setSubject('Grade 12 Mathematics');
      setTopics('quadratic equations, limits, derivatives, matrices, vectors');
      setTotalQuestions(10);
      setEduLevel('Grade 12 / National Exam');
      setTimeLimit(25);
      setDifficulty('Standard');
    } else if (preset === 'physics') {
      setSubjectType('calculation');
      setSubject('Grade 12 Physics');
      setTopics('kinematics, Newton laws, work & energy, electromagnetism, optics');
      setTotalQuestions(10);
      setEduLevel('Grade 12 / National Exam');
      setTimeLimit(25);
      setDifficulty('Standard');
    } else if (preset === 'chemistry') {
      setSubjectType('calculation');
      setSubject('Grade 12 Chemistry');
      setTopics('mole concept, stoichiometry, gas laws, chemical equilibrium, acids & bases');
      setTotalQuestions(8);
      setEduLevel('Grade 12 / National Exam');
      setTimeLimit(20);
      setDifficulty('Standard');
    } else if (preset === 'freshman') {
      setSubjectType('calculation');
      setSubject('Freshman Applied Mathematics I');
      setTopics('limits, continuity, derivatives, optimization, integrals');
      setTotalQuestions(10);
      setEduLevel('University Freshman');
      setTimeLimit(30);
      setDifficulty('Challenging');
    } else if (preset === 'biology') {
      setSubjectType('theory');
      setSubject('Grade 12 Biology');
      setTopics('cell biology, enzymes, photosynthesis, genetics, human physiology');
      setTotalQuestions(10);
      setEduLevel('Grade 12 / National Exam');
      setTimeLimit(20);
      setDifficulty('Standard');
    } else if (preset === 'social') {
      setSubjectType('theory');
      setSubject('History & Social Studies');
      setTopics('Ethiopian history, modern world history, government, civics');
      setTotalQuestions(10);
      setEduLevel('Grade 11-12');
      setTimeLimit(20);
      setDifficulty('Standard');
    }
  };

  // Generate standardized Plain Text (.TXT format) prompt for AI
  const generatedPrompt = useMemo(() => {
    const isMath = subjectType === 'calculation';

    let mathRules = '';
    if (isMath) {
      mathRules = `CRITICAL FORMATTING & VERTICAL EXPLANATION RULES (MANDATORY):
1. VERTICAL STEP-WISE EXPLANATIONS:
   - For all calculations and math questions, the explanation MUST be written vertically step-by-step.
   - NEVER write calculations horizontally on one continuous line or inside a dense paragraph.
   - Format each mathematical step on its own separate line vertically:
     Step 1: State the governing formula or principle: \\( ... \\)
     Step 2: Substitute the given values into the formula: \\( ... \\)
     Step 3: Intermediate simplification step: \\( ... \\)
     Step 4: Compute the final numerical/algebraic result: \\( ... \\)
     Conclusion: State the correct answer clearly.
2. ENCLOSE ALL MATH IN LATEX:
   - Use \\( ... \\) for inline formulas, variables, and units (e.g. \\(f(x) = 2x^2 + 5x\\), \\(x = \\pm 2\\), \\(\\frac{a}{b}\\), \\(\\sqrt{16}\\), \\(9.8\\,\\text{m/s}^2\\)).
   - Wrap options in \\( ... \\) when they contain formulas (e.g. A) \\(x = 2\\), B) \\(x = -2\\)).
   - Do NOT output raw ASCII math (never write x^2 without \\(x^2\\) or sqrt without \\(\\sqrt{x}\\)).`;
    } else {
      mathRules = `CRITICAL THEORY & CONCEPTUAL FORMATTING RULES:
1. Do NOT use LaTeX tags or math delimiters (no \\( ... \\)).
2. Provide clear, vertical bulleted explanations:
   - Core Concept: State the underlying scientific or historical principle.
   - Key Reason: Explain why the correct option is true.
   - Distractor Check: Briefly note why plausible incorrect options are false.`;
    }

    return `You are an expert exam professor and curriculum specialist creating a standardized ${totalQuestions}-question exam for ${eduLevel} students in ${subject}.

OUTPUT FORMAT REQUIREMENT:
Return the exam strictly in clean plain text (.TXT format), ready for direct import into Exam Master.
- DO NOT wrap the output in markdown code fences (\`\`\`txt or \`\`\`).
- DO NOT include conversational greetings, intros ("Here is your exam"), or outros.
- Start directly on line 1 with the EXAM header below, followed by question 1.

REQUIRED EXAM HEADER:
EXAM: ${subject} Exam
SUBJECT: ${subject}
SUBJECT TYPE: ${isMath ? 'Calculation' : 'Theory'}
DIFFICULTY: ${difficulty}
TIME LIMIT: ${timeLimit}
PASSING SCORE: 70
DESCRIPTION: Standardized ${eduLevel} examination covering ${topics || 'core curriculum topics'}.

QUESTION STRUCTURE (Repeat for all ${totalQuestions} questions):
1. [Question text or scenario]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [Correct Option Letter: A, B, C, or D]
Explanation:
[Provide vertical step-wise explanation according to rules below]

${mathRules}

EXAM PARAMETERS:
- Total Questions: ${totalQuestions}
- Curriculum Level: ${eduLevel}
- Specific Topics to Cover: ${topics || 'Standard curriculum'}
- Difficulty Level: ${difficulty}
- Randomize the correct answer letter evenly among A, B, C, and D.`;
  }, [subjectType, subject, topics, totalQuestions, eduLevel, timeLimit, difficulty]);

  // Sample TXT Output Preview
  const sampleTxtPreview = useMemo(() => {
    if (subjectType === 'calculation') {
      return `EXAM: Grade 12 Mathematics Exam
SUBJECT: Grade 12 Mathematics
SUBJECT TYPE: Calculation
DIFFICULTY: Standard
TIME LIMIT: 25
PASSING SCORE: 70
DESCRIPTION: Standardized Grade 12 examination covering quadratic equations and calculus.

1. Find the real solutions of the equation \\(2x^2 - 8 = 0\\).
A) \\(x = 2\\)
B) \\(x = \\pm 2\\)
C) \\(x = 4\\)
D) \\(x = \\pm 4\\)
Answer: B
Explanation:
Step 1: Divide both sides by 2:
\\(x^2 - 4 = 0\\)
Step 2: Add 4 to both sides:
\\(x^2 = 4\\)
Step 3: Take the square root of both sides:
\\(x = \\pm \\sqrt{4}\\)
Step 4: Compute the roots:
\\(x = \\pm 2\\)
Conclusion: The equation has two real roots, \\(x = 2\\) and \\(x = -2\\). Hence option B is correct.

2. What is the derivative of the function \\(f(x) = 3x^2 + 5x - 4\\)?
A) \\(3x + 5\\)
B) \\(6x - 4\\)
C) \\(6x + 5\\)
D) \\(6x^2 + 5\\)
Answer: C
Explanation:
Step 1: Apply the power rule \\(\\frac{d}{dx}[x^n] = n x^{n-1}\\) to each term:
Step 2: Differentiate \\(3x^2\\):
\\(\\frac{d}{dx}[3x^2] = 3 \\cdot 2x = 6x\\)
Step 3: Differentiate \\(5x\\) and constant \\(-4\\):
\\(\\frac{d}{dx}[5x] = 5\\)
\\(\\frac{d}{dx}[-4] = 0\\)
Step 4: Sum the derivatives:
\\(f'(x) = 6x + 5\\)
Conclusion: Option C is the correct derivative.`;
    } else {
      return `EXAM: Grade 12 Biology Exam
SUBJECT: Grade 12 Biology
SUBJECT TYPE: Theory
DIFFICULTY: Standard
TIME LIMIT: 20
PASSING SCORE: 70
DESCRIPTION: Standardized Grade 12 examination covering cell biology and physiology.

1. Which cellular organelle is primarily responsible for generating adenosine triphosphate (ATP) through aerobic cellular respiration?
A) Ribosome
B) Mitochondria
C) Endoplasmic Reticulum
D) Golgi Apparatus
Answer: B
Explanation:
- Core Concept: Mitochondria are known as the powerhouses of eukaryotic cells.
- Mechanism: They carry out the citric acid cycle and oxidative phosphorylation to produce ATP.
- Distractor Check: Ribosomes synthesize proteins, whereas the Golgi apparatus modifies and packages molecules.
Conclusion: Option B is correct.

2. In flowering plants, where do the light-dependent reactions of photosynthesis take place?
A) Thylakoid membranes
B) Stroma
C) Outer chloroplast membrane
D) Cytosol
Answer: A
Explanation:
- Core Concept: Light-dependent reactions require chlorophyll pigments located within the thylakoid membrane.
- Mechanism: Photons are absorbed to split water and generate ATP and NADPH.
- Distractor Check: The Calvin cycle takes place in the stroma.
Conclusion: Option A is correct.`;
    }
  }, [subjectType]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // fallback
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="professor-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]"
    >
      <div
        id="professor-modal-container"
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#0b1322] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden text-zinc-900 dark:text-white"
      >
        {/* Header - Calm & Focused */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                  Exam Professor
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                  AI Prompt Builder
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Generate tailored prompts for ChatGPT, Claude, Gemini, or DeepSeek
              </p>
            </div>
          </div>

          <button
            id="professor-modal-close-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Close Professor Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Calm Hint Banner: AI must create .txt file */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-zinc-700 dark:text-zinc-300 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-zinc-900 dark:text-white block">
                Hint: AI must create plain .txt content
              </span>
              <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                Copy this prompt, send it to any AI (ChatGPT, Claude, Gemini, DeepSeek), and paste the resulting text straight back into the Question Text Editor.
              </p>
            </div>
          </div>

          {/* Quick Curriculum Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-500 block">
              Quick Presets:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'math12', label: 'Grade 12 Math' },
                { id: 'physics', label: 'Physics' },
                { id: 'chemistry', label: 'Chemistry' },
                { id: 'freshman', label: 'Freshman Math' },
                { id: 'biology', label: 'Biology' },
                { id: 'social', label: 'History & Civics' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id as any)}
                  className="px-2.5 py-1 rounded-xl text-xs bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Archetype: Math & Science (Vertical Steps) vs Theory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setSubjectType('calculation')}
              className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                subjectType === 'calculation'
                  ? 'bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/20'
                  : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span>Math & Science</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                    Vertical Steps
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  Enforces vertical step-by-step mathematical explanations and LaTeX notation.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSubjectType('theory')}
              className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3 ${
                subjectType === 'theory'
                  ? 'bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/20'
                  : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span>Theory & Concepts</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold">
                    No LaTeX
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  Focuses on clear definitions, mechanisms, and real-world conceptual understanding.
                </p>
              </div>
            </button>
          </div>

          {/* Core Configuration Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Subject Name
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Grade 12 Physics"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Academic Level
              </label>
              <select
                value={eduLevel}
                onChange={(e) => setEduLevel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
              >
                <option value="Grade 9-10 (Secondary)">Grade 9-10 (Secondary)</option>
                <option value="Grade 11-12 / National Exam">Grade 11-12 / National Exam</option>
                <option value="University Freshman">University Freshman</option>
                <option value="University Advanced">University Advanced</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Topics or Syllabus Chapters
              </label>
              <input
                type="text"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="e.g. limits, derivatives, quadratic equations, matrices"
                className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  Question Count (Preset or enter manually)
                </label>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {totalQuestions} Questions
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTotalQuestions(num)}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                      totalQuestions === num
                        ? 'bg-emerald-500 text-zinc-950 font-bold border-emerald-500'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
                <div className="flex items-center gap-1 flex-1 min-w-[85px]">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={totalQuestions}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val > 0) {
                        setTotalQuestions(Math.min(100, Math.max(1, val)));
                      } else if (e.target.value === '') {
                        setTotalQuestions(1);
                      }
                    }}
                    placeholder="Custom"
                    className="w-full px-2 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40 text-center"
                    title="Enter any number of questions manually"
                  />
                  <span className="text-[10px] text-zinc-400 shrink-0">custom</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Difficulty Level
              </label>
              <div className="flex items-center gap-1.5">
                {(['Standard', 'Challenging', 'Introductory'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                      difficulty === lvl
                        ? 'bg-emerald-500 text-zinc-950 font-bold border-emerald-500'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* View Selector: Master Prompt vs .txt Output Preview */}
          <div className="pt-2 space-y-2">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveView('prompt')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'prompt'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>AI Prompt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('txt_preview')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'txt_preview'
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Expected .txt Result</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Prompt'}</span>
              </button>
            </div>

            {/* TAB CONTENT: PROMPT */}
            {activeView === 'prompt' && (
              <div className="space-y-1.5">
                <textarea
                  id="generated-prompt-textarea"
                  rows={8}
                  readOnly
                  value={generatedPrompt}
                  className="w-full p-3.5 font-mono text-xs leading-relaxed rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 select-all focus:outline-hidden"
                />
                <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
                  <span>Works with ChatGPT, Claude, Gemini, and DeepSeek.</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Clean plain text format ready for instant import
                  </span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SAMPLE TXT OUTPUT PREVIEW */}
            {activeView === 'txt_preview' && (
              <div className="space-y-1.5">
                <textarea
                  rows={8}
                  readOnly
                  value={sampleTxtPreview}
                  className="w-full p-3.5 font-mono text-xs leading-relaxed rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 select-all focus:outline-hidden"
                />
                <p className="text-[11px] text-zinc-500 px-1">
                  Notice how each math question has vertical step-wise calculations on separate lines.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="hidden sm:inline">
              1. Copy Prompt → 2. Ask AI → 3. Paste into Question Text Editor
            </span>
            <span className="sm:hidden">
              Prompt ready for AI
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="professor-footer-close-btn"
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Close
            </button>

            <button
              id="professor-go-to-editor-btn"
              type="button"
              onClick={() => {
                onClose();
                if (onGoToQuestionTextEditor) {
                  onGoToQuestionTextEditor();
                } else if (onGoToPaste) {
                  onGoToPaste();
                }
              }}
              className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 transition-all hover:gap-2"
            >
              <span>Next: Question Text Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
