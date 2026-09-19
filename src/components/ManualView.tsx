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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSymbol(text);
    setTimeout(() => setCopiedSymbol(null), 2000);
  };

  return (
    <div className="space-y-5 pb-16 max-w-4xl mx-auto font-['Plus_Jakarta_Sans',sans-serif] text-zinc-900 dark:text-zinc-100">
      {/* Calm, Clear Upper Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0b1322] border border-zinc-200/80 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Quick & Clear Guide</span>
          </div>

          <p className="text-base sm:text-lg lg:text-xl font-normal font-['Outfit',sans-serif] text-zinc-800 dark:text-zinc-200 leading-relaxed">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">ExamMaster</span> is comprehensive — you can create any question and practice prepared exams in an interactive app, for all grade level students.
          </p>
        </div>
      </div>

      {/* 3 Ways to Add Questions */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-[#0b1322] border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Edit3 className="w-4 h-4" />
            <span>Adding Questions</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white mt-1">
            You can add questions in this app in three ways:
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Way 1: Manually */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Manually Question by Question
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Add each question manually while reading your textbooks or right after study sessions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('create')}
              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Create Manually</span>
            </button>
          </div>

          {/* Way 2: Copy & Paste from AI */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Copy & Paste from Any AI
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Copy questions created by any AI like <strong>Claude</strong>, <strong>Gemini</strong>, <strong>ChatGPT</strong>, or <strong>DeepSeek</strong>.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenPasteModal}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Paste AI Questions</span>
            </button>
          </div>

          {/* Way 3: Import from Files */}
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                Import from Telegram or Files
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Import questions downloaded from Telegram channels or shared by friends (<code className="font-mono text-zinc-700 dark:text-zinc-300">.txt</code> file).
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenPasteModal}
              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500" />
              <span>Import .txt File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Share Exams with Friends */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/25 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold shadow-xs shrink-0 mt-0.5">
            <Share2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
              Share Created Questions with Friends
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-xl">
              You can share your created questions to your friends to take one exam at a time by clicking the <strong>Export</strong> button on your exam card in the Library!
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('files')}
          className="self-start sm:self-auto px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition shrink-0"
        >
          <span>View Library</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Ready-to-Use AI Prompt */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0b1322] border border-zinc-200/80 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Bot className="w-4 h-4" />
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
            className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            {copiedPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Prompt Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Prompt</span>
              </>
            )}
          </button>
        </div>

        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
          {samplePrompt}
        </div>
      </div>

      {/* Expandable Math & Science Formulas Area */}
      <div className="rounded-3xl bg-white dark:bg-[#0b1322] border border-zinc-200/80 dark:border-zinc-800 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setIsMathExpanded((prev) => !prev)}
          className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                  Math & Science Formulas Manual
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  Optional
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Hint: This type of formula code helps just for creating manual questions.</span>
              </p>
            </div>
          </div>

          <div className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 shrink-0">
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
              className="px-5 pb-6 sm:px-6 border-t border-zinc-200/80 dark:border-zinc-800 space-y-4 pt-4"
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Instant math appearance:
                  </label>
                  <div className="min-h-[42px] px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center text-sm text-zinc-900 dark:text-white overflow-x-auto">
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
                      className="px-2.5 py-1.5 rounded-lg text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono flex items-center gap-1.5 cursor-pointer transition"
                    >
                      {copiedSymbol === item.code ? (
                        <Check className="w-3 h-3 text-emerald-500" />
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
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0b1322] border border-zinc-200/80 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
            Ready to start practicing?
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Choose an exam from your library or create new questions right now.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('create')}
            className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
          >
            Create Exam
          </button>
          <button
            type="button"
            onClick={() => onNavigate('files')}
            className="px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Browse Library</span>
          </button>
        </div>
      </div>
    </div>
  );
};
