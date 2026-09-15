import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  Clock,
  Sparkles,
  Keyboard,
  Cloud,
  FileCode,
  HelpCircle,
  CheckCircle2,
  Copy,
  Check,
  Play,
  ArrowRight,
  Calculator,
  Laptop,
  Flame,
} from 'lucide-react';
import { MathRenderer } from './MathRenderer';

interface ManualViewProps {
  onNavigate: (tab: 'home' | 'files' | 'results' | 'create') => void;
  onOpenProfessorModal: () => void;
  onOpenPasteModal: () => void;
}

export const ManualView: React.FC<ManualViewProps> = ({
  onNavigate,
  onOpenProfessorModal,
  onOpenPasteModal,
}) => {
  const [activeSection, setActiveSection] = useState<'all' | 'exam' | 'latex' | 'builder' | 'ai' | 'sync'>('all');
  const [liveLatexInput, setLiveLatexInput] = useState<string>(
    '\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}'
  );
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(text);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const mathSnippets = [
    { label: 'Quadratic Formula', code: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
    { label: 'Fraction', code: '\\frac{numerator}{denominator}' },
    { label: 'Square Root', code: '\\sqrt{a^2 + b^2}' },
    { label: 'Definite Integral', code: '\\int_{a}^{b} f(x) \\, dx' },
    { label: 'Summation', code: '\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}' },
    { label: 'Kinematics', code: 'v^2 = v_0^2 + 2a\\Delta x' },
    { label: 'Greek Symbols', code: '\\alpha, \\beta, \\theta, \\lambda, \\pi, \\Delta' },
    { label: 'Trigonometry', code: '\\sin^2(\\theta) + \\cos^2(\\theta) = 1' },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            Official Documentation & Guide
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-['Syne',sans-serif] text-zinc-900 dark:text-white leading-tight">
            ExamMaster Pro User Manual
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
            Everything you need to master test-taking, construct questions with KaTeX mathematical formulas, architect high-yield AI prompts, and synchronize your progress seamlessly.
          </p>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap pt-5">
            {[
              { id: 'all', label: 'All Topics' },
              { id: 'exam', label: 'Practice & Shortcuts' },
              { id: 'latex', label: 'LaTeX & Formulas' },
              { id: 'builder', label: 'Exam Builder' },
              { id: 'ai', label: 'AI Professor' },
              { id: 'sync', label: 'Cloud & Offline' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id as typeof activeSection)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                  activeSection === tab.id
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 1: Practice Exam Player & Shortcuts */}
      {(activeSection === 'all' || activeSection === 'exam') && (
        <section className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
                Interactive Exam Player & Study Mode
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                How testing controls, pauses, timers, and step-by-step reveals operate
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 space-y-2">
              <div className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                Anti-Cheat Timer & Pause
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Clicking the timer badge or pressing the <kbd className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px]">Space</kbd> key pauses the timer. While paused, questions are blurred to maintain test validity.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 space-y-2">
              <div className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Study Mode Answer Reveal
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Stuck on a tricky question? Tap <strong>Reveal Answer</strong> during practice to view the correct option and complete derivation without having to submit early.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 space-y-2">
              <div className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-blue-500" />
                Keyboard Shortcuts
              </div>
              <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
                <li>• <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px]">Space</kbd>: Pause / Resume exam</li>
                <li>• <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px]">Escape</kbd>: Close modal windows</li>
                <li>• <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px]">Click Option</kbd>: Instantly marks answer</li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: LaTeX & KaTeX Mathematical Notation */}
      {(activeSection === 'all' || activeSection === 'latex') && (
        <section className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
                LaTeX Formula Rendering & Math Syntax
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                ExamMaster Pro includes built-in KaTeX for equations across questions, options, and solutions
              </p>
            </div>
          </div>

          {/* Delimiter Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 space-y-2">
              <div className="font-bold text-sm text-zinc-900 dark:text-white">
                1. Inline Math: <code className="text-emerald-500 font-mono">\( ... \)</code>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Renders math right in the middle of sentences or option labels.
              </p>
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
                {'The derivative of \\( f(x) = x^3 \\) is \\( 3x^2 \\).'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 space-y-2">
              <div className="font-bold text-sm text-zinc-900 dark:text-white">
                2. Block / Display Math: <code className="text-emerald-500 font-mono">\[ ... \]</code>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Centers large multi-line derivations and complex fraction formulas on their own dedicated line.
              </p>
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
                {'\[ E = mc^2 \\quad \\text{and} \\quad \\nabla \\cdot \\vec{B} = 0 \]'}
              </div>
            </div>
          </div>

          {/* Interactive Live LaTeX Scratchpad */}
          <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                <Calculator className="w-4 h-4" />
                Live Interactive LaTeX Scratchpad
              </div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Type any formula below to test rendering
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">
                  LaTeX Expression (Raw code):
                </label>
                <textarea
                  rows={3}
                  value={liveLatexInput}
                  onChange={(e) => setLiveLatexInput(e.target.value)}
                  className="w-full p-3 font-mono text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                  placeholder="e.g. \frac{a}{b} or x^2"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 mb-1">
                  Live KaTeX Output:
                </label>
                <div className="min-h-[76px] p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-sm text-zinc-900 dark:text-white overflow-x-auto">
                  <MathRenderer content={`\\[ ${liveLatexInput} \\]`} />
                </div>
              </div>
            </div>

            {/* Quick Math Snippet Pills */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-semibold text-zinc-500 block">
                Click any snippet to copy or insert:
              </span>
              <div className="flex flex-wrap gap-2">
                {mathSnippets.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setLiveLatexInput(item.code);
                      handleCopy(item.code);
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500/50 text-zinc-700 dark:text-zinc-300 font-mono flex items-center gap-1.5 cursor-pointer transition"
                  >
                    {copiedSnippet === item.code ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-zinc-400" />
                    )}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: Question Importer (JSON & Plain Text) */}
      {(activeSection === 'all' || activeSection === 'builder') && (
        <section className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <FileCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
                  Question Import Specifications
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Dual-mode parser: structured JSON or formatted plain text
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenPasteModal}
              className="px-4 py-1.5 rounded-full bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
            >
              <FileCode className="w-3.5 h-3.5" />
              Open Paste Importer
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
            {/* Format 1: JSON Array */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900 dark:text-white">Format 1: Structured JSON Array</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold">
                  Recommended
                </span>
              </div>
              <pre className="p-3 rounded-xl bg-white dark:bg-zinc-950 font-mono text-[11px] text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
{`[
  {
    "text": "What is the derivative of \\\\( \\\\sin(x) \\\\)?",
    "options": ["\\\\( \\\\cos(x) \\\\)", "\\\\( -\\\\cos(x) \\\\)", "\\\\( \\\\tan(x) \\\\)", "0"],
    "correct": 0,
    "explanation": "By fundamental calculus rules, d/dx[sin(x)] = cos(x)."
  }
]`}
              </pre>
              <p className="text-zinc-500 text-[11px]">
                Note: In JSON strings, LaTeX backslashes should ideally be double-escaped (<code className="font-mono">\\(</code>), but ExamMaster Pro's auto-fixer will automatically repair single backslashes for you!
              </p>
            </div>

            {/* Format 2: Plain Text */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-900 dark:text-white">Format 2: Formatted Plain Text</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold">
                  Quick Notes
                </span>
              </div>
              <pre className="p-3 rounded-xl bg-white dark:bg-zinc-950 font-mono text-[11px] text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
{`1. Which organelle produces cellular energy (ATP)?
A) Nucleus
B) Mitochondria*
C) Ribosome
D) Endoplasmic reticulum
Explanation: Mitochondria are known as the powerhouse of the cell.`}
              </pre>
              <p className="text-zinc-500 text-[11px]">
                Put an asterisk (<code className="font-mono text-emerald-500">*</code>) right after the correct option text to designate it as the correct answer.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 4: AI Prompt Architect & Professor */}
      {(activeSection === 'all' || activeSection === 'ai') && (
        <section className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
                  Exam Professor (AI Prompt Architect)
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Generate tailored prompts for Gemini, Claude, or ChatGPT to build complete exam papers
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenProfessorModal}
              className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Launch Professor Architect
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 space-y-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
              Recommended 3-Step AI Workflow:
            </h4>
            <ol className="list-decimal list-inside space-y-2">
              <li>
                <strong>Configure Parameters</strong> in the Exam Professor tool: choose curriculum (High School, University), topic keywords, difficulty distributions (e.g. 20% Easy, 60% Medium, 20% Hard), and explanation style.
              </li>
              <li>
                <strong>Copy the Generated Prompt</strong> with one click and paste it into Google Gemini, Claude, or ChatGPT.
              </li>
              <li>
                <strong>Paste the AI Output Back</strong> into ExamMaster Pro's Paste Importer. The system validates all 4 options, auto-formats equations, and imports them immediately into your exam library.
              </li>
            </ol>
          </div>
        </section>
      )}

      {/* SECTION 5: Storage & Cloud Sync */}
      {(activeSection === 'all' || activeSection === 'sync') && (
        <section className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0d1829] border border-zinc-200/80 dark:border-white/10 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
                Cloud Synchronization & Offline Storage
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                How your exam files, scores, and analytics are preserved
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 space-y-2">
              <div className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <Cloud className="w-4 h-4 text-emerald-500" />
                Google Account Cloud Sync
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Signing in with Google connects to Firebase Cloud Firestore. All your custom tests, performance history, and study reminders are backed up and synchronized in real time across any device.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 space-y-2">
              <div className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <Laptop className="w-4 h-4 text-blue-500" />
                Local Storage Guest Mode
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                If you prefer not to sign in, or if third-party popups are disabled in your browser environment, ExamMaster Pro saves all your exam creations and results in your browser's persistent Local Storage automatically.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Call to action at bottom */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold font-['Syne',sans-serif] text-zinc-900 dark:text-white">
            Ready to test your knowledge?
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Explore ready-made exams in the library or create your own custom paper in seconds.
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
            Browse Library
          </button>
        </div>
      </div>
    </div>
  );
};
