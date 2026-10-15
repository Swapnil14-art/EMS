'use client';
import ReportGenerator from './ReportGenerator';
import type { Event } from '@/types';

interface RnDReportGeneratorProps {
  event: Event;
  onComplete: () => void;
}

export default function RnDReportGenerator({ event, onComplete }: RnDReportGeneratorProps) {
  return <ReportGenerator event={event} onComplete={onComplete} isRnD={true} />;
}
