import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Plus, X, Check, Clock, Calendar, User, AlertCircle, Trash2, ChevronDown, Flame, Camera, Brain, Activity } from 'lucide-react';
import api from '../lib/api';
import { formatDate } from '../lib/utils';
import toast from 'react-hot-toast';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Every 4 hours', 'Every 6 hours', 'Every 8 hours', 'Weekly', 'As needed'];
const MED_COLORS = ['bg-rose-400', 'bg-blue-400', 'bg-emerald-400', 'bg-amber-400', 'bg-violet-400', 'bg-cyan-400', 'bg-orange-400', 'bg-pink-400'];

export default function MedicationsPage() {
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [interactionsResult, setInteractionsResult] = useState<string | null>(null);
  const [adherenceScore, setAdherenceScore] = useState(92); // Mock score for hackathon
  
  const [form, setForm] = useState({
    name: '', dosage: '', frequency: 'Once daily', start_date: '',
    end_date: '', instructions: '', prescribing_doctor: '', refill_date: '',
    image_url: ''
  });

  useEffect(() => { loadMedications(); }, []);

  const loadMedications = async () => {
    try {
      const res = await api.get('/medications');
      setMedications(res.data.medications || []);
      // Calculate a dynamic adherence score based on data
      const active = res.data.medications?.filter((m: any) => m.is_active) || [];
      const taken = active.filter((m: any) => m.taken_today > 0);
      if (active.length > 0) {
        setAdherenceScore(Math.round((taken.length / active.length) * 100));
      }
    } catch { toast.error('Failed to load medications'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.name) return toast.error('Medication name is required');
    try {
      if (editingId) {
        await api.put(`/medications/${editingId}`, form);
        toast.success('Medication updated!');
      } else {
        await api.post('/medications', form);
        toast.success('Medication added!');
      }
      setShowModal(false);
      resetForm();
      loadMedications();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to save'); }
  };

  const markTaken = async (id: string) => {
    try {
      await api.post(`/medications/${id}/log`, { status: 'taken' });
      toast.success('Medication marked as taken ✓');
      loadMedications();
    } catch { toast.error('Failed to log'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this medication?')) return;
    try {
      await api.delete(`/medications/${id}`);
      setMedications(prev => prev.filter(m => m.id !== id));
      toast.success('Medication removed');
    } catch { toast.error('Failed to remove'); }
  };

  const handleEdit = (med: any) => {
    setEditingId(med.id);
    setForm({
      name: med.name || '', dosage: med.dosage || '', frequency: med.frequency || 'Once daily',
      start_date: med.start_date || '', end_date: med.end_date || '',
      instructions: med.instructions || '', prescribing_doctor: med.prescribing_doctor || '',
      refill_date: med.refill_date || '', image_url: med.image_url || ''
    });
    setShowModal(true);
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      await api.put(`/medications/${id}`, { is_active: !currentActive });
      setMedications(prev => prev.map(m => m.id === id ? { ...m, is_active: !currentActive ? 1 : 0 } : m));
      toast.success(currentActive ? 'Medication paused' : 'Medication activated');
    } catch { toast.error('Failed to update'); }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: '', dosage: '', frequency: 'Once daily', start_date: '', end_date: '', instructions: '', prescribing_doctor: '', refill_date: '', image_url: '' });
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For hackathon, create local URL
      const url = URL.createObjectURL(file);
      setForm(prev => ({ ...prev, image_url: url }));
      toast.success('Photo attached');
    }
  };

  const checkInteractions = async () => {
    const activeNames = activeMeds.map(m => m.name);
    if (activeNames.length < 2) return toast.error('Need at least 2 medications to check interactions');
    
    setCheckingInteractions(true);
    try {
      const res = await api.post('/chat/quick-chat', {
        message: `Act as a pharmacist. Check for any severe interactions between these medications: ${activeNames.join(', ')}. Keep it under 3 sentences.`
      });
      setInteractionsResult(res.data.response);
    } catch (err) {
      toast.error('Failed to check interactions');
    } finally {
      setCheckingInteractions(false);
    }
  };

  const displayed = activeTab === 'active' ? medications.filter(m => m.is_active) : medications;
  const activeMeds = medications.filter(m => m.is_active);

  if (loading) return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-3xl" />)}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Medications</h1>
          <p className="section-subtitle">Track your pills, check interactions, and maintain your streak</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary py-2.5 px-5 flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          <Plus className="w-4 h-4" /> Add Medication
        </button>
      </div>

      {/* Top Dash: Adherence & Interactions */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-100 dark:border-emerald-900/50 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            <h2 className="font-display font-bold text-slate-900 dark:text-white">Adherence Score</h2>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-5xl font-display font-bold text-emerald-600 dark:text-emerald-400">{adherenceScore}%</p>
            <p className="text-sm text-slate-500 mb-1">Today</p>
          </div>
          <div className="w-full bg-emerald-200/50 dark:bg-emerald-900/50 rounded-full h-2 mt-4">
            <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${adherenceScore}%` }} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card md:col-span-2 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-indigo-100 dark:border-indigo-900/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Brain className="w-24 h-24 text-indigo-500" />
          </div>
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-indigo-500" />
              <h2 className="font-display font-bold text-slate-900 dark:text-white">AI Interaction Checker</h2>
            </div>
            
            {interactionsResult ? (
              <div className="flex-1">
                <p className="text-sm text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl backdrop-blur-sm border border-white/40 dark:border-slate-700/50">
                  {interactionsResult}
                </p>
                <button onClick={() => setInteractionsResult(null)} className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Check Again</button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-md">
                  Analyzing {activeMeds.length} active medications for potential adverse reactions and side effects.
                </p>
                <button 
                  onClick={checkInteractions}
                  disabled={checkingInteractions || activeMeds.length < 2}
                  className="btn-primary w-max bg-indigo-600 hover:bg-indigo-700 text-sm py-2 px-4 shadow-indigo-500/30"
                >
                  {checkingInteractions ? 'Checking...' : 'Check Interactions'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {(['active', 'all'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}>
            {tab === 'active' ? `Active (${activeMeds.length})` : `All (${medications.length})`}
          </button>
        ))}
      </div>

      {/* Medications List */}
      {displayed.length === 0 ? (
        <div className="card text-center py-16 bg-slate-50 dark:bg-slate-800/50 border-dashed border-2 border-slate-200 dark:border-slate-700">
          <Pill className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No medications {activeTab === 'active' ? 'active' : 'added'}</p>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary mt-4 py-2.5 px-6 text-sm">
            Add Medication
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {displayed.map((med, i) => {
            // Mock streak calculation
            const streak = med.taken_today > 0 ? Math.floor(Math.random() * 5) + 2 : 0;
            
            return (
            <motion.div
              key={med.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card hover:shadow-card transition-all group flex flex-col ${!med.is_active ? 'opacity-60 bg-slate-50 dark:bg-slate-900/50' : ''}`}
            >
              <div className="flex items-start gap-4 mb-4">
                {med.image_url ? (
                  <img src={med.image_url} alt={med.name} className="w-14 h-14 rounded-2xl object-cover shadow-sm flex-shrink-0 border border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className={`w-14 h-14 rounded-2xl ${MED_COLORS[i % MED_COLORS.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <Pill className="w-7 h-7 text-white" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white truncate">{med.name}</h3>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{med.dosage}</p>
                    </div>
                    {med.is_active && streak > 0 && (
                      <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-950/40 px-2 py-1 rounded-lg text-orange-600 dark:text-orange-400" title={`${streak} day streak!`}>
                        <Flame className="w-4 h-4 fill-orange-500" />
                        <span className="text-xs font-bold">{streak}</span>
                      </div>
                    )}
                    {!med.is_active && <span className="badge badge-amber text-xs">Paused</span>}
                  </div>
                </div>
                
                <div className="relative group/menu flex-shrink-0">
                  <button className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-2xl shadow-premium border border-slate-100 dark:border-slate-700 py-2 w-40 z-20 hidden group-hover/menu:block">
                    <button onClick={() => handleEdit(med)} className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Edit</button>
                    <button onClick={() => toggleActive(med.id, !!med.is_active)} className="w-full text-left px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                      {med.is_active ? 'Pause' : 'Activate'}
                    </button>
                    <button onClick={() => handleDelete(med.id)} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">Remove</button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
                <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-lg">
                  <Clock className="w-4 h-4 text-slate-400" /> {med.frequency}
                </div>
                {med.refill_date && (
                  <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-lg">
                    <Calendar className="w-4 h-4" /> Refill: {formatDate(med.refill_date, 'medium')}
                  </div>
                )}
              </div>
              
              {med.instructions && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl flex items-start gap-2 border border-slate-100 dark:border-slate-800">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                  {med.instructions}
                </p>
              )}

              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                {med.is_active ? (
                  med.taken_today > 0 ? (
                    <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold border border-emerald-100 dark:border-emerald-900/30">
                      <Check className="w-4 h-4" /> Taken Today
                    </div>
                  ) : (
                    <button
                      onClick={() => markTaken(med.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all active:scale-95"
                    >
                      <Check className="w-4 h-4" /> Log as Taken
                    </button>
                  )
                ) : (
                  <div className="w-full flex items-center justify-center py-2.5 text-slate-400 text-sm font-medium">
                    Medication Paused
                  </div>
                )}
              </div>
            </motion.div>
          )})}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-backdrop flex items-center justify-center p-4 z-50"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg shadow-premium border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-slate-900 z-10 pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">
                  {editingId ? 'Edit Medication' : 'Add Medication'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Photo Upload area */}
                <div className="flex justify-center mb-6">
                  <label className="relative cursor-pointer group">
                    <div className="w-24 h-24 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800/50 group-hover:border-blue-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all">
                      {form.image_url ? (
                        <img src={form.image_url} alt="Medication" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-1" />
                          <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500 uppercase tracking-wider">Photo</span>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Medication Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="input-field bg-slate-50 dark:bg-slate-800/50" placeholder="e.g., Metformin" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Dosage</label>
                    <input value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })}
                      className="input-field bg-slate-50 dark:bg-slate-800/50" placeholder="e.g., 500mg" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Frequency</label>
                    <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="input-field bg-slate-50 dark:bg-slate-800/50">
                      {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Start Date</label>
                    <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="input-field bg-slate-50 dark:bg-slate-800/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">End Date</label>
                    <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="input-field bg-slate-50 dark:bg-slate-800/50" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Prescribing Doctor</label>
                  <input value={form.prescribing_doctor} onChange={e => setForm({ ...form, prescribing_doctor: e.target.value })}
                    className="input-field bg-slate-50 dark:bg-slate-800/50" placeholder="Dr. Name" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Refill Date</label>
                  <input type="date" value={form.refill_date} onChange={e => setForm({ ...form, refill_date: e.target.value })} className="input-field bg-slate-50 dark:bg-slate-800/50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Special Instructions</label>
                  <textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })}
                    className="input-field bg-slate-50 dark:bg-slate-800/50 resize-none" rows={2} placeholder="Take with food, avoid alcohol..." />
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-3 font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">Cancel</button>
                <button onClick={handleSave} className="btn-primary flex-1 py-3 font-semibold shadow-md shadow-blue-500/20">
                  {editingId ? 'Update' : 'Save Medication'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
