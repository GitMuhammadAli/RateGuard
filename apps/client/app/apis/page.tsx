"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ExternalLink, Trash2, Pause, Play, Layers, Search, X } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Header } from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApisStore } from '@/store';
import { toast } from 'sonner';

export default function ApisPage() {
  const { apis, addApi, deleteApi, toggleApiStatus } = useApisStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newApi, setNewApi] = useState({ name: '', slug: '', baseUrl: '' });

  const filteredApis = apis.filter(api => 
    api.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    api.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddApi = () => {
    if (!newApi.name || !newApi.slug || !newApi.baseUrl) {
      toast.error('Please fill in all fields');
      return;
    }
    addApi({
      name: newApi.name,
      slug: newApi.slug,
      baseUrl: newApi.baseUrl,
      status: 'active',
      rules: 0,
    });
    setNewApi({ name: '', slug: '', baseUrl: '' });
    setShowAddForm(false);
    toast.success('API added successfully');
  };

  const handleDeleteApi = (id: number, name: string) => {
    deleteApi(id);
    toast.success(`${name} deleted successfully`);
  };

  const handleToggleStatus = (id: number, name: string) => {
    toggleApiStatus(id);
    const api = apis.find(a => a.id === id);
    toast.success(`${name} ${api?.status === 'active' ? 'paused' : 'activated'}`);
  };

  return (
    <DashboardLayout>
      <Header 
        title="APIs" 
        subtitle="Manage your upstream API configurations and integrations" 
        showTimeRange={false} 
        action={
          <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showAddForm ? 'Cancel' : 'Add API'}
          </Button>
        } 
      />
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <Input
              placeholder="Search APIs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </motion.div>

        {/* Add API Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="p-6 rounded-2xl border border-border bg-gradient-to-br from-surface to-background">
                <h3 className="font-serif text-xl mb-6">Add New API</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="OpenAI"
                      value={newApi.name}
                      onChange={(e) => setNewApi({ ...newApi, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input
                      placeholder="openai"
                      value={newApi.slug}
                      onChange={(e) => setNewApi({ ...newApi, slug: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base URL</Label>
                    <Input
                      placeholder="https://api.openai.com"
                      value={newApi.baseUrl}
                      onChange={(e) => setNewApi({ ...newApi, baseUrl: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddApi}>Add API</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* API Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredApis.map((api, i) => (
            <motion.div 
              key={api.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-surface to-background p-6 hover:shadow-lg hover:shadow-accent/5 transition-all"
            >
              {/* Decorative corner */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/[0.03] rounded-full blur-2xl group-hover:bg-accent/[0.06] transition-colors" />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                      <Layers className="w-5 h-5 text-text-tertiary group-hover:text-accent transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl text-foreground">{api.name}</h3>
                      <code className="text-xs text-text-tertiary">{api.slug}</code>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    api.status === 'active' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-secondary text-text-secondary'
                  }`}>
                    {api.status}
                  </span>
                </div>

                <a 
                  href={api.baseUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors mb-4"
                >
                  {api.baseUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <span className="text-sm text-text-tertiary">{api.rules} rules configured</span>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon-sm"
                      onClick={() => handleToggleStatus(api.id, api.name)}
                    >
                      {api.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon-sm"
                      onClick={() => handleDeleteApi(api.id, api.name)}
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

        {filteredApis.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary/50 flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-text-secondary mb-2">
              {searchQuery ? 'No APIs match your search' : 'No APIs configured yet'}
            </p>
            <p className="text-sm text-text-tertiary">
              {searchQuery ? 'Try a different search term' : 'Add your first API to get started'}
            </p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
