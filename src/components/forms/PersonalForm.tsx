import { useState } from 'react';
import { useResumeStore } from '../../store/resumeStore';
import { enhanceWithAI } from '../../lib/ai';
import { useEnhanceOpts } from '../../lib/useEnhanceOpts';

export function PersonalForm() {
  const personal = useResumeStore((s) => s.resume.personal);
  const setPersonal = useResumeStore((s) => s.setPersonal);
  const enhanceOpts = useEnhanceOpts();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enhanceSummary = async () => {
    if (!personal.summary.trim()) {
      setError('Write a few rough sentences first, then click Enhance.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await enhanceWithAI(
        {
          kind: 'summary',
          notes: personal.summary,
          context: { targetRole: personal.title },
        },
        enhanceOpts,
      );
      if (result[0]) setPersonal('summary', result[0]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card space-y-3">
      <h2 className="section-title">Personal</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Full name</label>
          <input
            className="field"
            value={personal.fullName}
            onChange={(e) => setPersonal('fullName', e.target.value)}
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="label">Title</label>
          <input
            className="field"
            value={personal.title}
            onChange={(e) => setPersonal('title', e.target.value)}
            placeholder="Senior Software Engineer"
          />
        </div>
        <div>
          <label className="label">Email</label>
          <input
            className="field"
            type="email"
            value={personal.email}
            onChange={(e) => setPersonal('email', e.target.value)}
            placeholder="jane@example.com"
          />
        </div>
        <div>
          <label className="label">Phone</label>
          <input
            className="field"
            value={personal.phone}
            onChange={(e) => setPersonal('phone', e.target.value)}
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <label className="label">Location</label>
          <input
            className="field"
            value={personal.location}
            onChange={(e) => setPersonal('location', e.target.value)}
            placeholder="San Francisco, CA"
          />
        </div>
        <div>
          <label className="label">Website</label>
          <input
            className="field"
            value={personal.website}
            onChange={(e) => setPersonal('website', e.target.value)}
            placeholder="janedoe.dev"
          />
        </div>
        <div>
          <label className="label">LinkedIn</label>
          <input
            className="field"
            value={personal.linkedin}
            onChange={(e) => setPersonal('linkedin', e.target.value)}
            placeholder="linkedin.com/in/jane"
          />
        </div>
        <div>
          <label className="label">GitHub</label>
          <input
            className="field"
            value={personal.github}
            onChange={(e) => setPersonal('github', e.target.value)}
            placeholder="github.com/jane"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="label">Professional summary</label>
          <button className="btn-primary" onClick={enhanceSummary} disabled={busy}>
            {busy ? 'Enhancing…' : 'Enhance with AI'}
          </button>
        </div>
        <textarea
          className="field min-h-[120px]"
          value={personal.summary}
          onChange={(e) => setPersonal('summary', e.target.value)}
          placeholder="Rough notes about your background. The AI will tighten this up."
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
