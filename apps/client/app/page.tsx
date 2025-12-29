"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Zap, 
  BarChart3, 
  DollarSign, 
  ArrowRight, 
  Lock,
  Globe,
  Cpu,
  Check,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } }
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="min-h-screen border-b border-border relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-accent/[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/[0.02] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="max-w-screen-2xl mx-auto px-6 relative">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center">
                <span className="text-background font-serif text-xl">R</span>
              </div>
              <span className="font-serif text-xl tracking-tight hidden sm:block">RateGuard</span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-6"
            >
              <nav className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-sm text-text-secondary hover:text-foreground transition-colors">Features</a>
                <a href="#pricing" className="text-sm text-text-secondary hover:text-foreground transition-colors">Pricing</a>
              </nav>
              <Link href="/login" className="text-sm text-text-secondary hover:text-foreground transition-colors">
                Sign in
              </Link>
              <Link href="/signup">
                <Button size="sm" className="gap-2">
                  Get Started
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Main Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-12 lg:pt-24 pb-20">
            {/* Left Column - Side Navigation */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-2 hidden lg:block"
            >
              <nav className="sticky top-24 space-y-4">
                <p className="text-xs uppercase tracking-widest text-text-tertiary mb-6">Navigate</p>
                <a href="#features" className="block text-sm text-text-secondary hover:text-foreground transition-colors py-1">Features</a>
                <a href="#pricing" className="block text-sm text-text-secondary hover:text-foreground transition-colors py-1">Pricing</a>
                <Link href="/dashboard" className="block text-sm text-text-secondary hover:text-foreground transition-colors py-1">Dashboard</Link>
                <Link href="/login" className="block text-sm text-text-secondary hover:text-foreground transition-colors py-1">Sign In</Link>
              </nav>
            </motion.div>

            {/* Center - Main Content */}
            <motion.div 
              className="lg:col-span-7"
              initial="initial"
              animate="animate"
              variants={stagger}
            >
              <motion.div variants={fadeInUp} className="mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-widest text-accent bg-accent/5 border border-accent/20 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  API Rate Limiting & Monitoring
                </span>
              </motion.div>
              
              <motion.h1 
                variants={fadeInUp}
                className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] tracking-tight leading-[0.95] mb-8"
              >
                Protect your APIs.
                <br />
                <span className="text-text-secondary italic">Control your costs.</span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-lg md:text-xl text-text-secondary max-w-xl mb-12 leading-relaxed"
              >
                Intelligent rate limiting that scales with your business. Set flexible limits, monitor usage in real-time, and prevent abuse before it impacts your bottom line.
              </motion.p>

              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-start gap-4"
              >
                <Link href="/signup">
                  <Button size="lg" className="h-14 px-10 text-base gap-2">
                    Start for free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base">
                    View demo
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Column - Stats */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="lg:col-span-3 flex flex-col justify-end"
            >
              <div className="border-l border-border pl-6 space-y-8">
                {[
                  { value: "2B+", label: "Requests protected" },
                  { value: "2,000+", label: "Companies" },
                  { value: "99.99%", label: "Uptime SLA" },
                  { value: "<10ms", label: "Latency" },
                ].map((stat, i) => (
                  <motion.div 
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                  >
                    <p className="font-serif text-3xl tracking-tight mb-1">{stat.value}</p>
                    <p className="text-xs text-text-tertiary uppercase tracking-wider">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Mobile Navigation */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="lg:hidden flex items-center justify-center gap-8 py-6 border-t border-border"
          >
            <a href="#features" className="text-sm text-text-secondary hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-text-secondary hover:text-foreground transition-colors">Pricing</a>
            <Link href="/dashboard" className="text-sm text-text-secondary hover:text-foreground transition-colors">Dashboard</Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-b border-border relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-accent/[0.02] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        
        <div className="max-w-screen-2xl mx-auto px-6 py-24 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest text-accent bg-accent/5 rounded-full mb-6">
                <Zap className="w-3 h-3" />
                Features
              </div>
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight mb-6">
                Everything you need to protect your APIs
              </h2>
              <p className="text-text-secondary leading-relaxed">
                From rate limiting to cost tracking, we provide a complete solution for API management and protection.
              </p>
            </motion.div>
            
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: Zap, title: "Intelligent Rate Limiting", desc: "Set flexible limits per endpoint, user, or API key with sliding window algorithms." },
                  { icon: BarChart3, title: "Real-time Analytics", desc: "Monitor request volumes, response times, and error rates across all your APIs." },
                  { icon: DollarSign, title: "Cost Management", desc: "Track spending by API, set budgets, and get alerts before you exceed limits." },
                  { icon: Lock, title: "Abuse Protection", desc: "Automatically detect and block malicious traffic patterns and DDoS attempts." },
                  { icon: Globe, title: "Global Edge Network", desc: "Distributed enforcement at edge locations for minimal latency overhead." },
                  { icon: Cpu, title: "Easy Integration", desc: "Drop-in SDKs for all major languages and frameworks. Ready in minutes." },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ y: -4 }}
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-background border border-border/50 p-6 hover:shadow-lg hover:shadow-accent/5 transition-all"
                  >
                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/[0.03] rounded-full blur-2xl group-hover:bg-accent/[0.06] transition-colors" />
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center mb-4 group-hover:bg-accent/10 transition-colors">
                        <feature.icon className="w-5 h-5 text-text-tertiary group-hover:text-accent transition-colors" />
                      </div>
                      <h3 className="font-serif text-lg mb-2 text-foreground">{feature.title}</h3>
                      <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-b border-border relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/[0.02] rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        
        <div className="max-w-screen-2xl mx-auto px-6 py-24 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs uppercase tracking-widest text-accent bg-accent/5 rounded-full mb-6">
              <DollarSign className="w-3 h-3" />
              Pricing
            </div>
            <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight mb-6">
              Simple, transparent pricing
            </h2>
            <p className="text-text-secondary leading-relaxed">
              Start free, scale as you grow. No hidden fees, no surprises.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { 
                name: "Starter", 
                price: "Free", 
                desc: "For side projects and testing",
                features: ["10K requests/month", "1 API key", "Basic analytics", "Community support"],
              },
              { 
                name: "Pro", 
                price: "$49", 
                period: "/month",
                desc: "For growing teams",
                features: ["1M requests/month", "Unlimited API keys", "Advanced analytics", "Priority support", "Custom rate limits", "Webhooks"],
                popular: true
              },
              { 
                name: "Enterprise", 
                price: "Custom", 
                desc: "For large organizations",
                features: ["Unlimited requests", "SSO & SAML", "Dedicated support", "SLA guarantee", "Custom contracts", "On-premise option"],
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative overflow-hidden rounded-2xl p-8 ${
                  plan.popular 
                    ? 'bg-foreground text-background' 
                    : 'bg-gradient-to-br from-surface to-background border border-border/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-background/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                )}
                <div className="relative">
                  {plan.popular && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs uppercase tracking-widest bg-background/10 rounded-full mb-4">
                      <Sparkles className="w-3 h-3" />
                      Most popular
                    </span>
                  )}
                  <h3 className="font-serif text-xl mb-1">{plan.name}</h3>
                  <p className={`text-sm mb-6 ${plan.popular ? 'text-background/60' : 'text-text-secondary'}`}>
                    {plan.desc}
                  </p>
                  <div className="mb-8">
                    <span className="font-serif text-4xl tracking-tight">{plan.price}</span>
                    {plan.period && <span className={plan.popular ? 'text-background/60' : 'text-text-secondary'}>{plan.period}</span>}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className={`text-sm flex items-center gap-3 ${
                        plan.popular ? 'text-background/80' : 'text-text-secondary'
                      }`}>
                        <Check className="w-4 h-4 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={plan.popular ? "secondary" : "outline"}
                    className={`w-full ${plan.popular ? 'bg-background text-foreground hover:bg-background/90' : ''}`}
                  >
                    {plan.price === "Custom" ? "Contact sales" : "Get started"}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-b border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.02] to-transparent" />
        
        <div className="max-w-screen-2xl mx-auto px-6 py-24 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-4xl md:text-5xl tracking-tight leading-tight mb-6">
                Ready to protect your APIs?
              </h2>
              <p className="text-lg text-text-secondary leading-relaxed">
                Join thousands of developers who trust RateGuard to keep their APIs safe and their costs under control.
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col sm:flex-row gap-4 lg:justify-end"
            >
              <Link href="/signup">
                <Button size="lg" className="h-14 px-10 text-base gap-2">
                  Start for free
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base">
                  View demo
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 border-t border-border">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-12">
            {/* Left - Brand */}
            <div className="max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center">
                  <span className="text-background font-serif text-xl">R</span>
                </div>
                <span className="font-serif text-xl tracking-tight">RateGuard</span>
              </div>
              <p className="text-sm text-text-secondary mb-6">
                A modern API rate limiting and monitoring dashboard. Built with Next.js, TypeScript, and Zustand.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-4">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-text-tertiary hover:text-foreground hover:bg-hover transition-all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-text-tertiary hover:text-foreground hover:bg-hover transition-all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-text-tertiary hover:text-foreground hover:bg-hover transition-all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Right - Navigation */}
            <div className="flex gap-16">
              <div>
                <p className="text-xs uppercase tracking-widest text-text-tertiary mb-4">Navigation</p>
                <nav className="space-y-3">
                  <a href="#features" className="block text-sm text-text-secondary hover:text-accent transition-colors">Features</a>
                  <a href="#pricing" className="block text-sm text-text-secondary hover:text-accent transition-colors">Pricing</a>
                  <Link href="/dashboard" className="block text-sm text-text-secondary hover:text-accent transition-colors">Dashboard</Link>
                </nav>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-text-tertiary mb-4">Account</p>
                <nav className="space-y-3">
                  <Link href="/login" className="block text-sm text-text-secondary hover:text-accent transition-colors">Sign In</Link>
                  <Link href="/signup" className="block text-sm text-text-secondary hover:text-accent transition-colors">Sign Up</Link>
                </nav>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-tertiary">
              <p>© {new Date().getFullYear()} RateGuard. Built as a portfolio project.</p>
              <p>Made with Next.js, TypeScript & Tailwind CSS</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
