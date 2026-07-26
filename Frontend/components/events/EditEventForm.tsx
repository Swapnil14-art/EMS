'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Info, Calendar, MapPin, Monitor, UtensilsCrossed,
  Package, FileText, ChevronRight, ChevronLeft, Save, AlertTriangle, ArrowLeft, Plus, Trash2
} from 'lucide-react';
import { Button, Input, Select, Textarea, Toggle, Alert, Combobox } from '@/components/ui';
import { eventService, venueService } from '@/lib/services';
import type { Event } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { TermsModal } from '@/components/shared/TermsModal';
import { SchoolDisplay } from '@/components/shared/SchoolDisplay';
import toast from 'react-hot-toast';

/** Convert a datetime-local input value (local time, no TZ) to a UTC ISO string for the API */
const toUTCISOString = (localDatetime: string): string => {
  if (!localDatetime) return localDatetime;
  const date = new Date(localDatetime);
  if (isNaN(date.getTime())) return localDatetime;
  return date.toISOString();
};

const schema = z.object({
  title: z.string().min(3, 'Title required'),
  event_type: z.string().min(1, 'Select event type'),
  school_department: z.string().min(1, 'School required'),
  event_incharge_name: z.string().min(2, 'Incharge name required'),
  event_incharge_contact: z.string().min(10, 'Valid contact required'),
  target_audience: z.string().optional(),
  departments_involved: z.array(z.string()).min(1, 'Select at least one department'),
  is_club_event: z.boolean(),
  is_collaborative: z.boolean(),
  is_sponsored: z.boolean(),
  objectives: z.array(z.string()).optional(),
  start_datetime: z.string().min(1, 'Start date/time required'),
  end_datetime: z.string().min(1, 'End date/time required'),
  venue_id: z.string().optional(),
  venue_custom: z.string().optional(),
  venue_type: z.string().optional(),
  seating_arrangement: z.string().optional(),
  seating_other_detail: z.string().optional(),
  tables_required: z.string().optional(),
  chairs_required: z.string().optional(),
  podium_setup: z.boolean().default(false),
  podium_details: z.string().optional(),
  decoration: z.boolean().default(false),
  decoration_details: z.string().optional(),
  it_projector: z.boolean(),
  it_audio: z.boolean(),
  it_wifi: z.boolean(),
  it_laptop: z.boolean(),
  it_laptop_details: z.string().optional(),
  it_other: z.string().optional(),
  food_items: z.boolean(),
  food_details: z.string().optional(),
  beverage_items: z.boolean(),
  beverage_details: z.string().optional(),
  pax_count: z.coerce.number().optional(),
  food_service_time: z.string().optional(),
  transport: z.boolean(),
  transport_details: z.string().optional(),
  security: z.boolean(),
  security_details: z.string().optional(),
  printing: z.boolean(),
  printing_details: z.string().optional(),
  volunteers: z.boolean(),
  volunteers_details: z.string().optional(),
  other_requirements: z.string().optional(),
  budget: z.coerce.number().optional(),
  comments: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.start_datetime && data.end_datetime) {
    const start = new Date(data.start_datetime);
    const end = new Date(data.end_datetime);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'End date & time must be after start date & time', path: ['end_datetime'] });
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
});
type FormData = z.infer<typeof schema>;

const SECTIONS = [
  { id: 1, label: 'Basic Info', icon: <Info className="w-4 h-4" /> },
  { id: 2, label: 'Schedule', icon: <Calendar className="w-4 h-4" /> },
  { id: 3, label: 'Venue & Setup', icon: <MapPin className="w-4 h-4" /> },
  { id: 4, label: 'IT & Tech', icon: <Monitor className="w-4 h-4" /> },
  { id: 5, label: 'Food & Catering', icon: <UtensilsCrossed className="w-4 h-4" /> },
  { id: 6, label: 'Additional', icon: <Package className="w-4 h-4" /> },
  { id: 7, label: 'Poster & Budget', icon: <FileText className="w-4 h-4" /> },
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

// Helper to format date strings for input type="datetime-local"
const formatDateTimeForInput = (isoString?: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  // Convert to local time format YYYY-MM-DDThh:mm
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localIsoTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, -1);
  return localIsoTime.substring(0, 16);
};

function SectionProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i < current ? 'bg-[var(--btn-primary-bg)]' : i === current - 1 ? 'bg-[var(--btn-primary-bg)]' : 'bg-muted'}`} />
      ))}
    </div>
  );
}

export default function EditEventForm({ basePath, eventId }: { basePath: string, eventId: number }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [bufferedData, setBufferedData] = useState<FormData | null>(null);
  const [venues, setVenues] = useState<any[]>([]);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [existingPoster, setExistingPoster] = useState<string | null>(null);
  const posterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    venueService.list().then(res => setVenues(res.data)).catch(() => {});
  }, []);

  const { register, control, handleSubmit, watch, trigger, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'objectives' as never
  });

  useEffect(() => {
    eventService.get(eventId)
      .then(ev => {
        setExistingPoster(ev.poster_path || null);
        reset({
          title: ev.title || '',
          event_type: ev.event_type || '',
          school_department: ev.school_department || '',
          event_incharge_name: ev.event_incharge_name || '',
          event_incharge_contact: ev.event_incharge_contact || '',
          departments_involved: ev.target_audience ? ev.target_audience.split(',').map((s: string) => s.trim()) : [],
          target_audience: ev.target_audience || '',
          is_club_event: !!ev.is_club_event,
          is_collaborative: !!ev.is_collaborative,
          is_sponsored: !!ev.is_sponsored,
          start_datetime: formatDateTimeForInput(ev.start_datetime),
          end_datetime: formatDateTimeForInput(ev.end_datetime),
          venue_id: ev.venue_id ? ev.venue_id.toString() : '',
          venue_custom: ev.venue_custom || '',
          venue_type: ev.venue_type || '',
          seating_arrangement: ev.seating_arrangement || '',
          seating_other_detail: (ev as any).seating_other_detail || '',
          tables_required: (ev as any).tables_required || '',
          chairs_required: (ev as any).chairs_required || '',
          podium_setup: !!(ev as any).podium_setup,
          podium_details: (ev as any).podium_details || '',
          decoration: !!(ev as any).decoration,
          decoration_details: (ev as any).decoration_details || '',
          // Assuming IT and Food fields are part of comments / extra JSON or just dummy for now
          // For a true Edit form with missing flat fields from Event type, we just leave them default false
          it_projector: false, it_audio: false, it_wifi: false, it_laptop: !!(ev as any).it_laptop,
          it_laptop_details: (ev as any).it_laptop_details || '',
          food_items: !!(ev as any).food_items, beverage_items: !!(ev as any).beverage_items,
          food_details: (ev as any).food_details || '', beverage_details: (ev as any).beverage_details || '',
          pax_count: (ev as any).pax_count || undefined, food_service_time: (ev as any).food_service_time || '',
          transport: !!(ev as any).transport, security: !!(ev as any).security, 
          printing: !!(ev as any).printing, volunteers: !!(ev as any).volunteers,
          transport_details: (ev as any).transport_details || '',
          security_details: (ev as any).security_details || '',
          printing_details: (ev as any).printing_details || '',
          volunteers_details: (ev as any).volunteers_details || '',
          budget: ev.budget || undefined,
          comments: ev.comments || '',
          objectives: ev.objectives?.length ? ev.objectives : ['', '', ''],
        });
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load event");
        router.push(`${basePath}/events`);
      });
  }, [eventId, reset, basePath, router]);

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
    1: ['title', 'event_type', 'school_department', 'event_incharge_name', 'event_incharge_contact', 'departments_involved', 'objectives'],
    2: ['start_datetime', 'end_datetime'],
    3: [], 4: [], 5: [], 6: [], 7: [],
  };

  const nextStep = async () => {
    const ok = await trigger(STEP_FIELDS[step] || []);
    if (ok) {
      setStep(s => Math.min(s + 1, 7));
    } else {
      toast.error("Please fill all required fields correctly before proceeding.", { id: 'validation-error' });
    }
  };

  const openTermsModal = (data: FormData) => {
    if (!window.confirm("WARNING: Saving these changes will reset the event's approval status and it will need to go through the approval chain again. Are you sure?")) {
      return;
    }
    setBufferedData(data);
    setIsTermsOpen(true);
  };

  const confirmAndSubmit = async () => {
    if (!bufferedData) return;
    setSaving(true);
    try {
      // Send the form data through — mapEventToApi handles cleanup
      const payload = {
        ...bufferedData,
        target_audience: bufferedData.departments_involved.join(', '),
        start_datetime: toUTCISOString(bufferedData.start_datetime),
        end_datetime: toUTCISOString(bufferedData.end_datetime),
        event_type: bufferedData.event_type,
        venue_custom: bufferedData.venue_type === 'Other' ? bufferedData.venue_custom : null,
        venue_id: bufferedData.venue_type !== 'Other' ? bufferedData.venue_id : null,
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
        volunteers_details: bufferedData.volunteers ? bufferedData.volunteers_details : null
      };
      
      await eventService.update(eventId, payload as any);
      if (posterFile) {
        try { await eventService.uploadPoster(eventId, posterFile); } catch(err) {}
      }
      setIsTermsOpen(false);
      toast.success('Changes saved. Event updated!');
      router.push(`${basePath}/events`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-center text-[var(--text-muted)]">Loading event details...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-ghost p-2 -ml-2 text-[var(--text-muted)] hover:text-[rgb(var(--color-primary))]"><ArrowLeft className="w-5 h-5"/></button>
        <div>
          <h1 className="page-title">Edit Event Details</h1>
          <p className="page-subtitle">Update event information. Note that major changes will reset the approval workflow.</p>
        </div>
      </div>

      <Alert type="warning" className="border-orange-200 bg-orange-50 text-orange-800">
        <AlertTriangle className="w-5 h-5 text-orange-500 mr-2 inline-block" />
        <strong>Warning:</strong> Modifying details of this event will trigger the approval chain from the start.
      </Alert>

      {/* Step nav */}
      <div className="card p-4">
        <div className="flex gap-2 flex-wrap">
          {SECTIONS.map(s => (
            <button key={s.id} type="button" onClick={() => setStep(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                s.id === step ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]' :
                'bg-[var(--card-bg)] text-[rgb(var(--color-primary))] cursor-pointer hover:bg-[var(--btn-primary-bg)]'
              }`}>
              {s.icon} <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.id}</span>
            </button>
          ))}
        </div>
        <SectionProgress current={step} total={7} />
      </div>

      <form className="card p-6 space-y-6">
        {/* Section A: Basic Info */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="section-title flex items-center gap-2"><Info className="w-5 h-5 text-[rgb(var(--color-primary))]" /> Basic Information</h2>
            <Input label="Event Title" placeholder="e.g. TechFest 2025" error={errors.title?.message} {...register('title')} />
            <div className="grid grid-cols-2 gap-4">
              <Controller name="event_type" control={control} render={({ field }) => (
                <Select label="Event Type" options={EVENT_TYPES} placeholder="Select type" error={errors.event_type?.message} {...field} />
              )} />
            </div>
            
            <div className="space-y-3 p-4 bg-[var(--page-bg)] rounded-2xl">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Departments Involved <span className="text-[var(--text-danger)]">*</span></p>
              <Controller name="departments_involved" control={control} render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENTS_INVOLVED_OPTIONS.map(d => {
                    const selected = field.value?.includes(d.value);
                    return (
                      <button
                        key={d.value} type="button"
                        onClick={() => {
                          const curr = field.value || [];
                          if (selected) field.onChange(curr.filter((n: string) => n !== d.value));
                          else field.onChange([...curr, d.value]);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${selected ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-[var(--card-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-gray-100'} border`}
                      >
                        <SchoolDisplay value={d.value} />
                      </button>
                    );
                  })}
                </div>
              )} />
              {errors.departments_involved && <p className="text-xs text-[var(--text-danger)]">{errors.departments_involved.message}</p>}
            </div>

            <Input label="School" placeholder="e.g. School of Engineering" error={errors.school_department?.message} {...register('school_department')} />
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
              {watch('is_collaborative') && <p className="text-xs text-[var(--text-muted)] ml-10">Collaborating clubs can be added from the event dashboard.</p>}
              <Controller name="is_sponsored" control={control} render={({ field }) => (
                <Toggle checked={field.value} onChange={field.onChange} label="This event has Sponsors" />
              )} />
              {watch('is_sponsored') && <p className="text-xs text-[var(--text-muted)] ml-10">Sponsors can be added from the event dashboard.</p>}
            </div>

            <div className="flex flex-col gap-3 p-4 bg-[var(--page-bg)] rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--text-primary)]">Event Objectives <span className="text-[var(--text-danger)]">*</span></span>
              </div>
              <p className="text-xs text-[var(--text-muted)] -mt-1">Provide at least 3 objectives for your event.</p>
              
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input 
                      placeholder={`Objective ${index + 1}`} 
                      error={errors.objectives?.[index]?.message} 
                      {...register(`objectives.${index}` as const)} 
                    />
                  </div>
                  {fields.length > 3 && (
                    <button type="button" onClick={() => remove(index)} className="p-2.5 text-[var(--text-danger)] hover:bg-red-50 hover:text-[var(--text-danger)] rounded-xl transition-colors mt-0.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              {errors.objectives?.root?.message && (
                <p className="text-xs font-medium text-[var(--text-danger)]">{errors.objectives.root.message}</p>
              )}
              
              <Button type="button" variant="secondary" onClick={() => append('')} icon={<Plus className="w-4 h-4"/>} className="text-xs py-2 self-start">
                Add Another Objective
              </Button>
            </div>
          </div>
        )}

        {/* Section B: Schedule */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="section-title flex items-center gap-2"><Calendar className="w-5 h-5 text-[rgb(var(--color-primary))]" /> Flow of Event</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date & Time" type="datetime-local" error={errors.start_datetime?.message} {...register('start_datetime')} />
              <Input label="End Date & Time" type="datetime-local" error={errors.end_datetime?.message} {...register('end_datetime')} />
            </div>
          </div>
        )}

        {/* Section C: Venue */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <h2 className="section-title flex items-center gap-2"><MapPin className="w-5 h-5 text-[rgb(var(--color-primary))]" /> Venue & Setup</h2>
            <div className="grid grid-cols-2 gap-4">
              <Controller name="venue_type" control={control} render={({ field }) => (
                <Select label="Venue Type" options={[{value:'Auditorium',label:'Auditorium'},{value:'Seminar Hall',label:'Seminar Hall'},{value:'Conference Room',label:'Conference Room'},{value:'Other',label:'Other'}]} placeholder="Select venue type" error={errors.venue_type?.message} {...field} />
              )} />
              
              {watchVenueType === 'Other' ? (
                <Input label="Custom Venue Name" placeholder="Provide venue details" error={errors.venue_custom?.message} {...register('venue_custom')} />
              ) : (
                <Controller name="venue_id" control={control} render={({ field }) => (
                  <Select
                    label="Select Exact Venue (Optional)" 
                    options={venues.map(v => ({value: v.id.toString(), label: v.name}))} 
                    placeholder="Select a venue" 
                    value={field.value || ''} 
                    onChange={field.onChange}
                  />
                )} />
              )}
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

        {/* Section G: Docs & Budget */}
        {step === 7 && (
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
                {existingPoster ? 'Replace Event Poster' : 'Upload Event Poster'}
              </Button>
              {posterFile && <span className="text-xs text-[rgb(var(--color-primary))] mt-2 font-semibold">New poster: {posterFile.name}</span>}
              {!posterFile && existingPoster && <span className="text-xs text-emerald-600 mt-2 font-semibold">✓ Existing poster on file</span>}
              {!posterFile && !existingPoster && <p className="text-xs text-[var(--text-muted)] mt-2 font-semibold">No poster uploaded — default will be used if none is uploaded</p>}
            </div>
            <Input label="Estimated Budget (₹)" type="number" placeholder="e.g. 25000" {...register('budget')} />
            <Textarea label="Additional Comments" placeholder="Any other notes for the approvers…" {...register('comments')} rows={4} />

            <div className="p-4 bg-red-50 rounded-2xl">
              <p className="text-sm font-semibold text-[var(--text-danger)] mb-2">Final Review</p>
              <p className="text-xs text-[var(--text-danger)]">
                Clicking "Save Changes" will submit this updated event to the approval queue.
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
            {step === 7 ? (
              <Button type="button" loading={saving} icon={<Save className="w-4 h-4" />}
                onClick={handleSubmit(openTermsModal, () => toast.error("Please check previous sections for missing valid data."))}>
                Save Changes
              </Button>
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
        loading={saving}
      />
    </div>
  );
}
