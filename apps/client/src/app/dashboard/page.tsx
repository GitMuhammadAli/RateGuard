'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Shield,
  User,
  Mail,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  LogOut,
  Settings,
  BarChart3,
  Key,
  Bell,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
    plan: string;
  }>;
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, workspace, clearAuth, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) {
        router.push('/sign-in');
        return;
      }

      const response = await api.auth.me();
      if (response.data) {
        setProfile(response.data as UserProfile);
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    await api.auth.logout(refreshToken || undefined);
    clearAuth();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
            <Shield className="w-6 h-6 text-background" />
          </div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const displayUser = profile || user;

  return (
    <div className="min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 grid-pattern" />
      <div className="fixed inset-0 noise" />

      {/* Header */}
      <header className="relative z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Shield className="w-5 h-5 text-background" />
              </div>
              <span className="text-xl font-bold tracking-tight">RateGuard</span>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          {/* Welcome Section */}
          <motion.div variants={fadeUp} className="mb-12">
            <h1 className="text-4xl font-bold mb-2">
              Welcome back, {displayUser?.fullName?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-lg text-muted-foreground">
              Here&apos;s an overview of your account and workspace.
            </p>
          </motion.div>

          {/* User Profile Card */}
          <motion.div variants={fadeUp}>
            <Card className="mb-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[200px] bg-primary/10 blur-[80px] pointer-events-none" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-background">
                      {displayUser?.fullName?.charAt(0) || 'U'}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Full Name</p>
                          <p className="font-medium">{displayUser?.fullName || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium">{displayUser?.email || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
                        {displayUser?.emailVerified ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-destructive" />
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Email Status</p>
                          <p className="font-medium">
                            {displayUser?.emailVerified ? 'Verified' : 'Not Verified'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Member Since</p>
                          <p className="font-medium">
                            {profile?.createdAt
                              ? new Date(profile.createdAt).toLocaleDateString()
                              : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Workspace Card */}
          <motion.div variants={fadeUp}>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Your Workspace
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(profile?.workspaces || workspace) ? (
                  <div className="p-6 rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {profile?.workspaces?.[0]?.name || workspace?.name || 'My Workspace'}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Role: {profile?.workspaces?.[0]?.role || 'owner'} • 
                          Plan: <span className="text-primary capitalize">{profile?.workspaces?.[0]?.plan || workspace?.plan || 'free'}</span>
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No workspace found.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={fadeUp}>
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: Key,
                  title: 'API Keys',
                  description: 'Manage your API keys',
                  action: 'Manage Keys',
                },
                {
                  icon: BarChart3,
                  title: 'Analytics',
                  description: 'View usage analytics',
                  action: 'View Analytics',
                },
                {
                  icon: Settings,
                  title: 'Settings',
                  description: 'Configure your account',
                  action: 'Open Settings',
                },
              ].map((item, i) => (
                <Card
                  key={i}
                  className="group cursor-pointer hover:border-primary/30 transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    <Button variant="ghost" size="sm" className="p-0 h-auto text-primary">
                      {item.action}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}


