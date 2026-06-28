import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Heart, Activity, Thermometer, Droplets, Weight, Zap, X, TrendingUp, Moon, Smile, GlassWater, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../lib/api';
import { formatDate, getRelativeTime } from '../lib/utils';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const VITAL_TYPES = [
  { id: 'heart_rate', label: 'Heart Rate', icon: Heart, unit: 'BPM', color: '#f43f5e', bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600 dark:text-rose-400', normal: '60–100', placeholder: '72' },
  { id: 'blood_pressure', label: 'Blood Pressure', icon: Activity, unit: 'mmHg', color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', normal: '<120/80', placeholder: '120/80' },
  { id: 'blood_sugar', label: 'Blood Sugar', icon: Droplets, unit: 'mg/dL', color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', normal: '70–140', placeholder: '95' },
  { id: 'temperature', label: 'Temperature', icon: Thermometer, unit: '°F', color: '#f97316', bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-600 dark:text-orange-400', normal: '97–99.5', placeholder: '98.6' },
  { id: 'weight', label: 'Weight & BMI', icon: Weight, unit: 'kg', color: '#8b5cf6', bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-600 dark:text-violet-400', normal: 'BMI 18.5–24.9', placeholder: '70' },
  { id: 'sleep', label: 'Sleep', icon: Moon, unit: 'hrs', color: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-950/30', text: 'text-indigo-600 dark:text-indigo-400', normal: '7–9', placeholder: '8' },
];

const MOODS = [
  { value: '5', label: 'Great', emoji: '😄', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { value: '4', label: 'Good', emoji: '🙂', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: '3', label: 'Okay', emoji: '😐', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  { value: '2', label: 'Bad', emoji: '☹️', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: '1', label: 'Awful', emoji: '😫', color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
];

export default function HealthPage() {
  const { profile } = useAuthStore();
  const [records, setRecords] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<Record<string, any[]>>({});
  const [selectedType, setSelectedType] = useState('heart_rate');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ record_type: 'heart_rate', title: '', value: '', unit: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [waterGlasses, setWaterGlasses] = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [recordsRes, statsRes] = await Promise.all([
        api.get('/health?limit=50'),
        api.get('/health/stats'),
      ]);
      setRecords(recordsRes.data.records || []);
      setStats(statsRes.data.stats || {});
      
      // Load today's water
      const todayWater = (recordsRes.data.records || []).filter((r: any) => r.record_type === 'water' && new Date(r.recorded_at).toDateString() === new Date().toDateString());
      if (todayWater.length > 0) {
        setWaterGlasses(parseInt(todayWater[0].value) || 0);
      }
    } catch { toast.error('Failed to load health data'); }
    finally { setLoading(false); }
  };

  const loadTrend = async (type: string) => {
    if (trends[type]) return;
    try {
      const res = await api.get(`/health/trends/${type}`);
      setTrends(prev => ({
        ...prev,
        [type]: (res.data.records || []).map((r: any) => ({
          date: formatDate(r.recorded_at, 'short'),
          value: parseFloat(r.value) || 0,
        }))
      }));
    } catch {}
  };

  useEffect(() => { loadTrend(selectedType); }, [selectedType]);

  const handleAddRecord = async (type?: string, value?: string, unit?: string, silent: boolean = false) => {
    const rType = type || formData.record_type;
    const rValue = value || formData.value;
    const rUnit = unit || formData.unit;
    
    if (!rValue && !silent) return toast.error('Please enter a value');
    
    const typeInfo = VITAL_TYPES.find(t => t.id === rType) || { label: rType, unit: rUnit };
    
    try {
      await api.post('/health', {
        record_type: rType,
        title: formData.title || typeInfo?.label || rType,
        value: rValue,
        unit: typeInfo?.unit || '',
        notes: formData.notes,
      });
      if (!silent) toast.success('Vital recorded successfully!');
      setShowModal(false);
      setFormData({ record_type: 'heart_rate', title: '', value: '', unit: '', notes: '' });
      setTrends({});
      loadData();
    } catch { if (!silent) toast.error('Failed to record vital'); }
  };

  const deleteRecord = async (id: string) => {
    try {
      await api.delete(`/health/${id}`);
      setRecords(prev => prev.filter(r => r.id !== id));
      setTrends({});
      toast.success('Record deleted');
    } catch { toast.error('Failed to delete'); }
  };
  
  const handleWaterDrink = () => {
    const newGlasses = waterGlasses + 1;
    setWaterGlasses(newGlasses);
    handleAddRecord('water', newGlasses.toString(), 'glasses', true);
  };
  
  const logMood = (moodValue: string, moodLabel: string) => {
    handleAddRecord('mood', moodValue, '', true);
    toast.success(`Mood logged: ${moodLabel}`);
  };

  const latestVitals = stats?.latestVitals || {};
  const currentTrend = trends[selectedType] || [];
  
  // BMI Calculator (Assuming height in profile or defaulting to 1.7m)
  const calculateBMI = (weightKg: string) => {
    const heightM = 1.70; // 170cm default
    const weight = parseFloat(weightKg);
    if (!weight) return null;
    return (weight / (heightM * heightM)).toFixed(1);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="skeleton h-12 w-48 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-32 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Health Insights</h1>
          <p className="section-subtitle">Track and monitor your vital signs</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="btn-primary py-2.5 px-5 flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Record Vital
        </motion.button>
      </div>
      
      {/* Quick Log Row: Water & Mood */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Water Tracker */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border-cyan-100 dark:border-cyan-900/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <GlassWater className="w-5 h-5 text-cyan-500" />
              <h3 className="font-display font-bold text-slate-900 dark:text-white">Water Intake</h3>
            </div>
            <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">{waterGlasses} / 8 glasses</span>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex-1 bg-cyan-200/50 dark:bg-cyan-900/50 h-3 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full transition-all duration-500" style={{ width: `${Math.min((waterGlasses / 8) * 100, 100)}%` }} />
            </div>
            <button onClick={handleWaterDrink} className="p-2 rounded-full bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900/50 dark:hover:bg-cyan-800/60 text-cyan-600 dark:text-cyan-300 transition-colors shadow-sm">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
        
        {/* Mood Selector */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/20 dark:to-pink-950/20 border-fuchsia-100 dark:border-fuchsia-900/50 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-3">
            <Smile className="w-5 h-5 text-fuchsia-500" />
            <h3 className="font-display font-bold text-slate-900 dark:text-white">How are you feeling?</h3>
          </div>
          <div className="flex justify-between items-center px-2">
            {MOODS.map(mood => (
              <button key={mood.value} onClick={() => logMood(mood.value, mood.label)} className="flex flex-col items-center gap-1 group">
                <span className={`text-2xl transition-transform group-hover:scale-125 ${latestVitals['mood']?.value === mood.value ? 'scale-125 drop-shadow-md' : 'opacity-70 group-hover:opacity-100'}`}>
                  {mood.emoji}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Vitals Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {VITAL_TYPES.map((vital, i) => {
          const Icon = vital.icon;
          const latest = latestVitals[vital.id];
          const active = selectedType === vital.id;
          const isWeight = vital.id === 'weight';
          
          return (
            <motion.div
              key={vital.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => setSelectedType(vital.id)}
              className={`card cursor-pointer transition-all duration-200 ${active ? 'ring-2 ring-blue-500 shadow-glow-sm' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-2xl ${vital.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${vital.text}`} />
                </div>
                {active && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">{vital.label}</p>
              {latest ? (
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">
                      {latest.value}
                    </p>
                    <p className={`text-xs mt-1 font-medium ${vital.text}`}>{vital.unit}</p>
                  </div>
                  {isWeight && calculateBMI(latest.value) && (
                    <div className="text-right">
                      <span className="text-xs text-slate-400">BMI</span>
                      <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{calculateBMI(latest.value)}</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-2xl font-display font-bold text-slate-300 dark:text-slate-600">--</p>
                  <p className="text-xs mt-1 text-slate-400">Normal: {vital.normal}</p>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Trend Chart */}
      <motion.div layout className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">
              {VITAL_TYPES.find(t => t.id === selectedType)?.label} Trend
            </h2>
            <p className="text-slate-400 text-sm">Historical readings</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
            {VITAL_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedType === t.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {currentTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={currentTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={VITAL_TYPES.find(t => t.id === selectedType)?.color || '#3b82f6'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={VITAL_TYPES.find(t => t.id === selectedType)?.color || '#3b82f6'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" opacity={0.1} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f1f5f9', fontSize: '12px' }}
                itemStyle={{ fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="value" stroke={VITAL_TYPES.find(t => t.id === selectedType)?.color || '#3b82f6'}
                strokeWidth={3} fillOpacity={1} fill="url(#colorGrad)"
                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', className: "shadow-glow" }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">No data for this vital</p>
              <button onClick={() => { setFormData({...formData, record_type: selectedType}); setShowModal(true); }}
                className="mt-3 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                Add first reading
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Recent Records */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">Recent Records</h2>
        </div>
        {records.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No health records yet</p>
            <p className="text-slate-400 text-sm mt-1">Start tracking your vitals to see them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {records.slice(0, 10).map((record) => {
              const typeInfo = VITAL_TYPES.find(t => t.id === record.record_type) || { icon: Activity, bg: 'bg-slate-100', text: 'text-slate-500' };
              const Icon = typeInfo.icon;
              return (
                <motion.div
                  key={record.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-xl ${typeInfo.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${typeInfo.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white capitalize">{record.record_type.replace('_', ' ')}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{getRelativeTime(record.recorded_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-slate-900 dark:text-white">{record.value}</p>
                    <p className="text-xs text-slate-400">{record.unit}</p>
                  </div>
                  <button
                    onClick={() => deleteRecord(record.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all ml-2"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Vital Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-backdrop flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-premium border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">Record Vital</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Vital Type</label>
                  <select
                    value={formData.record_type}
                    onChange={e => {
                      const t = VITAL_TYPES.find(v => v.id === e.target.value);
                      setFormData({ ...formData, record_type: e.target.value, unit: t?.unit || '', title: '' });
                    }}
                    className="input-field bg-slate-50 dark:bg-slate-800/50"
                  >
                    {VITAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Value ({VITAL_TYPES.find(t => t.id === formData.record_type)?.unit})
                  </label>
                  <input
                    type="text"
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                    className="input-field bg-slate-50 dark:bg-slate-800/50 text-xl font-bold"
                    placeholder={VITAL_TYPES.find(t => t.id === formData.record_type)?.placeholder || ''}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes (optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field bg-slate-50 dark:bg-slate-800/50 resize-none"
                    rows={2}
                    placeholder="How are you feeling?"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-3 font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">Cancel</button>
                <button onClick={() => handleAddRecord()} className="btn-primary flex-1 py-3 font-semibold shadow-md shadow-blue-500/20">Save Record</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
