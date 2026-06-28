import React from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 text-center card-glass w-full"
    >
      <div className="w-48 h-48 mb-6 relative">
        {/* Beautiful Abstract SVG Background */}
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full text-blue-100 dark:text-blue-900/30 opacity-50 animate-pulse-slow">
          <path fill="currentColor" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18,97.7,-2.1C98.6,13.8,94.4,30.1,84.7,43.3C75,56.5,59.8,66.6,44.1,74.5C28.4,82.4,12.2,88.1,-3.5,93.2C-19.2,98.3,-34.4,102.8,-48.5,96.9C-62.6,91,-75.6,74.7,-84.3,57.1C-93,39.5,-97.4,20.6,-96.2,2.3C-95,-16,-88.2,-33.6,-78,-47.9C-67.8,-62.2,-54.2,-73.2,-39.6,-79.8C-25,-86.4,-9.4,-88.6,5.6,-98.5C20.6,-108.4,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-blue-500 dark:text-blue-400">
          {icon || (
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          )}
        </div>
      </div>
      <h3 className="text-xl font-display font-semibold text-slate-800 dark:text-slate-100 mb-2">
        {title}
      </h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
