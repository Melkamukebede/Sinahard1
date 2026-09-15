import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  X,
  ArrowRight,
  Sliders,
  HelpCircle,
  BookOpen,
  Atom,
  GraduationCap,
  Calculator,
} from 'lucide-react';

interface ProfessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToPaste: () => void;
}

export const ProfessorModal: React.FC<ProfessorModalProps> = ({
  isOpen,
  onClose,
  onGoToPaste,
}) => {
  const [totalQuestions, setTotalQuestions] = useState<number>(10);
  const [subject, setSubject] = useState<string>('Mathematics');
  const [topics, setTopics] = useState<string>('algebra, quadratic equations, calculus');
  const [structure, setStructure] = useState<string>('Multiple Choice');
  const [subjectType, setSubjectType] = useState<'calculation' | 'theory'>('calculation');
  const [explanationStyle, setExplanationStyle] = useState<'stepwise' | 'conceptual' | 'brief'>('stepwise');
  const [memoryTricks, setMemoryTricks] = useState<'none' | 'few' | 'many'>('few');
  const [realLifeCount, setRealLifeCount] = useState<number>(3);
  const [source, setSource] = useState<string>('Include additional examples');
  const [easyPct, setEasyPct] = useState<number>(20);
  const [mediumPct, setMediumPct] = useState<number>(60);
  const [hardPct, setHardPct] = useState<number>(20);
  const [eduLevel, setEduLevel] = useState<string>('High School');
  const [conceptDepth, setConceptDepth] = useState<string>('Intermediate');
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');

  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Load Presets
  const applyPreset = (presetName: string) => {
    if (presetName === 'hs_math') {
      setSubject('Mathematics');
      setTopics('algebra, quadratic equations, derivatives, limits');
      setTotalQuestions(10);
      setEasyPct(20);
      setMediumPct(60);
      setHardPct(20);
      setSubjectType('calculation');
      setExplanationStyle('stepwise');
      setEduLevel('High School');
      setConceptDepth('Intermediate');
    } else if (presetName === 'uni_physics') {
      setSubject('Physics');
      setTopics('kinematics, Newton\'s laws, conservation of momentum, thermodynamics');
      setTotalQuestions(8);
      setEasyPct(10);
      setMediumPct(40);
      setHardPct(50);
      setSubjectType('calculation');
      setExplanationStyle('stepwise');
      setEduLevel('University');
      setConceptDepth('Advanced');
    } else if (presetName === 'bio_easy') {
      setSubject('Biology');
      setTopics('cell organelles, photosynthesis, cellular respiration, genetics');
      setTotalQuestions(6);
      setEasyPct(70);
      setMediumPct(30);
      setHardPct(0);
      setSubjectType('theory');
      setExplanationStyle('conceptual');
      setEduLevel('High School');
      setConceptDepth('Basic');
    }
  };

  // Recompute generated prompt
  useEffect(() => {
    let expInstruction = '';
    if (subjectType === 'calculation') {
      expInstruction = `Provide the explanation using **Markdown** and **LaTeX**:
- Numbered steps with bold titles: \`1. **Step Title**\`
- Use \`\\[ ... \\]\` for display equations and \`\\( ... \\)\` for inline math expressions.
- End with \`**Answer:**\` followed by the final result.`;
    } else {
      expInstruction = `Provide explanation in **Markdown**:
- Use **bold**, *italic*, bullet lists, and \\(...\\) for inline terms.`;
      if (explanationStyle === 'stepwise') {
        expInstruction += `\nStructure: **Key Point:** [summary] → **Why it matters:** [context]`;
      } else if (explanationStyle === 'brief') {
        expInstruction += `\nKeep it concise (2-3 sentences).`;
      } else {
        expInstruction += `\nStructure: **Main Idea:** [core concept] — *Details:* [supporting information]`;
      }
    }

    if (memoryTricks !== 'none') {
      expInstruction += `\n💡 Include **${memoryTricks}** memory trick(s) or mnemonic(s).`;
    }

    const promptText = `You are an expert exam professor creating ${totalQuestions} questions for a ${eduLevel} level ${subject} exam.

Configuration:
- Structure: ${structure}
- Difficulty: ${easyPct}% Easy · ${mediumPct}% Medium · ${hardPct}% Hard
- Concept depth: ${conceptDepth}
- Real-life questions: ${realLifeCount}
- Source: ${source}${topics ? `\n- Topics: ${topics}` : ''}${additionalInstructions ? `\n- Additional: ${additionalInstructions}` : ''}

Explanation Format:
${expInstruction}

Return ONLY a valid JSON array — no extra text, no conversational preamble, no markdown fences:
[
  {
    "text": "Question prompt here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Detailed step-by-step solution here."
  }
]

CRITICAL RULES:
- Wrap ALL math formulas in \\\\(...\\\\) inline or \\\\[...\\\\] display. Never output unescaped raw LaTeX.
- Randomize the correct answer index across 0, 1, 2, and 3.`;

    setGeneratedPrompt(promptText);
  }, [
    totalQuestions,
    subject,
    topics,
    structure,
    subjectType,
    explanationStyle,
    memoryTricks,
    realLifeCount,
    source,
    easyPct,
    mediumPct,
    hardPct,
    eduLevel,
    conceptDepth,
    additionalInstructions,
  ]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  if (!isOpen) return null;

  const totalDist = easyPct + mediumPct + hardPct;
  const isDistInvalid = totalDist !== 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#070e1a] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden text-zinc-900 dark:text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-[#0d1829]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-emerald-500 text-zinc-950 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-base font-['Syne',sans-serif] flex items-center gap-2">
                Exam Professor
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30">
                  AI Prompt Architect
                </span>
              </h3>
              <p className="text-xs text-zinc-500">Configure parameters to generate high-yield prompts for Gemini, Claude, or ChatGPT</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preset Buttons */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-2">
              Quick Load Curriculum Presets:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => applyPreset('hs_math')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer transition"
              >
                <Calculator className="w-3.5 h-3.5 text-blue-500" />
                📐 HS Mathematics
              </button>
              <button
                type="button"
                onClick={() => applyPreset('uni_physics')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer transition"
              >
                <Atom className="w-3.5 h-3.5 text-purple-500" />
                ⚛️ University Physics
              </button>
              <button
                type="button"
                onClick={() => applyPreset('bio_easy')}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer transition"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                🌿 Biology Fundamentals
              </button>
            </div>
          </div>

          {/* Core Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">Total Questions</label>
              <input
                type="number"
                min="1"
                max="50"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1">Education Level</label>
              <select
                value={eduLevel}
                onChange={(e) => setEduLevel(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white cursor-pointer"
              >
                <option value="Elementary">Elementary</option>
                <option value="High School">High School</option>
                <option value="University">University</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 mb-1">Topics & Key Concepts</label>
            <input
              type="text"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="e.g. thermodynamics, heat transfer, ideal gas law"
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white"
            />
          </div>

          {/* Difficulty Sliders */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" /> Difficulty Distribution (%)
              </span>
              <span
                className={`text-xs font-bold ${
                  isDistInvalid ? 'text-rose-500' : 'text-emerald-500'
                }`}
              >
                Total: {totalDist}% {isDistInvalid && '(Must equal 100%)'}
              </span>
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

          {/* Generated Prompt Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Generated AI Prompt (~{Math.round(generatedPrompt.length / 4)} tokens)
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Prompt'}
              </button>
            </div>

            <textarea
              rows={6}
              readOnly
              value={generatedPrompt}
              className="w-full p-3.5 font-mono text-xs leading-relaxed rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 select-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0d1829] flex items-center justify-between">
          <p className="text-xs text-zinc-500 hidden sm:block">
            Copy prompt → run in AI model → paste generated JSON back
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onGoToPaste();
              }}
              className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <span>Next: Paste JSON</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
