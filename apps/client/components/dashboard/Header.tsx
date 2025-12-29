"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Sparkles } from 'lucide-react';
import { useDashboardStore, useAuthStore, TimeRange } from '@/store';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showTimeRange?: boolean;
  selectedRange?: TimeRange;
  onRangeChange?: (range: TimeRange) => void;
  action?: React.ReactNode;
}

const timeRanges: { value: TimeRange; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatDate = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
};

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showTimeRange = true,
  selectedRange,
  onRangeChange,
  action,
}) => {
  const { timeRange, setTimeRange } = useDashboardStore();
  const user = useAuthStore((state) => state.user);
  const currentRange = selectedRange ?? timeRange;
  
  const handleRangeChange = (range: TimeRange) => {
    if (onRangeChange) {
      onRangeChange(range);
    } else {
      setTimeRange(range);
    }
  };

  const greeting = getGreeting();
  const currentDate = formatDate();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden"
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] via-transparent to-transparent" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative border-b border-border">
        <div className="max-w-screen-2xl mx-auto px-6 py-8">
          {/* Top row - Greeting & Date */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-text-tertiary">
                <Calendar className="w-4 h-4" />
                <span>{currentDate}</span>
              </div>
              {user && (
                <>
                  <span className="text-border">•</span>
                  <span className="text-sm text-text-secondary">
                    {greeting}, <span className="text-foreground font-medium">{user.firstName}</span>
                  </span>
                </>
              )}
            </div>
            
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-text-tertiary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span>Live data</span>
            </div>
          </motion.div>

          {/* Main header row */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-serif text-4xl md:text-5xl tracking-tight text-foreground">
                  {title}
                </h1>
                {title === 'Overview' && (
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Sparkles className="w-6 h-6 text-accent" />
                  </motion.div>
                )}
              </div>
              {subtitle && (
                <p className="text-text-secondary text-lg max-w-xl">
                  {subtitle}
                </p>
              )}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3"
            >
              {showTimeRange && (
                <div className="flex items-center bg-background border border-border rounded-lg p-1 shadow-sm">
                  {timeRanges.map((range, index) => (
                    <motion.button
                      key={range.value}
                      onClick={() => handleRangeChange(range.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`
                        relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                        ${currentRange === range.value 
                          ? 'text-background' 
                          : 'text-text-secondary hover:text-foreground'
                        }
                      `}
                    >
                      {currentRange === range.value && (
                        <motion.div
                          layoutId="activeTimeRange"
                          className="absolute inset-0 bg-foreground rounded-md"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                        />
                      )}
                      <span className="relative z-10">{range.label}</span>
                    </motion.button>
                  ))}
                </div>
              )}
              {action}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
