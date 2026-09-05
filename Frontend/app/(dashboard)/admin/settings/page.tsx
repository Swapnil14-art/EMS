'use client';
import { Info, Database, Server, Mail, Shield } from 'lucide-react';
import { Alert } from '@/components/ui';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div><h1 className="page-title">System Settings</h1><p className="page-subtitle">EMS configuration overview</p></div>

      <Alert type="info">
        <Info className="w-4 h-4" />
        <span>System settings are configured via environment variables in <code className="font-mono bg-[rgb(var(--btn-primary-bg)/0.1)] px-1 rounded">.env</code>. Restart the backend container to apply changes.</span>
      </Alert>

      {[
        { icon: <Database className="w-5 h-5 text-[rgb(var(--color-primary))]" />, title: 'Database', items: ['Neon PostgreSQL (serverless)', 'Connection via DATABASE_URL env var', 'No local PostgreSQL container — Neon only'] },
        { icon: <Server className="w-5 h-5 text-[rgb(var(--color-primary))]" />, title: 'File Storage', items: ['OCI Object Storage bucket: ems-uploads', 'No local uploads folder', 'Files served via OCI public/pre-signed URLs', 'Bucket prefix: dev/ or prod/ (OCI_STORAGE_PREFIX)'] },
        { icon: <Mail className="w-5 h-5 text-[rgb(var(--color-primary))]" />, title: 'Email (SMTP)', items: ['Configured through server environment variables', 'Async via Celery worker', 'Delivery status available in Email Log'] },
        { icon: <Shield className="w-5 h-5 text-[rgb(var(--color-primary))]" />, title: 'Security', items: ['Email domain restricted to @nmims.in', 'JWT access token: 15 min lifetime', 'Refresh token: 7 days (HttpOnly cookie)', 'Rate limit: 5 login attempts/min per IP'] },
      ].map(section => (
        <div key={section.title} className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[var(--card-bg)] rounded-xl flex items-center justify-center">{section.icon}</div>
            <h2 className="font-display font-bold text-[var(--text-primary)]">{section.title}</h2>
          </div>
          <ul className="space-y-2">
            {section.items?.map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--btn-primary-bg)] flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
