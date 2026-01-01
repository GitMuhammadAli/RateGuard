"use client";

import React from 'react';
import { TopNav } from '@/components/dashboard/TopNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
};

