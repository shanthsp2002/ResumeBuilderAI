import { useRef, useState } from 'react';
import { useResumeStore } from '../store/resumeStore';
import { templates } from '../templates';
import { TemplateId } from '../types/resume';
import { AISettings } from './AISettings';
import { providers } from '../lib/ai';

const accentPresets = ['#2563eb', '#0f766e', '#9333ea', '#dc2626', '#ea580c', '#111827'];

export function Toolbar() {
  const resume = useResumeStore((s) => s.resume);
  const ai = useResumeStore((s) => s.ai);
  const setTemplate = useResumeStore((s) => s.setTemplate);
  const setAccent = useResumeStore((s) => s.setAccentColor);
  const loadSample = useResumeStore((s) => s.loadSample);
  const reset = useResumeStore((s) => s.reset);
  const importJSON = useResumeStore((s) => s.importJSON);
  const fileRef = useRef<HTMLInputElement>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const activeProvider = providers.find((p) => p.id === ai.provider);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(resume, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerImport = () => fileRef.current?.click();
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      importJSON(data);
    } catch {
      alert('Could not parse that file as resume JSON.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-accent text-center font-bold leading-8 text-white">R</div>
        <div>
          <div className="text-sm font-semibold text-ink">Resume Builder AI</div>
          <div className="text-xs text-gray-500">Stateless • no account • your data stays in your browser</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Template
          <select
            className="field !py-1.5 !text-sm"
            value={resume.template}
            onChange={(e) => setTemplate(e.target.value as TemplateId)}
          >
            {Object.entries(templates).map(([id, t]) => (
              <option key={id} value={id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
          {accentPresets.map((c) => (
            <button
              key={c}
              onClick={() => setAccent(c)}
              aria-label={`Accent ${c}`}
              className={`h-5 w-5 rounded-full ring-offset-2 transition ${
                resume.accentColor === c ? 'ring-2 ring-ink' : 'ring-1 ring-gray-200'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="flex gap-1">
          <button className="btn-ghost" onClick={() => setAiOpen(true)} title={activeProvider?.description}>
            AI: {activeProvider?.label ?? 'Auto'}
          </button>
          <button className="btn-ghost" onClick={loadSample}>
            Load sample
          </button>
          <button className="btn-ghost" onClick={exportJSON}>
            Export JSON
          </button>
          <button className="btn-ghost" onClick={triggerImport}>
            Import JSON
          </button>
          <button
            className="btn-danger"
            onClick={() => {
              if (confirm('Clear everything? This cannot be undone.')) reset();
            }}
          >
            Clear
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      </div>
      {aiOpen && <AISettings onClose={() => setAiOpen(false)} />}
    </header>
  );
}
