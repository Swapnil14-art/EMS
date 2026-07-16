'use client';
import { useState, useEffect, useCallback } from 'react';
import { permissionService } from '@/lib/services';
import { Shield, Check, X, Search, Save, RefreshCw, User } from 'lucide-react';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';

interface AdditionalUser {
  id: number;
  name: string;
  email: string;
  status: string;
  department: string | null;
  extra_permissions: string[];
}

interface Props {
  /** Whether the viewer is super_admin (can grant manage_permissions) */
  isSuperAdmin?: boolean;
}

export default function PermissionManager({ isSuperAdmin = false }: Props) {
  const [catalog, setCatalog] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<AdditionalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<number | null>(null);
  // local edits: userId -> Set of perm codes
  const [edits, setEdits] = useState<Record<number, Set<string>>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, usersRes] = await Promise.all([
        permissionService.getCatalog(),
        permissionService.listUsers(),
      ]);
      setCatalog(catRes.catalog);
      setUsers(usersRes.data);
      // Seed local edits from current permissions
      const init: Record<number, Set<string>> = {};
      usersRes.data.forEach((u: AdditionalUser) => {
        init[u.id] = new Set(u.extra_permissions);
      });
      setEdits(init);
    } catch (err: any) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (userId: number, perm: string) => {
    setEdits(prev => {
      const next = new Set(prev[userId] ?? []);
      if (next.has(perm)) next.delete(perm); else next.add(perm);
      return { ...prev, [userId]: next };
    });
  };

  const save = async (userId: number) => {
    setSaving(userId);
    try {
      const perms = Array.from(edits[userId] ?? []);
      await permissionService.setPermissions(userId, perms);
      toast.success('Permissions saved');
      // Update local user list
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, extra_permissions: perms } : u));
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(null);
    }
  };

  const isDirty = (userId: number) => {
    const u = users.find(x => x.id === userId);
    if (!u) return false;
    const original = new Set(u.extra_permissions);
    const current = edits[userId] ?? new Set();
    if (original.size !== current.size) return true;
    for (const p of Array.from(original)) if (!current.has(p)) return true;
    return false;
  };

  // Permissions visible to this manager
  const visiblePerms = Object.entries(catalog).filter(([code]) =>
    isSuperAdmin ? true : code !== 'manage_permissions'
  );

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-[rgb(var(--color-primary))] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input type="text" placeholder="Search Additional users..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-white border border-[var(--input-border)] text-[var(--text-primary)] rounded-xl outline-none focus:border-[var(--input-focus-ring)] transition-colors text-sm" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        </div>
        <button onClick={load} className="p-2.5 rounded-xl border border-[var(--card-border)] hover:bg-slate-50 transition-colors text-[var(--text-muted)]" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-[var(--text-muted)]">
          {users.length === 0 ? 'No Additional role users yet. Create one in Admin → Users.' : 'No users match your search.'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(u => {
            const userPerms = edits[u.id] ?? new Set();
            const dirty = isDirty(u.id);

            return (
              <div key={u.id} className={`card p-5 transition-all ${dirty ? 'border-amber-300 shadow-md' : ''}`}>
                {/* User header */}
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {u.name ? u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '??'}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{u.name || '(No name)'}</p>
                      <p className="text-xs text-[var(--text-muted)]">{u.email}{u.department ? ` · ${u.department}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {dirty && (
                      <span className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                        Unsaved changes
                      </span>
                    )}
                    <Button
                      loading={saving === u.id}
                      onClick={() => save(u.id)}
                      disabled={!dirty}
                      icon={<Save className="w-3.5 h-3.5" />}
                      className={`h-8 px-3 text-xs ${dirty ? 'bg-[rgb(var(--color-primary))] text-white border-0' : 'opacity-50 cursor-not-allowed'}`}
                    >
                      Save
                    </Button>
                  </div>
                </div>

                {/* Permission grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {visiblePerms.map(([code, label]) => {
                    const [title, desc] = label.split(' — ');
                    const granted = userPerms.has(code);
                    return (
                      <button
                        key={code}
                        onClick={() => toggle(u.id, code)}
                        className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-sm ${
                          granted
                            ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border transition-colors ${
                          granted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'
                        }`}>
                          {granted && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold leading-tight ${granted ? 'text-emerald-800' : 'text-[var(--text-primary)]'}`}>
                            {title}
                          </p>
                          {desc && <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-snug">{desc}</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Perm count footer */}
                <div className="mt-3 pt-3 border-t border-[var(--card-border)] flex items-center gap-2 flex-wrap">
                  {Array.from(userPerms).length === 0 ? (
                    <span className="text-xs text-[var(--text-muted)] italic">No permissions granted</span>
                  ) : (
                    Array.from(userPerms).map(p => (
                      <span key={p} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 uppercase tracking-wide">
                        {p.replace(/_/g, ' ')}
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
