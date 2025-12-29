"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Gauge, X, Zap, Settings2, ToggleLeft, ToggleRight } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Header } from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRateLimitsStore } from '@/store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function RateLimitsPage() {
  const { rateLimits, addRateLimit, deleteRateLimit, toggleRateLimit } = useRateLimitsStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRule, setNewRule] = useState({ 
    algorithm: 'Token Bucket' as const, 
    scope: 'Per Key' as const, 
    api: '', 
    description: '',
    pattern: ''
  });

  const handleAddRule = () => {
    if (!newRule.api || !newRule.description || !newRule.pattern) {
      toast.error('Please fill in all required fields');
      return;
    }
    addRateLimit({
      algorithm: newRule.algorithm,
      scope: newRule.scope,
      api: newRule.api,
      description: newRule.description,
      pattern: newRule.pattern,
      enabled: true,
    });
    setNewRule({ algorithm: 'Token Bucket', scope: 'Per Key', api: '', description: '', pattern: '' });
    setShowAddForm(false);
    toast.success('Rate limit rule created');
  };

  const handleDeleteRule = (id: number, api: string) => {
    deleteRateLimit(id);
    toast.success(`${api} rule deleted`);
  };

  const handleToggleRule = (id: number, api: string, currentState: boolean) => {
    toggleRateLimit(id);
    toast.success(`${api} rule ${currentState ? 'disabled' : 'enabled'}`);
  };

  const algorithmColors: Record<string, string> = {
    'Token Bucket': 'bg-success/10 text-success',
    'Sliding Window': 'bg-info/10 text-info',
    'Fixed Window': 'bg-warning/10 text-warning',
    'Leaky Bucket': 'bg-accent/10 text-accent',
  };

  return (
    <DashboardLayout>
      <Header 
        title="Rate Limits" 
        subtitle="Configure throttling rules to protect your upstream APIs" 
        showTimeRange={false} 
        action={
          <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Cancel' : 'Add Rule'}
          </Button>
        } 
      />
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border border-border/50 bg-gradient-to-br from-surface to-background"
          >
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-4 h-4 text-accent" />
              <span className="text-xs text-text-tertiary uppercase tracking-wide">Active Rules</span>
            </div>
            <span className="font-serif text-3xl text-foreground">
              {rateLimits.filter(r => r.enabled).length}
            </span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 rounded-2xl border border-border/50 bg-gradient-to-br from-surface to-background"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-warning" />
              <span className="text-xs text-text-tertiary uppercase tracking-wide">Total Rules</span>
            </div>
            <span className="font-serif text-3xl text-foreground">
              {rateLimits.length}
            </span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-2xl border border-border/50 bg-gradient-to-br from-surface to-background"
          >
            <div className="flex items-center gap-2 mb-2">
              <Settings2 className="w-4 h-4 text-info" />
              <span className="text-xs text-text-tertiary uppercase tracking-wide">Algorithms</span>
            </div>
            <span className="font-serif text-3xl text-foreground">
              {new Set(rateLimits.map(r => r.algorithm)).size}
            </span>
          </motion.div>
        </div>

        {/* Add Rule Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="p-6 rounded-2xl border border-border bg-gradient-to-br from-surface to-background">
                <h3 className="font-serif text-xl mb-6">Create Rate Limit Rule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label>Algorithm</Label>
                    <select
                      value={newRule.algorithm}
                      onChange={(e) => setNewRule({ ...newRule, algorithm: e.target.value as any })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="Token Bucket">Token Bucket</option>
                      <option value="Sliding Window">Sliding Window</option>
                      <option value="Fixed Window">Fixed Window</option>
                      <option value="Leaky Bucket">Leaky Bucket</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Scope</Label>
                    <select
                      value={newRule.scope}
                      onChange={(e) => setNewRule({ ...newRule, scope: e.target.value as any })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="Per Key">Per Key</option>
                      <option value="Per Workspace">Per Workspace</option>
                      <option value="Per IP">Per IP</option>
                      <option value="Global">Global</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>API</Label>
                    <Input
                      placeholder="OpenAI"
                      value={newRule.api}
                      onChange={(e) => setNewRule({ ...newRule, api: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pattern</Label>
                    <Input
                      placeholder="/v1/chat/completions"
                      value={newRule.pattern}
                      onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="100 burst, 10/sec sustained"
                      value={newRule.description}
                      onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddRule}>Create Rule</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rules List */}
        <div className="space-y-4">
          {rateLimits.map((rule, i) => (
            <motion.div 
              key={rule.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05 }}
              whileHover={{ x: 4 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-surface to-background p-6 hover:shadow-lg hover:shadow-accent/5 transition-all",
                !rule.enabled && "opacity-60"
              )}
            >
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/[0.03] rounded-full blur-2xl group-hover:bg-accent/[0.06] transition-colors" />
              
              <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    rule.enabled ? 'bg-success/10' : 'bg-secondary'
                  )}>
                    <Gauge className={cn(
                      "w-5 h-5",
                      rule.enabled ? 'text-success' : 'text-text-tertiary'
                    )} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-serif text-xl text-foreground">{rule.api}</h3>
                      <span className={cn(
                        "text-xs font-medium px-2.5 py-1 rounded-full",
                        algorithmColors[rule.algorithm] || 'bg-secondary text-text-secondary'
                      )}>
                        {rule.algorithm}
                      </span>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-text-secondary">
                        {rule.scope}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">{rule.description}</p>
                    <code className="text-xs text-text-tertiary font-mono mt-1 block">{rule.pattern}</code>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleToggleRule(rule.id, rule.api, rule.enabled)}
                    className="gap-2"
                  >
                    {rule.enabled ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-success" />
                        <span className="text-success">Enabled</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        <span>Disabled</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon-sm"
                    onClick={() => handleDeleteRule(rule.id, rule.api)}
                    className="text-text-tertiary hover:text-error"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {rateLimits.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
              <Gauge className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-text-secondary mb-2">No rate limit rules configured</p>
            <p className="text-sm text-text-tertiary">Create your first rule to protect your APIs</p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
