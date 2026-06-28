import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Stethoscope, Brain, Shield, Activity, Calendar, Pill,
  FileText, Bell, ArrowRight, Star, CheckCircle, Zap,
  Heart, ChevronRight, Menu, X
} from 'lucide-react';
import { useState } from 'react';

const features = [
  { icon: Brain, title: 'AI Health Assistant', desc: 'Chat with our intelligent AI that understands your health history and provides personalized guidance.', color: 'from-violet-500 to-purple-600' },
  { icon: Activity, title: 'Health Analytics', desc: 'Track vitals, trends, and get real-time insights into your health patterns.', color: 'from-blue-500 to-cyan-600' },
  { icon: Calendar, title: 'Smart Scheduling', desc: 'Book and manage appointments with your healthcare providers seamlessly.', color: 'from-emerald-500 to-teal-600' },
  { icon: FileText, title: 'Report Analysis', desc: 'Upload medical reports and get AI-powered analysis with key insights.', color: 'from-amber-500 to-orange-600' },
  { icon: Pill, title: 'Medication Tracker', desc: 'Never miss a dose with smart medication reminders and tracking.', color: 'from-rose-500 to-pink-600' },
  { icon: Shield, title: 'Secure & Private', desc: 'Your health data is encrypted and stored securely on your device.', color: 'from-indigo-500 to-blue-600' },
];

const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '50K+', label: 'Reports Analyzed' },
  { value: '24/7', label: 'AI Support' },
];

const testimonials = [
  { name: 'Sarah M.', role: 'Patient', text: "CareBot helped me understand my lab results and prepare questions for my doctor. It's like having a medical expert on call!", rating: 5 },
  { name: 'Dr. James R.', role: 'Cardiologist', text: "I recommend CareBot to my patients. It keeps them engaged with their health between appointments and helps them track their progress.", rating: 5 },
  { name: 'Emily K.', role: 'Chronic Care Patient', text: "Managing my diabetes is so much easier now. CareBot tracks my glucose levels and reminds me about medications. Life-changing!", rating: 5 },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-slate-900 dark:text-white">CareBot</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              {['Features', 'About', 'Privacy'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium text-sm transition-colors">
                  {item}
                </a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => navigate('/login')} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium text-sm transition-colors px-4 py-2">
                Sign In
              </button>
              <button onClick={() => navigate('/register')} className="btn-primary py-2.5 px-5 text-sm">
                Get Started Free
              </button>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6 text-slate-700 dark:text-white" /> : <Menu className="w-6 h-6 text-slate-700 dark:text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-4 space-y-3"
          >
            {['Features', 'About', 'Privacy'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="block text-slate-600 dark:text-slate-400 font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
                {item}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => navigate('/login')} className="flex-1 btn-secondary py-2.5 text-sm">Sign In</button>
              <button onClick={() => navigate('/register')} className="flex-1 btn-primary py-2.5 text-sm">Get Started</button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40 dark:from-slate-950 dark:via-blue-950/20 dark:to-indigo-950/20" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-radial from-blue-400/10 via-indigo-400/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-radial from-cyan-400/10 via-transparent to-transparent rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-full px-4 py-2 mb-8"
            >
              <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">AI-Powered Health Platform</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-slate-900 dark:text-white leading-tight mb-6"
            >
              Meet Your Proactive{' '}
              <span className="gradient-text-blue">Health Partner</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Welcome to symptom check, remote care, high-hopes. Your Virtual Healthcare Assistant, all in wellness, just a message away.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => navigate('/register')}
                className="btn-primary text-base px-8 py-4 flex items-center justify-center gap-2 group"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn-secondary text-base px-8 py-4"
              >
                Sign In
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-6 mt-10 text-sm text-slate-500 dark:text-slate-400"
            >
              {['Free to use', 'No credit card', 'Privacy first'].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero Image / Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 relative max-w-5xl mx-auto"
          >
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-4 shadow-2xl border border-slate-700">
              <div className="flex items-center gap-2 mb-4 px-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <div className="flex-1 bg-slate-700 rounded-full h-6 mx-4" />
              </div>
              <div className="bg-slate-800 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Dashboard preview cards */}
                {[
                  { title: 'Heart Rate', value: '72 BPM', change: '+2%', icon: Heart, color: 'text-rose-400' },
                  { title: 'Blood Pressure', value: '120/80', change: 'Normal', icon: Activity, color: 'text-blue-400' },
                  { title: 'Next Appointment', value: 'Dr. Smith', change: 'Tomorrow', icon: Calendar, color: 'text-emerald-400' },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="bg-slate-700/50 rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <card.icon className={cn("w-5 h-5", card.color)} />
                      <span className="text-slate-400 text-xs">{card.title}</span>
                    </div>
                    <p className="text-white font-bold text-xl">{card.value}</p>
                    <p className="text-slate-400 text-xs mt-1">{card.change}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-4xl font-display font-bold text-white mb-1">{stat.value}</p>
                <p className="text-blue-200">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-4">
              Everything you need for better health
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Powerful features designed to help you take control of your health journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                  className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 hover:shadow-card transition-all duration-300 cursor-pointer group"
                >
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-4">Loved by patients & doctors</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-card"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-display font-bold text-white mb-4">Start your health journey today</h2>
            <p className="text-blue-200 text-xl mb-8">Join thousands of users taking control of their health with CareBot.</p>
            <button
              onClick={() => navigate('/register')}
              className="bg-white text-blue-600 font-bold px-10 py-4 rounded-2xl hover:bg-blue-50 transition-all hover:-translate-y-1 shadow-xl inline-flex items-center gap-2 group"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-white">CareBot</span>
            </div>
            <p className="text-slate-500 text-sm">© 2024 CareBot. All rights reserved. Not a replacement for professional medical advice.</p>
            <div className="flex gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
