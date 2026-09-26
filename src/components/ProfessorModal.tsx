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
  RefreshCw,
} from 'lucide-react';

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

export const ProfessorModal: React.FC<ProfessorModalProps> = ({
  isOpen,
  onClose,
  onGoToQuestionTextEditor,
  onGoToPaste,
}) => {
  // Core Configuration - Brief & Focused
  const [subjectType, setSubjectType] = useState<SubjectType>('calculation');
  const [grade, setGrade] = useState<string | number>(10);
  const [subject, setSubject] = useState<string>('Physics');
  const [topics, setTopics] = useState<string>('Classical Mechanics');
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [eduLevel, setEduLevel] = useState<string>('Grade 10 (Secondary)');
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
    setTimeout(() => setIsGenerating(false), 200);
  };

  // Quick curriculum presets
  const applyPreset = (preset: 'physics' | 'math12' | 'chemistry' | 'freshman' | 'senior' | 'biology' | 'social') => {
    triggerRegeneration();
    if (preset === 'physics') {
      setSubjectType('calculation');
      setGrade(10);
      setSubject('Physics');
      setTopics('Classical Mechanics');
      setTotalQuestions(10);
      setEduLevel('Grade 10 (Secondary)');
      setTimeLimit(20);
      setDifficulty('Medium');
    } else if (preset === 'math12') {
      setSubjectType('calculation');
      setGrade(12);
      setSubject('Mathematics');
      setTopics('Quadratic Equations & Calculus');
      setTotalQuestions(10);
      setEduLevel('Grade 12 / National Exam');
      setTimeLimit(25);
      setDifficulty('Medium');
    } else if (preset === 'chemistry') {
      setSubjectType('calculation');
      setGrade(11);
      setSubject('Chemistry');
      setTopics('Chemical Equilibrium & Stoichiometry');
      setTotalQuestions(10);
      setEduLevel('Grade 11-12');
      setTimeLimit(20);
      setDifficulty('Medium');
    } else if (preset === 'freshman') {
      setSubjectType('calculation');
      setGrade('Freshman');
      setSubject('Applied Mathematics I');
      setTopics('Limits & Derivatives');
      setTotalQuestions(10);
      setEduLevel('University Freshman');
      setTimeLimit(30);
      setDifficulty('Hard');
    } else if (preset === 'senior') {
      setSubjectType('calculation');
      setGrade('Senior University');
      setSubject('Applied Mathematics / Engineering');
      setTopics('Differential Equations & Systems');
      setTotalQuestions(10);
      setEduLevel('University Senior');
      setTimeLimit(35);
      setDifficulty('Hard');
    } else if (preset === 'biology') {
      setSubjectType('theory');
      setGrade(10);
      setSubject('Biology');
      setTopics('Cell Energetics & Molecular Biology');
      setTotalQuestions(10);
      setEduLevel('Grade 10 (Secondary)');
      setTimeLimit(20);
      setDifficulty('Medium');
    } else if (preset === 'social') {
      setSubjectType('theory');
      setGrade(11);
      setSubject('History & Civics');
      setTopics('Ethiopian History & Governance');
      setTotalQuestions(10);
      setEduLevel('Grade 11-12');
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
      // Medium
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
    const mainTopic = topics.split(',')[0]?.trim() || 'Classical Mechanics';
    const cleanGrade = String(grade || (eduLevel.match(/\d+/)?.[0] || '10'));

    // BRIEF PROMPT MODE: High-impact, concise, laser-focused
    if (promptStyle === 'brief') {
      if (isMath) {
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
1. [Clear problem statement with LaTeX notation like \\( m = 1200 \\text{ kg} \\)]
   A) [Option with \\( ... \\)]
   B) [Option with \\( ... \\)]
   C) [Option with \\( ... \\)]
   D) [Option with \\( ... \\)]
   Answer: [Correct Option Letter: A, B, C, or D]
   Explanation: **Formula:**
\\[ [State the governing formula or principle in LaTeX] \\]
**Calculation:**
\\[ [Step-by-step substitution and algebraic evaluation] \\]
**Answer:** \\( [Final numerical value with SI units] \\)

CRITICAL RULES:
1. STRICTLY NO NUMBERS IN EXPLANATION: Do NOT write "1. Formula", "2. Calculation", or "Step 1", "Step 2". Use ONLY bold labels (**Formula:**, **Calculation:**, **Answer:**).
2. LATEX NOTATION: Wrap display equations in \\[ ... \\] and inline variables/numbers in \\( ... \\).
3. DIFFICULTY CALIBRATION (${difficulty.toUpperCase()}): ${difficultyConfig.briefGuide}
4. REALISTIC DISTRACTORS: Options B, C, D must reflect realistic student calculation slips (${difficultyConfig.distractorRule}).
5. OUTPUT: Return strictly pure plain text. Do not wrap in markdown code blocks (\`\`\`). Start immediately with the FORMAT SPECIFICATION header.`;
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
2. DIFFICULTY CALIBRATION (${difficulty.toUpperCase()}): ${difficultyConfig.briefGuide}
3. OUTPUT: Return strictly pure plain text. Do not wrap in markdown code blocks (\`\`\`). Start immediately with the FORMAT SPECIFICATION header.`;
      }
    }

    // DETAILED MASTER PROMPT MODE: Comprehensive curriculum rubric
    let subjectRules = '';
    if (isMath) {
      subjectRules = `CRITICAL FORMATTING & VERTICAL STEP-WISE EXPLANATION RULES (MANDATORY):
1. STRICTLY NO NUMBERS IN EXPLANATION:
   - Do NOT write numbered lists in the explanation (NEVER write "1. Formula", "2. Calculation", "1. Substitute", or "Step 1", "Step 2").
   - Structure every explanation vertically using clean, bold thematic labels:
     **Formula:**
     \\[ \\text{State the governing equation or law} \\]
     **Calculation:**
     \\[ \\text{Step-by-step substitution and numerical evaluation} \\]
     **Answer:** \\( \\text{State final answer clearly with SI units} \\)
2. LATEX MATHEMATICAL NOTATION:
   - Use \\[ ... \\] for display math on its own line (e.g. \\[ E_k = \\frac{1}{2} m v^2 \\]).
   - Use \\( ... \\) for inline variables, parameters, and units (e.g. \\( m = 1200 \\text{ kg} \\), \\( v = 20 \\text{ m/s} \\)).
   - Wrap options in \\( ... \\) when they contain numerical values, equations, or scientific units.
   - Do NOT output raw ASCII math (never write x^2 without \\(x^2\\) or sqrt without \\(\\sqrt{x}\\)).
3. DISTRACTOR INTEGRITY:
   - ${difficultyConfig.distractorRule}`;
    } else {
      subjectRules = `CRITICAL THEORY & CONCEPTUAL EXPLANATION RULES:
1. STRICTLY NO NUMBERS IN EXPLANATION:
   - Do NOT use numbered lists like "1. Definition 2. Reason".
   - Structure explanations using bold thematic sections:
     **Core Concept:** [State underlying scientific law, definition, or historical context]
     **Key Reason:** [Explain exactly why the correct answer is valid]
     **Distractor Analysis:** [Briefly clarify why plausible incorrect choices fail]
     **Answer:** [Option Letter and summary statement]`;
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
1. [Question text or scenario]
   A) [Option A]
   B) [Option B]
   C) [Option C]
   D) [Option D]
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
  }, [subjectType, grade, subject, topics, totalQuestions, eduLevel, timeLimit, difficulty, promptStyle, difficultyConfig]);

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

1. A car of mass \\( m = 1200 \\text{ kg} \\) accelerates from rest to \\( v = 20 \\text{ m/s} \\). What is its kinetic energy?
   A) \\( 240,000 \\text{ J} \\)
   B) \\( 120,000 \\text{ J} \\)
   C) \\( 480,000 \\text{ J} \\)
   D) \\( 24,000 \\text{ J} \\)
   Answer: A
   Explanation: **Formula:**
\\[ E_k = \\frac{1}{2} m v^2 \\]
**Calculation:**
\\[ E_k = \\frac{1}{2} (1200)(20^2) = 600 \\times 400 = 240,000 \\text{ J} = 240 \\text{ kJ} \\]
**Answer:** \\( 240,000 \\text{ J} \\)

2. According to Newton's Second Law, if a net force of \\( 45 \\text{ N} \\) acts on a \\( 5 \\text{ kg} \\) object, what is its acceleration?
   A) \\( 9 \\text{ m/s}^2 \\)
   B) \\( 225 \\text{ m/s}^2 \\)
   C) \\( 0.11 \\text{ m/s}^2 \\)
   D) \\( 40 \\text{ m/s}^2 \\)
   Answer: A
   Explanation: **Formula:**
\\[ F = ma \\implies a = \\frac{F}{m} \\]
**Calculation:**
\\[ a = \\frac{45 \\text{ N}}{5 \\text{ kg}} = 9 \\text{ m/s}^2 \\]
**Answer:** \\( 9 \\text{ m/s}^2 \\)

3. An object is dropped from a height \\( h = 20 \\text{ m} \\) in a vacuum where \\( g = 9.8 \\text{ m/s}^2 \\). What is its speed right before hitting the ground?
   A) \\( 19.8 \\text{ m/s} \\)
   B) \\( 14.0 \\text{ m/s} \\)
   C) \\( 9.8 \\text{ m/s} \\)
   D) \\( 39.2 \\text{ m/s} \\)
   Answer: A
   Explanation: **Conservation of mechanical energy:**
\\[ mgh = \\frac{1}{2}mv^2 \\implies v = \\sqrt{2gh} \\]
**Calculation:**
\\[ v = \\sqrt{2 \\times 9.8 \\times 20} = \\sqrt{392} \\approx 19.8 \\text{ m/s} \\]
**Answer:** \\( 19.8 \\text{ m/s} \\)`;
    } else {
      return `================================================================
FORMAT SPECIFICATION:
Grade: ${cleanGrade}
Subject: ${subject || 'Biology'}
Topic: ${mainTopic || 'Cell Biology'}
Time Limit: ${timeLimit} minutes
================================================================

1. Which cellular organelle is primarily responsible for generating adenosine triphosphate (ATP) through aerobic cellular respiration?
   A) Ribosome
   B) Mitochondria
   C) Endoplasmic Reticulum
   D) Golgi Apparatus
   Answer: B
   Explanation: **Core Concept:**
Mitochondria are known as the powerhouses of eukaryotic cells.
**Key Reason:**
They carry out the citric acid (Krebs) cycle and oxidative phosphorylation to produce the bulk of cellular ATP.
**Distractor Analysis:**
Ribosomes perform protein synthesis, the endoplasmic reticulum processes lipids and proteins, and the Golgi apparatus packages macromolecules.
**Answer:** Option B`;
    }
  }, [subjectType, grade, subject, topics, timeLimit]);

  const handleCopy = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setTimeout(() => {
        setIsCopying(false);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }, 220);
    } catch {
      setIsCopying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="professor-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]"
    >
      <div
        id="professor-modal-container"
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-[32px] bg-black text-white border border-zinc-800 shadow-2xl overflow-hidden backdrop-blur-2xl"
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-700" />

        {/* Header */}
        <div className="relative px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-black border-2 border-black flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-['Outfit',sans-serif] text-white">
                  AI Prompt Studio
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-900 text-white border border-zinc-700">
                  1-Click Format
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Instant exam prompts for ChatGPT, Claude, Gemini & DeepSeek
              </p>
            </div>
          </div>

          <button
            id="professor-modal-close-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white text-black hover:bg-zinc-100 flex items-center justify-center transition cursor-pointer border border-black"
            aria-label="Close AI Prompt Builder"
          >
            <X className="w-4 h-4 text-black stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5 text-xs bg-black">
          {/* Workflow Banner */}
          <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-white text-black flex items-center justify-center shrink-0 border border-black shadow-xs">
                <HelpCircle className="w-4 h-4 text-black stroke-[2.5]" />
              </div>
              <span className="text-xs font-semibold text-zinc-200">
                1. Copy Prompt → 2. Ask AI → 3. Paste plain text into Question Editor
              </span>
            </div>
            {isGenerating && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white text-black text-[11px] font-bold border border-black shrink-0">
                <Loader2 className="w-3 h-3 text-black stroke-[2.5] animate-spin" />
                <span>Formatting...</span>
              </div>
            )}
          </div>

          {/* Quick Curriculum Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1 block">
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
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white shadow-2xs active:scale-98 cursor-pointer transition hover:border-white"
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
                  ? 'bg-white text-black border-2 border-black'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white text-black border border-black shadow-xs flex items-center justify-center shrink-0">
                <Calculator className="w-4 h-4 text-black stroke-[2.5]" />
              </div>
              <div>
                <div className="font-bold flex items-center gap-1.5">
                  <span className={subjectType === 'calculation' ? 'text-black' : 'text-white'}>Math & Science</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                    subjectType === 'calculation'
                      ? 'bg-black text-white border-black'
                      : 'bg-zinc-900 text-white border-zinc-700'
                  }`}>
                    KaTeX Math
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 leading-relaxed ${subjectType === 'calculation' ? 'text-zinc-700' : 'text-zinc-400'}`}>
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
                  ? 'bg-white text-black border-2 border-black'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white text-black border border-black shadow-xs flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-black stroke-[2.5]" />
              </div>
              <div>
                <div className="font-bold flex items-center gap-1.5">
                  <span className={subjectType === 'theory' ? 'text-black' : 'text-white'}>Theory & Concepts</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                    subjectType === 'theory'
                      ? 'bg-black text-white border-black'
                      : 'bg-zinc-900 text-white border-zinc-700'
                  }`}>
                    Conceptual
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 leading-relaxed ${subjectType === 'theory' ? 'text-zinc-700' : 'text-zinc-400'}`}>
                  Core principles, reasons & distractor analysis.
                </p>
              </div>
            </button>
          </div>

          {/* Core Configuration Inputs */}
          <div className="p-4 sm:p-5 rounded-[22px] bg-zinc-950 border border-zinc-800 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-200 mb-1">
                Grade
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={['9', '10', '11', '12', 'Freshman', 'Senior University', 'University Senior'].includes(String(grade)) ? (String(grade) === 'University Senior' ? 'Senior University' : String(grade)) : 'custom'}
                  onChange={(e) => {
                    triggerRegeneration();
                    if (e.target.value !== 'custom') {
                      setGrade(e.target.value);
                    }
                  }}
                  className="w-32 px-3 py-2 rounded-full bg-black border border-zinc-700 text-white text-xs font-semibold focus:outline-hidden focus:border-white cursor-pointer"
                >
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                  <option value="Freshman">Freshman</option>
                  <option value="Senior University">University Senior</option>
                  <option value="custom">Other</option>
                </select>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => {
                    triggerRegeneration();
                    setGrade(e.target.value);
                  }}
                  placeholder="e.g. 10"
                  className="flex-1 px-3.5 py-2 rounded-full bg-black border border-zinc-700 text-white text-xs focus:outline-hidden focus:border-white font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-200 mb-1">
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
                className="w-full px-3.5 py-2 rounded-full bg-black border border-zinc-700 text-white text-xs focus:outline-hidden focus:border-white font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-200 mb-1">
                Topic
              </label>
              <input
                type="text"
                value={topics}
                onChange={(e) => {
                  triggerRegeneration();
                  setTopics(e.target.value);
                }}
                placeholder="e.g. Classical Mechanics"
                className="w-full px-3.5 py-2 rounded-full bg-black border border-zinc-700 text-white text-xs focus:outline-hidden focus:border-white font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-200 mb-1">
                Time Limit (minutes)
              </label>
              <div className="flex items-center gap-2">
                {[15, 20, 30].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      triggerRegeneration();
                      setTimeLimit(t);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition border ${
                      timeLimit === t
                        ? 'bg-white text-black border-black shadow-xs'
                        : 'bg-black border-zinc-700 text-zinc-300'
                    }`}
                  >
                    {t}m
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={timeLimit}
                  onChange={(e) => {
                    triggerRegeneration();
                    setTimeLimit(Math.max(1, parseInt(e.target.value, 10) || 20));
                  }}
                  className="w-20 px-2.5 py-1.5 text-xs rounded-full bg-black border border-zinc-700 text-white font-medium text-center focus:outline-hidden focus:border-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-zinc-200">
                  Question Count
                </label>
                <span className="text-[11px] font-bold text-white">
                  {totalQuestions} Qs
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      triggerRegeneration();
                      setTotalQuestions(num);
                    }}
                    className={`px-3 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition shadow-2xs ${
                      totalQuestions === num
                        ? 'bg-white text-black border-black shadow-xs'
                        : 'bg-black border-zinc-700 text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <div className="flex items-center gap-1 flex-1 min-w-[75px]">
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
                    placeholder="Custom"
                    className="w-full px-2.5 py-1.5 text-xs rounded-full bg-black border border-zinc-700 text-white font-medium focus:outline-hidden focus:border-white text-center"
                    title="Enter any number of questions"
                  />
                </div>
              </div>
            </div>

            {/* Difficulty Level with Dynamic Directive Handling */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-zinc-200">
                  Difficulty Level
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-black bg-white text-black">
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
                    className={`flex-1 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition shadow-2xs ${
                      difficulty === lvl
                        ? 'bg-white text-black border-black shadow-xs'
                        : 'bg-black border-zinc-700 text-zinc-300 hover:border-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-zinc-400 mt-1 leading-tight font-medium">
                {difficultyConfig.summary}
              </p>
            </div>
          </div>

          {/* View Selector: Master Prompt vs .txt Output Preview */}
          <div className="pt-1 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                {/* Main View Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-full bg-zinc-950 border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setActiveView('prompt')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      activeView === 'prompt'
                        ? 'bg-white text-black border border-black shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="p-0.5 rounded bg-white text-black flex items-center justify-center">
                      <Code className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                    </span>
                    <span>AI Prompt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('txt_preview')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      activeView === 'txt_preview'
                        ? 'bg-white text-black border border-black shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="p-0.5 rounded bg-white text-black flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                    </span>
                    <span>Expected Result</span>
                  </button>
                </div>

                {/* Brief vs Detailed Toggle (Only in Prompt view) */}
                {activeView === 'prompt' && (
                  <div className="flex items-center gap-1 p-0.5 rounded-full bg-zinc-950 border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        triggerRegeneration();
                        setPromptStyle('brief');
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        promptStyle === 'brief'
                          ? 'bg-white text-black shadow-xs'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Concise high-impact prompt"
                    >
                      <span className="p-0.5 rounded bg-white text-black flex items-center justify-center">
                        <Zap className="w-3 h-3 text-black stroke-[2.5]" />
                      </span>
                      <span>Brief</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        triggerRegeneration();
                        setPromptStyle('detailed');
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        promptStyle === 'detailed'
                          ? 'bg-white text-black shadow-xs'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                      title="Full pedagogical rubric"
                    >
                      <span>Full Rubric</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={isCopying}
                onClick={handleCopy}
                className="px-4 py-2 rounded-full bg-white text-black hover:bg-zinc-100 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-[0_3px_0_#000000] border-2 border-black active:scale-98 disabled:opacity-50"
              >
                {isCopying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-black stroke-[2.5] animate-spin" />
                    <span>Copying...</span>
                  </>
                ) : copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
            </div>

            {/* TAB CONTENT: PROMPT */}
            {activeView === 'prompt' && (
              <div className="space-y-1.5">
                <textarea
                  id="generated-prompt-textarea"
                  rows={9}
                  readOnly
                  value={generatedPrompt}
                  className="w-full p-4 font-mono text-xs leading-relaxed rounded-[22px] bg-zinc-950 border border-zinc-800 text-white select-all focus:outline-hidden shadow-xs"
                />
                <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 flex-wrap gap-2">
                  <span>Works with ChatGPT, Claude, Gemini & DeepSeek.</span>
                  <span className="text-white font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
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
                  className="w-full p-4 font-mono text-xs leading-relaxed rounded-[22px] bg-zinc-950 border border-zinc-800 text-white select-all focus:outline-hidden shadow-xs"
                />
                <p className="text-[11px] text-zinc-400 px-1">
                  Vertical calculation steps using <strong>**Formula:**</strong>, <strong>**Calculation:**</strong>, and <strong>**Answer:**</strong>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-black flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
            <span>Ready for AI</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="professor-footer-close-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-zinc-700 bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 cursor-pointer shadow-xs transition"
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
              className="px-5 py-2 rounded-full bg-white text-black hover:bg-zinc-100 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-[0_3px_0_#000000] border-2 border-black active:scale-98 transition"
            >
              <span>Next: Question Editor</span>
              <ArrowRight className="w-3.5 h-3.5 text-black stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

