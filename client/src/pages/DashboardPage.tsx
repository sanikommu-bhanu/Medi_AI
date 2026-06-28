import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Activity, Thermometer, Droplets, Calendar, Pill,
  FileText, Bell, ArrowRight, TrendingUp, TrendingDown,
  Plus, Brain, ChevronRight, Zap, Shield, Clock, GripVertical
} from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from 'recharts';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useAuthStore from '../store/authStore';
import api from '../lib/api';
import { formatDate, getRelativeTime } from '../lib/utils';
import toast from 'react-hot-toast';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

function SortableCard({ id, children, className }: { id: string, children: React.ReactNode, className?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative ${className} ${isDragging ? 'opacity-50 scale-105 shadow-2xl' : ''}`}>
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute top-4 right-4 z-10 p-2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [heartRateTrend, setHeartRateTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [cardOrder, setCardOrder] = useState(['appointments', 'medications', 'notifications', 'insights']);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, apptRes, medRes, notifRes, hrRes] = await Promise.allSettled([
        api.get('/health/stats'),
        api.get('/appointments/upcoming'),
        api.get('/medications/today/schedule'),
        api.get('/notifications?unread=true'),
        api.get('/health/trends/heart_rate'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data.stats);
      if (apptRes.status === 'fulfilled') setAppointments(apptRes.value.data.appointments || []);
      if (medRes.status === 'fulfilled') setMedications(medRes.value.data.medications || []);
      if (notifRes.status === 'fulfilled') setNotifications(notifRes.value.data.notifications?.slice(0, 3) || []);
      if (hrRes.status === 'fulfilled') {
        const records = hrRes.value.data.records || [];
        setHeartRateTrend(records.map((r: any) => ({
          time: new Date(r.recorded_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
          value: parseFloat(r.value)
        })));
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addSampleVital = async () => {
    try {
      await api.post('/health', {
        record_type: 'heart_rate',
        title: 'Heart Rate',
        value: (60 + Math.floor(Math.random() * 40)).toString(),
        unit: 'BPM',
      });
      toast.success('Vital recorded!');
      loadDashboardData();
    } catch {
      toast.error('Failed to record vital');
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const vitals = stats?.latestVitals || {};

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setCardOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const renderCard = (id: string) => {
    switch (id) {
      case 'appointments':
        return (
          <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="card group h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Appointments</h2>
              <button onClick={() => navigate('/appointments')}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1 pr-6">
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.slice(0, 3).map((appt) => (
                  <div key={appt.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{appt.doctor_name}</p>
                      <p className="text-xs text-slate-400">{appt.specialty}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                        {formatDate(appt.appointment_date, 'medium')} at {appt.appointment_time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">No upcoming appointments</p>
                <button onClick={() => navigate('/appointments')}
                  className="mt-3 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                  Schedule one now
                </button>
              </div>
            )}
          </motion.div>
        );
      case 'medications':
        return (
          <motion.div {...fadeUp} transition={{ delay: 0.25 }} className="card group h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Today's Meds</h2>
              <button onClick={() => navigate('/medications')}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1 pr-6">
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {medications.length > 0 ? (
              <div className="space-y-3">
                {medications.slice(0, 4).map((med: any) => (
                  <div key={med.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      med.taken_today > 0 ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-amber-100 dark:bg-amber-950/50'
                    }`}>
                      <Pill className={`w-4 h-4 ${med.taken_today > 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{med.name}</p>
                      <p className="text-xs text-slate-400">{med.dosage} · {med.frequency}</p>
                    </div>
                    <span className={`badge ${med.taken_today > 0 ? 'badge-green' : 'badge-amber'}`}>
                      {med.taken_today > 0 ? 'Taken' : 'Due'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Pill className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">No medications added</p>
                <button onClick={() => navigate('/medications')}
                  className="mt-3 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                  Add medication
                </button>
              </div>
            )}
          </motion.div>
        );
      case 'notifications':
        return (
          <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="card group h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Notifications</h2>
              <button onClick={() => navigate('/notifications')}
                className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1 pr-6">
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notif: any) => (
                  <div key={notif.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center flex-shrink-0 text-base">
                      {notif.type === 'appointment' ? '📅' : notif.type === 'medication' ? '💊' : notif.type === 'report' ? '📋' : 'ℹ️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{notif.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{notif.body}</p>
                      <p className="text-xs text-slate-400 mt-1">{getRelativeTime(notif.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">All caught up!</p>
                <p className="text-slate-400 text-xs mt-1">No new notifications</p>
              </div>
            )}
          </motion.div>
        );
      case 'insights':
        return (
          <motion.div {...fadeUp} transition={{ delay: 0.35 }} className="card group h-full bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-indigo-100 dark:border-indigo-900/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Brain className="w-24 h-24 text-indigo-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-5">
                <Zap className="w-5 h-5 text-amber-500" />
                <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">AI Insights</h2>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/50 dark:border-slate-700/50">
                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Excellent Adherence</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        You've taken all your medications on time this week. Your blood pressure has stabilized as a result.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/50 dark:border-slate-700/50">
                  <div className="flex gap-3">
                    <Clock className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white mb-1">Upcoming Checkup</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        It's been 6 months since your last general checkup. Consider scheduling an appointment with Dr. Smith.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => navigate('/chat')} className="mt-4 w-full py-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-2">
                Ask AI Assistant <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="skeleton h-32 rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="skeleton h-64 rounded-3xl lg:col-span-2" />
          <div className="skeleton h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-6 relative">
      {/* Welcome Hero */}
      <motion.div
        {...fadeUp}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-6 sm:p-8 text-white shadow-lg"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full" />
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium">{greeting()},</p>
            <h1 className="text-2xl sm:text-3xl font-display font-bold mt-1">
              {profile?.full_name || user?.email?.split('@')[0] || 'User'} 👋
            </h1>
            <p className="text-blue-200 mt-2 text-sm sm:text-base">
              Welcome to your Virtual Healthcare Assistant. All in wellness, just a message away.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              <button onClick={() => navigate('/chat')}
                className="bg-white text-blue-600 font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-all flex items-center gap-2 text-sm shadow-sm hover:scale-105 active:scale-95">
                <Brain className="w-4 h-4" /> Ask AI Assistant
              </button>
            </div>
          </div>
          <div className="hidden sm:flex flex-col gap-2 text-right">
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20 shadow-sm">
              <p className="text-blue-200 text-xs">Health Score</p>
              <p className="text-4xl font-display font-bold text-white">87</p>
              <div className="flex items-center gap-1 mt-1 justify-end">
                <TrendingUp className="w-3 h-3 text-emerald-300" />
                <span className="text-xs text-emerald-300">+3 this week</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Health Records', value: stats?.totalRecords || 0, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/50', change: null },
          { label: 'Reports', value: stats?.totalReports || 0, icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/50', change: null },
          { label: 'Appointments', value: stats?.upcomingAppointments || 0, icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/50', change: 'Upcoming' },
          { label: 'Medications', value: stats?.activeMedications || 0, icon: Pill, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/50', change: 'Active' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className="stat-card cursor-pointer"
              onClick={() => navigate(i === 0 ? '/health' : i === 1 ? '/reports' : i === 2 ? '/appointments' : '/medications')}
            >
              <div className={`w-10 h-10 rounded-2xl ${stat.bg} flex items-center justify-center mb-3 shadow-sm`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{stat.label}</p>
              {stat.change && <p className={`text-xs mt-1 ${stat.color} font-medium`}>{stat.change}</p>}
            </motion.div>
          );
        })}
      </div>

      {/* Vitals & Chart Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Vitals */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="card lg:col-span-1 h-full">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Latest Vitals</h2>
            <button onClick={() => navigate('/health')}
              className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {[
              { type: 'heart_rate', label: 'Heart Rate', icon: Heart, color: 'text-rose-500', unit: 'BPM', normal: '60-100' },
              { type: 'blood_pressure', label: 'Blood Pressure', icon: Activity, color: 'text-blue-500', unit: 'mmHg', normal: '<120/80' },
              { type: 'blood_sugar', label: 'Blood Sugar', icon: Droplets, color: 'text-amber-500', unit: 'mg/dL', normal: '70-140' },
              { type: 'temperature', label: 'Temperature', icon: Thermometer, color: 'text-orange-500', unit: '°F', normal: '97-99.5' },
            ].map((vital) => {
              const Icon = vital.icon;
              const record = vitals[vital.type];
              return (
                <div key={vital.type} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">
                  <div className={`w-9 h-9 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm`}>
                    <Icon className={`w-5 h-5 ${vital.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{vital.label}</p>
                    <p className="text-xs text-slate-400">Normal: {vital.normal}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {record ? (
                      <>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{record.value}</p>
                        <p className="text-xs text-slate-400">{vital.unit}</p>
                      </>
                    ) : (
                      <button onClick={addSampleVital}
                        className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">Add</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => navigate('/health')}
            className="w-full mt-4 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/10">
            <Plus className="w-4 h-4" /> Record Vital
          </button>
        </motion.div>

        {/* Heart Rate Chart */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="card lg:col-span-2 flex flex-col h-full">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Heart Rate Trend</h2>
              <p className="text-slate-400 text-sm">Last 30 readings</p>
            </div>
            <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/50 px-3 py-1.5 rounded-xl shadow-sm">
              <Heart className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
                {vitals.heart_rate?.value || '--'} BPM
              </span>
            </div>
          </div>
          {heartRateTrend.length > 0 ? (
            <div className="flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={heartRateTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip
                    contentStyle={{ 
                      background: 'rgba(30, 41, 59, 0.9)', 
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '16px', 
                      color: '#f8fafc', 
                      fontSize: '13px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                    }}
                    itemStyle={{ color: '#f8fafc', fontWeight: 600 }}
                    formatter={(val: any) => [`${val} BPM`, 'Heart Rate']}
                    cursor={{ stroke: '#f43f5e', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorHr)" 
                    activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2, className: "shadow-glow" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center mb-3">
                <Heart className="w-8 h-8 text-rose-300" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">No heart rate data yet</p>
              <p className="text-slate-400 text-sm mt-1">Start recording your vitals to see trends</p>
              <button onClick={addSampleVital}
                className="mt-4 btn-primary py-2 px-5 text-sm">Add First Reading</button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Sortable Bottom Row */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
          <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
            {cardOrder.map(id => (
              <SortableCard key={id} id={id}>
                {renderCard(id)}
              </SortableCard>
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 lg:bottom-6 right-6 z-40 group">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/40 hover:shadow-blue-500/60 transition-shadow"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </motion.button>
        <div className="absolute bottom-full right-0 mb-4 opacity-0 scale-95 origin-bottom group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none group-hover:pointer-events-auto flex flex-col gap-2">
          <button onClick={() => navigate('/health')} className="flex items-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-full shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700 whitespace-nowrap font-medium text-sm">
            <Activity className="w-4 h-4 text-blue-500" /> Log Health Vital
          </button>
          <button onClick={() => navigate('/appointments')} className="flex items-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-full shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700 whitespace-nowrap font-medium text-sm">
            <Calendar className="w-4 h-4 text-emerald-500" /> New Appointment
          </button>
          <button onClick={() => navigate('/chat')} className="flex items-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-full shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700 whitespace-nowrap font-medium text-sm">
            <Brain className="w-4 h-4 text-indigo-500" /> Ask AI
          </button>
        </div>
      </div>
    </div>
  );
}
