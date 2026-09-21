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
  try {
    const rendered = katex.renderToString(math, { displayMode, throwOnError: false });
    html = displayMode
      ? `<div class="katex-display-wrapper my-2 overflow-x-auto">${rendered}</div>`
      : rendered;
  } catch {
    html = displayMode
      ? `<pre class="text-xs text-amber-500 font-mono">${math}</pre>`
      : `<span>${math}</span>`;
  }

  if (katexFormulaCache.size >= MAX_CACHE_SIZE) {
    const firstKey = katexFormulaCache.keys().next().value;
    if (firstKey) katexFormulaCache.delete(firstKey);
  }
  katexFormulaCache.set(cacheKey, html);
  return html;
}

function processMathContent(content: string): string {
  if (!content) return '';

  // Check full string cache
  const cached = fullHtmlCache.get(content);
  if (cached !== undefined) {
    return cached;
  }

  // Fast-path: if text has no math markers ($ or \), no markdown (* or `) and no tags, return fast
  const hasMath = content.includes('$') || content.includes('\\');
  const hasMarkdown = content.includes('*') || content.includes('`') || content.includes('<') || content.includes('>');
  const hasNewlines = content.includes('\n');

  if (!hasMath && !hasMarkdown && !hasNewlines) {
    const safeText = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    fullHtmlCache.set(content, safeText);
    return safeText;
  }

  // Step 1: Extract and tokenise LaTeX expressions
  const mathTokens: { token: string; html: string }[] = [];
  let counter = 0;

  // Replace display blocks \[ ... \] or $$ ... $$
  let text = content.replace(/\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g, (_, m1, m2) => {
    const math = (m1 || m2 || '').trim();
    const token = `__MATH_BLOCK_${counter++}__`;
    const html = getCachedKatex(math, true);
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

  // Also support single $...$ if present and not followed by numbers
  text = text.replace(/(?<!\\)\$([^\$\n]+?)\$/g, (_, math) => {
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
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-emerald-600 dark:text-emerald-400">$1</strong>');
  html = html.replace(/\*([^\*]+)\*/g, '<em class="italic opacity-90">$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-emerald-700 dark:text-emerald-300 border border-zinc-200 dark:border-zinc-700">$1</code>');
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
  fullHtmlCache.set(content, html);

  return html;
}

const MathRendererComponent: React.FC<MathRendererProps> = ({
  content,
  className = '',
  inline = false,
}) => {
  const renderedHtml = processMathContent(content);

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

