export interface PersonalInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  summary: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface EducationEntry {
  id: string;
  school: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  details: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  link: string;
  description: string;
  bullets: string[];
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string;
}

export type TemplateId = 'classic' | 'modern' | 'compact' | 'tech' | 'executive';

export interface Resume {
  personal: PersonalInfo;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  skills: SkillGroup[];
  template: TemplateId;
  accentColor: string;
}

export const emptyResume = (): Resume => ({
  personal: {
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    github: '',
    summary: '',
  },
  experience: [],
  education: [],
  projects: [],
  skills: [],
  template: 'modern',
  accentColor: '#2563eb',
});

export const sampleResume = (): Resume => ({
  personal: {
    fullName: 'Alex Morgan',
    title: 'Senior Software Engineer',
    email: 'alex.morgan@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    website: 'alexmorgan.dev',
    linkedin: 'linkedin.com/in/alexmorgan',
    github: 'github.com/alexmorgan',
    summary:
      'Backend-leaning full-stack engineer with 8+ years building distributed systems at scale. Track record of shipping low-latency services, mentoring engineers, and turning ambiguous product goals into measurable outcomes.',
  },
  experience: [
    {
      id: 'e1',
      company: 'Northwind Labs',
      role: 'Senior Software Engineer',
      location: 'Remote',
      startDate: '2022-03',
      endDate: '',
      current: true,
      bullets: [
        'Led migration of legacy monolith to event-driven microservices, cutting p95 latency by 42% and halving on-call pages.',
        'Designed a multi-tenant billing pipeline processing $18M/mo with zero reconciliation errors over 14 months.',
        'Mentored 5 engineers; 3 promoted within 18 months.',
      ],
    },
    {
      id: 'e2',
      company: 'Quanta Systems',
      role: 'Software Engineer',
      location: 'Austin, TX',
      startDate: '2019-06',
      endDate: '2022-02',
      current: false,
      bullets: [
        'Built a streaming analytics platform on Kafka + Flink handling 1.2B events/day with sub-second aggregation.',
        'Reduced cloud spend by $430K annually by rearchitecting hot-path storage onto tiered S3 + DynamoDB.',
      ],
    },
  ],
  education: [
    {
      id: 'ed1',
      school: 'University of Texas at Austin',
      degree: 'B.S.',
      field: 'Computer Science',
      location: 'Austin, TX',
      startDate: '2015-08',
      endDate: '2019-05',
      details: 'GPA 3.8 • Dean\u2019s List 6 semesters',
    },
  ],
  projects: [
    {
      id: 'p1',
      name: 'OpenRouteKit',
      link: 'github.com/alexmorgan/openroutekit',
      description: 'Open-source routing SDK for offline maps.',
      bullets: [
        'Authored core routing engine in Rust with WASM bindings; 2.4k GitHub stars.',
        'Shipped turn-by-turn navigation demo used in 3 commercial OEM prototypes.',
      ],
    },
  ],
  skills: [
    { id: 's1', category: 'Languages', items: 'TypeScript, Go, Rust, Python, SQL' },
    { id: 's2', category: 'Infrastructure', items: 'AWS, Kubernetes, Terraform, Kafka, PostgreSQL' },
    { id: 's3', category: 'Practices', items: 'Distributed systems, Observability, Mentorship, DDD' },
  ],
  template: 'modern',
  accentColor: '#2563eb',
});
