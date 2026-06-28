import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Stethoscope, Mail, Lock, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -30, 0], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.8 }}
              className="absolute rounded-full bg-white/10"
              style={{
                width: `${80 + i * 40}px`,
                height: `${80 + i * 40}px`,
                left: `${10 + i * 15}%`,
                top: `${10 + i * 12}%`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 text-center text-white">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-8 border border-white/30"
          >
            <Stethoscope className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-4xl font-display font-bold mb-4">Welcome Back</h2>
          <p className="text-blue-200 text-lg max-w-sm mx-auto leading-relaxed">
            Your health data, insights, and AI assistant are waiting for you.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 max-w-sm mx-auto">
            {[
              { label: 'AI-Powered', value: 'Assistant' },
              { label: 'Secure', value: 'Encrypted' },
              { label: 'Smart', value: 'Insights' },
              { label: '24/7', value: 'Available' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/20"
              >
                <p className="text-white font-bold text-lg">{item.value}</p>
                <p className="text-blue-200 text-sm">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-slate-900 dark:text-white">CareBot</span>
          </div>

          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">Sign in</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Log in to your secure health profile</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="input-field pl-12"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="input-field pl-12 pr-12"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Forgot password?
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center mt-6 text-slate-600 dark:text-slate-400 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Create account
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">Demo Account</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Email: demo@carebot.ai</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">Password: demo1234</p>
            <button
              type="button"
              onClick={() => setForm({ email: 'demo@carebot.ai', password: 'demo1234' })}
              className="mt-2 text-xs text-blue-700 dark:text-blue-300 font-semibold hover:underline"
            >
              Fill demo credentials →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
