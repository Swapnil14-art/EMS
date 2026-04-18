'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, X } from 'lucide-react';

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}
export function Button({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary:   'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-bg)] shadow-lg',
    secondary: 'bg-white border border-[var(--card-border)] text-[var(--text-primary)] hover:bg-[var(--page-bg)]',
    ghost:     'text-[var(--text-secondary)] hover:bg-muted',
    danger:    'bg-[var(--btn-danger-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-danger-bg)]',
    accent:    'bg-[var(--btn-secondary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-secondary-bg)]-dark',
  };
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-5 py-2.5 text-sm', lg: 'px-6 py-3 text-base' };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightElement, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && <label htmlFor={inputId} className="label">{label}</label>}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn('input', leftIcon && 'pl-10', error && 'input-error', className)}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</span>
          )}
        </div>
        {error && <p className="error-msg">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--text-muted)] mt-1">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && <label htmlFor={selectId} className="label">{label}</label>}
        <select
          ref={ref}
          id={selectId}
          className={cn('input appearance-none', error && 'input-error', className)}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {error && <p className="error-msg">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ─── Combobox (Typeahead Select + Custom Input) ───────────────────────────────
interface ComboboxProps {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  id?: string;
  className?: string;
}
export function Combobox({ label, error, options, placeholder, value = '', onChange, id, className }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState(value);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const comboId = id || label?.toLowerCase().replace(/\s+/g, '-');

  React.useEffect(() => { setSearch(value); }, [value]);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    onChange?.(e.target.value);
    setOpen(true);
  };

  const handleSelect = (opt: { value: string; label: string }) => {
    setSearch(opt.label);
    onChange?.(opt.value);
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="w-full" ref={wrapperRef}>
      {label && <label htmlFor={comboId} className="label">{label}</label>}
      <div className="relative">
        <input
          ref={inputRef}
          id={comboId}
          type="text"
          autoComplete="off"
          value={search}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={cn('input', error && 'input-error', className)}
        />
        {open && filtered.length > 0 && (
          <ul className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-auto bg-white border border-[var(--card-border)] rounded-xl shadow-card-lg animate-fade-in"
            role="listbox"
          >
            {filtered.map(o => (
              <li
                key={o.value}
                role="option"
                aria-selected={value === o.value}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(o); }}
                className={cn(
                  'px-4 py-2.5 text-sm cursor-pointer transition-colors',
                  value === o.value
                    ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] font-semibold'
                    : 'text-[var(--text-primary)] hover:bg-[var(--page-bg)]'
                )}
              >
                {o.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="error-msg">{error}</p>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const taId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="w-full">
        {label && <label htmlFor={taId} className="label">{label}</label>}
        <textarea ref={ref} id={taId} className={cn('input resize-none', error && 'input-error', className)} {...props} />
        {error && <p className="error-msg">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('animate-spin text-[rgb(var(--color-primary))]', className)} />;
}

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps { children: React.ReactNode; color?: string; className?: string; dot?: boolean; }
export function Badge({ children, color = 'bg-muted text-slate-700', className, dot }: BadgeProps) {
  return (
    <span className={cn('badge', color, className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: React.ReactNode;
}
export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-3xl shadow-card-lg w-full animate-slide-up', sizes[size])}>
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--card-border)]">
            <h3 className="text-lg font-display font-bold text-[var(--text-primary)]">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-[var(--text-muted)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="px-6 pb-6 pt-2 flex justify-end gap-3 border-t border-[var(--card-border)]">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className, hover }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return <div className={cn(hover ? 'card-hover' : 'card', className)}>{children}</div>;
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle, action }: {
  icon?: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-5xl mb-4 opacity-40">{icon}</div>}
      <p className="font-display font-semibold text-[var(--text-primary)] text-lg">{title}</p>
      {subtitle && <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xs">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4 w-full', className)} />;
}

// ─── Toggle / Switch ─────────────────────────────────────────────────────────
interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean; }
export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
        <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary',
          checked ? 'bg-[var(--btn-primary-bg)]' : 'bg-muted',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0'
        )} />
      </button>
      {label && <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>}
    </label>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────
type AlertType = 'info' | 'success' | 'warning' | 'error';
const alertStyles: Record<AlertType, string> = {
  info:    'bg-[rgb(var(--alert-info-bg)/0.1)] border-[rgb(var(--alert-info-border)/0.2)] text-[var(--alert-info-text)]',
  success: 'bg-[rgb(var(--alert-info-bg)/0.1)] border-[rgb(var(--alert-info-border)/0.2)] text-[var(--alert-info-text)]',
  warning: 'bg-[rgb(var(--alert-warning-bg)/0.1)] border-[rgb(var(--alert-warning-border)/0.2)] text-[var(--alert-warning-text)]',
  error:   'bg-[rgb(var(--alert-error-bg)/0.1)] border-[rgb(var(--alert-error-border)/0.2)] text-[var(--alert-error-text)]',
};
export function Alert({ type = 'info', children, className }: { type?: AlertType; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex gap-3 p-4 rounded-xl border text-sm font-medium', alertStyles[type], className)}>
      {children}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
interface TabsProps {
  tabs: { label: string; value: string; count?: number }[];
  active: string;
  onChange: (v: string) => void;
}
export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-[var(--page-bg)] rounded-xl overflow-x-auto">
      {tabs?.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex whitespace-nowrap shrink-0 items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150',
            active === tab.value
              ? 'bg-white text-[rgb(var(--color-primary))] shadow-card'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'px-1.5 py-0.5 rounded-full text-xs font-bold',
              active === tab.value ? 'bg-[var(--card-bg)] text-[rgb(var(--color-primary))]' : 'bg-muted text-[var(--text-muted)]'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
interface PaginationProps { page: number; total: number; perPage: number; onChange: (p: number) => void; }
export function Pagination({ page, total, perPage, onChange }: PaginationProps) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-1 mt-4">
      <p className="text-xs text-[var(--text-muted)]">
        Showing {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} of {total}
      </p>
      <div className="flex gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="px-3 py-1.5 text-xs rounded-lg border border-[var(--card-border)] bg-white hover:bg-[var(--page-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Prev
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = i + 1;
          return (
            <button key={p} onClick={() => onChange(p)}
              className={cn('px-3 py-1.5 text-xs rounded-lg border transition-colors',
                p === page ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-[var(--input-focus-ring)]' : 'border-[var(--card-border)] bg-white hover:bg-[var(--page-bg)] text-[var(--text-secondary)]'
              )}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="px-3 py-1.5 text-xs rounded-lg border border-[var(--card-border)] bg-white hover:bg-[var(--page-bg)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next
        </button>
      </div>
    </div>
  );
}
