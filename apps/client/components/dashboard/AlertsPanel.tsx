"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Zap, Bell, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const alerts = [
  {
    id: 1,
    title: 'Budget threshold reached',
    description: '80% of monthly budget used',
    time: '5 min ago',
    type: 'warning',
    icon: TrendingUp,
  },
  {
    id: 2,
    title: 'Rate limit triggered',
    description: 'OpenAI endpoint hit rate limit',
    time: '12 min ago',
    type: 'error',
    icon: AlertTriangle,
  },
  {
    id: 3,
    title: 'Latency spike detected',
    description: 'P95 latency increased by 45%',
    time: '1 hour ago',
    type: 'info',
    icon: Zap,
  },
];

const typeStyles = {
  warning: {
    bg: 'bg-warning/10',
    border: 'border-l-warning',
    icon: 'text-warning',
  },
  error: {
    bg: 'bg-error/10',
    border: 'border-l-error',
    icon: 'text-error',
  },
  info: {
    bg: 'bg-info/10',
    border: 'border-l-info',
    icon: 'text-info',
  },
};

export const AlertsPanel: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6"
    >
      {/* Decorative background */}
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-error/[0.02] rounded-full blur-3xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bell className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
                Activity
              </span>
            </div>
            <h3 className="font-serif text-2xl text-foreground">Recent Alerts</h3>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-tertiary px-2 py-1 bg-secondary/50 rounded-md">Last 24h</span>
            <Link href="/alerts" className="flex items-center gap-1 text-sm text-text-tertiary hover:text-foreground transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        
        {/* Alerts list */}
        <div className="space-y-3">
          {alerts.map((alert, index) => {
            const Icon = alert.icon;
            const styles = typeStyles[alert.type as keyof typeof typeStyles];
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                whileHover={{ x: 4, transition: { duration: 0.2 } }}
                className={cn(
                  "p-4 rounded-xl border-l-2 cursor-pointer transition-all",
                  styles.bg,
                  styles.border,
                  "hover:shadow-md"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg bg-background/50",
                    styles.icon
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{alert.title}</p>
                      <span className="text-xs text-text-tertiary shrink-0">{alert.time}</span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">{alert.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        
        {alerts.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-3">
              <Bell className="w-6 h-6 text-success" />
            </div>
            <p className="text-sm text-text-secondary">No alerts in the last 24 hours</p>
            <p className="text-xs text-text-tertiary mt-1">All systems running smoothly</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
