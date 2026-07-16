'use client';
import { ShieldCheck } from 'lucide-react';
import PermissionManager from '@/components/shared/PermissionManager';

export default function AdminPermissionsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[rgb(var(--color-primary))]" /> Additional Role Permissions
        </h1>
        <p className="page-subtitle">
          Manage dynamic permissions for all <strong>Additional</strong> role users. Click any permission to toggle it, then save per user.
        </p>
      </div>
      <PermissionManager isSuperAdmin={true} />
    </div>
  );
}
