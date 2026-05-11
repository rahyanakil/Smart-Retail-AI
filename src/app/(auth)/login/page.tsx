'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Store, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import { ROLE_LABELS } from '@/lib/utils';
import type { User } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─── Demo accounts ────────────────────────────────────────────────────────────

const DEMO_ACCOUNTS = [
  {
    label: 'Admin',
    email: 'admin@smartretail.com',
    password: 'password123',
    description: 'Full system access',
    variant: 'default' as const,
  },
  {
    label: 'Owner',
    email: 'owner1@smartretail.com',
    password: 'password123',
    description: 'Store management',
    variant: 'info' as const,
  },
  {
    label: 'Cashier',
    email: 'cashier1@smartretail.com',
    password: 'password123',
    description: 'Point of sale',
    variant: 'secondary' as const,
  },
];

const SESSION_MESSAGES: Record<string, string> = {
  session_expired: 'Your session expired. Please sign in again.',
};

// ─── Component ────────────────────────────────────────────────────────────────

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, isAuthenticated } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const reason = searchParams.get('reason');
  const sessionMessage = reason ? SESSION_MESSAGES[reason] : null;

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      const response = await authApi.login(data.email, data.password);
      const { user, accessToken, refreshToken } = response.data.data as {
        user: User;
        accessToken: string;
        refreshToken: string;
      };
      setAuth(user, accessToken, refreshToken);
      toast({
        title: `Welcome back, ${user.name.split(' ')[0]}!`,
        description: `Signed in as ${ROLE_LABELS[user.role] ?? user.role}`,
      });
      router.push('/dashboard');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      if (status === 403) {
        setServerError(message ?? 'Your account has been deactivated. Contact your administrator.');
      } else if (status === 401) {
        setServerError('Invalid email or password.');
      } else if (status === 429) {
        setServerError('Too many login attempts. Please wait 15 minutes and try again.');
      } else {
        setServerError(message ?? 'Something went wrong. Please try again.');
      }
    }
  };

  const fillDemo = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: false });
    setValue('password', password, { shouldValidate: false });
    setServerError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Brand */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary shadow-lg shadow-primary/20 mb-2">
            <Store className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SmartRetail AI</h1>
          <p className="text-muted-foreground text-sm">Intelligent retail management</p>
        </div>

        {/* Session expiry */}
        {sessionMessage && (
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-3 py-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {sessionMessage}
          </div>
        )}

        {/* Login card */}
        <Card className="shadow-xl shadow-black/5 dark:shadow-black/20">
          <CardHeader className="pb-4">
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Server error */}
              {serverError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 text-sm text-destructive bg-destructive/8 dark:bg-destructive/15 border border-destructive/20 rounded-lg px-3 py-2.5"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {serverError}
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  autoFocus
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="email-error" className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pr-10"
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    aria-invalid={!!errors.password}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>

            </form>

            <div className="mt-5 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-primary font-medium hover:underline underline-offset-4"
              >
                Create one
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Demo accounts */}
        <Card className="shadow-md shadow-black/5 dark:shadow-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5 text-muted-foreground font-medium">
              <ShieldCheck className="h-4 w-4" />
              Demo Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemo(account.email, account.password)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-accent text-sm transition-colors text-left group"
              >
                <div className="flex items-center gap-2">
                  <Badge variant={account.variant} className="text-xs">
                    {account.label}
                  </Badge>
                  <span className="text-muted-foreground text-xs">{account.description}</span>
                </div>
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  click to fill ↑
                </span>
              </button>
            ))}
            <p className="text-xs text-center text-muted-foreground pt-1">
              Password:{' '}
              <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">password123</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
