"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon?: LucideIcon;
  value: string;
  label: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  isLoading?: boolean;
  className?: string;
  delay?: number;
  size?: 'default' | 'large';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  icon: Icon,
  value,
  label,
  trend,
  isLoading,
  className,
  delay = 0,
  size = 'default',
}) => {
  const isPositive = trend?.direction === 'up';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  
  if (isLoading) {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl bg-surface border border-border p-6", className)}>
        <div className="space-y-3">
          <div className="w-20 h-3 bg-hover rounded-full animate-pulse" />
          <div className="w-32 h-10 bg-hover rounded-lg animate-pulse" />
          <div className="w-16 h-4 bg-hover rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6 transition-shadow hover:shadow-lg hover:shadow-accent/5",
        className
      )}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Decorative corner accent */}
      <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/[0.03] rounded-full blur-2xl group-hover:bg-accent/[0.06] transition-colors" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-secondary/50">
              <Icon className="w-4 h-4 text-text-tertiary" />
            </div>
          )}
          <span className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
            {label}
          </span>
        </div>
        
        <div className="flex items-baseline gap-3">
          <motion.span
            key={String(value)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "font-serif tracking-tight text-foreground",
              size === 'large' ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl"
            )}
          >
            {value}
          </motion.span>
        </div>
        
        {trend && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.2 }}
            className={cn(
              "inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-xs font-medium",
              isPositive 
                ? "bg-success/10 text-success" 
                : "bg-error/10 text-error"
            )}
          >
            <TrendIcon className="w-3 h-3" />
            <span>{Math.abs(trend.value)}% vs last period</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
