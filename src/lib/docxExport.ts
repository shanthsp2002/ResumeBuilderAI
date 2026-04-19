import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import { Resume } from '../types/resume';
import { dateRange, joinNonEmpty } from './format';

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 80 },
    border: {
      bottom: { color: '111827', space: 2, style: BorderStyle.SINGLE, size: 6 },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 22,
        color: '111827',
      }),
    ],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 20 })],
  });
}

function line(text: string, opts?: { bold?: boolean; italics?: boolean; size?: number }): Paragraph {
  return new Paragraph({
    spacing: { before: 20, after: 20 },
    children: [
      new TextRun({
        text,
        bold: opts?.bold,
        italics: opts?.italics,
        size: opts?.size ?? 20,
      }),
    ],
  });
}

function entryHeader(left: string, right: string): Paragraph {
  return new Paragraph({
    spacing: { before: 80, after: 20 },
    tabStops: [{ type: 'right', position: 9000 }],
    children: [
      new TextRun({ text: left, bold: true, size: 22 }),
      new TextRun({ text: `\t${right}`, size: 20, color: '6b7280' }),
    ],
  });
}

export async function exportDocx(resume: Resume): Promise<void> {
  const { personal, experience, education, skills, projects } = resume;
  const contactLine = joinNonEmpty([
    personal.email,
    personal.phone,
    personal.location,
    personal.website,
    personal.linkedin,
    personal.github,
  ]);

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: personal.fullName || 'Your Name', bold: true, size: 40 }),
      ],
    }),
  ];

  if (personal.title) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: personal.title, size: 24, color: '4b5563' })],
      }),
    );
  }
  if (contactLine) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: contactLine, size: 20, color: '4b5563' })],
      }),
    );
  }

  if (personal.summary) {
    children.push(sectionHeading('Summary'));
    children.push(line(personal.summary));
  }

  if (experience.length > 0) {
    children.push(sectionHeading('Experience'));
    experience.forEach((e) => {
      const left = `${e.role}${e.company ? `, ${e.company}` : ''}`;
      const right = joinNonEmpty([e.location, dateRange(e.startDate, e.endDate, e.current)]);
      children.push(entryHeader(left, right));
      e.bullets.filter((b) => b.trim()).forEach((b) => children.push(bullet(b)));
    });
  }

  if (projects.length > 0) {
    children.push(sectionHeading('Projects'));
    projects.forEach((p) => {
      children.push(entryHeader(p.name, p.link));
      if (p.description) children.push(line(p.description));
      p.bullets.filter((b) => b.trim()).forEach((b) => children.push(bullet(b)));
    });
  }

  if (education.length > 0) {
    children.push(sectionHeading('Education'));
    education.forEach((e) => {
      const left = `${e.school}${e.degree || e.field ? ` — ${joinNonEmpty([e.degree, e.field], ' ')}` : ''}`;
      children.push(entryHeader(left, dateRange(e.startDate, e.endDate, false)));
      if (e.details) children.push(line(e.details, { italics: true }));
    });
  }

  if (skills.length > 0) {
    children.push(sectionHeading('Skills'));
    skills.forEach((g) => {
      children.push(
        new Paragraph({
          spacing: { before: 20, after: 20 },
          children: [
            new TextRun({ text: `${g.category}: `, bold: true, size: 20 }),
            new TextRun({ text: g.items, size: 20 }),
          ],
        }),
      );
    });
  }

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri' },
        },
      },
    },
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (personal.fullName || 'resume').replace(/\s+/g, '_');
  saveAs(blob, `${safeName}.docx`);
}
