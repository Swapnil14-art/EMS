'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Sparkles, Users, Workflow,
  Layers, HelpCircle, Code
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'About EMS', icon: BookOpen },
  { id: 'features', label: 'Features', icon: Sparkles },
  { id: 'roles', label: 'User Roles', icon: Users },
  { id: 'workflow', label: 'Event Lifecycle', icon: Workflow },
  { id: 'tutorials', label: 'Tutorials', icon: Layers },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'team', label: 'Developed By', icon: Code },
];

export default function AboutNav() {
  const [activeSection, setActiveSection] = useState('overview');
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, height: 0, top: 0 });
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180; // offset for sticky navbars + margin

      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update sliding pill position when activeSection changes
  useEffect(() => {
    const activeBtn = tabRefs.current[activeSection];
    if (activeBtn) {
      setPillStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        height: activeBtn.offsetHeight,
        top: activeBtn.offsetTop,
      });

      // Scroll the tab into view inside the horizontal scrollbar wrapper if it is cut off
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const btnLeft = activeBtn.offsetLeft;
        const btnRight = btnLeft + activeBtn.offsetWidth;
        const containerLeft = container.scrollLeft;
        const containerRight = containerLeft + container.clientWidth;

        if (btnLeft < containerLeft) {
          container.scrollTo({ left: btnLeft - 16, behavior: 'smooth' });
        } else if (btnRight > containerRight) {
          container.scrollTo({ left: btnRight - container.clientWidth + 16, behavior: 'smooth' });
        }
      }
    }
  }, [activeSection]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -135; // offset for main navbar + sub-nav
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-16 z-30 bg-white/95 dark:bg-[var(--card-bg)]/95 backdrop-blur-md border-b border-[var(--card-border)] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          ref={scrollContainerRef}
          className="flex items-center justify-between h-14 overflow-x-auto" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Relative wrapper for absolute sliding pill */}
          <div className="relative flex items-center gap-1.5 sm:gap-2 md:gap-3 py-2 flex-nowrap w-full">
            
            {/* Sliding Pill Background Container */}
            <div 
              className="absolute bg-[var(--brand-soft)] dark:bg-white/10 rounded-xl border border-[rgb(var(--color-primary)/0.12)] transition-all duration-300 ease-out pointer-events-none z-0"
              style={{
                left: `${pillStyle.left}px`,
                width: `${pillStyle.width}px`,
                height: `${pillStyle.height}px`,
                top: `${pillStyle.top}px`,
              }}
            />

            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    tabRefs.current[item.id] = el;
                  }}
                  onClick={() => scrollToSection(item.id)}
                  className={`relative z-10 px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap rounded-xl flex items-center gap-2 flex-shrink-0 ${
                    isActive
                      ? 'text-[rgb(var(--color-primary))] font-bold scale-[1.02]'
                      : 'text-[var(--text-secondary)] hover:text-[rgb(var(--color-primary))]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
