"use client";

import { motion } from 'framer-motion';
import { 
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Target, Calendar, Wallet } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Header } from '@/components/dashboard/Header';
import { useDashboardStore } from '@/store';

const dailyCosts = [
  { date: 'Mon', cost: 145 },
  { date: 'Tue', cost: 178 },
  { date: 'Wed', cost: 156 },
  { date: 'Thu', cost: 189 },
  { date: 'Fri', cost: 234 },
  { date: 'Sat', cost: 123 },
  { date: 'Sun', cost: 98 },
];

const providerCosts = [
  { name: 'OpenAI', cost: 456, tokens: '2.3M', color: '#10b981' },
  { name: 'Anthropic', cost: 234, tokens: '1.8M', color: 'hsl(var(--accent))' },
  { name: 'Cohere', cost: 89, tokens: '890K', color: '#f59e0b' },
  { name: 'Gemini', cost: 67, tokens: '560K', color: '#6366f1' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-foreground text-background px-4 py-3 rounded-xl shadow-xl">
        <p className="text-xs font-medium mb-1 opacity-70">{label}</p>
        <p className="font-serif text-lg">${payload[0]?.value?.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function CostsPage() {
  const { timeRange, setTimeRange, costData } = useDashboardStore();
  const totalMTD = providerCosts.reduce((acc, p) => acc + p.cost, 0);
  const budget = 1500;
  const budgetUsed = (totalMTD / budget) * 100;

  return (
    <DashboardLayout>
      <Header 
        title="Costs" 
        subtitle="Track spending across all your AI providers"
        selectedRange={timeRange}
        onRangeChange={setTimeRange}
      />
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6"
          >
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/[0.03] rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-text-tertiary" />
                <span className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
                  Month to Date
                </span>
              </div>
              <span className="font-serif text-3xl md:text-4xl text-foreground">${totalMTD.toFixed(2)}</span>
              <div className="flex items-center gap-1 mt-2 text-success text-sm">
                <TrendingDown className="w-3 h-3" />
                8% vs last month
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6"
          >
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/[0.03] rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-text-tertiary" />
                <span className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
                  Monthly Budget
                </span>
              </div>
              <span className="font-serif text-3xl md:text-4xl text-foreground">${budget}</span>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-text-tertiary mb-1">
                  <span>{budgetUsed.toFixed(0)}% used</span>
                  <span>${(budget - totalMTD).toFixed(0)} remaining</span>
                </div>
                <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(budgetUsed, 100)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      budgetUsed > 80 ? 'bg-warning' : 'bg-success'
                    }`}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6"
          >
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/[0.03] rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-text-tertiary" />
                <span className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
                  Daily Average
                </span>
              </div>
              <span className="font-serif text-3xl md:text-4xl text-foreground">
                ${(totalMTD / 28).toFixed(2)}
              </span>
              <div className="flex items-center gap-1 mt-2 text-text-tertiary text-sm">
                <TrendingUp className="w-3 h-3" />
                Steady trend
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6"
          >
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/[0.03] rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-text-tertiary" />
                <span className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
                  Projected
                </span>
              </div>
              <span className="font-serif text-3xl md:text-4xl text-foreground">
                ${((totalMTD / 28) * 30).toFixed(0)}
              </span>
              <div className="flex items-center gap-1 mt-2 text-success text-sm">
                Under budget
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Daily Spending */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/[0.02] rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
                  This Week
                </span>
              </div>
              <h3 className="font-serif text-2xl text-foreground mb-6">Daily Spending</h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyCosts} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="0" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--text-tertiary))' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--text-tertiary))' }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--hover))' }} />
                    <Bar dataKey="cost" radius={[6, 6, 0, 0]}>
                      {dailyCosts.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === dailyCosts.length - 1 || index === dailyCosts.length - 2 
                            ? 'hsl(var(--foreground))' 
                            : 'hsl(var(--foreground) / 0.3)'
                          } 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* Provider Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4 relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6"
          >
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/[0.02] rounded-full blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-accent" />
                <span className="text-xs font-medium tracking-wide uppercase text-text-tertiary">
                  By Provider
                </span>
              </div>
              <h3 className="font-serif text-2xl text-foreground mb-6">Cost Breakdown</h3>
              
              <div className="space-y-4">
                {providerCosts.map((provider, i) => (
                  <motion.div
                    key={provider.name}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: provider.color }} 
                        />
                        <span className="text-sm font-medium text-foreground">{provider.name}</span>
                      </div>
                      <span className="font-serif text-lg text-foreground">${provider.cost}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-tertiary">
                      <span>{provider.tokens} tokens</span>
                      <span>{((provider.cost / totalMTD) * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden mt-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(provider.cost / totalMTD) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.5 + i * 0.1, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: provider.color }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Savings Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-success/5 to-background border border-success/20 p-6"
        >
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingDown className="w-4 h-4 text-success" />
              </div>
              <h3 className="font-serif text-xl text-foreground">Optimization Opportunities</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <p className="text-sm font-medium text-foreground mb-1">Use caching</p>
                <p className="text-xs text-text-tertiary">Cache repetitive queries to save ~$45/month</p>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <p className="text-sm font-medium text-foreground mb-1">Optimize prompts</p>
                <p className="text-xs text-text-tertiary">Reduce token usage by shortening prompts</p>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                <p className="text-sm font-medium text-foreground mb-1">Use smaller models</p>
                <p className="text-xs text-text-tertiary">Consider GPT-4o-mini for simple tasks</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
