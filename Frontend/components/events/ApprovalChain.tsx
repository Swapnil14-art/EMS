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
              <div className="absolute left-5 top-full z-10 h-3 w-0.5 bg-[var(--border-strong)]" />
            )}

            <div className={cn(
              'rounded-2xl border-2 p-4 transition-colors',
              approval.status === 'approved' ? 'border-[var(--status-success-text)] bg-[var(--status-success-bg)]' :
              approval.status === 'rejected' ? 'border-[var(--status-danger-text)] bg-[var(--status-danger-bg)]' :
              'border-[var(--card-border)] bg-[var(--surface-bg)]'
            )}>
              <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {approval.status === 'approved' ? (
                    <CheckCircle2 className="w-5 h-5 text-[var(--status-success-text)]" />
                  ) : approval.status === 'rejected' ? (
                    <XCircle className="w-5 h-5 text-[var(--text-danger)]" />
                  ) : (
                    <Clock className="w-5 h-5 text-[var(--text-muted)]" />
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
                      approval.status === 'approved' ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]' :
                      approval.status === 'rejected' ? 'bg-[var(--status-danger-bg)] text-[var(--text-danger)]' :
                      'border border-[var(--border-strong)] bg-[var(--surface-subtle)] text-[var(--text-secondary)]'
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
                      approval.status === 'rejected' ? 'bg-[var(--status-danger-bg)] text-[var(--text-danger)]' : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)]'
                    )}>
                      <span className="font-semibold">Remarks: </span>{approval.remarks}
                    </div>
                  )}

                  {approval.venue_clash_override && (
                    <div className="mt-2 p-3 rounded-xl text-xs bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]">
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
