"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, User, Bell, Shield, Palette, Globe, Save,
  Moon, Sun, Monitor, Check, ChevronRight
} from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Header } from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useSettingsStore, useAuthStore } from '@/store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const themeOptions = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

export default function SettingsPage() {
  const { user, updateProfile } = useAuthStore();
  const settings = useSettingsStore();
  const [activeSection, setActiveSection] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSaveProfile = () => {
    updateProfile({ name, email });
    toast.success('Profile updated successfully');
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <DashboardLayout>
      <Header 
        title="Settings" 
        subtitle="Manage your account preferences and configurations" 
        showTimeRange={false} 
      />
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="sticky top-24 space-y-1">
              {sections.map((section, i) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <motion.button
                    key={section.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left",
                      isActive 
                        ? "bg-foreground text-background" 
                        : "hover:bg-hover text-text-secondary hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{section.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Content */}
          <div className="lg:col-span-9">
            {activeSection === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6">
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/[0.03] rounded-full blur-2xl" />
                  <div className="relative">
                    <h3 className="font-serif text-xl text-foreground mb-6">Profile Information</h3>
                    
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-border">
                        <span className="font-serif text-2xl text-foreground">
                          {name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{name || 'User'}</p>
                        <p className="text-sm text-text-tertiary">{email || 'No email set'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveProfile} className="gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </motion.div>
            )}

            {activeSection === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6">
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/[0.03] rounded-full blur-2xl" />
                  <div className="relative">
                    <h3 className="font-serif text-xl text-foreground mb-6">Notification Preferences</h3>
                    
                    <div className="space-y-6">
                      {[
                        { 
                          key: 'emailAlerts', 
                          title: 'Email Alerts', 
                          description: 'Receive alerts via email when thresholds are triggered' 
                        },
                        { 
                          key: 'budgetWarnings', 
                          title: 'Budget Warnings', 
                          description: 'Get notified when approaching budget limits' 
                        },
                        { 
                          key: 'weeklyReports', 
                          title: 'Weekly Reports', 
                          description: 'Receive weekly usage and cost summaries' 
                        },
                        { 
                          key: 'securityAlerts', 
                          title: 'Security Alerts', 
                          description: 'Get notified about suspicious activity' 
                        },
                      ].map((item, i) => (
                        <motion.div
                          key={item.key}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start justify-between p-4 rounded-xl hover:bg-hover/50 transition-colors"
                        >
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{item.title}</p>
                            <p className="text-sm text-text-tertiary">{item.description}</p>
                          </div>
                          <Checkbox
                            checked={settings[item.key as keyof typeof settings] as boolean}
                            onCheckedChange={(checked) => {
                              settings.updateSetting(item.key as keyof typeof settings, checked);
                              toast.success(`${item.title} ${checked ? 'enabled' : 'disabled'}`);
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'appearance' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6">
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/[0.03] rounded-full blur-2xl" />
                  <div className="relative">
                    <h3 className="font-serif text-xl text-foreground mb-6">Theme</h3>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {themeOptions.map((theme) => {
                        const Icon = theme.icon;
                        const isActive = settings.theme === theme.id;
                        return (
                          <button
                            key={theme.id}
                            onClick={() => {
                              settings.updateSetting('theme', theme.id);
                              toast.success(`Theme changed to ${theme.label}`);
                            }}
                            className={cn(
                              "relative p-6 rounded-2xl border-2 transition-all text-center",
                              isActive 
                                ? "border-foreground bg-foreground/5" 
                                : "border-border hover:border-foreground/30"
                            )}
                          >
                            {isActive && (
                              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                                <Check className="w-3 h-3 text-background" />
                              </div>
                            )}
                            <Icon className={cn(
                              "w-8 h-8 mx-auto mb-3",
                              isActive ? "text-foreground" : "text-text-tertiary"
                            )} />
                            <span className={cn(
                              "font-medium",
                              isActive ? "text-foreground" : "text-text-secondary"
                            )}>
                              {theme.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6">
                  <div className="relative">
                    <h3 className="font-serif text-xl text-foreground mb-6">Display Options</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-xl hover:bg-hover/50 transition-colors">
                        <div>
                          <p className="font-medium text-foreground">Compact Mode</p>
                          <p className="text-sm text-text-tertiary">Reduce spacing and font sizes</p>
                        </div>
                        <Checkbox
                          checked={settings.compactMode}
                          onCheckedChange={(checked) => {
                            settings.updateSetting('compactMode', checked);
                            toast.success(`Compact mode ${checked ? 'enabled' : 'disabled'}`);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 'security' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6">
                  <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/[0.03] rounded-full blur-2xl" />
                  <div className="relative">
                    <h3 className="font-serif text-xl text-foreground mb-6">Password</h3>
                    
                    <div className="space-y-4 max-w-md">
                      <div className="space-y-2">
                        <Label>Current Password</Label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm New Password</Label>
                        <Input type="password" placeholder="••••••••" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6">
                  <div className="relative">
                    <h3 className="font-serif text-xl text-foreground mb-6">Two-Factor Authentication</h3>
                    
                    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">2FA is enabled</p>
                          <p className="text-sm text-text-tertiary">Your account has an extra layer of security</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                  </div>
                </div>

                <Button onClick={() => toast.success('Password updated')} className="gap-2">
                  <Save className="w-4 h-4" />
                  Update Password
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
