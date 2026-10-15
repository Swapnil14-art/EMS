'use client';
import React from 'react';
import { getSchoolInfo } from '@/lib/utils';

interface SchoolDisplayProps {
  value?: string;
  className?: string;
}

export function SchoolDisplay({ value, className }: SchoolDisplayProps) {
  if (!value) return <span>—</span>;
  
  // Handle comma-separated lists (e.g. for target audience "engineering, pharmacy")
  const parts = value.split(',').map(p => p.trim());
  
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {parts.map((part, index) => {
        const info = getSchoolInfo(part);
        if (!info) {
          // If not mapped, format the original text (e.g., "college_wide" -> "College Wide")
          const formatted = part
            .replace(/_/g, ' ')
            .split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
            
          return (
            <React.Fragment key={index}>
              <span className={className}>{formatted}</span>
              {index < parts.length - 1 && <span className="text-gray-400 mr-1">,</span>}
            </React.Fragment>
          );
        }
        
        return (
          <React.Fragment key={index}>
            <span className={`group relative inline-block cursor-help font-semibold text-[rgb(var(--color-primary))] ${className || ''}`}>
              <span className="border-b border-dotted border-gray-400 hover:border-gray-600 transition-colors">
                {info.abbreviation}
              </span>
              <span className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 w-max max-w-xs -translate-x-1/2 scale-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 shadow-lg text-center font-normal leading-normal whitespace-normal">
                {info.fullName}
                <span className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 bg-slate-900 rotate-45" />
              </span>
            </span>
            {index < parts.length - 1 && <span className="text-gray-400 mr-1">,</span>}
          </React.Fragment>
        );
      })}
    </span>
  );
}
