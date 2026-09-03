'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Info, Calendar, MapPin, Monitor, UtensilsCrossed,
  Package, FileText, ChevronRight, ChevronLeft, Save, Send, ArrowLeft, Plus, Trash2, FlaskConical,
  IndianRupee
} from 'lucide-react';
import { Button, Input, Select, Textarea, Toggle, Alert, Combobox } from '@/components/ui';
import { eventService, venueService, clubService, departmentService } from '@/lib/services';
import { useAuthStore } from '@/store/authStore';
import { TermsModal } from '@/components/shared/TermsModal';
import toast from 'react-hot-toast';

/** Convert a datetime-local input value (local time, no TZ) to a UTC ISO string for the API */
const toUTCISOString = (localDatetime: string): string => {
  if (!localDatetime) return localDatetime;
  const date = new Date(localDatetime);
  if (isNaN(date.getTime())) return localDatetime;
  return date.toISOString();
};

/** Convert a UTC ISO string from the API to local datetime-local string (YYYY-MM-DDTHH:mm) */
const formatDateTimeForInput = (isoString?: string): string => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localIsoTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, -1);
  return localIsoTime.substring(0, 16);
};

const budgetItemSchema = z.object({
  category: z.string().optional(),
  amount: z.coerce.number().optional(),
  description: z.string().optional(),
});

const schema = z.object({
  // Section A
  title: z.string().min(3, 'Title required'),
  event_type: z.string().min(1, 'Select event type'),
  school_department: z.string().optional(),
  departments_involved: z.array(z.string()).min(1, 'Select at least one department'),
  faculty_involved_emails: z.array(z.string()).optional(),
  event_incharge_name: z.string().min(2, 'Incharge name required'),
  event_incharge_contact: z.string().min(10, 'Valid contact required'),
  target_audience: z.string().optional(),
  is_club_event: z.boolean(),
  is_collaborative: z.boolean(),
  collaborating_club_ids: z.array(z.number()).optional(),
  is_sponsored: z.boolean(),
  sponsor_name: z.string().optional(),
  objectives: z.array(z.string()).optional(),
  // Section B
  start_datetime: z.string().min(1, 'Start date/time required'),
  end_datetime: z.string().min(1, 'End date/time required'),
  registration_start_datetime: z.string().optional(),
  registration_deadline: z.string().optional(),
  // Section C
  venue_selections: z.array(z.object({
    venue_type: z.string().min(1, 'Select venue type'),
    venue_ids: z.array(z.number()).optional(),
  })).min(1, 'Add at least one venue block'),
  venue_ids: z.array(z.number()).optional(),
  venue_custom: z.string().optional(),
  venue_type: z.string().optional(), // Now derived
  venue_has_children: z.boolean().default(false),
  seating_arrangement: z.string().optional(),
  seating_other_detail: z.string().optional(),
  tables_required: z.string().optional(),
  chairs_required: z.string().optional(),
  podium_setup: z.boolean().default(false),
  podium_details: z.string().optional(),
  decoration: z.boolean().default(false),
  decoration_details: z.string().optional(),
  // Section D
  it_projector: z.boolean(),
  it_audio: z.boolean(),
  it_audio_details: z.string().optional(),
  it_wifi: z.boolean(),
  it_laptop: z.boolean(),
  it_laptop_details: z.string().optional(),
  it_other: z.string().optional(),
  // Section E
  food_items: z.boolean(),
  food_details: z.string().optional(),
  beverage_items: z.boolean(),
  beverage_details: z.string().optional(),
  pax_count: z.coerce.number().optional(),
  food_service_time: z.string().optional(),
  // Section F
  transport: z.boolean(),
  transport_details: z.string().optional(),
  security: z.boolean(),
  security_details: z.string().optional(),
  printing: z.boolean(),
  printing_details: z.string().optional(),
  volunteers: z.boolean(),
  volunteers_details: z.string().optional(),
  other_requirements: z.string().optional(),
  // Section G
  budget: z.coerce.number().optional(),
  budget_breakdown: z.array(budgetItemSchema).optional(),
  comments: z.string().optional(),
  // R&D
  is_rnd_event: z.boolean().default(false),
  rnd_activity_theme: z.string().optional(),
  rnd_prescribed_activity: z.string().optional(),
  rnd_semester_quarter: z.string().optional(),
  rnd_tentative_date: z.string().optional(),
  outside_campus_registration: z.boolean().default(false),
  registration_accepted: z.boolean().default(false),
  student_registration_enabled: z.boolean().default(false),
  faculty_registration_enabled: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.budget_breakdown && data.budget_breakdown.length > 0) {
    let sum = 0;
    for (let i = 0; i < data.budget_breakdown.length; i++) {
      const item = data.budget_breakdown[i];
      const hasCat = !!(item.category && item.category.trim() !== '');
      const hasAmt = item.amount !== undefined && !isNaN(item.amount) && item.amount > 0;
      if (hasAmt && !hasCat) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Category is required when amount is entered', path: ['budget_breakdown', i, 'category'] });
      }
      if (item.amount !== undefined && !isNaN(item.amount) && item.amount < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Amount cannot be negative', path: ['budget_breakdown', i, 'amount'] });
      }
      sum += (hasAmt ? Number(item.amount) : 0);
    }
  }
  if (data.start_datetime && data.end_datetime) {
    const start = new Date(data.start_datetime);
    const end = new Date(data.end_datetime);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End date & time must be after start date & time', path: ['end_datetime'] });
    }
  }
  if (data.registration_accepted || data.outside_campus_registration) {
    if (!data.registration_start_datetime || data.registration_start_datetime.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Registration Start Date & Time is required when Registration Accepted is ON', path: ['registration_start_datetime'] });
    }
    if (!data.registration_deadline || data.registration_deadline.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Registration End Date & Time is required when Registration Accepted is ON', path: ['registration_deadline'] });
    }
  }
  if (data.registration_start_datetime && data.registration_deadline) {
    const regStart = new Date(data.registration_start_datetime);
    const regEnd = new Date(data.registration_deadline);
    if (!isNaN(regStart.getTime()) && !isNaN(regEnd.getTime()) && regEnd < regStart) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Student registration end date & time cannot be earlier than start date & time', path: ['registration_deadline'] });
    }
  }
  if (data.it_laptop && (!data.it_laptop_details || data.it_laptop_details.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Laptop requirements details are required', path: ['it_laptop_details'] });
  }
  if (data.seating_arrangement === 'Other' && (!data.seating_other_detail || data.seating_other_detail.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Seating details are required', path: ['seating_other_detail'] });
  }
  if (data.podium_setup && (!data.podium_details || data.podium_details.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Podium details are required', path: ['podium_details'] });
  }
  if (data.decoration && (!data.decoration_details || data.decoration_details.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Decoration details are required', path: ['decoration_details'] });
  }
  if (data.food_items && (!data.food_details || data.food_details.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Food details are required', path: ['food_details'] });
  }
  if (data.beverage_items && (!data.beverage_details || data.beverage_details.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Beverage details are required', path: ['beverage_details'] });
  }
  if ((data.food_items || data.beverage_items) && (!data.food_service_time || data.food_service_time.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Time of service is required', path: ['food_service_time'] });
  }
  if (data.transport && (!data.transport_details || data.transport_details.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Transport details are required', path: ['transport_details'] });
  }
  if (data.security && (!data.security_details || data.security_details.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Security details are required', path: ['security_details'] });
  }
  if (data.printing && (!data.printing_details || data.printing_details.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Printing details are required', path: ['printing_details'] });
  }
  if (data.volunteers && (!data.volunteers_details || data.volunteers_details.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Volunteer details are required', path: ['volunteers_details'] });
  }
  if (data.is_collaborative && (!data.collaborating_club_ids || data.collaborating_club_ids.length === 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select at least one collaborating club', path: ['collaborating_club_ids'] });
  }
  if (data.is_sponsored && (!data.sponsor_name || data.sponsor_name.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Sponsor name is required', path: ['sponsor_name'] });
  }
  if (data.venue_type === 'Other' && (!data.venue_custom || data.venue_custom.trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Custom venue details are required', path: ['venue_custom'] });
  }

  if (data.is_rnd_event) {
    if (!data.rnd_activity_theme || data.rnd_activity_theme.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Activity Theme is required for R&D Events', path: ['rnd_activity_theme'] });
    }
    if (!data.rnd_prescribed_activity || data.rnd_prescribed_activity.trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Prescribed Activity is required for R&D Events', path: ['rnd_prescribed_activity'] });
    }
  }
  
  data.venue_selections.forEach((sel, idx) => {
    if (sel.venue_type !== 'Other' && (!sel.venue_ids || sel.venue_ids.length === 0)) {
      // We can't easily check for hasChildren here without venues array.
      // But in the UI, if there are no children, we auto-select the parent ID.
      // So if venue_ids is empty, it's generally an error for a non-Other type 
      // unless the parent itself has no children (which we handle in the component).
    }
  });
});
type FormData = z.infer<typeof schema>;

const BASE_SECTIONS = [
  { id: 1, label: 'Basic Info', icon: <Info className="w-4 h-4" /> },
  { id: 2, label: 'Schedule', icon: <Calendar className="w-4 h-4" /> },
  { id: 3, label: 'Venue & Setup', icon: <MapPin className="w-4 h-4" /> },
  { id: 4, label: 'IT & Tech', icon: <Monitor className="w-4 h-4" /> },
  { id: 5, label: 'Food & Catering', icon: <UtensilsCrossed className="w-4 h-4" /> },
  { id: 6, label: 'Additional', icon: <Package className="w-4 h-4" /> },
];
const RND_SECTION = { id: 7, label: 'R&D', icon: <FlaskConical className="w-4 h-4" /> };
const FINAL_SECTION_BASE = { label: 'Poster & Budget', icon: <FileText className="w-4 h-4" /> };

const RND_ACTIVITY_THEMES = [
  'R&D Awareness and Capacity Building',
  'Cross Disciplinary Thematic Research and Output Enhancement',
  'Intellectual Property (IP) Generation and Commercialization',
  'Promotion of Deep-Tech based Research & Innovation',
  'Strengthening the Industry-Academia for R&D Collaboration',
  'Research Publication and Dissemination',
  'Monitoring, Evaluation, and Recognition of Research',
];

const RND_PRESCRIBED_ACTIVITIES: Record<string, string[]> = {
  'R&D Awareness and Capacity Building': [
    'Faculty & Student R&D Orientation Program',
    'Annual Research Conclave/Symposium',
    'Training on Technology Readiness Level (TRL) and Manufacturing Readiness Level (MRL)',
    'Training on Technology Commercialisation, Licensing and Transfer Practices & Strategy',
  ],
  'Cross Disciplinary Thematic Research and Output Enhancement': [
    'Thematic Research based Hackathon/Ideathon in Campus',
    'Sponsored/Seed Grant Proposal Writing Workshops',
  ],
  'Intellectual Property (IP) Generation and Commercialization': [
    'IP Awareness and Patent Filing Workshops',
    'Innovation to Commercialization Boot Camps',
  ],
  'Promotion of Deep-Tech based Research & Innovation': [
    'Deep-Tech Innovation Challenge',
    'Prototype Development & Validation Clinic',
  ],
  'Strengthening the Industry-Academia for R&D Collaboration': [
    'Industry R&D Roundtables/Meetups',
  ],
  'Research Publication and Dissemination': [
    'Research Paper Writing and Journal Publication Support Workshops',
  ],
  'Monitoring, Evaluation, and Recognition of Research': [
    'Annual Research Awards & Recognition Ceremony',
  ],
};

const SEMESTER_QUARTERS = [
  { value: 'All Quarter', label: 'All Quarter' },
  { value: 'Semester 1 – Quarter I', label: 'Semester 1 – Quarter I' },
  { value: 'Semester 1 – Quarter II', label: 'Semester 1 – Quarter II' },
  { value: 'Semester 2 – Quarter III', label: 'Semester 2 – Quarter III' },
  { value: 'Semester 2 – Quarter IV', label: 'Semester 2 – Quarter IV' },
];

const EVENT_TYPES = [
  { value: 'technical', label: 'Technical' }, { value: 'cultural', label: 'Cultural' },
  { value: 'sports', label: 'Sports' }, { value: 'seminar', label: 'Seminar' },
  { value: 'workshop', label: 'Workshop' }, { value: 'hackathon', label: 'Hackathon' },
  { value: 'awareness', label: 'Awareness' }, { value: 'other', label: 'Other' },
];
const DEPARTMENTS_INVOLVED_OPTIONS = [
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'college_wide', label: 'College Wide' },
];

const normalizeFacultyEmail = (email: string) => email.trim().toLowerCase();
const isAllowedFacultyEmail = (email: string) => /^[^\s@]+@[^\s@]+\.(edu|in)$/i.test(email);

function SectionProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mt-4 mb-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < current ? 'bg-[var(--btn-primary-bg)]' : i === current - 1 ? 'bg-[var(--btn-primary-bg)]' : 'bg-[var(--surface-subtle)]'}`} />
      ))}
    </div>
  );
}

const mapVenuesToSelections = (ev: any, allVenues: any[]) => {
  const mapped: { venue_type: string; venue_ids: number[] }[] = [];
  const vIds: number[] = ev.venue_ids || (ev.venues ? ev.venues.map((v: any) => v.id) : (ev.venue_id ? [ev.venue_id] : []));
  
  const byParentType: Record<string, number[]> = {};
  for (const vid of vIds) {
    const found = allVenues.find((v: any) => v.id === vid);
    if (found) {
      if (found.parent_id) {
        const parent = allVenues.find((p: any) => p.id === found.parent_id);
        const typeName = parent ? parent.name : found.name;
        if (!byParentType[typeName]) byParentType[typeName] = [];
        byParentType[typeName].push(vid);
      } else {
        const typeName = found.name;
        if (!byParentType[typeName]) byParentType[typeName] = [];
        byParentType[typeName].push(vid);
      }
    }
  }

  for (const [vType, ids] of Object.entries(byParentType)) {
    mapped.push({ venue_type: vType, venue_ids: ids });
  }

  if (ev.venue_type) {
    const types = ev.venue_type.split(',').map((t: string) => t.trim()).filter(Boolean);
    for (const t of types) {
      if (t === 'Other') {
        if (!mapped.some(m => m.venue_type === 'Other')) {
          mapped.push({ venue_type: 'Other', venue_ids: [] });
        }
      } else if (!mapped.some(m => m.venue_type === t)) {
        const parent = allVenues.find((v: any) => !v.parent_id && v.name === t);
        const hasChildren = parent ? allVenues.some((v: any) => v.parent_id === parent.id) : false;
        mapped.push({ venue_type: t, venue_ids: parent && !hasChildren ? [parent.id] : [] });
      }
    }
  }

  if (ev.venue_custom && !mapped.some(m => m.venue_type === 'Other')) {
    mapped.push({ venue_type: 'Other', venue_ids: [] });
  }

  return mapped.length > 0 ? mapped : [{ venue_type: '', venue_ids: [] }];
};

export default function CreateEventForm({ basePath, eventId }: { basePath: string; eventId?: number }) {
  const router = useRouter();
  const isEditMode = !!eventId;
  const [loadingEvent, setLoadingEvent] = useState(isEditMode);
  const [existingEvent, setExistingEvent] = useState<any>(null);

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(eventId || null);
  
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [bufferedData, setBufferedData] = useState<FormData | null>(null);
  const [venues, setVenues] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [existingPoster, setExistingPoster] = useState<string | null>(null);
  const posterRef = useRef<HTMLInputElement>(null);
  const [sponsorFile, setSponsorFile] = useState<File | null>(null);
  const [existingSponsorDoc, setExistingSponsorDoc] = useState<string | null>(null);
  const sponsorRef = useRef<HTMLInputElement>(null);
  const [facultyEmailInput, setFacultyEmailInput] = useState('');
  const [facultyEmailError, setFacultyEmailError] = useState('');

  const { register, control, handleSubmit, watch, trigger, setValue, getValues, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      school_department: user?.department?.name || '',
      event_incharge_name: user?.name || '',
      event_incharge_contact: '+91 ',
      is_club_event: true, is_collaborative: false, collaborating_club_ids: [],
      departments_involved: [], venue_ids: [],
      faculty_involved_emails: [],
      venue_selections: [{ venue_type: '', venue_ids: [] }],
      is_sponsored: false, sponsor_name: '',
      it_projector: false, it_audio: false, it_wifi: false, it_laptop: false,
      it_laptop_details: '',
      venue_type: '', seating_arrangement: '',
      seating_other_detail: '', tables_required: '', chairs_required: '',
      podium_setup: false, podium_details: '',
      decoration: false, decoration_details: '',
      food_items: false, beverage_items: false,
      food_details: '', beverage_details: '', food_service_time: '',
      transport: false, security: false, printing: false, volunteers: false,
      transport_details: '', security_details: '', printing_details: '', volunteers_details: '',
      objectives: [''],
      is_rnd_event: false,
      rnd_activity_theme: '',
      rnd_prescribed_activity: '',
      rnd_semester_quarter: '',
      rnd_tentative_date: '',
      outside_campus_registration: false,
      registration_accepted: false,
      student_registration_enabled: false,
      faculty_registration_enabled: false,
      budget: 0,
      budget_breakdown: [
        { category: '', amount: undefined as any, description: '' },
      ],
    },
  });

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      venueService.list().then(res => res.data.filter((v: any) => v.is_active)).catch(() => []),
      clubService.list().then(res => res.data?.filter((c: any) => c.id !== user?.club_id) || []).catch(() => []),
      departmentService ? departmentService.list().catch(() => []) : Promise.resolve([]),
      eventId ? eventService.get(eventId).catch(() => null) : Promise.resolve(null),
    ]).then(([vList, cList, dList, ev]) => {
      if (!isMounted) return;
      setVenues(vList);
      setClubs(cList);
      setDepartments(dList as any[]);

      if (ev) {
        setCreatedId(ev.id);
        setExistingEvent(ev);
        setExistingPoster(ev.poster_path || null);
        
        const spDoc = ev.documents?.find((d: any) => d.title?.toLowerCase().includes('sponsor')) || (ev.sponsors?.[0]?.logo_path ? { file_path: ev.sponsors[0].logo_path } : null);
        if (spDoc) setExistingSponsorDoc(spDoc.file_path || 'Uploaded sponsor doc');

        const vSelections = mapVenuesToSelections(ev, vList);

        let bBreakdown = [{ category: '', amount: undefined as any, description: '' }];
        if (ev.budget_breakdown && Array.isArray(ev.budget_breakdown) && ev.budget_breakdown.length > 0) {
          bBreakdown = ev.budget_breakdown.map((item: any) => ({
            category: item.category || '',
            amount: item.amount !== undefined ? Number(item.amount) : undefined,
            description: item.description || '',
          }));
        }
        const bTotal = ev.budget !== undefined && ev.budget !== null
          ? Number(ev.budget)
          : bBreakdown.reduce((sum: number, it: any) => sum + (Number(it.amount) || 0), 0);
        setDisplayedTotal(bTotal);

        let objList = [''];
        if (ev.objectives && Array.isArray(ev.objectives) && ev.objectives.length > 0) {
          objList = ev.objectives;
        }

        let deptsInvolved = ev.departments_involved || [];
        if ((!deptsInvolved || deptsInvolved.length === 0) && ev.target_audience) {
          deptsInvolved = ev.target_audience.split(',').map((s: string) => s.trim()).filter(Boolean);
        }

        const collabClubIds = ev.collaborating_clubs?.map((c: any) => c.club_id) || ev.collaborating_club_ids || [];
        const sponsorName = ev.sponsors?.[0]?.name || ev.sponsor_name || '';

        reset({
          title: ev.title || '',
          event_type: ev.event_type || '',
          school_department: ev.school_department || user?.department?.name || '',
          departments_involved: deptsInvolved,
          faculty_involved_emails: Array.isArray(ev.faculty_involved_emails) ? ev.faculty_involved_emails : [],
          event_incharge_name: ev.event_incharge_name || user?.name || '',
          event_incharge_contact: ev.event_incharge_contact || '+91 ',
          target_audience: ev.target_audience || '',
          is_club_event: ev.is_club_event ?? true,
          is_collaborative: !!ev.is_collaborative,
          collaborating_club_ids: collabClubIds,
          is_sponsored: !!ev.is_sponsored,
          sponsor_name: sponsorName,
          objectives: objList,
          start_datetime: formatDateTimeForInput(ev.start_datetime),
          end_datetime: formatDateTimeForInput(ev.end_datetime),
          registration_start_datetime: formatDateTimeForInput(ev.registration_start_datetime),
          registration_deadline: formatDateTimeForInput(ev.registration_deadline),
          venue_selections: vSelections,
          venue_custom: ev.venue_custom || '',
          venue_type: ev.venue_type || '',
          venue_has_children: false,
          seating_arrangement: ev.seating_arrangement || '',
          seating_other_detail: ev.seating_other_detail || '',
          tables_required: ev.tables_required || '',
          chairs_required: ev.chairs_required || '',
          podium_setup: !!ev.podium_setup,
          podium_details: ev.podium_details || '',
          decoration: !!ev.decoration,
          decoration_details: ev.decoration_details || '',
          it_projector: !!ev.it_projector,
          it_audio: !!ev.it_audio,
          it_audio_details: ev.it_audio_details || '',
          it_wifi: !!ev.it_wifi,
          it_laptop: !!ev.it_laptop,
          it_laptop_details: ev.it_laptop_details || '',
          it_other: ev.it_other || '',
          food_items: !!ev.food_items,
          food_details: ev.food_details || '',
          beverage_items: !!ev.beverage_items,
          beverage_details: ev.beverage_details || '',
          pax_count: ev.pax_count || undefined,
          food_service_time: ev.food_service_time || '',
          transport: !!ev.transport,
          transport_details: ev.transport_details || '',
          security: !!ev.security,
          security_details: ev.security_details || '',
          printing: !!ev.printing,
          printing_details: ev.printing_details || '',
          volunteers: !!ev.volunteers,
          volunteers_details: ev.volunteers_details || '',
          other_requirements: ev.other_requirements || '',
          budget: bTotal,
          budget_breakdown: bBreakdown,
          comments: ev.comments || '',
          is_rnd_event: !!ev.is_rnd_event,
          rnd_activity_theme: ev.rnd_activity_theme || '',
          rnd_prescribed_activity: ev.rnd_prescribed_activity || '',
          rnd_semester_quarter: ev.rnd_semester_quarter || '',
          rnd_tentative_date: ev.rnd_tentative_date || '',
          outside_campus_registration: !!ev.outside_campus_registration,
          registration_accepted: !!ev.registration_accepted,
          student_registration_enabled: !!ev.student_registration_enabled,
          faculty_registration_enabled: !!ev.faculty_registration_enabled,
        });
      }
      setLoadingEvent(false);
    });

    return () => { isMounted = false; };
  }, [eventId, user]);

  const watchRegistrationAccepted = watch('registration_accepted');
  const watchOutsideCampus = watch('outside_campus_registration');
  const watchStudentRegistration = watch('student_registration_enabled');
  const watchFacultyRegistration = watch('faculty_registration_enabled');
  const isRegRequired = watchRegistrationAccepted || watchOutsideCampus;
  const watchIsRnd = watch('is_rnd_event');
  const watchRndTheme = watch('rnd_activity_theme');

  const addFacultyEmail = () => {
    const email = normalizeFacultyEmail(facultyEmailInput);
    if (!isAllowedFacultyEmail(email)) {
      setFacultyEmailError('Enter a valid faculty email ending exactly in .edu or .in.');
      return;
    }
    const current = getValues('faculty_involved_emails') || [];
    if (current.includes(email)) {
      setFacultyEmailError('This faculty email has already been added.');
      return;
    }
    setValue('faculty_involved_emails', [...current, email], { shouldDirty: true, shouldValidate: true });
    setFacultyEmailInput('');
    setFacultyEmailError('');
  };

  const SECTIONS = [
    ...BASE_SECTIONS,
    ...(watchIsRnd ? [RND_SECTION] : []),
    { id: watchIsRnd ? 8 : 7, ...FINAL_SECTION_BASE },
  ];
  const TOTAL_STEPS = SECTIONS.length;
  const FINAL_STEP = SECTIONS[SECTIONS.length - 1].id;

  const { fields: objectiveFields, append: appendObjective, remove: removeObjective } = useFieldArray({
    control, name: 'objectives' as never
  });

  const { fields: venueFields, append: appendVenue, remove: removeVenue } = useFieldArray({
    control, name: 'venue_selections' as never
  });

  const { fields: budgetFields, append: appendBudget, remove: removeBudget } = useFieldArray({
    control, name: 'budget_breakdown' as never
  });

  const [displayedTotal, setDisplayedTotal] = useState<number>(0);

  const recalculateTotal = () => {
    const items = getValues('budget_breakdown') || [];
    const total = items.reduce((sum: number, item: any) => {
      const val = parseFloat(item?.amount as any) || 0;
      return sum + (val > 0 ? val : 0);
    }, 0);
    setDisplayedTotal(total);
    setValue('budget', total, { shouldValidate: true });
    return total;
  };

  const handleAddBudgetItem = () => {
    appendBudget({ category: '', amount: undefined as any, description: '' });
  };

  const handleRemoveBudgetItem = (idx: number) => {
    removeBudget(idx);
    setTimeout(() => {
      recalculateTotal();
    }, 50);
  };

  const watchFood = watch('food_items');
  const watchBeverage = watch('beverage_items');
  const watchAudio = watch('it_audio');
  const watchLaptop = watch('it_laptop');
  const watchTransport = watch('transport');
  const watchSecurity = watch('security');
  const watchPrinting = watch('printing');
  const watchVolunteers = watch('volunteers');
  const watchVenueType = watch('venue_type');
  const watchSeating = watch('seating_arrangement');
  const watchPodium = watch('podium_setup');
  const watchDecoration = watch('decoration');

  const STEP_FIELDS: Record<number, (keyof FormData)[]> = {
    1: ['title', 'event_type', 'school_department', 'departments_involved', 'event_incharge_name', 'event_incharge_contact', 'objectives', 'collaborating_club_ids', 'sponsor_name'],
    2: ['start_datetime', 'end_datetime', ...(isRegRequired ? ['registration_start_datetime', 'registration_deadline'] as (keyof FormData)[] : [])],
    3: ['venue_selections', 'venue_custom', 'venue_ids', 'seating_arrangement'], 4: [], 5: [], 6: [],
    7: watchIsRnd ? ['rnd_activity_theme', 'rnd_prescribed_activity'] : [],
    8: [],
  };

  const nextStep = async () => {
    const ok = await trigger(STEP_FIELDS[step] || []);
    if (ok) {
      setStep(s => Math.min(s + 1, FINAL_STEP));
    } else {
      toast.error("Please fill all required fields correctly before proceeding.", { id: 'validation-error' });
    }
  };

  const saveAsDraft = async (data: FormData) => {
    setSaving(true);
    try {
      const venueTypes = data.venue_selections.map(s => s.venue_type).filter(Boolean);
      const allVenueIds = data.venue_selections.flatMap(s => s.venue_ids || []);
      
      const regAccepted = data.outside_campus_registration || data.student_registration_enabled || data.faculty_registration_enabled;
      const outsideCampus = data.outside_campus_registration && regAccepted;

      const payloadData = { 
        ...data, 
        target_audience: data.departments_involved.join(', '),
        start_datetime: toUTCISOString(data.start_datetime),
        end_datetime: toUTCISOString(data.end_datetime),
        registration_start_datetime: regAccepted && data.registration_start_datetime ? toUTCISOString(data.registration_start_datetime) : undefined,
        registration_deadline: regAccepted && data.registration_deadline ? toUTCISOString(data.registration_deadline) : undefined,
        school_department: data.school_department || user?.department?.name || "Multiple",
        club_id: data.is_club_event ? (existingEvent?.club_id || user?.club_id) : undefined,
        venue_type: venueTypes.join(', '),
        venue_ids: allVenueIds,
        venue_custom: venueTypes.includes('Other') ? data.venue_custom : null,
        seating_other_detail: data.seating_arrangement === 'Other' ? data.seating_other_detail : null,
        podium_details: data.podium_setup ? data.podium_details : null,
        decoration_details: data.decoration ? data.decoration_details : null,
        it_laptop_details: data.it_laptop ? data.it_laptop_details : null,
        food_details: data.food_items ? data.food_details : null,
        beverage_details: data.beverage_items ? data.beverage_details : null,
        pax_count: (data.food_items || data.beverage_items) ? data.pax_count : null,
        food_service_time: (data.food_items || data.beverage_items) ? data.food_service_time : null,
        transport_details: data.transport ? data.transport_details : null,
        security_details: data.security ? data.security_details : null,
        printing_details: data.printing ? data.printing_details : null,
        volunteers_details: data.volunteers ? data.volunteers_details : null,
        is_rnd_event: data.is_rnd_event,
        rnd_activity_theme: data.is_rnd_event ? data.rnd_activity_theme : null,
        rnd_prescribed_activity: data.is_rnd_event ? data.rnd_prescribed_activity : null,
        rnd_semester_quarter: data.is_rnd_event ? data.rnd_semester_quarter : null,
        rnd_tentative_date: data.is_rnd_event ? data.rnd_tentative_date : null,
        outside_campus_registration: outsideCampus,
        registration_accepted: regAccepted,
        student_registration_enabled: data.student_registration_enabled,
        faculty_registration_enabled: data.faculty_registration_enabled,
        budget_breakdown: (() => {
          const items = (data.budget_breakdown || [])
            .filter((item: any) => item && item.category && item.category.trim() !== '')
            .map((item: any) => ({
              category: item.category.trim(),
              amount: Math.max(0, parseFloat(item.amount as any) || 0),
              description: item.description?.trim() || undefined,
            }));
          return items;
        })(),
        budget: (() => {
          const items = (data.budget_breakdown || [])
            .filter((item: any) => item && item.category && item.category.trim() !== '')
            .map((item: any) => Math.max(0, parseFloat(item.amount as any) || 0));
          return items.reduce((acc, a) => acc + a, 0);
        })(),
      };
      let id = createdId || eventId;
      if (!id) {
        const res = await eventService.create(payloadData as any);
        id = res.id;
        setCreatedId(id);
      } else {
        await eventService.update(id, payloadData as any);
      }
      if (id && posterFile) {
        try { await eventService.uploadPoster(id, posterFile); } catch(err) {}
      }
      if (id && sponsorFile && payloadData.is_sponsored) {
        try { await eventService.uploadSponsorDoc(id, sponsorFile); } catch(err) {}
      }
      toast.success(isEditMode ? 'Changes saved as draft' : 'Saved as draft');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const openTermsModal = async (data: FormData) => {
    if (isSuperAdmin) {
      // Super admin directly creates/updates as approved — no restrictions
      setSubmitting(true);
      try {
        const venueTypes = data.venue_selections.map(s => s.venue_type).filter(Boolean);
        const allVenueIds = data.venue_selections.flatMap(s => s.venue_ids || []);

        const regAccepted = data.outside_campus_registration || data.student_registration_enabled || data.faculty_registration_enabled;
        const outsideCampus = data.outside_campus_registration && regAccepted;

        const payloadData = {
          ...data,
          target_audience: data.departments_involved.join(', '),
          start_datetime: toUTCISOString(data.start_datetime),
          end_datetime: toUTCISOString(data.end_datetime),
          registration_start_datetime: regAccepted && data.registration_start_datetime ? toUTCISOString(data.registration_start_datetime) : undefined,
          registration_deadline: regAccepted && data.registration_deadline ? toUTCISOString(data.registration_deadline) : undefined,
          school_department: data.school_department || user?.department?.name || "Multiple",
          club_id: data.is_club_event ? (existingEvent?.club_id || user?.club_id) : undefined,
          venue_type: venueTypes.join(', '),
          venue_ids: allVenueIds,
          venue_custom: venueTypes.includes('Other') ? data.venue_custom : null,
          seating_other_detail: data.seating_arrangement === 'Other' ? data.seating_other_detail : null,
          podium_details: data.podium_setup ? data.podium_details : null,
          decoration_details: data.decoration ? data.decoration_details : null,
          it_laptop_details: data.it_laptop ? data.it_laptop_details : null,
          food_details: data.food_items ? data.food_details : null,
          beverage_details: data.beverage_items ? data.beverage_details : null,
          pax_count: (data.food_items || data.beverage_items) ? data.pax_count : null,
          food_service_time: (data.food_items || data.beverage_items) ? data.food_service_time : null,
          transport_details: data.transport ? data.transport_details : null,
          security_details: data.security ? data.security_details : null,
          printing_details: data.printing ? data.printing_details : null,
          volunteers_details: data.volunteers ? data.volunteers_details : null,
          is_rnd_event: data.is_rnd_event,
          rnd_activity_theme: data.is_rnd_event ? data.rnd_activity_theme : null,
          rnd_prescribed_activity: data.is_rnd_event ? data.rnd_prescribed_activity : null,
          rnd_semester_quarter: data.is_rnd_event ? data.rnd_semester_quarter : null,
          rnd_tentative_date: data.is_rnd_event ? data.rnd_tentative_date : null,
          outside_campus_registration: outsideCampus,
          registration_accepted: regAccepted,
          student_registration_enabled: data.student_registration_enabled,
          faculty_registration_enabled: data.faculty_registration_enabled,
          budget_breakdown: (() => {
            const items = (data.budget_breakdown || [])
              .filter((item: any) => item && item.category && item.category.trim() !== '')
              .map((item: any) => ({
                category: item.category.trim(),
                amount: Math.max(0, parseFloat(item.amount as any) || 0),
                description: item.description?.trim() || undefined,
              }));
            return items;
          })(),
          budget: (() => {
            const items = (data.budget_breakdown || [])
              .filter((item: any) => item && item.category && item.category.trim() !== '')
              .map((item: any) => Math.max(0, parseFloat(item.amount as any) || 0));
            return items.reduce((acc, a) => acc + a, 0);
          })(),
        };
        let id = createdId || eventId;
        if (!id) {
          const res = await eventService.create(payloadData as any);
          id = res.id;
          setCreatedId(id);
        } else {
          await eventService.update(id, payloadData as any);
        }
        if (id && posterFile) {
          try { await eventService.uploadPoster(id, posterFile); } catch(err) {}
        }
        if (id && sponsorFile && payloadData.is_sponsored) {
          try { await eventService.uploadSponsorDoc(id, sponsorFile); } catch(err) {}
        }
        // Auto-approve by calling the admin approve endpoint
        if (id) {
          try { await eventService.adminApprove(id); } catch(err) {}
        }
        toast.success(isEditMode ? 'Event changes saved and approved!' : 'Event created and approved!');
        router.push(`${basePath}/events`);
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to process event');
      } finally { setSubmitting(false); }
      return;
    }
    setBufferedData(data);
    setIsTermsOpen(true);
  };

  const confirmAndSubmit = async () => {
    if (!bufferedData) return;
    setSubmitting(true);
    try {
      const venueTypes = bufferedData.venue_selections.map(s => s.venue_type).filter(Boolean);
      const allVenueIds = bufferedData.venue_selections.flatMap(s => s.venue_ids || []);

      const regAccepted = bufferedData.outside_campus_registration || bufferedData.student_registration_enabled || bufferedData.faculty_registration_enabled;
      const outsideCampus = bufferedData.outside_campus_registration && regAccepted;

      const payloadData = {
        ...bufferedData,
        target_audience: bufferedData.departments_involved.join(', '),
        start_datetime: toUTCISOString(bufferedData.start_datetime),
        end_datetime: toUTCISOString(bufferedData.end_datetime),
        registration_start_datetime: regAccepted && bufferedData.registration_start_datetime ? toUTCISOString(bufferedData.registration_start_datetime) : undefined,
        registration_deadline: regAccepted && bufferedData.registration_deadline ? toUTCISOString(bufferedData.registration_deadline) : undefined,
        school_department: bufferedData.school_department || user?.department?.name || "Multiple",
        club_id: bufferedData.is_club_event ? (existingEvent?.club_id || user?.club_id) : undefined,
        venue_type: venueTypes.join(', '),
        venue_ids: allVenueIds,
        venue_custom: venueTypes.includes('Other') ? bufferedData.venue_custom : null,
        seating_other_detail: bufferedData.seating_arrangement === 'Other' ? bufferedData.seating_other_detail : null,
        podium_details: bufferedData.podium_setup ? bufferedData.podium_details : null,
        decoration_details: bufferedData.decoration ? bufferedData.decoration_details : null,
        it_laptop_details: bufferedData.it_laptop ? bufferedData.it_laptop_details : null,
        food_details: bufferedData.food_items ? bufferedData.food_details : null,
        beverage_details: bufferedData.beverage_items ? bufferedData.beverage_details : null,
        pax_count: (bufferedData.food_items || bufferedData.beverage_items) ? bufferedData.pax_count : null,
        food_service_time: (bufferedData.food_items || bufferedData.beverage_items) ? bufferedData.food_service_time : null,
        transport_details: bufferedData.transport ? bufferedData.transport_details : null,
        security_details: bufferedData.security ? bufferedData.security_details : null,
        printing_details: bufferedData.printing ? bufferedData.printing_details : null,
        volunteers_details: bufferedData.volunteers ? bufferedData.volunteers_details : null,
        is_rnd_event: bufferedData.is_rnd_event,
        rnd_activity_theme: bufferedData.is_rnd_event ? bufferedData.rnd_activity_theme : null,
        rnd_prescribed_activity: bufferedData.is_rnd_event ? bufferedData.rnd_prescribed_activity : null,
        rnd_semester_quarter: bufferedData.is_rnd_event ? bufferedData.rnd_semester_quarter : null,
        rnd_tentative_date: bufferedData.is_rnd_event ? bufferedData.rnd_tentative_date : null,
        outside_campus_registration: outsideCampus,
        registration_accepted: regAccepted,
        student_registration_enabled: bufferedData.student_registration_enabled,
        faculty_registration_enabled: bufferedData.faculty_registration_enabled,
        budget_breakdown: (() => {
          const items = (bufferedData.budget_breakdown || [])
            .filter((item: any) => item && item.category && item.category.trim() !== '')
            .map((item: any) => ({
              category: item.category.trim(),
              amount: Math.max(0, parseFloat(item.amount as any) || 0),
              description: item.description?.trim() || undefined,
            }));
          return items;
        })(),
        budget: (() => {
          const items = (bufferedData.budget_breakdown || [])
            .filter((item: any) => item && item.category && item.category.trim() !== '')
            .map((item: any) => Math.max(0, parseFloat(item.amount as any) || 0));
          return items.reduce((acc, a) => acc + a, 0);
        })(),
      };

      let id = createdId || eventId;
      if (!id) {
        const res = await eventService.create(payloadData as any);
        id = res.id;
        setCreatedId(id);
      } else {
        await eventService.update(id, payloadData as any);
      }
      
      if (id && posterFile) {
        try { await eventService.uploadPoster(id, posterFile); } catch(err) {}
      }
      if (id && sponsorFile && payloadData.is_sponsored) {
        try { await eventService.uploadSponsorDoc(id, sponsorFile); } catch(err) {}
      }
      
      if (id) await eventService.submit(id);
      
      setIsTermsOpen(false);
      toast.success(isEditMode ? 'Event changes submitted for approval!' : 'Event submitted for approval!');
      router.push(`${basePath}/events`);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  if (loadingEvent) {
    return <div className="p-12 text-center text-[var(--text-muted)]">Loading event details...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2 -ml-2 text-[var(--text-muted)] hover:text-[rgb(var(--color-primary))]"><ArrowLeft className="w-5 h-5"/></button>
        <div>
          <h1 className="page-title">{isEditMode ? 'Edit Event / Apply Changes' : 'Create New Event'}</h1>
          <p className="page-subtitle">
            {isEditMode 
              ? 'Update event information and resubmit for approval' 
              : (isSuperAdmin ? 'Admin event — will be directly approved' : 'Fill in all sections to submit your event for approval')}
          </p>
        </div>
      </div>

      {existingEvent?.status === 'suggested_changes' && (
        <Alert type="warning" className="border-[var(--status-warning-text)] bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]">
          <div>
            <p className="font-bold text-sm">Reviewer Suggested Changes</p>
            <p className="text-xs mt-0.5">Please review the feedback, update the required fields, and resubmit the event to resume the approval process.</p>
          </div>
        </Alert>
      )}

      {/* Step nav */}
      <div className="card p-4">
        <div className="flex gap-2 flex-wrap mb-2">
          {SECTIONS.map(s => (
            <button key={s.id} type="button" onClick={() => setStep(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                s.id === step ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-bold shadow-sm' :
                'bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--btn-primary-bg)] hover:text-[var(--btn-primary-text)] cursor-pointer'
              }`}>
              {s.icon} <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.id}</span>
            </button>
          ))}
        </div>
        <SectionProgress current={step} total={TOTAL_STEPS} />
      </div>

      <form className="card p-6 space-y-6">
        {/* Section A: Basic Info */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="section-title flex items-center gap-2"><Info className="w-5 h-5 text-[rgb(var(--color-primary))]" /> Basic Information</h2>
            {/* R&D Event Toggle */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 mb-2">
              <Controller name="is_rnd_event" control={control} render={({ field }) => (
                <Toggle checked={field.value} onChange={(val) => { field.onChange(val); if (!val) { setValue('rnd_activity_theme', ''); setValue('rnd_prescribed_activity', ''); setValue('rnd_semester_quarter', ''); setValue('rnd_tentative_date', ''); } }} label="R&D Event" />
              )} />
              <p className="text-xs text-[var(--text-muted)] mt-1 ml-1">Enable this to classify the event under the R&D framework. An additional mandatory R&D tab will appear.</p>
            </div>

            <Input label="Event Title" placeholder="e.g. TechFest 2025 — Day 1" error={errors.title?.message} {...register('title')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Controller name="event_type" control={control} render={({ field }) => (
                <Select label="Event Type" options={EVENT_TYPES} placeholder="Select type" error={errors.event_type?.message} {...field} />
              )} />
              <Input label="School / Department" placeholder="e.g. School of Engineering" error={errors.school_department?.message} {...register('school_department')} />
            </div>
            <div className="space-y-3 p-4 bg-[var(--page-bg)] rounded-2xl">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Departments Involved <span className="text-[var(--text-danger)]">*</span></p>
              <Controller name="departments_involved" control={control} render={({ field }) => {
                const currentValues = field.value || [];
                const isCollegeWideSelected = currentValues.some(v => String(v).toUpperCase() === 'COLLEGE WIDE' || String(v).toUpperCase() === 'COLLEGE_WIDE');
                const deptOptions = [
                  ...departments.map((d: any) => ({ value: d.name, label: d.name })),
                  { value: 'COLLEGE WIDE', label: 'COLLEGE WIDE' }
                ];
                const visibleOptions = isCollegeWideSelected
                  ? deptOptions.filter(d => d.value === 'COLLEGE WIDE')
                  : deptOptions;

                return (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {visibleOptions.map(d => {
                        const selected = currentValues.includes(d.value);
                        return (
                          <button
                            key={d.value} type="button"
                            onClick={() => {
                              if (d.value === 'COLLEGE WIDE') {
                                if (selected) field.onChange([]);
                                else field.onChange(['COLLEGE WIDE']);
                              } else {
                                let next = currentValues.filter((v: string) => String(v).toUpperCase() !== 'COLLEGE WIDE' && String(v).toUpperCase() !== 'COLLEGE_WIDE');
                                if (selected) next = next.filter((v: string) => v !== d.value);
                                else next = [...next, d.value];
                                field.onChange(next);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${selected ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] border-[var(--status-success-text)]' : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--surface-subtle)]'} border`}
                          >
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1.5">
                      Approval chain is determined automatically based on the selected department(s). Selecting <strong>COLLEGE WIDE</strong> sends the event directly to the Director.
                    </p>
                  </div>
                );
              }} />
              {errors.departments_involved && <p className="text-xs text-[var(--text-danger)]">{errors.departments_involved.message}</p>}
            </div>

            <div className="space-y-3 p-4 bg-[var(--page-bg)] rounded-2xl">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Faculty Involved</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Optional. Add faculty email addresses ending in .edu or .in.</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={facultyEmailInput}
                  onChange={(e) => { setFacultyEmailInput(e.target.value); setFacultyEmailError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFacultyEmail(); } }}
                  placeholder="faculty@example.edu"
                  className="flex-1 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-primary)]"
                  aria-label="Faculty email"
                />
                <Button type="button" variant="secondary" onClick={addFacultyEmail} icon={<Plus className="w-4 h-4" />}>Add</Button>
              </div>
              {facultyEmailError && <p className="text-xs text-[var(--text-danger)]">{facultyEmailError}</p>}
              {(watch('faculty_involved_emails') || []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(watch('faculty_involved_emails') || []).map((email) => (
                    <span key={email} className="inline-flex items-center gap-1 rounded-full bg-[var(--status-info-bg)] px-3 py-1 text-xs font-medium text-[var(--status-info-text)]">
                      {email}
                      <button type="button" onClick={() => setValue('faculty_involved_emails', (getValues('faculty_involved_emails') || []).filter((item) => item !== email), { shouldDirty: true })} aria-label={`Remove ${email}`} className="ml-1 font-bold">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Event Incharge Name" placeholder="Full name" error={errors.event_incharge_name?.message} {...register('event_incharge_name')} />
              <Input label="Incharge Contact" placeholder="+91 XXXXXXXXXX" error={errors.event_incharge_contact?.message} {...register('event_incharge_contact')} />
            </div>
            <div className="flex flex-col gap-4 p-4 bg-[var(--page-bg)] rounded-2xl">
              <Controller name="is_club_event" control={control} render={({ field }) => (
                <Toggle checked={field.value} onChange={field.onChange} label="This is a Club-based Event" />
              )} />
              <Controller name="is_collaborative" control={control} render={({ field }) => (
                <Toggle checked={field.value} onChange={field.onChange} label="Collaborative Event (multiple clubs)" />
              )} />
              {watch('is_collaborative') && (
                <div className="ml-10 space-y-3">
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">Select Collaborating Clubs <span className="text-[var(--text-danger)]">*</span></p>
                  <Controller name="collaborating_club_ids" control={control} render={({ field }) => (
                    <div className="flex flex-wrap gap-2">
                      {clubs.map(c => {
                        const selected = field.value?.includes(c.id);
                        return (
                          <button
                            key={c.id} type="button"
                            onClick={() => {
                              const curr = field.value || [];
                              if (selected) field.onChange(curr.filter((id: number) => id !== c.id));
                              else field.onChange([...curr, c.id]);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${selected ? 'bg-[var(--status-info-bg)] text-[var(--status-info-text)] border-[var(--status-info-text)]' : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--surface-subtle)]'} border`}
                          >
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  )} />
                  {errors.collaborating_club_ids && <p className="text-xs text-[var(--status-danger-text)]">{errors.collaborating_club_ids.message}</p>}
                </div>
              )}
              <Controller name="is_sponsored" control={control} render={({ field }) => (
                <Toggle checked={field.value} onChange={field.onChange} label="This event has Sponsors" />
              )} />
              {watch('is_sponsored') && (
                <div className="ml-10 grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
                  <Input label="Sponsor Name" placeholder="e.g. Acme Corp" error={errors.sponsor_name?.message} {...register('sponsor_name')} />
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[rgb(var(--color-primary))]">Sponsor Document {!existingSponsorDoc && <span className="text-[var(--text-danger)]">*</span>}</label>
                    <div className={`flex items-center gap-2 p-2 border rounded-xl bg-white ${(!sponsorFile && !existingSponsorDoc) ? 'border-[var(--status-danger-text)]' : 'border-[var(--card-border)]'}`}>
                      <input type="file" ref={sponsorRef} className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={e => {
                        if (e.target.files && e.target.files[0]) setSponsorFile(e.target.files[0]);
                      }} />
                      <Button variant="secondary" type="button" className="text-xs py-1.5" onClick={() => sponsorRef.current?.click()}>
                        {existingSponsorDoc || sponsorFile ? 'Change File' : 'Choose File'}
                      </Button>
                      <span className="text-xs truncate max-w-[140px] text-[var(--text-secondary)] font-medium">
                        {sponsorFile ? sponsorFile.name : (existingSponsorDoc ? '✓ Document on file' : 'No file chosen')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-3 p-4 bg-[var(--page-bg)] rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Event Objectives</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] -mt-1">Specify key objectives and goals for your event.</p>
              
              {objectiveFields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input 
                      placeholder={`Objective ${index + 1}`} 
                      error={errors.objectives?.[index]?.message} 
                      {...register(`objectives.${index}` as const)} 
                    />
                  </div>
                  {objectiveFields.length > 1 && (
                    <button type="button" onClick={() => removeObjective(index)} className="p-2.5 text-[var(--text-danger)] hover:bg-[var(--status-danger-bg)] hover:text-[var(--text-danger)] rounded-xl transition-colors mt-0.5" title="Remove Objective">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              {errors.objectives?.root?.message && (
                <p className="text-xs font-medium text-[var(--text-danger)]">{errors.objectives.root.message}</p>
              )}
              
              <Button type="button" variant="secondary" onClick={() => appendObjective('')} icon={<Plus className="w-4 h-4"/>} className="text-xs py-2 self-start">
                Add Objective
              </Button>
            </div>
          </div>
        )}

        {/* Section B: Schedule */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="section-title flex items-center gap-2"><Calendar className="w-5 h-5 text-[rgb(var(--color-primary))]" /> Flow of Event</h2>
            <Alert type="info"><span>Set accurate start and end times — venue clash detection uses these.</span></Alert>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date & Time" type="datetime-local" error={errors.start_datetime?.message} {...register('start_datetime')} />
              <Input label="End Date & Time" type="datetime-local" error={errors.end_datetime?.message} {...register('end_datetime')} />
            </div>

            <div className="pt-4 border-t border-[var(--border-color)] space-y-4">
              <div className="flex flex-col gap-4 p-4 bg-[var(--page-bg)] rounded-2xl border border-[var(--border-subtle)]">
                <Controller name="registration_accepted" control={control} render={({ field }) => (
                  <Toggle
                    checked={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      if (val) {
                        setValue('student_registration_enabled', true);
                      } else {
                        setValue('outside_campus_registration', false);
                        setValue('student_registration_enabled', false);
                        setValue('faculty_registration_enabled', false);
                        setValue('registration_start_datetime', '');
                        setValue('registration_deadline', '');
                      }
                    }}
                    label="Registration Accepted"
                  />
                )} />

                <div className="ml-1 space-y-2">
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">Registration audience</p>
                  <div className="flex flex-wrap gap-4 text-sm text-[var(--text-primary)]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={watchStudentRegistration} onChange={(e) => {
                        const selected = e.target.checked;
                        setValue('student_registration_enabled', selected);
                        if (selected) setValue('registration_accepted', true);
                        else if (!watchFacultyRegistration && !watchOutsideCampus) {
                          setValue('registration_accepted', false);
                          setValue('registration_start_datetime', '');
                          setValue('registration_deadline', '');
                        }
                      }} /> Student
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={watchFacultyRegistration} onChange={(e) => {
                        const selected = e.target.checked;
                        setValue('faculty_registration_enabled', selected);
                        if (selected) setValue('registration_accepted', true);
                        else if (!watchStudentRegistration && !watchOutsideCampus) {
                          setValue('registration_accepted', false);
                          setValue('registration_start_datetime', '');
                          setValue('registration_deadline', '');
                        }
                      }} /> Faculty
                    </label>
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">Faculty selection is recorded for the event; the current registration endpoint supports student accounts only.</p>
                </div>

                <Controller name="outside_campus_registration" control={control} render={({ field }) => (
                  <Toggle
                    checked={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      if (val) {
                        setValue('registration_accepted', true);
                        setValue('student_registration_enabled', true);
                      }
                    }}
                    label="Outside Campus Registration Accepted"
                  />
                )} />
              </div>
              
              {(watch('registration_accepted') || watch('outside_campus_registration')) && (
                <div className="space-y-4 pt-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Registration Schedule <span className="text-[var(--text-danger)]">*</span></h3>
                    <p className="text-xs text-[var(--text-muted)]">Specify when registration opens and closes for this event.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Registration Start Date & Time" type="datetime-local" error={errors.registration_start_datetime?.message} {...register('registration_start_datetime')} required />
                    <Input label="Registration End Date & Time" type="datetime-local" error={errors.registration_deadline?.message} {...register('registration_deadline')} required />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section C: Venue & Setup */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="section-title flex items-center gap-2"><MapPin className="w-5 h-5 text-[rgb(var(--color-primary))]" /> Venue & Setup</h2>
              <Button type="button" variant="secondary" size="sm" onClick={() => appendVenue({ venue_type: '', venue_ids: [] })} icon={<Plus className="w-4 h-4" />}>
                Add Another Venue
              </Button>
            </div>

            <div className="space-y-4">
              {venueFields.map((field, index) => {
                const watchCurrentType = watch(`venue_selections.${index}.venue_type`);
                const otherSelectedTypes = (watch('venue_selections') || [])
                  .map((s, i) => i !== index ? s.venue_type : null)
                  .filter(Boolean);

                const parentOptions = venues
                  .filter(v => !v.parent_id && (!otherSelectedTypes.includes(v.name) || v.name === watchCurrentType))
                  .map(v => ({ value: v.name, label: v.name }));
                
                parentOptions.push({ value: 'Other', label: 'Other' });

                return (
                  <div key={field.id} className="p-4 bg-[var(--page-bg)] rounded-2xl border border-[var(--border-color)] relative group/venue">
                    {venueFields.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeVenue(index)} 
                        className="absolute -top-2 -right-2 p-1.5 bg-white border border-[var(--status-danger-text)] text-[var(--status-danger-text)] rounded-full hover:bg-[var(--status-danger-bg)] shadow-sm opacity-0 group-hover/venue:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Controller 
                        name={`venue_selections.${index}.venue_type`} 
                        control={control} 
                        render={({ field: selectField }) => (
                          <Select 
                            label={`Venue Type ${venueFields.length > 1 ? index + 1 : ''}`} 
                            options={parentOptions} 
                            placeholder="Select venue type" 
                            error={errors.venue_selections?.[index]?.venue_type?.message} 
                            {...selectField} 
                            onChange={(e) => {
                              const val = (e as React.ChangeEvent<HTMLSelectElement>).target.value;
                              selectField.onChange(val);
                                                            // Reset children when type changes
                              setValue(`venue_selections.${index}.venue_ids`, []);
                              
                              if (val !== 'Other') {
                                const parent = venues.find(v => !v.parent_id && v.name === val);
                                if (parent) {
                                  const childrenCount = venues.filter(v => v.parent_id === parent.id).length;
                                  if (childrenCount === 0) {
                                    setValue(`venue_selections.${index}.venue_ids`, [parent.id]);
                                  }
                                }
                              }
                            }}
                          />
                        )} 
                      />

                      {watchCurrentType === 'Other' ? (
                        <Input 
                          label="Custom Venue Name" 
                          placeholder="Provide venue details" 
                          error={errors.venue_custom?.message} 
                          {...register('venue_custom')} 
                        />
                      ) : watchCurrentType ? (
                        <div className="space-y-2">
                          {(() => {
                            const selectedParent = venues.find(v => !v.parent_id && v.name === watchCurrentType);
                            const childVenues = selectedParent ? venues.filter(v => v.parent_id === selectedParent.id) : [];
                            if (childVenues.length === 0) return null;

                            return (
                              <>
                                <p className="text-xs font-semibold text-[var(--text-primary)]">Select Exact Venues <span className="text-[var(--text-danger)]">*</span></p>
                                <Controller 
                                  name={`venue_selections.${index}.venue_ids`} 
                                  control={control} 
                                  render={({ field: idsField }) => (
                                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-white border border-[var(--border-color)] rounded-xl">
                                      {childVenues.map(v => {
                                        const selected = idsField.value?.includes(v.id);
                                        return (
                                          <button
                                            key={v.id} type="button"
                                            onClick={() => {
                                              const curr = idsField.value || [];
                                              if (selected) idsField.onChange(curr.filter((id: number) => id !== v.id));
                                              else idsField.onChange([...curr, v.id]);
                                            }}
                                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${selected ? 'bg-[var(--status-info-bg)] text-[var(--status-info-text)] border-[var(--status-info-text)]' : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--surface-subtle)]'} border`}
                                          >
                                            {v.name}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )} 
                                />
                                {errors.venue_selections?.[index]?.venue_ids && <p className="text-[10px] text-[var(--text-danger)]">{errors.venue_selections[index].venue_ids?.message}</p>}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-4 border border-dashed border-[var(--border-color)] rounded-2xl bg-white/50">
                          <p className="text-xs text-[var(--text-muted)] italic">Select a venue type to see specific locations</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Controller name="seating_arrangement" control={control} render={({ field }) => (
                <Select
                  label="Seating Arrangement" 
                  options={[
                    { value: 'Theatre', label: 'Theatre' },
                    { value: 'Classroom', label: 'Classroom' },
                    { value: 'Round Tables', label: 'Round Tables' },
                    { value: 'U-Shape', label: 'U-Shape' },
                    { value: 'Other', label: 'Other' }
                  ]} 
                  placeholder="Select arrangement" 
                  error={errors.seating_arrangement?.message}
                  {...field}
                />
              )} />
              {watchSeating === 'Other' && (
                <Input label="Other Seating Details" placeholder="Specify seating..." error={errors.seating_other_detail?.message} {...register('seating_other_detail')} />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Tables Required" placeholder="e.g. 10 tables (6-seater)" error={errors.tables_required?.message} {...register('tables_required')} />
              <Input label="Chairs Required" placeholder="e.g. 60 chairs (folding)" error={errors.chairs_required?.message} {...register('chairs_required')} />
            </div>

            <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--page-bg)] rounded-2xl">
              <Controller name="podium_setup" control={control} render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Podium / Stage Setup" />} />
              <Controller name="decoration" control={control} render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Flower / Decoration" />} />
            </div>

            {watchPodium && <Textarea label="Podium / Stage Details" placeholder="Specify podium requirements..." error={errors.podium_details?.message} {...register('podium_details')} rows={2} />}
            {watchDecoration && <Textarea label="Decoration Details" placeholder="Specify decoration needs..." error={errors.decoration_details?.message} {...register('decoration_details')} rows={2} />}
          </div>
        )}

        {/* Section D: IT */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="section-title flex items-center gap-2"><Monitor className="w-5 h-5 text-[rgb(var(--color-primary))]" /> IT & Technical Requirements</h2>
            <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--page-bg)] rounded-2xl">
              <Controller name="it_projector" control={control} render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Projector" />} />
              <Controller name="it_audio" control={control} render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Audio System" />} />
              <Controller name="it_wifi" control={control} render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Wi-Fi Access" />} />
              <Controller name="it_laptop" control={control} render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Laptop Required" />} />
            </div>
            {watchAudio && <Textarea label="Audio System Details" placeholder="Specify mic count, speakers, etc." {...register('it_audio_details' as any)} rows={2} />}
            {watchLaptop && <Textarea label="Laptop Requirements Details" placeholder="Enter laptop requirements (count, software, specifications, etc.)" error={errors.it_laptop_details?.message} {...register('it_laptop_details')} rows={2} />}
            <Textarea label="Other IT Requirements" placeholder="Any other technical requirements…" {...register('it_other')} rows={2} />
          </div>
        )}

        {/* Section E: Food */}
        {step === 5 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="section-title flex items-center gap-2"><UtensilsCrossed className="w-5 h-5 text-[rgb(var(--color-primary))]" /> Food & Catering</h2>
            <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--page-bg)] rounded-2xl">
              <Controller name="food_items" control={control} render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Food Items Required" />} />
              <Controller name="beverage_items" control={control} render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Beverages Required" />} />
            </div>
            
            {watchFood && (
              <Textarea label="Food Details" placeholder="Specify food items needed…" error={errors.food_details?.message} {...register('food_details')} rows={2} />
            )}
            
            {watchBeverage && (
              <Textarea label="Beverage Details" placeholder="Specify beverages needed…" error={errors.beverage_details?.message} {...register('beverage_details')} rows={2} />
            )}

            {(watchFood || watchBeverage) && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Expected Attendees (PAX)" type="number" placeholder="e.g. 150" error={errors.pax_count?.message} {...register('pax_count')} />
                <Input label="Time of Service" placeholder="e.g. 1 PM Lunch, 4 PM Tea" error={errors.food_service_time?.message} {...register('food_service_time')} />
              </div>
            )}
          </div>
        )}

        {/* Section F: Additional */}
        {step === 6 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="section-title flex items-center gap-2"><Package className="w-5 h-5 text-[rgb(var(--color-primary))]" /> Additional Requirements</h2>
            <div className="grid grid-cols-2 gap-4 p-4 bg-[var(--page-bg)] rounded-2xl">
              <Controller name="transport" control={control} render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Transport" />} />
              <Controller name="security" control={control} render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Security" />} />
              <Controller name="printing" control={control} render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Printing" />} />
              <Controller name="volunteers" control={control} render={({ field }) => <Toggle checked={field.value} onChange={field.onChange} label="Volunteers" />} />
            </div>
            
            {watchTransport && <Textarea label="Transport Details" placeholder="Specify transport requirements..." error={errors.transport_details?.message} {...register('transport_details')} rows={2} />}
            {watchSecurity && <Textarea label="Security Details" placeholder="Specify security requirements..." error={errors.security_details?.message} {...register('security_details')} rows={2} />}
            {watchPrinting && <Textarea label="Printing Details" placeholder="Specify printing needs (banners, certificates…)" error={errors.printing_details?.message} {...register('printing_details')} rows={2} />}
            {watchVolunteers && <Textarea label="Volunteers Details" placeholder="Specify number and type of volunteers..." error={errors.volunteers_details?.message} {...register('volunteers_details')} rows={2} />}
            
            <Textarea label="Other Requirements" placeholder="Describe any other needs…" {...register('other_requirements')} rows={3} />
          </div>
        )}

        {/* Section R&D: Mandatory fields when toggle is ON */}
        {step === 7 && watchIsRnd && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="section-title flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-[rgb(var(--color-primary))]" /> R&D Information
            </h2>
            <Alert type="info">
              <span>Specify the research & development framework details for this event.</span>
            </Alert>

            <Controller
              name="rnd_activity_theme"
              control={control}
              render={({ field }) => (
                <Select
                  label="Activity Theme *"
                  options={RND_ACTIVITY_THEMES.map(t => ({ value: t, label: t }))}
                  placeholder="Select activity theme"
                  error={errors.rnd_activity_theme?.message}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    setValue('rnd_prescribed_activity', '');
                  }}
                />
              )}
            />

            {watchRndTheme && RND_PRESCRIBED_ACTIVITIES[watchRndTheme] && (
              <Controller
                name="rnd_prescribed_activity"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Prescribed Activity *"
                    options={RND_PRESCRIBED_ACTIVITIES[watchRndTheme].map(a => ({ value: a, label: a }))}
                    placeholder="Select prescribed activity"
                    error={errors.rnd_prescribed_activity?.message}
                    {...field}
                  />
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="rnd_semester_quarter"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Semester / Quarter"
                    options={SEMESTER_QUARTERS}
                    placeholder="Select semester / quarter"
                    error={errors.rnd_semester_quarter?.message}
                    {...field}
                  />
                )}
              />
              <Input
                label="Tentative Date"
                type="date"
                error={errors.rnd_tentative_date?.message}
                {...register('rnd_tentative_date')}
              />
            </div>
          </div>
        )}

        {/* Section G: Docs & Budget */}
        {step === FINAL_STEP && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="section-title flex items-center gap-2"><FileText className="w-5 h-5 text-[rgb(var(--color-primary))]" /> Event Poster & Budget</h2>
            <Alert type="info">
              <span>An event poster is optional but recommended. Participant docs and other files can be added later.</span>
            </Alert>
            <div className={`p-4 bg-[var(--page-bg)] rounded-xl border-2 border-dashed border-[var(--card-border)] flex flex-col items-center justify-center text-center`}>
              <input type="file" ref={posterRef} className="hidden" accept="image/*" onChange={(e) => {
                if (e.target.files && e.target.files[0]) setPosterFile(e.target.files[0]);
              }} />
              <Button type="button" variant="secondary" onClick={() => posterRef.current?.click()} icon={<FileText className="w-4 h-4" />}>
                {existingPoster || posterFile ? 'Change Event Poster' : 'Upload Event Poster'}
              </Button>
              {posterFile && <span className="text-xs text-[rgb(var(--color-primary))] mt-2 font-semibold">New poster: {posterFile.name}</span>}
              {!posterFile && existingPoster && (
                <p className="text-xs text-[var(--status-success-text)] mt-2 font-semibold">
                  ✓ Current poster on file ({existingPoster.split('/').pop() || existingPoster}) — upload new only to replace
                </p>
              )}
              {!posterFile && !existingPoster && <p className="text-xs text-[var(--text-muted)] mt-2 font-semibold">No poster uploaded — default will be used if none is uploaded</p>}
            </div>
            {/* Detailed Budget Breakdown */}
            <div
              className="space-y-4 p-5 rounded-2xl border border-[var(--card-border)] bg-[var(--surface-subtle)]"
              onBlur={() => recalculateTotal()}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-base text-[var(--text-primary)] flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-[rgb(var(--color-primary))]" /> Budget Breakdown
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Itemize your proposed expense categories below. The total budget is automatically calculated when you finish entering the amounts and click outside.
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {budgetFields.map((field, idx) => (
                  <div key={field.id} className="p-3.5 bg-white dark:bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] shadow-sm space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                        Budget Item #{idx + 1}
                      </span>
                      {budgetFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBudgetItem(idx)}
                          className="text-[var(--text-danger)] hover:bg-[var(--status-danger-bg)] h-7 px-2"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="sm:col-span-7">
                        <Input
                          label="Category / Description *"
                          placeholder="e.g. Prize Money, Food, Marketing, Venue, etc."
                          {...register(`budget_breakdown.${idx}.category` as const, {
                            onBlur: () => recalculateTotal(),
                          })}
                          error={errors.budget_breakdown?.[idx]?.category?.message}
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <Input
                          label="Allocated Amount (₹) *"
                          type="number"
                          min="0"
                          step="any"
                          placeholder="e.g. 5000"
                          {...register(`budget_breakdown.${idx}.amount` as const, {
                            valueAsNumber: true,
                            onBlur: () => recalculateTotal(),
                          })}
                          error={errors.budget_breakdown?.[idx]?.amount?.message}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {budgetFields.length === 0 && (
                  <div className="p-6 text-center border-2 border-dashed border-[var(--card-border)] rounded-xl bg-white/50 dark:bg-black/10">
                    <p className="text-sm text-[var(--text-muted)] mb-3">No budget items added yet.</p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleAddBudgetItem}
                      icon={<Plus className="w-4 h-4" />}
                    >
                      Add Budget Item
                    </Button>
                  </div>
                )}
              </div>

              {/* Action Bar & Total Calculation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddBudgetItem}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add Item
                </Button>

                <div className="flex items-center gap-3 p-3 bg-white dark:bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] shadow-sm">
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
                      Calculated Total Budget
                    </span>
                    <span className="text-lg font-bold text-[rgb(var(--color-primary))] font-mono block">
                      ₹ {displayedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Textarea label="Additional Comments" placeholder="Any other notes for the approvers…" {...register('comments')} rows={4} />

            {/* Summary */}
            <div className="p-4 bg-[var(--card-bg)] rounded-2xl">
              <p className="text-sm font-semibold text-[rgb(var(--color-primary))] mb-2">Ready to submit?</p>
              <p className="text-xs text-[rgb(var(--color-primary))]">
                Saving as draft lets you continue editing. Submitting sends the event through the approval chain immediately.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--card-border)]">
          <div>
            {step > 1 && (
              <Button type="button" variant="secondary" icon={<ChevronLeft className="w-4 h-4" />} onClick={() => setStep(s => s - 1)}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            {step === FINAL_STEP ? (
              <>
                <Button type="button" variant="secondary" loading={saving} icon={<Save className="w-4 h-4" />}
                  onClick={handleSubmit(saveAsDraft, (errs) => { console.error('Form validation errors:', errs); toast.error("Please check previous sections for missing valid data."); })}>
                  {isEditMode ? 'Save Changes (Draft)' : 'Save Draft'}
                </Button>
                <Button type="button" onClick={handleSubmit(openTermsModal, (errs) => { console.error('Form validation errors:', errs); toast.error("Please check previous sections for missing valid data."); })} icon={<Send className="w-4 h-4" />}>
                  {isSuperAdmin ? (isEditMode ? 'Save & Approve' : 'Create & Approve') : (isEditMode ? 'Submit Changes for Approval' : 'Submit for Approval')}
                </Button>
              </>
            ) : (
              <Button type="button" icon={<ChevronRight className="w-4 h-4" />} onClick={nextStep}>
                Next Section
              </Button>
            )}
          </div>
        </div>
      </form>

      <TermsModal
        open={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        onConfirm={confirmAndSubmit}
        loading={submitting}
      />
    </div>
  );
}
