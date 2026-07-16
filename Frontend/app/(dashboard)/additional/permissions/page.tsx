'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { ShieldCheck } from 'lucide-react';
import PermissionManager from '@/components/shared/PermissionManager';

export default function AdditionalPermissionsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'additional' || !(user.extra_permissions ?? []).includes('manage_permissions')) {
      router.replace('/additional');
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-amber-500" /> Permission Manager
        </h1>
        <p className="page-subtitle">
          Grant or revoke access for Additional role users. Note: you cannot grant <strong>manage_permissions</strong> — only a super admin can do that.
        </p>
      </div>
      <PermissionManager isSuperAdmin={false} />
    </div>
  );
}
