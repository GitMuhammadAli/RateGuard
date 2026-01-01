"use client";

import { motion } from 'framer-motion';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Clock, AlertTriangle, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Header } from '@/components/dashboard/Header';
import { useDashboardStore } from '@/store';

const latencyData = [
  { time: '00:00', p50: 45, p95: 120, p99: 180 },
  { time: '04:00', p50: 42, p95: 110, p99: 165 },
  { time: '08:00', p50: 65, p95: 180, p99: 250 },
  { time: '12:00', p50: 55, p95: 145, p99: 210 },
  { time: '16:00', p50: 70, p95: 190, p99: 280 },
  { time: '20:00', p50: 48, p95: 125, p99: 185 },
];

const errorData = [
  { status: '4xx', count: 2340, color: '#f59e0b' },
  { status: '5xx', count: 156, color: '#ef4444' },
  { status: '2xx', count: 45890, color: '#22c55e' },
];

const apiBreakdown = [
  { name: 'OpenAI', requests: 12500, latency: '125ms', errors: '0.1%' },
  { name: 'Anthropic', requests: 8200, latency: '95ms', errors: '0.05%' },
  { name: 'Cohere', requests: 3400, latency: '80ms', errors: '0.02%' },
  { name: 'Gemini', requests: 2100, latency: '110ms', errors: '0.08%' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-foreground text-background px-4 py-3 rounded-xl shadow-xl">
        <p className="text-xs font-medium mb-2 opacity-70">{label}</p>
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: item.color }} 
            />
            <span className="opacity-70">{item.name}:</span>
            <span className="font-medium">{item.value}ms</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const { timeRange, setTimeRange } = useDashboardStore();
  
  return (
    <DashboardLayout>
      <Header 
        title="Analytics" 
        subtitle="Deep dive into your API performance and usage patterns"
        selectedRange={timeRange}
        onRangeChange={setTimeRange}
      />
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Avg Response Time', value: '95ms', change: -12, icon: Clock, positive: true },
            { label: 'Success Rate', value: '99.8%', change: 0.2, icon: TrendingUp, positive: true },
            { label: 'Error Rate', value: '0.2%', change: -0.1, icon: AlertTriangle, positive: true },
            { label: 'Requests/sec', value: '1.2K', change: 15, icon: Activity, positive: true },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6"
            >
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/[0.03] rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <metric.icon className="w-4 h-4 text-text-tertiary" />
                  <span className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
                    {metric.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-3xl text-foreground">{metric.value}</span>
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${
                    metric.positive ? 'text-success' : 'text-error'
                  }`}>
                    {metric.positive ? (
                      <ArrowDownRight className="w-3 h-3" />
                    ) : (
                      <ArrowUpRight className="w-3 h-3" />
                    )}
                    {Math.abs(metric.change)}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Latency Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/[0.02] rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
                  Performance
                </span>
              </div>
              <h3 className="font-serif text-2xl text-foreground mb-6">Latency Distribution</h3>
              
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={latencyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="p50Fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="p95Fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="p99Fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="0" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--text-tertiary))' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--text-tertiary))' }} tickFormatter={(v) => `${v}ms`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="p50" name="P50" stroke="#22c55e" strokeWidth={2} fill="url(#p50Fill)" />
                    <Area type="monotone" dataKey="p95" name="P95" stroke="#f59e0b" strokeWidth={2} fill="url(#p95Fill)" />
                    <Area type="monotone" dataKey="p99" name="P99" stroke="#ef4444" strokeWidth={2} fill="url(#p99Fill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-success rounded-full" />
                  <span className="text-sm text-text-secondary">P50</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-warning rounded-full" />
                  <span className="text-sm text-text-secondary">P95</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-error rounded-full" />
                  <span className="text-sm text-text-secondary">P99</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Status Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6"
          >
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/[0.02] rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
                  Status
                </span>
              </div>
              <h3 className="font-serif text-2xl text-foreground mb-6">Response Codes</h3>
              
              <div className="h-48 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={errorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {errorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                {errorData.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-text-secondary">{item.status}</span>
                    </div>
                    <span className="font-serif text-foreground">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* API Breakdown Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6"
        >
          <div className="absolute top-0 left-0 w-64 h-64 bg-accent/[0.02] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
                Breakdown
              </span>
            </div>
            <h3 className="font-serif text-2xl text-foreground mb-6">API Performance</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left pb-4 text-xs font-medium tracking-wide uppercase text-text-tertiary">Provider</th>
                    <th className="text-right pb-4 text-xs font-medium tracking-wide uppercase text-text-tertiary">Requests</th>
                    <th className="text-right pb-4 text-xs font-medium tracking-wide uppercase text-text-tertiary hidden sm:table-cell">Latency</th>
                    <th className="text-right pb-4 text-xs font-medium tracking-wide uppercase text-text-tertiary">Error Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {apiBreakdown.map((api, i) => (
                    <motion.tr
                      key={api.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                      className="border-b border-border/30 last:border-0 hover:bg-hover/50 transition-colors"
                    >
                      <td className="py-4">
                        <span className="font-medium text-foreground">{api.name}</span>
                      </td>
                      <td className="text-right py-4">
                        <span className="font-serif text-lg text-foreground">{api.requests.toLocaleString()}</span>
                      </td>
                      <td className="text-right py-4 hidden sm:table-cell">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary/50 text-sm text-text-secondary">
                          {api.latency}
                        </span>
                      </td>
                      <td className="text-right py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-success/10 text-sm text-success">
                          {api.errors}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
