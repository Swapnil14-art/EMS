'use client';

import { useState } from 'react';
import { ShieldAlert, Check } from 'lucide-react';
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
      title="Terms & Conditions"
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
            Confirm & Submit
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-[var(--status-warning-bg)] rounded-xl p-4 flex gap-3 text-[var(--status-warning-text)]">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-[var(--status-warning-text)]" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Final Submission Required</p>
            <p className="text-[var(--status-warning-text)] leading-relaxed">
              Before submitting this event for official institutional approval, you must review and accept the standard event guidelines and policies.
            </p>
          </div>
        </div>

        <div className="p-4 bg-[var(--surface-subtle)] border border-[var(--card-border)] rounded-xl text-sm text-[var(--text-secondary)] h-40 overflow-y-auto">
          <h4 className="font-semibold text-[var(--text-primary)] mb-2">SVKM's NMIMS Event Policy</h4>
          <ol className="list-decimal pl-4 space-y-2">
            <li>I confirm that all details provided in this event proposal are accurate and truthful.</li>
            <li>I understand that submitting this event initiates a formal approval workflow that cannot be reversed without cancellation.</li>
            <li>I guarantee that any required budget estimates are justified and have preliminary consent from the respective authority.</li>
            <li>I acknowledge that the IT and infrastructure requests are subject to final availability and approval by the administrative team.</li>
            <li>I agree to take full responsibility for the overall coordination, discipline, and successful execution of this event.</li>
          </ol>
        </div>

        <div className="pt-2">
          <label className="flex items-center gap-3 p-3 border border-[var(--card-border)] rounded-xl bg-white cursor-pointer hover:bg-[var(--surface-subtle)] transition-colors">
            <Toggle
              checked={accepted}
              onChange={setAccepted}
            />
            <span className="text-sm font-medium text-[var(--text-primary)] select-none">
              I have read and agree to these terms & conditions
            </span>
          </label>
        </div>
      </div>
    </Modal>
  );
}
