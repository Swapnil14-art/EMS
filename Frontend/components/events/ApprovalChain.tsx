'use client';
import { CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { EventApproval } from '@/types';

interface ApprovalChainProps {
  approvals: EventApproval[];
  currentStep: number;
}

const ROLE_LABELS: Record<string, string> = {
  dean: 'Dean',
  director: 'Director',
};

export default function ApprovalChain({ approvals, currentStep }: ApprovalChainProps) {
  if (!approvals?.length) return (
    <div className="text-center py-6 text-[var(--text-muted)] text-sm">No approval chain data</div>
  );

  return (
    <div className="space-y-3">
      {approvals?.map((approval, index) => {
        const isLast = index === approvals?.length - 1;

        return (
          <div key={approval.id} className="relative">
            {/* Connector line */}
            {!isLast && (
              <div className="absolute left-5 top-full w-0.5 h-3 bg-muted z-10" />
            )}

            <div className={cn(
              'rounded-2xl border-2 p-4 transition-colors',
              approval.status === 'approved' ? 'border-emerald-200 bg-emerald-50' :
              approval.status === 'rejected' ? 'border-red-200 bg-red-50' :
              'border-[var(--card-border)] bg-white'
            )}>
              <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {approval.status === 'approved' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : approval.status === 'rejected' ? (
                    <XCircle className="w-5 h-5 text-[var(--text-danger)]" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[var(--text-primary)]">
                      {ROLE_LABELS[approval.role_at_approval] || approval.role_at_approval}
                    </span>
                    {approval.approver && (
                      <span className="text-xs text-[var(--text-muted)]">— {approval.approver.name}</span>
                    )}
                    <span className={cn(
                      'badge text-xs',
                      approval.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      approval.status === 'rejected' ? 'bg-red-100 text-[var(--text-danger)]' :
                      'bg-muted text-[var(--text-muted)]'
                    )}>
                      {approval.status === 'approved' ? 'Approved' :
                       approval.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  </div>

                  {approval.actioned_at && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {formatDateTime(approval.actioned_at)}
                    </p>
                  )}

                  {approval.remarks && (
                    <div className={cn(
                      'mt-2 p-3 rounded-xl text-xs',
                      approval.status === 'rejected' ? 'bg-red-100 text-[var(--text-danger)]' : 'bg-muted text-[var(--text-secondary)]'
                    )}>
                      <span className="font-semibold">Remarks: </span>{approval.remarks}
                    </div>
                  )}

                  {approval.venue_clash_override && (
                    <div className="mt-2 p-3 rounded-xl text-xs bg-amber-100 text-amber-800">
                      <span className="font-semibold">⚠️ Venue clash overridden: </span>
                      {approval.venue_clash_override_reason}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
