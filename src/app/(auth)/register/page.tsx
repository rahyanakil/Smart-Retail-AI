'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, Loader2, AlertCircle, Check, X, Chrome } from 'lucide-react';
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
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/lib/api';
import { toast } from '@/components/ui/use-toast';
import type { User } from '@/types';

// ─── Schema ───────────────────────────────────────────────────────────────────
// Mirrors the backend validation rules exactly.

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name is too long')
      .trim(),
    email: z.string().email('Enter a valid email address').toLowerCase().trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long')
      .regex(/[A-Za-z]/, 'Must contain at least one letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

// ─── Password strength indicator ──────────────────────────────────────────────

interface PasswordRule {
  label: string;
  test: (p: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains a letter', test: (p) => /[A-Za-z]/.test(p) },
  { label: 'Contains a number', test: (p) => /[0-9]/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  return (
    <ul className="mt-2 space-y-1">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <li key={rule.label} className="flex items-center gap-1.5 text-xs">
            {passed ? (
              <Check className="h-3 w-3 text-green-600 shrink-0" />
            ) : (
              <X className="h-3 w-3 text-muted-foreground shrink-0" />
            )}
            <span className={passed ? 'text-green-700' : 'text-muted-foreground'}>
              {rule.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);

    try {
      const response = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      const { user, accessToken, refreshToken } = response.data.data as {
        user: User;
        accessToken: string;
        refreshToken: string;
      };

      setAuth(user, accessToken, refreshToken);

      toast({
        title: 'Account created!',
        description: `Welcome to SmartRetail AI, ${user.name.split(' ')[0]}!`,
      });

      router.push('/dashboard');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;

      if (status === 409) {
        setServerError('An account with this email already exists. Try signing in instead.');
      } else if (status === 429) {
        setServerError('Too many registration attempts. Please wait a moment and try again.');
      } else {
        setServerError(message ?? 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-4">
      <div className="w-full max-w-md space-y-5">

        {/* Brand header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary shadow-md mb-3">
            <Store className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SmartRetail AI</h1>
          <p className="text-muted-foreground text-sm">Create your account to get started</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Create account</CardTitle>
            <CardDescription>
              New accounts are assigned the Cashier role. An admin can upgrade your access.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>

              {/* Server-level error */}
              {serverError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {serverError}
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="Jane Doe"
                  autoComplete="name"
                  autoFocus
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
                <PasswordStrength password={passwordValue} />
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() =>
                  toast({
                    title: 'Google Sign-Up',
                    description: 'Google OAuth is configured for production. Use the form above to register.',
                  })
                }
              >
                <Chrome className="h-4 w-4" />
                Sign up with Google
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
