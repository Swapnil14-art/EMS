'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, CheckCircle2, ChevronRight, KeyRound } from 'lucide-react';
import { authService } from '@/lib/services';
import { Button, Input, Alert } from '@/components/ui';

const schema = z.object({
  email: z.string().email('Enter a valid email').endsWith('@nmims.in', 'Must be your official @nmims.in email'),
});
type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await authService.resetPassword({ email: data.email });
      // Always show success even if the email doesn't exist for security
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail;
      // Depending on the backend we might still show success even on error to prevent email enumeration,
      // But typically 400s or 429s (rate limits) should be shown.
      if (err.response?.status === 429) {
        setApiError('Too many requests. Please try again later.');
      } else {
        setSuccess(true); // Don't expose whether email exists
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--card-bg)] animate-fade-in">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-5/12 blue-section relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <span className="text-[var(--btn-primary-text)] font-bold font-display">E</span>
            </div>
            <div>
              <p className="text-[var(--btn-primary-text)] font-display font-bold">EMS</p>
              <p className="text-[rgb(var(--color-primary))]/20 text-xs">NMIMS Shirpur</p>
            </div>
          </Link>
        </div>
        <div className="relative z-10">
          <KeyRound className="w-16 h-16 text-[var(--btn-primary-text)]/30 mb-6" />
          <h2 className="font-display font-bold text-[var(--btn-primary-text)] text-4xl mb-4 leading-tight">
            Account Recovery
          </h2>
          <p className="text-[rgb(var(--color-primary))]/20 text-base leading-relaxed mb-8">
            Forgot your password? Enter your @nmims.in email address and we'll send you a temporary password to regain access.
          </p>
        </div>
        <div className="relative z-10 text-[rgb(var(--color-primary))]/30 text-xs">
          Remember your password?{' '}
          <Link href="/login" className="text-[var(--btn-primary-text)] font-semibold hover:underline">Sign in</Link>
        </div>
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
            <h2 className="font-display font-bold text-[var(--text-primary)] text-3xl">Recover Password</h2>
            <p className="text-[var(--text-secondary)] mt-1">Get a temporary login password via email</p>
          </div>

          {apiError && <Alert type="error" className="mb-5"><span>{apiError}</span></Alert>}

          {success ? (
            <div className="space-y-6 animate-slide-up">
              <div className="bg-[rgb(var(--alert-success-bg)/0.1)] border border-[rgb(var(--alert-success-border)/0.2)] text-[var(--alert-success-text)] p-6 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 mb-4 text-[var(--status-success-text)]" />
                <h3 className="font-bold text-lg mb-2 text-[var(--status-success-text)]">Check your inbox</h3>
                <p className="text-sm font-medium">If an account with that email exists, we have sent a temporary password to it. Please check your inbox and spam folders.</p>
              </div>
              <Link href="/login">
                <Button className="w-full justify-center">Return to Login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-fade-in">
              <Input
                label="Registered Email Address"
                type="email"
                placeholder="yourname@nmims.in"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
                autoComplete="email"
                disabled={isSubmitting}
              />
              <Button type="submit" loading={isSubmitting} className="w-full justify-center py-3">
                Send Recovery Email <ChevronRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
            <Link href="/login" className="text-[rgb(var(--color-primary))] font-semibold hover:underline">Back to Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
