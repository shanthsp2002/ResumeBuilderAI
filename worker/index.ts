/**
 * Cloudflare Worker edge proxy for the AI enhance endpoint.
 *
 * Why this exists: the client must never see the provider API key. The worker
 * adds the key, enforces a strict system prompt, and validates the response
 * shape before returning it to the client.
 *
 * Configure one of these secrets via `wrangler secret put`:
 *   - OPENAI_API_KEY       (default provider)
 *   - ANTHROPIC_API_KEY    (set PROVIDER=anthropic)
 *   - GEMINI_API_KEY       (set PROVIDER=gemini)
 */

export interface Env {
  PROVIDER?: 'openai' | 'anthropic' | 'gemini';
  MODEL?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  ALLOWED_ORIGIN?: string;
}

type EnhanceKind = 'bullets' | 'summary';

interface EnhanceRequest {
  kind: EnhanceKind;
  notes: string;
  context?: {
    role?: string;
    company?: string;
    targetRole?: string;
  };
}

const SYSTEM_BULLETS = `You are an expert resume writer. Convert the user's rough notes into 3-5 professional, action-oriented resume bullet points.
Rules:
- Start each bullet with a strong past-tense verb (except current role which may use present tense).
- Include concrete metrics wherever possible (%, $, time saved, scale, headcount).
- Apply the STAR method implicitly: Situation, Task, Action, Result.
- Keep each bullet to a single sentence, at most 30 words.
- Do not fabricate numbers that were not implied by the notes. If a metric was not mentioned, use qualitative impact instead.
- Do not include the company or role name inside the bullet.
Return ONLY a JSON object of the exact form: {"result": ["bullet 1", "bullet 2", ...]} — no commentary, no markdown fences.`;

const SYSTEM_SUMMARY = `You are an expert resume writer. Rewrite the user's rough notes into a single professional summary paragraph (3-4 sentences) suitable for the top of a resume.
Rules:
- Lead with years of experience and core domain.
- Highlight 2-3 differentiators (skills, outcomes, or scale).
- End with a forward-looking value statement.
- Do not use first-person pronouns.
- Do not fabricate specifics that were not implied by the notes.
Return ONLY a JSON object of the exact form: {"result": ["<summary paragraph>"]} — a single-element array, no commentary, no markdown fences.`;

const MAX_NOTES = 4000;

function cors(env: Env): Record<string, string> {
  const origin = env.ALLOWED_ORIGIN ?? '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, env: Env): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(env) },
  });
}

function buildUserPrompt(req: EnhanceRequest): string {
  const ctx: string[] = [];
  if (req.context?.role) ctx.push(`Role: ${req.context.role}`);
  if (req.context?.company) ctx.push(`Company: ${req.context.company}`);
  if (req.context?.targetRole) ctx.push(`Target role: ${req.context.targetRole}`);
  const header = ctx.length ? `${ctx.join(' | ')}\n\n` : '';
  return `${header}Notes:\n${req.notes}`;
}

async function callOpenAI(
  system: string,
  user: string,
  env: Env,
): Promise<string[]> {
  const model = env.MODEL ?? 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? '';
  return parseResult(content);
}

async function callAnthropic(
  system: string,
  user: string,
  env: Env,
): Promise<string[]> {
  const model = env.MODEL ?? 'claude-haiku-4-5-20251001';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      temperature: 0.3,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = (data.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('');
  return parseResult(text);
}

async function callGemini(
  system: string,
  user: string,
  env: Env,
): Promise<string[]> {
  const model = env.MODEL ?? 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
    }),
  });
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  return parseResult(text);
}

function parseResult(content: string): string[] {
  const trimmed = content.trim().replace(/^```(?:json)?|```$/g, '').trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error('Model returned non-JSON content.');
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { result?: unknown }).result)) {
    throw new Error('Model JSON missing `result` array.');
  }
  const arr = (parsed as { result: unknown[] }).result;
  return arr.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((s) => s.trim());
}

function resolveProvider(env: Env): Env['PROVIDER'] {
  if (env.PROVIDER) return env.PROVIDER;
  if (env.OPENAI_API_KEY) return 'openai';
  if (env.ANTHROPIC_API_KEY) return 'anthropic';
  if (env.GEMINI_API_KEY) return 'gemini';
  return undefined;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(env) });
    }
    const url = new URL(request.url);
    if (url.pathname !== '/api/enhance' || request.method !== 'POST') {
      return json({ error: 'Not found' }, 404, env);
    }

    let body: EnhanceRequest;
    try {
      body = (await request.json()) as EnhanceRequest;
    } catch {
      return json({ error: 'Invalid JSON' }, 400, env);
    }

    if (!body || (body.kind !== 'bullets' && body.kind !== 'summary')) {
      return json({ error: '`kind` must be "bullets" or "summary"' }, 400, env);
    }
    if (typeof body.notes !== 'string' || body.notes.trim().length === 0) {
      return json({ error: '`notes` is required' }, 400, env);
    }
    if (body.notes.length > MAX_NOTES) {
      return json({ error: `notes too long (max ${MAX_NOTES} chars)` }, 413, env);
    }

    const provider = resolveProvider(env);
    if (!provider) return json({ error: 'AI provider not configured' }, 500, env);

    const system = body.kind === 'bullets' ? SYSTEM_BULLETS : SYSTEM_SUMMARY;
    const user = buildUserPrompt(body);

    try {
      let result: string[];
      switch (provider) {
        case 'anthropic':
          result = await callAnthropic(system, user, env);
          break;
        case 'gemini':
          result = await callGemini(system, user, env);
          break;
        case 'openai':
        default:
          result = await callOpenAI(system, user, env);
          break;
      }
      return json({ result }, 200, env);
    } catch (e) {
      return json({ error: (e as Error).message }, 502, env);
    }
  },
};
