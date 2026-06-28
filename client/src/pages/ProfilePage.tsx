import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Calendar, Droplets, Weight, Phone, MapPin,
  AlertCircle, Heart, Stethoscope, Edit3, Save, X,
  Shield, Activity
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { calculateAge, getInitials, BLOOD_TYPES, GENDERS } from '../lib/utils';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, profile, updateProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...profile });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form as any);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const age = profile?.date_of_birth ? calculateAge(profile.date_of_birth) : null;

  const InfoRow = ({ icon: Icon, label, value, field, type = 'text' }: any) => (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        {editing && field ? (
          type === 'select-gender' ? (
            <select
              value={(form as any)[field] || ''}
              onChange={e => setForm((prev: any) => ({ ...prev, [field]: e.target.value }))}
              className="mt-1 input-field py-2 text-sm"
            >
              <option value="">Not specified</option>
              {GENDERS.map(g => <option key={g}>{g}</option>)}
            </select>
          ) : type === 'select-blood' ? (
            <select
              value={(form as any)[field] || ''}
              onChange={e => setForm((prev: any) => ({ ...prev, [field]: e.target.value }))}
              className="mt-1 input-field py-2 text-sm"
            >
              <option value="">Unknown</option>
              {BLOOD_TYPES.map(b => <option key={b}>{b}</option>)}
            </select>
          ) : type === 'textarea' ? (
            <textarea
              value={(form as any)[field] || ''}
              onChange={e => setForm((prev: any) => ({ ...prev, [field]: e.target.value }))}
              className="mt-1 input-field py-2 text-sm resize-none"
              rows={2}
            />
          ) : (
            <input
              type={type}
              value={(form as any)[field] || ''}
              onChange={e => setForm((prev: any) => ({ ...prev, [field]: e.target.value }))}
              className="mt-1 input-field py-2 text-sm"
            />
          )
        ) : (
          <p className="mt-0.5 text-slate-700 dark:text-slate-300 font-medium">
            {value || <span className="text-slate-400 font-normal">Not provided</span>}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">My Profile</h1>
          <p className="section-subtitle">Your personal health information</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setForm({ ...profile }); }}
                className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
              <Edit3 className="w-4 h-4" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0"
      >
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-3xl font-display font-bold flex-shrink-0">
            {profile?.full_name ? getInitials(profile.full_name) : user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-display font-bold truncate">
              {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-blue-200 text-sm">{user?.email}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              {profile?.blood_type && (
                <div className="bg-white/15 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-2 text-sm border border-white/20">
                  <Droplets className="w-3.5 h-3.5 text-red-300" />
                  <span className="font-semibold">{profile.blood_type}</span>
                </div>
              )}
              {age && (
                <div className="bg-white/15 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-2 text-sm border border-white/20">
                  <User className="w-3.5 h-3.5 text-blue-200" />
                  <span>{age} years</span>
                </div>
              )}
              {profile?.gender && (
                <div className="bg-white/15 backdrop-blur rounded-xl px-3 py-1.5 text-sm border border-white/20">
                  {profile.gender}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Body metrics */}
        {(profile?.height || profile?.weight) && (
          <div className="mt-5 pt-5 border-t border-white/20 grid grid-cols-2 gap-4">
            {profile?.height && (
              <div>
                <p className="text-blue-200 text-xs">Height</p>
                <p className="text-white font-bold text-lg">{profile.height} cm</p>
              </div>
            )}
            {profile?.weight && (
              <div>
                <p className="text-blue-200 text-xs">Weight</p>
                <p className="text-white font-bold text-lg">{profile.weight} kg</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Personal Info */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card">
        <div className="flex items-center gap-2 mb-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <User className="w-5 h-5 text-blue-600" />
          <h3 className="font-display font-bold text-slate-900 dark:text-white">Personal Information</h3>
        </div>
        <InfoRow icon={User} label="Full Name" value={profile?.full_name} field="full_name" />
        <InfoRow icon={Calendar} label="Date of Birth" value={profile?.date_of_birth} field="date_of_birth" type="date" />
        <InfoRow icon={User} label="Gender" value={profile?.gender} field="gender" type="select-gender" />
        <InfoRow icon={Phone} label="Phone" value={profile?.phone} field="phone" type="tel" />
        <InfoRow icon={MapPin} label="Address" value={profile?.address} field="address" type="textarea" />
      </motion.div>

      {/* Medical Profile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
        <div className="flex items-center gap-2 mb-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Heart className="w-5 h-5 text-rose-500" />
          <h3 className="font-display font-bold text-slate-900 dark:text-white">Medical Profile</h3>
        </div>
        <InfoRow icon={Droplets} label="Blood Type" value={profile?.blood_type} field="blood_type" type="select-blood" />
        <InfoRow icon={Activity} label="Height (cm)" value={profile?.height ? `${profile.height} cm` : null} field="height" type="number" />
        <InfoRow icon={Weight} label="Weight (kg)" value={profile?.weight ? `${profile.weight} kg` : null} field="weight" type="number" />
        <InfoRow icon={Stethoscope} label="Primary Physician" value={profile?.primary_physician} field="primary_physician" />
        <InfoRow icon={AlertCircle} label="Allergies" value={profile?.allergies} field="allergies" type="textarea" />
        <InfoRow icon={Heart} label="Chronic Conditions" value={profile?.chronic_conditions} field="chronic_conditions" type="textarea" />
      </motion.div>

      {/* Emergency Contact */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card">
        <div className="flex items-center gap-2 mb-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Shield className="w-5 h-5 text-amber-500" />
          <h3 className="font-display font-bold text-slate-900 dark:text-white">Emergency Contact</h3>
        </div>
        <InfoRow icon={User} label="Contact Name" value={profile?.emergency_contact_name} field="emergency_contact_name" />
        <InfoRow icon={Phone} label="Contact Phone" value={profile?.emergency_contact_phone} field="emergency_contact_phone" type="tel" />
      </motion.div>
    </div>
  );
}
