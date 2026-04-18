'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, CheckCircle2, ChevronRight, GraduationCap, ShieldOff } from 'lucide-react';
import { authService, systemService } from '@/lib/services';
import { Button, Input, Alert } from '@/components/ui';

const schema = z.object({
  email: z.string().email('Enter a valid email').endsWith('@nmims.in', 'Must be your official @nmims.in email'),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);
  const [signupDisabled, setSignupDisabled] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  // Check if signup is disabled via public config (no auth needed)
  useEffect(() => {
    systemService.getPublicConfig()
      .then(config => {
        if (config?.disable_role_signup) {
          setSignupDisabled(true);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingConfig(false));
  }, []);

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await authService.signup({ email: data.email });
      setSuccess(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Signup failed. Please try again or contact support.';
      setApiError(msg);
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
          <GraduationCap className="w-16 h-16 text-[var(--btn-primary-text)]/30 mb-6" />
          <h2 className="font-display font-bold text-[var(--btn-primary-text)] text-4xl mb-4 leading-tight">
            Join the campus<br />event ecosystem
          </h2>
          <p className="text-[rgb(var(--color-primary))]/20 text-base leading-relaxed mb-8">
            Create your student account with your @nmims.in email. You will receive a temporary password to get started.
          </p>
          <div className="space-y-3">
            {['Discover events from all schools', 'Register with one click', 'Get participant documents instantly', 'Stay updated via email notifications'].map(t => (
              <div key={t} className="flex items-center gap-3 text-[rgb(var(--color-primary))]/10 text-sm">
                <CheckCircle2 className="w-4 h-4 text-[rgb(var(--color-primary))]/20 flex-shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-[rgb(var(--color-primary))]/30 text-xs">
          Already have an account?{' '}
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

          {/* ─── Signup Disabled State ─────────────────────────────────── */}
          {!checkingConfig && signupDisabled ? (
            <div className="space-y-6 animate-slide-up">
              <div className="mb-6">
                <h2 className="font-display font-bold text-[var(--text-primary)] text-3xl">Registration Disabled</h2>
                <p className="text-[var(--text-secondary)] mt-1">User registration is currently unavailable</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 text-orange-800 p-6 rounded-2xl">
                <ShieldOff className="w-10 h-10 mb-4 text-orange-500" />
                <h3 className="font-bold text-lg mb-2 text-orange-700">Registration Closed</h3>
                <p className="text-sm font-medium">
                  User registration is currently disabled by administrator. Please contact the Super Admin if you need an account.
                </p>
              </div>

              <Link href="/login">
                <Button className="w-full justify-center">Return to Login</Button>
              </Link>
            </div>
          ) : checkingConfig ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-[var(--input-focus-ring)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="font-display font-bold text-[var(--text-primary)] text-3xl">Create Account</h2>
                <p className="text-[var(--text-secondary)] mt-1">Student registration using @nmims.in email</p>
              </div>

              {apiError && <Alert type="error" className="mb-5"><span>{apiError}</span></Alert>}

              {success ? (
                <div className="space-y-6 animate-slide-up">
                  <div className="bg-[rgb(var(--alert-success-bg)/0.1)] border border-[rgb(var(--alert-success-border)/0.2)] text-[var(--alert-success-text)] p-6 rounded-2xl">
                    <CheckCircle2 className="w-10 h-10 mb-4 text-green-500" />
                    <h3 className="font-bold text-lg mb-2 text-green-700">Check your inbox</h3>
                    <p className="text-sm font-medium">A temporary password has been sent to your email. Please use it to log in, after which you will be prompted to create your own secure password.</p>
                  </div>
                  <Link href="/login">
                    <Button className="w-full justify-center">Return to Login</Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 animate-fade-in">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="yourname@nmims.in"
                    leftIcon={<Mail className="w-4 h-4" />}
                    error={errors.email?.message}
                    hint="We will email you a temporary login password."
                    {...register('email')}
                    autoComplete="email"
                    disabled={isSubmitting}
                  />
                  <Button type="submit" loading={isSubmitting} className="w-full justify-center py-3">
                    Send Temporary Password <ChevronRight className="w-4 h-4" />
                  </Button>
                </form>
              )}
            </>
          )}

          <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[rgb(var(--color-primary))] font-semibold hover:text-[rgb(var(--color-primary))]">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
