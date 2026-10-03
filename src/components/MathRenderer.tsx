import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

// Global LRU Cache for KaTeX rendered formulas to avoid re-parsing identical equations
const MAX_CACHE_SIZE = 800;
const katexFormulaCache = new Map<string, string>();
const fullHtmlCache = new Map<string, string>();

function getCachedKatex(math: string, displayMode: boolean): string {
  const cacheKey = `${displayMode ? 'D:' : 'I:'}${math}`;
  const cached = katexFormulaCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  let html = '';
  const encodedMath = encodeURIComponent(math);
  try {
    let rendered = katex.renderToString(math, { displayMode, throwOnError: false });

    // Inject data-latex attribute into KaTeX element for Option 1: automatic clipboard interceptor
    if (!rendered.includes('data-latex=')) {
      rendered = rendered.replace('<span class="katex">', `<span class="katex" data-latex="${encodedMath}">`);
    }

    if (displayMode) {
      // Option 2: Dedicated 1-Tap Quick-Copy Button on display equation container
      html = `<div class="katex-display-wrapper group relative my-3 px-3.5 py-2.5 rounded-2xl bg-zinc-50/90 dark:bg-[#0c182b]/80 border border-zinc-200/80 dark:border-white/10 shadow-2xs overflow-x-auto flex items-center justify-between gap-3" data-latex="${encodedMath}" data-display="true">
        <div class="katex-display-content overflow-x-auto py-1 flex-1 text-center font-normal">
          ${rendered}
        </div>
        <button
          type="button"
          class="katex-copy-btn shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0f1d33] hover:bg-zinc-100 dark:hover:bg-[#162742] text-zinc-700 dark:text-zinc-200 border border-zinc-200/90 dark:border-white/10 text-xs font-semibold shadow-2xs transition-all cursor-pointer select-none active:scale-95"
          data-copy-latex="${encodedMath}"
          title="Copy LaTeX formula"
          aria-label="Copy LaTeX formula"
        >
          <svg class="copy-icon w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
          <span class="copy-label hidden xs:inline text-[11px] font-bold">Copy LaTeX</span>
        </button>
      </div>`;
    } else {
      html = rendered;
    }
  } catch {
    html = displayMode
      ? `<div class="katex-display-wrapper my-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 font-mono" data-latex="${encodedMath}"><pre class="overflow-x-auto">${math}</pre></div>`
      : `<span data-latex="${encodedMath}">${math}</span>`;
  }

  if (katexFormulaCache.size >= MAX_CACHE_SIZE) {
    const firstKey = katexFormulaCache.keys().next().value;
    if (firstKey) katexFormulaCache.delete(firstKey);
  }
  katexFormulaCache.set(cacheKey, html);
  return html;
}

function processMathContent(content: string, isInlineOnly = false): string {
  if (!content) return '';

  const cacheKey = `${isInlineOnly ? 'INLINE:' : 'BLOCK:'}${content}`;
  // Check full string cache
  const cached = fullHtmlCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // Fast-path: if text has no math markers ($ or \ or [), no markdown (* or `) and no tags, return fast
  const hasMath = content.includes('$') || content.includes('\\') || (content.includes('[') && content.includes(']'));
  const hasMarkdown = content.includes('*') || content.includes('`') || content.includes('<') || content.includes('>');
  const hasNewlines = content.includes('\n');

  if (!hasMath && !hasMarkdown && !hasNewlines) {
    const safeText = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    fullHtmlCache.set(cacheKey, safeText);
    return safeText;
  }

  // Step 1: Extract and tokenise LaTeX expressions
  const mathTokens: { token: string; html: string }[] = [];
  let counter = 0;

  let text = content;

  // Replace standard display blocks \[ ... \] or $$ ... $$
  text = text.replace(/\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g, (_, m1, m2) => {
    const math = (m1 || m2 || '').trim();
    const token = `__MATH_BLOCK_${counter++}__`;
    const html = getCachedKatex(math, !isInlineOnly);
    mathTokens.push({ token, html });
    return token;
  });

  // Replace bare bracket display blocks [ ... ] (commonly copied without backslash on phones/ChatGPT)
  // Uses lookbehind / lookahead so consecutive equations [ Eq1 ] [ Eq2 ] or [ Eq1 ]\n[ Eq2 ] match without skipping
  text = text.replace(/(?:^|(?<=[\s\n]))\[\s*([a-zA-Z0-9_\s\+\-\*\/\=\^\(\)\,\.\{\}\\]*?\\(?:frac|sqrt|sum|int|cdot|vec|times|alpha|beta|theta|pi|pm|approx|left|right|text|lim|over|partial|Delta|Omega|lambda)[a-zA-Z0-9_\s\+\-\*\/\=\^\(\)\,\.\{\}\\]*?)\s*\](?=[\s\n]|$)/g, (_, math) => {
    const token = `__MATH_BLOCK_${counter++}__`;
    const html = getCachedKatex(math.trim(), !isInlineOnly);
    mathTokens.push({ token, html });
    return token;
  });

  // Replace inline \( ... \)
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    const token = `__MATH_INLINE_${counter++}__`;
    const html = getCachedKatex(math.trim(), false);
    mathTokens.push({ token, html });
    return token;
  });

  // Support single $...$ if present and not followed by numbers
  text = text.replace(/(?<!\\)\$([^\$\n]+?)\$/g, (_, math) => {
    const token = `__MATH_INLINE_${counter++}__`;
    const html = getCachedKatex(math.trim(), false);
    mathTokens.push({ token, html });
    return token;
  });

  // Auto-detect standalone lines containing naked LaTeX (equations with \frac, \sqrt, etc. that lost delimiters on phone)
  text = text.replace(/(?:^|\n)\s*([a-zA-Z0-9\(\)\s\+\-\*\/\=\,\.]*\\(?:frac|sqrt|sum|int|cdot|vec|times|alpha|beta|theta|pi|pm|approx|lim|partial|Delta|Omega|lambda|text)\{[^\}\n]+\}[^\n]*)(?=\n|$)/g, (fullMatch, math) => {
    if (math.includes('__MATH_')) return fullMatch;
    const token = `__MATH_BLOCK_${counter++}__`;
    const html = getCachedKatex(math.trim(), !isInlineOnly);
    mathTokens.push({ token, html });
    return `\n${token}\n`;
  });

  // Auto-detect inline naked LaTeX formulas like \frac{1}{2} or \sqrt{3} that lost inline $ delimiters
  text = text.replace(/(?<![\$\w\\])(?:\\(?:frac\{[^\}\n]+\}\{[^\}\n]+\}|sqrt(?:\[[^\]\n]+\])?\{[^\}\n]+\}))/g, (math) => {
    if (math.includes('__MATH_')) return math;
    const token = `__MATH_INLINE_${counter++}__`;
    const html = getCachedKatex(math.trim(), false);
    mathTokens.push({ token, html });
    return token;
  });

  // Step 2: Escape HTML
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Step 3: Markdown formatting
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-zinc-900 dark:text-white">$1</strong>');
  html = html.replace(/\*([^\*]+)\*/g, '<em class="italic opacity-90">$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">$1</code>');
  html = html.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');

  // Step 4: Restore KaTeX tokens
  for (let i = 0; i < mathTokens.length; i++) {
    html = html.replace(mathTokens[i].token, mathTokens[i].html);
  }

  // Cache compiled output
  if (fullHtmlCache.size >= MAX_CACHE_SIZE) {
    const firstKey = fullHtmlCache.keys().next().value;
    if (firstKey) fullHtmlCache.delete(firstKey);
  }
  fullHtmlCache.set(cacheKey, html);

  return html;
}

const MathRendererComponent: React.FC<MathRendererProps> = ({
  content,
  className = '',
  inline = false,
}) => {
  const renderedHtml = processMathContent(content, inline);

  if (inline) {
    return (
      <span
        className={`katex-rendered inline ${className}`}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

  return (
    <div
      className={`katex-rendered leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

export const MathRenderer = React.memo(MathRendererComponent);
