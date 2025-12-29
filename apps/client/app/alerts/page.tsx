"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Bell, X, AlertTriangle, CheckCircle, XCircle, Zap, Clock, Filter } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Header } from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAlertsStore } from '@/store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type AlertStatus = 'all' | 'triggered' | 'resolved' | 'active';

export default function AlertsPage() {
  const { alerts, addAlert, deleteAlert, resolveAlert } = useAlertsStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<AlertStatus>('all');
  const [newAlert, setNewAlert] = useState({ name: '', condition: '', threshold: '' });

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(a => a.status === filter);

  const handleAddAlert = () => {
    if (!newAlert.name || !newAlert.condition || !newAlert.threshold) {
      toast.error('Please fill in all fields');
      return;
    }
    addAlert({
      name: newAlert.name,
      condition: newAlert.condition,
      threshold: newAlert.threshold,
      status: 'active',
      lastTriggered: null,
    });
    setNewAlert({ name: '', condition: '', threshold: '' });
    setShowAddForm(false);
    toast.success('Alert rule created');
  };

  const handleResolve = (id: number, name: string) => {
    resolveAlert(id);
    toast.success(`${name} marked as resolved`);
  };

  const handleDelete = (id: number, name: string) => {
    deleteAlert(id);
    toast.success(`${name} deleted`);
  };

  const statusConfig = {
    triggered: { icon: AlertTriangle, bg: 'bg-error/10', text: 'text-error', border: 'border-l-error' },
    resolved: { icon: CheckCircle, bg: 'bg-success/10', text: 'text-success', border: 'border-l-success' },
    active: { icon: Bell, bg: 'bg-info/10', text: 'text-info', border: 'border-l-info' },
  };

  return (
    <DashboardLayout>
      <Header 
        title="Alerts" 
        subtitle="Configure notifications for anomalies and threshold breaches" 
        showTimeRange={false} 
        action={
          <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Cancel' : 'Create Alert'}
          </Button>
        } 
      />
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border border-error/20 bg-gradient-to-br from-error/5 to-background"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-error" />
              <span className="text-xs text-text-tertiary uppercase tracking-wide">Triggered</span>
            </div>
            <span className="font-serif text-3xl text-foreground">
              {alerts.filter(a => a.status === 'triggered').length}
            </span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="p-4 rounded-2xl border border-info/20 bg-gradient-to-br from-info/5 to-background"
          >
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-info" />
              <span className="text-xs text-text-tertiary uppercase tracking-wide">Active Rules</span>
            </div>
            <span className="font-serif text-3xl text-foreground">
              {alerts.filter(a => a.status === 'active').length}
            </span>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-2xl border border-success/20 bg-gradient-to-br from-success/5 to-background"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-xs text-text-tertiary uppercase tracking-wide">Resolved</span>
            </div>
            <span className="font-serif text-3xl text-foreground">
              {alerts.filter(a => a.status === 'resolved').length}
            </span>
          </motion.div>
        </div>

        {/* Filter Tabs */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-6"
        >
          <Filter className="w-4 h-4 text-text-tertiary" />
          {(['all', 'triggered', 'active', 'resolved'] as AlertStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                filter === status 
                  ? "bg-foreground text-background" 
                  : "text-text-secondary hover:bg-secondary"
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Add Alert Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="p-6 rounded-2xl border border-border bg-gradient-to-br from-surface to-background">
                <h3 className="font-serif text-xl mb-6">Create Alert Rule</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label>Alert Name</Label>
                    <Input
                      placeholder="High Error Rate"
                      value={newAlert.name}
                      onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Condition</Label>
                    <Input
                      placeholder="Error rate"
                      value={newAlert.condition}
                      onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Threshold</Label>
                    <Input
                      placeholder="> 5%"
                      value={newAlert.threshold}
                      onChange={(e) => setNewAlert({ ...newAlert, threshold: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddAlert}>Create Alert</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.map((alert, i) => {
            const config = statusConfig[alert.status as keyof typeof statusConfig];
            const StatusIcon = config?.icon || Bell;
            
            return (
              <motion.div 
                key={alert.id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }}
                whileHover={{ x: 4 }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border-l-4 bg-gradient-to-br from-surface to-background p-6 hover:shadow-lg hover:shadow-accent/5 transition-all border border-border/50",
                  config?.border
                )}
              >
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/[0.03] rounded-full blur-2xl group-hover:bg-accent/[0.06] transition-colors" />
                
                <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", config?.bg)}>
                      <StatusIcon className={cn("w-5 h-5", config?.text)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-serif text-xl text-foreground">{alert.name}</h3>
                        <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", config?.bg, config?.text)}>
                          {alert.status}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">
                        <span className="font-medium">{alert.condition}</span> {alert.threshold}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {alert.lastTriggered && (
                      <div className="flex items-center gap-2 text-sm text-text-tertiary">
                        <Clock className="w-4 h-4" />
                        Last: {alert.lastTriggered}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {alert.status === 'triggered' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResolve(alert.id, alert.name)}
                          className="gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Resolve
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon-sm"
                        onClick={() => handleDelete(alert.id, alert.name)}
                        className="text-text-tertiary hover:text-error"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredAlerts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-text-secondary mb-2">
              {filter === 'all' ? 'No alerts configured' : `No ${filter} alerts`}
            </p>
            <p className="text-sm text-text-tertiary">
              {filter === 'all' ? 'Create your first alert rule to get started' : 'Try a different filter'}
            </p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
