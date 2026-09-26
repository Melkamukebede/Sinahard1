import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Copy,
  Check,
  Play,
  Share2,
  Edit3,
  Bot,
  Download,
  PlusCircle,
  FileCode,
  Calculator,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface ManualViewProps {
  onNavigate: (tab: 'home' | 'files' | 'results' | 'create') => void;
  onOpenProfessorModal: () => void;
  onOpenPasteModal: () => void;
  onOpenRegistrationModal?: () => void;
  onOpenCuratedModal?: () => void;
  onOpenSubscriptionModal?: () => void;
  onOpenNotificationsModal?: () => void;
}

export const ManualView: React.FC<ManualViewProps> = ({
  onNavigate,
  onOpenPasteModal,
}) => {
  // Expand/collapse for Math & Science formulas section
  const [isMathExpanded, setIsMathExpanded] = useState<boolean>(false);

  // Live math formula sandbox state
  const [formulaInput, setFormulaInput] = useState<string>('\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  const samplePrompt = `================================================================
FORMAT SPECIFICATION:
Grade: 10
Subject: Physics
Topic: Classical Mechanics
Time Limit: 20 minutes
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

OUTPUT RULES:
1. Output pure plain text (.txt format). No markdown code blocks, no greetings or conversational intro.
2. Put Answer: [Letter] on its own line.
3. DO NOT use numbers in the explanation area (avoid 1. Formula 2. Calculation; instead use **Formula:**, **Calculation:**, **Answer:**).
4. For math and physics formulas, wrap display equations in \\[ ... \\] and inline variables in \\( ... \\).`;

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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSymbol(text);
    setTimeout(() => setCopiedSymbol(null), 2000);
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto font-['Plus_Jakarta_Sans',sans-serif] text-zinc-900 dark:text-zinc-100">
      {/* ─────────────────────────────────────────────────────────────
          LAYER 1: TRANSLUCENT CONTAINER (Guide Header Banner)
      ───────────────────────────────────────────────────────────── */}
      <div className="relative p-6 sm:p-7 rounded-[32px] sm:rounded-[38px] bg-white/60 dark:bg-[000000]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_20px_50px_rgba(25,50,80,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] overflow-hidden">
        {/* Subtle Atmospheric Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-zinc-500/5 dark:bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[000000] border border-white/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 text-xs font-semibold shadow-xs">
            <BookOpen className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span>Quick & Clear Guide</span>
          </div>

          <p className="text-base sm:text-lg lg:text-xl font-normal font-['Outfit',sans-serif] text-zinc-800 dark:text-zinc-200 leading-relaxed">
            <span className="font-semibold text-zinc-900 dark:text-white">Sinahard</span> is comprehensive — you can create any question and practice prepared exams in an interactive app, for all grade level students.
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LAYER 1: TRANSLUCENT CONTAINER (3 Ways to Add Questions)
          LAYER 2: PORCELAIN CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="relative p-5 sm:p-7 rounded-[32px] sm:rounded-[38px] bg-white/60 dark:bg-[000000]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_20px_50px_rgba(25,50,80,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] space-y-4 overflow-hidden">
        {/* Subtle Atmospheric Ambient Glow */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider">
            <Edit3 className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            <span>Adding Questions</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white mt-1">
            You can add questions in this app in three ways:
          </h2>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Way 1: Manually */}
          <div className="p-4 sm:p-5 rounded-[24px] bg-white dark:bg-[000000] border border-white/80 dark:border-white/10 flex flex-col justify-between space-y-3 shadow-xs">
            <div className="space-y-2">
              <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Manually Question by Question
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Add each question manually while reading your textbooks or right after study sessions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('create')}
              className="w-full py-2 px-3 rounded-full bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-white/80 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
            >
              <PlusCircle className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              <span>Create Manually</span>
            </button>
          </div>

          {/* Way 2: Copy & Paste from AI */}
          <div className="p-4 sm:p-5 rounded-[24px] bg-white dark:bg-[000000] border border-white/80 dark:border-white/10 flex flex-col justify-between space-y-3 shadow-xs">
            <div className="space-y-2">
              <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Copy & Paste from Any AI
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Copy questions created by any AI like <strong>Claude</strong>, <strong>Gemini</strong>, <strong>ChatGPT</strong>, or <strong>DeepSeek</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenPasteModal}
              className="w-full py-2 px-3 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Paste AI Questions</span>
            </button>
          </div>

          {/* Way 3: Import from Files */}
          <div className="p-4 sm:p-5 rounded-[24px] bg-white dark:bg-[000000] border border-white/80 dark:border-white/10 flex flex-col justify-between space-y-3 shadow-xs">
            <div className="space-y-2">
              <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Import from Telegram or Files
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Import questions downloaded from Telegram channels or shared by friends (<code className="font-mono text-zinc-700 dark:text-zinc-300">.txt</code> file).
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenPasteModal}
              className="w-full py-2 px-3 rounded-full bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-white/80 dark:border-white/10 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
            >
              <Download className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
              <span>Import .txt File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Exams with Friends */}
      <div className="relative p-5 sm:p-6 rounded-[32px] sm:rounded-[38px] bg-white/60 dark:bg-[000000]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_20px_50px_rgba(25,50,80,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
        <div className="flex items-start gap-3.5 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 flex items-center justify-center font-bold shadow-xs shrink-0 mt-0.5">
            <Share2 className="w-5 h-5 text-white dark:text-zinc-950" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
              Share Created Questions with Friends
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl">
              You can share your created questions to your friends to take one exam at a time by clicking the <strong>Export</strong> button on your exam card in the Library!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('files')}
          className="relative z-10 self-start sm:self-auto px-5 py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition shrink-0"
        >
          <span>View Library</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Ready-to-Use AI Prompt */}
      <div className="relative p-5 sm:p-6 rounded-[32px] sm:rounded-[38px] bg-white/60 dark:bg-[000000]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_20px_50px_rgba(25,50,80,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] space-y-3 overflow-hidden">
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-wider">
              <Bot className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              <span>Ready-To-Use AI Prompt</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white mt-1">
              Ask Claude, Gemini, ChatGPT, or DeepSeek
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Copy prompts to AI to create your questions, then paste them back here.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(samplePrompt);
              setCopiedPrompt(true);
              setTimeout(() => setCopiedPrompt(false), 2000);
            }}
            className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[000000] hover:bg-zinc-50 dark:hover:bg-[18181b] text-zinc-800 dark:text-zinc-200 border border-white/80 dark:border-white/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
          >
            {copiedPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
                <span>Prompt Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                <span>Copy Prompt</span>
              </>
            )}
          </button>
        </div>

        <div className="relative z-10 p-4 rounded-[22px] bg-white dark:bg-[000000] border border-white/80 dark:border-white/10 font-mono text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed shadow-xs">
          {samplePrompt}
        </div>
      </div>

      {/* Expandable Math & Science Formulas Area */}
      <div className="relative rounded-[32px] sm:rounded-[38px] bg-white/60 dark:bg-[000000]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_20px_50px_rgba(25,50,80,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] overflow-hidden">
        <button
          type="button"
          onClick={() => setIsMathExpanded((prev) => !prev)}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left hover:bg-white/60 dark:hover:bg-white/[0.02] transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-white/80 dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs">
              <Calculator className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                  Math & Science Formulas Manual
                </h2>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  Optional
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span>Hint: This type of formula code helps just for creating manual questions.</span>
              </p>
            </div>
          </div>

          <div className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 bg-white dark:bg-zinc-800 border border-white/80 dark:border-white/10 shadow-xs shrink-0">
            {isMathExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {isMathExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-5 pb-6 sm:px-6 border-t border-zinc-100 dark:border-white/10 space-y-4 pt-4"
            >
              {/* Formula Test Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Type formula code:
                  </label>
                  <input
                    type="text"
                    value={formulaInput}
                    onChange={(e) => setFormulaInput(e.target.value)}
                    placeholder="e.g. \frac{a}{b} or x^2"
                    className="w-full px-3.5 py-2.5 rounded-full bg-white dark:bg-[000000] border border-white/80 dark:border-white/10 font-mono text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-zinc-950/10 dark:focus:ring-white/10 shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Instant math appearance:
                  </label>
                  <div className="min-h-[42px] px-4 py-2.5 rounded-full bg-white dark:bg-[000000] border border-white/80 dark:border-white/10 flex items-center text-sm text-zinc-900 dark:text-white overflow-x-auto shadow-xs">
                    <MathRenderer content={`\\[ ${formulaInput} \\]`} />
                  </div>
                </div>
              </div>

              {/* Clickable Math Symbols */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-zinc-500 block">
                  Click any symbol to copy or test it:
                </span>
                <div className="flex flex-wrap gap-2">
                  {formulaShortcuts.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setFormulaInput(item.code);
                        handleCopy(item.code);
                      }}
                      className="px-3 py-1.5 rounded-full text-xs bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-white/80 dark:border-white/10 text-zinc-700 dark:text-zinc-300 font-mono flex items-center gap-1.5 cursor-pointer transition shadow-xs active:scale-98"
                    >
                      {copiedSymbol === item.code ? (
                        <Check className="w-3 h-3 text-zinc-900 dark:text-white" />
                      ) : (
                        <Copy className="w-3 h-3 text-zinc-400" />
                      )}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Practice Action Banner */}
      <div className="relative p-5 sm:p-6 rounded-[32px] sm:rounded-[38px] bg-white/60 dark:bg-[000000]/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_20px_50px_rgba(25,50,80,0.06)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-sm sm:text-base font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
            Ready to start practicing?
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Choose an exam from your library or create new questions right now.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('create')}
            className="px-4 py-2 rounded-full border border-white/80 dark:border-white/10 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition cursor-pointer shadow-xs active:scale-98"
          >
            Create Exam
          </button>
          <button
            type="button"
            onClick={() => onNavigate('files')}
            className="px-5 py-2.5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-98 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Browse Library</span>
          </button>
        </div>
      </div>
    </div>
  );
};
