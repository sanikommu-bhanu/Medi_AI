import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useThemeStore from '../../store/themeStore';

export default function AnimatedBackground() {
  const { isDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-colors duration-700 bg-slate-50 dark:bg-slate-950">
      {/* Blob 1 - Top Left */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute -top-40 -left-40 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 ${
          isDark ? 'bg-blue-900 mix-blend-screen' : 'bg-blue-300'
        }`}
      />
      
      {/* Blob 2 - Top Right */}
      <motion.div
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
        className={`absolute top-0 -right-20 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 ${
          isDark ? 'bg-indigo-900 mix-blend-screen' : 'bg-indigo-300'
        }`}
      />

      {/* Blob 3 - Bottom Left */}
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, -100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
        className={`absolute -bottom-40 left-20 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-30 ${
          isDark ? 'bg-violet-900 mix-blend-screen' : 'bg-violet-300'
        }`}
      />

      {/* Glass overlay */}
      <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/40 backdrop-blur-[100px]"></div>
    </div>
  );
}
