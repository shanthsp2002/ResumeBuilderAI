import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Resume,
  ExperienceEntry,
  EducationEntry,
  ProjectEntry,
  SkillGroup,
  TemplateId,
  emptyResume,
  sampleResume,
} from '../types/resume';

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 10);

interface ResumeState {
  resume: Resume;
  setPersonal: <K extends keyof Resume['personal']>(key: K, value: Resume['personal'][K]) => void;
  setTemplate: (template: TemplateId) => void;
  setAccentColor: (color: string) => void;

  addExperience: () => void;
  updateExperience: (id: string, patch: Partial<ExperienceEntry>) => void;
  removeExperience: (id: string) => void;
  setExperienceBullets: (id: string, bullets: string[]) => void;

  addEducation: () => void;
  updateEducation: (id: string, patch: Partial<EducationEntry>) => void;
  removeEducation: (id: string) => void;

  addProject: () => void;
  updateProject: (id: string, patch: Partial<ProjectEntry>) => void;
  removeProject: (id: string) => void;

  addSkillGroup: () => void;
  updateSkillGroup: (id: string, patch: Partial<SkillGroup>) => void;
  removeSkillGroup: (id: string) => void;

  loadSample: () => void;
  reset: () => void;
  importJSON: (data: Resume) => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      resume: emptyResume(),

      setPersonal: (key, value) =>
        set((s) => ({ resume: { ...s.resume, personal: { ...s.resume.personal, [key]: value } } })),
      setTemplate: (template) => set((s) => ({ resume: { ...s.resume, template } })),
      setAccentColor: (accentColor) => set((s) => ({ resume: { ...s.resume, accentColor } })),

      addExperience: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            experience: [
              ...s.resume.experience,
              {
                id: uid(),
                company: '',
                role: '',
                location: '',
                startDate: '',
                endDate: '',
                current: false,
                bullets: [''],
              },
            ],
          },
        })),
      updateExperience: (id, patch) =>
        set((s) => ({
          resume: {
            ...s.resume,
            experience: s.resume.experience.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          },
        })),
      removeExperience: (id) =>
        set((s) => ({
          resume: { ...s.resume, experience: s.resume.experience.filter((e) => e.id !== id) },
        })),
      setExperienceBullets: (id, bullets) =>
        set((s) => ({
          resume: {
            ...s.resume,
            experience: s.resume.experience.map((e) => (e.id === id ? { ...e, bullets } : e)),
          },
        })),

      addEducation: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            education: [
              ...s.resume.education,
              {
                id: uid(),
                school: '',
                degree: '',
                field: '',
                location: '',
                startDate: '',
                endDate: '',
                details: '',
              },
            ],
          },
        })),
      updateEducation: (id, patch) =>
        set((s) => ({
          resume: {
            ...s.resume,
            education: s.resume.education.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          },
        })),
      removeEducation: (id) =>
        set((s) => ({
          resume: { ...s.resume, education: s.resume.education.filter((e) => e.id !== id) },
        })),

      addProject: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            projects: [
              ...s.resume.projects,
              { id: uid(), name: '', link: '', description: '', bullets: [''] },
            ],
          },
        })),
      updateProject: (id, patch) =>
        set((s) => ({
          resume: {
            ...s.resume,
            projects: s.resume.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          },
        })),
      removeProject: (id) =>
        set((s) => ({
          resume: { ...s.resume, projects: s.resume.projects.filter((p) => p.id !== id) },
        })),

      addSkillGroup: () =>
        set((s) => ({
          resume: {
            ...s.resume,
            skills: [...s.resume.skills, { id: uid(), category: '', items: '' }],
          },
        })),
      updateSkillGroup: (id, patch) =>
        set((s) => ({
          resume: {
            ...s.resume,
            skills: s.resume.skills.map((g) => (g.id === id ? { ...g, ...patch } : g)),
          },
        })),
      removeSkillGroup: (id) =>
        set((s) => ({
          resume: { ...s.resume, skills: s.resume.skills.filter((g) => g.id !== id) },
        })),

      loadSample: () => set({ resume: sampleResume() }),
      reset: () => set({ resume: emptyResume() }),
      importJSON: (data) => set({ resume: data }),
    }),
    {
      name: 'resume-builder-ai:v1',
      version: 1,
    },
  ),
);
