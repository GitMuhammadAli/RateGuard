"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, TrendingUp } from 'lucide-react';

const data = [
  { time: '00:00', requests: 2400, errors: 24 },
  { time: '04:00', requests: 1398, errors: 22 },
  { time: '08:00', requests: 9800, errors: 43 },
  { time: '12:00', requests: 3908, errors: 34 },
  { time: '16:00', requests: 4800, errors: 18 },
  { time: '20:00', requests: 3800, errors: 23 },
  { time: '24:00', requests: 4300, errors: 21 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-foreground text-background px-4 py-3 rounded-xl shadow-xl"
      >
        <p className="text-xs font-medium mb-2 opacity-70">{label}</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-background/80" />
            <span className="text-sm">
              <span className="opacity-70">Requests:</span>{' '}
              <span className="font-semibold">{payload[0]?.value?.toLocaleString()}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-sm">
              <span className="opacity-70">Errors:</span>{' '}
              <span className="font-semibold">{payload[1]?.value}</span>
            </span>
          </div>
        </div>
      </motion.div>
    );
  }
  return null;
};

export const RequestsChart: React.FC = () => {
  const totalRequests = data.reduce((acc, d) => acc + d.requests, 0);
  const avgRequests = Math.round(totalRequests / data.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6"
    >
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-accent/[0.02] rounded-full blur-3xl" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
                Traffic
              </span>
            </div>
            <h3 className="font-serif text-2xl text-foreground">Request Volume</h3>
            <p className="text-sm text-text-tertiary mt-1">Real-time API traffic over time</p>
          </div>
          
          {/* Quick Stats */}
          <div className="hidden sm:flex items-center gap-4 bg-secondary/50 rounded-xl px-4 py-2">
            <div className="text-right">
              <p className="text-xs text-text-tertiary">Avg/hour</p>
              <p className="font-serif text-lg text-foreground">{avgRequests.toLocaleString()}</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-1 text-success">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">12%</span>
            </div>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="requestsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="errorsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="0" 
                stroke="hsl(var(--border))" 
                vertical={false}
                opacity={0.5}
              />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--text-tertiary))' }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--text-tertiary))' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="requests"
                stroke="hsl(var(--foreground))"
                strokeWidth={2}
                fill="url(#requestsFill)"
              />
              <Area
                type="monotone"
                dataKey="errors"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                fill="url(#errorsFill)"
                strokeDasharray="4 4"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-foreground rounded-full" />
            <span className="text-sm text-text-secondary">Requests</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-accent rounded-full" />
            <span className="text-sm text-text-secondary">Errors</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
