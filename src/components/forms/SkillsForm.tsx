import { useResumeStore } from '../../store/resumeStore';

export function SkillsForm() {
  const skills = useResumeStore((s) => s.resume.skills);
  const add = useResumeStore((s) => s.addSkillGroup);
  const update = useResumeStore((s) => s.updateSkillGroup);
  const remove = useResumeStore((s) => s.removeSkillGroup);

  return (
    <div className="card space-y-3">
      <div className="section-title">
        <span>Skills</span>
        <button className="btn-ghost" onClick={add}>
          + Add group
        </button>
      </div>
      {skills.length === 0 && (
        <p className="text-sm text-gray-500">
          Group skills by category, e.g. "Languages", "Infrastructure", "Practices".
        </p>
      )}
      {skills.map((g) => (
        <div key={g.id} className="grid grid-cols-[1fr_2fr_auto] items-end gap-2">
          <div>
            <label className="label">Category</label>
            <input
              className="field"
              value={g.category}
              onChange={(e) => update(g.id, { category: e.target.value })}
              placeholder="Languages"
            />
          </div>
          <div>
            <label className="label">Items (comma-separated)</label>
            <input
              className="field"
              value={g.items}
              onChange={(e) => update(g.id, { items: e.target.value })}
              placeholder="TypeScript, Go, Rust, Python"
            />
          </div>
          <button className="btn-danger" onClick={() => remove(g.id)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
