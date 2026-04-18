'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, LockKeyhole, ChevronRight, CheckCircle2 } from 'lucide-react';
import { authService } from '@/lib/services';
import { useAuthStore } from '@/store/authStore';
import { Button, Input, Alert } from '@/components/ui';
import { extractApiError } from '@/lib/transformers';

const schema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirm_password: z.string(),
}).refine(d => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});
type FormData = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  // Security layer: ensure user is actually logged in
  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  // API mapped from POST /auth/change-password
  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await authService.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });

      if (user) {
        setUser({ ...user, force_password_change: false, is_first_login: false });
      }
      // Redirect to profile completion or dashboard
      if (user && !user.profile_completed && ['student', 'club_coordinator'].includes(user.role)) {
        router.push('/complete-profile');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setApiError(extractApiError(err, 'Failed to update password. Please try again.'));
    }
  };

  if (!user) return null; // Prevent flash before redirect

  return (
    <div className="min-h-screen flex bg-[var(--card-bg)] animate-fade-in">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-5/12 blue-section relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <span className="text-[var(--btn-primary-text)] font-bold font-display">E</span>
            </div>
            <div>
              <p className="text-[var(--btn-primary-text)] font-display font-bold">EMS</p>
              <p className="text-[rgb(var(--color-primary))]/20 text-xs">NMIMS Shirpur</p>
            </div>
          </div>
        </div>
        <div className="relative z-10">
          <LockKeyhole className="w-16 h-16 text-[var(--btn-primary-text)]/30 mb-6" />
          <h2 className="font-display font-bold text-[var(--btn-primary-text)] text-4xl mb-4 leading-tight">
            Secure Your Account
          </h2>
          <p className="text-[rgb(var(--color-primary))]/20 text-base leading-relaxed mb-8">
            You are required to change your temporary password before accessing the system.
          </p>
          <div className="space-y-3">
            {['Use at least 8 characters', 'Make it unique and unpredictable', 'Do not share this password'].map(t => (
              <div key={t} className="flex items-center gap-3 text-[rgb(var(--color-primary))]/10 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[rgb(var(--color-primary))]/20 flex-shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-[rgb(var(--color-primary))]/30 text-xs text-transparent">.</div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-[var(--btn-primary-bg)] rounded-xl flex items-center justify-center">
              <span className="text-[var(--btn-primary-text)] font-bold font-display text-sm">E</span>
            </div>
            <span className="font-display font-bold text-[var(--text-primary)]">EMS — NMIMS Shirpur</span>
          </div>

          <div className="mb-6">
            <h2 className="font-display font-bold text-[var(--text-primary)] text-3xl">Create New Password</h2>
            <p className="text-[var(--text-secondary)] mt-1">Please replace your temporary login password.</p>
          </div>

          {apiError && <Alert type="error" className="mb-5"><span>{apiError}</span></Alert>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-fade-in">
            <Input
              label="Current / Temporary Password"
              type={showCurrentPass ? 'text' : 'password'}
              placeholder="Enter your current password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.current_password?.message}
              rightElement={
                <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1" tabIndex={-1}>
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register('current_password')}
              autoComplete="current-password"
            />
            <Input
              label="New Password"
              type={showPass ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.new_password?.message}
              rightElement={
                <button type="button" onClick={() => setShowPass(!showPass)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1" tabIndex={-1}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register('new_password')}
              autoComplete="new-password"
            />
            <Input
              label="Confirm New Password"
              type={showConfirmPass ? 'text' : 'password'}
              placeholder="Repeat your new password"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.confirm_password?.message}
              rightElement={
                <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1" tabIndex={-1}>
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register('confirm_password')}
              autoComplete="new-password"
            />
            <Button type="submit" loading={isSubmitting} className="w-full justify-center py-3">
              Change Password & Continue <ChevronRight className="w-4 h-4" />
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
