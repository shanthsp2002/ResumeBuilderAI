import { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { enhanceWithAI } from '../../lib/ai';
import { useEnhanceOpts } from '../../lib/useEnhanceOpts';
import { ExperienceEntry } from '../../types/resume';

function BulletEditor({ entry }: { entry: ExperienceEntry }) {
  const setBullets = useResumeStore((s) => s.setExperienceBullets);
  const enhanceOpts = useEnhanceOpts();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rough, setRough] = useState('');

  const updateBullet = (index: number, value: string) => {
    const next = [...entry.bullets];
    next[index] = value;
    setBullets(entry.id, next);
  };
  const addBullet = () => setBullets(entry.id, [...entry.bullets, '']);
  const removeBullet = (index: number) =>
    setBullets(
      entry.id,
      entry.bullets.filter((_, i) => i !== index),
    );

  const enhance = async () => {
    const seed = rough.trim() || entry.bullets.filter((b) => b.trim()).join('\n');
    if (!seed) {
      setError('Add rough notes or an existing bullet to enhance.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await enhanceWithAI(
        {
          kind: 'bullets',
          notes: seed,
          context: { role: entry.role, company: entry.company },
        },
        enhanceOpts,
      );
      if (result.length) {
        setBullets(entry.id, result);
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
        <label className="label">Bullet points</label>
        <button className="btn-primary" onClick={enhance} disabled={busy}>
          {busy ? 'Enhancing…' : 'Enhance with AI'}
        </button>
      </div>
      <textarea
        className="field min-h-[72px]"
        placeholder="Rough notes: what you did, tech, outcomes, metrics. The AI will rewrite as STAR-method bullets."
        value={rough}
        onChange={(e) => setRough(e.target.value)}
      />
      <ul className="space-y-2">
        {entry.bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <textarea
              className="field min-h-[52px]"
              value={b}
              onChange={(e) => updateBullet(i, e.target.value)}
              placeholder="• Impact-driven bullet…"
            />
            <button
              className="btn-danger self-start"
              onClick={() => removeBullet(i)}
              aria-label="Remove bullet"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <button className="btn-ghost" onClick={addBullet}>
        + Add bullet
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function ExperienceForm() {
  const experience = useResumeStore((s) => s.resume.experience);
  const add = useResumeStore((s) => s.addExperience);
  const update = useResumeStore((s) => s.updateExperience);
  const remove = useResumeStore((s) => s.removeExperience);

  return (
    <div className="card space-y-4">
      <div className="section-title">
        <span>Experience</span>
        <button className="btn-ghost" onClick={add}>
          + Add role
        </button>
      </div>

      {experience.length === 0 && (
        <p className="text-sm text-gray-500">No roles yet. Click "Add role" to start.</p>
      )}

      {experience.map((entry) => (
        <div key={entry.id} className="space-y-3 rounded-md border border-gray-200 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Role</label>
              <input
                className="field"
                value={entry.role}
                onChange={(e) => update(entry.id, { role: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Company</label>
              <input
                className="field"
                value={entry.company}
                onChange={(e) => update(entry.id, { company: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                className="field"
                value={entry.location}
                onChange={(e) => update(entry.id, { location: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Start</label>
                <input
                  className="field"
                  value={entry.startDate}
                  onChange={(e) => update(entry.id, { startDate: e.target.value })}
                  placeholder="2022-03"
                />
              </div>
              <div>
                <label className="label">End</label>
                <input
                  className="field"
                  value={entry.endDate}
                  onChange={(e) => update(entry.id, { endDate: e.target.value })}
                  placeholder="2024-01"
                  disabled={entry.current}
                />
              </div>
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={entry.current}
              onChange={(e) => update(entry.id, { current: e.target.checked })}
            />
            Currently working here
          </label>

          <BulletEditor entry={entry} />

          <div className="text-right">
            <button className="btn-danger" onClick={() => remove(entry.id)}>
              Remove role
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
