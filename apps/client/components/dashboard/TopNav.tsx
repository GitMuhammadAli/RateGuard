"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Layers, 
  Key, 
  Gauge, 
  BarChart2, 
  DollarSign, 
  Bell, 
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  User,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { toast } from 'sonner';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'APIs', href: '/apis', icon: Layers },
  { name: 'Keys', href: '/keys', icon: Key },
  { name: 'Limits', href: '/limits', icon: Gauge },
  { name: 'Analytics', href: '/analytics', icon: BarChart2 },
  { name: 'Costs', href: '/costs', icon: DollarSign },
  { name: 'Alerts', href: '/alerts', icon: Bell },
];

export const TopNav: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname === href || pathname?.startsWith(href + '/');
  };

  const initials = user 
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : 'JD';

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <>
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border/50" />
        
        <div className="relative max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 bg-foreground rounded-lg flex items-center justify-center shadow-lg shadow-foreground/10"
              >
                <span className="text-background font-serif text-lg">R</span>
              </motion.div>
              <span className="font-serif text-xl tracking-tight hidden sm:block">RateGuard</span>
            </Link>

            {/* Center Navigation - Desktop */}
            <nav className="hidden lg:flex items-center gap-1 bg-secondary/50 rounded-xl p-1.5">
              {navigation.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="relative"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors relative",
                        active 
                          ? "text-background" 
                          : "text-text-secondary hover:text-foreground"
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId="activeNavBg"
                          className="absolute inset-0 bg-foreground rounded-lg shadow-sm"
                          transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                        />
                      )}
                      <Icon className={cn("w-4 h-4 relative z-10", active && "text-background")} />
                      <span className="relative z-10">{item.name}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Settings */}
              <Link href="/settings">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "p-2.5 rounded-xl transition-all duration-200",
                    pathname === '/settings' 
                      ? "bg-foreground text-background shadow-lg shadow-foreground/10" 
                      : "text-text-secondary hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Settings className="w-4 h-4" />
                </motion.div>
              </Link>
              
              {/* Divider */}
              <div className="h-8 w-px bg-border mx-1" />
              
              {/* User Menu */}
              <div className="relative">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-secondary transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/70 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-xs font-semibold text-white">{initials}</span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-foreground leading-none">
                      {user?.firstName || 'User'}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">Pro Plan</p>
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 text-text-tertiary transition-transform hidden sm:block",
                    showUserMenu && "rotate-180"
                  )} />
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden"
                      >
                        {/* User info header */}
                        <div className="p-4 border-b border-border bg-secondary/30">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent/70 rounded-xl flex items-center justify-center">
                              <span className="text-sm font-semibold text-white">{initials}</span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {user?.firstName} {user?.lastName}
                              </p>
                              <p className="text-xs text-text-tertiary">{user?.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Menu items */}
                        <div className="p-2">
                          <Link
                            href="/settings"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span>Profile Settings</span>
                          </Link>
                          <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>View on GitHub</span>
                          </a>
                        </div>
                        
                        <div className="p-2 border-t border-border">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-error hover:bg-error-bg rounded-lg transition-colors w-full"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign out</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2.5 rounded-xl text-text-secondary hover:text-foreground hover:bg-secondary transition-colors ml-1"
              >
                {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-16 right-0 bottom-0 w-72 bg-background border-l border-border z-50 lg:hidden overflow-y-auto"
            >
              <nav className="p-4 space-y-1">
                {navigation.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                        active 
                          ? "bg-foreground text-background" 
                          : "text-text-secondary hover:text-foreground hover:bg-secondary"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
              
              <div className="p-4 border-t border-border">
                <Link
                  href="/settings"
                  onClick={() => setShowMobileMenu(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    pathname === '/settings'
                      ? "bg-foreground text-background"
                      : "text-text-secondary hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
