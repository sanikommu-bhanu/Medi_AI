import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, MessageCircle, Heart, Calendar, Pill,
  FileText, Bell, Settings, User, Menu, X, ChevronRight,
  LogOut, Moon, Sun, Stethoscope
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import { cn, getInitials } from '../../lib/utils';
import api from '../../lib/api';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'AI Assistant', icon: MessageCircle },
  { path: '/health', label: 'Health', icon: Heart },
  { path: '/appointments', label: 'Appointments', icon: Calendar },
  { path: '/medications', label: 'Medications', icon: Pill },
  { path: '/reports', label: 'Reports', icon: FileText },
  { path: '/notifications', label: 'Notifications', icon: Bell },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    api.get('/notifications?unread=true').then(res => {
      setUnreadCount(res.data.unreadCount || 0);
    }).catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Sidebar Overlay (mobile) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={cn(
          "fixed left-0 top-0 bottom-0 w-72 z-50 lg:relative lg:translate-x-0 lg:z-auto",
          "flex flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800",
          "shadow-premium lg:shadow-none"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-glow-sm">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-slate-900 dark:text-white">CareBot</h1>
              <p className="text-xs text-slate-400">AI Health Platform</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <motion.button
                key={item.path}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative",
                  active
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-glow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon className={cn("w-5 h-5 flex-shrink-0", active ? "text-white" : "group-hover:text-blue-600 dark:group-hover:text-blue-400")} />
                <span className="font-medium text-sm">{item.label}</span>
                {item.path === '/notifications' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {active && <ChevronRight className="ml-auto w-4 h-4 text-white/60" />}
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            onClick={() => { navigate('/settings'); setSidebarOpen(false); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200",
              isActive('/settings')
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">Settings</span>
          </button>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="font-medium text-sm">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* User card */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            onClick={() => { navigate('/profile'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {profile?.full_name ? getInitials(profile.full_name) : user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                {profile?.full_name || user?.email}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <LogOut
              className="w-4 h-4 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
              onClick={(e) => { e.stopPropagation(); handleLogout(); }}
            />
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-slate-900 dark:text-white">CareBot</span>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Nav (mobile) - Morphing Pill */}
        <nav className="lg:hidden flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 px-2 py-2 flex-shrink-0 pb-safe">
          {[...navItems.slice(0, 4), { path: '/settings', label: 'Settings', icon: Settings }].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex-1 relative flex flex-col items-center justify-center py-2 min-h-[56px] tap-highlight-transparent"
              >
                {active && (
                  <motion.div
                    layoutId="mobileNavPill"
                    className="absolute inset-0 bg-blue-50 dark:bg-blue-900/30 rounded-2xl"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={cn(
                  "relative z-10 flex flex-col items-center gap-1 transition-colors duration-200",
                  active ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                )}>
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
