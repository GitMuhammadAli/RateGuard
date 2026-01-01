"use client";

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Header } from '@/components/dashboard/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { RequestsChart } from '@/components/dashboard/RequestsChart';
import { CostBreakdown } from '@/components/dashboard/CostBreakdown';
import { TopEndpoints } from '@/components/dashboard/TopEndpoints';
import { AlertsPanel } from '@/components/dashboard/AlertsPanel';
import { useDashboardStore } from '@/store';
import { Activity, DollarSign, AlertTriangle, Clock } from 'lucide-react';

export default function Dashboard() {
  const { timeRange, setTimeRange, stats } = useDashboardStore();

  return (
    <DashboardLayout>
      <Header
        title="Overview"
        subtitle="Monitor your API usage and performance metrics in real-time"
        selectedRange={timeRange}
        onRangeChange={setTimeRange}
      />
      
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={Activity}
            value={stats.totalRequests}
            label="Total Requests"
            trend={{ value: 12, direction: 'up' }}
            delay={0}
          />
          <StatsCard
            icon={DollarSign}
            value={stats.mtdCost}
            label="MTD Cost"
            trend={{ value: 8, direction: 'up' }}
            delay={0.1}
          />
          <StatsCard
            icon={AlertTriangle}
            value={stats.errorRate}
            label="Error Rate"
            trend={{ value: 2.1, direction: 'down' }}
            delay={0.2}
          />
          <StatsCard
            icon={Clock}
            value={stats.avgLatency}
            label="Avg Latency"
            delay={0.3}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-8">
            <RequestsChart />
          </div>
          <div className="lg:col-span-4">
            <CostBreakdown />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <TopEndpoints />
          </div>
          <div className="lg:col-span-4">
            <AlertsPanel />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
