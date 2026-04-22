import { useEffect, useState } from 'react';
import { useResumeStore } from '../store/resumeStore';
import { providers, ProviderId, fetchServerProviders, ServerProvidersInfo } from '../lib/ai';

export function AISettings({ onClose }: { onClose: () => void }) {
  const ai = useResumeStore((s) => s.ai);
  const setAI = useResumeStore((s) => s.setAISettings);
  const [serverInfo, setServerInfo] = useState<ServerProvidersInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchServerProviders().then((info) => {
      if (!cancelled) {
        setServerInfo(info);
        setLoadingInfo(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isLocal = ai.provider === 'ollama-local';
  const serverDefault = serverInfo?.default ? ` (server default: ${serverInfo.default})` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">AI Settings</h2>
            <p className="text-xs text-gray-500">
              Choose which model powers the "Enhance with AI" buttons. Stored only in this browser.
            </p>
          </div>
          <button className="btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label className="label">Provider</label>
            <select
              className="field"
              value={ai.provider}
              onChange={(e) => setAI({ provider: e.target.value as ProviderId })}
            >
              {providers.map((p) => {
                const available = !p.clientDirect && serverInfo
                  ? p.id === 'auto' || serverInfo.available.includes(p.id)
                  : true;
                return (
                  <option key={p.id} value={p.id}>
                    {p.label}
                    {!available ? ' — not configured on server' : ''}
                  </option>
                );
              })}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {providers.find((p) => p.id === ai.provider)?.description}
              {!isLocal && !loadingInfo ? serverDefault : ''}
            </p>
          </div>

          {!isLocal && (
            <div>
              <label className="label">Model override (optional)</label>
              <input
                className="field"
                value={ai.model}
                onChange={(e) => setAI({ model: e.target.value })}
                placeholder="e.g. @cf/meta/llama-3.1-8b-instruct or llama-3.1-70b-versatile"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave blank to use the worker's default model for the selected provider.
              </p>
            </div>
          )}

          {isLocal && (
            <div className="space-y-3 rounded-md border border-amber-200 bg-amber-50 p-3">
              <div>
                <label className="label">Local Ollama URL</label>
                <input
                  className="field"
                  value={ai.localOllamaUrl}
                  onChange={(e) => setAI({ localOllamaUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                />
              </div>
              <div>
                <label className="label">Local model</label>
                <input
                  className="field"
                  value={ai.localOllamaModel}
                  onChange={(e) => setAI({ localOllamaModel: e.target.value })}
                  placeholder="llama3.1:8b"
                />
              </div>
              <div className="space-y-1 text-xs text-amber-900">
                <p className="font-semibold">Local Ollama setup</p>
                <ol className="ml-4 list-decimal space-y-1">
                  <li>
                    Install Ollama from <span className="font-mono">ollama.com</span> and run{' '}
                    <span className="font-mono">ollama pull {ai.localOllamaModel || 'llama3.1:8b'}</span>.
                  </li>
                  <li>
                    Start with CORS enabled so the browser can reach it:{' '}
                    <span className="font-mono">OLLAMA_ORIGINS='*' ollama serve</span>
                  </li>
                  <li>
                    Modern browsers block <span className="font-mono">http://</span> calls from{' '}
                    <span className="font-mono">https://</span> pages. Either run this app over{' '}
                    <span className="font-mono">http://localhost</span> or set up an https tunnel to your Ollama.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {!loadingInfo && serverInfo && (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              <div className="font-semibold text-gray-700">Server providers detected</div>
              <div>
                {serverInfo.available.length === 0
                  ? 'None — only "Ollama on my machine" will work until the worker is configured.'
                  : serverInfo.available.join(', ')}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
