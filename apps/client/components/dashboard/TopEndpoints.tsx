"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Route, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { useDashboardStore } from '@/store';

export const TopEndpoints: React.FC = () => {
  const endpoints = useDashboardStore((state) => state.endpoints);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6"
    >
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-accent/[0.02] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Route className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
                Endpoints
              </span>
            </div>
            <h3 className="font-serif text-2xl text-foreground">Top Performing Routes</h3>
          </div>
          
          <button className="flex items-center gap-1 text-sm text-text-tertiary hover:text-foreground transition-colors">
            View all
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left pb-4 text-xs font-medium tracking-wide uppercase text-text-tertiary">Endpoint</th>
                <th className="text-right pb-4 text-xs font-medium tracking-wide uppercase text-text-tertiary">Requests</th>
                <th className="text-right pb-4 text-xs font-medium tracking-wide uppercase text-text-tertiary hidden sm:table-cell">
                  <div className="flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3" />
                    Latency
                  </div>
                </th>
                <th className="text-right pb-4 text-xs font-medium tracking-wide uppercase text-text-tertiary hidden md:table-cell">
                  <div className="flex items-center justify-end gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Errors
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint, index) => (
                <motion.tr
                  key={endpoint.path}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.08 }}
                  className="group border-b border-border/30 last:border-0 hover:bg-hover/50 transition-colors"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                        <Route className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors" />
                      </div>
                      <div>
                        <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                        <p className="text-xs text-text-tertiary mt-0.5">{endpoint.api}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-4">
                    <span className="font-serif text-lg text-foreground">{endpoint.requests}</span>
                  </td>
                  <td className="text-right py-4 hidden sm:table-cell">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary/50 text-sm text-text-secondary">
                      {endpoint.avgLatency}
                    </span>
                  </td>
                  <td className="text-right py-4 hidden md:table-cell">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-success/10 text-sm text-success">
                      {endpoint.errorRate}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
