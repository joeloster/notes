import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Eye, EyeOff, Infinity, Sparkles, Layout, Move } from 'lucide-react';

const Auth: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success('Account created! You can now sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Infinity, text: 'Infinite canvas — no limits on space' },
    { icon: Move, text: 'Drag, resize, and arrange notes freely' },
    { icon: Layout, text: 'Spatial organization for visual thinkers' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col justify-center px-8 py-12 lg:px-16 xl:px-24">
        <div className="max-w-lg mx-auto lg:mx-0 space-y-8">
          {/* Brand */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight">
              infinity<span className="text-primary">Notes</span>
            </h1>
          </div>

          {/* Features */}
          <div className="space-y-4 pt-2">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-muted-foreground">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auth Section */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 lg:bg-muted/30">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-foreground">
              {isSignUp ? 'Create your account' : 'Welcome'}
          </h2>
            <p className="text-sm text-muted-foreground">
              {isSignUp
                ? 'Start organizing your ideas on an infinite canvas.'
                : 'Sign in to access your board.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
