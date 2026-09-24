'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Check, ExternalLink } from 'lucide-react';
import { Modal, Button, Toggle } from '@/components/ui';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function TermsModal({ open, onClose, onConfirm, loading }: TermsModalProps) {
  const [accepted, setAccepted] = useState(false);

  // Reset state when opened
  if (!open && accepted) {
    setAccepted(false);
  }

  const handleConfirm = () => {
    if (accepted) {
      onConfirm();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Event Submission Attestation"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            loading={loading}
            disabled={!accepted || loading}
            icon={<Check className="w-4 h-4" />}
          >
            Confirm &amp; Submit Proposal
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-[var(--status-warning-bg)] rounded-xl p-4 flex gap-3 text-[var(--status-warning-text)]">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-[var(--status-warning-text)]" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Administrative Attestation Required</p>
            <p className="text-[var(--status-warning-text)] leading-relaxed text-xs sm:text-sm">
              This attestation applies specifically to official campus event proposal submissions and is separate from the general{' '}
              <Link href="/terms" target="_blank" className="underline font-semibold inline-flex items-center gap-0.5">
                EMS Terms of Use <ExternalLink className="w-3 h-3" />
              </Link>{' '}
              and{' '}
              <Link href="/privacy" target="_blank" className="underline font-semibold inline-flex items-center gap-0.5">
                Privacy Policy <ExternalLink className="w-3 h-3" />
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="p-4 bg-[var(--surface-subtle)] border border-[var(--card-border)] rounded-xl text-xs sm:text-sm text-[var(--text-secondary)] h-44 overflow-y-auto space-y-2">
          <h4 className="font-semibold text-[var(--text-primary)]">SVKM&apos;s NMIMS Event Coordination Undertaking</h4>
          <ol className="list-decimal pl-4 space-y-2">
            <li>I confirm that all details provided in this event proposal are accurate, truthful, and authorized by the club/department.</li>
            <li>I understand that submitting this event initiates a formal multi-tier approval workflow (Coordinator → Associate Dean → Director) that cannot be reversed without cancellation.</li>
            <li>I guarantee that any required budget estimates are justified and have preliminary consent from the respective authority.</li>
            <li>I acknowledge that the venue, IT, and infrastructure requests are subject to availability and final approval by the administrative team.</li>
            <li>I, being the Club Coordinator / Faculty In-Charge, take full responsibility for the overall coordination, discipline, campus code of conduct adherence, and successful execution of this event.</li>
            <li>I confirm that uploaded documents (such as participant documents or brochures) do not violate copyright or disclose third-party personal data without authorization.</li>
          </ol>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-3 p-3 border border-[var(--card-border)] rounded-xl bg-white cursor-pointer hover:bg-[var(--surface-subtle)] transition-colors">
            <Toggle
              checked={accepted}
              onChange={setAccepted}
            />
            <span className="text-xs sm:text-sm font-medium text-[var(--text-primary)] select-none">
              I have read, understood, and agree to this event submission attestation
            </span>
          </label>
        </div>
      </div>
    </Modal>
  );
}
