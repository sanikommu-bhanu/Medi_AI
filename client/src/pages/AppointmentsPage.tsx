import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, X, Clock, MapPin, User, Video, ChevronRight, Trash2, Download, Brain, Sparkles, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { formatDate, SPECIALTIES, generateICS } from '../lib/utils';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'badge-blue',
  completed: 'badge-green',
  cancelled: 'badge-red',
};

// Countdown Timer Component
function CountdownTimer({ date, time }: { date: string, time: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    const targetDate = new Date(`${date}T${time}`);
    
    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(interval);
        return;
      }
      
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60)
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [date, time]);

  if (!timeLeft) return null;

  return (
    <div className="flex gap-2 items-center justify-center p-3 rounded-2xl bg-slate-900 dark:bg-black text-white">
      <div className="text-center"><p className="text-xl font-bold">{timeLeft.d}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">Days</p></div><span className="text-slate-600 mb-3">:</span>
      <div className="text-center"><p className="text-xl font-bold">{timeLeft.h}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">Hrs</p></div><span className="text-slate-600 mb-3">:</span>
      <div className="text-center"><p className="text-xl font-bold">{timeLeft.m}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">Min</p></div><span className="text-slate-600 mb-3">:</span>
      <div className="text-center"><p className="text-xl font-bold">{timeLeft.s}</p><p className="text-[10px] text-slate-400 uppercase tracking-wider">Sec</p></div>
    </div>
  );
}

// Custom Weekly Calendar
function WeeklyCalendar({ selectedDate, onSelectDate }: { selectedDate: Date, onSelectDate: (d: Date) => void }) {
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 3 + i);
    return d;
  });

  return (
    <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-x-auto gap-2">
      {dates.map((d, i) => {
        const isSelected = d.toDateString() === selectedDate.toDateString();
        const isToday = d.toDateString() === new Date().toDateString();
        return (
          <button 
            key={i} 
            onClick={() => onSelectDate(d)}
            className={`flex flex-col items-center min-w-[3rem] p-2 rounded-xl transition-all ${
              isSelected 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110' 
                : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
              {d.toLocaleDateString('en', { weekday: 'short' })}
            </span>
            <span className="text-lg font-display font-bold mt-1">{d.getDate()}</span>
            {isToday && !isSelected && <div className="w-1 h-1 rounded-full bg-blue-500 mt-1" />}
          </button>
        );
      })}
    </div>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [aiChecklist, setAiChecklist] = useState<Record<string, string[]>>({});
  const [loadingAi, setLoadingAi] = useState<string | null>(null);

  const [form, setForm] = useState({
    doctor_name: '', specialty: '', location: '', appointment_date: '',
    appointment_time: '', duration_minutes: '30', type: 'in-person', notes: ''
  });

  useEffect(() => { loadAppointments(); }, []);

  const loadAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data.appointments || []);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.doctor_name || !form.appointment_date || !form.appointment_time) {
      return toast.error('Please fill in required fields');
    }
    try {
      if (editingId) {
        await api.put(`/appointments/${editingId}`, form);
        toast.success('Appointment updated!');
      } else {
        await api.post('/appointments', form);
        toast.success('Appointment scheduled!');
      }
      setShowModal(false);
      resetForm();
      loadAppointments();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to save'); }
  };

  const handleEdit = (appt: any) => {
    setEditingId(appt.id);
    setForm({
      doctor_name: appt.doctor_name || '', specialty: appt.specialty || '',
      location: appt.location || '', appointment_date: appt.appointment_date || '',
      appointment_time: appt.appointment_time || '', duration_minutes: String(appt.duration_minutes || 30),
      type: appt.type || 'in-person', notes: appt.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(prev => prev.filter(a => a.id !== id));
      toast.success('Appointment cancelled');
    } catch { toast.error('Failed to cancel'); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      toast.success('Status updated');
    } catch { toast.error('Failed to update'); }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ doctor_name: '', specialty: '', location: '', appointment_date: '', appointment_time: '', duration_minutes: '30', type: 'in-person', notes: '' });
  };

  const generateChecklist = async (appt: any) => {
    if (aiChecklist[appt.id]) return; // Already generated
    setLoadingAi(appt.id);
    try {
      const res = await api.post('/chat/quick-chat', {
        message: `Generate a short 3-item checklist to prepare for an upcoming medical appointment with a ${appt.specialty || 'doctor'}. Return ONLY a JSON array of strings. No markdown formatting. Example: ["Bring ID", "Fast for 12 hrs", "List medications"]`
      });
      let list = [];
      try {
        const text = res.data.response.replace(/```json/g, '').replace(/```/g, '').trim();
        list = JSON.parse(text);
      } catch (e) {
        list = ["Bring your ID and insurance card", "Bring a list of current medications", "Write down your questions"];
      }
      setAiChecklist(prev => ({ ...prev, [appt.id]: list }));
    } catch (err) {
      toast.error('Failed to generate checklist');
    } finally {
      setLoadingAi(null);
    }
  };

  const dateFiltered = appointments.filter(a => {
    const d = new Date(a.appointment_date);
    return d.toDateString() === selectedDate.toDateString();
  });
  
  const upcoming = appointments.filter(a => a.status === 'upcoming');
  const nextAppointment = upcoming.sort((a, b) => new Date(`${a.appointment_date}T${a.appointment_time}`).getTime() - new Date(`${b.appointment_date}T${b.appointment_time}`).getTime())[0];

  const filtered = filter === 'all' 
    ? appointments 
    : filter === 'upcoming' ? upcoming
    : appointments.filter(a => a.status === filter);

  if (loading) return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto">
      {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-3xl" />)}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Appointments</h1>
          <p className="section-subtitle">Manage your schedule and prepare for visits</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary py-2.5 px-5 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Schedule
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <WeeklyCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          
          {/* Day View Appointments */}
          <div className="space-y-4">
            <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-500" /> Schedule for {selectedDate.toLocaleDateString()}
            </h2>
            {dateFiltered.length === 0 ? (
              <div className="card text-center py-8">
                <p className="text-slate-500 text-sm">No appointments on this date.</p>
              </div>
            ) : (
              dateFiltered.map((appt) => (
                <div key={`day-${appt.id}`} className="card border-l-4 border-l-blue-500 hover:shadow-card transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{appt.doctor_name}</h3>
                      <p className="text-sm text-slate-500">{appt.appointment_time} · {appt.duration_minutes} min</p>
                    </div>
                    <span className={`badge ${STATUS_COLORS[appt.status] || 'badge-blue'}`}>{appt.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Next Appointment Card */}
          {nextAppointment ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl p-6 bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10">
                <Clock className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-blue-200" />
                  <h2 className="font-bold text-blue-100 uppercase tracking-wider text-xs">Next Appointment</h2>
                </div>
                <h3 className="text-2xl font-display font-bold mb-1">{nextAppointment.doctor_name}</h3>
                <p className="text-blue-200 text-sm mb-6">{nextAppointment.specialty}</p>
                
                <CountdownTimer date={nextAppointment.appointment_date} time={nextAppointment.appointment_time} />
                
                <div className="mt-6 flex gap-2">
                  <button onClick={() => generateICS(nextAppointment)} className="flex-1 bg-white/20 hover:bg-white/30 transition-colors py-2 rounded-xl text-sm font-semibold flex justify-center items-center gap-2">
                    <Download className="w-4 h-4" /> Save ICS
                  </button>
                  <button onClick={() => handleEdit(nextAppointment)} className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
             <div className="rounded-3xl p-6 bg-slate-100 dark:bg-slate-800 text-center border border-slate-200 dark:border-slate-700">
               <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
               <p className="font-medium text-slate-500 dark:text-slate-400">No upcoming appointments</p>
             </div>
          )}
        </div>
      </div>

      <hr className="border-slate-100 dark:border-slate-800" />

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'upcoming', 'completed', 'cancelled'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
              filter === f ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 card">
          <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No {filter === 'all' ? '' : filter} appointments</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((appt, i) => (
            <motion.div
              key={appt.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card hover:shadow-card transition-all duration-200 group flex flex-col"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    appt.status === 'upcoming' ? 'bg-blue-100 dark:bg-blue-950/50' :
                    appt.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    {appt.type === 'video' ? (
                      <Video className={`w-6 h-6 ${appt.status === 'upcoming' ? 'text-blue-600' : 'text-slate-400'}`} />
                    ) : (
                      <User className={`w-6 h-6 ${appt.status === 'upcoming' ? 'text-blue-600' : 'text-slate-400'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-slate-900 dark:text-white">{appt.doctor_name}</h3>
                      <span className={`badge ${STATUS_COLORS[appt.status] || 'badge-blue'}`}>{appt.status}</span>
                    </div>
                    {appt.specialty && <p className="text-slate-500 dark:text-slate-400 text-sm">{appt.specialty}</p>}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                        <CalendarIcon className="w-4 h-4 text-blue-500" />
                        {formatDate(appt.appointment_date, 'medium')}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                        <Clock className="w-4 h-4 text-blue-500" />
                        {appt.appointment_time} · {appt.duration_minutes} min
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <button onClick={() => generateICS(appt)} className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" title="Export to Calendar">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEdit(appt)} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors opacity-0 group-hover:opacity-100">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* AI Checklist Section */}
              {appt.status === 'upcoming' && (
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                  {!aiChecklist[appt.id] ? (
                    <button 
                      onClick={() => generateChecklist(appt)}
                      disabled={loadingAi === appt.id}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 text-sm font-semibold hover:bg-violet-100 transition-colors"
                    >
                      {loadingAi === appt.id ? <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /> : <Brain className="w-4 h-4" />}
                      Generate AI Prep Checklist
                    </button>
                  ) : (
                    <div className="bg-violet-50 dark:bg-violet-950/20 rounded-xl p-3 border border-violet-100 dark:border-violet-900/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        <span className="text-xs font-bold text-violet-700 dark:text-violet-400 uppercase tracking-wider">AI Prep Checklist</span>
                      </div>
                      <ul className="space-y-1 pl-6 list-disc text-sm text-slate-600 dark:text-slate-300">
                        {aiChecklist[appt.id].map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="modal-backdrop flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-lg shadow-premium border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white">
                  {editingId ? 'Edit Appointment' : 'Schedule Appointment'}
                </h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Doctor Name *</label>
                  <input value={form.doctor_name} onChange={e => setForm({ ...form, doctor_name: e.target.value })}
                    className="input-field" placeholder="Dr. Jane Smith" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Specialty</label>
                  <select value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} className="input-field">
                    <option value="">Select specialty</option>
                    {SPECIALTIES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Date *</label>
                    <input type="date" value={form.appointment_date} onChange={e => setForm({ ...form, appointment_date: e.target.value })}
                      className="input-field" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Time *</label>
                    <input type="time" value={form.appointment_time} onChange={e => setForm({ ...form, appointment_time: e.target.value })}
                      className="input-field" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Type</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input-field">
                      <option value="in-person">In-Person</option>
                      <option value="video">Video Call</option>
                      <option value="phone">Phone</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Duration</label>
                    <select value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} className="input-field">
                      <option value="15">15 min</option>
                      <option value="30">30 min</option>
                      <option value="45">45 min</option>
                      <option value="60">1 hour</option>
                      <option value="90">1.5 hours</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Location</label>
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                    className="input-field" placeholder="Hospital / Clinic / Zoom link" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="input-field resize-none" rows={2} placeholder="Reason for visit, questions to ask..." />
                </div>
              </div>

              <div className="flex justify-between items-center mt-6">
                {editingId ? (
                  <button onClick={() => handleDelete(editingId)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded-xl transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                ) : <div />}
                <div className="flex gap-3">
                  <button onClick={() => setShowModal(false)} className="btn-secondary py-2.5 px-6">Cancel</button>
                  <button onClick={handleSave} className="btn-primary py-2.5 px-8">
                    {editingId ? 'Update' : 'Schedule'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
