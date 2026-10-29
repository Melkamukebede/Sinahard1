// Cloudflare Pages Function for POST /api/gemini/agent-pipeline-step
// Executes individual agent nodes in the LangGraph multi-agent pipeline

interface Env {
  GEMINI_API_KEY?: string;
  VITE_GEMINI_API_KEY?: string;
  [key: string]: any;
}

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-gemini-api-key',
    'Content-Type': 'application/json',
  };

  try {
    const clientKeyHeader = context.request.headers.get('x-gemini-api-key') || '';
    const apiKey =
      context.env.GEMINI_API_KEY ||
      context.env.VITE_GEMINI_API_KEY ||
      clientKeyHeader.trim();

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          status: 'error',
          code: 'NO_API_KEY',
          message: 'Gemini API key is required.',
        }),
        { status: 401, headers: corsHeaders }
      );
    }

    const body = (await context.request.json().catch(() => ({}))) as {
      systemPrompt?: string;
      userPrompt?: string;
    };

    const systemPrompt = body.systemPrompt || '';
    const userPrompt = body.userPrompt || '';

    const candidateModels = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash'];
    let geminiRes: Response | null = null;
    let lastErrText = '';

    for (const model of candidateModels) {
      try {
        const attempt = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `${systemPrompt}\n\nTask:\n${userPrompt}\n\nReturn strictly valid JSON with no markdown backticks.`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
              },
            }),
          }
        );

        if (attempt.ok) {
          geminiRes = attempt;
          break;
        } else {
          lastErrText = await attempt.text();
        }
      } catch (e: any) {
        lastErrText = e?.message || 'Network error';
      }
    }

    if (!geminiRes) {
      return new Response(
        JSON.stringify({
          status: 'error',
          message: `Gemini API call failed: ${lastErrText}`,
        }),
        { status: 502, headers: corsHeaders }
      );
    }

    const data = (await geminiRes.json()) as any;
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return new Response(JSON.stringify({ status: 'success', result: parsed }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown Edge Function error';
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
      'Access-Control-Allow-Headers': 'Content-Type, x-gemini-api-key',
    },
  });
};
