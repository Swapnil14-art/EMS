'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button, Input, Alert } from '@/components/ui';
import { ROLE_DASHBOARD } from '@/lib/utils';
import { extractApiError } from '@/lib/transformers';
import { authService, systemService } from '@/lib/services';
import { setAccessToken, setRefreshToken } from '@/lib/api';
import toast from 'react-hot-toast';
import { BrandMark } from '@/components/layout/BrandMark';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [apiError, setApiError] = useState('');
  const [registrationDisabled, setRegistrationDisabled] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Check if user signup is disabled via public config (no auth needed)
  useEffect(() => {
    systemService.getPublicConfig().then(config => {
      if (config?.disable_role_signup) {
        setRegistrationDisabled(true);
      }
    }).catch(() => {});
  }, []);

  // API mapped from POST /auth/login
  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      const loginRes = await authService.login(data);

      // Store tokens immediately so /auth/me call is authenticated
      setAccessToken(loginRes.accessToken);
      setRefreshToken(loginRes.refreshToken);

      // Check onboarding flags from login response BEFORE fetching full profile
      if (loginRes.requirePasswordChange) {
        // Fetch minimal user data for the store
        const user = await authService.me();
        setAuth(user, loginRes.accessToken, loginRes.refreshToken);
        router.push('/change-password');
        return;
      }

      // Fetch full user profile
      const user = await authService.me();
      setAuth(user, loginRes.accessToken, loginRes.refreshToken);

      if (loginRes.requireProfileCompletion && ['student', 'club_coordinator'].includes(user.role)) {
        router.push('/complete-profile');
        return;
      }

      toast.success(`Welcome back, ${user.name?.split(' ')[0] || 'User'}!`);
      router.push(ROLE_DASHBOARD[user.role] || '/');
    } catch (err: any) {
      setApiError(extractApiError(err, 'Invalid email or password.'));
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel with balanced image brightness */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
      >
        {/* Subtle, balanced dark overlay to tone down brightness gently */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Branding text in pure white with crisp drop shadows */}
        <div className="relative z-10 text-center max-w-md">
          <div className="mx-auto mb-6 w-fit rounded-3xl bg-black/30 p-3.5 backdrop-blur-md ring-1 ring-white/25 shadow-2xl">
            <BrandMark compact link={false} />
          </div>
          <h1 className="font-display font-bold text-white text-5xl tracking-tight mb-3 drop-shadow-[0_4px_8px_rgba(0,0,0,0.85)]">
            EMS
          </h1>
          <p className="text-white text-xl font-semibold mb-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
            Event Management System
          </p>
          <p className="text-white/95 text-sm tracking-wide font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
            SVKM&apos;s NMIMS MPTP, Shirpur
          </p>
        </div>
      </div>

      {/* Right panel (form area) with soft fade bleeding in from the middle seam into the right side */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-100 dark:bg-slate-900 overflow-y-auto relative">
        {/* Soft shadow/fade starting at middle seam and feathering into the right side */}
        <div className="hidden lg:block absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black/25 via-black/8 to-transparent pointer-events-none z-10" />

        <div className="w-full max-w-md py-8 relative z-20">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8"><BrandMark link={false} /></div>

          <div className="mb-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h2 className="font-display font-bold text-[var(--text-primary)] text-3xl">Welcome back</h2>
            <p className="text-[var(--text-secondary)] mt-1">Sign in to your EMS account</p>
          </div>

          {apiError && <Alert type="error" className="mb-5"><span>{apiError}</span></Alert>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="yourname@nmims.in"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
              autoComplete="email"
            />
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-[var(--text-primary)]">Password</label>
                <Link href="/forgot-password" className="text-xs text-[rgb(var(--color-primary))] font-medium hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <Input
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                rightElement={
                  <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Hide password' : 'Show password'} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                {...register('password')}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" loading={isSubmitting} className="w-full justify-center py-3 text-base">
              Sign In <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            {!registrationDisabled ? (
              <p className="text-sm text-[var(--text-secondary)]">
                New student?{' '}
                <Link href="/signup" className="text-[rgb(var(--color-primary))] font-semibold hover:underline">
                  Create an account
                </Link>
              </p>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                Student self-registration is currently closed by administration.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
