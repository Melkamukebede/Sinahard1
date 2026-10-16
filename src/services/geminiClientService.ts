/**
 * Gemini Client Service
 * 
 * Provides unified, fault-tolerant question generation across:
 * 1. AI Studio dev server / full-stack Express (server.ts)
 * 2. Cloudflare Pages Functions (/functions/api/gemini/generate-questions)
 * 3. Static host fallback (Cloudflare static, GitHub Pages, Netlify static)
 * 
 * Protects against "Unexpected end of JSON input" by safely inspecting HTTP status
 * and Content-Type before parsing, with automated client fallback.
 */

import { Question } from '../types';

export interface GenerateQuestionsPayload {
  subject: string;
  grade: string;
  topic: string;
  totalQuestions: number;
  difficulty: string;
  subjectType: 'calculation' | 'theory';
  timeLimit: number;
  customPrompt?: string;
}

export interface GenerateQuestionsResult {
  status: 'success' | 'error' | 'needs_key';
  title?: string;
  totalQuestions?: number;
  questions?: Question[];
  message?: string;
}

const STORAGE_KEY_GEMINI = 'sinahard_gemini_api_key';

export function getUserGeminiApiKey(): string {
  try {
    return (
      localStorage.getItem(STORAGE_KEY_GEMINI) ||
      (import.meta.env.VITE_GEMINI_API_KEY as string) ||
      ''
    );
  } catch {
    return '';
  }
}

export function saveUserGeminiApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY_GEMINI, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_GEMINI);
    }
  } catch {
    // ignore
  }
}

export function clearUserGeminiApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_GEMINI);
  } catch {
    // ignore
  }
}

export function hasUserGeminiApiKey(): boolean {
  return !!getUserGeminiApiKey();
}

/**
 * Direct client-side Gemini generation fallback (used when server/edge function is absent)
 */
async function generateQuestionsDirectClient(
  payload: GenerateQuestionsPayload,
  apiKey: string
): Promise<GenerateQuestionsResult> {
  const {
    subject,
    grade,
    topic,
    totalQuestions,
    difficulty,
    subjectType,
    timeLimit,
    customPrompt,
  } = payload;

  const count = Math.min(Math.max(1, Number(totalQuestions) || 5), 25);
  const isMath = subjectType === 'calculation';

  const systemInstruction = `You are a premier curriculum professor and exam author creating high-stakes examinations for Grade ${grade} students in ${subject}.

MANDATORY RULES FOR EXACT LATEX & FORMATTING:
1. DELIMIT EVERY MATHEMATICAL QUANTITY & UNIT:
   - In problem statements, wrap ALL variables, formulas, and quantities with units in $...$ (e.g. $m = 1200\\text{ kg}$, $v = 24\\text{ m/s}$, $t = 8\\text{ s}$, $F = 3600\\text{ N}$).
   - NEVER output raw unescaped units or bare symbols.
2. EXACT LATEX IN ALL 4 OPTIONS:
   - Every single option (A, B, C, D) that contains a number, unit, variable, or fraction MUST be enclosed in $...$ (e.g. $2400\\text{ N}$, $\\frac{3}{4}\\text{ m/s}$, $\\sqrt{2}$).
   - NEVER use plain ASCII math like '3/4' or 'sqrt(5)'. Always use \\frac{3}{4} and \\sqrt{5}.
3. STRICTLY NO NUMBERED LISTS IN EXPLANATIONS:
   - Do NOT write "1. Formula", "2. Calculation", or "Step 1", "Step 2".
   - Structure explanations vertically using bold thematic labels:
     **Formula:**
     [ a = \\frac{v - u}{t} ]
     
     **Calculation:**
     [ a = \\frac{24 - 0}{8} = 3\\text{ m/s}^2 ]
     
     [ F = 1200 \\times 3 = 3600\\text{ N} ]
     
     **Answer:** $3600\\text{ N}$ (Option B)
4. FORMULA BRACKET ISOLATION:
   - Wrap all display equations on their own dedicated lines in brackets: [ equation ].
   - Retain all LaTeX backslashes: \\frac, \\sqrt, \\times, \\cdot, \\pm, \\Delta, \\theta, \\pi, \\Omega.
5. BALANCED RANDOM ANSWER DISTRIBUTION:
   - Ensure the correct option letter (0 for A, 1 for B, 2 for C, 3 for D) is distributed evenly across questions.
6. REALISTIC DISTRACTORS:
   - Distractors must represent plausible student misconceptions.`;

  const userPromptContent = customPrompt
    ? `${customPrompt}\n\nGenerate exactly ${count} multiple-choice questions matching these specifications for Topic: ${topic}.`
    : `Create exactly ${count} multiple choice questions for:
Grade: ${grade}
Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}
Time Limit: ${timeLimit} minutes
Subject Type: ${isMath ? 'Mathematical / Calculation-based' : 'Conceptual / Theoretical'}`;

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPromptContent }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          questions: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                text: { type: 'STRING' },
                options: {
                  type: 'ARRAY',
                  items: { type: 'STRING' },
                },
                correct: { type: 'INTEGER' },
                explanation: { type: 'STRING' },
              },
              required: ['text', 'options', 'correct', 'explanation'],
            },
          },
        },
        required: ['questions'],
      },
    },
  };

  try {
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let res: Response | null = null;
    let lastErrText = '';

    for (const model of candidateModels) {
      try {
        const attempt = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          }
        );

        if (attempt.ok) {
          res = attempt;
          break;
        } else {
          lastErrText = await attempt.text().catch(() => '');
          console.warn(`Direct model ${model} failed (${attempt.status}):`, lastErrText);
        }
      } catch (err: unknown) {
        lastErrText = err instanceof Error ? err.message : String(err);
      }
    }

    if (!res || !res.ok) {
      return {
        status: 'error',
        message: `Gemini API returned error: ${lastErrText || 'All Gemini model endpoints failed'}`,
      };
    }

    const data = await res.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      data?.candidates?.[0]?.output ||
      '{}';

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { questions: [] };
    }

    const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
    const sanitizedQuestions = rawQuestions.map((q: any, index: number) => {
      let options = Array.isArray(q.options) ? q.options.map((opt: any) => String(opt || '').trim()) : [];
      while (options.length < 4) {
        options.push(`Option ${String.fromCharCode(65 + options.length)}`);
      }
      if (options.length > 4) {
        options = options.slice(0, 4);
      }

      let correctIndex = Number(q.correct);
      if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
        correctIndex = index % 4;
      }

      return {
        id: `gen-q-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        text: String(q.text || '').trim(),
        options,
        correct: correctIndex,
        explanation: String(q.explanation || '').trim(),
      };
    });

    return {
      status: 'success',
      title: parsed.title || `${subject} Grade ${grade} Exam`,
      totalQuestions: sanitizedQuestions.length,
      questions: sanitizedQuestions,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Client generation error';
    return {
      status: 'error',
      message: msg,
    };
  }
}

/**
 * Primary generation function called by the UI.
 * Tries the backend/Cloudflare endpoint first.
 * Safely guards against non-JSON responses and handles fallback automatically.
 */
export async function generateExamQuestions(
  payload: GenerateQuestionsPayload
): Promise<GenerateQuestionsResult> {
  const clientKey = getUserGeminiApiKey();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (clientKey) {
      headers['x-gemini-api-key'] = clientKey;
    }

    const res = await fetch('/api/gemini/generate-questions', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // If server responded with valid JSON
    if (isJson) {
      const text = await res.text();
      if (!text.trim()) {
        throw new Error('Empty response body received from server.');
      }

      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server returned malformed JSON.');
      }

      if (res.ok && data.status === 'success' && Array.isArray(data.questions)) {
        return {
          status: 'success',
          title: data.title,
          totalQuestions: data.totalQuestions,
          questions: data.questions,
        };
      }

      // If server returned a needs_key or NO_API_KEY error payload
      if (
        data.status === 'needs_key' ||
        data.code === 'NO_API_KEY' ||
        data.message?.includes('GEMINI_API_KEY')
      ) {
        if (clientKey) {
          return generateQuestionsDirectClient(payload, clientKey);
        }
        return {
          status: 'needs_key',
          message:
            data.message ||
            'Gemini API key is not configured on the server. Please provide a key below or add it to Cloudflare Pages environment variables.',
        };
      }

      // If other server error but user has clientKey, try direct client fallback
      if (clientKey) {
        console.warn('Server generation failed with:', data.message, 'trying direct client fallback...');
        return generateQuestionsDirectClient(payload, clientKey);
      }

      return {
        status: 'error',
        message: data.message || `Server returned error (${res.status})`,
      };
    }

    // Endpoint returned non-JSON (e.g. 404 HTML on static Cloudflare Pages without functions)
    console.warn(
      `Endpoint /api/gemini/generate-questions returned non-JSON (${res.status} ${res.statusText}). Activating client-side fallback...`
    );

    if (clientKey) {
      return generateQuestionsDirectClient(payload, clientKey);
    }

    return {
      status: 'needs_key',
      message:
        'Cloudflare Pages static hosting detected (backend edge function did not respond). Enter your free Gemini API key below to generate questions directly in your browser, or click "Copy Prompt" for ChatGPT.',
    };
  } catch (netErr: unknown) {
    console.warn('Network error reaching server endpoint, attempting client fallback:', netErr);

    if (clientKey) {
      return generateQuestionsDirectClient(payload, clientKey);
    }

    const errorMsg = netErr instanceof Error ? netErr.message : 'Network request failed';
    return {
      status: 'needs_key',
      message: `${errorMsg}. Enter your free Gemini API key below to generate directly, or click "Copy Prompt".`,
    };
  }
}
