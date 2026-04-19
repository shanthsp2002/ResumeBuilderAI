import { useMemo, useState } from 'react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { useResumeStore } from '../store/resumeStore';
import { getTemplate } from '../templates';
import { exportDocx } from '../lib/docxExport';

export function Preview() {
  const resume = useResumeStore((s) => s.resume);
  const [downloading, setDownloading] = useState<'pdf' | 'docx' | null>(null);

  const { component: TemplateComponent } = useMemo(() => getTemplate(resume.template), [resume.template]);

  const downloadPDF = async () => {
    setDownloading('pdf');
    try {
      const blob = await pdf(<TemplateComponent data={resume} />).toBlob();
      const safeName = (resume.personal.fullName || 'resume').replace(/\s+/g, '_');
      saveAs(blob, `${safeName}.pdf`);
    } finally {
      setDownloading(null);
    }
  };

  const downloadDOCX = async () => {
    setDownloading('docx');
    try {
      await exportDocx(resume);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <span className="text-sm text-gray-500">Live preview</span>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={downloadDOCX} disabled={downloading !== null}>
            {downloading === 'docx' ? 'Building…' : 'Download DOCX'}
          </button>
          <button className="btn-primary" onClick={downloadPDF} disabled={downloading !== null}>
            {downloading === 'pdf' ? 'Building…' : 'Download PDF'}
          </button>
        </div>
      </div>
      <div className="flex-1 bg-gray-100">
        <PDFViewer key={resume.template} width="100%" height="100%" showToolbar={false}>
          <TemplateComponent data={resume} />
        </PDFViewer>
      </div>
    </div>
  );
}
