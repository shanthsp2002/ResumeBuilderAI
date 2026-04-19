import { useResumeStore } from '../../store/resumeStore';

export function EducationForm() {
  const education = useResumeStore((s) => s.resume.education);
  const add = useResumeStore((s) => s.addEducation);
  const update = useResumeStore((s) => s.updateEducation);
  const remove = useResumeStore((s) => s.removeEducation);

  return (
    <div className="card space-y-4">
      <div className="section-title">
        <span>Education</span>
        <button className="btn-ghost" onClick={add}>
          + Add school
        </button>
      </div>
      {education.length === 0 && (
        <p className="text-sm text-gray-500">No education entries yet.</p>
      )}
      {education.map((e) => (
        <div key={e.id} className="space-y-3 rounded-md border border-gray-200 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label">School</label>
              <input
                className="field"
                value={e.school}
                onChange={(ev) => update(e.id, { school: ev.target.value })}
              />
            </div>
            <div>
              <label className="label">Degree</label>
              <input
                className="field"
                value={e.degree}
                onChange={(ev) => update(e.id, { degree: ev.target.value })}
                placeholder="B.S."
              />
            </div>
            <div>
              <label className="label">Field of study</label>
              <input
                className="field"
                value={e.field}
                onChange={(ev) => update(e.id, { field: ev.target.value })}
                placeholder="Computer Science"
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                className="field"
                value={e.location}
                onChange={(ev) => update(e.id, { location: ev.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Start</label>
                <input
                  className="field"
                  value={e.startDate}
                  onChange={(ev) => update(e.id, { startDate: ev.target.value })}
                  placeholder="2015-08"
                />
              </div>
              <div>
                <label className="label">End</label>
                <input
                  className="field"
                  value={e.endDate}
                  onChange={(ev) => update(e.id, { endDate: ev.target.value })}
                  placeholder="2019-05"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Details</label>
              <input
                className="field"
                value={e.details}
                onChange={(ev) => update(e.id, { details: ev.target.value })}
                placeholder="GPA, honors, activities"
              />
            </div>
          </div>
          <div className="text-right">
            <button className="btn-danger" onClick={() => remove(e.id)}>
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
