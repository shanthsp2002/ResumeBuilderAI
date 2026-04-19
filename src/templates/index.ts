import { TemplateId } from '../types/resume';
import { ClassicTemplate } from './ClassicTemplate';
import { ModernTemplate } from './ModernTemplate';
import { CompactTemplate } from './CompactTemplate';
import { TechTemplate } from './TechTemplate';
import { ExecutiveTemplate } from './ExecutiveTemplate';

export const templates: Record<
  TemplateId,
  { label: string; description: string; component: typeof ClassicTemplate }
> = {
  modern: {
    label: 'Modern',
    description: 'Balanced layout with a colored left rail for contact info.',
    component: ModernTemplate,
  },
  classic: {
    label: 'Classic',
    description: 'Traditional centered header; safe for conservative industries.',
    component: ClassicTemplate,
  },
  compact: {
    label: 'Compact',
    description: 'Dense single-column layout optimized to fit on one page.',
    component: CompactTemplate,
  },
  tech: {
    label: 'Tech',
    description: 'Monospaced accents and skills matrix. Good for engineers.',
    component: TechTemplate,
  },
  executive: {
    label: 'Executive',
    description: 'Serif-forward, senior-leaning layout emphasizing summary and impact.',
    component: ExecutiveTemplate,
  },
};

export function getTemplate(id: TemplateId) {
  return templates[id] ?? templates.modern;
}
