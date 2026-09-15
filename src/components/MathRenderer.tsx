import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({
  content,
  className = '',
  inline = false,
}) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // Step 1: Extract and tokenise LaTeX expressions
    const mathTokens: { token: string; html: string }[] = [];
    let counter = 0;

    // Replace display blocks \[ ... \] or $$ ... $$
    let text = content.replace(/\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$/g, (_, m1, m2) => {
      const math = (m1 || m2 || '').trim();
      const token = `__MATH_BLOCK_${counter++}__`;
      try {
        const html = katex.renderToString(math, { displayMode: true, throwOnError: false });
        mathTokens.push({ token, html: `<div class="katex-display-wrapper my-2 overflow-x-auto">${html}</div>` });
      } catch {
        mathTokens.push({ token, html: `<pre class="text-xs text-amber-500 font-mono">${math}</pre>` });
      }
      return token;
    });

    // Replace inline \( ... \)
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
      const token = `__MATH_INLINE_${counter++}__`;
      try {
        const html = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        mathTokens.push({ token, html });
      } catch {
        mathTokens.push({ token, html: `<span>${math}</span>` });
      }
      return token;
    });

    // Also support single $...$ if present and not followed by numbers
    text = text.replace(/(?<!\\)\$([^\$\n]+?)\$/g, (_, math) => {
      const token = `__MATH_INLINE_${counter++}__`;
      try {
        const html = katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
        mathTokens.push({ token, html });
      } catch {
        mathTokens.push({ token, html: `<span>${math}</span>` });
      }
      return token;
    });

    // Simple markdown formatting
    // Escape standard HTML tags
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-emerald-600 dark:text-emerald-400">$1</strong>');
    // Italic *text*
    html = html.replace(/\*([^\*]+)\*/g, '<em class="italic opacity-90">$1</em>');
    // Code `code`
    html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-emerald-700 dark:text-emerald-300 border border-zinc-200 dark:border-zinc-700">$1</code>');
    // Line breaks
    html = html.replace(/\n\n/g, '<br/><br/>').replace(/\n/g, '<br/>');

    // Restore KaTeX rendered math tokens
    mathTokens.forEach(({ token, html: mathHtml }) => {
      html = html.replace(token, mathHtml);
    });

    return html;
  }, [content]);

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
