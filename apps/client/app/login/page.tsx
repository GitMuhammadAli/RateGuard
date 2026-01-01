"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Github, Eye, EyeOff, Check, Shield, Zap, BarChart3, Code2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuthStore } from "@/store";

export default function Login() {
  const router = useRouter();
  const { login, isLoading: authLoading, error, clearError, isAuthenticated, forgotPassword } = useAuthStore();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Show error toast when error changes
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast.error("Please enter your email address");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.password) {
      toast.error("Please enter your password");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    const success = await login(formData.email, formData.password, rememberMe);
    
    setIsLoading(false);
    
    if (success) {
      toast.success("Welcome back! Redirecting to dashboard...");
      router.push("/dashboard");
    }
  };

  const handleSocialLogin = (provider: string) => {
    toast.info(`${provider} OAuth coming soon...`);
  };

  const handleForgotPassword = async () => {
    if (formData.email) {
      const success = await forgotPassword(formData.email);
      if (success) {
        toast.success(`Password reset link sent to ${formData.email}`);
      }
    } else {
      toast.info("Enter your email first, then click forgot password");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="max-w-screen-xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center shadow-lg shadow-foreground/10"
              >
                <span className="text-background font-serif text-lg">R</span>
              </motion.div>
              <span className="font-serif text-xl tracking-tight">RateGuard</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              New here?{" "}
              <Link href="/signup" className="text-foreground font-medium hover:text-accent transition-colors underline-offset-4 hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </header>

      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-5">
        {/* Left Panel - Form */}
        <div className="lg:col-span-3 flex items-center justify-center px-6 py-24 lg:py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div className="mb-10">
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm uppercase tracking-widest text-accent mb-3 font-medium"
              >
                Welcome back
              </motion.p>
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-serif text-3xl md:text-4xl tracking-tight mb-3"
              >
                Sign in to your account
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground text-lg"
              >
                Access your dashboard and explore the demo.
              </motion.p>
            </div>

            {/* Social Login */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-3 mb-8"
            >
              <Button 
                variant="outline" 
                className="h-12 gap-2 hover:bg-secondary/80 hover:border-foreground/20 transition-all"
                onClick={() => handleSocialLogin("GitHub")}
              >
                <Github className="w-5 h-5" />
                GitHub
              </Button>
              <Button 
                variant="outline" 
                className="h-12 gap-2 hover:bg-secondary/80 hover:border-foreground/20 transition-all"
                onClick={() => handleSocialLogin("Google")}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="relative mb-8"
            >
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground tracking-wider">or continue with email</span>
              </div>
            </motion.div>

            {/* Form */}
            <motion.form 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              onSubmit={handleSubmit} 
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-12 text-base transition-all focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm text-muted-foreground hover:text-accent transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="h-12 text-base pr-12 transition-all focus:ring-2 focus:ring-accent/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-3 pt-1">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
                />
                <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                  Keep me signed in
                </Label>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base mt-4 gap-2 shadow-lg shadow-foreground/10 hover:shadow-xl hover:shadow-foreground/15 transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full"
                    />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </motion.form>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-10 pt-8 border-t border-border"
            >
              <div className="flex items-center justify-center gap-8 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  <span>Secure auth</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  <span>JWT tokens</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Right Panel - Visual */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex lg:col-span-2 bg-accent/5 relative overflow-hidden flex-col justify-center px-10 py-24"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 left-10 w-56 h-56 bg-accent/5 rounded-full blur-2xl" />
          </div>
          
          {/* Floating decorative elements */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-32 right-16 w-14 h-14 rounded-2xl bg-background border border-border shadow-lg flex items-center justify-center"
          >
            <Shield className="w-6 h-6 text-accent" />
          </motion.div>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-40 right-24 w-11 h-11 rounded-xl bg-background border border-border shadow-lg flex items-center justify-center"
          >
            <Zap className="w-5 h-5 text-accent" />
          </motion.div>
          
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-sm uppercase tracking-widest text-accent mb-4 font-medium">What&apos;s inside</p>
              <h2 className="font-serif text-2xl xl:text-3xl tracking-tight leading-snug mb-10">
                Explore the full dashboard experience
              </h2>
            </motion.div>

            {/* Features */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-6"
            >
              {[
                { icon: BarChart3, title: "Analytics dashboard", desc: "Charts, stats, and real-time visualizations" },
                { icon: Layers, title: "API management", desc: "Keys, rate limits, and configurations" },
                { icon: Code2, title: "Modern stack", desc: "Next.js 15, TypeScript, Tailwind CSS" }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="flex items-start gap-4 pb-6 border-b border-border last:border-0 last:pb-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-background border border-border shadow-sm flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Note */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-10 pt-8 border-t border-border"
            >
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Portfolio project</span> — built to demonstrate frontend skills with modern React patterns.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
