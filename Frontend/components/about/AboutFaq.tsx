'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: 'General',
    question: 'Do I need an account to view campus events?',
    answer: 'No! Anyone can browse public events, view the Event Calendar, check venue availability schedules, and read platform documentation without logging in. However, registering for an event or submitting proposals requires logging in.',
  },
  {
    category: 'Workflows',
    question: 'What happens if an approver requests changes to a proposal?',
    answer: 'If an Associate Dean or Director requests changes (or rejects a proposal), the approval workflow resets completely. Once the Club Coordinator updates the proposal and re-submits it, it must go through all approval stages again from Step 1 (Associate Dean Review).',
  },
  {
    category: 'Venues',
    question: 'How does automatic venue clash detection work?',
    answer: 'When a coordinator selects a venue, date, start time, and end time, EMS automatically searches the database for existing approved or pending events in that exact space. If a time overlap exists, a clash alert is displayed. Approvers can override a clash only by providing a mandatory written justification.',
  },
  {
    category: 'Reports',
    question: 'How are Microsoft Word (.docx) post-event reports generated?',
    answer: 'After an event concludes, the Club Coordinator enters actual participant counts, expenditure totals, event outcomes, and uploads photo fliers. EMS automatically compiles this structured data into a formatted institutional .docx document ready for download.',
  },
  {
    category: 'Roles & Access',
    question: 'What is an "Additional User" role?',
    answer: 'The Additional User role is a flexible account type designed for support staff, external coordinators, or auditors. Super Admins can grant or revoke granular permission codes (such as view_reports, manage_venues) dynamically without changing codebase roles.',
  },
  {
    category: 'Security',
    question: 'Is my student SAP ID and personal information secure?',
    answer: 'Yes! EMS employs JWT authentication, encrypted passwords, role-based access control (RBAC), and internal database access policies to protect all student and faculty records.',
  },
];

export default function AboutFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-[var(--surface-subtle)] border-b border-[var(--card-border)] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--card-bg)] text-[rgb(var(--color-primary))] rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-[var(--card-border)] shadow-xs">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-600" />
            <span>6. Frequently Asked Questions</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[var(--text-primary)] mb-4 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed font-body">
            Quick solutions to questions about platform permissions, workflows, clash overrides, and reports.
          </p>
        </div>

        {/* Accordion List */}
        <div className="max-w-3xl mx-auto space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="card bg-[var(--card-bg)] border border-[var(--card-border)] overflow-hidden transition-all duration-300 hover:border-[rgb(var(--color-primary)/0.15)] shadow-xs"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-display font-bold text-sm sm:text-base text-[var(--text-primary)] hover:text-[rgb(var(--color-primary))] transition-colors cursor-pointer bg-[var(--card-bg)]"
                >
                  <span className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-[var(--surface-subtle)] border border-[var(--card-border)] text-[var(--text-muted)] tracking-wider shrink-0">
                      {faq.category}
                    </span>
                    <span className="leading-snug">{faq.question}</span>
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-[rgb(var(--color-primary))] shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--card-border)] bg-[var(--surface-subtle)]/30 font-body animate-fade-in">
                    <p className="pt-2 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
