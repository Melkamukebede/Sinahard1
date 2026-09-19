import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clipboard,
  X,
  Code,
  Sparkles,
  HelpCircle,
  AlignLeft,
  BookOpen,
  ArrowRight,
  FileCheck,
  Crown,
  Lock,
} from 'lucide-react';
import { Question } from '../types';
import { UserTierStatus } from '../services/subscriptionLimits';

interface PasteJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestions: (questions: Question[]) => void;
  userTier?: UserTierStatus;
  onOpenSubscriptionModal?: () => void;
}

type InputFormat = 'text' | 'json';

const SAMPLE_TEXT_TEMPLATE = `1. What is the acceleration due to gravity on the surface of Earth?
A) 8.9 m/s²
B) 9.8 m/s²*
C) 11.2 m/s²
D) 3.7 m/s²
Explanation: Standard gravity on Earth is approximately g = 9.80665 m/s² (frequently rounded to 9.8 m/s²).

2. Which equation represents Newton's Second Law of Motion?
A) F = ma*
B) E = mc²
C) p = mv
D) W = Fd
Explanation: Newton's Second Law states that force equals mass multiplied by acceleration (F = ma).

3. What is the derivative of f(x) = 3x² + 5x - 4?
A) 3x + 5
B) 6x - 4
C) 6x + 5
D) 6x² + 5
Answer: C
Explanation: Using the power rule d/dx[x^n] = n*x^(n-1), d/dx[3x²] = 6x and d/dx[5x] = 5.`;

export const PasteJsonModal: React.FC<PasteJsonModalProps> = ({
  isOpen,
  onClose,
  onAddQuestions,
  userTier,
  onOpenSubscriptionModal,
}) => {
  const [activeTab, setActiveTab] = useState<InputFormat>('text');
  const [inputText, setInputText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  const maxLimit = userTier?.maxImportQuestions ?? 20;
  const isPremium = userTier?.isPremium ?? false;
  const isExceedingLimit = !isPremium && previewQuestions.length > maxLimit;

  // Helper: auto-fix unescaped LaTeX backslashes inside JSON strings
  const fixLatexBackslashes = (raw: string): string => {
    return raw
      .split('\n')
      .map((line) => {
        return line.replace(/"((?:[^"\\]|\\.)*)"/g, (_, inner) => {
          const fixed = inner.replace(
            /(?<!\\)\\(?!\\)([a-mo-zA-Z\(\)\[\]\{\}|_ ^])/g,
            '\\\\$1'
          );
          return `"${fixed}"`;
        });
      })
      .join('\n');
  };

  // Helper: parse plain text questions supporting vertical step-wise explanations
  const parsePlainText = (raw: string): Question[] => {
    const questions: Question[] = [];
    const cleanContent = raw.trim();
    if (!cleanContent) return questions;

    let rawBlocks: string[] = [];
    const hasNumberedQuestions = /(?:^|\n)\s*(?:question\s*\d+[:\.]?|\bq\d+[:\.\)]|\d+[\.\)]|\#+\s*\d+[\.\)])\s+/i.test(cleanContent);

    if (hasNumberedQuestions) {
      const splitRegex = /(?:^|\n)(?=\s*(?:question\s*\d+[:\.]?|\bq\d+[:\.\)]|\d+[\.\)]|\#+\s*\d+[\.\)])\s+)/i;
      rawBlocks = cleanContent.split(splitRegex).map((b) => b.trim()).filter(Boolean);
    } else {
      rawBlocks = cleanContent.split(/\n\s*\n+/).map((b) => b.trim()).filter(Boolean);
    }

    rawBlocks.forEach((block) => {
      const lines = block.split('\n');
      if (!lines.length) return;

      const textLines: string[] = [];
      const options: string[] = [];
      let correct = -1;
      const explanationLines: string[] = [];
      let inExplanation = false;
      let foundFirstOption = false;

      const firstLine = lines[0].trim();
      const headerMatch = firstLine.match(/^(?:question\s*\d+[:\.]?|\bq\d+[:\.\)]|\d+[\.\)]|\#+\s*\d+[\.\)]?)\s*(.*)/i);
      if (headerMatch) {
        if (headerMatch[1].trim()) {
          textLines.push(headerMatch[1].trim());
        }
      } else {
        textLines.push(firstLine);
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check for Answer key line
        const ansMatch = line.match(/^(?:answer|ans|correct(?:\s*answer)?|key)\s*[:\-\=]\s*\(?([A-D1-4])\)?(?:\s*[\.\)]|\s*$|\s+.*)/i);
        if (ansMatch) {
          const letter = ansMatch[1].toUpperCase();
          if (['A', 'B', 'C', 'D'].includes(letter)) {
            correct = ['A', 'B', 'C', 'D'].indexOf(letter);
          } else {
            const num = parseInt(letter, 10) - 1;
            if (num >= 0 && num < 4) correct = num;
          }
          continue;
        }

        // Check for Explanation line
        const expMatch = line.match(/^(?:explanation|explain|reasoning|\/\/|solution|steps?)\s*[:\-\=]\s*(.*)/i);
        if (expMatch) {
          inExplanation = true;
          if (expMatch[1].trim()) {
            explanationLines.push(expMatch[1].trim());
          }
          continue;
        }

        // Check for Option line
        const optMatch = line.match(/^(?:\(([A-D1-4])\)|([A-D1-4])[\)\.\:\-])\s*(.*)/i);
        if (!inExplanation && optMatch) {
          foundFirstOption = true;
          const letter = (optMatch[1] || optMatch[2]).toUpperCase();
          let letterIdx = ['A', 'B', 'C', 'D'].indexOf(letter);
          if (letterIdx === -1) {
            letterIdx = parseInt(letter, 10) - 1;
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
          continue;
        }

        if (inExplanation) {
          if (line) {
            explanationLines.push(line);
          } else if (explanationLines.length > 0 && explanationLines[explanationLines.length - 1] !== '') {
            explanationLines.push('');
          }
        } else if (!foundFirstOption) {
          if (line) {
            textLines.push(line);
          }
        }
      }

      const fullText = textLines.join(' ').trim();
      const fullExplanation = explanationLines.join('\n').trim();

      if (fullText && options.length >= 2) {
        while (options.length < 4) {
          options.push(`Option ${String.fromCharCode(65 + options.length)}`);
        }

        questions.push({
          id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          text: fullText,
          options: options.slice(0, 4),
          correct: correct >= 0 && correct < 4 ? correct : 0,
          explanation: fullExplanation,
        });
      }
    });

    return questions;
  };

  // Validation logic
  useEffect(() => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setErrorMessage(null);
      setPreviewQuestions([]);
      return;
    }

    if (activeTab === 'json' || trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const cleaned = fixLatexBackslashes(
          trimmed.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '')
        );
        const parsed = JSON.parse(cleaned);
        const items = Array.isArray(parsed) ? parsed : [parsed];

        const validQuestions: Question[] = items
          .filter((q) => q && typeof q.text === 'string' && Array.isArray(q.options) && q.options.length >= 2)
          .map((q) => {
            const opts = [...q.options];
            while (opts.length < 4) opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
            return {
              id: 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
              text: q.text,
              options: opts.slice(0, 4),
              correct: typeof q.correct === 'number' ? q.correct : 0,
              explanation: q.explanation || '',
            };
          });

        if (validQuestions.length === 0) {
          setErrorMessage('No valid question items found. Expected objects with "text", "options" array, and "correct" index.');
          setPreviewQuestions([]);
        } else {
          setErrorMessage(null);
          setPreviewQuestions(validQuestions);
        }
      } catch (err: unknown) {
        if (activeTab === 'json') {
          const msg = err instanceof Error ? err.message : 'Invalid JSON format';
          setErrorMessage(`JSON Syntax Error: ${msg}`);
          setPreviewQuestions([]);
        } else {
          // If in text tab, fallback to text parser
          const parsed = parsePlainText(trimmed);
          if (parsed.length > 0) {
            setErrorMessage(null);
            setPreviewQuestions(parsed);
          } else {
            setErrorMessage('Unable to extract questions from text. Check question numbering and A) B) C) D) format.');
            setPreviewQuestions([]);
          }
        }
      }
    } else {
      const parsed = parsePlainText(trimmed);
      if (parsed.length === 0) {
        setErrorMessage('Plain text detected, but no questions with A) B) C) D) options could be identified.');
        setPreviewQuestions([]);
      } else {
        setErrorMessage(null);
        setPreviewQuestions(parsed);
      }
    }
  }, [inputText, activeTab]);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
    } catch {
      setErrorMessage('Clipboard access blocked. Please use Ctrl+V or Cmd+V directly.');
    }
  };

  const handleInsertSampleTemplate = () => {
    setActiveTab('text');
    setInputText(SAMPLE_TEXT_TEMPLATE);
    setErrorMessage(null);
  };

  const handleApply = (forceLimit: boolean = false) => {
    if (previewQuestions.length === 0) return;
    const toImport = forceLimit ? previewQuestions.slice(0, maxLimit) : previewQuestions;
    onAddQuestions(toImport);
    setInputText('');
    setPreviewQuestions([]);
    onClose();
  };

  if (!isOpen) return null;

  const lineCount = inputText ? inputText.split('\n').length : 0;
  const charCount = inputText.length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-[28px] bg-white dark:bg-[#081120] border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden text-zinc-900 dark:text-white"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between bg-zinc-50/90 dark:bg-[#0c1626]/90">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base font-['Syne',sans-serif]">
                    Paste as Text File / Questions
                  </h3>
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
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Bulk question importer with plain text & LaTeX support
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Format Tabs & Toolbar */}
          <div className="px-6 py-3 bg-zinc-100/70 dark:bg-[#0a1424]/80 border-b border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
            {/* Tab switchers */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-200/80 dark:bg-zinc-800/80">
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'text'
                    ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Plain Text Format (Default)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'json'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>JSON Array</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleInsertSampleTemplate}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-bold transition cursor-pointer flex items-center gap-1"
                title="Load sample question text"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Sample Text</span>
              </button>

              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white font-medium transition cursor-pointer flex items-center gap-1"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Paste</span>
              </button>

              <button
                type="button"
                onClick={() => setInputText('')}
                className="px-2 py-1.5 rounded-lg text-zinc-400 hover:text-rose-500 font-medium transition cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Format Instructions Banner */}
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-300 flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-zinc-900 dark:text-white">Text Format Instructions: </span>
                Provide question numbering (e.g. <code className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">1. Question</code>),
                four options (<code className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">A) ... B) ...</code>), mark the correct answer with an asterisk (<code className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">B) Option*</code>) or write <code className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">Answer: B</code>, and add an optional <code className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800">Explanation: ...</code>.
              </div>
            </div>

            {/* Input Textarea */}
            <div className="relative">
              <textarea
                id="pasteTextInput"
                rows={10}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`1. What is the derivative of f(x) = x³?\nA) 3x²*\nB) 2x\nC) 3x\nD) x⁴/4\nExplanation: Using the power rule d/dx[x^n] = n*x^(n-1).\n\n2. Which law states that PV = nRT?\nA) Boyle's Law\nB) Charles's Law\nC) Ideal Gas Law*\nD) Avogadro's Law`}
                className="w-full p-4 font-mono text-xs leading-relaxed rounded-2xl bg-zinc-50 dark:bg-[#070e1a] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-y"
                spellCheck="false"
              />
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between text-zinc-400 text-[11px] px-1">
              <span>{lineCount} lines • {charCount} characters</span>
              <span className={`font-bold ${previewQuestions.length > 0 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                {previewQuestions.length} Questions Ready
              </span>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="break-all">{errorMessage}</div>
              </motion.div>
            )}

            {/* Freemium Limit Warning Banner */}
            {previewQuestions.length > 0 && isExceedingLimit && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Crown className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <span>{userTier?.isTrial ? '3-Day Trial Import Limit' : 'Free Account Limit'}: {maxLimit} Questions</span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      Pasted {previewQuestions.length}
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
                    {userTier?.isTrial
                      ? `During your 3-day welcome trial (${userTier.trialDaysRemaining} days remaining), you can import up to ${maxLimit} questions per exam. You can import the first ${maxLimit} questions now, or upgrade for unlimited bulk questions.`
                      : `Standard student accounts can import up to ${maxLimit} questions per exam. You can import the first ${maxLimit} questions now, or upgrade to Premium starting at 19.9 ETB for unlimited imports.`}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Questions Preview List */}
            {previewQuestions.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Parsed Questions Preview ({previewQuestions.length})</span>
                  </span>
                  {isExceedingLimit && (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold normal-case text-[11px]">
                      First {maxLimit} will be imported
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                  {previewQuestions.map((q, idx) => {
                    const isBeyondCap = !isPremium && idx >= maxLimit;
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition ${
                          isBeyondCap
                            ? 'bg-zinc-100/50 dark:bg-zinc-900/40 border-dashed border-zinc-300 dark:border-zinc-800 opacity-60'
                            : 'bg-zinc-50 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-zinc-900 dark:text-white">
                            {idx + 1}. {q.text}
                          </div>
                          {isBeyondCap && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 shrink-0">
                              Requires Premium
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`px-2 py-1 rounded-lg border ${
                                oIdx === q.correct
                                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold'
                                  : 'bg-white/60 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-400'
                              }`}
                            >
                              {String.fromCharCode(65 + oIdx)}) {opt}
                              {oIdx === q.correct && ' ✓'}
                            </div>
                          ))}
                        </div>
                        {q.explanation && (
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 italic pt-1">
                            Explanation: {q.explanation}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-[#0c1626]/90 flex items-center justify-between flex-wrap gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2.5">
              {isExceedingLimit ? (
                <>
                  {onOpenSubscriptionModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSubscriptionModal();
                      }}
                      className="px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>Upgrade for All {previewQuestions.length} Questions</span>
                    </button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handleApply(true)}
                    className="px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Import First {maxLimit} Questions</span>
                  </motion.button>
                </>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  disabled={previewQuestions.length === 0}
                  onClick={() => handleApply(false)}
                  className="px-6 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Import {previewQuestions.length} Questions</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

