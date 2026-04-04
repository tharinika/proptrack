import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { GradientButton } from '../GradientButton';
import { Building2, Lock, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  onForgotPassword: () => void;
  onSignUp: () => void;
}

export function LoginPage({ onForgotPassword, onSignUp }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate loading delay for better UX
    setTimeout(() => {
      const success = login(email, password);
      
      if (!success) {
        setError('Invalid credentials. Please use the demo accounts below or sign up as a new landlord.');
      }
      
      setIsLoading(false);
    }, 800);
  };

  // Quick login helpers
  const quickLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PropTrack
            </h1>
            <p className="text-muted-foreground mt-2">
              Sign in to your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-input-background border-border"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-input-background border-border"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" strokeWidth={1.5} />
                  ) : (
                    <Eye className="w-5 h-5" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <GradientButton
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </GradientButton>
          </form>

          {/* Sign Up Prompt */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Are you a new landlord?{' '}
              <button
                type="button"
                onClick={onSignUp}
                className="font-semibold text-primary hover:text-accent transition-colors underline decoration-primary/30 hover:decoration-accent/50"
              >
                Sign up
              </button>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3 font-medium">
              🎯 Demo Credentials (Click to Auto-Fill):
            </p>
            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => quickLogin('landlord@proptrack.com', 'admin123')}
                className="w-full bg-gradient-to-r from-emerald-500/10 to-lime-500/10 hover:from-emerald-500/20 hover:to-lime-500/20 border border-emerald-500/20 rounded-lg p-3 text-left transition-all"
              >
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Landlord (Admin) – Full Access
                </p>
                <p className="text-muted-foreground mt-1">landlord@proptrack.com / admin123</p>
              </button>
              <button
                type="button"
                onClick={() => quickLogin('tenant@proptrack.com', 'temp123')}
                className="w-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border border-blue-500/20 rounded-lg p-3 text-left transition-all"
              >
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Tenant (User) – Restricted Access
                </p>
                <p className="text-muted-foreground mt-1">tenant@proptrack.com / temp123</p>
                <p className="text-orange-600 mt-1 text-[10px] font-medium">⚠️ First login requires password reset</p>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}