import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  full_name: string;
  onboarding_completed: number;
}

interface Profile {
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  blood_type?: string;
  height?: number;
  weight?: number;
  address?: string;
  phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  primary_physician?: string;
  allergies?: string;
  chronic_conditions?: string;
  avatar_url?: string;
  onboarding_completed?: number;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, user } = response.data;
          
          localStorage.setItem('carebot_token', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({ token, user, isLoading: false });
          
          // Fetch full profile
          const profileRes = await api.get('/profile');
          set({ profile: profileRes.data.profile });
        } catch (err: any) {
          set({ isLoading: false, error: err.response?.data?.error || 'Login failed' });
          throw err;
        }
      },

      register: async (email, password, fullName) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', { email, password, full_name: fullName });
          const { token, user } = response.data;
          
          localStorage.setItem('carebot_token', token);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          set({ token, user, isLoading: false });
          
          const profileRes = await api.get('/profile');
          set({ profile: profileRes.data.profile });
        } catch (err: any) {
          set({ isLoading: false, error: err.response?.data?.error || 'Registration failed' });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('carebot_token');
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, profile: null, token: null, error: null });
      },

      updateProfile: async (data) => {
        set({ isLoading: true });
        try {
          const response = await api.put('/profile', data);
          set({ profile: response.data.profile, isLoading: false });
          if (data.full_name) {
            set(state => ({
              user: state.user ? { ...state.user, full_name: data.full_name || state.user.full_name } : null
            }));
          }
          if (data.onboarding_completed !== undefined) {
            set(state => ({
              user: state.user ? { ...state.user, onboarding_completed: data.onboarding_completed || 0 } : null
            }));
          }
        } catch (err: any) {
          set({ isLoading: false });
          throw err;
        }
      },

      fetchProfile: async () => {
        try {
          const response = await api.get('/profile');
          set({ profile: response.data.profile });
        } catch (err) {
          console.error('Failed to fetch profile:', err);
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'carebot-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);

export default useAuthStore;
