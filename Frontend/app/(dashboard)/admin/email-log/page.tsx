'use client';
import { useState, useEffect } from 'react';
import { RefreshCw, Mail, CheckCircle2, XCircle } from 'lucide-react';
import { notificationService } from '@/lib/services';
import { Button, Pagination } from '@/components/ui';
import { formatDateTime } from '@/lib/utils';
import type { EmailNotification } from '@/types';

export default function EmailLogPage() {
  const [logs, setLogs] = useState<EmailNotification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getEmailLog({ page, size: 30 });
      setLogs(res.data || []);
      setTotal(res.total || 0);
    } catch { setLogs([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [page]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div><h1 className="page-title">Email Log</h1><p className="page-subtitle">Audit trail of all system emails — {total} total</p></div>
        <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />} onClick={fetch}>Refresh</Button>
      </div>

      <div className="table-wrap">
        <table className="ems-table">
          <thead><tr><th>Status</th><th>Type</th><th>Recipient</th><th>Event</th><th>Sent At</th><th>Error</th></tr></thead>
          <tbody>
            {loading ? Array.from({ length: 10 }).map((_, i) => (
              <tr key={i}><td colSpan={6}><div className="skeleton h-4 rounded" /></td></tr>
            )) : logs?.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-[var(--text-muted)]">No emails logged yet</td></tr>
            ) : logs?.map(log => (
              <tr key={log.id}>
                <td>
                  {log.status === 'sent'
                    ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold"><CheckCircle2 className="w-3.5 h-3.5" />Sent</span>
                    : <span className="flex items-center gap-1 text-[var(--text-danger)] text-xs font-semibold"><XCircle className="w-3.5 h-3.5" />Failed</span>}
                </td>
                <td><span className="badge bg-muted text-slate-700 font-mono text-[10px]">{log.type}</span></td>
                <td className="text-xs text-[var(--text-secondary)] max-w-[200px] truncate">{log.recipient}</td>
                <td className="text-xs text-[var(--text-muted)]">{log.event_id ? '#' + log.event_id : '—'}</td>
                <td className="text-xs text-[var(--text-muted)]">{formatDateTime(log.sent_at)}</td>
                <td className="text-xs text-[var(--text-danger)] max-w-[150px] truncate">{log.error_msg || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} total={total} perPage={30} onChange={setPage} />
    </div>
  );
}
