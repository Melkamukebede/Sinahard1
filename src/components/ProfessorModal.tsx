import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  X,
  ArrowRight,
  Sliders,
  BookOpen,
  Atom,
  Calculator,
  Sigma,
  FileText,
  Eye,
  CheckCircle2,
  Lightbulb,
  HelpCircle,
  Code,
  Layers,
  FlaskConical,
  Landmark,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

interface ProfessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToQuestionTextEditor?: () => void;
  onGoToPaste?: () => void;
}

type SubjectType = 'calculation' | 'theory';
type ActiveView = 'prompt' | 'txt_preview' | 'latex_guide';
type MathDomain = 'math' | 'physics' | 'chemistry' | 'engineering';
type TheoryStyle = 'conceptual' | 'scenario' | 'analytical' | 'definitions';
type ExplanationStyle = 'stepwise' | 'concise' | 'comparative';
type MemoryTrickOption = 'none' | 'few' | 'many';

export const ProfessorModal: React.FC<ProfessorModalProps> = ({
  isOpen,
  onClose,
  onGoToQuestionTextEditor,
  onGoToPaste,
}) => {
  // Core Configuration
  const [subjectType, setSubjectType] = useState<SubjectType>('calculation');
  const [subject, setSubject] = useState<string>('Mathematics');
  const [topics, setTopics] = useState<string>('algebra, quadratic equations, calculus, derivatives');
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [eduLevel, setEduLevel] = useState<string>('High School');
  const [timeLimit, setTimeLimit] = useState<number>(25);

  // Math-specific states (LaTeX enabled)
  const [mathDomain, setMathDomain] = useState<MathDomain>('math');
  const [stepwiseMath, setStepwiseMath] = useState<boolean>(true);
  const [mathInOptions, setMathInOptions] = useState<boolean>(true);

  // Theory-specific states (No LaTeX)
  const [theoryStyle, setTheoryStyle] = useState<TheoryStyle>('conceptual');
  const [explanationStyle, setExplanationStyle] = useState<ExplanationStyle>('stepwise');

  // Common parameters
  const [memoryTricks, setMemoryTricks] = useState<MemoryTrickOption>('few');
  const [realLifeCount, setRealLifeCount] = useState<number>(2);
  const [easyPct, setEasyPct] = useState<number>(20);
  const [mediumPct, setMediumPct] = useState<number>(60);
  const [hardPct, setHardPct] = useState<number>(20);
  const [conceptDepth, setConceptDepth] = useState<string>('Intermediate');
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');

  // UI View Tab
  const [activeView, setActiveView] = useState<ActiveView>('prompt');
  const [copied, setCopied] = useState<boolean>(false);

  // Load Presets
  const applyPreset = (presetName: string) => {
    if (presetName === 'hs_math') {
      setSubjectType('calculation');
      setSubject('Grade 12 Mathematics');
      setTopics('quadratic equations, functions, derivatives, limits, matrices');
      setTotalQuestions(10);
      setTimeLimit(30);
      setEasyPct(20);
      setMediumPct(60);
      setHardPct(20);
      setEduLevel('High School');
      setConceptDepth('Intermediate');
      setMathDomain('math');
      setStepwiseMath(true);
      setMathInOptions(true);
    } else if (presetName === 'uni_physics') {
      setSubjectType('calculation');
      setSubject('Physics & Mechanics');
      setTopics('kinematics, Newton\'s laws of motion, work & energy, momentum, rotational dynamics');
      setTotalQuestions(10);
      setTimeLimit(35);
      setEasyPct(10);
      setMediumPct(50);
      setHardPct(40);
      setEduLevel('University');
      setConceptDepth('Advanced');
      setMathDomain('physics');
      setStepwiseMath(true);
      setMathInOptions(true);
    } else if (presetName === 'chem_calc') {
      setSubjectType('calculation');
      setSubject('Chemistry & Stoichiometry');
      setTopics('mole concept, stoichiometry, gas laws, thermodynamics, equilibrium');
      setTotalQuestions(8);
      setTimeLimit(25);
      setEasyPct(25);
      setMediumPct(55);
      setHardPct(20);
      setEduLevel('High School');
      setConceptDepth('Intermediate');
      setMathDomain('chemistry');
      setStepwiseMath(true);
      setMathInOptions(true);
    } else if (presetName === 'bio_theory') {
      setSubjectType('theory');
      setSubject('Biology & Life Sciences');
      setTopics('cell organelles, enzymes, photosynthesis, cellular respiration, genetics, ecology');
      setTotalQuestions(10);
      setTimeLimit(20);
      setEasyPct(30);
      setMediumPct(50);
      setHardPct(20);
      setEduLevel('High School');
      setConceptDepth('Intermediate');
      setTheoryStyle('conceptual');
      setExplanationStyle('stepwise');
    } else if (presetName === 'history_theory') {
      setSubjectType('theory');
      setSubject('History & Social Studies');
      setTopics('modern world history, African independence movements, international treaties, cold war');
      setTotalQuestions(10);
      setTimeLimit(20);
      setEasyPct(30);
      setMediumPct(50);
      setHardPct(20);
      setEduLevel('High School');
      setConceptDepth('Intermediate');
      setTheoryStyle('scenario');
      setExplanationStyle('stepwise');
    } else if (presetName === 'econ_theory') {
      setSubjectType('theory');
      setSubject('Economics & Business');
      setTopics('supply and demand, fiscal policy, inflation, gross domestic product, market structures');
      setTotalQuestions(10);
      setTimeLimit(25);
      setEasyPct(20);
      setMediumPct(60);
      setHardPct(20);
      setEduLevel('University');
      setConceptDepth('Intermediate');
      setTheoryStyle('analytical');
      setExplanationStyle('comparative');
    }
  };

  // Compute Difficulty Label
  const difficultySummary = useMemo(() => {
    if (hardPct >= 40) return 'Hard';
    if (easyPct >= 50) return 'Easy';
    return 'Medium';
  }, [easyPct, hardPct]);

  // Generate standard plain text (.TXT format) prompt
  const generatedPrompt = useMemo(() => {
    const isMath = subjectType === 'calculation';

    let mathRules = '';
    if (isMath) {
      mathRules = `
CRITICAL LATEX MATHEMATICAL FORMATTING RULES:
1. Enclose ALL mathematical expressions, variables, formulas, equations, fractions, and units in LaTeX delimiters:
   - Use \\( ... \\) for inline math (e.g. \\(f(x) = 2x^2 + 5x - 3\\), \\(x = \\pm 2\\), \\(\\frac{a}{b}\\), \\(\\sqrt{16}\\), \\(g = 9.8\\,\\text{m/s}^2\\)).
   - Use \\[ ... \\] for centered display / block equations for prominent equations.
2. Multiple Choice Options:
   ${mathInOptions ? '- Wrap all mathematical expressions in \\( ... \\) (e.g. A) \\(x = 2\\), B) \\(x = -2\\), C) \\(x = \\pm 2\\), D) \\(x = 4\\)).' : '- Format options cleanly and clearly.'}
3. Never output raw ASCII math (e.g. never write x^2 or sqrt(x) or a/b without LaTeX).
4. Explanations:
   ${stepwiseMath ? '- Provide a numbered step-by-step derivation: 1. **Identify Formula**, 2. **Substitute Values**, 3. **Solve**, followed by **Answer:** [Option Letter].' : '- Provide clear mathematical reasoning and verify the result.'}`;
    } else {
      mathRules = `
CRITICAL THEORY & CONCEPTUAL FORMATTING RULES:
1. STRICTLY FORBIDDEN: Do NOT use LaTeX tags or math delimiters (\\( ... \\) or \\[ ... \\]).
2. Write in clean, natural English with standard Markdown for emphasis (bold keywords, bullet lists).
3. Focus on:
   - Deep conceptual clarity and underlying mechanisms.
   - Realistic scenarios, case studies, or cause-and-effect relationships.
   - Explaining WHY the correct answer is true, and why plausible distractors are incorrect.
4. Explanations:
   ${explanationStyle === 'stepwise' ? '- Use structured bullets: **Core Concept**, **Key Insight**, **Why Distractors Fail**.' : explanationStyle === 'comparative' ? '- Use comparative analysis: explain the exact distinction that makes the correct option right versus competing choices.' : '- Provide a concise, punchy 2-3 sentence explanation.'}`;
    }

    let trickNote = '';
    if (memoryTricks === 'few') {
      trickNote = '\n- Include 1-2 helpful mnemonic(s) or memory trick(s) across the explanations (e.g. 💡 **Memory Trick:** ...).';
    } else if (memoryTricks === 'many') {
      trickNote = '\n- Include a high-retention mnemonic, acronym, or visual memory hook in every question explanation.';
    }

    return `You are an expert exam professor and curriculum specialist creating a standardized ${totalQuestions}-question exam for ${eduLevel} students in ${subject}.

OUTPUT SPECIFICATION:
Return the exam strictly in clean plain text (.TXT format), ready for direct import into Exam Master.
- DO NOT output JSON.
- DO NOT wrap the output in markdown code blocks (\`\`\`txt or \`\`\`).
- Start directly with the required EXAM metadata header, followed immediately by question 1.

REQUIRED EXAM HEADER:
EXAM: ${subject} Examination
SUBJECT: ${subject}
SUBJECT TYPE: ${isMath ? 'Calculation' : 'Theory'}
DIFFICULTY: ${difficultySummary}
TIME LIMIT: ${timeLimit}
PASSING SCORE: 70
DESCRIPTION: Standardized ${eduLevel} examination covering ${topics || 'core principles'}.

QUESTION STRUCTURE (Repeat for all ${totalQuestions} questions):
[Question Number]. [Clear question stem or scenario]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [Correct Option Letter: A, B, C, or D]
Explanation: [Detailed explanation according to the formatting rules below]

${mathRules}${trickNote}

ADDITIONAL CONFIGURATION:
- Total Questions: ${totalQuestions}
- Curriculum Level: ${eduLevel}
- Topics to Cover: ${topics || 'Curriculum core syllabus'}
- Concept Depth: ${conceptDepth}
- Difficulty Distribution: ${easyPct}% Easy · ${mediumPct}% Medium · ${hardPct}% Hard
- Real-World / Applied Questions: ${realLifeCount} out of ${totalQuestions}
- Randomize correct answer letters evenly across A, B, C, and D.
${additionalInstructions ? `- Custom Instructions: ${additionalInstructions}` : ''}`;
  }, [
    subjectType,
    subject,
    topics,
    totalQuestions,
    eduLevel,
    timeLimit,
    difficultySummary,
    mathDomain,
    stepwiseMath,
    mathInOptions,
    theoryStyle,
    explanationStyle,
    memoryTricks,
    realLifeCount,
    easyPct,
    mediumPct,
    hardPct,
    conceptDepth,
    additionalInstructions,
  ]);

  // Sample TXT Output Preview Generator
  const sampleTxtPreview = useMemo(() => {
    if (subjectType === 'calculation') {
      return `EXAM: ${subject || 'Mathematics'} Examination
SUBJECT: ${subject || 'Mathematics'}
SUBJECT TYPE: Calculation
DIFFICULTY: ${difficultySummary}
TIME LIMIT: ${timeLimit}
PASSING SCORE: 70
DESCRIPTION: Standardized ${eduLevel} examination covering ${topics || 'algebra and calculus'}.

1. Find the real roots of the quadratic equation \(2x^2 - 8 = 0\).
A) \(x = 2\)
B) \(x = \pm 2\)
C) \(x = 4\)
D) \(x = \pm 4\)
Answer: B
Explanation:
1. **Factor out constant**: \(2(x^2 - 4) = 0 \implies x^2 - 4 = 0\)
2. **Solve for \(x\)**: \(x^2 = 4 \implies x = \pm \sqrt{4} = \pm 2\)
3. **Verify**: \(2(2)^2 - 8 = 8 - 8 = 0\) and \(2(-2)^2 - 8 = 0\).
**Answer:** B - \(x = \pm 2\)

2. What is the derivative of the function \(f(x) = 3x^2 + 5x - 4\)?
A) \(3x + 5\)
B) \(6x - 4\)
C) \(6x + 5\)
D) \(6x^2 + 5\)
Answer: C
Explanation:
1. **Power Rule**: \(\\frac{d}{dx}[x^n] = n x^{n-1}\)
2. **Differentiate Terms**: \(\\frac{d}{dx}[3x^2] = 6x\), \(\\frac{d}{dx}[5x] = 5\), and \(\\frac{d}{dx}[-4] = 0\)
3. **Combine**: \(f'(x) = 6x + 5\)
**Answer:** C - \(6x + 5\)`;
    } else {
      return `EXAM: ${subject || 'Biology'} Examination
SUBJECT: ${subject || 'Biology'}
SUBJECT TYPE: Theory
DIFFICULTY: ${difficultySummary}
TIME LIMIT: ${timeLimit}
PASSING SCORE: 70
DESCRIPTION: Standardized ${eduLevel} examination covering ${topics || 'cell biology'}.

1. Which cellular organelle is responsible for generating adenosine triphosphate (ATP) through aerobic cellular respiration?
A) Ribosome
B) Mitochondria
C) Endoplasmic Reticulum
D) Golgi Apparatus
Answer: B
Explanation:
- **Core Concept**: Mitochondria are known as the powerhouses of eukaryotic cells, carrying out the citric acid cycle and oxidative phosphorylation to synthesize ATP.
- **Distractor Analysis**: Ribosomes synthesize proteins, the endoplasmic reticulum packages lipids and proteins, and the Golgi apparatus modifies molecules.
- 💡 **Memory Trick**: "Mighty Mitochondria = Major Energy Maker".
**Answer:** B

2. In green plants, where do the light-dependent reactions of photosynthesis occur?
A) Thylakoid membranes
B) Stroma
C) Outer chloroplast membrane
D) Cytosol
Answer: A
Explanation:
- **Core Concept**: Light-dependent reactions take place across the thylakoid membranes where chlorophyll absorbs photons and splits water.
- **Distractor Analysis**: The light-independent Calvin cycle occurs in the stroma, not in the thylakoids.
**Answer:** A`;
    }
  }, [subjectType, subject, difficultySummary, timeLimit, eduLevel, topics]);

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

  const totalDist = easyPct + mediumPct + hardPct;
  const isDistInvalid = totalDist !== 100;

  return (
    <div
      id="professor-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        id="professor-modal-container"
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[28px] bg-white dark:bg-[#070e1a] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden text-zinc-900 dark:text-white"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-[#0d1829]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-emerald-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-['Syne',sans-serif]">
                  Exam Professor
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                  Plain Text (.TXT) System
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Architect high-yield prompts for Gemini, Claude, or ChatGPT to generate standardized .txt exams
              </p>
            </div>
          </div>
          <button
            id="professor-modal-close-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Close Professor Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* CURRICULUM PRESETS */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
              Quick Load Curriculum Presets:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="preset-hs-math"
                type="button"
                onClick={() => applyPreset('hs_math')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  subjectType === 'calculation' && subject.includes('Mathematics')
                    ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 hover:border-blue-400 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-blue-500" />
                <span>Grade 12 Math (LaTeX)</span>
              </button>

              <button
                id="preset-uni-physics"
                type="button"
                onClick={() => applyPreset('uni_physics')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  subjectType === 'calculation' && subject.includes('Physics')
                    ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 hover:border-purple-400 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Atom className="w-3.5 h-3.5 text-purple-500" />
                <span>Physics & Mechanics (LaTeX)</span>
              </button>

              <button
                id="preset-chem-calc"
                type="button"
                onClick={() => applyPreset('chem_calc')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  subjectType === 'calculation' && subject.includes('Chemistry')
                    ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 hover:border-amber-400 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5 text-amber-500" />
                <span>Chemistry (LaTeX)</span>
              </button>

              <button
                id="preset-bio-theory"
                type="button"
                onClick={() => applyPreset('bio_theory')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  subjectType === 'theory' && subject.includes('Biology')
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 hover:border-emerald-400 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                <span>Biology (Theory)</span>
              </button>

              <button
                id="preset-history-theory"
                type="button"
                onClick={() => applyPreset('history_theory')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  subjectType === 'theory' && subject.includes('History')
                    ? 'bg-amber-500/15 border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 hover:border-amber-400 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Landmark className="w-3.5 h-3.5 text-amber-500" />
                <span>History (Theory)</span>
              </button>

              <button
                id="preset-econ-theory"
                type="button"
                onClick={() => applyPreset('econ_theory')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  subjectType === 'theory' && subject.includes('Economics')
                    ? 'bg-indigo-500/15 border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                <span>Economics (Theory)</span>
              </button>
            </div>
          </div>

          {/* PRIMARY SUBJECT TYPE SELECTION BUTTONS: MATH (LaTeX) vs THEORY (NO LaTeX) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <span>Core Subject Archetype & LaTeX Engine</span>
              </label>
              <span className="text-[11px] text-zinc-400">
                Determines whether AI includes LaTeX syntax
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* MATH & CALCULATION BUTTON */}
              <button
                id="subject-type-calculation-btn"
                type="button"
                onClick={() => {
                  setSubjectType('calculation');
                  if (subject === 'Biology & Life Sciences' || subject === 'History & Social Studies') {
                    setSubject('Mathematics');
                    setTopics('algebra, quadratic equations, calculus');
                  }
                }}
                className={`p-4 rounded-2xl border text-left transition relative cursor-pointer ${
                  subjectType === 'calculation'
                    ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-blue-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                    <Sigma className="w-5 h-5" />
                  </div>
                  {subjectType === 'calculation' && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                      LaTeX Active
                    </span>
                  )}
                </div>
                <div className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span>Math & Calculation</span>
                  <span className="text-[11px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 font-mono">
                    \(...\)
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Enforces strict LaTeX delimiters for equations, exponents, roots, fractions, and step-by-step mathematical working.
                </p>
              </button>

              {/* THEORY & CONCEPTUAL BUTTON */}
              <button
                id="subject-type-theory-btn"
                type="button"
                onClick={() => {
                  setSubjectType('theory');
                  if (subject === 'Mathematics' || subject === 'Grade 12 Mathematics') {
                    setSubject('Biology & Life Sciences');
                    setTopics('cell organelles, photosynthesis, genetics');
                  }
                }}
                className={`p-4 rounded-2xl border text-left transition relative cursor-pointer ${
                  subjectType === 'theory'
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-emerald-400'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  {subjectType === 'theory' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                      Plain Text Active
                    </span>
                  )}
                </div>
                <div className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span>Theory & Conceptual</span>
                  <span className="text-[11px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-sans">
                    No LaTeX
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Strictly avoids LaTeX syntax. Instructs AI to use clean narrative English with Markdown bold keywords and real-world scenarios.
                </p>
              </button>
            </div>
          </div>

          {/* CONDITIONAL FEATURE BUTTONS BASED ON SUBJECT TYPE */}
          {subjectType === 'calculation' ? (
            /* MATH & LATEX CONTROLS */
            <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Sigma className="w-4 h-4" />
                  <span>LaTeX Configuration & Math Delimiter Controls</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300">
                  Math Delimiters Active
                </span>
              </div>

              {/* Math Domain Buttons */}
              <div>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
                  Mathematical Domain:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'math', label: '📐 Pure Mathematics', desc: 'Algebra, Calculus, Geometry' },
                    { id: 'physics', label: '⚛️ Physics & Dynamics', desc: 'Forces, Energy, Vectors' },
                    { id: 'chemistry', label: '🧪 Chemistry Equations', desc: 'Stoichiometry, Equilibrium' },
                    { id: 'engineering', label: '⚙️ Applied Engineering', desc: 'Circuits, Mechanics' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setMathDomain(d.id as MathDomain)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        mathDomain === d.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-400'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* LaTeX Formatting Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStepwiseMath(!stepwiseMath)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                    stepwiseMath
                      ? 'bg-blue-500/15 border-blue-400 text-blue-700 dark:text-blue-300'
                      : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${stepwiseMath ? 'text-blue-500' : 'text-zinc-400'}`} />
                    <span>Step-by-Step Derivations</span>
                  </span>
                  <span className="text-[10px] opacity-75 font-mono">1. Formula → 2. Solve</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMathInOptions(!mathInOptions)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between cursor-pointer transition ${
                    mathInOptions
                      ? 'bg-blue-500/15 border-blue-400 text-blue-700 dark:text-blue-300'
                      : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${mathInOptions ? 'text-blue-500' : 'text-zinc-400'}`} />
                    <span>Wrap Options in \( ... \)</span>
                  </span>
                  <span className="text-[10px] opacity-75 font-mono">A) \(x = \pm 2\)</span>
                </button>
              </div>

              {/* LaTeX Delimiter Quick Info Card */}
              <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-blue-100 dark:border-blue-900/40 text-[11px] text-zinc-600 dark:text-zinc-300 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                    \( inline \)
                  </span>
                  <span className="font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                    \[ display \]
                  </span>
                  <span>LaTeX math tags are enforced across question stems, options, and explanations.</span>
                </div>
              </div>
            </div>
          ) : (
            /* THEORY CONTROLS (NO LATEX) */
            <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>Theory & Conceptual Reasoning Settings</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                  LaTeX Excluded
                </span>
              </div>

              {/* Theory Style Buttons */}
              <div>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
                  Conceptual Approach:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'conceptual', label: '🔬 Core Concepts & Mechanisms' },
                    { id: 'scenario', label: '🌍 Real-World Scenarios & Case Studies' },
                    { id: 'analytical', label: '⚖️ Cause-and-Effect & Reasoning' },
                    { id: 'definitions', label: '📖 Principles & Definitions' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTheoryStyle(t.id as TheoryStyle)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        theoryStyle === t.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-emerald-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Explanation Style Buttons */}
              <div>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 block mb-1.5">
                  Explanation Format:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'stepwise', label: '📌 Key Concept + Breakdown' },
                    { id: 'comparative', label: '🔍 Distractor Analysis (Why others fail)' },
                    { id: 'concise', label: '⚡ Concise & Direct (2-3 sentences)' },
                  ].map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setExplanationStyle(e.id as ExplanationStyle)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        explanationStyle === e.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-emerald-400'
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BASIC EXAM PARAMETERS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                Subject Name
              </label>
              <input
                id="professor-subject-input"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics, Physics, Biology"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                Total Questions
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="professor-total-questions-input"
                  type="number"
                  min="1"
                  max="100"
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Math.max(1, Number(e.target.value)))}
                  className="w-20 px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
                />
                <div className="flex items-center gap-1">
                  {[5, 10, 15, 20].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setTotalQuestions(q)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        totalQuestions === q
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                Education / Exam Level
              </label>
              <select
                id="professor-edu-level-select"
                value={eduLevel}
                onChange={(e) => setEduLevel(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white cursor-pointer"
              >
                <option value="Elementary">Elementary School</option>
                <option value="Middle School">Middle School</option>
                <option value="High School">High School</option>
                <option value="ESSLCE National Exam">ESSLCE National Exam (Ethiopia)</option>
                <option value="University">University / College</option>
                <option value="Professional Certification">Professional Certification</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
              Key Topics & Syllabus Areas
            </label>
            <input
              id="professor-topics-input"
              type="text"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="e.g. thermodynamics, heat transfer, gas laws, pressure"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
            />
          </div>

          {/* PEDAGOGICAL BOOSTERS: MEMORY TRICKS & REAL-LIFE QUESTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Memory Tricks & Mnemonics</span>
              </label>
              <div className="flex items-center gap-2">
                {[
                  { id: 'none', label: 'None' },
                  { id: 'few', label: '1-2 Key Tricks' },
                  { id: 'many', label: 'Every Question' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMemoryTricks(m.id as MemoryTrickOption)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex-1 text-center ${
                      memoryTricks === m.id
                        ? 'bg-amber-500 text-zinc-950 font-bold border-amber-500 shadow-xs'
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>Real-Life Applied Questions</span>
                </label>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {realLifeCount} of {totalQuestions}
                </span>
              </div>
              <input
                id="professor-real-life-range"
                type="range"
                min="0"
                max={totalQuestions}
                value={realLifeCount}
                onChange={(e) => setRealLifeCount(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          {/* DIFFICULTY DISTRIBUTION SLIDERS */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Difficulty Distribution (%)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEasyPct(20);
                    setMediumPct(60);
                    setHardPct(20);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 transition"
                >
                  Balanced (20/60/20)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEasyPct(10);
                    setMediumPct(40);
                    setHardPct(50);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 transition"
                >
                  Hard (10/40/50)
                </button>
                <span
                  className={`text-xs font-bold ${
                    isDistInvalid ? 'text-rose-500' : 'text-emerald-500'
                  }`}
                >
                  Total: {totalDist}% {isDistInvalid && '(Must equal 100%)'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-xs font-bold text-emerald-500 block mb-1">Easy ({easyPct}%)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={easyPct}
                  onChange={(e) => setEasyPct(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-500 block mb-1">Medium ({mediumPct}%)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={mediumPct}
                  onChange={(e) => setMediumPct(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
              <div>
                <span className="text-xs font-bold text-rose-500 block mb-1">Hard ({hardPct}%)</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={hardPct}
                  onChange={(e) => setHardPct(Number(e.target.value))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* VIEW SELECTOR TABS (MASTER PROMPT / TXT PREVIEW / LATEX GUIDE) */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-1.5">
                <button
                  id="tab-master-prompt"
                  type="button"
                  onClick={() => setActiveView('prompt')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    activeView === 'prompt'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Master AI Prompt (.TXT)</span>
                </button>

                <button
                  id="tab-txt-preview"
                  type="button"
                  onClick={() => setActiveView('txt_preview')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    activeView === 'txt_preview'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Sample .TXT Output</span>
                </button>

                {subjectType === 'calculation' && (
                  <button
                    id="tab-latex-guide"
                    type="button"
                    onClick={() => setActiveView('latex_guide')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      activeView === 'latex_guide'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    <Sigma className="w-3.5 h-3.5" />
                    <span>LaTeX Cheat Sheet</span>
                  </button>
                )}
              </div>

              {activeView === 'prompt' && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-400 hidden sm:inline">
                    ~{Math.round(generatedPrompt.length / 4)} tokens · Plain text format
                  </span>
                  <button
                    id="copy-prompt-btn"
                    type="button"
                    onClick={handleCopy}
                    className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Prompt'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* TAB CONTENT: PROMPT */}
            {activeView === 'prompt' && (
              <div className="space-y-2">
                <textarea
                  id="generated-prompt-textarea"
                  rows={8}
                  readOnly
                  value={generatedPrompt}
                  className="w-full p-4 font-mono text-xs leading-relaxed rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 select-all focus:outline-none"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 px-1">
                  <span>Works seamlessly with: <strong>Google Gemini</strong>, <strong>ChatGPT (GPT-4o)</strong>, and <strong>Claude 3.5 Sonnet</strong>.</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ Clean text format ready for Question Text Editor
                  </span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: SAMPLE TXT OUTPUT PREVIEW */}
            {activeView === 'txt_preview' && (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
                  <span>
                    This preview shows what the AI model will output in <strong>.TXT format</strong> based on your current settings ({subjectType === 'calculation' ? 'LaTeX math notation enabled' : 'Theory / clean text without LaTeX'}).
                  </span>
                </div>
                <textarea
                  rows={8}
                  readOnly
                  value={sampleTxtPreview}
                  className="w-full p-4 font-mono text-xs leading-relaxed rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 select-all focus:outline-none"
                />
              </div>
            )}

            {/* TAB CONTENT: LATEX CHEAT SHEET (IF MATH) */}
            {activeView === 'latex_guide' && subjectType === 'calculation' && (
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
                <h4 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <Sigma className="w-4 h-4 text-blue-500" />
                  <span>Exam Master LaTeX Reference Standard</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">Fractions & Roots</span>
                    <div className="font-mono text-zinc-600 dark:text-zinc-300 space-y-0.5">
                      <div><code className="text-blue-600 dark:text-blue-400">{'\\(\\frac{a}{b}\\)'}</code> &nbsp;→&nbsp; a/b fraction</div>
                      <div><code className="text-blue-600 dark:text-blue-400">{'\\(\\sqrt{x}\\)'}</code> &nbsp;→&nbsp; square root</div>
                      <div><code className="text-blue-600 dark:text-blue-400">{'\\(\\sqrt[n]{x}\\)'}</code> &nbsp;→&nbsp; n-th root</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">Calculus & Limits</span>
                    <div className="font-mono text-zinc-600 dark:text-zinc-300 space-y-0.5">
                      <div><code className="text-blue-600 dark:text-blue-400">{'\\(\\frac{dy}{dx}\\)'}</code> &nbsp;→&nbsp; derivative</div>
                      <div><code className="text-blue-600 dark:text-blue-400">{'\\(\\int_{a}^{b} f(x)\\,dx\\)'}</code> &nbsp;→&nbsp; integral</div>
                      <div><code className="text-blue-600 dark:text-blue-400">{'\\(\\lim_{x \\to 0}\\)'}</code> &nbsp;→&nbsp; limit</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">Physics & Vectors</span>
                    <div className="font-mono text-zinc-600 dark:text-zinc-300 space-y-0.5">
                      <div><code className="text-blue-600 dark:text-blue-400">{'\\(\\vec{F} = m\\vec{a}\\)'}</code> &nbsp;→&nbsp; vector equation</div>
                      <div><code className="text-blue-600 dark:text-blue-400">{'\\(9.8\\,\\text{m/s}^2\\)'}</code> &nbsp;→&nbsp; units formatting</div>
                      <div><code className="text-blue-600 dark:text-blue-400">{'\\(\\Delta t, \\lambda, \\theta, \\omega\\)'}</code> &nbsp;→&nbsp; Greek letters</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <span className="font-bold text-blue-600 dark:text-blue-400 block mb-1">Chemistry & Subscripts</span>
                    <div className="font-mono text-zinc-600 dark:text-zinc-300 space-y-0.5">
                      <div><code className="text-blue-600 dark:text-blue-400">{'\\(\\text{H}_2\\text{O}\\)'}</code> &nbsp;→&nbsp; water molecule</div>
                      <div><code className="text-blue-600 dark:text-blue-400">{'\\(\\text{CO}_2\\)'}</code> &nbsp;→&nbsp; carbon dioxide</div>
                      <div><code className="text-blue-600 dark:text-blue-400">{'\\(\\text{Fe}^{3+}\\)'}</code> &nbsp;→&nbsp; ion charge</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d1829] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <FileText className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline">
              Workflow: 1. Copy Prompt → 2. Run in AI Model → 3. Paste into Question Text Editor
            </span>
            <span className="sm:hidden">
              Prompt ready for AI model
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="professor-footer-close-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
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
              className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 transition-all hover:gap-2"
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
