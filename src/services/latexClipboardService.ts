/**
 * LaTeX Clipboard Service
 * 
 * Provides two synchronized options for flawless LaTeX equation copying on Mobile and PC:
 * 
 * Option 1: Automatic Selection & Clipboard Interceptor (Enhanced KaTeX copy-tex)
 *   - Intercepts native browser copy events (mobile long-press "Copy" toolbar, desktop Ctrl+C, context menu).
 *   - Automatically detects KaTeX visual spans and extracts pristine LaTeX source code.
 *   - Prevents mobile phones from copying broken/fragmented DOM nodes (e.g. `a = v - u t`).
 *   - Formats standalone equations like:
 *       [ a = \frac{v - u}{t} ]
 *       [ s = ut + \frac{1}{2}at^2 ]
 *     cleanly as:
 *       a = \frac{v - u}{t}
 *       s = ut + \frac{1}{2}at^2
 * 
 * Option 2: Tactile 1-Tap Quick-Copy Action & Multi-Format Popover
 *   - Provides explicit, touch-friendly 1-tap copy buttons on every equation block.
 *   - Instant visual feedback ("✓ Copied!") and haptic/toast notifications.
 *   - Quick selection between:
 *       1. Raw LaTeX: `a = \frac{v - u}{t}`
 *       2. Bracket delimiters: `[ a = \frac{v - u}{t} ]`
 *       3. Dollar delimiters: `$$ a = \frac{v - u}{t} $$`
 *       4. Human-readable Plain Math: `a = (v - u) / t`
 */

export type LatexFormat = 'raw' | 'brackets' | 'dollars' | 'plain';

/**
 * Detects if the current user is on a mobile device or small touch viewport
 */
export function isMobileUserDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 768px)').matches) ||
    window.innerWidth < 768
  );
}

/**
 * Converts common LaTeX math expressions into human-readable plain text
 */
export function latexToPlainText(latex: string): string {
  if (!latex) return '';
  let str = latex.trim();

  // Remove display delimiters if wrapped
  str = str.replace(/^\\\[\s*|\s*\\\]$/g, '');
  str = str.replace(/^\$\$\s*|\s*\$\$$/g, '');
  str = str.replace(/^\\\(|\s*\\\)$/g, '');
  str = str.replace(/^\$|\$$/g, '');
  str = str.replace(/^\[\s*|\s*\]$/g, '');

  // Fractions: \frac{a}{b} -> (a) / (b)
  while (/\\frac\{([^{}]+)\}\{([^{}]+)\}/.test(str)) {
    str = str.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)');
  }

  // Square roots: \sqrt[n]{x} -> root(n, x), \sqrt{x} -> sqrt(x)
  str = str.replace(/\\sqrt\[(.*?)\]\{(.*?)\}/g, 'root($1, $2)');
  str = str.replace(/\\sqrt\{(.*?)\}/g, 'sqrt($1)');

  // Common symbols & operators
  str = str
    .replace(/\\times/g, ' × ')
    .replace(/\\cdot/g, ' · ')
    .replace(/\\pm/g, ' ± ')
    .replace(/\\mp/g, ' ∓ ')
    .replace(/\\div/g, ' ÷ ')
    .replace(/\\approx/g, ' ≈ ')
    .replace(/\\neq/g, ' ≠ ')
    .replace(/\\ne/g, ' ≠ ')
    .replace(/\\leq/g, ' ≤ ')
    .replace(/\\le/g, ' ≤ ')
    .replace(/\\geq/g, ' ≥ ')
    .replace(/\\ge/g, ' ≥ ')
    .replace(/\\infty/g, '∞')
    .replace(/\\degree/g, '°')
    .replace(/\\circ/g, '°')
    .replace(/\\to/g, ' → ')
    .replace(/\\rightarrow/g, ' → ');

  // Greek letters
  str = str
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\delta/g, 'δ')
    .replace(/\\theta/g, 'θ')
    .replace(/\\lambda/g, 'λ')
    .replace(/\\mu/g, 'μ')
    .replace(/\\pi/g, 'π')
    .replace(/\\rho/g, 'ρ')
    .replace(/\\sigma/g, 'σ')
    .replace(/\\omega/g, 'ω')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\Omega/g, 'Ω');

  // Superscripts
  str = str
    .replace(/\^2(?!\d)/g, '²')
    .replace(/\^3(?!\d)/g, '³')
    .replace(/\^\{2\}/g, '²')
    .replace(/\^\{3\}/g, '³');

  // Clean remaining formatting commands
  str = str
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\mathit\{([^}]+)\}/g, '$1')
    .replace(/\\left[\(\[\{]/g, '(')
    .replace(/\\right[\)\]\}]/g, ')')
    .replace(/\\[,;:!]/g, ' ')
    .replace(/\\quad/g, '  ')
    .replace(/\\qquad/g, '   ')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return str;
}

/**
 * Format a LaTeX string according to user preference
 */
export function formatLatex(latex: string, format: LatexFormat = 'raw'): string {
  const clean = latex.trim();
  switch (format) {
    case 'raw':
      return clean;
    case 'brackets':
      return `[ ${clean} ]`;
    case 'dollars':
      return `$$ ${clean} $$`;
    case 'plain':
      return latexToPlainText(clean);
    default:
      return clean;
  }
}

/**
 * Robust copy to clipboard supporting modern navigator.clipboard and legacy fallback
 */
export async function copyLatexToClipboard(
  latex: string,
  format: LatexFormat = 'raw'
): Promise<boolean> {
  const textToCopy = formatLatex(latex, format);
  if (!textToCopy) return false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy);
      dispatchCopyFeedback(textToCopy, format);
      return true;
    }
  } catch {
    // Fall back to document.execCommand
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    if (successful) {
      dispatchCopyFeedback(textToCopy, format);
    }
    return successful;
  } catch {
    return false;
  }
}

/**
 * Notify the application that LaTeX was copied
 */
function dispatchCopyFeedback(text: string, format: LatexFormat) {
  window.dispatchEvent(
    new CustomEvent('latex-copied', {
      detail: { text, format, timestamp: Date.now() },
    })
  );
}

// -------------------------------------------------------------
// OPTION 1: Automatic Selection & Clipboard Interceptor
// -------------------------------------------------------------

function closestMathElement(node: Node): Element | null {
  const el = node instanceof Element ? node : node.parentElement;
  if (!el) return null;
  return el.closest('.katex-display-wrapper, .katex, .katex-display');
}

/**
 * Extract clean LaTeX from a KaTeX DOM element
 */
function getTexFromElement(element: Element): { tex: string; isDisplay: boolean } | null {
  // Check if data-latex attribute is set directly
  const dataLatex = element.getAttribute('data-latex');
  const isDisplay =
    element.getAttribute('data-display') === 'true' ||
    element.classList.contains('katex-display') ||
    element.classList.contains('katex-display-wrapper') ||
    Boolean(element.closest('.katex-display, .katex-display-wrapper'));

  if (dataLatex) {
    try {
      return { tex: decodeURIComponent(dataLatex), isDisplay };
    } catch {
      return { tex: dataLatex, isDisplay };
    }
  }

  // Check MathML annotation
  const annotation = element.querySelector('annotation[encoding="application/x-tex"]');
  if (annotation && annotation.textContent) {
    return { tex: annotation.textContent.trim(), isDisplay };
  }

  return null;
}

/**
 * Recursively cleans a DOM fragment replacing KaTeX rendered nodes with clean LaTeX strings
 */
function replaceKatexWithTex(fragment: DocumentFragment): void {
  // 1. Remove all copy buttons and action toolbars from the fragment
  const actionButtons = fragment.querySelectorAll('.katex-copy-btn, .katex-actions, .katex-action-toolbar');
  actionButtons.forEach((btn) => btn.remove());

  // 2. Handle display wrappers first
  const displayWrappers = fragment.querySelectorAll('.katex-display-wrapper');
  displayWrappers.forEach((wrapper) => {
    const mathInfo = getTexFromElement(wrapper);
    if (mathInfo) {
      // Standalone equations on phone copy as clean equation lines
      const textNode = document.createTextNode(`\n${mathInfo.tex}\n`);
      wrapper.replaceWith(textNode);
    }
  });

  // 3. Handle remaining .katex-display and .katex elements
  const mathElements = fragment.querySelectorAll('.katex-display, .katex');
  mathElements.forEach((el) => {
    const mathInfo = getTexFromElement(el);
    if (mathInfo) {
      const formatted = mathInfo.isDisplay
        ? `\n${mathInfo.tex}\n`
        : `$${mathInfo.tex}$`;
      const textNode = document.createTextNode(formatted);
      el.replaceWith(textNode);
    } else {
      // Fallback: Remove .katex-html so broken spans don't pollute plain text
      const katexHtml = el.querySelector('.katex-html');
      if (katexHtml) katexHtml.remove();
      const annotation = el.querySelector('annotation');
      if (annotation) {
        el.replaceWith(document.createTextNode(annotation.textContent || ''));
      }
    }
  });
}

/**
 * Prompt directive for AI models (ChatGPT, Claude, Gemini, DeepSeek)
 * to output LaTeX math that is 100% resilient to mobile touch copy-pasting.
 */
export function getPhoneSafeLatexPromptDirective(): string {
  return `MOBILE-SAFE LATEX COMPLIANCE DIRECTIVE (ANTI-PHONE-COPY ELIMINATION):
1. DEDICATED STANDALONE LINES: Place every main formula or calculation step on its own dedicated line wrapped in bracket format:
   [ equation ]
   Example:
   [ a = \\frac{v - u}{t} ]
   [ s = ut + \\frac{1}{2}at^2 ]
2. BLANK LINE PADDING: Always insert a blank line before and after every equation line. Mobile touch selection handles drop fractions and backslashes if equations touch surrounding text.
3. INLINE MATH IN CHOICES: For inline variables or values inside multiple-choice options, wrap in \\( ... \\) or [ ... ].
4. STRICT BACKSLASH RETENTION: Retain all standard LaTeX backslashes (\\frac, \\sqrt, \\times, \\cdot, \\pm, ^2). Never substitute plain ASCII like 'v - u / t' or '1/2'.
5. NO NUMBERED STEPS IN EXPLANATIONS: Use bold thematic labels (**Formula:**, **Calculation:**, **Answer:**) instead of "1. Formula", "2. Calculation".`;
}

let isClipboardInterceptorInitialized = false;

/**
 * Initializes the global LaTeX clipboard listener.
 * Runs once at app launch.
 */
export function initLatexClipboardInterceptor(): () => void {
  if (isClipboardInterceptorInitialized || typeof window === 'undefined') {
    return () => {};
  }
  isClipboardInterceptorInitialized = true;

  const handleCopy = (event: ClipboardEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !event.clipboardData) {
      return;
    }

    try {
      const range = selection.getRangeAt(0);

      // Expand selection if boundary started or ended inside a math formula
      const startMath = closestMathElement(range.startContainer);
      if (startMath) {
        range.setStartBefore(startMath);
      }
      const endMath = closestMathElement(range.endContainer);
      if (endMath) {
        range.setEndAfter(endMath);
      }

      const fragment = range.cloneContents();

      // Check if any KaTeX or math elements exist in the selected fragment
      const hasMath =
        fragment.querySelector('.katex, .katex-mathml, .katex-display-wrapper, [data-latex]') !== null;

      if (!hasMath) {
        return; // Standard text selection, let native copy handle it
      }

      // Clone fragment for HTML and plain text
      const htmlFragment = fragment.cloneNode(true) as DocumentFragment;
      const textFragment = fragment.cloneNode(true) as DocumentFragment;

      // Transform textFragment into clean LaTeX
      replaceKatexWithTex(textFragment);

      let cleanPlainText = textFragment.textContent || '';

      // Normalize line breaks & excessive whitespace created by blocks
      cleanPlainText = cleanPlainText
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/ +\n/g, '\n')
        .replace(/\n +/g, '\n')
        .trim();

      // If the selection was specifically wrapped in [ ... ] that got captured as brackets
      // e.g. [ a = \frac{v - u}{t} ]\n[ s = ut + \frac{1}{2}at^2 ], ensure clean formatting
      cleanPlainText = cleanPlainText
        .replace(/\[\s*\n\s*/g, '[ ')
        .replace(/\s*\n\s*\]/g, ' ]');

      // Set clean plain text and HTML
      event.clipboardData.setData('text/plain', cleanPlainText);

      // HTML contents (preserving math formatting in rich-text paste)
      const div = document.createElement('div');
      div.appendChild(htmlFragment);
      event.clipboardData.setData('text/html', div.innerHTML);

      // Prevent native copy of fragmented KaTeX spans
      event.preventDefault();

      dispatchCopyFeedback(cleanPlainText, 'raw');
    } catch (err) {
      console.warn('LaTeX copy interceptor fallback:', err);
    }
  };

  // Click delegation for 1-tap copy buttons on rendered formula blocks
  const handleClick = async (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const copyBtn = target.closest<HTMLButtonElement>('.katex-copy-btn');
    if (!copyBtn) return;

    e.preventDefault();
    e.stopPropagation();

    const encodedLatex = copyBtn.getAttribute('data-copy-latex');
    if (!encodedLatex) return;

    const latex = decodeURIComponent(encodedLatex);
    const success = await copyLatexToClipboard(latex, 'raw');

    if (success) {
      // Visual feedback on the button itself
      const originalHtml = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg class="w-3.5 h-3.5 text-emerald-500 animate-in zoom-in duration-150" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span class="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Copied!</span>
      `;
      copyBtn.classList.add('bg-emerald-50', 'dark:bg-emerald-950/40', 'border-emerald-300', 'dark:border-emerald-700/60');

      setTimeout(() => {
        copyBtn.innerHTML = originalHtml;
        copyBtn.classList.remove('bg-emerald-50', 'dark:bg-emerald-950/40', 'border-emerald-300', 'dark:border-emerald-700/60');
      }, 2000);
    }
  };

  document.addEventListener('copy', handleCopy);
  document.addEventListener('click', handleClick);

  return () => {
    document.removeEventListener('copy', handleCopy);
    document.removeEventListener('click', handleClick);
    isClipboardInterceptorInitialized = false;
  };
}
