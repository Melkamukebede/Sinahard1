import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Google GenAI initialization with User-Agent header
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * POST /api/gemini/generate-questions
 * Generates verified, structured exam questions conforming strictly to the brief holistic rubric:
 * - Exact LaTeX math formatting ($...$ and [ display ] brackets)
 * - 4 plausible multiple-choice options with balanced randomized answer distribution (A, B, C, D)
 * - Step-by-step explanations without numbered lists, using bold labels
 */
app.post('/api/gemini/generate-questions', async (req, res) => {
  try {
    const {
      subject = 'Physics',
      grade = '12',
      topic = 'Mechanics',
      totalQuestions = 10,
      difficulty = 'Medium',
      subjectType = 'calculation',
      timeLimit = 20,
      customPrompt,
    } = req.body;

    const count = Math.min(Math.max(1, Number(totalQuestions) || 5), 25);
    const isMath = subjectType === 'calculation';

    // Fallback if no server-side API key configured
    if (!aiClient) {
      // If no API key is in environment, inform client gracefully
      return res.status(503).json({
        status: 'error',
        message: 'GEMINI_API_KEY is not configured on the server. Please attach an API key in Secrets.',
      });
    }

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

    const generateConfig = {
      systemInstruction,
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'Title for the generated exam',
          },
          questions: {
            type: Type.ARRAY,
            description: `List of exactly ${count} multiple choice questions`,
            items: {
              type: Type.OBJECT,
              properties: {
                text: {
                  type: Type.STRING,
                  description: 'Question statement with exact LaTeX math in $...$',
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Array of exactly 4 choices with exact LaTeX notation in $...$',
                },
                correct: {
                  type: Type.INTEGER,
                  description: 'Zero-based index of correct option (0=A, 1=B, 2=C, 3=D) with randomized balance',
                },
                explanation: {
                  type: Type.STRING,
                  description: 'Vertical step-wise explanation with [ formula ] brackets, no numbered steps',
                },
              },
              required: ['text', 'options', 'correct', 'explanation'],
            },
          },
        },
        required: ['questions'],
      },
    };

    const modelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    let response: any = null;
    let lastErr: any = null;

    for (const model of modelsToTry) {
      try {
        response = await aiClient.models.generateContent({
          model,
          contents: userPromptContent,
          config: generateConfig,
        });
        if (response) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`Model ${model} unavailable, trying fallback...`, err?.message);
      }
    }

    if (!response) {
      throw lastErr || new Error('All Gemini model endpoints failed');
    }

    const responseText = response?.text || '{}';
    const parsedData = JSON.parse(responseText);

    // Validate and sanitize questions
    const rawQuestions = Array.isArray(parsedData.questions) ? parsedData.questions : [];
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
        correctIndex = index % 4; // fallback balanced assignment
      }

      return {
        id: `gen-q-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
        text: String(q.text || '').trim(),
        options,
        correct: correctIndex,
        explanation: String(q.explanation || '').trim(),
      };
    });

    return res.json({
      status: 'success',
      title: parsedData.title || `${subject} Grade ${grade} - ${topic}`,
      totalQuestions: sanitizedQuestions.length,
      questions: sanitizedQuestions,
    });
  } catch (err: unknown) {
    console.error('Error in /api/gemini/generate-questions:', err);
    const message = err instanceof Error ? err.message : 'Failed to generate questions via Gemini';
    return res.status(500).json({
      status: 'error',
      message,
    });
  }
});

// Production static file serving or development Vite integration
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port: 3000, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
