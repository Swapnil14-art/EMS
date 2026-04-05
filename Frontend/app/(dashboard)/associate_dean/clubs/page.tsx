'use client';
import { useState, useEffect } from 'react';
import { BookOpen, Users } from 'lucide-react';
import { clubService } from '@/lib/services';
import { EmptyState } from '@/components/ui';
import type { Club } from '@/types';

export default function DeptClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clubService.list().then(r => setClubs(r.data || [])).catch(() => setClubs([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-title">Department Clubs</h1><p className="page-subtitle">{clubs?.length} clubs in your department</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-5 space-y-3"><div className="skeleton h-5 w-2/3 rounded" /><div className="skeleton h-3 w-1/2 rounded" /></div>
        )) : clubs?.length === 0 ? (
          <div className="col-span-full"><EmptyState icon={<BookOpen />} title="No clubs yet" /></div>
        ) : clubs?.map(c => (
          <div key={c.id} className="card-hover p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-[var(--card-bg)] rounded-2xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
              <div><h3 className="font-display font-bold text-[var(--text-primary)]">{c.name}</h3><p className="text-xs text-[var(--text-muted)]">{c.department?.name}</p></div>
            </div>
            {c.coordinator && (
              <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1"><Users className="w-3 h-3" />Incharge: {c.coordinator?.name || '—'}</p>
            )}
            {c.description && <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2">{c.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
