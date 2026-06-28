import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, User, Heart, Phone, Pill } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { BLOOD_TYPES, GENDERS } from '../lib/utils';

const steps = [
  { id: 1, title: 'Personal Info', subtitle: 'Tell us about yourself', icon: User },
  { id: 2, title: 'Health Profile', subtitle: 'Your medical background', icon: Heart },
  { id: 3, title: 'Emergency Contact', subtitle: 'Who to call in emergencies', icon: Phone },
  { id: 4, title: 'Medications', subtitle: 'Current medications (optional)', icon: Pill },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { updateProfile, user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState({
    full_name: user?.full_name || '',
    date_of_birth: '',
    gender: '',
    blood_type: '',
    height: '',
    weight: '',
    address: '',
    phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    primary_physician: '',
    allergies: '',
    chronic_conditions: '',
  });

  const update = (field: string, value: string) => setData(prev => ({ ...prev, [field]: value }));

  const handleNext = () => {
    if (currentStep < steps.length - 1) setCurrentStep(c => c + 1);
    else handleFinish();
  };

  const handleFinish = async () => {
    setIsLoading(true);
    try {
      await updateProfile({ 
        ...data, 
        height: parseFloat(data.height) || 0,
        weight: parseFloat(data.weight) || 0,
        onboarding_completed: 1 
      });
      toast.success('Profile setup complete! Welcome to CareBot 🎉');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Progress header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const done = i < currentStep;
              const active = i === currentStep;
              return (
                <div key={i} className="flex items-center">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    done ? 'bg-emerald-500' : active ? 'bg-blue-600 shadow-glow-sm' : 'bg-slate-200 dark:bg-slate-700'
                  }`}>
                    {done ? <Check className="w-5 h-5 text-white" /> : <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-0.5 w-12 sm:w-20 mx-2 transition-all duration-500 ${i < currentStep ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
            />
          </div>
        </div>

        {/* Card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-premium border border-slate-100 dark:border-slate-800 p-8"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              {steps[currentStep].title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{steps[currentStep].subtitle}</p>
          </div>

          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Full Name *</label>
                  <input value={data.full_name} onChange={e => update('full_name', e.target.value)}
                    className="input-field" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Date of Birth</label>
                  <input type="date" value={data.date_of_birth} onChange={e => update('date_of_birth', e.target.value)}
                    className="input-field" max={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Gender</label>
                  <select value={data.gender} onChange={e => update('gender', e.target.value)} className="input-field">
                    <option value="">Select gender</option>
                    {GENDERS.map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                  <input type="tel" value={data.phone} onChange={e => update('phone', e.target.value)}
                    className="input-field" placeholder="+1 (555) 000-0000" />
                </div>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Blood Type</label>
                    <select value={data.blood_type} onChange={e => update('blood_type', e.target.value)} className="input-field">
                      <option value="">Unknown</option>
                      {BLOOD_TYPES.map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Height (cm)</label>
                    <input type="number" value={data.height} onChange={e => update('height', e.target.value)}
                      className="input-field" placeholder="170" min={50} max={250} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Weight (kg)</label>
                  <input type="number" value={data.weight} onChange={e => update('weight', e.target.value)}
                    className="input-field" placeholder="70" min={20} max={300} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Primary Physician</label>
                  <input value={data.primary_physician} onChange={e => update('primary_physician', e.target.value)}
                    className="input-field" placeholder="Dr. Jane Smith" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Known Allergies</label>
                  <textarea value={data.allergies} onChange={e => update('allergies', e.target.value)}
                    className="input-field resize-none" rows={2} placeholder="e.g., Penicillin, Peanuts, Latex" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Chronic Conditions</label>
                  <textarea value={data.chronic_conditions} onChange={e => update('chronic_conditions', e.target.value)}
                    className="input-field resize-none" rows={2} placeholder="e.g., Diabetes Type 2, Hypertension" />
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900">
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                    Emergency contacts are only used to display in your profile. CareBot will never contact them automatically.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Contact Name</label>
                  <input value={data.emergency_contact_name} onChange={e => update('emergency_contact_name', e.target.value)}
                    className="input-field" placeholder="Jane Doe (Spouse)" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Contact Phone</label>
                  <input type="tel" value={data.emergency_contact_phone} onChange={e => update('emergency_contact_phone', e.target.value)}
                    className="input-field" placeholder="+1 (555) 000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Home Address</label>
                  <textarea value={data.address} onChange={e => update('address', e.target.value)}
                    className="input-field resize-none" rows={3} placeholder="123 Main St, City, State 12345" />
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    You can add detailed medications from the Medications section. This is just a quick overview.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Current Medications (optional)</label>
                  <textarea
                    className="input-field resize-none"
                    rows={5}
                    placeholder="e.g., Metformin 500mg twice daily, Lisinopril 10mg once daily..."
                  />
                </div>
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl border border-blue-100 dark:border-blue-900 text-center">
                  <div className="text-3xl mb-2">🎉</div>
                  <h3 className="font-display font-bold text-slate-900 dark:text-white mb-1">Almost done!</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Click Finish to complete your profile setup and start using CareBot.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {currentStep > 0 && (
              <button onClick={() => setCurrentStep(c => c - 1)}
                className="btn-secondary flex items-center gap-2 px-5 py-3">
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={isLoading}
              className="btn-primary flex-1 py-3 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {currentStep === steps.length - 1 ? 'Finish Setup' : 'Continue'}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>

          {currentStep < steps.length - 1 && (
            <button onClick={handleFinish} className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              Skip for now
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
