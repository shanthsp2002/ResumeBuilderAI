/**
 * Cloudflare Worker edge proxy for the AI enhance endpoint.
 *
 * Multi-provider. Resolution order for the active provider:
 *   1. `provider` field on the request body (client override) — must be one of the allowed values
 *   2. `env.PROVIDER` (deploy-time default)
 *   3. Auto-detect from whichever credential / binding is present:
 *        Workers AI binding > Ollama URL > Groq > OpenAI > Anthropic > Gemini
 *
 * Configure with `wrangler secret put` (and bindings in wrangler.toml):
 *   - Workers AI:   binding `AI` declared in wrangler.toml — no key needed
 *   - Ollama:       OLLAMA_URL  (e.g. https://ollama.example.com or a tunnel)
 *   - Groq:         GROQ_API_KEY
 *   - OpenAI:       OPENAI_API_KEY
 *   - Anthropic:    ANTHROPIC_API_KEY
 *   - Gemini:       GEMINI_API_KEY
 *
 * Optional vars:
 *   - PROVIDER   = workers-ai | ollama | groq | openai | anthropic | gemini
 *   - MODEL      = provider-specific model id (overrides defaults)
 *   - ALLOWED_ORIGIN = restrict CORS to your deployed origin
 */

export type Provider =
  | 'workers-ai'
  | 'ollama'
  | 'groq'
  | 'openai'
  | 'anthropic'
  | 'gemini';

interface WorkersAIBinding {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
}

export interface Env {
  AI?: WorkersAIBinding;
  PROVIDER?: Provider;
  MODEL?: string;
  OLLAMA_URL?: string;
  GROQ_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  ALLOWED_ORIGIN?: string;
}

type EnhanceKind = 'bullets' | 'summary';

interface EnhanceRequest {
  kind: EnhanceKind;
  notes: string;
  provider?: Provider;
  model?: string;
  context?: {
    role?: string;
    company?: string;
    targetRole?: string;
  };
}

const SYSTEM_BULLETS = `You are an expert resume writer. Convert the user's rough notes into 3-5 professional, action-oriented resume bullet points.
Rules:
- Start each bullet with a strong past-tense verb (except a current role which may use present tense).
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

const DEFAULT_MODELS: Record<Provider, string> = {
  'workers-ai': '@cf/meta/llama-3.1-8b-instruct',
  ollama: 'llama3.1:8b',
  groq: 'llama-3.1-8b-instant',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-haiku-4-5-20251001',
  gemini: 'gemini-1.5-flash',
};

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

function parseResult(content: string): string[] {
  let trimmed = content.trim();
  trimmed = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();

  // Some local models leak prose around the JSON. Try to extract the first JSON object.
  if (!trimmed.startsWith('{')) {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) trimmed = match[0];
  }

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
  return arr
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((s) => s.trim());
}

async function callWorkersAI(
  system: string,
  user: string,
  env: Env,
  model: string,
): Promise<string[]> {
  if (!env.AI) throw new Error('Workers AI binding `AI` not configured.');
  const out = (await env.AI.run(model, {
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  })) as { response?: string } | string;
  const text = typeof out === 'string' ? out : out.response ?? '';
  return parseResult(text);
}

async function callOllama(
  system: string,
  user: string,
  env: Env,
  model: string,
): Promise<string[]> {
  if (!env.OLLAMA_URL) throw new Error('OLLAMA_URL not configured.');
  const url = new URL('/api/chat', env.OLLAMA_URL).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      format: 'json',
      options: { temperature: 0.3 },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { message?: { content?: string } };
  return parseResult(data.message?.content ?? '');
}

async function callGroq(
  system: string,
  user: string,
  env: Env,
  model: string,
): Promise<string[]> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
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
  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return parseResult(data.choices?.[0]?.message?.content ?? '');
}

async function callOpenAI(
  system: string,
  user: string,
  env: Env,
  model: string,
): Promise<string[]> {
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
  return parseResult(data.choices?.[0]?.message?.content ?? '');
}

async function callAnthropic(
  system: string,
  user: string,
  env: Env,
  model: string,
): Promise<string[]> {
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
  const text = (data.content ?? [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('');
  return parseResult(text);
}

async function callGemini(
  system: string,
  user: string,
  env: Env,
  model: string,
): Promise<string[]> {
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

function isProvider(value: unknown): value is Provider {
  return (
    value === 'workers-ai' ||
    value === 'ollama' ||
    value === 'groq' ||
    value === 'openai' ||
    value === 'anthropic' ||
    value === 'gemini'
  );
}

function autoDetectProvider(env: Env): Provider | undefined {
  if (env.AI) return 'workers-ai';
  if (env.OLLAMA_URL) return 'ollama';
  if (env.GROQ_API_KEY) return 'groq';
  if (env.OPENAI_API_KEY) return 'openai';
  if (env.ANTHROPIC_API_KEY) return 'anthropic';
  if (env.GEMINI_API_KEY) return 'gemini';
  return undefined;
}

function providerAvailable(provider: Provider, env: Env): boolean {
  switch (provider) {
    case 'workers-ai':
      return !!env.AI;
    case 'ollama':
      return !!env.OLLAMA_URL;
    case 'groq':
      return !!env.GROQ_API_KEY;
    case 'openai':
      return !!env.OPENAI_API_KEY;
    case 'anthropic':
      return !!env.ANTHROPIC_API_KEY;
    case 'gemini':
      return !!env.GEMINI_API_KEY;
  }
}

async function dispatch(
  provider: Provider,
  system: string,
  user: string,
  env: Env,
  model: string,
): Promise<string[]> {
  switch (provider) {
    case 'workers-ai':
      return callWorkersAI(system, user, env, model);
    case 'ollama':
      return callOllama(system, user, env, model);
    case 'groq':
      return callGroq(system, user, env, model);
    case 'openai':
      return callOpenAI(system, user, env, model);
    case 'anthropic':
      return callAnthropic(system, user, env, model);
    case 'gemini':
      return callGemini(system, user, env, model);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors(env) });
    }
    const url = new URL(request.url);

    if (url.pathname === '/api/providers' && request.method === 'GET') {
      const all: Provider[] = ['workers-ai', 'ollama', 'groq', 'openai', 'anthropic', 'gemini'];
      const available = all.filter((p) => providerAvailable(p, env));
      return json(
        { available, default: env.PROVIDER ?? autoDetectProvider(env) ?? null },
        200,
        env,
      );
    }

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

    const requested = isProvider(body.provider) ? body.provider : undefined;
    const provider = requested ?? env.PROVIDER ?? autoDetectProvider(env);

    if (!provider) {
      return json({ error: 'No AI provider configured on the server.' }, 500, env);
    }
    if (!providerAvailable(provider, env)) {
      return json({ error: `Provider "${provider}" is not configured on the server.` }, 400, env);
    }

    const model = (typeof body.model === 'string' && body.model.trim()) || env.MODEL || DEFAULT_MODELS[provider];
    const system = body.kind === 'bullets' ? SYSTEM_BULLETS : SYSTEM_SUMMARY;
    const user = buildUserPrompt(body);

    try {
      const result = await dispatch(provider, system, user, env, model);
      return json({ result, provider, model }, 200, env);
    } catch (e) {
      return json({ error: (e as Error).message, provider, model }, 502, env);
    }
  },
};
