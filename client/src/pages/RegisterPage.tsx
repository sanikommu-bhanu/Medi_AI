import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Stethoscope, Mail, Lock, User, ArrowRight, CheckCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const benefits = [
  'AI-powered health assistant',
  'Smart medication reminders',
  'Medical report analysis',
  'Appointment management',
  'Secure health records',
  'Personalized insights',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register(form.email, form.password, form.fullName);
      toast.success('Account created! Let\'s set up your profile.');
      navigate('/onboarding');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-violet-700 to-purple-800 relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 8, repeat: Infinity }}
            className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
          <motion.div animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 6, repeat: Infinity }}
            className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full" />
        </div>
        <div className="relative z-10 text-center text-white">
          <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-8 border border-white/30">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-display font-bold mb-4">Start Your Health Journey</h2>
          <p className="text-indigo-200 text-lg max-w-sm mx-auto mb-10 leading-relaxed">
            Join thousands of people taking control of their health with AI-powered assistance.
          </p>
          <div className="space-y-3 text-left max-w-xs mx-auto">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-indigo-300 flex-shrink-0" />
                <span className="text-indigo-100 text-sm">{b}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md py-8"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-slate-900 dark:text-white">CareBot</span>
          </div>

          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">Create account</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Your personalized health platform awaits</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className={`input-field pl-12 ${errors.fullName ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className={`input-field pl-12 ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className={`input-field pl-12 pr-12 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  className={`input-field pl-12 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-400' : ''}`}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
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
                <>Create Account <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </motion.button>
          </form>

          <p className="text-center mt-6 text-slate-600 dark:text-slate-400 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Sign in</Link>
          </p>

          <p className="text-center mt-4 text-xs text-slate-400">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
            CareBot is not a replacement for professional medical care.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
