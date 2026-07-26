'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Button, Input, Alert } from '@/components/ui';
import { ROLE_DASHBOARD } from '@/lib/utils';
import { extractApiError } from '@/lib/transformers';
import toast from 'react-hot-toast';

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
    import('@/lib/services').then(({ systemService }) => {
      systemService.getPublicConfig().then(config => {
        if (config?.disable_role_signup) {
          setRegistrationDisabled(true);
        }
      }).catch(() => {});
    });
  }, []);

  // API mapped from POST /auth/login
  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      const { authService } = await import('@/lib/services');
      const loginRes = await authService.login(data);

      // Store tokens immediately so /auth/me call is authenticated
      const { setAccessToken, setRefreshToken } = await import('@/lib/api');
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
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 blue-section relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-48 h-48 bg-yellow-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-white backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/20 p-2">
            <Image src="/logo1.jpg" alt="SVKM's NMIMS Logo" width={80} height={80} className="w-full h-full object-contain" priority />
          </div>
          <h1 className="font-display font-bold text-[var(--btn-primary-text)] text-4xl mb-3">EMS</h1>
          <p className="text-[rgb(var(--color-primary))]/20 text-lg mb-2">Event Management System</p>
          <p className="text-[rgb(var(--color-primary))]/20 text-sm">SVKM's NMIMS MPTP, Shirpur</p>
          <div className="mt-12 grid grid-cols-2 gap-4 text-left">
            {[['📋','Plan Events','Proposal to execution'],['✅','Approvals','Multi-level workflow'],['📢','Reach Students','Broadcast to campus'],['📊','Track Everything','Analytics & reports']].map(([icon,title,desc])=>(
              <div key={title} className="bg-[rgb(var(--card-bg)/0.1)] backdrop-blur-sm rounded-2xl p-4 border border-[rgb(var(--card-border)/0.1)]">
                <div className="text-2xl mb-2">{icon}</div>
                <p className="text-[var(--btn-primary-text)] font-semibold text-sm">{title}</p>
                <p className="text-[rgb(var(--color-primary))]/20 text-xs mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--card-bg)] overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 relative flex items-center justify-center">
              <Image src="/logo1.jpg" alt="SVKM's NMIMS Logo" width={40} height={40} className="w-full h-full object-contain" priority />
            </div>
            <div><p className="font-display font-bold text-[var(--text-primary)]">EMS</p><p className="text-xs text-[var(--text-muted)]">NMIMS Shirpur</p></div>
          </div>

          <div className="mb-6">
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
                  <button type="button" onClick={() => setShowPass(!showPass)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1">
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
                <Link href="/signup" className="text-[rgb(var(--color-primary))] font-semibold hover:text-[rgb(var(--color-primary))] transition-colors">Sign Up</Link>
              </p>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">
                User registration is currently disabled by administrator.
              </p>
            )}
            <p className="text-xs text-[var(--text-muted)] mt-3">Staff accounts are created by the Super Admin.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
