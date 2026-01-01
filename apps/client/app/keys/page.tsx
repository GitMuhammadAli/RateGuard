"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Copy, Trash2, Key, X, Shield, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Header } from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApiKeysStore } from '@/store';
import { toast } from 'sonner';

export default function ApiKeysPage() {
  const { apiKeys, createKey, revokeKey, deleteKey } = useApiKeysStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }
    const key = createKey(newKeyName);
    setNewlyCreatedKey(key.fullKey || null);
    setNewKeyName('');
    toast.success('API key created successfully!');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleRevokeKey = (id: number, name: string) => {
    revokeKey(id);
    toast.success(`${name} has been revoked`);
  };

  const handleDeleteKey = (id: number, name: string) => {
    deleteKey(id);
    toast.success(`${name} has been deleted`);
  };

  return (
    <DashboardLayout>
      <Header 
        title="API Keys" 
        subtitle="Manage authentication keys for accessing RateGuard" 
        showTimeRange={false} 
        action={
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
            {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreateForm ? 'Cancel' : 'Create Key'}
          </Button>
        } 
      />
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Code Example */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-foreground text-background p-6 mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-foreground to-foreground/90" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-background/60" />
              <span className="text-xs font-medium text-background/60 uppercase tracking-wide">Quick Start</span>
            </div>
            <code className="block text-sm font-mono overflow-x-auto">
              <span className="text-background/60">curl -X POST</span>{' '}
              <span className="text-accent">&quot;https://proxy.rateguard.io/v1/chat/completions&quot;</span>{' '}
              <span className="text-background/60">\</span>
              <br />
              <span className="text-background/60">  -H</span>{' '}
              <span className="text-success">&quot;X-RateGuard-Key: rg_live_xxxxx&quot;</span>
            </code>
          </div>
        </motion.div>

        {/* Create Key Form */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="p-6 rounded-2xl border border-border bg-gradient-to-br from-surface to-background">
                <h3 className="font-serif text-xl mb-6">Create New API Key</h3>
                <div className="max-w-md space-y-4">
                  <div className="space-y-2">
                    <Label>Key Name</Label>
                    <Input
                      placeholder="Production Key"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                  <Button onClick={handleCreateKey}>Create Key</Button>
                </div>

                {/* Show newly created key */}
                <AnimatePresence>
                  {newlyCreatedKey && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-6 p-4 rounded-xl bg-warning/10 border border-warning/20"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-warning">
                            Copy your API key now
                          </p>
                          <p className="text-xs text-warning/80 mt-1">
                            You won&apos;t be able to see it again after closing this dialog.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-3 bg-background rounded-lg text-sm font-mono break-all border border-border">
                          {newlyCreatedKey}
                        </code>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCopy(newlyCreatedKey)}
                          className="shrink-0"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keys List */}
        <div className="space-y-4">
          {apiKeys.map((key, i) => (
            <motion.div 
              key={key.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05 }}
              whileHover={{ x: 4 }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-surface to-background p-6 hover:shadow-lg hover:shadow-accent/5 transition-all"
            >
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/[0.03] rounded-full blur-2xl group-hover:bg-accent/[0.06] transition-colors" />
              
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    key.status === 'active' 
                      ? 'bg-success/10' 
                      : 'bg-error/10'
                  }`}>
                    <Key className={`w-5 h-5 ${
                      key.status === 'active' ? 'text-success' : 'text-error'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-serif text-xl text-foreground">{key.name}</h3>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        key.status === 'active' 
                          ? 'bg-success/10 text-success' 
                          : 'bg-error/10 text-error'
                      }`}>
                        {key.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <code className="text-sm text-text-secondary font-mono">{key.prefix}</code>
                      <button 
                        onClick={() => handleCopy(key.prefix)} 
                        className="text-text-tertiary hover:text-foreground transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-text-tertiary">Last used</p>
                    <p className="text-sm text-text-secondary">{key.lastUsed}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {key.status === 'active' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRevokeKey(key.id, key.name)}
                        className="text-text-secondary hover:text-warning"
                      >
                        Revoke
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon-sm"
                      onClick={() => handleDeleteKey(key.id, key.name)}
                      className="text-text-tertiary hover:text-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {apiKeys.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
              <Key className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-text-secondary mb-2">No API keys yet</p>
            <p className="text-sm text-text-tertiary">Create your first key to start authenticating requests</p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
