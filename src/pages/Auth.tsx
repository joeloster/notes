import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Eye, EyeOff, Infinity, Layout, Move, ChevronDown, Trash2 } from 'lucide-react';
import { NoteColor } from '@/types/canvas';

/* ── Decorative sticky note ── */
interface DecoNoteProps {
  color: NoteColor;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  large?: boolean;
}

const DecoNote: React.FC<DecoNoteProps> = ({ color, className = '', style, children, large }) => {
  const colorMap: Record<NoteColor, string> = {
    yellow: 'bg-note-yellow',
    blue: 'bg-note-blue',
    green: 'bg-note-green',
    pink: 'bg-note-pink',
    purple: 'bg-note-purple',
  };

  return (
    <div
      className={`absolute rounded-xl shadow-md ${colorMap[color]} ${className}`}
      style={style}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <div
          className="w-4 h-4 rounded-full border border-foreground/10"
          style={{ background: `hsl(var(--note-${color}))` }}
        />
        <div className="p-1 text-foreground/30">
          <Trash2 size={large ? 14 : 12} />
        </div>
      </div>
      {/* Content */}
      <div className={`px-3 pb-3 ${large ? 'text-base' : 'text-sm'} text-foreground/80`}>
        {children}
      </div>
    </div>
  );
};

/* ── Grid background style ── */
const gridStyle: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(hsl(var(--canvas-grid) / 0.5) 1px, transparent 1px),
    linear-gradient(90deg, hsl(var(--canvas-grid) / 0.5) 1px, transparent 1px),
    linear-gradient(hsl(var(--canvas-grid-major) / 0.3) 1px, transparent 1px),
    linear-gradient(90deg, hsl(var(--canvas-grid-major) / 0.3) 1px, transparent 1px)
  `,
  backgroundSize: '20px 20px, 20px 20px, 100px 100px, 100px 100px',
};

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
        toast.success('Account created! Check your email to verify, then sign in.');
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
    <div className="overflow-y-auto">
      {/* ═══════ HERO SECTION ═══════ */}
      <section
        className="relative min-h-screen bg-canvas-bg flex items-center justify-center overflow-hidden"
        style={gridStyle}
      >
        {/* Vignette overlay: fades grid into white at all edges */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            background: `
              radial-gradient(ellipse 90% 80% at 50% 50%, transparent 55%, hsl(var(--background)) 100%)
            `,
          }}
        />
        {/* ── Decorative notes (sm+) ── */}

        {/* Top-left: yellow */}
        <DecoNote
          color="yellow"
          className="hidden sm:block"
          style={{ top: '8%', left: '5%', width: 180, height: 140, transform: 'rotate(-3deg)' }}
        >
          <p className="font-semibold mb-1">Todo</p>
          <ul className="text-xs space-y-0.5 text-foreground/60">
            <li>✓ Buy groceries</li>
            <li>✓ Call dentist</li>
            <li>○ Finish report</li>
          </ul>
        </DecoNote>

        {/* Top-right: pink */}
        <DecoNote
          color="pink"
          className="hidden sm:block"
          style={{ top: '12%', right: '6%', width: 170, height: 120, transform: 'rotate(2deg)' }}
        >
          <p className="font-semibold mb-1">Ideas 💡</p>
          <p className="text-xs text-foreground/60">New app concept for habit tracking</p>
        </DecoNote>

        {/* Bottom-left: green */}
        <DecoNote
          color="green"
          className="hidden md:block"
          style={{ bottom: '18%', left: '8%', width: 160, height: 110, transform: 'rotate(1.5deg)' }}
        >
          <p className="font-semibold mb-1">School</p>
          <p className="text-xs text-foreground/60">Math exam — Friday</p>
        </DecoNote>

        {/* Bottom-right: purple */}
        <DecoNote
          color="purple"
          className="hidden md:block"
          style={{ bottom: '15%', right: '7%', width: 175, height: 130, transform: 'rotate(-2deg)' }}
        >
          <p className="font-semibold mb-1">Work</p>
          <ul className="text-xs space-y-0.5 text-foreground/60">
            <li>○ Design review</li>
            <li>○ Sprint planning</li>
          </ul>
        </DecoNote>

        {/* Mid-left small: yellow */}
        <DecoNote
          color="yellow"
          className="hidden lg:block"
          style={{ top: '55%', left: '3%', width: 140, height: 90, transform: 'rotate(-1deg)' }}
        >
          <p className="text-xs text-foreground/60">Remember: water the plants 🌱</p>
        </DecoNote>

        {/* Mid-right small: green */}
        <DecoNote
          color="green"
          className="hidden lg:block"
          style={{ top: '40%', right: '3%', width: 150, height: 100, transform: 'rotate(3deg)' }}
        >
          <p className="font-semibold mb-1">Goals</p>
          <p className="text-xs text-foreground/60">Read 2 books this month 📚</p>
        </DecoNote>

        {/* ── Mobile-only decorative notes ── */}

        {/* Top-left: small yellow, slightly overlapping */}
        <DecoNote
          color="yellow"
          className="sm:hidden"
          style={{ top: '6%', left: '4%', width: 120, height: 80, transform: 'rotate(-5deg)' }}
        >
          <p className="text-[10px] text-foreground/60">Buy milk 🥛</p>
        </DecoNote>

        {/* Top-right: pink, tilted */}
        <DecoNote
          color="pink"
          className="sm:hidden"
          style={{ top: '4%', right: '8%', width: 110, height: 70, transform: 'rotate(4deg)' }}
        >
          <p className="text-[10px] text-foreground/60">Ideas 💡</p>
        </DecoNote>

        {/* Bottom-left: empty yellow */}
        <DecoNote
          color="yellow"
          className="sm:hidden"
          style={{ bottom: '14%', left: '6%', width: 100, height: 65, transform: 'rotate(3deg)' }}
        />

        {/* Bottom-right: blue with text */}
        <DecoNote
          color="green"
          className="sm:hidden"
          style={{ bottom: '10%', right: '5%', width: 115, height: 75, transform: 'rotate(-2deg)' }}
        >
          <p className="text-[10px] text-foreground/60">Meeting @ 3pm 📅</p>
        </DecoNote>



        {/* ── Center hero note (blue, largest) ── */}
        <DecoNote
          color="blue"
          large
          className="relative z-10 w-[90vw] max-w-[500px]"
          style={{ position: 'relative', minHeight: 280 }}
        >
          <div className="space-y-5 pt-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight">
              infinite<span className="text-primary">Notes</span>
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              Your ideas, spatially organized on an infinite canvas.
            </p>
            <div className="space-y-3 pt-1">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-foreground/70 text-sm">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        </DecoNote>

        {/* Scroll indicator */}
        <button
          type="button"
          onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-6 inset-x-0 mx-auto w-fit flex flex-col items-center gap-1 text-muted-foreground/60 animate-bounce hover:text-muted-foreground transition-colors"
        >
          <span className="text-xs">Sign in</span>
          <ChevronDown size={20} />
        </button>
      </section>

      {/* ═══════ AUTH SECTION ═══════ */}
      <section id="auth-section" className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground">
              {isSignUp ? 'Create your account' : 'Welcome back'}
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
      </section>
    </div>
  );
};

export default Auth;
