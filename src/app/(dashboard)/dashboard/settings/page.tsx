'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Shield, Bell, Monitor, Sun, Moon,
  Eye, EyeOff, Loader2, CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { authApi } from '@/lib/api';
import { getInitials, ROLE_LABELS, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/components/theme-provider';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import type { User as UserType } from '@/types';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Must contain at least one letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user: storeUser, setUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const { data: profile } = useQuery<UserType>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authApi.me();
      return res.data.data;
    },
  });

  const user = profile ?? storeUser;

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? '' },
  });

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) => authApi.updateMe({ name: data.name }),
    onSuccess: (res) => {
      const updated = res.data.data as UserType;
      setUser(updated);
      queryClient.setQueryData(['me'], updated);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
      toast({ title: 'Profile updated', description: 'Your name has been saved.' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Update failed', description: msg ?? 'Something went wrong.', variant: 'destructive' });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      authApi.updateMe({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
    onSuccess: () => {
      passwordForm.reset();
      toast({ title: 'Password changed', description: 'Your password has been updated.' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Password change failed', description: msg ?? 'Something went wrong.', variant: 'destructive' });
    },
  });

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  return (
    <div className="space-y-5 sm:space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Profile
          </CardTitle>
          <CardDescription>Update your display name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                {user ? getInitials(user.name) : '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="secondary" className="text-xs">
                  {user ? ROLE_LABELS[user.role] : ''}
                </Badge>
                {user?.isActive && (
                  <Badge variant="success" className="text-xs">Active</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <form onSubmit={profileForm.handleSubmit((d) => profileMutation.mutate(d))} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  {...profileForm.register('name')}
                />
                {profileForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Email Address</Label>
                <Input value={user?.email ?? ''} disabled className="bg-muted/40" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </div>
            {user?.store && (
              <div className="space-y-1.5">
                <Label>Store</Label>
                <Input
                  value={`${user.store.name}${user.store.address ? ` — ${user.store.address}` : ''}`}
                  disabled
                  className="bg-muted/40"
                />
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                size="sm"
                disabled={profileMutation.isPending || !profileForm.formState.isDirty}
              >
                {profileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </>
                ) : profileSaved ? (
                  <>
                    <CheckCircle className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                    Saved
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
              {profileForm.formState.isDirty && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => profileForm.reset()}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <p className="text-xs text-muted-foreground">
            Account created: {user ? formatDate(user.createdAt) : '—'}
          </p>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="h-4 w-4" />
            Appearance
          </CardTitle>
          <CardDescription>Choose your preferred color theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all text-sm font-medium',
                  theme === value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Security
          </CardTitle>
          <CardDescription>Change your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Your current password"
                  className="pr-10"
                  {...passwordForm.register('currentPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  placeholder="Min. 8 characters, letter + number"
                  className="pr-10"
                  {...passwordForm.register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat new password"
                {...passwordForm.register('confirmPassword')}
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={passwordMutation.isPending}
            >
              {passwordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Changing…
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
          <CardDescription>Configure your notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-0 divide-y">
            {[
              { label: 'Low stock alerts', desc: 'Get notified when products are running low' },
              { label: 'Daily sales summary', desc: 'Receive a daily email with sales data' },
              { label: 'New user registrations', desc: 'Admin alerts for new accounts' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3 gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                </div>
                <Badge variant="secondary" className="text-xs shrink-0">
                  Coming Soon
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
