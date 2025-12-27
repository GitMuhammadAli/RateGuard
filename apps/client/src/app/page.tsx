'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Shield, 
  Zap, 
  BarChart3, 
  Globe, 
  Lock, 
  Clock,
  ArrowRight,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 grid-pattern" />
      <div className="fixed inset-0 noise" />
      
      {/* Gradient Orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] animate-float" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/20 blur-[100px] animate-float" style={{ animationDelay: '-3s' }} />
      
      {/* Navigation */}
      <nav className="relative z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Shield className="w-5 h-5 text-background" />
              </div>
              <span className="text-xl font-bold tracking-tight">RateGuard</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">Get Started</Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={stagger}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Trusted by 500+ API teams worldwide</span>
            </motion.div>
            
            {/* Headline */}
            <motion.h1 
              variants={fadeUp}
              className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
            >
              Protect Your APIs with{' '}
              <span className="text-gradient animate-gradient-shift">Intelligent</span>{' '}
              Rate Limiting
            </motion.h1>
            
            {/* Subheadline */}
            <motion.p 
              variants={fadeUp}
              className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              Monitor usage, prevent abuse, and scale with confidence. 
              RateGuard provides enterprise-grade protection for your APIs in minutes.
            </motion.p>
            
            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="group">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                View Live Demo
              </Button>
            </motion.div>
          </motion.div>
          
          {/* Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-2 glow">
              <div className="rounded-xl bg-card overflow-hidden">
                {/* Mock Dashboard Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                {/* Mock Dashboard Content */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Total Requests', value: '1.23M', trend: '+12%' },
                      { label: 'Rate Limited', value: '4,521', trend: '-8%' },
                      { label: 'Avg Latency', value: '145ms', trend: '-5%' },
                      { label: 'Error Rate', value: '0.42%', trend: '-2%' },
                    ].map((stat, i) => (
                      <div key={i} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                        <p className={`text-xs mt-1 ${stat.trend.startsWith('+') ? 'text-green-400' : 'text-primary'}`}>
                          {stat.trend} vs last week
                        </p>
                      </div>
                    ))}
                  </div>
                  {/* Mock Chart Area */}
                  <div className="h-48 rounded-lg bg-muted/20 border border-border/50 flex items-center justify-center">
                    <div className="flex items-end gap-1 h-32">
                      {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.8 + i * 0.05, duration: 0.5 }}
                          className="w-6 rounded-t bg-gradient-to-t from-primary/60 to-primary"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-32 border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything you need to{' '}
              <span className="text-primary">protect your APIs</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From simple rate limiting to advanced threat detection, RateGuard has you covered.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Blazing Fast',
                description: 'Sub-millisecond rate limit decisions powered by Redis. Never slow down your API.',
              },
              {
                icon: BarChart3,
                title: 'Real-time Analytics',
                description: 'Monitor requests, track usage patterns, and identify anomalies instantly.',
              },
              {
                icon: Globe,
                title: 'Global Edge Network',
                description: 'Deploy rate limits at the edge for minimal latency worldwide.',
              },
              {
                icon: Lock,
                title: 'Enterprise Security',
                description: 'SOC 2 compliant with end-to-end encryption and SSO support.',
              },
              {
                icon: Clock,
                title: 'Flexible Windows',
                description: 'Fixed window, sliding window, and token bucket algorithms out of the box.',
              },
              {
                icon: Shield,
                title: 'Threat Detection',
                description: 'AI-powered abuse detection identifies and blocks malicious traffic.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-12 rounded-2xl border border-border bg-gradient-to-br from-card to-muted/30 relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-primary/20 blur-[100px]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to protect your APIs?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Get started in minutes with our generous free tier. No credit card required.
              </p>
              <Link href="/sign-up">
                <Button size="lg" className="group">
                  Create Free Account
                  <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Shield className="w-4 h-4 text-background" />
              </div>
              <span className="font-semibold">RateGuard</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 RateGuard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}


