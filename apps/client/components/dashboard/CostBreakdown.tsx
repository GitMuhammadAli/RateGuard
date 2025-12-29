"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp } from 'lucide-react';
import { useDashboardStore } from '@/store';

export const CostBreakdown: React.FC = () => {
  const costData = useDashboardStore((state) => state.costData);
  const totalCost = costData.reduce((acc, item) => acc + item.cost, 0);

  const colors = [
    'bg-foreground',
    'bg-accent',
    'bg-success',
    'bg-info',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6"
    >
      {/* Decorative background */}
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/[0.02] rounded-full blur-3xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
                Spending
              </span>
            </div>
            <h3 className="font-serif text-2xl text-foreground">Cost by Provider</h3>
          </div>
          
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
            <TrendingUp className="w-3 h-3" />
            On track
          </div>
        </div>
        
        {/* Progress bars */}
        <div className="space-y-5">
          {costData.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${colors[index % colors.length]}`} />
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-text-tertiary">{item.percentage}%</span>
                  <span className="font-serif text-lg text-foreground">
                    ${item.cost.toFixed(0)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.5 + index * 0.1, ease: "easeOut" }}
                  className={`h-full rounded-full ${colors[index % colors.length]}`}
                />
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Total */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 pt-6 border-t border-border/50"
        >
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
                Total MTD
              </span>
              <p className="text-sm text-text-secondary mt-1">Month-to-date spending</p>
            </div>
            <div className="text-right">
              <span className="font-serif text-3xl text-foreground">${totalCost.toFixed(2)}</span>
              <p className="text-xs text-success mt-1">Under budget</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
