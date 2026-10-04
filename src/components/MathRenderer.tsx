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
      // Seamless equation container without intrusive copy buttons or labels
      // Option 1 automatic clipboard interceptor handles mobile and desktop copying seamlessly via data-latex
      html = `<div class="katex-display-wrapper my-3 px-3.5 py-2.5 rounded-2xl bg-zinc-50/90 dark:bg-[#0c182b]/80 border border-zinc-200/80 dark:border-white/10 shadow-2xs overflow-x-auto text-center" data-latex="${encodedMath}" data-display="true">
        <div class="katex-display-content overflow-x-auto py-1 font-normal">
          ${rendered}
        </div>
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
