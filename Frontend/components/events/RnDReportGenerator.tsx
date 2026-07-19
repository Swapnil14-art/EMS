'use client';
import { useState, useRef, useCallback } from 'react';
import {
  FileText, Image as ImageIcon, Upload, Download, Send, Eye,
  X, AlertTriangle, Plus, Trash2, Link, ChevronDown, User,
  Users, BookOpen, Target, MessageSquare, List, Mic,
} from 'lucide-react';
import { Button, Alert } from '@/components/ui';
import { rndReportService } from '@/lib/services';
import { formatDateTime } from '@/lib/utils';
import type { Event } from '@/types';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RnDReportGeneratorProps {
  event: Event;
  onComplete: () => void;
}

interface PhotoFile {
  file: File;
  preview: string;
  id: string;
}

interface FlierFile {
  file: File;
  preview: string;
}

interface CollaboratorLogo {
  file: File;
  preview: string;
  id: string;
}

interface GuestSpeaker {
  name: string;
  designation: string;
  organization: string;
  expertise: string;
  speaker_type?: string;
  custom_speaker_type?: string;
}

interface SocialLinks {
  facebook: string;
  instagram: string;
  x: string;
  linkedin: string;
  preserve_aspect_ratio?: boolean;
}

interface CompetitionWinner {
  game: string;
  studentWinners: string[];
  facultyWinners: string[];
}


// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_PHOTOS = 8;
const MIN_PHOTOS = 4;
const MAX_COLLABORATOR_LOGOS = 3;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

const LOGO_PATH_LEFT = '/nmimsreportlogo.png';
const LOGO_PATH_RIGHT = '/iicreportlogo.png';

const PROGRAM_TYPES = [
  'Level 1-Expert Talk',
  'Level 1-Exposure Visit',
  'Level 1-Mentoring Session',
  'Level 1-Exhibition',
  'Level 2-Conference',
  'Level 2-Exposure Visit',
  'Level 2-Seminar',
  'Level 2-Workshop',
  'Level 2-Competition',
  'Level 3-Bootcamp',
  'Level 3-Competition/Hackathon',
  'Level 3-Demo Day',
  'Level 3-Exhibition',
  'Level 3-Workshop',
  'Level 3-Exposure Visit',
  'Level 4-Challenges',
  'Level 4-Competition/Hackathon',
  'Level 4-Tech Fest',
  'Level 4-Bootcamp',
  'Level 4-Workshop',
  'Level 4-Exhibition/Demo Day',
];

const uid = () => Math.random().toString(36).slice(2, 9);

const emptySpeaker = (): GuestSpeaker => ({
  name: '',
  designation: '',
  organization: '',
  expertise: '',
  speaker_type: 'Guest Speaker',
  custom_speaker_type: '',
});
const emptyLinks = (): SocialLinks => ({ facebook: '', instagram: '', x: '', linkedin: '', preserve_aspect_ratio: false });

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wide">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

// Rename this helper if needed but keeping it parallel is good
function Field({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`space-y-1 ${className}`}>{children}</div>;
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full text-sm border border-[var(--input-border)] rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 bg-white transition-colors ${props.className ?? ''}`}
    />
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full text-sm border border-[var(--input-border)] rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400 bg-white transition-colors resize-none ${props.className ?? ''}`}
    />
  );
}

function Select({ ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full text-sm border border-[var(--input-border)] rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 bg-white transition-colors appearance-none ${props.className ?? ''}`}
    />
  );
}

function SectionCard({ title, icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50/70 hover:bg-slate-100/70 transition-colors"
      >
        <div className="flex items-center gap-2.5 text-sm font-semibold text-[var(--text-primary)]">
          <span className="text-blue-600">{icon}</span>
          {title}
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 py-4 space-y-4">{children}</div>}
    </div>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const over = len > max;
  return (
    <span className={`text-[10px] ${over ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
      {len}/{max}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RnDReportGenerator({ event, onComplete }: RnDReportGeneratorProps) {
  // ── Form state ─────────────────────────────────────────────────────────────
  const [programType, setProgramType] = useState('');
  const [modeOfDelivery, setModeOfDelivery] = useState<'offline' | 'online' | ''>('');
  const [objective, setObjective] = useState('');
  const [learningBenefit, setLearningBenefit] = useState('');
  const [speakers, setSpeakers] = useState<GuestSpeaker[]>([emptySpeaker()]);
  const [facultyCoordinators, setFacultyCoordinators] = useState<string[]>(['']);
  const [studentCoordinators, setStudentCoordinators] = useState<string[]>(['']);
  const [socialPamphlet, setSocialPamphlet] = useState<SocialLinks>(emptyLinks());
  const [socialVideo, setSocialVideo] = useState<SocialLinks>(emptyLinks());
  const [studentCount, setStudentCount] = useState('');
  const [facultyCount, setFacultyCount] = useState('');
  const [externalCount, setExternalCount] = useState('');
  const [actualBudget, setActualBudget] = useState('');
  const [speakerBackground, setSpeakerBackground] = useState('');
  const [eventSummary, setEventSummary] = useState('');
  const [sessionReport, setSessionReport] = useState('');
  const [keyOutcomes, setKeyOutcomes] = useState<string[]>(['']);
  const [conclusion, setConclusion] = useState('');
  const [issues, setIssues] = useState('');
  const [feedback, setFeedback] = useState('');
  const [includeWinners, setIncludeWinners] = useState(false);
  const [competitions, setCompetitions] = useState<CompetitionWinner[]>([
    { game: '', studentWinners: [''], facultyWinners: [''] }
  ]);
  const [preserveAspectRatio, setPreserveAspectRatio] = useState(false);

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const dims = { width: img.naturalWidth, height: img.naturalHeight };
        URL.revokeObjectURL(img.src);
        resolve(dims);
      };
      img.onerror = () => {
        resolve({ width: 400, height: 300 });
      };
    });
  };

  const scaleDimensions = (origW: number, origH: number, maxW: number, maxH: number) => {
    let w = origW;
    let h = origH;
    if (w > maxW || h > maxH) {
      const ratio = Math.min(maxW / w, maxH / h);
      w = w * ratio;
      h = h * ratio;
    }
    return { width: Math.round(w), height: Math.round(h) };
  };

  // ── File state ─────────────────────────────────────────────────────────────
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [flier, setFlier] = useState<FlierFile | null>(null);
  const [collaboratorLogos, setCollaboratorLogos] = useState<CollaboratorLogo[]>([]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const photoRef = useRef<HTMLInputElement>(null);
  const flierRef = useRef<HTMLInputElement>(null);
  const collaboratorLogoRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // ── Speaker handlers ───────────────────────────────────────────────────────
  const updateSpeaker = (i: number, field: keyof GuestSpeaker, val: string) =>
    setSpeakers(prev => prev.map((s, si) => si === i ? { ...s, [field]: val } : s));
  const addSpeaker = () => setSpeakers(prev => [...prev, emptySpeaker()]);
  const removeSpeaker = (i: number) => setSpeakers(prev => prev.filter((_, si) => si !== i));

  // ── Coordinator handlers ───────────────────────────────────────────────────
  const updateCoord = (list: string[], set: (v: string[]) => void, i: number, val: string) =>
    set(list.map((c, ci) => ci === i ? val : c));
  const addCoord = (list: string[], set: (v: string[]) => void) => set([...list, '']);
  const removeCoord = (list: string[], set: (v: string[]) => void, i: number) =>
    set(list.filter((_, ci) => ci !== i));

  // ── Key outcomes handlers ─────────────────────────────────────────────────
  const updateOutcome = (i: number, val: string) =>
    setKeyOutcomes(prev => prev.map((o, oi) => oi === i ? val : o));
  const addOutcome = () => setKeyOutcomes(prev => [...prev, '']);
  const removeOutcome = (i: number) => setKeyOutcomes(prev => prev.filter((_, oi) => oi !== i));

  // ── Winners handlers ──────────────────────────────────────────────────────
  const updateCompetition = (idx: number, field: keyof CompetitionWinner, value: any) =>
    setCompetitions(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  const addCompetition = () =>
    setCompetitions(prev => [...prev, { game: '', studentWinners: [''], facultyWinners: [''] }]);
  const removeCompetition = (idx: number) =>
    setCompetitions(prev => prev.filter((_, i) => i !== idx));

  const updateWinner = (compIdx: number, type: 'studentWinners' | 'facultyWinners', winIdx: number, value: string) =>
    setCompetitions(prev => prev.map((c, i) => {
      if (i !== compIdx) return c;
      const list = [...c[type]];
      list[winIdx] = value;
      return { ...c, [type]: list };
    }));
  const addWinner = (compIdx: number, type: 'studentWinners' | 'facultyWinners') =>
    setCompetitions(prev => prev.map((c, i) => i === compIdx ? { ...c, [type]: [...c[type], ''] } : c));
  const removeWinner = (compIdx: number, type: 'studentWinners' | 'facultyWinners', winIdx: number) =>
    setCompetitions(prev => prev.map((c, i) => {
      if (i !== compIdx) return c;
      return { ...c, [type]: c[type].filter((_, wi) => wi !== winIdx) };
    }));


  // ── Photo handlers ─────────────────────────────────────────────────────────
  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPhotos: PhotoFile[] = [];
    for (const file of files) {
      if (photos.length + newPhotos.length >= MAX_PHOTOS) { toast.error(`Max ${MAX_PHOTOS} photos`); break; }
      if (!ACCEPTED_TYPES.includes(file.type)) { toast.error(`${file.name}: JPG/PNG only`); continue; }
      if (file.size > MAX_FILE_SIZE) { toast.error(`${file.name}: Exceeds ${MAX_FILE_SIZE_MB}MB`); continue; }
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

  const handleFlierSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) { toast.error('JPG/PNG only'); return; }
    if (file.size > MAX_FILE_SIZE) { toast.error(`Exceeds ${MAX_FILE_SIZE_MB}MB`); return; }
    if (flier) URL.revokeObjectURL(flier.preview);
    setFlier({ file, preview: URL.createObjectURL(file) });
    if (e.target) e.target.value = '';
  }, [flier]);

  const handleCollaboratorLogoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newLogos: CollaboratorLogo[] = [];
    for (const file of files) {
      if (collaboratorLogos.length + newLogos.length >= MAX_COLLABORATOR_LOGOS) {
        toast.error(`Max ${MAX_COLLABORATOR_LOGOS} collaborator logos allowed`);
        break;
      }
      if (!ACCEPTED_TYPES.includes(file.type)) { toast.error(`${file.name}: JPG/PNG only`); continue; }
      if (file.size > MAX_FILE_SIZE) { toast.error(`${file.name}: Exceeds ${MAX_FILE_SIZE_MB}MB`); continue; }
      newLogos.push({ file, preview: URL.createObjectURL(file), id: uid() });
    }
    setCollaboratorLogos(prev => [...prev, ...newLogos]);
    if (e.target) e.target.value = '';
  }, [collaboratorLogos.length]);

  const removeCollaboratorLogo = useCallback((id: string) => {
    setCollaboratorLogos(prev => {
      const logo = prev.find(x => x.id === id);
      if (logo) URL.revokeObjectURL(logo.preview);
      return prev.filter(x => x.id !== id);
    });
  }, []);

  // ── Validation ─────────────────────────────────────────────────────────────
  const canPreview =
    photos.length >= MIN_PHOTOS &&
    !!flier &&
    !!eventSummary.trim() &&
    !!actualBudget;

  // ── Build payload ──────────────────────────────────────────────────────────
  const buildPayload = () => ({
    event_summary: eventSummary,
    actual_budget: parseFloat(actualBudget) || 0,
    outcomes: keyOutcomes.filter(Boolean).join('\n'),
    issues: issues || null,
    feedback: feedback || null,
    student_count: parseInt(studentCount) || 0,
    faculty_count: parseInt(facultyCount) || 0,
    external_count: parseInt(externalCount) || 0,
    program_type: programType || null,
    mode_of_delivery: modeOfDelivery || null,
    objective: objective || null,
    learning_benefit: learningBenefit || null,
    guest_speakers: speakers.filter(s => s.name),
    faculty_coordinators: facultyCoordinators.filter(Boolean),
    student_coordinators: studentCoordinators.filter(Boolean),
    social_pamphlet: { ...socialPamphlet, preserve_aspect_ratio: preserveAspectRatio },
    social_video: Object.values(socialVideo).some(Boolean) ? socialVideo : null,
    speaker_background: speakerBackground || null,
    session_report: sessionReport || null,
    key_outcomes: keyOutcomes.filter(Boolean),
    conclusion: conclusion || null,
    // Add winners to session_report if included, for backend fallback if any
    ...(includeWinners && competitions.some(c => c.game) ? {
      session_report: (sessionReport || '') + '\n\nWinners:\n' + competitions.filter(c => c.game).map(c => 
        `- ${c.game}: Students(${c.studentWinners.filter(Boolean).length}), Faculty(${c.facultyWinners.filter(Boolean).length})`
      ).join('\n')
    } : {}),
  });

  // ── File helpers ───────────────────────────────────────────────────────────
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

  // ── DOCX Generation ────────────────────────────────────────────────────────
  const generateDocx = async (): Promise<Blob> => {
    const {
      Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun,
      Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType,
      ShadingType, ExternalHyperlink, Footer, PageNumber, Header, LevelFormat,
    } = await import('docx');

    // Helper to determine docx image type from file MIME or filename
    const getImageType = (file?: File | null, filename?: string): 'jpg' | 'png' | 'gif' | 'bmp' => {
      const mime = file?.type || '';
      const name = (file?.name || filename || '').toLowerCase();
      if (mime === 'image/png' || name.endsWith('.png')) return 'png';
      if (mime === 'image/gif' || name.endsWith('.gif')) return 'gif';
      if (mime === 'image/bmp' || name.endsWith('.bmp')) return 'bmp';
      return 'jpg'; // default for jpeg/jpg
    };

    const logoBufLeft = await fetchAsArrayBuffer(LOGO_PATH_LEFT);
    const logoBufRight = await fetchAsArrayBuffer(LOGO_PATH_RIGHT);
    const collaboratorLogoBufs = await Promise.all(collaboratorLogos.map(l => fileToArrayBuffer(l.file)));
    const collaboratorLogoTypes = collaboratorLogos.map(l => getImageType(l.file));
    const photoBufs = await Promise.all(photos.map(p => fileToArrayBuffer(p.file)));
    const photoTypes = photos.map(p => getImageType(p.file));
    const flierBuf = flier ? await fileToArrayBuffer(flier.file) : null;
    const flierType = flier ? getImageType(flier.file) : 'jpg';

    let flierDims = { width: 400, height: 300 };
    if (preserveAspectRatio && flier) {
      const dims = await getImageDimensions(flier.file);
      flierDims = scaleDimensions(dims.width, dims.height, 400, 300);
    }

    const photoDims = await Promise.all(
      photos.map(async (p) => {
        if (preserveAspectRatio) {
          const dims = await getImageDimensions(p.file);
          return scaleDimensions(dims.width, dims.height, 540, 360);
        }
        return { width: 540, height: 360 };
      })
    );

    const thinBorder = {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    };
    const noBorder = {
      top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    };

    const tr = (label: string, value: string) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 2808, type: WidthType.DXA },
            borders: thinBorder,
            shading: { fill: 'EFF6FF', type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 24, font: 'Times New Roman' })] })],
          }),
          new TableCell({
            width: { size: 6552, type: WidthType.DXA },
            borders: thinBorder,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: value || '—', size: 24, font: 'Times New Roman' })] })],
          }),
        ],
      });

    const h2 = (text: string) =>
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 24, font: 'Times New Roman' })],
        spacing: { before: 300, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'DBEAFE', space: 2 } },
      });

    const body2 = (text: string) =>
      new Paragraph({ children: [new TextRun({ text, size: 24, font: 'Times New Roman' })], spacing: { after: 80 } });

    const field = (label: string, value: string) =>
      new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, bold: true, size: 24, font: 'Times New Roman' }),
          new TextRun({ text: value || 'N/A', size: 24, font: 'Times New Roman' }),
        ],
        spacing: { after: 60 },
        indent: { left: 720 },
      });

    const spacer = () => new Paragraph({ text: '' });

    // Duration
    const durationHrs = Math.round(
      (new Date(event.end_datetime).getTime() - new Date(event.start_datetime).getTime()) / 3600000 * 100
    ) / 100;

    // Social links block helper
    const socialBlock = (links: SocialLinks) => {
      const platformOrder: ('facebook' | 'instagram' | 'x' | 'linkedin')[] = ['facebook', 'instagram', 'x', 'linkedin'];
      const items = platformOrder
        .map((platform): ['facebook' | 'instagram' | 'x' | 'linkedin', string] => [platform, links[platform] as string])
        .filter(([, v]) => v);
      
      return items.map(([platform, url], index) =>
        new Paragraph({
          children: [
            new TextRun({ text: `${index + 1}. `, bold: true, size: 24, font: 'Times New Roman' }),
            new TextRun({ text: `${platform.charAt(0).toUpperCase() + platform.slice(1)}: `, bold: true, size: 24, font: 'Times New Roman' }),
            new ExternalHyperlink({
              link: url,
              children: [new TextRun({ text: url, size: 24, font: 'Times New Roman', underline: {} })],
            }),
          ],
          spacing: { after: 60 },
          indent: { left: 720 },
        })
      );
    };

    const children: any[] = [
      // ── Title block ───────────────────────────────────────────────────────
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'RnD REPORT ON', bold: true, size: 24, font: 'Times New Roman' })],
        spacing: { before: 200, after: 60 },
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `"${event.title}"`, bold: true, size: 24, font: 'Times New Roman' })],
        spacing: { after: 120 },
      }),

      spacer(),

      // ── Guest Speaker(s) ──────────────────────────────────────────────────
      ...(speakers.filter(s => s.name).length > 0 ? [
        new Paragraph({
          children: [new TextRun({ text: 'Name and designation of the Guest Speakers/ Judges/ Mentors etc.:', bold: true, size: 24, font: 'Times New Roman' })],
          spacing: { before: 120, after: 60 },
        }),
        ...speakers.filter(s => s.name).flatMap((spk) => {
          let spkType = spk.speaker_type || 'Guest Speaker';
          if (spkType === 'Others') {
            spkType = spk.custom_speaker_type || 'Others';
          }
          return [
            new Paragraph({
              children: [new TextRun({ text: `${spkType}:`, bold: true, size: 24, font: 'Times New Roman' })],
              indent: { left: 720 },
              spacing: { before: 60, after: 40 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Name: ', bold: true, size: 24, font: 'Times New Roman' }),
                new TextRun({ text: spk.name, size: 24, font: 'Times New Roman' }),
              ],
              indent: { left: 1080 },
              spacing: { after: 40 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Designation: ', bold: true, size: 24, font: 'Times New Roman' }),
                new TextRun({ text: spk.designation || 'N/A', size: 24, font: 'Times New Roman' }),
              ],
              indent: { left: 1080 },
              spacing: { after: 40 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Organization: ', bold: true, size: 24, font: 'Times New Roman' }),
                new TextRun({ text: spk.organization || 'N/A', size: 24, font: 'Times New Roman' }),
              ],
              indent: { left: 1080 },
              spacing: { after: 40 },
            }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Area of Expertise: ', bold: true, size: 24, font: 'Times New Roman' }),
                new TextRun({ text: spk.expertise || 'N/A', size: 24, font: 'Times New Roman' }),
              ],
              indent: { left: 1080 },
              spacing: { after: 40 },
            }),
            spacer(),
          ];
        })
      ] : [
        new Paragraph({
          children: [
            new TextRun({ text: 'Name and designation of the Guest Speakers/ Judges/ Mentors etc.: ', bold: true, size: 24, font: 'Times New Roman' }),
            new TextRun({ text: 'N/A', size: 24, font: 'Times New Roman' }),
          ],
          spacing: { before: 120, after: 60 },
        }),
        spacer(),
      ]),

      // ── Venue & Dates ─────────────────────────────────────────────────────
      field('Venue', event.venue?.name || event.venue_custom || 'N/A'),
      field('Start Date', formatDateTime(event.start_datetime).split(',')[0]),
      field('End Date', formatDateTime(event.end_datetime).split(',')[0]),
      field('Time', `${formatDateTime(event.start_datetime)} – ${formatDateTime(event.end_datetime)}`),
      field('Duration (hrs)', String(durationHrs)),
      field('Department', event.school_department || 'N/A'),
      field('Organizing Club', event.club?.name || 'Non-Club Event'),
      spacer(),

      // ── Social Media Links ────────────────────────────────────────────────
      new Paragraph({ children: [new TextRun({ text: 'Link of Social Media Post of E-Pamphlet:', bold: true, size: 24, font: 'Times New Roman' })], spacing: { before: 80, after: 60 } }),
      ...(Object.values(socialPamphlet).some(Boolean) ? socialBlock(socialPamphlet) : [body2('  N/A')]),
      spacer(),
      new Paragraph({ children: [new TextRun({ text: 'Link of Social Media Post of Video:', bold: true, size: 24, font: 'Times New Roman' })], spacing: { before: 80, after: 60 } }),
      ...(Object.values(socialVideo).some(Boolean) ? socialBlock(socialVideo) : [body2('  N/A')]),
      spacer(),

      // ── Program Type ──────────────────────────────────────────────────────────
      field('Program Type', programType || 'N/A'),
      spacer(),

      // ── Objective & Learning ──────────────────────────────────────────
      field('Objective of the Activity (100 chars)', objective || 'N/A'),
      field('Benefit in Terms of Learning / Skills / Knowledge (150 chars)', learningBenefit || 'N/A'),
      spacer(),

      // ── Coordinators ──────────────────────────────────────────────────────────
      field('Faculty Coordinators', facultyCoordinators.filter(Boolean).join(', ') || 'N/A'),
      field('Student Coordinators', studentCoordinators.filter(Boolean).join(', ') || 'N/A'),
      spacer(),

      // ── Participants & Budget ─────────────────────────────────────────────────
      field('Number of Student Participants', studentCount || '0'),
      field('Number of Faculty Participants', facultyCount || '0'),
      field('Number of External Participants', externalCount || '0'),
      field('Total Participants', String((parseInt(studentCount) || 0) + (parseInt(facultyCount) || 0) + (parseInt(externalCount) || 0))),
      field('Estimated Budget', event.budget ? `Rs. ${Number(event.budget).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A'),
      field('Actual Expenditure', actualBudget ? `Rs. ${parseFloat(actualBudget).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A'),
      spacer(),

      // ── Mode of Session Delivery ──────────────────────────────────────────────
      field('Mode of Delivery', modeOfDelivery ? modeOfDelivery.charAt(0).toUpperCase() + modeOfDelivery.slice(1) : 'N/A'),
      spacer(),

      // ── Speaker Background ────────────────────────────────────────────
      field('Background of the Speaker(s)', speakerBackground || 'N/A'),
      spacer(),

      // ── Session Report ─────────────────────────────────────────────────
      new Paragraph({ children: [new TextRun({ text: 'Report on the Session:', bold: true, size: 24, font: 'Times New Roman' })], spacing: { before: 120, after: 60 } }),
      new Paragraph({ children: [new TextRun({ text: 'Session Summary:', bold: true, size: 24, font: 'Times New Roman' })], indent: { left: 720 }, spacing: { after: 40 } }),
      new Paragraph({ children: [new TextRun({ text: eventSummary || 'N/A', size: 24, font: 'Times New Roman' })], indent: { left: 720 }, spacing: { after: 60 } }),
      new Paragraph({ children: [new TextRun({ text: 'Detailed Session Report:', bold: true, size: 24, font: 'Times New Roman' })], indent: { left: 720 }, spacing: { before: 60, after: 40 } }),
      new Paragraph({ children: [new TextRun({ text: sessionReport || 'N/A', size: 24, font: 'Times New Roman' })], indent: { left: 720 }, spacing: { after: 60 } }),
      ...(issues ? [
        new Paragraph({ children: [new TextRun({ text: 'Issues Faced:', bold: true, size: 24, font: 'Times New Roman' })], indent: { left: 720 }, spacing: { before: 60, after: 40 } }),
        new Paragraph({ children: [new TextRun({ text: issues, size: 24, font: 'Times New Roman' })], indent: { left: 720 }, spacing: { after: 60 } }),
      ] : []),
      ...(feedback ? [
        new Paragraph({ children: [new TextRun({ text: 'Feedback and Suggestions:', bold: true, size: 24, font: 'Times New Roman' })], indent: { left: 720 }, spacing: { before: 60, after: 40 } }),
        new Paragraph({ children: [new TextRun({ text: feedback, size: 24, font: 'Times New Roman' })], indent: { left: 720 }, spacing: { after: 60 } }),
      ] : []),
      spacer(),

      // ── Key Outcomes ──────────────────────────────────────────────────────────
      new Paragraph({ children: [new TextRun({ text: 'Key Outcomes:', bold: true, size: 24, font: 'Times New Roman' })], spacing: { before: 120, after: 60 } }),
      ...(keyOutcomes.filter(Boolean).length > 0 ? (
        keyOutcomes.filter(Boolean).map(o =>
          new Paragraph({
            numbering: { reference: 'report-bullets', level: 0 },
            children: [new TextRun({ text: o, size: 24, font: 'Times New Roman' })],
          })
        )
      ) : [
        new Paragraph({ children: [new TextRun({ text: 'N/A', size: 24, font: 'Times New Roman' })], indent: { left: 720 } }),
      ]),
      spacer(),

      // ── Conclusion ─────────────────────────────────────────────────────
      field('Conclusion', conclusion || 'N/A'),
      spacer(),

      // ── Winners ──────────────────────────────────────────────────────────
      ...(includeWinners && competitions.some(c => c.game) ? [
        new Paragraph({ children: [new TextRun({ text: 'Winners:', bold: true, size: 24, font: 'Times New Roman' })], spacing: { after: 240 } }),
        ...competitions.filter(c => c.game).flatMap((comp) => [
          new Paragraph({ children: [new TextRun({ text: `The ${comp.game} award was presented to:`, bold: true, size: 24, font: 'Times New Roman' })], indent: { left: 720 }, spacing: { after: 120 } }),
          ...(comp.studentWinners.filter(Boolean).length > 0 ? [
            new Paragraph({ children: [new TextRun({ text: 'Student winners:', bold: true, size: 24, font: 'Times New Roman' })], indent: { left: 1080 }, spacing: { after: 120 } }),
            ...comp.studentWinners.filter(Boolean).map((win, wi) =>
              new Paragraph({
                children: [
                  new TextRun({ text: `${wi + 1}.\t`, size: 24, font: 'Times New Roman' }),
                  new TextRun({ text: win, size: 24, font: 'Times New Roman' }),
                ],
                indent: { left: 1440 },
                spacing: { after: 120 }
              })
            ),
          ] : []),
          ...(comp.facultyWinners.filter(Boolean).length > 0 ? [
            new Paragraph({ children: [new TextRun({ text: 'Faculty winners:', bold: true, size: 24, font: 'Times New Roman' })], indent: { left: 1080 }, spacing: { after: 120 } }),
            ...comp.facultyWinners.filter(Boolean).map((win, wi) =>
              new Paragraph({
                children: [
                   new TextRun({ text: `${wi + 1}.\t`, size: 24, font: 'Times New Roman' }),
                   new TextRun({ text: win, size: 24, font: 'Times New Roman' }),
                ],
                indent: { left: 1440 },
                spacing: { after: 120 }
              })
            ),
          ] : []),
          spacer(),
        ]),
      ] : []),

      // ── Glimpses of the Event ──────────────────────────────────────────
      new Paragraph({ children: [new TextRun({ text: 'Glimpses of the Event:', bold: true, size: 24, font: 'Times New Roman' })], spacing: { before: 120, after: 120 } }),

      // Flier
      ...(flierBuf ? [
        new Paragraph({ children: [new TextRun({ text: 'Event Flier:', bold: true, size: 24, font: 'Times New Roman' })], indent: { left: 720 }, spacing: { after: 120 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 240 },
          children: [new ImageRun({ data: flierBuf, transformation: flierDims, type: flierType })],
        }),
      ] : []),

      // Photos
      ...(photoBufs.length > 0 ? [
        new Paragraph({
          children: [new TextRun({ text: `Event Photos (${photoBufs.length} photographs):`, bold: true, size: 24, font: 'Times New Roman' })],
          indent: { left: 720 },
          spacing: { before: 120, after: 120 },
        }),
        ...photoBufs.map((buf, idx) =>
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [new ImageRun({ data: buf, transformation: photoDims[idx], type: photoTypes[idx] || 'jpg' })],
          })
        ),
      ] : []),
    ];

    const doc = new Document({
      numbering: {
        config: [
          {
            reference: 'report-bullets',
            levels: [
              {
                level: 0,
                format: LevelFormat.BULLET,
                text: '\u2022',
                alignment: AlignmentType.LEFT,
                style: {
                  paragraph: {
                    indent: { left: 720, hanging: 360 },
                  },
                },
              },
            ],
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
        children,
        headers: {
          default: new Header({
            children: collaboratorLogoBufs.length === 0
              ? [
                  // Simple layout without collaborator logos
                  new Paragraph({
                    children: [
                      logoBufLeft
                        ? new ImageRun({ data: logoBufLeft, transformation: { width: 120, height: 55 }, type: 'png' })
                        : new TextRun(''),
                      new TextRun({ text: '\t', }),
                      logoBufRight
                        ? new ImageRun({ data: logoBufRight, transformation: { width: 120, height: 55 }, type: 'png' })
                        : new TextRun(''),
                    ],
                    tabStops: [
                      {
                        type: 'right',
                        position: 8500,
                      },
                    ],
                  }),
                ]
              : [
                  // Layout with collaborator logos - logos in corners, collaborator logos in center
                  new Paragraph({
                    children: [
                      logoBufLeft
                        ? new ImageRun({ data: logoBufLeft, transformation: { width: 80, height: 40 }, type: 'png' })
                        : new TextRun(''),
                      new TextRun({ text: '\t', }),
                      ...collaboratorLogoBufs.map((buf, idx) =>
                        new ImageRun({ data: buf, transformation: { width: 80, height: 40 }, type: collaboratorLogoTypes[idx] || 'png' })
                      ),
                      new TextRun({ text: '\t', }),
                      logoBufRight
                        ? new ImageRun({ data: logoBufRight, transformation: { width: 80, height: 40 }, type: 'png' })
                        : new TextRun(''),
                    ],
                    tabStops: [
                      {
                        type: 'center',
                        position: 6120,
                      },
                      {
                        type: 'right',
                        position: 8500,
                      },
                    ],
                  }),
                ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 24,
                    font: 'Times New Roman',
                  }),
                ],
              }),
            ],
          }),
        },
      }],
    });

    return await Packer.toBlob(doc);
  };

  // ── Download ───────────────────────────────────────────────────────────────
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
      downloadFile(blob, `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_RnD_Report.docx`);
      toast.success('Word document downloaded');
    } catch (err) { console.error(err); toast.error('Failed to generate Word document'); }
    finally { setGenerating(false); }
  };

  const handleSubmit = async () => {
    if (!flier) { toast.error('Please upload the event flier'); return; }
    if (photos.length < MIN_PHOTOS) { toast.error(`Upload at least ${MIN_PHOTOS} event photos`); return; }
    if (objective.length > 100) { toast.error('Objective must be ≤ 100 characters'); return; }
    if (learningBenefit.length > 150) { toast.error('Learning benefit must be ≤ 150 characters'); return; }

    setSubmitting(true);
    try {
      // 1. Upload flier
      await rndReportService.uploadFlier(event.id, flier.file);
      // 2. Upload photos
      await rndReportService.uploadPhotos(event.id, photos.map(p => p.file));
      // 3. Submit structured report
      await rndReportService.submitReport(event.id, buildPayload());
      toast.success('RnD Report submitted successfully!');
      onComplete();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 animate-fade-in">

      {/* Collaborator Logos */}
      <SectionCard title="Collaborator Logos (Header)" icon={<ImageIcon className="w-4 h-4" />} defaultOpen={true}>
        <p className="text-xs text-[var(--text-muted)] -mt-1 mb-3">Upload up to {MAX_COLLABORATOR_LOGOS} additional collaborator logos. These will appear in the report header in a single line.</p>
        <div className="grid grid-cols-4 gap-3">
          {collaboratorLogos.map((logo, idx) => (
            <div key={logo.id} className="relative group rounded-xl overflow-hidden border border-[var(--card-border)] aspect-[2/1]">
              <img src={logo.preview} alt={`Collaborator Logo ${idx + 1}`} className="w-full h-full object-contain bg-white" />
              <button
                type="button"
                onClick={() => removeCollaboratorLogo(logo.id)}
                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {collaboratorLogos.length < MAX_COLLABORATOR_LOGOS && (
            <button
              type="button"
              onClick={() => collaboratorLogoRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[var(--input-border)] aspect-[2/1] hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            >
              <Upload className="w-5 h-5 text-[var(--text-muted)]" />
              <span className="text-[10px] text-[var(--text-muted)]">Add Logo</span>
            </button>
          )}
        </div>
        <input ref={collaboratorLogoRef} type="file" className="hidden" accept=".jpg,.jpeg,.png" multiple onChange={handleCollaboratorLogoSelect} />
      </SectionCard>

      {/* Auto-filled event details */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100">
        <h3 className="text-sm font-display font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Event Details
          <span className="text-xs font-normal text-[var(--text-muted)]">(auto-filled)</span>
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><span className="font-medium text-[var(--text-secondary)]">Title:</span> <span className="text-[var(--text-primary)]">{event.title}</span></div>
          <div><span className="font-medium text-[var(--text-secondary)]">Type:</span> <span className="text-[var(--text-primary)] capitalize">{event.event_type}</span></div>
          <div><span className="font-medium text-[var(--text-secondary)]">Start:</span> <span className="text-[var(--text-primary)]">{formatDateTime(event.start_datetime)}</span></div>
          <div><span className="font-medium text-[var(--text-secondary)]">End:</span> <span className="text-[var(--text-primary)]">{formatDateTime(event.end_datetime)}</span></div>
          <div><span className="font-medium text-[var(--text-secondary)]">Venue:</span> <span className="text-[var(--text-primary)]">{event.venue?.name || event.venue_custom || '—'}</span></div>
          <div><span className="font-medium text-[var(--text-secondary)]">Dept:</span> <span className="text-[var(--text-primary)]">{event.school_department || '—'}</span></div>
        </div>
      </div>

      {/* ── Program Info ─────────────────────────────────────────────────────── */}
      <SectionCard title="Program Info" icon={<BookOpen className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <Label>Program Type</Label>
            <div className="relative">
              <Select value={programType} onChange={e => setProgramType(e.target.value)}>
                <option value="">— Select —</option>
                {PROGRAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </Field>
          <Field>
            <Label>Mode of Delivery</Label>
            <div className="relative">
              <Select value={modeOfDelivery} onChange={e => setModeOfDelivery(e.target.value as any)}>
                <option value="">— Select —</option>
                <option value="offline">Offline</option>
                <option value="online">Online</option>
              </Select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </Field>
        </div>
        <Field>
          <div className="flex items-center justify-between mb-1.5">
            <Label>Objective of the Activity (100 Characters)</Label>
            <CharCount value={objective} max={100} />
          </div>
          <Textarea
            rows={2}
            placeholder="100 characters strict…"
            value={objective}
            onChange={e => setObjective(e.target.value)}
            maxLength={100}
          />
        </Field>
        <Field>
          <div className="flex items-center justify-between mb-1.5">
            <Label>Benefit in Terms of Learning / Skills / Knowledge (150 Characters)</Label>
            <CharCount value={learningBenefit} max={150} />
          </div>
          <Textarea
            rows={2}
            placeholder="150 characters strict…"
            value={learningBenefit}
            onChange={e => setLearningBenefit(e.target.value)}
            maxLength={150}
          />
        </Field>
      </SectionCard>

      {/* ── Guest Speakers ────────────────────────────────────────────────────── */}
      <SectionCard title="Name and designation of the Guest Speakers/ Judges/ Mentors etc.:" icon={<Mic className="w-4 h-4" />}>
        {speakers.map((spk, i) => (
          <div key={i} className="p-4 rounded-xl border border-[var(--card-border)] bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Speaker {i + 1}</span>
              {speakers.length > 1 && (
                <button type="button" onClick={() => removeSpeaker(i)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <Label>Speaker Type</Label>
                <div className="relative">
                  <Select value={spk.speaker_type || 'Guest Speaker'} onChange={e => updateSpeaker(i, 'speaker_type', e.target.value)}>
                    <option value="Guest Speaker">Guest Speaker</option>
                    <option value="Judge">Judge</option>
                    <option value="Mentor">Mentor</option>
                    <option value="Others">Others</option>
                  </Select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>
              {spk.speaker_type === 'Others' && (
                <Field>
                  <Label required>Custom Speaker Type</Label>
                  <Input placeholder="e.g. Industry Expert, Chief Guest" value={spk.custom_speaker_type || ''} onChange={e => updateSpeaker(i, 'custom_speaker_type', e.target.value)} />
                </Field>
              )}
              <Field><Label required>Name</Label><Input placeholder="Full name" value={spk.name} onChange={e => updateSpeaker(i, 'name', e.target.value)} /></Field>
              <Field><Label>Designation</Label><Input placeholder="e.g. CEO, Professor" value={spk.designation} onChange={e => updateSpeaker(i, 'designation', e.target.value)} /></Field>
              <Field><Label>Organization</Label><Input placeholder="Company / Institution" value={spk.organization} onChange={e => updateSpeaker(i, 'organization', e.target.value)} /></Field>
              <Field><Label>Area of Expertise</Label><Input placeholder="e.g. AI, Finance" value={spk.expertise} onChange={e => updateSpeaker(i, 'expertise', e.target.value)} /></Field>
            </div>
          </div>
        ))}
        <button type="button" onClick={addSpeaker} className="w-full py-2.5 flex items-center justify-center gap-2 text-sm text-blue-600 rounded-xl border-2 border-dashed border-blue-200 hover:bg-blue-50 transition-colors">
          <Plus className="w-4 h-4" /> Add Speaker
        </button>
        <Field>
          <Label>Background of the Speaker(s)</Label>
          <Textarea rows={4} placeholder="Detailed background, achievements, credentials…" value={speakerBackground} onChange={e => setSpeakerBackground(e.target.value)} />
        </Field>
      </SectionCard>

      {/* ── Social Media Links ────────────────────────────────────────────────── */}
      <SectionCard title="Social Media Links" icon={<Link className="w-4 h-4" />} defaultOpen={false}>
        <p className="text-xs text-[var(--text-muted)] -mt-1">Leave blank if not applicable.</p>
        {([
          ['E-Pamphlet Links', socialPamphlet, setSocialPamphlet],
          ['Video Post Links', socialVideo, setSocialVideo],
        ] as const).map(([label, state, setter]) => (
          <div key={label}>
            <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">{label}</p>
            <div className="grid grid-cols-2 gap-3">
              {(['facebook', 'instagram', 'x', 'linkedin'] as const).map(platform => (
                <Field key={platform}>
                  <Label>{platform === 'x' ? 'X.com' : platform.charAt(0).toUpperCase() + platform.slice(1)}</Label>
                  <Input
                    placeholder="https://…"
                    value={state[platform]}
                    onChange={e => setter(prev => ({ ...prev, [platform]: e.target.value }))}
                  />
                </Field>
              ))}
            </div>
          </div>
        ))}
      </SectionCard>

      {/* ── Coordinators ─────────────────────────────────────────────────────── */}
      <SectionCard title="Coordinators" icon={<Users className="w-4 h-4" />} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-6">
          {([
            ['Faculty Coordinators', facultyCoordinators, setFacultyCoordinators],
            ['Student Coordinators', studentCoordinators, setStudentCoordinators],
          ] as const).map(([label, list, setter]) => (
            <div key={label}>
              <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">{label}</p>
              <div className="space-y-2">
                {list.map((name, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="Full name"
                      value={name}
                      onChange={e => updateCoord(list, setter, i, e.target.value)}
                    />
                    {list.length > 1 && (
                      <button type="button" onClick={() => removeCoord(list, setter, i)} className="text-red-400 hover:text-red-600 shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addCoord(list, setter)} className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Participants & Budget ─────────────────────────────────────────────── */}
      <SectionCard title="Participants & Expenditure" icon={<User className="w-4 h-4" />}>
        <div className="grid grid-cols-3 gap-3">
          <Field><Label>Student Participants</Label><Input type="number" min="0" placeholder="0" value={studentCount} onChange={e => setStudentCount(e.target.value)} /></Field>
          <Field><Label>Faculty Participants</Label><Input type="number" min="0" placeholder="0" value={facultyCount} onChange={e => setFacultyCount(e.target.value)} /></Field>
          <Field><Label>External Participants</Label><Input type="number" min="0" placeholder="0" value={externalCount} onChange={e => setExternalCount(e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-sm">
            <span className="text-[var(--text-muted)]">Total: </span>
            <span className="font-bold text-blue-700">
              {(parseInt(studentCount) || 0) + (parseInt(facultyCount) || 0) + (parseInt(externalCount) || 0)}
            </span>
          </div>
          <Field>
            <Label required>Actual Expenditure (Rs.)</Label>
            <Input type="number" min="0" step="0.01" placeholder="0.00" value={actualBudget} onChange={e => setActualBudget(e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      {/* ── Session Report ────────────────────────────────────────────────────── */}
      <SectionCard title="Session Report" icon={<AlignLeft className="w-4 h-4" />}>
        <Field>
          <Label required>Event Summary</Label>
          <Textarea rows={3} placeholder="Brief summary of the event…" value={eventSummary} onChange={e => setEventSummary(e.target.value)} />
        </Field>
        <Field>
          <Label>Detailed Session Report</Label>
          <Textarea rows={5} placeholder="Comprehensive report with key outcomes…" value={sessionReport} onChange={e => setSessionReport(e.target.value)} />
        </Field>
        <Field>
          <Label>Key Outcomes of the Event</Label>
          <div className="space-y-2">
            {keyOutcomes.map((o, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="text-blue-500 text-xs font-bold shrink-0">•</span>
                <Input placeholder={`Outcome ${i + 1}`} value={o} onChange={e => updateOutcome(i, e.target.value)} />
                {keyOutcomes.length > 1 && (
                  <button type="button" onClick={() => removeOutcome(i)} className="text-red-400 hover:text-red-600 shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addOutcome} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add outcome
            </button>
          </div>
        </Field>
        <Field>
          <Label>Conclusion</Label>
          <Textarea rows={3} placeholder="Concluding remarks…" value={conclusion} onChange={e => setConclusion(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <Label>Issues Faced</Label>
            <Textarea rows={2} placeholder="Any issues encountered…" value={issues} onChange={e => setIssues(e.target.value)} />
          </Field>
          <Field>
            <Label>Feedback & Suggestions</Label>
            <Textarea rows={2} placeholder="Feedback received…" value={feedback} onChange={e => setFeedback(e.target.value)} />
          </Field>
        </div>
      </SectionCard>

      {/* ── Winners Panel ─────────────────────────────────────────────────────── */}
      <SectionCard title="Winners" icon={<Target className="w-4 h-4" />} defaultOpen={false}>
        <div className="flex items-center gap-3 mb-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[var(--text-primary)]">
            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded cursor-pointer" checked={includeWinners} onChange={e => setIncludeWinners(e.target.checked)} />
            Include Winners Section in Report
          </label>
        </div>
        
        {includeWinners && (
          <div className="space-y-6">
            {competitions.map((comp, ci) => (
              <div key={ci} className="p-4 rounded-xl border border-[var(--card-border)] bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[var(--text-primary)]">Competition {ci + 1}</span>
                  {competitions.length > 1 && (
                    <button type="button" onClick={() => removeCompetition(ci)} className="text-red-400 hover:text-red-600 text-xs font-semibold px-2">
                      <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Remove
                    </button>
                  )}
                </div>
                
                <Field>
                  <Label required>Game / Competition Name</Label>
                  <Input placeholder="e.g. Best Traditional Attire" value={comp.game} onChange={e => updateCompetition(ci, 'game', e.target.value)} />
                </Field>

                <div className="grid grid-cols-2 gap-6 pt-2">
                  {/* Student Winners */}
                  <div>
                    <Label>Student Winners</Label>
                    <div className="space-y-2 mt-1.5">
                      {comp.studentWinners.map((win, wi) => (
                        <div key={wi} className="flex gap-2 items-center">
                          <span className="text-xs font-bold text-slate-400 w-4">{wi + 1}.</span>
                          <Input placeholder="Student details..." value={win} onChange={e => updateWinner(ci, 'studentWinners', wi, e.target.value)} />
                          {comp.studentWinners.length > 1 && (
                            <button type="button" onClick={() => removeWinner(ci, 'studentWinners', wi)} className="text-red-400 hover:text-red-600 shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addWinner(ci, 'studentWinners')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Student
                      </button>
                    </div>
                  </div>

                  {/* Faculty Winners */}
                  <div>
                    <Label>Faculty Winners</Label>
                    <div className="space-y-2 mt-1.5">
                      {comp.facultyWinners.map((win, wi) => (
                        <div key={wi} className="flex gap-2 items-center">
                          <span className="text-xs font-bold text-slate-400 w-4">{wi + 1}.</span>
                          <Input placeholder="Faculty details..." value={win} onChange={e => updateWinner(ci, 'facultyWinners', wi, e.target.value)} />
                          {comp.facultyWinners.length > 1 && (
                            <button type="button" onClick={() => removeWinner(ci, 'facultyWinners', wi)} className="text-red-400 hover:text-red-600 shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => addWinner(ci, 'facultyWinners')} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Faculty
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <button type="button" onClick={addCompetition} className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 rounded-xl border-2 border-dashed border-blue-200 hover:bg-blue-50 transition-colors">
              <Plus className="w-4 h-4" /> Add Another Game/Competition
            </button>
          </div>
        )}
      </SectionCard>

      {/* ── Flier Upload ──────────────────────────────────────────────────────── */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-2">
          <ImageIcon className="w-4 h-4" />
          Event Flier
          <span className="text-red-500">*</span>
          <span className="text-[var(--text-muted)] font-normal text-xs">— 1 compulsory</span>
        </label>
        {flier ? (
          <div className="relative w-40 rounded-xl overflow-hidden border border-[var(--card-border)] group">
            <img src={flier.preview} alt="Flier" className="w-full aspect-[3/4] object-cover" />
            <button
              type="button"
              onClick={() => { URL.revokeObjectURL(flier.preview); setFlier(null); }}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => flierRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 w-40 aspect-[3/4] rounded-xl border-2 border-dashed border-[var(--input-border)] hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
          >
            <Upload className="w-6 h-6 text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-muted)]">Upload Flier</span>
          </button>
        )}
        <input ref={flierRef} type="file" className="hidden" accept=".jpg,.jpeg,.png" onChange={handleFlierSelect} />
      </div>

      {/* ── Photo Upload ──────────────────────────────────────────────────────── */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-2">
          <ImageIcon className="w-4 h-4" />
          Event Photos ({photos.length}/{MAX_PHOTOS})
          <span className="text-red-500">*</span>
          <span className="text-[var(--text-muted)] font-normal text-xs">— {MIN_PHOTOS}–{MAX_PHOTOS} required</span>
        </label>
        <div className="grid grid-cols-5 gap-3">
          {photos.map((photo, idx) => (
            <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-[var(--card-border)] aspect-square">
              <img src={photo.preview} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
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

      {/* ── Image Aspect Ratio Checkbox ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <input
          id="preserveAspectRatio"
          type="checkbox"
          checked={preserveAspectRatio}
          onChange={e => setPreserveAspectRatio(e.target.checked)}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
        />
        <label htmlFor="preserveAspectRatio" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
          Preserve Original Image Aspect Ratio (Scale proportionally without distortion)
        </label>
      </div>

      {/* ── Preview Button ────────────────────────────────────────────────────── */}
      <Button disabled={!canPreview} onClick={() => setShowPreview(true)} className="w-full justify-center py-3" icon={<Eye className="w-4 h-4" />}>
        Generate Preview
      </Button>
      {!canPreview && (
        <p className="text-xs text-center text-[var(--text-muted)] -mt-3">
          Fill Event Summary, Actual Budget, upload flier + {MIN_PHOTOS} photos to preview.
        </p>
      )}

      {/* ── Preview ───────────────────────────────────────────────────────────── */}
      {showPreview && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-[var(--card-border)]" />
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Document Preview</span>
            <div className="h-px flex-1 bg-[var(--card-border)]" />
          </div>

          <div ref={previewRef} className="bg-white rounded-2xl border border-[var(--card-border)] shadow-card overflow-hidden text-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-4 border-[#1E3A5F]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_PATH_LEFT} alt="NMIMS Logo" className="w-12 h-6 object-contain shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className="flex items-center gap-2">
                {collaboratorLogos.map((logo, idx) => (
                  <img key={logo.id} src={logo.preview} alt={`Collaborator ${idx + 1}`} className="w-12 h-6 object-contain shrink-0" />
                ))}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_PATH_RIGHT} alt="ICC Logo" className="w-12 h-6 object-contain shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>

            {/* Title */}
            <div className="text-center py-4">
              <p className="font-bold text-lg text-black font-serif">RnD REPORT ON</p>
              <p className="font-bold text-base text-black font-serif">"{event.title}"</p>
            </div>

            <div className="px-8 py-6 space-y-5 text-left">
              {/* Guest Speakers */}
              {speakers.filter(s => s.name).length > 0 ? (
                <div className="space-y-3">
                  <p className="text-black font-serif text-xs font-bold">Name and designation of the Guest Speakers/ Judges/ Mentors etc.:</p>
                  {speakers.filter(s => s.name).map((spk, idx) => {
                    let spkType = spk.speaker_type || 'Guest Speaker';
                    if (spkType === 'Others') {
                      spkType = spk.custom_speaker_type || 'Others';
                    }
                    return (
                      <div key={idx} className="space-y-0.5 pl-4">
                        <p className="text-black font-serif text-xs font-bold">{spkType}:</p>
                        <p className="text-black font-serif text-xs pl-4"><span className="font-bold">Name:</span> {spk.name}</p>
                        <p className="text-black font-serif text-xs pl-4"><span className="font-bold">Designation:</span> {spk.designation || '—'}</p>
                        <p className="text-black font-serif text-xs pl-4"><span className="font-bold">Organization:</span> {spk.organization || '—'}</p>
                        <p className="text-black font-serif text-xs pl-4"><span className="font-bold">Area of Expertise:</span> {spk.expertise || '—'}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-black font-serif text-xs"><span className="font-bold">Name and designation of the Guest Speakers/ Judges/ Mentors etc.:</span> N/A</p>
              )}

              {/* Venue & Dates */}
              <p className="text-black font-serif text-xs"><span className="font-bold">Venue:</span> {event.venue?.name || event.venue_custom || '—'}</p>
              <p className="text-black font-serif text-xs"><span className="font-bold">Start Date:</span> {formatDateTime(event.start_datetime)}</p>
              <p className="text-black font-serif text-xs"><span className="font-bold">End Date:</span> {formatDateTime(event.end_datetime)}</p>
              <p className="text-black font-serif text-xs"><span className="font-bold">Time:</span> {formatDateTime(event.start_datetime)} – {formatDateTime(event.end_datetime)}</p>
              <p className="text-black font-serif text-xs"><span className="font-bold">Duration (hrs):</span> {((new Date(event.end_datetime).getTime() - new Date(event.start_datetime).getTime()) / 3600000).toFixed(2)}</p>
              <p className="text-black font-serif text-xs"><span className="font-bold">Department:</span> {event.school_department || '—'}</p>
              <p className="text-black font-serif text-xs"><span className="font-bold">Organizing Club:</span> {event.club?.name || 'Non-Club Event'}</p>

              {/* Social Media Links */}
              <div className="space-y-1">
                <p className="text-black font-serif text-xs font-bold">Link of Social Media Post of E-Pamphlet:</p>
                {Object.values(socialPamphlet).some(Boolean) ? (
                  ((['linkedin', 'facebook', 'instagram', 'x'] as const).map(platform => {
                    const url = socialPamphlet[platform];
                    return url ? (
                      <p key={platform} className="text-black font-serif text-xs pl-4">
                        • <span className="font-bold">{platform.charAt(0).toUpperCase() + platform.slice(1)}:</span> <a href={url} className="text-blue-600 underline break-all">{url}</a>
                      </p>
                    ) : null;
                  }))
                ) : (
                  <p className="text-black font-serif text-xs pl-4">N/A</p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-black font-serif text-xs font-bold">Link of Social Media Post of Video:</p>
                {Object.values(socialVideo).some(Boolean) ? (
                  ((['linkedin', 'facebook', 'instagram', 'x'] as const).map(platform => {
                    const url = socialVideo[platform];
                    return url ? (
                      <p key={platform} className="text-black font-serif text-xs pl-4">
                        • <span className="font-bold">{platform.charAt(0).toUpperCase() + platform.slice(1)}:</span> <a href={url} className="text-blue-600 underline break-all">{url}</a>
                      </p>
                    ) : null;
                  }))
                ) : (
                  <p className="text-black font-serif text-xs pl-4">N/A</p>
                )}
              </div>

              {/* Program Type */}
              <p className="text-black font-serif text-xs"><span className="font-bold">Program Type:</span> {programType || '—'}</p>

              {/* Objective of the Activity */}
              <p className="text-black font-serif text-xs whitespace-pre-wrap"><span className="font-bold">Objective of the Activity (100 chars):</span> {objective || '—'}</p>

              {/* Benefit in Terms of Learning */}
              <p className="text-black font-serif text-xs whitespace-pre-wrap"><span className="font-bold">Benefit in Terms of Learning / Skills / Knowledge (150 chars):</span> {learningBenefit || '—'}</p>

              {/* Coordinators */}
              <p className="text-black font-serif text-xs"><span className="font-bold">Faculty Coordinators:</span> {facultyCoordinators.filter(Boolean).join(', ') || 'N/A'}</p>
              <p className="text-black font-serif text-xs"><span className="font-bold">Student Coordinators:</span> {studentCoordinators.filter(Boolean).join(', ') || 'N/A'}</p>

              {/* Participants */}
              <p className="text-black font-serif text-xs"><span className="font-bold">Number of Student Participants:</span> {studentCount || '0'}</p>
              <p className="text-black font-serif text-xs"><span className="font-bold">Number of Faculty Participants:</span> {facultyCount || '0'}</p>
              <p className="text-black font-serif text-xs"><span className="font-bold">Number of External Participants:</span> {externalCount || '0'}</p>
              <p className="text-black font-serif text-xs"><span className="font-bold">Total Participants:</span> {String((parseInt(studentCount) || 0) + (parseInt(facultyCount) || 0) + (parseInt(externalCount) || 0))}</p>
              
              {/* Budget */}
              <p className="text-black font-serif text-xs"><span className="font-bold">Estimated Budget:</span> {event.budget ? `Rs. ${event.budget.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}</p>
              <p className="text-black font-serif text-xs"><span className="font-bold">Actual Expenditure:</span> {actualBudget ? `Rs. ${parseFloat(actualBudget).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}</p>

              {/* Mode of Session Delivery */}
              <p className="text-black font-serif text-xs"><span className="font-bold">Mode of Delivery:</span> {modeOfDelivery ? modeOfDelivery.charAt(0).toUpperCase() + modeOfDelivery.slice(1) : '—'}</p>

              {/* Speaker Background */}
              <p className="text-black font-serif text-xs whitespace-pre-wrap"><span className="font-bold">Background of the Speaker(s):</span> {speakerBackground || '—'}</p>

              {/* Report on the Session */}
              <div className="space-y-2">
                <p className="text-black font-serif text-xs font-bold">Report on the Session:</p>
                <p className="text-black font-serif text-xs font-bold pl-4">Session Summary:</p>
                <p className="text-black font-serif text-xs whitespace-pre-wrap pl-4">{eventSummary || '—'}</p>
                <p className="text-black font-serif text-xs font-bold pl-4">Detailed Session Report:</p>
                <p className="text-black font-serif text-xs whitespace-pre-wrap pl-4">{sessionReport || '—'}</p>
                {issues && (
                  <>
                    <p className="text-black font-serif text-xs font-bold pl-4">Issues Faced:</p>
                    <p className="text-black font-serif text-xs whitespace-pre-wrap pl-4">{issues}</p>
                  </>
                )}
                {feedback && (
                  <>
                    <p className="text-black font-serif text-xs font-bold pl-4">Feedback and Suggestions:</p>
                    <p className="text-black font-serif text-xs whitespace-pre-wrap pl-4">{feedback}</p>
                  </>
                )}
              </div>

              {/* Key Outcomes */}
              <div className="space-y-1">
                <p className="text-black font-serif text-xs font-bold">Key Outcomes:</p>
                {keyOutcomes.filter(Boolean).length > 0 ? (
                  keyOutcomes.filter(Boolean).map((o, idx) => (
                    <p key={idx} className="text-black font-serif text-xs pl-4">• {o}</p>
                  ))
                ) : (
                  <p className="text-black font-serif text-xs pl-4">N/A</p>
                )}
              </div>

              {/* Conclusion */}
              <p className="text-black font-serif text-xs whitespace-pre-wrap"><span className="font-bold">Conclusion:</span> {conclusion || '—'}</p>

              {/* Winners */}
              {includeWinners && competitions.some(c => c.game) && (
                <div className="space-y-2">
                  <p className="text-black font-serif text-xs font-bold">Winners:</p>
                  {competitions.filter(c => c.game).map((comp, ci) => (
                    <div key={ci} className="pl-4 space-y-1">
                      <p className="text-black font-serif text-xs font-bold">The {comp.game} award was presented to:</p>
                      {comp.studentWinners.filter(Boolean).length > 0 && (
                        <div>
                          <p className="text-black font-serif text-xs font-bold">Student winners:</p>
                          {comp.studentWinners.filter(Boolean).map((win, wi) => (
                            <p key={wi} className="text-black font-serif text-xs pl-4">{wi + 1}. {win}</p>
                          ))}
                        </div>
                      )}
                      {comp.facultyWinners.filter(Boolean).length > 0 && (
                        <div>
                          <p className="text-black font-serif text-xs font-bold">Faculty winners:</p>
                          {comp.facultyWinners.filter(Boolean).map((win, wi) => (
                            <p key={wi} className="text-black font-serif text-xs pl-4">{wi + 1}. {win}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Flier */}
              {flier && (
                <div className="space-y-1">
                  <p className="text-black font-serif text-xs font-bold">Event Flier:</p>
                  <div className="pl-4">
                    <img src={flier.preview} alt="Flier" className={`max-w-[200px] rounded-lg border ${preserveAspectRatio ? 'object-contain' : 'object-cover'}`} />
                  </div>
                </div>
              )}

              {/* Photos */}
              {photos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-black font-serif text-xs font-bold">Event Photos ({photos.length}):</p>
                  <div className="grid grid-cols-2 gap-3 pl-4">
                    {photos.map((p, i) => (
                      <img key={p.id} src={p.preview} alt={`Photo ${i + 1}`} className={`w-full rounded-lg ${preserveAspectRatio ? 'object-contain' : 'object-cover'}`} style={{ maxHeight: 200 }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={handleDownloadDocx} loading={generating} icon={<Download className="w-4 h-4" />} className="justify-center py-3">
              Download Word (.docx)
            </Button>
            <Button onClick={handleSubmit} loading={submitting} icon={<Send className="w-4 h-4" />} className="justify-center py-3">
              Submit RnD Report
            </Button>
          </div>

          <Alert type="info">
            <AlertTriangle className="w-4 h-4 shrink-0 text-blue-500" />
            <span>Submitting will record the <strong>RnD report</strong> for this event.</span>
          </Alert>
        </div>
      )}
    </div>
  );
}

// ─── Preview helpers ──────────────────────────────────────────────────────────

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-bold text-black font-serif border-b border-slate-100 pb-1 mb-2">{title}</p>
      {children}
    </div>
  );
}

function PreviewTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="space-y-1">
      {rows.filter(([, v]) => v).map(([label, value]) => (
        <div key={label} className="flex pl-6">
          <span className="font-semibold text-black font-serif text-xs">{label}: </span>
          <span className="text-black font-serif text-xs">{value}</span>
        </div>
      ))}
    </div>
  );
}

// Alias for the icon used inside session card
const AlignLeft = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="13" y1="18" x2="3" y2="18" />
  </svg>
);
