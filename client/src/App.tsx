import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import api from './lib/api';

// Pages
import SplashScreen from './pages/SplashScreen';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import HealthPage from './pages/HealthPage';
import AppointmentsPage from './pages/AppointmentsPage';
import MedicationsPage from './pages/MedicationsPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

import AppLayout from './components/layout/AppLayout';
import AnimatedBackground from './components/layout/AnimatedBackground';
import { AnimatePresence } from 'framer-motion';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  
  if (!token) return <Navigate to="/login" replace />;
  if (user && !user.onboarding_completed) return <Navigate to="/onboarding" replace />;
  
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (token) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function App() {
  const { isDark } = useThemeStore();
  const { token } = useAuthStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const savedToken = localStorage.getItem('carebot_token');
    if (savedToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
  }, [token]);

  return (
    <BrowserRouter>
      <div className={isDark ? 'dark' : ''}>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: isDark ? '#1E293B' : '#fff',
              color: isDark ? '#F1F5F9' : '#0F172A',
              border: isDark ? '1px solid #334155' : '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            },
            success: {
              iconTheme: { primary: '#10B981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#fff' },
            },
          }}
        />
        
        <AnimatedBackground />
        
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/splash" element={<SplashScreen />} />
            <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
            <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
            <Route path="/onboarding" element={
              token ? <OnboardingPage /> : <Navigate to="/login" replace />
            } />
            
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="health" element={<HealthPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="medications" element={<MedicationsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}

export default App;
