import { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { enhanceWithAI } from '../../lib/ai';
import { useEnhanceOpts } from '../../lib/useEnhanceOpts';
import { ProjectEntry } from '../../types/resume';

function ProjectBullets({ entry }: { entry: ProjectEntry }) {
  const update = useResumeStore((s) => s.updateProject);
  const enhanceOpts = useEnhanceOpts();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rough, setRough] = useState('');

  const setBullets = (bullets: string[]) => update(entry.id, { bullets });

  const enhance = async () => {
    const seed = rough.trim() || entry.bullets.filter((b) => b.trim()).join('\n');
    if (!seed) {
      setError('Add rough notes first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await enhanceWithAI({ kind: 'bullets', notes: seed }, enhanceOpts);
      if (result.length) {
        setBullets(result);
        setRough('');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="label">Highlights</label>
        <button className="btn-primary" onClick={enhance} disabled={busy}>
          {busy ? 'Enhancing…' : 'Enhance with AI'}
        </button>
      </div>
      <textarea
        className="field min-h-[60px]"
        value={rough}
        onChange={(e) => setRough(e.target.value)}
        placeholder="Rough notes about the project. The AI will rewrite as impact bullets."
      />
      <ul className="space-y-2">
        {entry.bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <textarea
              className="field min-h-[48px]"
              value={b}
              onChange={(e) => {
                const next = [...entry.bullets];
                next[i] = e.target.value;
                setBullets(next);
              }}
            />
            <button
              className="btn-danger self-start"
              onClick={() => setBullets(entry.bullets.filter((_, j) => j !== i))}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <button className="btn-ghost" onClick={() => setBullets([...entry.bullets, ''])}>
        + Add highlight
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function ProjectsForm() {
  const projects = useResumeStore((s) => s.resume.projects);
  const add = useResumeStore((s) => s.addProject);
  const update = useResumeStore((s) => s.updateProject);
  const remove = useResumeStore((s) => s.removeProject);

  return (
    <div className="card space-y-4">
      <div className="section-title">
        <span>Projects</span>
        <button className="btn-ghost" onClick={add}>
          + Add project
        </button>
      </div>
      {projects.length === 0 && (
        <p className="text-sm text-gray-500">Optional. Add notable side projects or portfolio work.</p>
      )}
      {projects.map((p) => (
        <div key={p.id} className="space-y-3 rounded-md border border-gray-200 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Name</label>
              <input
                className="field"
                value={p.name}
                onChange={(e) => update(p.id, { name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Link</label>
              <input
                className="field"
                value={p.link}
                onChange={(e) => update(p.id, { link: e.target.value })}
                placeholder="github.com/you/project"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Short description</label>
              <input
                className="field"
                value={p.description}
                onChange={(e) => update(p.id, { description: e.target.value })}
              />
            </div>
          </div>
          <ProjectBullets entry={p} />
          <div className="text-right">
            <button className="btn-danger" onClick={() => remove(p.id)}>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
