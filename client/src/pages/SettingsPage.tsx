import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Moon, Sun, Bell, Shield, Brain, Database, User, ChevronRight,
  Globe, Fingerprint, LogOut, Trash2, Info, Heart, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import toast from 'react-hot-toast';

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`toggle-switch ${value ? 'on' : 'off'}`}
    >
      <span className="toggle-thumb" />
    </button>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [settings, setSettings] = useState<any>({
    notifications_enabled: true,
    medication_reminders: true,
    appointment_reminders: true,
    health_tips: true,
    ai_suggestions: true,
    data_sharing: false,
    two_factor_auth: false,
    biometric_login: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get('/settings');
      const s = res.data.settings;
      setSettings({
        notifications_enabled: !!s.notifications_enabled,
        medication_reminders: !!s.medication_reminders,
        appointment_reminders: !!s.appointment_reminders,
        health_tips: !!s.health_tips,
        ai_suggestions: !!s.ai_suggestions,
        data_sharing: !!s.data_sharing,
        two_factor_auth: !!s.two_factor_auth,
        biometric_login: !!s.biometric_login,
      });
    } catch { } finally { setLoading(false); }
  };

  const updateSetting = async (key: string, value: boolean) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    setSaving(true);
    try {
      await api.put('/settings', { [key]: value });
      toast.success('Setting saved');
    } catch {
      setSettings(settings);
      toast.error('Failed to save');
    } finally { setSaving(false); }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const sections = [
    {
      title: 'Appearance',
      icon: Sun,
      items: [
        {
          label: 'Dark Mode',
          description: 'Switch to dark theme',
          icon: isDark ? Moon : Sun,
          control: <Toggle value={isDark} onChange={toggleTheme} />,
        },
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Push Notifications', description: 'Receive all app notifications', icon: Bell, key: 'notifications_enabled' },
        { label: 'Medication Reminders', description: 'Get reminded to take medications', icon: Heart, key: 'medication_reminders' },
        { label: 'Appointment Reminders', description: 'Reminders before appointments', icon: Bell, key: 'appointment_reminders' },
        { label: 'Health Tips', description: 'Daily health recommendations', icon: Brain, key: 'health_tips' },
        { label: 'AI Suggestions', description: 'Proactive AI health insights', icon: Brain, key: 'ai_suggestions' },
      ]
    },
    {
      title: 'Privacy & Security',
      icon: Shield,
      items: [
        { label: 'Two-Factor Auth', description: 'Add an extra layer of security', icon: Lock, key: 'two_factor_auth' },
        { label: 'Biometric Login', description: 'Use fingerprint or face ID', icon: Fingerprint, key: 'biometric_login' },
        { label: 'Data Sharing', description: 'Share anonymized data for research', icon: Database, key: 'data_sharing' },
      ]
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="section-subtitle">Manage your preferences and account</p>
      </div>

      {/* Profile Quick Link */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        onClick={() => navigate('/profile')}
        className="card cursor-pointer hover:shadow-card transition-all"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-slate-900 dark:text-white">{user?.email}</p>
            <p className="text-slate-400 text-sm">View and edit your profile</p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </div>
      </motion.div>

      {/* Settings Sections */}
      {sections.map((section, si) => {
        const SectionIcon = section.icon;
        return (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.05 }}
            className="card space-y-1"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <SectionIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="font-display font-bold text-slate-900 dark:text-white">{section.title}</h2>
            </div>

            {section.items.map((item: any) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-4 py-3 px-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-200">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.description}</p>
                  </div>
                  {item.control ? item.control : (
                    <Toggle
                      value={settings[item.key] || false}
                      onChange={(v) => updateSetting(item.key, v)}
                    />
                  )}
                </div>
              );
            })}
          </motion.div>
        );
      })}

      {/* About & Legal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="font-display font-bold text-slate-900 dark:text-white">About</h2>
        </div>
        {[
          { label: 'App Version', value: 'v1.0.0' },
          { label: 'Privacy Policy', link: true },
          { label: 'Terms of Service', link: true },
          { label: 'Help & Support', link: true },
          { label: 'AI Disclaimer', value: 'Not a medical device' },
        ].map((item, i) => (
          <div key={i} className={`flex items-center justify-between py-3 px-2 rounded-2xl transition-colors ${item.link ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer' : ''}`}>
            <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
            {item.link ? (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            ) : (
              <span className="text-sm text-slate-400 font-medium">{item.value}</span>
            )}
          </div>
        ))}
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="card border-red-100 dark:border-red-900/30"
      >
        <h2 className="font-display font-bold text-slate-900 dark:text-white mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">Account</h2>
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
          <button
            className="w-full flex items-center gap-3 p-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-sm font-medium"
            onClick={() => toast.error('Please contact support to delete your account')}
          >
            <Trash2 className="w-5 h-5" />
            Delete Account
          </button>
        </div>
      </motion.div>

      {/* Disclaimer */}
      <div className="text-center pb-4">
        <p className="text-xs text-slate-400">
          CareBot is an AI health assistant and is not a licensed medical provider.
          Always consult qualified healthcare professionals for medical advice.
        </p>
      </div>
    </div>
  );
}
