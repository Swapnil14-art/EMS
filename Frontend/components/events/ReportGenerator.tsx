'use client';
import { useState, useRef, useCallback, useId } from 'react';
import {
  FileText, Image as ImageIcon, Upload, Download, Send, Eye,
  X, AlertTriangle, Plus, GripVertical, Trash2, Link,
  AlignLeft, List, ChevronDown, ChevronUp, Type,
} from 'lucide-react';
import { Button, Alert } from '@/components/ui';
import { reportService } from '@/lib/services';
import { formatDateTime } from '@/lib/utils';
import type { Event } from '@/types';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportGeneratorProps {
  event: Event;
  onComplete: () => void;
}

interface PhotoFile {
  file: File;
  preview: string;
  id: string;
}

type SectionType = 'paragraph' | 'bullets' | 'links';

interface ReportSection {
  id: string;
  title: string;           // bold section title
  type: SectionType;       // how the content is rendered
  content: string;         // paragraph text OR bullet lines (one per line)
  links: { label: string; url: string }[]; // for link-type sections
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PHOTOS = 10;
const MIN_PHOTOS = 4;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const LOGO_PATH = '/logo1.jpg'; // served from Frontend/public/logo1.jpg

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const makeSection = (overrides?: Partial<ReportSection>): ReportSection => ({
  id: uid(),
  title: '',
  type: 'paragraph',
  content: '',
  links: [{ label: '', url: '' }],
  ...overrides,
});

// Default sections matching the sample report
const DEFAULT_SECTIONS: ReportSection[] = [
  makeSection({ title: 'Name and designation of the Guest Speakers', type: 'paragraph' }),
  makeSection({ title: 'Program Type', type: 'paragraph' }),
  makeSection({ title: 'Program Theme', type: 'paragraph' }),
  makeSection({ title: 'Objective of the activity', type: 'paragraph' }),
  makeSection({ title: 'Benefit in terms of learning, skills, knowledge obtained', type: 'paragraph' }),
  makeSection({ title: 'Background of the Speaker(s)', type: 'paragraph' }),
  makeSection({ title: 'Report on the session with the key outcomes', type: 'paragraph' }),
  makeSection({ title: 'Key Outcomes of the Event', type: 'bullets' }),
  makeSection({ title: 'Conclusion', type: 'paragraph' }),
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTypeButton({
  active, onClick, icon, label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-[var(--text-secondary)] border-[var(--input-border)] hover:border-blue-400'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SectionEditor({
  section,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  section: ReportSection;
  index: number;
  total: number;
  onChange: (updated: ReportSection) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const set = (patch: Partial<ReportSection>) => onChange({ ...section, ...patch });

  const updateLink = (i: number, key: 'label' | 'url', val: string) => {
    const links = section.links.map((l, li) => li === i ? { ...l, [key]: val } : l);
    set({ links });
  };
  const addLink = () => set({ links: [...section.links, { label: '', url: '' }] });
  const removeLink = (i: number) => set({ links: section.links.filter((_, li) => li !== i) });

  return (
    <div className="group relative rounded-2xl border border-[var(--card-border)] bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 px-4 py-2.5 border-b border-[var(--card-border)] bg-slate-50/70 rounded-t-2xl">
        <div className="flex items-center flex-1 min-w-[200px] gap-2 w-full sm:w-auto">
          <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />
          <input
            className="flex-1 text-sm font-semibold bg-transparent border-0 focus:outline-none placeholder:font-normal placeholder:text-slate-400"
            placeholder="Section title (will be bold in report)…"
            value={section.title}
            onChange={e => set({ title: e.target.value })}
          />
        </div>

        {/* Action toggles (Type & Move) */}
        <div className="flex items-center justify-between w-full sm:w-auto gap-2">
          {/* Type toggles */}
          <div className="flex overflow-x-auto whitespace-nowrap items-center gap-1 shrink-0 pb-1 sm:pb-0">
            <SectionTypeButton active={section.type === 'paragraph'} onClick={() => set({ type: 'paragraph' })} icon={<AlignLeft className="w-3 h-3" />} label="Para" />
            <SectionTypeButton active={section.type === 'bullets'} onClick={() => set({ type: 'bullets' })} icon={<List className="w-3 h-3" />} label="Points" />
            <SectionTypeButton active={section.type === 'links'} onClick={() => set({ type: 'links' })} icon={<Link className="w-3 h-3" />} label="Links" />
          </div>

          {/* Move / remove */}
          <div className="flex items-center gap-1 shrink-0 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-auto sm:ml-0">
            <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="p-1 rounded hover:bg-slate-200 disabled:opacity-30">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} className="p-1 rounded hover:bg-slate-200 disabled:opacity-30">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={onRemove} className="p-1 rounded hover:bg-red-50 text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

      {/* Content area */}
      <div className="px-4 py-3">
        {section.type === 'paragraph' && (
          <textarea
            className="w-full text-sm text-[var(--text-secondary)] resize-none focus:outline-none min-h-[80px] bg-transparent"
            placeholder="Write paragraph content…"
            value={section.content}
            onChange={e => set({ content: e.target.value })}
          />
        )}

        {section.type === 'bullets' && (
          <div className="space-y-1">
            <textarea
              className="w-full text-sm text-[var(--text-secondary)] resize-none focus:outline-none min-h-[80px] bg-transparent"
              placeholder={"Enter each bullet point on a new line:\n• Point one\n• Point two"}
              value={section.content}
              onChange={e => set({ content: e.target.value })}
            />
            <p className="text-[10px] text-slate-400">Each line becomes a bullet point in the report.</p>
          </div>
        )}

        {section.type === 'links' && (
          <div className="space-y-2">
            {section.links.map((lnk, li) => (
              <div key={li} className="flex items-center gap-2">
                <input
                  className="w-32 shrink-0 text-xs border border-[var(--input-border)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400"
                  placeholder="Label (e.g. LinkedIn)"
                  value={lnk.label}
                  onChange={e => updateLink(li, 'label', e.target.value)}
                />
                <input
                  className="flex-1 text-xs border border-[var(--input-border)] rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400"
                  placeholder="https://…"
                  value={lnk.url}
                  onChange={e => updateLink(li, 'url', e.target.value)}
                />
                <button type="button" onClick={() => removeLink(li)} className="p-1 text-red-400 hover:text-red-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addLink} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
              <Plus className="w-3 h-3" /> Add link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Preview Section ──────────────────────────────────────────────────────────

function PreviewSection({ section }: { section: ReportSection }) {
  if (!section.title && !section.content && section.links.every(l => !l.url)) return null;
  return (
    <div className="mb-4">
      {section.title && (
        <p className="text-sm font-bold text-slate-800 mb-1">{section.title}</p>
      )}
      {section.type === 'paragraph' && (
        <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{section.content}</p>
      )}
      {section.type === 'bullets' && (
        <ul className="space-y-1">
          {section.content.split('\n').filter(Boolean).map((line, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-700">
              <span className="text-blue-600 shrink-0 mt-0.5">•</span>
              <span>{line.replace(/^[-•*]\s*/, '')}</span>
            </li>
          ))}
        </ul>
      )}
      {section.type === 'links' && (
        <ul className="space-y-1">
          {section.links.filter(l => l.url).map((lnk, i) => (
            <li key={i} className="flex gap-2 text-sm">
              {lnk.label && <span className="text-slate-600 shrink-0">{lnk.label}:</span>}
              <a href={lnk.url} className="text-blue-600 underline break-all" target="_blank" rel="noopener noreferrer">{lnk.url}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportGenerator({ event, onComplete }: ReportGeneratorProps) {
  const [sections, setSections] = useState<ReportSection[]>(DEFAULT_SECTIONS);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const photoRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // ── Section handlers ──────────────────────────────────────────────────────

  const updateSection = useCallback((id: string, updated: ReportSection) => {
    setSections(prev => prev.map(s => s.id === id ? updated : s));
  }, []);

  const removeSection = useCallback((id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
  }, []);

  const moveSection = useCallback((id: string, dir: -1 | 1) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx + dir < 0 || idx + dir >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
      return next;
    });
  }, []);

  const addSection = useCallback((atIndex?: number) => {
    const s = makeSection();
    setSections(prev => {
      if (atIndex !== undefined) {
        const next = [...prev];
        next.splice(atIndex + 1, 0, s);
        return next;
      }
      return [...prev, s];
    });
  }, []);

  // ── Photo handlers ────────────────────────────────────────────────────────

  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos: PhotoFile[] = [];
    for (const file of files) {
      if (photos.length + newPhotos.length >= MAX_PHOTOS) {
        toast.error(`Maximum ${MAX_PHOTOS} photos allowed`); break;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: Only JPG and PNG accepted`); continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: Exceeds ${MAX_FILE_SIZE_MB}MB`); continue;
      }
      newPhotos.push({ file, preview: URL.createObjectURL(file), id: uid() });
    }
    setPhotos(prev => [...prev, ...newPhotos]);
    if (e.target) e.target.value = '';
  }, [photos.length]);

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => {
      const p = prev.find(x => x.id === id);
      if (p) URL.revokeObjectURL(p.preview);
      return prev.filter(x => x.id !== id);
    });
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────

  const canPreview = photos.length >= MIN_PHOTOS && sections.some(s => s.title || s.content);

  // ── File helpers ──────────────────────────────────────────────────────────

  const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as ArrayBuffer);
      r.onerror = rej;
      r.readAsArrayBuffer(file);
    });

  const fetchAsArrayBuffer = async (url: string): Promise<ArrayBuffer | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.arrayBuffer();
    } catch { return null; }
  };

  // ── DOCX Generation ───────────────────────────────────────────────────────

  const generateDocx = async (): Promise<Blob> => {
    const {
      Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
      Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType,
      ShadingType, ExternalHyperlink, LevelFormat,
    } = await import('docx');

    const logoBuf = await fetchAsArrayBuffer(LOGO_PATH);
    const photoBufs = await Promise.all(photos.map(p => fileToArrayBuffer(p.file)));

    // Borders
    const thinBorder = {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    };

    const detailRows = [
      ['Event Title', event.title],
      ['Date & Time', `${formatDateTime(event.start_datetime)} – ${formatDateTime(event.end_datetime)}`],
      ['Venue', event.venue?.name || event.venue_custom || '—'],
      ['School', event.school_department || '—'],
      ['Event Type', event.event_type || '—'],
      ['Incharge', event.event_incharge_name || '—'],
    ];

    // Build section paragraphs
    const sectionChildren: any[] = [];
    for (const sec of sections) {
      if (!sec.title && !sec.content && sec.links.every(l => !l.url)) continue;

      if (sec.title) {
        sectionChildren.push(
          new Paragraph({
            children: [new TextRun({ text: sec.title, bold: true, size: 22, font: 'Calibri' })],
          })
        );
      }

      if (sec.type === 'paragraph') {
        const lines = sec.content.split('\n');
        for (const line of lines) {
          sectionChildren.push(new Paragraph({ children: [new TextRun({ text: line, size: 22, font: 'Calibri' })] }));
        }
      } else if (sec.type === 'bullets') {
        const lines = sec.content.split('\n').filter(Boolean);
        for (const line of lines) {
          const clean = line.replace(/^[-•*]\s*/, '');
          sectionChildren.push(
            new Paragraph({
              numbering: { reference: 'bullets', level: 0 },
              children: [new TextRun({ text: clean, size: 22, font: 'Calibri' })],
            })
          );
        }
      } else if (sec.type === 'links') {
        for (const lnk of sec.links.filter(l => l.url)) {
          const labelRun = lnk.label
            ? [new TextRun({ text: `${lnk.label}: `, size: 22, font: 'Calibri' })]
            : [];
          sectionChildren.push(
            new Paragraph({
              children: [
                ...labelRun,
                new ExternalHyperlink({
                  link: lnk.url,
                  children: [new TextRun({ text: lnk.url, size: 22, font: 'Calibri', color: '2563EB', underline: {} })],
                }),
              ],
            })
          );
        }
      }

      sectionChildren.push(new Paragraph({ text: '' }));
    }

    const doc = new Document({
      numbering: {
        config: [
          {
            reference: 'bullets',
            levels: [{
              level: 0,
              format: LevelFormat.BULLET,
              text: '•',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            }],
          },
        ],
      },
      sections: [{
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: [
          // ── Header: logo + title block ──────────────────────────────────
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [1440, 7920],
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: '1E3A5F' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
            rows: [
              new TableRow({
                children: [
                  // Logo cell
                  new TableCell({
                    width: { size: 1440, type: WidthType.DXA },
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                    },
                    margins: { top: 80, bottom: 80, left: 0, right: 120 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: logoBuf
                          ? [new ImageRun({ data: logoBuf, transformation: { width: 80, height: 80 }, type: 'jpg' })]
                          : [new TextRun({ text: '' })],
                      }),
                    ],
                  }),
                  // Title cell
                  new TableCell({
                    width: { size: 7920, type: WidthType.DXA },
                    borders: {
                      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                    },
                    margins: { top: 80, bottom: 80, left: 120, right: 0 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: [new TextRun({ text: 'Report on', bold: false, size: 22, font: 'Calibri' })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: [new TextRun({ text: 'NISP Cell Event', bold: true, size: 26, font: 'Calibri' })],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.LEFT,
                        children: [new TextRun({ text: `"${event.title}"`, bold: true, size: 26, font: 'Calibri', color: '1E3A5F' })],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ text: '' }),

          // ── Event Details Table ────────────────────────────────────────
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [2808, 6552],
            rows: detailRows.map(([label, value]) =>
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 2808, type: WidthType.DXA },
                    borders: thinBorder,
                    shading: { fill: 'EFF6FF', type: ShadingType.CLEAR },
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: 'Calibri' })] })],
                  }),
                  new TableCell({
                    width: { size: 6552, type: WidthType.DXA },
                    borders: thinBorder,
                    margins: { top: 80, bottom: 80, left: 120, right: 120 },
                    children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, font: 'Calibri' })] })],
                  }),
                ],
              })
            ),
          }),

          new Paragraph({ text: '' }),

          // ── Dynamic sections ───────────────────────────────────────────
          ...sectionChildren,

          // ── Photo gallery ──────────────────────────────────────────────
          ...(photoBufs.length > 0 ? [
            new Paragraph({
              children: [new TextRun({ text: `Glimpses of the event (${photoBufs.length} photographs)`, bold: true, size: 22, font: 'Calibri' })],
            }),
            new Paragraph({ text: '' }),
            ...photoBufs.map(buf =>
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 240 },
                children: [new ImageRun({ data: buf, transformation: { width: 580, height: 386 }, type: 'jpg' })],
              })
            ),
          ] : []),
        ],
      }],
    });

    return await Packer.toBlob(doc);
  };

  // ── PDF via html2canvas ───────────────────────────────────────────────────

  const generatePdf = async (): Promise<Blob> => {
    const { default: jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    const el = previewRef.current;
    if (!el) throw new Error('Preview not rendered');
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const pageHeight = pdf.internal.pageSize.getHeight();
    let pos = 0;
    if (pdfHeight <= pageHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    } else {
      while (pos < pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, -pos, pdfWidth, pdfHeight);
        pos += pageHeight;
        if (pos < pdfHeight) pdf.addPage();
      }
    }
    return pdf.output('blob');
  };

  // ── Download ──────────────────────────────────────────────────────────────

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocx = async () => {
    setGenerating(true);
    try {
      const blob = await generateDocx();
      downloadFile(blob, `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Report.docx`);
      toast.success('Word document downloaded');
    } catch (err) { console.error(err); toast.error('Failed to generate Word document'); }
    finally { setGenerating(false); }
  };

  const handleDownloadPdf = async () => {
    if (!showPreview) { toast.error('Generate preview first'); return; }
    setGenerating(true);
    try {
      const blob = await generatePdf();
      downloadFile(blob, `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Report.pdf`);
      toast.success('PDF downloaded');
    } catch (err) { console.error(err); toast.error('Failed to generate PDF'); }
    finally { setGenerating(false); }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const blob = await generateDocx();
      const file = new File([blob], `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Report.docx`, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      await reportService.uploadDoc(event.id, file);
      toast.success('Report submitted! Event archived.');
      onComplete();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Auto-filled event details ──────────────────────────────────────── */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100">
        <h3 className="text-sm font-display font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Event Details
          <span className="text-xs font-normal text-[var(--text-muted)]">(auto-filled from database)</span>
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><span className="font-medium text-[var(--text-secondary)]">Title:</span> <span className="text-[var(--text-primary)]">{event.title}</span></div>
          <div><span className="font-medium text-[var(--text-secondary)]">Type:</span> <span className="text-[var(--text-primary)] capitalize">{event.event_type}</span></div>
          <div><span className="font-medium text-[var(--text-secondary)]">Start:</span> <span className="text-[var(--text-primary)]">{formatDateTime(event.start_datetime)}</span></div>
          <div><span className="font-medium text-[var(--text-secondary)]">End:</span> <span className="text-[var(--text-primary)]">{formatDateTime(event.end_datetime)}</span></div>
          <div><span className="font-medium text-[var(--text-secondary)]">Venue:</span> <span className="text-[var(--text-primary)]">{event.venue?.name || event.venue_custom || '—'}</span></div>
          <div><span className="font-medium text-[var(--text-secondary)]">School:</span> <span className="text-[var(--text-primary)]">{event.school_department || '—'}</span></div>
        </div>
      </div>

      {/* ── Report Sections Builder ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-display font-bold text-[var(--text-primary)]">Report Sections</h3>
          <span className="text-xs text-[var(--text-muted)]">Drag to reorder · click type to switch</span>
        </div>

        <div className="space-y-3">
          {sections.map((sec, idx) => (
            <div key={sec.id}>
              <SectionEditor
                section={sec}
                index={idx}
                total={sections.length}
                onChange={updated => updateSection(sec.id, updated)}
                onRemove={() => removeSection(sec.id)}
                onMove={dir => moveSection(sec.id, dir)}
              />
              {/* Insert section button between cards */}
              <button
                type="button"
                onClick={() => addSection(idx)}
                className="w-full mt-2 py-1.5 flex items-center justify-center gap-1 text-xs text-[var(--text-muted)] hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-dashed border-transparent hover:border-blue-200 transition-all"
              >
                <Plus className="w-3 h-3" /> Insert section here
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => addSection()}
          className="mt-3 w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-blue-600 rounded-2xl border-2 border-dashed border-blue-200 hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Section
        </button>
      </div>

      {/* ── Photo Upload ───────────────────────────────────────────────────── */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-2">
          <ImageIcon className="w-4 h-4" />
          Event Photos ({photos.length}/{MAX_PHOTOS})
          <span className="text-[var(--text-muted)] font-normal text-xs">— min {MIN_PHOTOS} required · first photo = banner</span>
        </label>

        <div className="grid grid-cols-5 gap-3">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-[var(--card-border)] aspect-square bg-[var(--page-bg)]">
              <img src={photo.preview} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
              {idx === 0 && (
                <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">P1</span>
              )}
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[var(--input-border)] aspect-square hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            >
              <Upload className="w-5 h-5 text-[var(--text-muted)]" />
              <span className="text-[10px] text-[var(--text-muted)]">Add Photo</span>
            </button>
          )}
        </div>
        <input ref={photoRef} type="file" className="hidden" accept=".jpg,.jpeg,.png" multiple onChange={handlePhotoSelect} />

        {photos.length > 0 && photos.length < MIN_PHOTOS && (
          <p className="flex items-center gap-1.5 text-xs text-amber-600 mt-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            {MIN_PHOTOS - photos.length} more photo(s) needed
          </p>
        )}
      </div>

      {/* ── Preview Button ─────────────────────────────────────────────────── */}
      <Button
        disabled={!canPreview}
        onClick={() => setShowPreview(true)}
        className="w-full justify-center py-3"
        icon={<Eye className="w-4 h-4" />}
      >
        Generate Preview
      </Button>

      {!canPreview && (
        <p className="text-xs text-center text-[var(--text-muted)] -mt-3">
          Add at least {MIN_PHOTOS} photos and fill in at least one section to preview.
        </p>
      )}

      {/* ── Document Preview ───────────────────────────────────────────────── */}
      {showPreview && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-[var(--card-border)]" />
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Document Preview</span>
            <div className="h-px flex-1 bg-[var(--card-border)]" />
          </div>

          <div ref={previewRef} className="bg-white rounded-2xl border border-[var(--card-border)] shadow-card overflow-hidden">
            {/* Header: logo + title */}
            <div className="flex items-center gap-4 px-8 py-5 border-b-4 border-[#1E3A5F]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_PATH} alt="Logo" className="w-16 h-16 object-contain shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div>
                <p className="text-xs text-slate-500">Report on</p>
                <p className="text-base font-bold text-slate-800">NISP Cell Event</p>
                <p className="text-base font-bold text-[#1E3A5F]">"{event.title}"</p>
              </div>
            </div>

            <div className="px-8 py-6 space-y-5">
              {/* Details table */}
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {[
                    ['Event Title', event.title],
                    ['Date & Time', `${formatDateTime(event.start_datetime)} – ${formatDateTime(event.end_datetime)}`],
                    ['Venue', event.venue?.name || event.venue_custom || '—'],
                    ['School', event.school_department || '—'],
                    ['Event Type', event.event_type || '—'],
                    ['Incharge', event.event_incharge_name || '—'],
                  ].map(([label, value]) => (
                    <tr key={label} className="border border-slate-200">
                      <td className="w-1/3 px-3 py-2 font-semibold bg-blue-50 text-slate-700">{label}</td>
                      <td className="px-3 py-2 text-slate-700">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Dynamic sections */}
              <div className="space-y-4 pt-2">
                {sections.map(sec => <PreviewSection key={sec.id} section={sec} />)}
              </div>

              {/* Photo gallery */}
              {photos.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-3">
                    Glimpses of the event ({photos.length} photographs)
                  </p>
                  <div className="space-y-3">
                    {photos.map((photo, idx) => (
                      <img
                        key={photo.id}
                        src={photo.preview}
                        alt={`Event photo ${idx + 1}`}
                        className="w-full rounded-lg object-cover"
                        style={{ maxHeight: 320 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Export Actions ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            <Button variant="secondary" onClick={handleDownloadDocx} loading={generating} icon={<Download className="w-4 h-4" />} className="justify-center py-3">
              Word (.docx)
            </Button>
            <Button variant="secondary" onClick={handleDownloadPdf} loading={generating} icon={<Download className="w-4 h-4" />} className="justify-center py-3">
              PDF
            </Button>
            <Button onClick={handleSubmit} loading={submitting} icon={<Send className="w-4 h-4" />} className="justify-center py-3">
              Submit Report
            </Button>
          </div>

          <Alert type="warning">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Submitting will <strong>archive</strong> the event permanently. Downloads do not affect event status.</span>
          </Alert>
        </div>
      )}
    </div>
  );
}
