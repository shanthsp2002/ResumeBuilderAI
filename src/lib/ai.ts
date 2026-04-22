export type EnhanceKind = 'bullets' | 'summary';

export type ProviderId =
  | 'auto'
  | 'workers-ai'
  | 'ollama'
  | 'groq'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'ollama-local';

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  description: string;
  /** True when the client talks directly to a local model and bypasses the worker. */
  clientDirect?: boolean;
}

export const providers: ProviderInfo[] = [
  {
    id: 'auto',
    label: 'Auto (server default)',
    description: 'Use whichever provider the worker has configured.',
  },
  {
    id: 'workers-ai',
    label: 'Cloudflare Workers AI',
    description: 'Open models on the edge. Free tier — recommended default.',
  },
  {
    id: 'groq',
    label: 'Groq (Llama)',
    description: 'Fast Llama inference. Generous free tier.',
  },
  {
    id: 'ollama',
    label: 'Ollama (server)',
    description: 'Self-hosted Ollama proxied through the worker.',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'gpt-4o-mini quality, paid.',
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    description: 'Claude Hauku, paid.',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    description: 'Google AI Studio, free tier available.',
  },
  {
    id: 'ollama-local',
    label: 'Ollama on my machine (local)',
    description: 'Browser talks directly to http://localhost:11434. 100% free, requires Ollama installed.',
    clientDirect: true,
  },
];

export interface EnhanceRequest {
  kind: EnhanceKind;
  notes: string;
  provider?: ProviderId;
  model?: string;
  context?: {
    role?: string;
    company?: string;
    targetRole?: string;
  };
}

interface EnhanceServerResponse {
  result?: string[];
  error?: string;
  provider?: string;
  model?: string;
}

const ENDPOINT = (import.meta.env.VITE_AI_ENDPOINT as string | undefined) ?? '/api/enhance';

const SYSTEM_BULLETS = `You are an expert resume writer. Convert the user's rough notes into 3-5 professional, action-oriented resume bullet points.
Rules:
- Start each bullet with a strong past-tense verb (except a current role which may use present tense).
- Include concrete metrics wherever possible (%, $, time saved, scale, headcount).
- Apply the STAR method implicitly: Situation, Task, Action, Result.
- Keep each bullet to a single sentence, at most 30 words.
- Do not fabricate numbers that were not implied by the notes.
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

function buildUserPrompt(req: EnhanceRequest): string {
  const ctx: string[] = [];
  if (req.context?.role) ctx.push(`Role: ${req.context.role}`);
  if (req.context?.company) ctx.push(`Company: ${req.context.company}`);
  if (req.context?.targetRole) ctx.push(`Target role: ${req.context.targetRole}`);
  const header = ctx.length ? `${ctx.join(' | ')}\n\n` : '';
  return `${header}Notes:\n${req.notes}`;
}

function parseResult(content: string): string[] {
  let trimmed = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/i, '').trim();
  if (!trimmed.startsWith('{')) {
    const m = trimmed.match(/\{[\s\S]*\}/);
    if (m) trimmed = m[0];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error('Model returned non-JSON content.');
  }
  const arr = (parsed as { result?: unknown }).result;
  if (!Array.isArray(arr)) throw new Error('Model JSON missing `result` array.');
  return arr.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((s) => s.trim());
}

interface LocalOllamaSettings {
  url: string;
  model: string;
}

async function callLocalOllama(
  req: EnhanceRequest,
  settings: LocalOllamaSettings,
): Promise<string[]> {
  const url = new URL('/api/chat', settings.url).toString();
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.model,
        stream: false,
        format: 'json',
        options: { temperature: 0.3 },
        messages: [
          { role: 'system', content: req.kind === 'bullets' ? SYSTEM_BULLETS : SYSTEM_SUMMARY },
          { role: 'user', content: buildUserPrompt(req) },
        ],
      }),
    });
  } catch (e) {
    throw new Error(
      `Could not reach local Ollama at ${settings.url}. ` +
        `Is Ollama running? You may need to start it with: OLLAMA_ORIGINS='*' ollama serve. (${(e as Error).message})`,
    );
  }
  if (!res.ok) {
    throw new Error(`Local Ollama error ${res.status}: ${await res.text().catch(() => res.statusText)}`);
  }
  const data = (await res.json()) as { message?: { content?: string } };
  return parseResult(data.message?.content ?? '');
}

export interface EnhanceOptions {
  provider: ProviderId;
  model?: string;
  localOllama?: LocalOllamaSettings;
}

export async function enhanceWithAI(
  req: Omit<EnhanceRequest, 'provider' | 'model'>,
  opts: EnhanceOptions,
): Promise<string[]> {
  if (opts.provider === 'ollama-local') {
    if (!opts.localOllama?.url || !opts.localOllama.model) {
      throw new Error('Local Ollama URL and model must be set in Settings.');
    }
    return callLocalOllama({ ...req }, opts.localOllama);
  }

  const body: EnhanceRequest = {
    ...req,
    provider: opts.provider === 'auto' ? undefined : opts.provider,
    model: opts.model?.trim() || undefined,
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data: EnhanceServerResponse;
  try {
    data = JSON.parse(text) as EnhanceServerResponse;
  } catch {
    throw new Error(`AI request failed (${res.status}): ${text || res.statusText}`);
  }
  if (!res.ok) {
    throw new Error(data.error ?? `AI request failed (${res.status})`);
  }
  if (!Array.isArray(data.result)) {
    throw new Error('AI response missing `result` array.');
  }
  return data.result.filter((s) => typeof s === 'string' && s.trim().length > 0);
}

export interface ServerProvidersInfo {
  available: string[];
  default: string | null;
}

export async function fetchServerProviders(): Promise<ServerProvidersInfo | null> {
  const url = ENDPOINT.replace(/\/enhance$/, '/providers');
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as ServerProvidersInfo;
  } catch {
    return null;
  }
}
