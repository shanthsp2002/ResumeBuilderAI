import { useResumeStore } from '../store/resumeStore';
import type { EnhanceOptions } from './ai';

export function useEnhanceOpts(): EnhanceOptions {
  const ai = useResumeStore((s) => s.ai);
  return {
    provider: ai.provider,
    model: ai.model,
    localOllama:
      ai.provider === 'ollama-local'
        ? { url: ai.localOllamaUrl, model: ai.localOllamaModel }
        : undefined,
  };
}
