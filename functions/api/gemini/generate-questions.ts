// Cloudflare Pages Function for POST /api/gemini/generate-questions
// Automatically deployed on Cloudflare Pages when the repository has a /functions directory

interface Env {
  GEMINI_API_KEY?: string;
  [key: string]: any;
}

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  try {
    const clientKeyHeader = context.request.headers.get('x-gemini-api-key') || '';
    const apiKey =
      context.env.GEMINI_API_KEY ||
      context.env.VITE_GEMINI_API_KEY ||
      clientKeyHeader.trim() ||
      (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          status: 'needs_key',
          code: 'NO_API_KEY',
          message:
            'GEMINI_API_KEY is not configured in Cloudflare Pages environment variables. Please add it in Cloudflare Pages Settings > Environment variables or enter your key in the app.',
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    const payload = (await context.request.json().catch(() => ({}))) as any;
    const {
      subject = 'Physics',
      grade = '12',
      topic = 'Mechanics',
      totalQuestions = 10,
      difficulty = 'Medium',
      subjectType = 'calculation',
      timeLimit = 20,
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
   - Ensure the correct option letter (0 for A, 1 for B, 2 for C, 3 for D) is distributed evenly and randomly across questions. Do not bias toward any single letter.
6. REALISTIC DISTRACTORS:
   - Distractors must represent plausible student misconceptions (e.g. forgetting to square, inverted fractions, sign slip).`;

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

    // Try models in order: gemini-2.5-flash, gemini-2.0-flash, gemini-1.5-flash
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let geminiRes: Response | null = null;
    let lastError = '';

    for (const model of candidateModels) {
      try {
        const attempt = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'aistudio-build',
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (attempt.ok) {
          geminiRes = attempt;
          break;
        } else {
          lastError = await attempt.text().catch(() => '');
          console.warn(`Model ${model} failed (${attempt.status}):`, lastError);
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    }

    if (!geminiRes || !geminiRes.ok) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: `Gemini API returned error: ${lastError || 'All model endpoints failed'}`,
        }),
        { status: 502, headers: corsHeaders }
      );
    }

    const geminiData = (await geminiRes.json()) as any;
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      geminiData?.candidates?.[0]?.output ||
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

    return new Response(
      JSON.stringify({
        status: 'success',
        title: parsed.title || `${subject} Grade ${grade} Exam`,
        totalQuestions: sanitizedQuestions.length,
        questions: sanitizedQuestions,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown Cloudflare Edge Function error';
    return new Response(JSON.stringify({ status: 'error', message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
};

export const onRequestOptions = async (): Promise<Response> => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
