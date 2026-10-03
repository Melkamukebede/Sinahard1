import React, { useState } from 'react';
import { Copy, Check, X, Code2, Brackets, DollarSign, Type, Sparkles } from 'lucide-react';
import { formatLatex, copyLatexToClipboard, LatexFormat } from '../services/latexClipboardService';

interface LatexFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  latex: string;
  onSuccessToast?: (msg: string) => void;
}

export const LatexFormatModal: React.FC<LatexFormatModalProps> = ({
  isOpen,
  onClose,
  latex,
  onSuccessToast,
}) => {
  const [copiedFormat, setCopiedFormat] = useState<LatexFormat | null>(null);

  if (!isOpen || !latex) return null;

  const handleCopy = async (format: LatexFormat) => {
    const success = await copyLatexToClipboard(latex, format);
    if (success) {
      setCopiedFormat(format);
      const label =
        format === 'raw'
          ? 'Raw LaTeX'
          : format === 'brackets'
          ? '[ ... ] Delimiters'
          : format === 'dollars'
          ? '$$ ... $$ Delimiters'
          : 'Plain Math Text';
      onSuccessToast?.(`Copied as ${label}!`);
      setTimeout(() => {
        setCopiedFormat(null);
      }, 1800);
    }
  };

  const formats: {
    id: LatexFormat;
    title: string;
    description: string;
    icon: React.ReactNode;
    preview: string;
  }[] = [
    {
      id: 'raw',
      title: 'Raw LaTeX Formula',
      description: 'Pristine equation without delimiters (Recommended for MathJax, KaTeX & AI)',
      icon: <Code2 className="w-4 h-4 text-emerald-500" />,
      preview: formatLatex(latex, 'raw'),
    },
    {
      id: 'brackets',
      title: 'Bracket Display [ ... ]',
      description: 'Standard physics & university exam display notation',
      icon: <Brackets className="w-4 h-4 text-sky-500" />,
      preview: formatLatex(latex, 'brackets'),
    },
    {
      id: 'dollars',
      title: 'Dollar Display $$ ... $$',
      description: 'Standard Markdown, Obsidian, Notion & LaTeX document syntax',
      icon: <DollarSign className="w-4 h-4 text-amber-500" />,
      preview: formatLatex(latex, 'dollars'),
    },
    {
      id: 'plain',
      title: 'Plain Readable Text',
      description: 'Human-readable characters without LaTeX code (for SMS, Chat & Notes)',
      icon: <Type className="w-4 h-4 text-purple-500" />,
      preview: formatLatex(latex, 'plain'),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] bg-white dark:bg-[#070e1a] border border-zinc-200 dark:border-white/10 shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom-6 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-white/10 flex items-center justify-center text-zinc-900 dark:text-white">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold font-['Outfit',sans-serif] text-zinc-900 dark:text-white">
                Copy Formula
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Choose your preferred export format for phone or PC
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Formula Display */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#0c182b] border border-zinc-200/80 dark:border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1">
            Equation Source
          </span>
          <div className="font-mono text-xs text-zinc-800 dark:text-zinc-200 break-all select-all">
            {latex}
          </div>
        </div>

        {/* Format Selection List */}
        <div className="space-y-2.5">
          {formats.map((fmt) => {
            const isJustCopied = copiedFormat === fmt.id;
            return (
              <div
                key={fmt.id}
                className="group relative p-3.5 rounded-2xl bg-white dark:bg-[#0c182b]/60 hover:bg-zinc-50 dark:hover:bg-[#0f1d33] border border-zinc-200/80 dark:border-white/10 transition-all flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {fmt.icon}
                    <span className="text-xs font-bold text-zinc-900 dark:text-white font-['Outfit',sans-serif]">
                      {fmt.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(fmt.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                      isJustCopied
                        ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                        : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:opacity-90'
                    }`}
                  >
                    {isJustCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                  {fmt.description}
                </p>

                <div className="mt-1 px-3 py-2 rounded-xl bg-zinc-100/80 dark:bg-[#070e1a] font-mono text-[11px] text-zinc-700 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all border border-zinc-200/50 dark:border-white/5">
                  {fmt.preview}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer tip */}
        <div className="pt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
          💡 <span className="font-semibold text-zinc-600 dark:text-zinc-300">Pro tip:</span> You can also highlight and copy formulas directly on your phone with native copy!
        </div>
      </div>
    </div>
  );
};
