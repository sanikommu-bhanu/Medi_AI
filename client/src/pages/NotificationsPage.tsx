import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, Volume2, VolumeX, Filter } from 'lucide-react';
import api from '../lib/api';
import { getRelativeTime, NOTIFICATION_ICONS } from '../lib/utils';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [category, setCategory] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { 
    loadNotifications(); 
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // short pleasant ding
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch { toast.error('Failed to load notifications'); }
    finally { setLoading(false); }
  };

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      playSound();
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      playSound();
      toast.success('All notifications marked as read');
    } catch { toast.error('Failed to update'); }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch { toast.error('Failed to delete'); }
  };

  let filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;
  if (category !== 'all') {
    filtered = filtered.filter(n => n.type === category);
  }

  const categories = ['all', ...Array.from(new Set(notifications.map(n => n.type)))];

  const TYPE_BG: Record<string, string> = {
    appointment: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    medication: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    report: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    health: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    info: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  };

  if (loading) return (
    <div className="p-6 space-y-3 max-w-3xl mx-auto">
      {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Notifications</h1>
          <p className="section-subtitle">
            {unreadCount > 0 ? `You have ${unreadCount} unread messages` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSoundEnabled(!soundEnabled)} 
            className={`p-2.5 rounded-xl transition-colors ${soundEnabled ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}
            title="Toggle Notification Sound"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all">
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filters and Categories */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {(['all', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                filter === f ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}>
              {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 max-w-full overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0 mr-1" />
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                category === c ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card text-center py-20 border-dashed border-2 bg-slate-50 dark:bg-slate-800/50">
          <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="font-display font-bold text-slate-900 dark:text-white text-xl">
            {filter === 'unread' ? 'No unread messages' : 'No notifications yet'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-sm mx-auto">
            When you receive updates about your health, appointments, or medications, they will appear here.
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filtered.map((notif, i) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all group cursor-pointer ${
                  notif.is_read
                    ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:shadow-card'
                    : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50 shadow-sm'
                }`}
                onClick={() => !notif.is_read && markRead(notif.id)}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl ${TYPE_BG[notif.type] || TYPE_BG.info}`}>
                  {NOTIFICATION_ICONS[notif.type] || '🔔'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${TYPE_BG[notif.type]?.split(' ')[1] || 'text-slate-500'}`}>
                          {notif.type}
                        </span>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                      <p className={`font-semibold text-[15px] leading-snug ${notif.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {notif.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{notif.body}</p>
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-2">{getRelativeTime(notif.created_at)}</p>
                    </div>
                    
                    <button
                      onClick={e => { e.stopPropagation(); deleteNotification(notif.id); }}
                      className="p-2 flex-shrink-0 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
