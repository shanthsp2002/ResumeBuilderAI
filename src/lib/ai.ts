export type EnhanceKind = 'bullets' | 'summary';

export interface EnhanceRequest {
  kind: EnhanceKind;
  notes: string;
  context?: {
    role?: string;
    company?: string;
    targetRole?: string;
  };
}

export interface EnhanceResponse {
  result: string[];
}

const ENDPOINT =
  (import.meta.env.VITE_AI_ENDPOINT as string | undefined) ?? '/api/enhance';

export async function enhanceWithAI(req: EnhanceRequest): Promise<string[]> {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`AI request failed (${res.status}): ${text || res.statusText}`);
  }
  const data = (await res.json()) as EnhanceResponse;
  if (!Array.isArray(data.result)) {
    throw new Error('AI response missing `result` array.');
  }
  return data.result.filter((s) => typeof s === 'string' && s.trim().length > 0);
}
