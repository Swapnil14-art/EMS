'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { userService, departmentService } from '@/lib/services';
import { ROLE_LABELS, COURSES, YEAR_OF_STUDY, getSchoolInfo } from '@/lib/utils';
import { Button, Input, Select } from '@/components/ui';
import { SchoolDisplay } from '@/components/shared/SchoolDisplay';
import { User, Mail, Phone, MapPin, CheckCircle2, Building2, GraduationCap, Info, Edit, FileText, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user: authUser, setUser } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<{value: string; label: string}[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    department_id: '',
    year_of_study: '',
    branch: '',
    course: '',
    sap_id: '',
    phone_number: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [u, depts] = await Promise.all([
        userService.getMe(),
        departmentService.list().catch(() => [])
      ]);
      setProfile(u);
      setDepartments(depts.map((d: any) => {
        const info = getSchoolInfo(d.code);
        return { value: String(d.id), label: info ? info.abbreviation : d.name };
      }));
    } catch (err: any) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        department_id: profile.department_id ? String(profile.department_id) : '',
        year_of_study: profile.year_of_study || '',
        branch: profile.branch || '',
        course: profile.course || '',
        sap_id: profile.sap_id || '',
        phone_number: profile.phone_number || '',
      });
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        name: formData.name || undefined,
        department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
        year_of_study: formData.year_of_study || undefined,
        branch: formData.branch || undefined,
        course: formData.course || undefined,
        sap_id: formData.sap_id || undefined,
        phone_number: formData.phone_number || undefined,
      };

      const updatedUser = await userService.updateMe(payload);
      setProfile(updatedUser);
      // Update global auth state with new name/dept
      setUser({
        ...authUser!,
        name: updatedUser.name,
        department_id: updatedUser.department_id,
        sap_id: updatedUser.sap_id
      });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <div className="skeleton h-8 w-1/4 mb-2" />
          <div className="skeleton h-4 w-1/3" />
        </div>
        <div className="card p-6 space-y-6">
          <div className="flex gap-4">
            <div className="skeleton w-20 h-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <div className="skeleton h-6 w-1/3" />
              <div className="skeleton h-4 w-1/4" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isStudent = profile.role === 'student';
  const isClubCoordinator = profile.role === 'club_coordinator';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information</p>
        </div>
        {!isEditing && (
          <Button variant="primary" icon={<Edit className="w-4 h-4" />} onClick={handleEditClick}>
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Summary Card */}
        <div className="md:col-span-1">
          <div className="card text-center p-6 space-y-4">
            <div className="w-24 h-24 mx-auto bg-slate-100 text-slate-400 rounded-full flex items-center justify-center text-4xl font-bold uppercase overflow-hidden border-4 border-white shadow-md">
              {profile.name ? profile.name.slice(0,2) : '?'}
            </div>
            
            <div>
              <h2 className="text-xl font-display font-bold text-[var(--text-primary)]">
                {profile.name || 'Set your name'}
              </h2>
              <p className="text-sm font-medium text-[rgb(var(--color-primary))] mt-1">
                {ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] || profile.role}
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--card-border)] space-y-3 text-left">
              <div className="flex items-center gap-3 text-[var(--text-secondary)] text-sm">
                <Mail className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-[var(--text-secondary)] text-sm">
                <Building2 className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="truncate">{profile.department?.name ? <SchoolDisplay value={profile.department.name} /> : 'No school'}</span>
              </div>
              {profile.club && (
                <div className="flex items-center gap-3 text-[var(--text-secondary)] text-sm">
                  <Star className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="truncate">{profile.club.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Details/Form */}
        <div className="md:col-span-2">
          <div className="card p-6">
            <h3 className="font-display font-semibold text-lg text-[var(--text-primary)] mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-[rgb(var(--color-primary))]" />
              {isEditing ? 'Edit Information' : 'Personal Details'}
            </h3>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-5 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your full name"
                    required
                  />
                  <Select
                    label="School"
                    options={departments}
                    value={formData.department_id}
                    onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                    placeholder="Select School"
                    required
                  />
                  
                  <Input
                    label="Phone Number"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    placeholder="e.g. 9876543210"
                  />
                  
                  {/* Student & Coordinator shared fields */}
                  {(isStudent || isClubCoordinator) && (
                    <Input
                      label="SAP ID"
                      value={formData.sap_id}
                      onChange={(e) => setFormData({...formData, sap_id: e.target.value})}
                      placeholder="e.g. 7000..."
                    />
                  )}

                  {/* Student Only fields */}
                  {isStudent && (
                    <>
                      <Select
                        label="Year of Study"
                        options={YEAR_OF_STUDY}
                        value={formData.year_of_study}
                        onChange={(e) => setFormData({...formData, year_of_study: e.target.value})}
                        placeholder="Select Year"
                      />
                      <Select
                        label="Course"
                        options={COURSES}
                        value={formData.course}
                        onChange={(e) => setFormData({...formData, course: e.target.value})}
                        placeholder="Select Course"
                      />
                      <Input
                        label="Branch/Specialization"
                        value={formData.branch}
                        onChange={(e) => setFormData({...formData, branch: e.target.value})}
                        placeholder="e.g. Computer Engineering"
                      />
                    </>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[var(--card-border)] mt-6">
                  <Button type="button" variant="ghost" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={saving} icon={<CheckCircle2 className="w-4 h-4" />}>
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                  <ProfileField label="Email Address" value={profile.email} />
                  <ProfileField label="Phone Number" value={profile.phone_number} />
                  
                  <ProfileField label="School" value={<SchoolDisplay value={profile.department?.name} />} />
                  
                  {isClubCoordinator && (
                     <ProfileField label="Coordinator For" value={profile.club?.name} />
                  )}

                  {(isStudent || isClubCoordinator) && (
                    <ProfileField label="SAP ID" value={profile.sap_id} />
                  )}
                  
                  {isStudent && (
                    <>
                      <ProfileField 
                        label="Year of Study" 
                        value={YEAR_OF_STUDY.find(y => y.value === profile.year_of_study)?.label || profile.year_of_study} 
                      />
                      <ProfileField 
                        label="Course" 
                        value={COURSES.find(c => c.value === profile.course)?.label || profile.course} 
                      />
                      <ProfileField label="Branch" value={profile.branch} />
                    </>
                  )}
                </div>
                
                {/* Information Callout */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800 mt-6">
                  <Info className="w-5 h-5 flex-shrink-0 text-blue-600" />
                  <p className="text-sm">
                    <strong>Email and Role are managed by the system.</strong> If you need to change your registered email, role, or club assignment, please contact the Super Admin.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string, value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm font-medium text-[var(--text-primary)]">
        {value || <span className="text-slate-400 italic">Not provided</span>}
      </p>
    </div>
  );
}
