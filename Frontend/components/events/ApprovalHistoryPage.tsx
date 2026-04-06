'use client';
import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { approvalService } from '@/lib/services';
import { Pagination } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import type { EventApproval } from '@/types';
import Link from 'next/link';

export default function ApprovalHistoryPage() {
  const [history, setHistory] = useState<EventApproval[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    approvalService.getAllHistory()
      .then(r => { setHistory(r.data || []); setTotal(r.total || 0); })
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-title">Approval History</h1><p className="page-subtitle">Your past decisions — {total} total</p></div>

      <div className="table-wrap">
        <table className="ems-table">
          <thead><tr><th>Decision</th><th>Event</th><th>Role</th><th>Remarks</th><th>Date</th></tr></thead>
          <tbody>
            {loading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}><td colSpan={5}><div className="skeleton h-4 rounded" /></td></tr>
            )) : history?.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-[var(--text-muted)]">No approval history yet</td></tr>
            ) : history?.map(a => (
              <tr key={a.id}>
                <td>
                  {a.status === 'approved'
                    ? <span className="flex items-center gap-1.5 text-emerald-600 font-semibold text-sm"><CheckCircle2 className="w-4 h-4" />Approved</span>
                    : a.status === 'rejected'
                    ? <span className="flex items-center gap-1.5 text-[var(--text-danger)] font-semibold text-sm"><XCircle className="w-4 h-4" />Rejected</span>
                    : <span className="flex items-center gap-1.5 text-[var(--text-muted)] font-semibold text-sm"><Clock className="w-4 h-4" />Pending</span>}
                </td>
                <td>
                  {a.event_id
                    ? <Link href={"/events/" + a.event_id} className="text-sm text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] font-medium">Event #{a.event_id}</Link>
                    : <span className="text-sm text-[var(--text-muted)]">—</span>}
                </td>
                <td><span className="badge bg-muted text-slate-700">{a.role_at_approval}</span></td>
                <td className="text-xs text-[var(--text-secondary)] max-w-[200px] truncate">{a.remarks || '—'}</td>
                <td className="text-xs text-[var(--text-muted)]">{a.actioned_at ? formatDateTime(a.actioned_at) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} perPage={20} onChange={setPage} />
    </div>
  );
}
