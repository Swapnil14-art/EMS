'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings, ShieldAlert, AlertTriangle, UserX, LogIn,
  Users, ShieldCheck, ShieldOff, Power, PowerOff,
  ToggleLeft, ToggleRight, Info
} from 'lucide-react';
import { systemService } from '@/lib/services';
import { Alert, Spinner } from '@/components/ui';
import toast from 'react-hot-toast';

interface SystemConfig {
  disable_student_registration: boolean;
  disable_role_signup: boolean;
  force_login: boolean;
}

/* ─── Toggle Switch ─────────────────────────────────────────────────────────── */

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2
        ${checked
          ? 'bg-red-500 focus:ring-red-400'
          : 'bg-gray-300 focus:ring-[var(--input-focus-ring)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0
          transition duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

/* ─── Control Card ──────────────────────────────────────────────────────────── */

function ControlCard({
  icon,
  iconColor,
  title,
  description,
  checked,
  onChange,
  updating,
  statusLabel,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  updating: boolean;
  statusLabel: { on: string; off: string };
}) {
  return (
    <div className="card p-6 transition-all duration-200 hover:shadow-card-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-display font-bold text-[var(--text-primary)] mb-1">
              {title}
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {description}
            </p>
            <div className="mt-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                checked
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {checked ? (
                  <><PowerOff className="w-3 h-3" /> {statusLabel.on}</>
                ) : (
                  <><Power className="w-3 h-3" /> {statusLabel.off}</>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {updating && <div className="w-4 h-4 border-2 border-[var(--input-focus-ring)] border-t-transparent rounded-full animate-spin" />}
          <ToggleSwitch checked={checked} onChange={onChange} disabled={updating} />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */

export default function SystemControlsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<SystemConfig>({
    disable_student_registration: false,
    disable_role_signup: false,
    force_login: false,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    systemService.getConfig()
      .then(data => {
        if (data) setConfig(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load system settings');
        setLoading(false);
      });
  }, []);

  const handleToggle = async (
    key: keyof SystemConfig,
    value: boolean,
    label: string,
  ) => {
    const originalValue = config[key];
    setConfig(prev => ({ ...prev, [key]: value }));
    setUpdating(key);
    try {
      await systemService.updateConfig({ [key]: value });
      toast.success(`${label} ${value ? 'enabled' : 'disabled'}`);
    } catch (err) {
      toast.error('Failed to update setting');
      setConfig(prev => ({ ...prev, [key]: originalValue }));
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="page-title">System Controls</h1>
        <p className="page-subtitle">
          Global system toggles for maintenance, security, and access control
        </p>
      </div>

      <Alert type="warning" className="mb-2">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <span>
          These settings apply <strong>globally</strong> and take effect
          immediately across all users. Backend enforcement is active — changes
          cannot be bypassed through the API.
        </span>
      </Alert>

      {/* ─── Controls Grid ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        {/* A. Disable Student Registration (Event Registration) */}
        <ControlCard
          icon={<ShieldAlert className="w-5 h-5 text-white" />}
          iconColor="bg-red-500"
          title="Disable Student Registration"
          description="When enabled, students will not be able to register for any events. The 'Register' button will be hidden and the registration API will reject all requests."
          checked={config.disable_student_registration}
          onChange={(val) => handleToggle('disable_student_registration', val, 'Student event registration')}
          updating={updating === 'disable_student_registration'}
          statusLabel={{
            on: 'Event registration blocked',
            off: 'Event registration active',
          }}
        />

        {/* B. Disable Role-Based Signup */}
        <ControlCard
          icon={<UserX className="w-5 h-5 text-white" />}
          iconColor="bg-orange-500"
          title="Disable Role-Based Signup"
          description="When enabled, new user registration is completely blocked. The 'Sign Up' button is hidden on the login page and the signup API will reject all requests with: 'User registration is currently disabled by administrator'."
          checked={config.disable_role_signup}
          onChange={(val) => handleToggle('disable_role_signup', val, 'User signup')}
          updating={updating === 'disable_role_signup'}
          statusLabel={{
            on: 'User signup blocked',
            off: 'User signup active',
          }}
        />

        {/* C. Force Login */}
        <ControlCard
          icon={<LogIn className="w-5 h-5 text-white" />}
          iconColor="bg-amber-500"
          title="Force Login"
          description="When enabled, all public/landing pages redirect unauthenticated visitors to the login page. Only authenticated users can view any content."
          checked={config.force_login}
          onChange={(val) => handleToggle('force_login', val, 'Force login')}
          updating={updating === 'force_login'}
          statusLabel={{
            on: 'Login required for all pages',
            off: 'Public pages accessible',
          }}
        />
      </div>

      {/* ─── D. User Management Section ──────────────────────────────── */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-display font-bold text-[var(--text-primary)] mb-1">
              User Management
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
              Manage user accounts in bulk — filter students by year, branch, department, or course.
              Deactivate or permanently delete selected accounts.
            </p>
            <button
              onClick={() => router.push('/admin/users')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Users className="w-4 h-4" />
              Manage Users
            </button>
          </div>
        </div>
      </div>

      {/* ─── Info Card ───────────────────────────────────────────────── */}
      <div className="card p-5 bg-blue-50/50 border-blue-200">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">How controls work</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Each control is <strong>independent</strong> — toggling one does not affect others</li>
              <li>• All controls are <strong>backend-enforced</strong> — API calls are blocked regardless of UI</li>
              <li>• Changes take effect <strong>immediately</strong> across the entire system</li>
              <li>• Individual user management (delete, deactivate) is available in the <strong>Users</strong> page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
