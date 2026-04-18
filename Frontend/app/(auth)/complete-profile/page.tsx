'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Phone, GraduationCap, ChevronRight, Hash, Users, Network } from 'lucide-react';
import { authService, departmentService } from '@/lib/services';
import { useAuthStore } from '@/store/authStore';
import { COURSES, SPECIALIZATIONS, YEAR_OF_STUDY } from '@/lib/utils';
import { Button, Input, Select, Alert } from '@/components/ui';
import { extractApiError } from '@/lib/transformers';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  department_id: z.string().min(1, 'Select a department'),
  course: z.string().optional(),
  branch: z.string().optional(),
  year_of_study: z.string().optional(),
  sap_id: z.string().optional(),
  phone_number: z.string().min(10, 'Enter a valid 10-digit number').max(15),
}).superRefine((data, ctx) => {
  if (!data.sap_id || data.sap_id.length < 10) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Valid SAP ID required', path: ['sap_id'] });
  }
  if (!data.course) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select a course', path: ['course'] });
  }
  if (!data.branch) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select a branch/specialization', path: ['branch'] });
  }
  if (!data.year_of_study) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select your year of study', path: ['year_of_study'] });
  }
});
type FormData = z.infer<typeof schema>;

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [apiError, setApiError] = useState('');
  const [departments, setDepartments] = useState<{label: string; value: string}[]>([]);

  const { register, handleSubmit, watch, control, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  const watchedCourse = watch('course');
  const specializationOptions = watchedCourse ? SPECIALIZATIONS[watchedCourse] || [] : [];

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  // API mapped from GET /departments/
  useEffect(() => {
    departmentService.list().then((depts) => {
      const deptArray = Array.isArray(depts) ? depts : (depts as any)?.data || [];
      setDepartments(deptArray.map((d: any) => ({ label: d.name, value: String(d.id) })));
    }).catch(console.error);
  }, []);

  // Reset specialization when course changes
  useEffect(() => {
    setValue('branch', '');
  }, [watchedCourse, setValue]);

  // API mapped from POST /auth/complete-profile
  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      const payload: any = {
        name: data.name,
        department_id: Number(data.department_id),
        branch: data.branch,
        year_of_study: data.year_of_study,
        course: data.course,
        sap_id: data.sap_id,
        phone_number: data.phone_number,
        is_club_coordinator_requested: false,
        club_name: null,
      };

      await authService.completeProfile(payload);
      
      if (user) {
        setUser({
          ...user,
          name: data.name,
          profile_completed: true,
          role: user.role,
        });
      }
      
      router.push('/');
    } catch (err: any) {
      setApiError(extractApiError(err, 'Failed to complete profile. Please check your data.'));
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-[var(--card-bg)] animate-fade-in">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-4/12 blue-section relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <span className="text-[var(--btn-primary-text)] font-bold font-display">E</span>
            </div>
            <p className="text-[var(--btn-primary-text)] font-display font-bold">EMS</p>
          </div>
          <GraduationCap className="w-16 h-16 text-[var(--btn-primary-text)]/30 mb-6" />
          <h2 className="font-display font-bold text-[var(--btn-primary-text)] text-4xl mb-4 leading-tight">
            Tell us about<br />yourself
          </h2>
          <p className="text-[rgb(var(--color-primary))]/20 text-base leading-relaxed">
            Please complete your profile to access all events and features inside EMS.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-start justify-center p-6 lg:py-12 overflow-y-auto w-full">
        <div className="w-full max-w-xl">
          <div className="mb-8">
            <h2 className="font-display font-bold text-[var(--text-primary)] text-3xl">Complete Profile</h2>
            <p className="text-[var(--text-secondary)] mt-1">Final step before you enter the dashboard</p>
          </div>

          {apiError && <Alert type="error" className="mb-6"><span>{apiError}</span></Alert>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
            {/* General Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <Input
                  label="Full Name"
                  placeholder="e.g. Adarsh Sharma"
                  leftIcon={<User className="w-4 h-4" />}
                  error={errors.name?.message}
                  {...register('name')}
                />
              </div>
              <>
                <Input
                    label="SAP ID"
                    placeholder="70XXXXXXXXX"
                    leftIcon={<Hash className="w-4 h-4" />}
                    error={errors.sap_id?.message}
                    {...register('sap_id')}
                  />

                  <Input
                    label="Phone Number"
                    placeholder="+91..."
                    leftIcon={<Phone className="w-4 h-4" />}
                    error={errors.phone_number?.message}
                    {...register('phone_number')}
                  />

                  <div className="sm:col-span-2">
                    <Controller
                      name="department_id"
                      control={control}
                      render={({ field }) => (
                        <Select
                          label="School / Department"
                          options={departments}
                          placeholder="Select your department"
                          error={errors.department_id?.message}
                          {...field}
                        />
                      )}
                    />
                  </div>

                  <Controller
                    name="course"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Course"
                        options={COURSES}
                        placeholder="Select course"
                        error={errors.course?.message}
                        {...field}
                      />
                    )}
                  />

                  <Controller
                    name="branch"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Branch / Specialization"
                        options={specializationOptions}
                        placeholder={watchedCourse ? 'Select branch' : 'Select course first'}
                        disabled={!watchedCourse || specializationOptions.length === 0}
                        error={errors.branch?.message}
                        {...field}
                      />
                    )}
                  />

                  <div className="sm:col-span-2">
                    <Controller
                      name="year_of_study"
                      control={control}
                      render={({ field }) => (
                        <Select
                          label="Current Year of Study"
                          options={YEAR_OF_STUDY}
                          placeholder="Select year"
                          error={errors.year_of_study?.message}
                          {...field}
                        />
                      )}
                    />
                  </div>
                </>
            </div>

            <div className="pt-4">
              <Button type="submit" loading={isSubmitting} className="w-full justify-center py-3">
                Complete Profile & Access Dashboard <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
